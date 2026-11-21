"""Embed a frozen, attributed Ministry inventory. No network call.
Reproject with PYTHONPATH=quality/toll-guide/python python3 tools/build-toll-gates.py --reproject
(pyproj 3.7.2); ordinary build/check use the hash-bound converted snapshot.
"""
import argparse,csv,hashlib,json,math,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
DATA=ROOT/'data/toll-gates/2025'
START='// BEGIN GENERATED TOLL GATES\n'
END='// END GENERATED TOLL GATES\n'
RAW_SHA='e70ebf3d57c550eb8e0b9583aba697273b6089d72bdfd2515a595248e18937ec'
SOURCE='https://www.data.gouv.fr/datasets/gares-de-peage-du-reseau-routier-national-concede'
RESOURCE='https://static.data.gouv.fr/resources/gares-de-peage-du-reseau-routier-national-concede/20250728-140859/gares-peage-2025.csv'
LICENSE='https://opendatacommons.org/licenses/by/1-0/'
def sha(b):return hashlib.sha256(b).hexdigest()
def raw_rows():
 raw=(DATA/'gares-peage-2025.csv').read_bytes();assert sha(raw)==RAW_SHA
 rows=list(csv.DictReader(raw.decode('utf-8-sig').splitlines(),delimiter=';'))
 assert len(rows)==1266 and all(r['dateReferentiel']=='01/01/2025' for r in rows)
 return rows
def convert():
 import pyproj
 assert pyproj.__version__=='3.7.2'
 pyproj.network.set_network_enabled(False)
 f=pyproj.Transformer.from_crs(2154,4326,always_xy=True,allow_ballpark=False)
 back=pyproj.Transformer.from_crs(4326,2154,always_xy=True,allow_ballpark=False)
 records=[];error=0
 for i,r in enumerate(raw_rows(),2):
  x,y=[float(r[k].replace(',','.')) for k in ['x','y']]
  lon,lat=f.transform(x,y,errcheck=True);lon,lat=round(lon,6),round(lat,6)
  assert -6<lon<10 and 41<lat<52,(i,lon,lat)
  xx,yy=back.transform(lon,lat,errcheck=True);error=max(error,math.hypot(xx-x,yy-y))
  records.append({'line':i,'name':r['nomGare'],'road':r['route'],'side':r['cote'],'type':r['typeGare_lib'],'lon':lon,'lat':lat})
 assert error<.1
 payload=json.dumps(records,ensure_ascii=False,indent=2)+'\n';(DATA/'positions-wgs84.json').write_text(payload)
 manifest={'schemaVersion':1,'producer':'Ministère de la Transition écologique','source':SOURCE,'resource':RESOURCE,'resourceId':'1fe9691f-dfd6-4ffb-89f2-5fbf42d47530','referenceDate':'2025-01-01','resourceModified':'2025-07-28','retrievedAt':'2026-11-18','license':'ODC-By 1.0','licenseUrl':LICENSE,'rawSha256':RAW_SHA,'convertedSha256':sha(payload.encode()),'recordCount':len(records),'conversion':{'library':'pyproj 3.7.2','proj':pyproj.proj_version_str,'sourceCrs':'EPSG:2154','targetCrs':'EPSG:4326','alwaysXY':True,'networkEnabled':False,'maximumRoundTripErrorMeters':error},'limitations':['Inventaire daté, sans confirmation terrain actuelle.','Aucun identifiant tarifaire, exploitant ou sens de parcours déduit du code routier.','Les gares proches du tracé restent des candidates ; aucune gratuité ni passage déduit.']}
 (DATA/'provenance.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
def distance(a,b):
 lat=math.radians((a['lat']+b['lat'])/2)
 return 111320*math.hypot(a['lat']-b['lat'],(a['lon']-b['lon'])*math.cos(lat))
def generate():
 raw=raw_rows();manifest=json.loads((DATA/'provenance.json').read_text());blob=(DATA/'positions-wgs84.json').read_bytes()
 assert sha(blob)==manifest['convertedSha256'] and manifest['rawSha256']==RAW_SHA
 points=json.loads(blob);assert len(points)==len(raw)
 clusters={}
 for i,p in enumerate(points):
  r=raw[i];assert p['line']==i+2
  assert all(p[k]==r[v] for k,v in [('name','nomGare'),('road','route'),('side','cote'),('type','typeGare_lib')])
  assert -6<p['lon']<10 and 41<p['lat']<52
  key=(p['name'],p['road'],p['type']);groups=clusters.setdefault(key,[])
  group=next((g for g in groups if all(distance(p,q)<=300 for q in g)),None)
  if group is None:group=[];groups.append(group)
  group.append(p)
 gates=[]
 for groups in clusters.values():
  for group in groups:
   p=group[0];gates.append({'id':'mte2025-'+str(p['line']),'name':p['name'],'road':p['road'],'type':p['type'],'positions':[[q['lat'],q['lon'],q['side'],q['line']] for q in group]})
 data={'schemaVersion':1,'referenceDate':'2025-01-01','source':SOURCE,'license':LICENSE,'recordCount':len(points),'gates':gates}
 return START+'window.DRAGONROUTE_TOLL_GATES = '+json.dumps(data,ensure_ascii=False,separators=(',',':'))+';\n'+END,len(gates)
if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--reproject',action='store_true');parser.add_argument('--check',action='store_true');args=parser.parse_args()
 if args.reproject:convert()
 block,count=generate();p=ROOT/'DragonRoute/config.js';old=p.read_text()
 if START in old:
  before,rest=old.split(START,1);_,after=rest.split(END,1);expected=before+block+after
 else:expected=old.replace('// BEGIN GENERATED TARIFF TABLES\n',block+'// BEGIN GENERATED TARIFF TABLES\n',1)
 if args.check:assert old==expected,'Embedded geographic inventory differs from frozen sources'
 else:assert p.read_text()==old;p.write_text(expected)
 print(f'{count} geographic groups, 1266 source positions; sources and embedded snapshot verified')
