(()=>{"use strict";
const C=window.DRAGONROUTE_CONFIG;
const $=id=>document.getElementById(id);
// BEGIN SOURCES DATA MODEL
const SOURCE_REFS={
 osm:['OpenStreetMap · licence','https://www.openstreetmap.org/copyright'],
 tiles:['Service de cartes OSM','https://operations.osmfoundation.org/policies/tiles/'],
 geo:['Géocodage IGN','https://cartes.gouv.fr/aide/fr/guides-utilisateur/utiliser-les-services-de-la-geoplateforme/geocodage/'],
 ign:['Itinéraires IGN','https://cartes.gouv.fr/aide/fr/guides-utilisateur/utiliser-les-services-de-la-geoplateforme/calcul-itineraire/'],
 osrm:['Projet OSRM','https://project-osrm.org/'],
 cycle:['FOSSGIS · usage et vie privée','https://routing.openstreetmap.de/about.html'],
 fuel:['Données DGCCRF','https://data.economie.gouv.fr/explore/dataset/prix-des-carburants-en-france-flux-instantane-v2/information/'],
 transit:['Mobilités M · données','https://data.mobilites-m.fr/donnees'],
 bikes:['Vélo’v · fiche nationale','https://transport.data.gouv.fr/datasets/stations-velov-de-la-metropole-de-lyon-disponibilites-temps-reel'],
 bikeLicense:['Licence liée par le flux Vélo’v','https://developer.jcdecaux.com/files/Open-Licence-fr.pdf'],
 github:['GitHub Pages · données de visite','https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages'],
 leaflet:['Leaflet','https://leafletjs.com/'],
 cdn:['jsDelivr · vie privée','https://www.jsdelivr.com/terms/privacy-policy'],
 tariffs:['Tarifs APRR / AREA','https://voyage.aprr.fr/tarifs-de-peage'],
 gates:['Inventaire des gares','https://www.data.gouv.fr/datasets/gares-de-peage-du-reseau-routier-national-concede'],
 carbon:['Modèles Impact CO₂','https://impactco2.fr/'],
};
function sourcesInventory(config={},context={}){
 const c=config&&typeof config==='object'?config:{},known=(actual,expected)=>actual===expected?'configured':'unreviewed';
 const rows=[],add=(id,title,group,status,when,send,purpose,license,limit,refs=[],account='Aucun compte visiteur demandé dans l’application.')=>rows.push({id,title,group,status,when,send,purpose,license,limit,refs:refs.map(k=>SOURCE_REFS[k]),account});
 add('hosting','Chargement du site','startup',context.github?'configured':'unreviewed','Ouverture, rechargement et récupération des fichiers de l’application.','Adresse IP et informations de connexion ; fichiers et adresse de page demandés.','Fournir l’interface.','Hébergement : conditions GitHub, distinctes des licences des données.',context.github?'GitHub Pages indique conserver l’adresse IP pour la sécurité. Les fiches personnelles ne sont pas envoyées par les commandes de sauvegarde.':'Hébergement local ou autre domaine : destinataire et règles de conservation non qualifiés par cette fiche.',['github']);
 const leaf=known(c.leafletJs,'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js')==='configured'&&known(c.leafletCss,'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css')==='configured'?'configured':'unreviewed';
 add('library','Bibliothèque de carte · Leaflet / jsDelivr','startup',leaf,'Chargement automatique au démarrage.','Fichiers de la bibliothèque demandés, IP et informations de connexion ; référent selon le navigateur.','Dessiner et manipuler les cartes.','Logiciel Leaflet ; conditions du distributeur jsDelivr distinctes.','Aucun lieu saisi n’est ajouté à ces demandes de fichiers par l’application. Une configuration différente exige sa propre vérification.',['leaflet','cdn']);
 add('tiles','Fonds de carte · OpenStreetMap','startup',known(c.tileUrl,'https://tile.openstreetmap.org/{z}/{x}/{y}.png'),'Carte initiale puis déplacement, zoom ou affichage d’un résultat. Carte Vélo’v : fournisseur OSM fixe.','Numéros des tuiles, correspondant à la zone et au zoom affichés ; IP et référent.','Afficher le fond cartographique.','Données OpenStreetMap : ODbL. Conditions du service de tuiles distinctes.','Une zone affichée peut révéler une localisation. La carte ne certifie pas l’accès au terrain. Le panneau Vélo’v utilise aussi OSM, même si le fond principal est personnalisé.',['osm','tiles']);
 add('geocode','Recherche de lieux · IGN','request',known(c.geocodingApi,'https://data.geopf.fr/geocodage/search'),'Validation d’un trajet, recherche explicite d’une adresse ou d’une rencontre ; pas à chaque frappe.','Texte du lieu recherché ; index adresses/lieux, limite de résultats. Un lieu déjà résolu peut être réutilisé en mémoire.','Trouver les coordonnées à partir des lieux saisis.','BAN et lieux BD TOPO ; licences des jeux et conditions IGN.','France ; une réponse ou un libellé ne garantit pas une adresse exacte. Le carnet d’adresses entier n’est pas transmis.',['geo']);
 add('osrm','Route standard et accès aux stations · OSRM','request',known(c.osrm,'https://router.project-osrm.org'),'Calcul routier standard, alternatives, rencontres, comparaison choisie et accès routiers aux stations.','Coordonnées de départ, arrivée, arrêts, rencontres et candidates comparées ; options de géométrie et distances/durées.','Calculer des routes et des matrices de distances.','Données OpenStreetMap : ODbL ; moteur OSRM sous BSD.','Profil automobile sans exclusions dans ce raccordement. L’heure prévue et les prix carburant ne sont pas ajoutés à ces requêtes.',['osrm','osm']);
 add('ign','Route contrainte et marche · IGN','request',c.ignRouting===true?'configured':'disabled','Calcul au plus court, voiture sans autoroute, marche ou comparaison explicitement demandée.','Coordonnées des extrémités et étapes, profil voiture/piéton, durée ou distance, exclusion d’autoroute si choisie.','Calculer une géométrie à partir du réseau BD TOPO.','BD TOPO : Licence Ouverte 2.0 ; conditions du service IGN.','Pas de trafic direct ni de qualification caravane/poids lourd. Un cache daté en mémoire peut éviter de répéter un appel.',['ign']);
 add('routing-relay','Routage avancé · relais OpenRouteService','request',context.routing?'unreviewed':c.routingApi?'unreviewed':'disabled','Si configuré : calcul et détours avec les options acceptées.','Coordonnées, exclusions, type et gabarit du véhicule, demande d’alternatives ; relais puis fournisseur prévu OpenRouteService.','Prévoir le calcul avancé via un service intermédiaire.','Conditions du relais et du fournisseur à qualifier.','Désactivé dans l’aperçu courant. Une adresse de service configurée ne prouve ni sa disponibilité, ni ses conditions, ni l’adéquation au terrain.',[],'Aucune clé demandée aux visiteurs ; accès et compte côté opérateur à qualifier.');
 add('fuel','Prix et fiches des stations · DGCCRF','request',known(c.fuelApi,'https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/prix-des-carburants-en-france-flux-instantane-v2/records'),'Recherche volontaire des stations ou consultation d’une fiche à actualiser.','Points échantillonnés sur le trajet ou sa portion, rayon, carburant, champs demandés et plafond de résultats.','Recevoir prix datés, adresses, horaires déclarés et services.','Licence Ouverte 2.0 (métadonnées DGCCRF).','La zone de recherche peut révéler une partie du trajet. Les litres à acheter et le journal ne sont pas transmis. Couverture et actualité restent partielles.',['fuel']);
 add('tolls-relay','Péages en ligne · relais TollGuru','request',context.tolls?'unreviewed':c.tollsApi?'unreviewed':'disabled','Si activé volontairement et configuré : devis puis actualisation lors d’un changement pertinent du trajet ou des paramètres.','Géométrie complète, distance, gabarit, paiement choisi, date de départ et identifiant de demande ; relais puis fournisseur prévu TollGuru.','Prévoir une estimation tarifaire en ligne.','Licence, couverture et conditions du relais/fournisseur à qualifier.','Désactivé dans l’aperçu courant ; aucun tarif national n’est déduit de cette fiche.',[],'Aucune clé demandée aux visiteurs ; accès et compte côté opérateur à qualifier.');
 add('transit','Transports collectifs · Mobilités M','request','configured','Recherche collective ; consultation séparée des passages et perturbations sur demande.','Départ/arrivée, date et heure, sens départ/arrivée, plafond de marche. Pour le suivi : identifiants de lignes et d’arrêts.','Préparer des horaires théoriques et consulter des annonces datées.','Données annoncées sous ODbL par Mobilités M.','Pilote Grenoble ; pas de billet, réservation, accessibilité ou couverture nationale garantis. Les limites locales de correspondances ne sont pas envoyées au moteur.',['transit']);
 add('cycle','Trajets à vélo · FOSSGIS','request',c.cyclingApi?known(c.cyclingApi,'https://routing.openstreetmap.de/routed-bike/route/v1/driving/'):'disabled','Calcul vélo explicite, comparaison demandée ou portion vélo d’une chaîne partagée.','Deux coordonnées, demande de géométrie et d’étapes. Référent limité à l’origine ; pas de cookies par cet appel.','Calculer un parcours pour vélo classique.','Données OpenStreetMap : ODbL. Conditions FOSSGIS.','Le fournisseur annonce un journal des demandes. Essai gratuit à charge modérée ; commercialisation non qualifiée. Noms, profil, prix et limites personnelles non envoyés.',['cycle','osm']);
 add('bikes','Vélos partagés · Métropole de Lyon / JCDecaux','request','configured','Action Charger / actualiser dans Vélo’v ; trois fichiers du réseau, avec cache mémoire daté.','Noms fixes des fichiers catalogue, disponibilités et types ; aucune recherche personnelle ajoutée.','Consulter les stations et annonces du réseau lyonnais.','Fiche nationale : Licence Ouverte 2.0 ; flux : renvoi Licence Ouverte 1.0. Écart conservé.','Le tri par nom reste local. Calculer l’accès et le départ d’une station transmet ensuite les points concernés à IGN et FOSSGIS. Pas de location ni réservation.',['bikes','bikeLicense']);
 add('local-models','Péages de grilles et empreinte · calculs locaux','local','local','Consultation des grilles, confirmation des tronçons, budget, partage ou estimation d’empreinte.','Aucune requête métier : catalogues et facteurs sont inclus avec l’application. Les fichiers sont reçus au chargement.','Calculer à partir de données datées et des hypothèses saisies.','Licences propres aux catalogues : APRR/AREA, BPNL, inventaire des gares et modèles Impact CO₂. Sources détaillées dans les fonctions concernées.','Classe, passage et couverture restent déclaratifs. Le prix ou le facteur inconnu ne vaut pas zéro. Aucune donnée de profil envoyée par ces calculs locaux.',['tariffs','gates','carbon']);
 add('gps','Ma position · navigateur et appareil','request',context.geolocation?'conditional':'disabled','Appui sur la commande de position, puis autorisation du navigateur si nécessaire.','Position reçue du système. Services de localisation et leurs échanges dépendent du navigateur/appareil.','Proposer un point de départ daté avant adoption.','Règles du navigateur et de l’appareil ; non qualifiées ici.','Aucun suivi permanent demandé par l’application. Après adoption, le calcul et la carte peuvent transmettre ce point ou sa zone aux services correspondants.',[],'Permission de localisation ; aucun compte applicatif.');
 add('external','Navigation, sources et fichiers partagés','request','conditional','Ouverture explicite d’un lien Google Maps/Waze ou d’une source ; export puis partage volontaire d’un fichier.','Google Maps : extrémités, étapes, mode et évitements proposés. Waze : point visé et options proposées. Le navigateur peut transmettre son référent.','Passer vers un service externe ou emporter un fichier local.','Conditions du destinataire ; un export conserve ses attributions.','Les services externes recalculent selon leurs règles. Un export peut contenir adresses, coordonnées et historique : vérifier son contenu avant partage.',[],'Compte, cookies et autorisations éventuels gérés par le destinataire.');
 for(const r of rows)if(r.status==='unreviewed'){r.account='Compte, licence et conservation non qualifiés pour la destination configurée.';r.license='Non qualifiée pour cette configuration.';r.limit='Configuration différente ou relais à vérifier. Les références décrivent le raccordement prévu, pas une qualification de ce destinataire. '+(r.id==='tiles'?'Le fond Vélo’v reste OpenStreetMap. ':'')+r.limit.replace(/Désactivé dans l’aperçu courant\s*[.;] /,'')}
 return rows;
}
function sourcesFilter(rows,filter){if(!['all','startup','request','local','review'].includes(filter))return [];return rows.filter(r=>filter==='all'||(filter==='review'?['disabled','unreviewed'].includes(r.status):r.group===filter))}
function sourceLocalInventory(read,scope){
 return [['profile','Profil : véhicules, adresses et favoris','profile',[3,2,1]],['road','Préparations route et marche','prepared',[11,10,9,8,7,6,5,4,3,2,1]],['transit','Préparations collectives','transit-prepared',[2,1]],['cycle','Préparations vélo','cycling-prepared',[2,1]],['shared','Préparations vélo partagé','shared-bike-prepared',[2,1]],['journal','Journal des déplacements déclarés','journal',[3,2,1]]].map(([id,label,prefix,versions])=>{
  try{const copies=versions.filter(v=>read('dragonroute.'+prefix+'.v'+v+'.'+scope)!==null).length;return {id,label,copies,state:copies?'present':'absent'}}catch{return {id,label,copies:null,state:'unavailable'}}
 });
}
// END SOURCES DATA MODEL


function renderSources(){
 const rows=sourcesInventory(C,{github:location.hostname.endsWith('.github.io'),routing:Boolean(routingEndpoint()),tolls:Boolean(tollEndpoint()),geolocation:Boolean(navigator.geolocation)}),shown=sourcesFilter(rows,$('sourcesFilter').value);
 const states={configured:'Configuré · selon l’action',disabled:'Désactivé',unreviewed:'Configuration à vérifier',local:'Calcul local',conditional:'Action volontaire'},h=escapeHtml;
 $('sourcesList').innerHTML=shown.map(r=>'<article class="source-card" data-source="'+r.id+'" data-state="'+r.status+'"><h3>'+h(r.title)+'</h3><p class="source-state">'+states[r.status]+'</p><p>'+h(r.purpose)+'</p><details><summary>Échanges, déclenchement et références</summary><dl>'+[['Quand ?',r.when],['Informations concernées',r.send],['Compte / accès',r.account],['Licence / conditions',r.license],['Périmètre et limites',r.limit]].map(([label,value])=>'<div><dt>'+label+'</dt><dd>'+h(value)+'</dd></div>').join('')+'</dl>'+(r.refs.length?'<p class="source-links">'+r.refs.map(([label,url])=>'<a href="'+url+'" target="_blank" rel="noopener noreferrer">'+h(label)+'</a>').join(' · ')+'</p>':'')+'</details></article>').join('');
 $('sourcesCount').textContent=shown.length+' fiche(s). Configuration lue dans cette page ; disponibilité des services non testée.';
 renderLocalSources();
}
function renderLocalSources(){
 const rows=sourceLocalInventory(k=>localStorage.getItem(k),PROFILE_SCOPE);
 $('sourcesEnvironment').textContent=document.body.dataset.preview==='true'?'Version d’essai actuelle : données séparées du site public et des autres aperçus.':'Version publique : données de ce navigateur, séparées des aperçus.';
 $('sourcesLocalList').innerHTML=rows.map(r=>'<div><dt>'+r.label+'</dt><dd>'+({present:r.copies+' copie(s) de format enregistrées',absent:'Aucune copie enregistrée',unavailable:'Stockage inaccessible · présence inconnue'}[r.state])+'</dd></div>').join('');
 $('sourcesOffline').textContent=$('pwaStatus').textContent;
 $('sourcesProfile').disabled=busy;$('sourcesPrepared').disabled=busy;$('sourcesJournal').disabled=busy;
}
function sourcesTab(kind,focus=false){
 for(const [id,key,panel] of [['sourcesServicesTab','services','sourcesServices'],['sourcesLocalTab','local','sourcesLocal']]){
  const on=key===kind;$(id).setAttribute('aria-selected',String(on));$(id).tabIndex=on?0:-1;$(panel).hidden=!on;if(on&&focus)$(id).focus();
 }
}
function bindSources(){
 $('sourcesBtn').addEventListener('click',()=>{renderSources();$('sourcesMessage').textContent='';sourcesTab('services');$('sourcesDialog').showModal();$('sourcesTitle').focus()});
 $('sourcesClose').addEventListener('click',()=>$('sourcesDialog').close());
 $('sourcesDialog').addEventListener('close',()=>{if(!document.querySelector('dialog[open]'))$('sourcesBtn').focus()});
 $('sourcesFilter').addEventListener('change',renderSources);
 $('sourcesRefresh').addEventListener('click',()=>{renderSources();$('sourcesMessage').textContent='Inventaire relu localement. Aucun service interrogé.'});
 for(const [id,key] of [['sourcesServicesTab','services'],['sourcesLocalTab','local']]){
  $(id).addEventListener('click',()=>{renderLocalSources();sourcesTab(key)});
  $(id).addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();sourcesTab(e.key==='Home'?'services':e.key==='End'?'local':key==='services'?'local':'services',true)});
 }
 for(const [id,open] of [['sourcesProfile',openProfile],['sourcesPrepared',openPreparedTrips],['sourcesJournal',openJournal]])$(id).addEventListener('click',()=>{if(busy){$('sourcesMessage').textContent='Attendre la fin du calcul avant d’ouvrir les données locales.';renderLocalSources();return}$('sourcesDialog').close();open()});
 window.addEventListener('storage',e=>{if($('sourcesDialog').open&&(e.key===null||e.key.startsWith('dragonroute.')&&e.key.endsWith('.'+PROFILE_SCOPE))){renderLocalSources();$('sourcesMessage').textContent='Présence des copies relue après une modification du stockage. Le contenu reste à vérifier dans sa rubrique.'}});
}


const fuelField={E10:"e10",Gazole:"gazole",SP98:"sp98",SP95:"sp95",E85:"e85",GPLc:"gplc"};
const log=[];
let map=null, routeLayer=null, markerLayer=null, currentPos=null, activeAbort=null, deferredInstall=null;
let trip=null, compared=[], busy=false,stationSearch=null,stationJob=null;
let comparison=null,transitComparedCycle=null,transitComparisonData=null;
let mapView=null,currentStation=null,detailSequence=0;
let orsLastRequest=-Infinity;
let ignLastRequest=-Infinity;
const ignCache=new Map();
let geoLastRequest=-Infinity,geoBlockedUntil=0,placePending=null,selectedStop=null,budgetReference=null,rangeMeasuredAt=null;
const geoCache=new Map();
const dimensionFields={height:"truckHeight",width:"truckWidth",length:"truckLength",weight:"truckWeight",axleload:"truckAxleload"};
const avoidLabels={tollways:"péages",highways:"autoroutes",ferries:"ferries"};
const PROFILE_SCOPE=document.body.dataset.preview==="true"?"preview:"+new URL('.',location.href).pathname:"public";
const PROFILE_KEY="dragonroute.profile.v3."+PROFILE_SCOPE;
const PROFILE_SOURCES=[3,2,1].map(version=>({version,key:`dragonroute.profile.v${version}.${PROFILE_SCOPE}`}));
let profile,storageNotice="",profileSnapshots={},profileWriteBlocked=false,legacyProfiles=[];
let tripVehicleId=null,vehicleDraftId=null;
let addressDraft=null,addressLookupSequence=0,profileImportSequence=0,pendingProfileImport=null;
const rememberedInputs={start:null,end:null},favoriteInputs={start:null,end:null};
// BEGIN CYCLING MODEL
const CYCLE_ENDPOINT='https://routing.openstreetmap.de/routed-bike/route/v1/driving/';
function cycleNumber(v,min,max){if(typeof v!=='number'||!Number.isFinite(v)||v<min||v>max)throw new Error('Donnée cyclable numérique invalide.');return v}
function cyclePoint(p){if(!Array.isArray(p)||p.length!==2)throw new Error('Coordonnées cyclables invalides.');return [cycleNumber(p[0],-5.5,9.7),cycleNumber(p[1],41,51.2)]}
function cycleGap(a,b){const rad=Math.PI/180,dlat=(b[1]-a[1])*rad,dlon=(b[0]-a[0])*rad,h=Math.sin(dlat/2)**2+Math.cos(a[1]*rad)*Math.cos(b[1]*rad)*Math.sin(dlon/2)**2;return 6371000*2*Math.atan2(Math.sqrt(h),Math.sqrt(Math.max(0,1-h)))}
function cycleLimit(raw){if(raw===null||raw===undefined||typeof raw==='string'&&!raw.trim())return null;if(!['string','number'].includes(typeof raw))throw new Error('Limite vélo invalide.');const n=Number(raw);if(!Number.isFinite(n)||n<0||n>300)throw new Error('La distance souhaitée doit être comprise entre 0 et 300 km, ou laissée vide.');return n}
function cycleCriteria(maxKm,strict=false){if(typeof strict!=='boolean')throw new Error('Règle de distance vélo invalide.');maxKm=cycleLimit(maxKm);if(strict&&maxKm===null)throw new Error('Renseigner la distance de la limite impérative ou choisir une préférence.');return {maxKm,strict}}
function cycleLimitReview(distance,criteria){const c=cycleCriteria(criteria.maxKm,criteria.strict),known=typeof distance==='number'&&Number.isFinite(distance)&&distance>=0,maximum=c.maxKm===null?null:c.maxKm*1000,status=maximum===null?'not-requested':!known?'unknown':distance-maximum>1e-6?'over':'within';return {...c,distance:known?distance:null,status,excess:status==='over'?distance-maximum:null,admissible:!c.strict||status==='within'}}
function cycleConstrainedTiming(timing,distance,criteria){const review=cycleLimitReview(distance,criteria);return review.admissible?{...timing}:{...timing,status:'excluded',reason:'Limite impérative de distance vélo '+(review.status==='unknown'?'non vérifiable':'dépassée')+'.'+(timing.status!=='ready'&&timing.reason?' '+timing.reason:'')}}

function cyclePreference(distance,limit,strict=false){const r=cycleLimitReview(distance,{maxKm:limit,strict}),f=n=>n.toLocaleString('fr-FR',{minimumFractionDigits:3,maximumFractionDigits:3});if(r.status==='not-requested')return 'Aucune limite personnelle renseignée.';const values=(r.distance===null?'Distance inconnue':f(r.distance/1000)+' km calculés')+' / '+f(r.maxKm)+' km demandés. ';return values+(r.status==='unknown'?'Distance non vérifiable.':r.status==='over'?(strict?'Limite impérative dépassée.':'Limite souhaitée dépassée. Préférence souple.')+' Dépassement : '+(r.excess<1?'moins de 1 m':r.excess.toLocaleString('fr-FR',{maximumFractionDigits:1})+' m')+'.':strict?'Limite impérative respectée.':'Distance dans la limite souhaitée.')+' '+(!r.admissible?'Parcours non admissible pour cette limite. ':'')+'Le tracé reste consultable. Comparaison avant arrondi ; effort et autonomie non vérifiés.'}

function cycleRequest(a,b,endpoint=CYCLE_ENDPOINT){
 if(endpoint!==CYCLE_ENDPOINT)throw new Error('Le service vélo est désactivé ou non qualifié.');a=cyclePoint(a);b=cyclePoint(b);const gap=cycleGap(a,b);if(gap<10||gap>150000)throw new Error('Choisir deux lieux distincts, à moins de 150 km à vol d’oiseau pour cet essai.');
 return {a,b,url:endpoint+[a,b].map(p=>p.join(',')).join(';')+'?'+new URLSearchParams({overview:'full',geometries:'geojson',steps:'true',alternatives:'false'})};
}
function cycleGeometry(g){if(g?.type!=='LineString'||!Array.isArray(g.coordinates)||g.coordinates.length<2||g.coordinates.length>25000)throw new Error('Tracé cyclable absent ou trop volumineux.');return g.coordinates.map(cyclePoint)}
function cycleResponse(d,q){
 if(d?.code==='NoRoute'||d?.code==='NoSegment')throw new Error('Aucun parcours vélo trouvé entre ces lieux. Préciser les points ou essayer un autre trajet.');
 if(d?.code!=='Ok'||!Array.isArray(d.routes)||d.routes.length!==1||!Array.isArray(d.waypoints)||d.waypoints.length!==2)throw new Error('Réponse cyclable non reconnue.');
 const r=d.routes[0],points=cycleGeometry(r.geometry),distance=cycleNumber(r.distance,1,300000),duration=cycleNumber(r.duration,1,604800);
 for(const [i,p] of [q.a,q.b].entries()){const w=d.waypoints[i];if(cycleNumber(w.distance,0,150)>150||cycleGap(cyclePoint(w.location),p)>150||cycleGap(i?points.at(-1):points[0],p)>150)throw new Error('Le tracé est trop éloigné du lieu demandé. Préciser l’adresse.');}
 if(!Array.isArray(r.legs)||r.legs.length!==1)throw new Error('Étapes cyclables incohérentes.');const leg=r.legs[0];
 if(!Array.isArray(leg.steps)||leg.steps.length<2||leg.steps.length>1500)throw new Error('Détail cyclable manquant ou trop volumineux.');
 const steps=leg.steps.map(s=>{if(!['cycling','pushing bike'].includes(s.mode))throw new Error('Ce parcours comporte un mode non qualifié (transport ou traversée). Aucun trajet vélo direct n’est présenté.');return {mode:s.mode,distance:cycleNumber(s.distance,0,300000),duration:cycleNumber(s.duration,0,604800),name:typeof s.name==='string'?s.name.slice(0,240):''}});
 const close=(a,b,t)=>Math.abs(a-b)<=t;
 if(!close(cycleNumber(leg.distance,1,300000),distance,Math.max(10,distance*.001))||!close(cycleNumber(leg.duration,1,604800),duration,Math.max(10,duration*.001))||!close(steps.reduce((n,s)=>n+s.distance,0),distance,Math.max(10,distance*.001))||!close(steps.reduce((n,s)=>n+s.duration,0),duration,Math.max(10,duration*.001)))throw new Error('Distances ou durées cyclables incohérentes.');
 let measured=0;for(let i=1;i<points.length;i++){const gap=cycleGap(points[i-1],points[i]);if(gap>5000)throw new Error('Tracé cyclable discontinu.');measured+=gap}
 if(Math.abs(measured-distance)>Math.max(75,distance*.05))throw new Error('La longueur du tracé ne concorde pas avec la distance.');
 return {points,distance,duration,steps,pushingMeters:steps.filter(s=>s.mode==='pushing bike').reduce((n,s)=>n+s.distance,0),dataVersion:typeof d.data_version==='string'?d.data_version.slice(0,100):null};
}
function cycleXml(v){return String(v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g,'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;')}
function cycleGpx(r,places,at){
 const points=cycleGeometry({type:'LineString',coordinates:r.points}),title=cycleXml(places.start+' → '+places.end),desc=cycleXml(`Vélo classique. Tracé préparé, non relevé GPS. ${r.distance} m ; ${r.duration} s hors pauses. Calcul consulté le ${at}. OSRM / FOSSGIS ; données © OpenStreetMap (ODbL). Pente, état, accès réel et autonomie non vérifiés.`);
 return `<?xml version="1.0" encoding="UTF-8"?><gpx version="1.1" creator="OùQuandQui" xmlns="http://www.topografix.com/GPX/1/1"><metadata><name>${title}</name><desc>${desc}</desc><link href="https://routing.openstreetmap.de/about.html"><text>OSRM / FOSSGIS</text></link></metadata><trk><name>${title}</name><desc>${desc}</desc><src>OpenStreetMap · ODbL · FOSSGIS routed-bike</src><trkseg>${points.map(([lon,lat])=>`<trkpt lat="${lat}" lon="${lon}"></trkpt>`).join('')}</trkseg></trk></gpx>`;
}
// END CYCLING MODEL

// BEGIN CYCLE COMPARISON MODEL
function cycleComparisonChoice(enabled,limit,strict=false){return {enabled:enabled===true,...(enabled===true?cycleCriteria(limit,strict):{maxKm:null,strict:false})}}
// END CYCLE COMPARISON MODEL
// BEGIN SAVED CYCLE MODEL
function validateSavedCycleEntry(e,version=2){
 if(!e?.places||!e.criteria||e.snapshot?.source!=='fossgis-bike'||e.snapshot.profile!=='bicycle')throw new Error('Préparation vélo incomplète ou profil non reconnu.');
 const id=preparedText(e.id,80,true),name=preparedText(e.name,80,true),savedAt=preparedDate(e.savedAt),calculatedAt=preparedDate(e.snapshot.calculatedAt);
 if(!/^[A-Za-z0-9-]+$/.test(id)||Date.parse(calculatedAt)>Date.parse(savedAt))throw new Error('Identité ou dates vélo incohérentes.');
 const places={start:preparedPoint(e.places.start),end:preparedPoint(e.places.end)},q=cycleRequest([places.start.lon,places.start.lat],[places.end.lon,places.end.lat]);
 const limit=e.criteria.maxKm;if(limit!==null&&(typeof limit!=='number'||!Number.isFinite(limit)))throw new Error('Limite vélo invalide.');if(version===1&&(e.criteria.strict!==undefined||limit!==null&&limit<.1))throw new Error('Critères incompatibles avec le format vélo 1.');const criteria=cycleCriteria(limit,version===1?false:e.criteria.strict);if(version===2&&typeof e.criteria.strict!=='boolean')throw new Error('Règle vélo absente du format 2.');
 const r=e.snapshot.route;if(!r||!Array.isArray(r.steps)||r.steps.length>1500)throw new Error('Détail de la préparation vélo manquant.');
 const points=cycleGeometry({type:'LineString',coordinates:r.points}),steps=r.steps.map(s=>({mode:s.mode,distance:s.distance,duration:s.duration,name:preparedText(s.name,240)}));
 if(r.dataVersion!==null&&typeof r.dataVersion!=='string')throw new Error('Version des données vélo invalide.');
 // Adapter l’instantané au validateur commun ne lui attribue pas une origine authentifiée.
 const route=cycleResponse({code:'Ok',data_version:r.dataVersion===null?undefined:preparedText(r.dataVersion,100),waypoints:[{location:points[0],distance:cycleGap(q.a,points[0])},{location:points.at(-1),distance:cycleGap(q.b,points.at(-1))}],routes:[{distance:r.distance,duration:r.duration,geometry:{type:'LineString',coordinates:points},legs:[{distance:r.distance,duration:r.duration,steps}]}]},q);
 return {id,name,savedAt,places,criteria,snapshot:{source:'fossgis-bike',profile:'bicycle',calculatedAt,route}};
}
function validateSavedCycle(data){
 if(data?.kind!=='dragonroute-cycling-preparations'||![1,2].includes(data.version)||!Array.isArray(data.entries)||data.entries.length>20)throw new Error('Format vélo inconnu ou limite de 20 préparations dépassée.');
 const clean={kind:'dragonroute-cycling-preparations',version:2,entries:data.entries.map(e=>validateSavedCycleEntry(e,data.version))};
 if(new Set(clean.entries.map(e=>e.id)).size!==clean.entries.length)throw new Error('Identifiants vélo dupliqués.');
 if(new TextEncoder().encode(JSON.stringify(clean,null,2)).length>2000000)throw new Error('La sauvegarde vélo dépasse 2 Mo.');return clean;
}
function parseSavedCycleText(text){if(typeof text!=='string'||new TextEncoder().encode(text).length>2000000)throw new Error('Fichier vélo supérieur à 2 Mo.');return validateSavedCycle(JSON.parse(text))}
function savedCycleDuplicates(entry,entries){
 const name=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().replace(/\s+/g,' ').toLocaleLowerCase('fr-FR'),key=e=>JSON.stringify([e.places.start.lat,e.places.start.lon,e.places.end.lat,e.places.end.lon,e.criteria.maxKm,e.criteria.strict]);
 return entries.filter(e=>e.id!==entry.id&&(name(e.name)===name(entry.name)||key(e)===key(entry)));
}
// END SAVED CYCLE MODEL


// BEGIN SHARED BIKES MODEL
const BIKE_BASE='https://download.data.grandlyon.com/files/rdata/jcd_jcdecaux.jcdvelov/';
const BIKE_MAX_AGE=300000;
function bikeCount(v){return Number.isInteger(v)&&v>=0&&v<=10000?v:null}
function bikeTimestamp(v){return Number.isInteger(v)&&v>=946684800&&v<=4102444800?v*1000:null}
function bikeText(v,max=200){return typeof v==='string'?v.trim().slice(0,max):''}
function bikeEnvelope(raw,key){if(raw?.version!=='2.3'||!Array.isArray(raw.data?.[key])||raw.data[key].length>2000)throw new Error('Format Vélo’v non reconnu ou trop volumineux.');return {rows:raw.data[key],updated:bikeTimestamp(raw.last_updated),ttl:Number.isInteger(raw.ttl)&&raw.ttl>=0&&raw.ttl<=86400?raw.ttl:60}}
function bikeUnique(rows,key){const ids=new Map();for(const r of rows){const id=typeof r?.[key]==='string'&&r[key].length<=100?r[key]:'';if(id)ids.set(id,ids.has(id)?null:r)}return ids}
function bikeCatalogue(raw){const e=bikeEnvelope(raw,'stations'),ids=bikeUnique(e.rows,'station_id'),rows=[];for(const [id,r] of ids){if(!r||!bikeText(r.name)||typeof r.lat!=='number'||typeof r.lon!=='number'||!Number.isFinite(r.lat)||!Number.isFinite(r.lon)||r.lat<45.5||r.lat>46.05||r.lon<4.5||r.lon>5.2)continue;rows.push({id,name:bikeText(r.name),address:bikeText(r.address),lat:r.lat,lon:r.lon,capacity:bikeCount(r.capacity)})}rows.sort((a,b)=>a.name.localeCompare(b.name,'fr',{numeric:true}));return {...e,rows,excluded:e.rows.length-rows.length}}
function bikeTypes(raw){const e=bikeEnvelope(raw,'vehicle_types'),map=new Map();for(const [id,r] of bikeUnique(e.rows,'vehicle_type_id'))if(r?.form_factor==='bicycle'&&['human','electric_assist'].includes(r.propulsion_type))map.set(id,r.propulsion_type==='human'?'mechanical':'electric');return map}
function bikeSnapshot(info,status,types,observed=Date.now()){
 const c=bikeCatalogue(info),s=status?bikeEnvelope(status,'stations'):null,m=s?bikeUnique(s.rows,'station_id'):new Map(),t=types?bikeTypes(types):new Map();let missing=0,ambiguous=0;
 const rows=c.rows.map((r,index)=>{const d=m.get(r.id);if(!d)missing++;if(m.has(r.id)&&!d)ambiguous++;
  const bikes=bikeCount(d?.num_bikes_available),docks=bikeCount(d?.num_docks_available),typed={mechanical:null,electric:null};
  const a=d?.vehicle_types_available;if(Array.isArray(a)&&a.length<=100){let valid=true,total=0;const seen=new Set(),parts={mechanical:0,electric:0},known=new Set();for(const item of a){const id=item?.vehicle_type_id,n=bikeCount(item?.count),kind=t.get(id);if(typeof id!=='string'||seen.has(id)||n===null){valid=false;break}seen.add(id);total+=n;if(kind){parts[kind]+=n;known.add(kind)}}if(valid&&(bikes===null||total===bikes))for(const kind of known)typed[kind]=parts[kind]}
  return {...r,number:index+1,bikes,docks,...typed,installed:typeof d?.is_installed==='boolean'?d.is_installed:null,renting:typeof d?.is_renting==='boolean'?d.is_renting:null,returning:typeof d?.is_returning==='boolean'?d.is_returning:null,reported:bikeTimestamp(d?.last_reported)};
 });return {rows,observed,infoUpdated:c.updated,statusUpdated:s?.updated??null,excluded:c.excluded,missing,ambiguous,unmatched:s?[...m.keys()].filter(id=>!c.rows.some(r=>r.id===id)).length:0};
}
function bikeFreshness(row,snapshot,now=Date.now()){
 if(!Number.isFinite(now)||!Number.isFinite(snapshot.observed)||now<snapshot.observed-60000||!row.reported||!snapshot.statusUpdated||row.reported>now+60000||snapshot.statusUpdated>now+60000||row.reported>snapshot.statusUpdated+60000)return 'unknown';
 return now-row.reported>BIKE_MAX_AGE||now-snapshot.statusUpdated>BIKE_MAX_AGE?'old':'recent';
}
function bikeRows(snapshot,{text='',need='all',type='all'}={},now=Date.now()){
 const norm=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('fr-FR'),query=norm(text.trim());
 return snapshot.rows.filter(r=>{if(!norm(r.name+' '+r.address+' '+r.id).includes(query))return false;if(need==='all')return true;if(bikeFreshness(r,snapshot,now)!=='recent'||r.installed!==true)return false;
  if(need==='return')return r.returning===true&&r.docks!==null&&r.docks>0;
  if(need==='rent'){const n=type==='mechanical'?r.mechanical:type==='electric'?r.electric:r.bikes;return r.renting===true&&n!==null&&n>0}return false;
 });
}
function bikeRetryAfter(value,now=Date.now()){if(!value)return now+60000;const n=/^\d+$/.test(value)?Number(value)*1000:Date.parse(value)-now;return Number.isFinite(n)?now+Math.max(60000,n):now+60000}
// END SHARED BIKES MODEL
// BEGIN SHARED BIKE TRIP MODEL
function bikeTripPoint(p){p=cyclePoint(p);if(p[0]<4.5||p[0]>5.2||p[1]<45.5||p[1]>46.05)throw new Error('Ce parcours avec vélo partagé est limité au pilote Lyon.');return p}
function emptyBikeTripLimits(){return {walk:{maxKm:null,strict:false},bike:{maxKm:null,strict:false}}}
function validateBikeTripLimits(value){
 if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('Limites de distance absentes ou invalides.');
 const out={};for(const [key,max] of [['walk',600],['bike',300]]){const v=value[key];if(!v||typeof v.strict!=='boolean'||(v.maxKm!==null&&(typeof v.maxKm!=='number'||!Number.isFinite(v.maxKm)||v.maxKm<0||v.maxKm>max)))throw new Error('Limite '+(key==='walk'?'de marche':'de vélo')+' invalide.');if(v.strict&&v.maxKm===null)throw new Error('Renseigner la distance de la limite impérative ou choisir une préférence.');out[key]={maxKm:v.maxKm,strict:v.strict}}return out;
}
function bikeTripLimitReview(parts,limits){
 const c=validateBikeTripLimits(limits),known=(i,mode)=>Array.isArray(parts)&&parts[i]?.mode===mode&&typeof parts[i].distance==='number'&&Number.isFinite(parts[i].distance)&&parts[i].distance>=0;
 const distances={walk:known(0,'walk')&&known(2,'walk')?parts[0].distance+parts[2].distance:null,bike:known(1,'bike')?parts[1].distance:null};
 const rows=['walk','bike'].map(key=>{const v=c[key],distanceMeters=distances[key],maximumMeters=v.maxKm===null?null:v.maxKm*1000,status=maximumMeters===null?'not-requested':distanceMeters===null?'unknown':distanceMeters-maximumMeters>1e-6?'over':'within';return {key,...v,distanceMeters,maximumMeters,status,excessMeters:status==='over'?distanceMeters-maximumMeters:null}});
 return {rows,admissible:rows.every(r=>!r.strict||r.status==='within'),hasPreferences:rows.some(r=>r.maxKm!==null&&!r.strict),hasConstraints:rows.some(r=>r.strict)};
}
function bikeTripMinutes(raw,label){if(raw==null||String(raw).trim()==='')return null;if(!['string','number'].includes(typeof raw))throw new Error('Temps invalide.');const n=Number(raw);if(!Number.isFinite(n)||n<0||n>120)throw new Error(label+' : renseigner de 0 à 120 minutes ou laisser vide.');return n}
function bikeTripStations(snapshot,pickupId,dropoffId){
 const pickup=snapshot?.rows.find(r=>r.id===pickupId),dropoff=snapshot?.rows.find(r=>r.id===dropoffId);
 if(!pickup||!dropoff)throw new Error('Choisir les stations de prise et de restitution dans la liste.');
 const a=bikeTripPoint([pickup.lon,pickup.lat]),b=bikeTripPoint([dropoff.lon,dropoff.lat]);
 if(pickup.id===dropoff.id||cycleGap(a,b)<10)throw new Error('Choisir deux stations distinctes et éloignées d’au moins 10 m.');
 return {pickup,dropoff};
}
function bikeTripAvailability(snapshot,pickup,dropoff,now=Date.now()){
 return {pickup:!!pickup&&bikeRows(snapshot,{need:'rent',type:'mechanical'},now).some(r=>r.id===pickup.id),dropoff:!!dropoff&&bikeRows(snapshot,{need:'return'},now).some(r=>r.id===dropoff.id)};
}
function bikeTripTotals(parts,rentMinutes,returnMinutes){
 if(!Array.isArray(parts)||parts.length!==3||parts.some((p,i)=>!p||p.mode!==['walk','bike','walk'][i]||!Array.isArray(p.points)||p.points.length<2||![p.distance,p.duration].every(n=>typeof n==='number'&&Number.isFinite(n)&&n>=0)))throw new Error('Trois étapes cohérentes sont nécessaires.');
 for(const p of parts)p.points.forEach(cyclePoint);
 for(const t of [rentMinutes,returnMinutes])if(t!==null&&(typeof t!=='number'||!Number.isFinite(t)||t<0||t>120))throw new Error('Temps de prise ou de restitution invalide.');
 const joins=[cycleGap(parts[0].points.at(-1),parts[1].points[0]),cycleGap(parts[1].points.at(-1),parts[2].points[0])],moving=parts.reduce((n,p)=>n+p.duration,0),distance=parts.reduce((n,p)=>n+p.distance,0),missing=[rentMinutes,returnMinutes].filter(t=>t===null).length;
 // 30 m is a disclosed application threshold, not a surveyed connection.
 return {distance,moving,walking:parts[0].distance+parts[2].distance,joins,missing,duration:missing||joins.some(n=>n>30)?null:moving+(rentMinutes+returnMinutes)*60,price:null,carbon:null};
}
// END SHARED BIKE TRIP MODEL

// BEGIN SAVED SHARED BIKE MODEL
function sharedStation(s){
 if(!s)throw new Error('Station enregistrée absente.');
 const p=bikeTripPoint([s.lon,s.lat]);return {id:preparedText(s.id,100,true),name:preparedText(s.name,200,true),address:preparedText(s.address,200),lon:p[0],lat:p[1]};
}
function sharedAvailability(a,stations,capturedAt){
 if(!a||a.source!=='velov-gbfs')throw new Error('Source de disponibilité inconnue.');
 const observed=preparedDate(a.observed);if(Date.parse(observed)>Date.parse(capturedAt))throw new Error('Dates de disponibilité incohérentes.');
 const stamp=v=>v===null?null:preparedNumber(v,946684800000,4102444800000),rows={};
 for(const role of ['pickup','dropoff']){
  const r=a[role];if(!r)throw new Error('Annonce de station absente.');const clean={id:stations[role].id,reported:stamp(r.reported)};
  for(const k of ['mechanical','docks']){if(r[k]!==null&&bikeCount(r[k])===null)throw new Error('Compte de station invalide.');clean[k]=r[k]}
  for(const k of ['installed','renting','returning'])clean[k]=r[k]===null?null:preparedBool(r[k]);
  rows[role]=clean;
 }
 return {source:'velov-gbfs',observed,infoUpdated:stamp(a.infoUpdated),statusUpdated:stamp(a.statusUpdated),...rows};
}
function validateSavedSharedEntry(e,version=2){
 if(e?.snapshot?.source!=='lyon-shared-bike'||!e.criteria||!e.stations||!e.places)throw new Error('Préparation partagée incomplète ou source inconnue.');
 const id=preparedText(e.id,80,true),name=preparedText(e.name,80,true),savedAt=preparedDate(e.savedAt),capturedAt=preparedDate(e.snapshot.capturedAt);
 if(!/^[A-Za-z0-9-]+$/.test(id)||Date.parse(capturedAt)>Date.parse(savedAt))throw new Error('Identité ou dates partagées incohérentes.');
 const places={start:preparedPoint(e.places.start),end:preparedPoint(e.places.end)},stations={pickup:sharedStation(e.stations.pickup),dropoff:sharedStation(e.stations.dropoff)};
 for(const p of Object.values(places))bikeTripPoint([p.lon,p.lat]);bikeTripStations({rows:Object.values(stations)},stations.pickup.id,stations.dropoff.id);
 const criteria={strictAvailability:preparedBool(e.criteria.strictAvailability)};
 if(version===1&&e.criteria.limits!==undefined)throw new Error('Des limites de distance exigent le format partagé 2.');
 criteria.limits=version===1?emptyBikeTripLimits():validateBikeTripLimits(e.criteria.limits);
 for(const k of ['rentMinutes','returnMinutes']){const v=e.criteria[k];if(v!==null&&(typeof v!=='number'||!Number.isFinite(v)||v<0||v>120))throw new Error('Temps partagé invalide.');criteria[k]=v}
 const list=e.snapshot.parts;if(!Array.isArray(list)||list.length!==3)throw new Error('Trois étapes enregistrées requises.');
 const points=[places.start,stations.pickup,stations.dropoff,places.end].map(p=>[p.lon,p.lat]);
 const parts=list.map((p,i)=>{
  if(!p||p.mode!==['walk','bike','walk'][i])throw new Error('Ordre ou mode des étapes invalide.');
  const at=preparedDate(p.at);if(Date.parse(at)>Date.parse(capturedAt))throw new Error('Étape postérieure à la capture.');
  const version=p.version===null?null:preparedText(p.version,100),cached=preparedBool(p.cached),geometry=cycleGeometry({type:'LineString',coordinates:p.points});
  const distance=preparedNumber(p.distance,0,300000),duration=preparedNumber(p.duration,0,604800);
  if(i===1){
   if(p.source!=='fossgis-bike')throw new Error('Profil cyclable inconnu.');
   const checked=validateSavedCycleEntry({id,name,savedAt,places:{start:{label:stations.pickup.name,...stations.pickup},end:{label:stations.dropoff.name,...stations.dropoff}},criteria:{maxKm:null,strict:false},snapshot:{source:'fossgis-bike',profile:'bicycle',calculatedAt:at,route:{points:geometry,distance,duration,steps:p.steps,dataVersion:version}}});
   return {mode:'bike',source:'fossgis-bike',at,cached,version,points:checked.snapshot.route.points,distance,duration,steps:checked.snapshot.route.steps,pushing:checked.snapshot.route.pushingMeters};
  }
  const same=points[i].every((v,j)=>v===points[i+1][j]);
  if(p.source==='same-point'){
   if(!same||distance!==0||duration!==0||geometry.some(g=>g.some((v,j)=>v!==points[i][j])))throw new Error('Marche nulle incohérente.');
  }else{
   if(p.source!=='ign-pedestrian'||distance===0||duration===0)throw new Error('Profil ou métriques piétonnes invalides.');
   if(cycleGap(geometry[0],points[i])>150||cycleGap(geometry.at(-1),points[i+1])>150)throw new Error('Marche éloignée des lieux enregistrés.');
   let measured=0;for(let j=1;j<geometry.length;j++){const gap=cycleGap(geometry[j-1],geometry[j]);if(gap>5000)throw new Error('Marche discontinue.');measured+=gap}
   if(Math.abs(measured-distance)>Math.max(75,distance*.05))throw new Error('Distance piétonne incohérente.');
  }
  return {mode:'walk',source:p.source,at,cached,version,points:geometry,distance,duration};
 });
 bikeTripTotals(parts,criteria.rentMinutes,criteria.returnMinutes);
 return {id,name,savedAt,places,stations,criteria,snapshot:{source:'lyon-shared-bike',capturedAt,parts,availability:sharedAvailability(e.snapshot.availability,stations,capturedAt)}};
}
function validateSavedShared(d){
 if(d?.kind!=='dragonroute-shared-bike-preparations'||![1,2].includes(d.version)||!Array.isArray(d.entries)||d.entries.length>20)throw new Error('Format partagé inconnu ou limite de 20 préparations dépassée.');
 const clean={kind:'dragonroute-shared-bike-preparations',version:2,entries:d.entries.map(e=>validateSavedSharedEntry(e,d.version))};
 if(new Set(clean.entries.map(e=>e.id)).size!==clean.entries.length)throw new Error('Identifiants partagés dupliqués.');
 if(new TextEncoder().encode(JSON.stringify(clean,null,2)).length>2000000)throw new Error('La sauvegarde partagée dépasse 2 Mo.');return clean;
}
function parseSavedSharedText(text){if(typeof text!=='string'||new TextEncoder().encode(text).length>2000000)throw new Error('Fichier partagé supérieur à 2 Mo.');return validateSavedShared(JSON.parse(text))}
function savedSharedDuplicates(e,entries){
 const norm=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().replace(/\s+/g,' ').toLocaleLowerCase('fr-FR'),key=x=>JSON.stringify([x.places,x.stations.pickup.id,x.stations.dropoff.id,x.criteria]);
 return entries.filter(x=>x.id!==e.id&&(norm(x.name)===norm(e.name)||key(x)===key(e)));
}
function savedSharedTotals(e){
 const t=bikeTripTotals(e.snapshot.parts,e.criteria.rentMinutes,e.criteria.returnMinutes),a=e.snapshot.availability,s={observed:Date.parse(a.observed),statusUpdated:a.statusUpdated,rows:[a.pickup,a.dropoff]},fresh=bikeTripAvailability(s,a.pickup,a.dropoff,Date.parse(e.snapshot.capturedAt));
 const limits=bikeTripLimitReview(e.snapshot.parts,e.criteria.limits??emptyBikeTripLimits()),available=!e.criteria.strictAvailability||(fresh.pickup&&fresh.dropoff);
 return {...t,limits,available,admissible:available&&limits.admissible};
}
function sharedStationChanges(entry,snapshot){
 return ['pickup','dropoff'].map(role=>{const old=entry.stations[role],row=snapshot?.rows.find(r=>r.id===old.id);return {role,old,row:row||null,changed:!!row&&(row.name!==old.name||row.address!==old.address||row.lon!==old.lon||row.lat!==old.lat),gap:row?cycleGap([old.lon,old.lat],[row.lon,row.lat]):null}});
}
// END SAVED SHARED BIKE MODEL



// BEGIN PROFILE VALIDATION
function defaultVehicle(){return {name:"",type:"car",fuel:"E10",cons:6.2,liters:40}}
function emptyProfile(){return {version:3,vehicles:[],activeVehicleId:null,addresses:[],stations:[]}}
function profileText(value,max){if(typeof value!=="string"||value.length>max)throw new Error("Texte de profil invalide");return value.trim()}
function profileNumber(value,min,max){if(typeof value!=="number"||!Number.isFinite(value)||value<min||value>max)throw new Error("Valeur de profil invalide");return value}
function addressKey(value){return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().replace(/\s+/g,' ').toLocaleLowerCase('fr-FR')}
function temporaryAddress(value){return ['ma position','__current__'].includes(addressKey(value))}
function validateSavedPlace(place){
 if(!place||typeof place!=='object'||place.source!=='ign')throw new Error('Lieu mémorisé invalide');
 const label=profileText(place.label,1000),resolvedAt=profileText(place.resolvedAt,40);
 if(!label||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(resolvedAt)||!Number.isFinite(Date.parse(resolvedAt))||new Date(resolvedAt).toISOString()!==(resolvedAt.includes('.')?resolvedAt:resolvedAt.replace('Z','.000Z')))throw new Error('Date ou libellé du lieu invalide');
 return {lat:profileNumber(place.lat,-90,90),lon:profileNumber(place.lon,-180,180),label,source:'ign',resolvedAt};
}
function validateProfile(data){
 if(!data||![1,2,3].includes(data.version)||!Array.isArray(data.addresses)||!Array.isArray(data.stations)||data.addresses.length>50||data.stations.length>100)throw new Error("Format de profil invalide");
 if(data.version===3&&(!Array.isArray(data.vehicles)||data.vehicles.length>10))throw new Error('Conserver au maximum dix véhicules par profil.');
 const vehicles=data.version===3?data.vehicles.map(v=>({...validateVehicle(v),id:profileText(v.id,80)})):[{...validateVehicle(data.vehicle),id:'legacy-vehicle'}];
 if(vehicles.some(v=>!v.id)||new Set(vehicles.map(v=>v.id)).size!==vehicles.length)throw new Error('Identifiants de véhicules invalides.');
 const activeVehicleId=data.version===3?data.activeVehicleId:'legacy-vehicle';
 if(activeVehicleId!==null&&(typeof activeVehicleId!=='string'||!vehicles.some(v=>v.id===activeVehicleId)))throw new Error('Véhicule actif absent du profil.');
 const addresses=data.addresses.map(a=>{
  const entry={id:profileText(a.id,80),name:profileText(a.name,80),value:profileText(a.value,250)};
  if(data.version>=2&&a.place!=null){if(temporaryAddress(entry.value))throw new Error('Position GPS temporaire non réutilisable');entry.place=validateSavedPlace(a.place)}
  return entry;
 });
 const stations=data.stations.map(s=>({id:profileText(s.id,80),address:profileText(s.address,300),city:profileText(s.city,100),lat:profileNumber(s.lat,-90,90),lon:profileNumber(s.lon,-180,180)}));
 for(const list of [addresses,stations]){if(list.some(x=>!x.id)||new Set(list.map(x=>x.id)).size!==list.length)throw new Error("Identifiants invalides")}
 if(addresses.some(a=>!a.name||!a.value))throw new Error("Adresse incomplète");
 const clean={version:3,vehicles,activeVehicleId,addresses,stations};
 if(new TextEncoder().encode(JSON.stringify(clean,null,2)).length>100000)throw new Error('Profil trop volumineux');
 return clean;
}
function validateVehicle(v){
 if(!v||!["car","caravan","van","truck"].includes(v.type)||!Object.hasOwn(fuelField,v.fuel))throw new Error('Véhicule invalide');
 const dimensions=v.dimensions==null?undefined:validateDimensions(v.dimensions);
 return {name:profileText(v.name,80),type:v.type,fuel:v.fuel,cons:profileNumber(v.cons,1,100),liters:profileNumber(v.liters,1,2000),...(dimensions?{dimensions}:{})};
}
function legacyProfileExport(data){
 if(![1,2].includes(data?.version))throw new Error('Ancien format non reconnu.');
 const clean=validateProfile(data),{id,...vehicle}=clean.vehicles[0];
 return {version:data.version,vehicle,addresses:clean.addresses,stations:clean.stations};
}
function duplicateVehicles(v,vehicles){return v.name.trim()?vehicles.filter(x=>x.id!==v.id&&addressKey(x.name)===addressKey(v.name)):[]}
function duplicateAddresses(entry,addresses){
 return addresses.filter(a=>a.id!==entry.id&&(addressKey(a.name)===addressKey(entry.name)||(a.place&&entry.place?Math.abs(a.place.lat-entry.place.lat)<1e-6&&Math.abs(a.place.lon-entry.place.lon)<1e-6:addressKey(a.value)===addressKey(entry.value))));
}
function duplicateAddressCount(addresses){return addresses.reduce((n,a,i)=>n+duplicateAddresses(a,addresses.slice(0,i)).length,0)}
// END PROFILE VALIDATION
function loadProfile(){
 profile=emptyProfile();storageNotice="";profileWriteBlocked=false;legacyProfiles=[];profileSnapshots={};
 try{
  for(const {key} of PROFILE_SOURCES)profileSnapshots[key]=localStorage.getItem(key);
  for(const {key,version} of PROFILE_SOURCES.slice(1)){try{const data=JSON.parse(profileSnapshots[key]);if(data?.version===version)legacyProfiles.push(legacyProfileExport(data))}catch{}}
  const source=PROFILE_SOURCES.find(({key})=>profileSnapshots[key]!==null);
  if(source){const data=JSON.parse(profileSnapshots[source.key]);if(data.version!==source.version)throw new Error('Version incohérente avec le stockage.');profile=validateProfile(data)}
  if(source&&source.version<3)storageNotice="Ancien profil repris. Les copies d’origine restent conservées dans ce navigateur et peuvent être exportées.";
 }catch{profileWriteBlocked=true;storageNotice="Profil non chargé : format inconnu, données invalides ou stockage inaccessible. L’original est conservé ; aucun enregistrement ne le remplacera. Réouvrir avec une version compatible, ou effacer explicitement ce profil pour repartir."}
}
loadProfile();
function profileUnchanged(){return PROFILE_SOURCES.every(({key})=>localStorage.getItem(key)===profileSnapshots[key])}
function saveProfile(next){
 try{
  if(profileWriteBlocked)throw new Error('Profil non chargé : remplacement bloqué.');
  if(!profileUnchanged())throw new Error('Profil modifié dans un autre onglet. Recharger avant de réessayer.');
  const clean=validateProfile(next),raw=JSON.stringify(clean);
  localStorage.setItem(PROFILE_KEY,raw);profileSnapshots[PROFILE_KEY]=raw;profile=clean;storageNotice="";renderSaved();updateFavorite();return true;
 }catch(e){const message="Enregistrement impossible. "+(e.message.includes('autre onglet')||profileWriteBlocked?e.message:'Stockage indisponible, plein ou données invalides.');$("profileMessage").textContent=message;$("stationMessage").textContent=message;return false}
}
function downloadProfile(data,filename='DragonRoute-profil.json'){
 const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
 const link=document.createElement('a');link.href=url;link.download=filename;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
// BEGIN JOURNAL MODEL
/* Impact CO2 data attribution and license:
MIT License

Copyright (c) 2022 Datagir

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

*/
// The bundled Impact CO2 factors are frozen, attributed and licensed below.
const CARBON_DATA={"version":"impactco2-2026-11-18-bece7af","publisher":"ADEME / Impact CO₂","retrievedAt":"2026-11-18","sourceCommit":"bece7af7e3daa41c7f2233e03d169c33e82530c2","sourceURL":"https://github.com/incubateur-ademe/impactco2/blob/bece7af7e3daa41c7f2233e03d169c33e82530c2/src/data/categories/deplacement.ts","license":"MIT","sourceSha256":"d0cf114a19cf098c726dc4bab5d79a8bc477e6f14309686d1f7726cf6b440ef2","factors":[{"id":"tgv","mode":"train","label":"TGV","unit":"kgCO2e/person-km","scope":"construction-energy","construction":0.00063,"energy":0.0023,"source":"https://impactco2.fr/outils/transport/tgv"},{"id":"intercites","mode":"train","label":"Intercités","unit":"kgCO2e/person-km","scope":"construction-energy","construction":0.00318,"energy":0.0058,"source":"https://impactco2.fr/outils/transport/intercites"},{"id":"autocar","mode":"bus","label":"Autocar thermique","unit":"kgCO2e/person-km","scope":"construction-energy","construction":0.00442,"energy":0.03314,"source":"https://impactco2.fr/outils/transport/autocar"},{"id":"velo","mode":"bike","label":"Vélo mécanique","unit":"kgCO2e/person-km","scope":"construction","construction":0.00017,"energy":0,"source":"https://impactco2.fr/outils/transport/velo"},{"id":"veloelectrique","mode":"bike","label":"Vélo électrique","unit":"kgCO2e/person-km","scope":"construction-energy","construction":0.00872,"energy":0.00223,"source":"https://impactco2.fr/outils/transport/veloelectrique"},{"id":"busthermique","mode":"bus","label":"Bus thermique","unit":"kgCO2e/person-km","scope":"construction-energy","construction":0.00892,"energy":0.1135,"source":"https://impactco2.fr/outils/transport/busthermique"},{"id":"tramway","mode":"train","label":"Tramway","unit":"kgCO2e/person-km","scope":"construction-energy","construction":0.00048,"energy":0.0038,"source":"https://impactco2.fr/outils/transport/tramway"},{"id":"metro","mode":"train","label":"Métro","unit":"kgCO2e/person-km","scope":"construction-energy","construction":0.00024,"energy":0.0042,"source":"https://impactco2.fr/outils/transport/metro"},{"id":"rer","mode":"train","label":"RER / Transilien","unit":"kgCO2e/person-km","scope":"construction-energy","construction":0.00318,"energy":0.0066,"source":"https://impactco2.fr/outils/transport/rer"},{"id":"ter","mode":"train","label":"TER","unit":"kgCO2e/person-km","scope":"construction-energy","construction":0.00479,"energy":0.0229,"source":"https://impactco2.fr/outils/transport/ter"},{"id":"buselectrique","mode":"bus","label":"Bus électrique","unit":"kgCO2e/person-km","scope":"construction-energy","construction":0.0122,"energy":0.0095,"source":"https://impactco2.fr/outils/transport/buselectrique"},{"id":"voiture-citadine-essence","mode":"car","label":"Petite — Essence E5 / E10","unit":"kgCO2e/vehicle-km","scope":"construction-energy","construction":0.027733695652173936,"energy":0.1169810600556303,"source":"https://impactco2.fr/outils/transport/voiture-citadine-essence"},{"id":"voiture-citadine-diesel","mode":"car","label":"Petite — Diesel B7 / B10","unit":"kgCO2e/vehicle-km","scope":"construction-energy","construction":0.027733695652173936,"energy":0.09416971630563031,"source":"https://impactco2.fr/outils/transport/voiture-citadine-diesel"},{"id":"voiture-citadine-electrique","mode":"car","label":"Petite — Électrique","unit":"kgCO2e/vehicle-km","scope":"construction-energy","construction":0.046089130434782626,"energy":0.011504485055630311,"source":"https://impactco2.fr/outils/transport/voiture-citadine-electrique"},{"id":"voiture-citadine-hybride","mode":"car","label":"Petite — Hybride non rechargeable","unit":"kgCO2e/vehicle-km","scope":"construction-energy","construction":0.02919796195652175,"energy":0.1060514350556303,"source":"https://impactco2.fr/outils/transport/voiture-citadine-hybride"},{"id":"voiture-citadine-hybriderechargeable","mode":"car","label":"Petite — Hybride rechargeable","unit":"kgCO2e/vehicle-km","scope":"construction-energy","construction":0.03677027173913044,"energy":0.09211716005563031,"source":"https://impactco2.fr/outils/transport/voiture-citadine-hybriderechargeable"},{"id":"voiture-compact-essence","mode":"car","label":"Moyenne — Essence E5 / E10","unit":"kgCO2e/vehicle-km","scope":"construction-energy","construction":0.03169565217391306,"energy":0.1380123725556303,"source":"https://impactco2.fr/outils/transport/voiture-compact-essence"},{"id":"voiture-compact-diesel","mode":"car","label":"Moyenne — Diesel B7 / B10","unit":"kgCO2e/vehicle-km","scope":"construction-energy","construction":0.03169565217391306,"energy":0.1105577600556303,"source":"https://impactco2.fr/outils/transport/voiture-compact-diesel"},{"id":"voiture-compact-electrique","mode":"car","label":"Moyenne — Électrique","unit":"kgCO2e/vehicle-km","scope":"construction-energy","construction":0.05527690217391306,"energy":0.01208836005563031,"source":"https://impactco2.fr/outils/transport/voiture-compact-electrique"},{"id":"voiture-compact-hybride","mode":"car","label":"Moyenne — Hybride non rechargeable","unit":"kgCO2e/vehicle-km","scope":"construction-energy","construction":0.03315991847826087,"energy":0.1134194350556303,"source":"https://impactco2.fr/outils/transport/voiture-compact-hybride"},{"id":"voiture-compact-hybriderechargeable","mode":"car","label":"Moyenne — Hybride rechargeable","unit":"kgCO2e/vehicle-km","scope":"construction-energy","construction":0.04073222826086956,"energy":0.0931681350556303,"source":"https://impactco2.fr/outils/transport/voiture-compact-hybriderechargeable"},{"id":"voiture-berline-essence","mode":"car","label":"Berline — Essence E5 / E10","unit":"kgCO2e/vehicle-km","scope":"construction-energy","construction":0.03961956521739131,"energy":0.1496510600556303,"source":"https://impactco2.fr/outils/transport/voiture-berline-essence"},{"id":"voiture-berline-diesel","mode":"car","label":"Berline — Diesel B7 / B10","unit":"kgCO2e/vehicle-km","scope":"construction-energy","construction":0.03961956521739131,"energy":0.1437828350556303,"source":"https://impactco2.fr/outils/transport/voiture-berline-diesel"},{"id":"voiture-berline-electrique","mode":"car","label":"Berline — Électrique","unit":"kgCO2e/vehicle-km","scope":"construction-energy","construction":0.0759790760869565,"energy":0.014735260055630313,"source":"https://impactco2.fr/outils/transport/voiture-berline-electrique"},{"id":"voiture-berline-hybride","mode":"car","label":"Berline — Hybride non rechargeable","unit":"kgCO2e/vehicle-km","scope":"construction-energy","construction":0.041083831521739125,"energy":0.12976718505563029,"source":"https://impactco2.fr/outils/transport/voiture-berline-hybride"},{"id":"voiture-berline-hybriderechargeable","mode":"car","label":"Berline — Hybride rechargeable","unit":"kgCO2e/vehicle-km","scope":"construction-energy","construction":0.048656141304347804,"energy":0.11580859130563032,"source":"https://impactco2.fr/outils/transport/voiture-berline-hybriderechargeable"},{"id":"voiture-grandeberline-essence","mode":"car","label":"SUV — Essence E5 / E10","unit":"kgCO2e/vehicle-km","scope":"construction-energy","construction":0.03961956521739131,"energy":0.2066193725556303,"source":"https://impactco2.fr/outils/transport/voiture-grandeberline-essence"},{"id":"voiture-grandeberline-diesel","mode":"car","label":"SUV — Diesel B7 / B10","unit":"kgCO2e/vehicle-km","scope":"construction-energy","construction":0.03961956521739131,"energy":0.1300887163056303,"source":"https://impactco2.fr/outils/transport/voiture-grandeberline-diesel"},{"id":"voiture-grandeberline-electrique","mode":"car","label":"SUV — Électrique","unit":"kgCO2e/vehicle-km","scope":"construction-energy","construction":0.08024456521739132,"energy":0.014112460055630311,"source":"https://impactco2.fr/outils/transport/voiture-grandeberline-electrique"},{"id":"voiture-grandeberline-hybride","mode":"car","label":"SUV — Hybride non rechargeable","unit":"kgCO2e/vehicle-km","scope":"construction-energy","construction":0.041083831521739125,"energy":0.1408191850556303,"source":"https://impactco2.fr/outils/transport/voiture-grandeberline-hybride"},{"id":"voiture-grandeberline-hybriderechargeable","mode":"car","label":"SUV — Hybride rechargeable","unit":"kgCO2e/vehicle-km","scope":"construction-energy","construction":0.048656141304347804,"energy":0.1373241350556303,"source":"https://impactco2.fr/outils/transport/voiture-grandeberline-hybriderechargeable"}]};
const CARBON_SCOPES={'construction-energy':'Construction et énergie modélisées','construction':'Construction seule (vélo mécanique)'};
function unavailableCarbon(){return {version:'unavailable-v1',status:'unavailable',valueKg:null,factor:null}}
function carbonInput(e){return {mode:e.mode,distanceMeters:e.distanceMeters,start:e.start,end:e.end,date:e.date}}
function estimateCarbon(entry,factorId,occupants,at){
 const factor=CARBON_DATA.factors.find(f=>f.id===factorId&&journalFactorCompatible(f,entry.mode));
 if(!factor)throw new Error('Choisir un facteur compatible avec le mode.');
 if(entry.distanceMeters===null)throw new Error('Renseigner la distance pour estimer les émissions.');
 journalNumber(entry.distanceMeters,40000000);journalDate(entry.date);journalInstant(at);
 const vehicle=factor.unit==='kgCO2e/vehicle-km';
 if(vehicle&&(!Number.isInteger(occupants)||occupants<1||occupants>9))throw new Error('Indiquer de 1 à 9 occupants, conducteur compris.');
 const total=(entry.distanceMeters/1000)*(factor.construction+factor.energy);
 return {version:'impact-estimate-v1',status:'estimated',dataset:CARBON_DATA.version,factor:structuredClone(factor),input:carbonInput(entry),occupants:vehicle?occupants:null,vehicleKg:vehicle?total:null,valueKg:vehicle?total/occupants:total,calculatedAt:at};
}
function validateCarbon(c){
 if(c?.version==='unavailable-v1'&&c.status==='unavailable'&&c.valueKg===null&&c.factor===null)return unavailableCarbon();
 if(!c||c.version!=='impact-estimate-v1'||c.status!=='estimated'||c.dataset!==CARBON_DATA.version||!c.input)throw new Error('Version de calcul carbone non reconnue.');
 const i=c.input,input={mode:i.mode,distanceMeters:i.distanceMeters,date:journalDate(i.date),start:journalText(i.start,1000,true),end:journalText(i.end,1000,true)};
 const expected=estimateCarbon(input,c.factor?.id,c.occupants,journalInstant(c.calculatedAt));
 if(Object.keys(expected.factor).some(k=>c.factor[k]!==expected.factor[k])||c.valueKg!==expected.valueKg||c.vehicleKg!==expected.vehicleKg||c.occupants!==expected.occupants)throw new Error('Estimation carbone incohérente.');
 return expected;
}
function currentCarbon(e){return e.emissions?.status==='estimated'&&JSON.stringify(carbonInput(e))===JSON.stringify(carbonInput(e.emissions.input))}
function reviseCarbon(entry,previous,choice,at){
 entry.emissions=structuredClone(previous.emissions);entry.emissionsHistory=structuredClone(previous.emissionsHistory??[]);
 const changed=previous.emissions.status==='estimated'&&!currentCarbon(entry);
 if(choice||changed){
  if(entry.emissions.status==='estimated'){
   if(entry.emissionsHistory.length>=50)throw new Error('Limite de 50 estimations historiques atteinte. Exporter cette entrée avant une nouvelle révision.');
   entry.emissionsHistory.push({archivedAt:at,reason:choice?'Actualisation demandée':'Correction des données du trajet',estimate:entry.emissions});
  }
  entry.emissions=choice?estimateCarbon(entry,choice.factorId,choice.occupants,at):unavailableCarbon();
 }
 return entry;
}

const JOURNAL_MODES={car:'Voiture',truck:'Poids lourd',train:'Train',bus:'Bus / car',bike:'Vélo',walk:'Marche',other:'Autre',collective:'Trajet collectif à étapes',shared:'Marche et vélo partagé'};
// Collective entries retain one journey and an ordered list of declared steps.
const JOURNAL_STEP_MODES={walk:'Marche',bus:'Bus / car',train:'Train',tram:'Tram',metro:'Métro',funicular:'Funiculaire',cable:'Téléphérique / télécabine',other:'Autre'};
const JOURNAL_STEP_FACTORS={bike:['velo','veloelectrique'],walk:[],bus:['busthermique','buselectrique','autocar'],train:['tgv','intercites','ter','rer'],tram:['tramway'],metro:['metro'],funicular:[],cable:[],other:[]};
const JOURNAL_SHARED_MODES={walk:'Marche',bike:'Vélo',other:'Autre'};
function journalIsStaged(e){return e?.mode==='collective'||e?.mode==='shared'}
function journalChain(e){return e[e.mode]}
function journalStageModes(e){return e.mode==='shared'?JOURNAL_SHARED_MODES:JOURNAL_STEP_MODES}
function validateSharedJournalOrigin(o){
 if(!o||o.version!=='shared-bike-origin-v1'||o.source!=='lyon-shared-bike'||!o.stations||!Array.isArray(o.steps)||o.steps.length!==3)throw new Error('Origine marche et vélo partagé inconnue.');
 const capturedAt=journalInstant(o.capturedAt),start=journalText(o.start,1000,true),end=journalText(o.end,1000,true),stations={};
 for(const role of ['pickup','dropoff']){const s=o.stations[role];if(!s)throw new Error('Station historique absente.');stations[role]={id:journalText(s.id,100,true),name:journalText(s.name,200,true)}}
 if(stations.pickup.id===stations.dropoff.id)throw new Error('Stations historiques identiques.');
 const times={};for(const k of ['rentMinutes','returnMinutes'])times[k]=o[k]===null?null:journalNumber(o[k],120);
 const labels=[start,stations.pickup.name,stations.dropoff.name,end];
 const steps=o.steps.map((s,i)=>{
  if(!s||s.mode!==['walk','bike','walk'][i]||!['ign-pedestrian','same-point','fossgis-bike'].includes(s.source)||(i===1)!==(s.source==='fossgis-bike'))throw new Error('Mode ou source d’origine incohérent.');
  const distanceMeters=journalNumber(s.distanceMeters,300000),durationSeconds=journalNumber(s.durationSeconds,604800),pushingMeters=journalNumber(s.pushingMeters,300300),calculatedAt=journalInstant(s.calculatedAt);
  if(Date.parse(calculatedAt)>Date.parse(capturedAt)||s.start!==labels[i]||s.end!==labels[i+1]||s.line!=='')throw new Error('Lieux ou dates d’origine incohérents.');
  if(s.source==='same-point'?(distanceMeters!==0||durationSeconds!==0):(distanceMeters<=0||durationSeconds<=0))throw new Error('Mesures d’origine incohérentes.');
  if(i!==1?pushingMeters!==0:pushingMeters>distanceMeters+Math.max(10,distanceMeters*.001))throw new Error('Distance vélo à la main incohérente.');
  return {mode:s.mode,source:s.source,start:labels[i],end:labels[i+1],line:'',distanceMeters,durationSeconds,pushingMeters,calculatedAt,resourceVersion:s.resourceVersion===null?null:journalText(s.resourceVersion,150,true)};
 });
 return {version:'shared-bike-origin-v1',source:'lyon-shared-bike',capturedAt,start,end,stations,...times,steps};
}
function sharedJournalDraft(preparation,now,id){
 const p=preparation,s=p.snapshot,labels=[p.places.start.label,p.stations.pickup.name,p.stations.dropoff.name,p.places.end.label];
 const origin=validateSharedJournalOrigin({version:'shared-bike-origin-v1',source:s.source,capturedAt:s.capturedAt,start:labels[0],end:labels[3],stations:p.stations,rentMinutes:p.criteria.rentMinutes,returnMinutes:p.criteria.returnMinutes,steps:s.parts.map((v,i)=>({mode:v.mode,source:v.source,start:labels[i],end:labels[i+1],line:'',distanceMeters:v.distance,durationSeconds:v.duration,pushingMeters:v.pushing??0,calculatedAt:v.at,resourceVersion:typeof v.version==='string'&&!v.version.trim()?null:v.version??null}))});
 const key=journalText(id,70,true),at=journalInstant(now),steps=origin.steps.map((s,i)=>({id:key+'-'+i,mode:s.mode,start:s.start,end:s.end,line:'',distanceMeters:s.distanceMeters,included:true,emissions:unavailableCarbon(),emissionsHistory:[]}));
 return {id:key,date:'',start:origin.start,end:origin.end,mode:'shared',distanceMeters:journalTotalDistance(steps),distanceSource:'declared',note:'',createdAt:at,updatedAt:at,revision:1,calculation:null,emissions:unavailableCarbon(),emissionsHistory:[],shared:{version:1,origin,steps}};
}

function journalFactorCompatible(f,mode){return f.mode===mode||mode==='tram'&&f.id==='tramway'||mode==='metro'&&f.id==='metro'}
function journalStepInput(e,s){return {date:e.date,start:s.start,end:s.end,mode:s.mode,distanceMeters:s.distanceMeters}}
function journalSegments(e){return journalIsStaged(e)?journalChain(e).steps.filter(s=>s.included).map(s=>({...s,date:e.date})): [e]}
function journalKnownMeters(e){return journalSegments(e).reduce((n,s)=>n+(s.distanceMeters??0),0)}
function journalAllCarbon(e){return journalSegments(e).every(currentCarbon)}
function journalTotalDistance(steps){return steps.some(s=>s.distanceMeters===null)?null:steps.reduce((n,s)=>n+s.distanceMeters,0)}
function validateJournalHistory(history){
 if(!Array.isArray(history)||history.length>50)throw new Error('Historique carbone invalide.');
 return history.map(h=>{const estimate=validateCarbon(h.estimate),archivedAt=journalInstant(h.archivedAt);if(estimate.status!=='estimated'||archivedAt<estimate.calculatedAt||!['Actualisation demandée','Correction des données du trajet'].includes(h.reason))throw new Error('Historique carbone incohérent.');return {archivedAt,reason:h.reason,estimate}});
}
function validateJournalCollective(c,e){
 if(!c||c.version!==1||!c.origin||!Array.isArray(c.steps)||c.steps.length<1||c.steps.length>30)throw new Error('Étapes collectives invalides.');
 const o=c.origin;if(e.mode!=='shared'&&(o.source!=='mobilites-m'||!Array.isArray(o.steps)||o.steps.length<1||o.steps.length>30))throw new Error('Origine collective inconnue.');
 const simple=s=>{if(!s||!Object.hasOwn(journalStageModes(e),s.mode))throw new Error('Mode d’étape inconnu.');return {mode:s.mode,start:journalText(s.start,1000,true),end:journalText(s.end,1000,true),line:journalText(s.line,150),distanceMeters:s.distanceMeters===null?null:journalNumber(s.distanceMeters,e.mode==='shared'?300000:150000)}};
 const origin=e.mode==='shared'?validateSharedJournalOrigin(o):{source:o.source,calculatedAt:journalInstant(o.calculatedAt),departure:journalInstant(o.departure),arrival:journalInstant(o.arrival),start:journalText(o.start,1000,true),end:journalText(o.end,1000,true),steps:Array.from(o.steps,simple)};
 if(e.mode!=='shared'&&origin.arrival<origin.departure)throw new Error('Heures de préparation incohérentes.');
 const steps=Array.from(c.steps,s=>{const a=simple(s);if(typeof s.included!=='boolean')throw new Error('Déclaration d’étape manquante.');a.included=s.included;a.id=journalText(s.id,80,true);if(!/^[A-Za-z0-9-]+$/.test(a.id))throw new Error('Identifiant d’étape invalide.');a.emissions=validateCarbon(s.emissions);a.emissionsHistory=validateJournalHistory(s.emissionsHistory??[]);if(a.emissions.status==='estimated'&&(!a.included||!JOURNAL_STEP_FACTORS[a.mode].includes(a.emissions.factor.id)||!currentCarbon({...a,date:e.date})))throw new Error('Empreinte non conforme à l’étape.');return a});
 if(new Set(steps.map(s=>s.id)).size!==steps.length)throw new Error('Étapes dupliquées.');
 if(!steps.some(s=>s.included))throw new Error('Déclarer au moins une étape effectuée.');
 const distance=journalTotalDistance(steps.filter(s=>s.included));if(e.distanceMeters!==distance||e.distanceSource!==(distance===null?'unknown':'declared')||e.calculation!==null||e.emissions.status!=='unavailable'||e.emissionsHistory.length)throw new Error('Bilan collectif incohérent.');
 return {version:1,origin,steps};
}

function journalDay(date=new Date()){return [date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-')}
function journalDate(value){if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value)||value<'1900-01-01'||!Number.isFinite(Date.parse(value+'T12:00:00Z'))||new Date(value+'T12:00:00Z').toISOString().slice(0,10)!==value)throw new Error('Date invalide.');return value}
function journalText(value,max,required=false){if(typeof value!=='string'||value.length>max||(required&&!value.trim()))throw new Error('Texte du journal invalide.');return value.trim()}
function journalNumber(value,max){if(typeof value!=='number'||!Number.isFinite(value)||value<0||value>max)throw new Error('Distance invalide.');return value}
function journalInstant(value){if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}T/.test(value)||!Number.isFinite(Date.parse(value))||new Date(value).toISOString()!==value)throw new Error('Horodatage invalide.');return value}
function journalIdentity(e){const norm=s=>s.trim().replace(/\s+/g,' ').toLocaleLowerCase('fr-FR');return JSON.stringify([e.date,e.mode,norm(e.start),norm(e.end),e.distanceMeters])}
function validateJournalCalculation(c,version){
 if(!c)throw new Error('Calcul historique inconnu.');
 if(c.version==='cycle-snapshot-v1'){
  if(version!==3||c.engine!=='fossgis-bike'||c.mode!=='bike'||c.stop!==null)throw new Error('Calcul cyclable historique non reconnu.');
  const distanceMeters=journalNumber(c.distanceMeters,300000),durationSeconds=journalNumber(c.durationSeconds,604800),pushingMeters=journalNumber(c.pushingMeters,300300);
  if(distanceMeters<1||durationSeconds<1||pushingMeters>distanceMeters+Math.max(10,distanceMeters*.001))throw new Error('Mesures cyclables historiques incohérentes.');
  return {version:c.version,engine:c.engine,start:journalText(c.start,1000,true),end:journalText(c.end,1000,true),resourceVersion:c.resourceVersion===null?null:journalText(c.resourceVersion,150,true),calculatedAt:journalInstant(c.calculatedAt),mode:'bike',distanceMeters,durationSeconds,pushingMeters,stop:null};
 }
 if(c.version!=='route-snapshot-v1'||!['car','truck','walk'].includes(c.mode)||!['ign','osrm','ors'].includes(c.engine))throw new Error('Calcul historique inconnu.');
 return {version:c.version,engine:c.engine,start:journalText(c.start,1000,true),end:journalText(c.end,1000,true),resourceVersion:c.resourceVersion===null?null:journalText(c.resourceVersion,150,true),calculatedAt:journalInstant(c.calculatedAt),mode:c.mode,distanceMeters:journalNumber(c.distanceMeters,40000000),stop:c.stop===null?null:journalText(c.stop,500,true)};
}
function cycleJournalDraft(route,places,calculatedAt,now,id){
 const calculation=validateJournalCalculation({version:'cycle-snapshot-v1',engine:'fossgis-bike',start:places.start,end:places.end,resourceVersion:typeof route.dataVersion==='string'&&!route.dataVersion.trim()?null:route.dataVersion??null,calculatedAt,mode:'bike',distanceMeters:route.distance,durationSeconds:route.duration,pushingMeters:route.pushingMeters,stop:null},3);
 return {id:journalText(id,80,true),date:'',start:calculation.start,end:calculation.end,mode:'bike',distanceMeters:calculation.distanceMeters,distanceSource:'route',note:'',createdAt:journalInstant(now),updatedAt:now,revision:1,calculation,emissions:unavailableCarbon(),emissionsHistory:[]};
}

function emptyJournal(){return {version:3,enabled:false,entries:[]}}
function validateJournal(data){
 if(!data||![1,2,3].includes(data.version)||typeof data.enabled!=='boolean'||!Array.isArray(data.entries)||data.entries.length>1000)throw new Error('Format ou capacité du journal invalide.');
 const entries=data.entries.map(e=>{
  if(!e||(journalIsStaged(e)&&data.version!==3)||!Object.hasOwn(JOURNAL_MODES,e.mode)||!['route','declared','unknown'].includes(e.distanceSource)||!Number.isSafeInteger(e.revision)||e.revision<1||e.revision>100000)throw new Error('Entrée de journal invalide.');
  const clean={id:journalText(e.id,80,true),date:journalDate(e.date),start:journalText(e.start,1000,true),end:journalText(e.end,1000,true),mode:e.mode,distanceMeters:e.distanceMeters===null?null:journalNumber(e.distanceMeters,40000000),distanceSource:e.distanceSource,note:journalText(e.note,500),createdAt:journalInstant(e.createdAt),updatedAt:journalInstant(e.updatedAt),revision:e.revision,calculation:null,emissions:{version:'unavailable-v1',status:'unavailable',valueKg:null,factor:null}};
  if(!/^[A-Za-z0-9-]+$/.test(clean.id)||clean.updatedAt<clean.createdAt||(clean.distanceMeters===null)!==(clean.distanceSource==='unknown'))throw new Error('Entrée incohérente.');
  if(e.calculation!==null)clean.calculation=validateJournalCalculation(e.calculation,data.version);
  if(clean.distanceSource==='route'&&(!clean.calculation||clean.distanceMeters!==clean.calculation.distanceMeters||clean.mode!==clean.calculation.mode||clean.start!==clean.calculation.start||clean.end!==clean.calculation.end))throw new Error('Distance incohérente avec le calcul.');
  if(data.version===1&&e.emissions?.version!=='unavailable-v1')throw new Error('Ancien journal incohérent.');
  clean.emissions=validateCarbon(e.emissions);
  if(clean.emissions.status==='estimated'&&!currentCarbon(clean))throw new Error('Estimation non conforme au trajet.');
  clean.emissionsHistory=validateJournalHistory(e.emissionsHistory??[]);
  if(journalIsStaged(clean))clean[clean.mode]=validateJournalCollective(e[clean.mode],clean);
  if((e.collective!=null&&e.mode!=='collective')||(e.shared!=null&&e.mode!=='shared'))throw new Error('Étapes inattendues pour ce mode.');
  return clean;
 });
 if(new Set(entries.map(e=>e.id)).size!==entries.length)throw new Error('Identifiants de journal dupliqués.');
 const clean={version:3,enabled:data.enabled,entries};if(new TextEncoder().encode(JSON.stringify(clean,null,2)).length>2000000)throw new Error('Journal trop volumineux : exporter avant de libérer de la place.');return clean;
}
function journalMonthly(entries,month){
 const rows=entries.filter(e=>e.date.slice(0,7)===month),modes={},carbonGroups={};let segments=0,missingSegments=0;
 for(const e of rows){const seenModes=new Set(),seenScopes=new Set();
  for(const part of journalSegments(e)){segments++;const m=modes[part.mode]??={count:0,segments:0,meters:0,unknown:0,carbonGroups:{},carbonUnknown:0};m.segments++;if(!seenModes.has(part.mode)){m.count++;seenModes.add(part.mode)}
   if(part.distanceMeters===null){m.unknown++;missingSegments++}else m.meters+=part.distanceMeters;
   if(currentCarbon(part)){const scope=part.emissions.factor.scope,g=m.carbonGroups[scope]??={valueKg:0,count:0},all=carbonGroups[scope]??={valueKg:0,count:0};g.valueKg+=part.emissions.valueKg;g.count++;all.valueKg+=part.emissions.valueKg;if(!seenScopes.has(scope)){all.count++;seenScopes.add(scope)}}else m.carbonUnknown++;
  }
 }
 return {count:rows.length,meters:rows.reduce((n,e)=>n+journalKnownMeters(e),0),unknown:rows.filter(e=>e.distanceMeters===null).length,carbonUnknown:rows.filter(e=>!journalAllCarbon(e)).length,carbonGroups,modes,segments,missingSegments};
}
function planJournalImport(current,incoming,mode,choices={},copyId=i=>'copy-'+i){
 const base=validateJournal(current),source=validateJournal(incoming);
 if(!['merge','replace'].includes(mode))throw new Error('Choix d’import invalide.');
 const entries=mode==='replace'?[]:structuredClone(base.entries),rows=[],byId=new Map(),byIdentity=new Map();
 function index(e){byId.set(e.id,e);const k=journalIdentity(e),list=byIdentity.get(k)||[];list.push(e);byIdentity.set(k,list)}
 entries.forEach(index);let added=0,identical=0,skipped=0,unresolved=0,copies=0;
 source.entries.forEach((e,i)=>{
  const existing=byId.get(e.id),related=existing?[existing]:(byIdentity.get(journalIdentity(e))||[]);
  let kind=mode==='replace'?'restore':existing?(JSON.stringify(e)===JSON.stringify(existing)?'identical':'conflict'):related.length?'duplicate':'new',choice=choices[i]??'',accept=false,copy=false;
  if(['restore','new'].includes(kind))accept=true;
  else if(kind==='identical')identical++;
  else if(choice==='skip')skipped++;
  else if((kind==='conflict'&&choice==='both')||(kind==='duplicate'&&choice==='add')){accept=true;copy=kind==='conflict'}
  else {choice='';unresolved++}
  rows.push({entry:e,index:i,kind,choice,related:related.slice(0,3),relatedCount:related.length});
  if(accept){const next=structuredClone(e);if(copy){next.id=copyId(i);if(byId.has(next.id)||source.entries.some(x=>x.id===next.id))throw new Error('Identifiant de copie déjà utilisé.');copies++}entries.push(next);index(next);added++}
 });
 let next=null,error='';try{const validated=validateJournal({version:3,enabled:base.enabled,entries});if(!unresolved)next=validated}catch(e){error=e.message}
 return {rows,next,error,added,identical,skipped,unresolved,copies,changed:!!next&&JSON.stringify(next)!==JSON.stringify(base)};
}

// END JOURNAL MODEL
const JOURNAL_KEY='dragonroute.journal.v3.'+PROFILE_SCOPE,V2_JOURNAL_KEY='dragonroute.journal.v2.'+PROFILE_SCOPE,LEGACY_JOURNAL_KEY='dragonroute.journal.v1.'+PROFILE_SCOPE;
let journal=emptyJournal(),journalSnapshot=null,journalV2Snapshot=null,journalLegacySnapshot=null,journalBlocked=false,journalNotice='',journalDraft=null;
function loadJournal(){
 journal=emptyJournal();journalBlocked=false;journalNotice='';
 try{journalSnapshot=localStorage.getItem(JOURNAL_KEY);journalV2Snapshot=localStorage.getItem(V2_JOURNAL_KEY);journalLegacySnapshot=localStorage.getItem(LEGACY_JOURNAL_KEY);const raw=journalSnapshot??journalV2Snapshot??journalLegacySnapshot;if(raw!==null)journal=validateJournal(JSON.parse(raw));if(journalSnapshot===null&&(journalV2Snapshot!==null||journalLegacySnapshot!==null))journalNotice='Ancien journal repris. Sa copie d’origine reste conservée ; aucune émission historique n’est recalculée automatiquement.'}
 catch{journalBlocked=true;journalNotice='Journal non chargé : format inconnu, données invalides ou stockage inaccessible. L’original est conservé. Recharger avec une version compatible ou effacer explicitement le journal.'}
}
function writeJournal(next){
 try{
  if(journalBlocked)throw new Error('Journal non chargé : écriture bloquée.');
  if(localStorage.getItem(JOURNAL_KEY)!==journalSnapshot||localStorage.getItem(V2_JOURNAL_KEY)!==journalV2Snapshot||localStorage.getItem(LEGACY_JOURNAL_KEY)!==journalLegacySnapshot)throw new Error('Journal modifié dans un autre onglet. Recharger avant de réessayer.');
  const clean=validateJournal(next),raw=JSON.stringify(clean);localStorage.setItem(JOURNAL_KEY,raw);journalSnapshot=raw;journal=clean;journalNotice='';return true;
 }catch(e){$('journalMessage').textContent='Enregistrement impossible. '+(journalBlocked||e.message.includes('autre onglet')||e.message.includes('volumineux')?e.message:'Stockage indisponible, plein ou données invalides. Le formulaire et les données précédentes sont conservés.');return false}
}
function renderJournal(){
 $('journalCollectivePending').textContent=pendingCollectiveJournal?.mode==='shared'?'Examiner le brouillon marche et vélo partagé':'Examiner le brouillon collectif';
 $('journalEnable').checked=journal.enabled;$('journalEnable').disabled=journalBlocked;
 $('journalNew').disabled=!journal.enabled||journalBlocked;if($('journalCollectivePending'))$('journalCollectivePending').hidden=!pendingCollectiveJournal||!journal.enabled||journalBlocked;$('journalCyclePending').hidden=!pendingCycleJournal||!journal.enabled||journalBlocked;$('journalCopy').disabled=!journal.enabled||journalBlocked||!trip||busy;
 $('journalExport').disabled=journalBlocked;$('journalImportBtn').disabled=journalBlocked;$('journalExportLegacy').hidden=journalLegacySnapshot===null;$('journalExportV2').hidden=journalV2Snapshot===null;
 $('journalState').textContent=journal.enabled?'Journal activé. Chaque ajout reste volontaire.':'Journal désactivé. Les entrées déjà enregistrées restent consultables et exportables.';
 const month=$('journalMonth').value;if(!/^\d{4}-\d{2}$/.test(month)){$('journalSummary').textContent='Choisir un mois valide.';$('journalCarbonSummary').textContent='';$('journalModes').replaceChildren();$('journalEntries').replaceChildren();return}
 const total=journalMonthly(journal.entries,month),km=n=>fmt(n/1000,2)+' km';
 $('journalSummary').textContent=`${total.count} trajet(s) confirmé(s) · ${km(total.meters)} renseignés${total.unknown?` · bilan partiel : ${total.unknown} distance(s) non renseignée(s)`:''}. ${total.count?(!Object.keys(total.carbonGroups).length?'CO₂e non estimé.':`Empreinte partielle : ${total.count-total.carbonUnknown}/${total.count} trajet(s) entièrement estimé(s) dans le périmètre du modèle.`):'Aucun déplacement confirmé ce mois-ci.'}`;
 $('journalCarbonSummary').textContent=Object.entries(total.carbonGroups).map(([scope,g])=>`${CARBON_SCOPES[scope]} : ${carbonAmount(g.valueKg)} pour ${g.count} trajet(s), part individuelle.`).join(' ') + (total.count?` ${total.carbonUnknown} trajet(s) sans estimation complète. ${total.missingSegments} distance(s) d’étape manquante(s). Les sous-totaux incluent uniquement les étapes estimées. Un voyage avec plusieurs modes apparaît dans chaque mode ; il n’est compté qu’une fois dans le total. Périmètres présentés séparément ; ce bilan ne constitue pas une empreinte complète.`:'');
 $('journalModes').replaceChildren();for(const [mode,m] of Object.entries(total.modes)){const li=document.createElement('li');li.textContent=`${JOURNAL_MODES[mode]??JOURNAL_STEP_MODES[mode]} : ${m.count} trajet(s), ${m.segments} étape(s), ${km(m.meters)} renseignés${m.unknown?`, ${m.unknown} distance(s) d’étape manquante(s)`:''}. ${Object.entries(m.carbonGroups).map(([scope,g])=>`${CARBON_SCOPES[scope]} : ${carbonAmount(g.valueKg)} pour une personne`).join(' ; ')}${m.carbonUnknown?' · '+m.carbonUnknown+' étape(s) sans estimation':''}.`;$('journalModes').append(li)}
 $('journalEntries').innerHTML=journal.entries.filter(e=>e.date.slice(0,7)===month).sort((a,b)=>b.date.localeCompare(a.date)||b.createdAt.localeCompare(a.createdAt)||a.id.localeCompare(b.id)).map(e=>`<article class="saved-row"><h3>${escapeHtml(e.start)} → ${escapeHtml(e.end)}</h3><p>${escapeHtml(e.date.split('-').reverse().join('/'))} · ${JOURNAL_MODES[e.mode]} · ${e.distanceMeters===null?'Distance non renseignée':km(e.distanceMeters)}</p><p>${e.distanceSource==='route'?'Distance issue du trajet préparé, confirmée par la personne':e.distanceSource==='declared'?'Distance déclarée par la personne':'Distance à compléter'} · ${journalIsStaged(e)?'Empreinte détaillée par étape':currentCarbon(e)?carbonAmount(e.emissions.valueKg)+' estimés pour une personne':'CO₂e non estimé'}.</p>${journalIsStaged(e)?collectiveJournalDetails(e):''}${e.calculation?.version==='cycle-snapshot-v1'?`<p class="note">${escapeHtml(cycleJournalOrigin(e.calculation))}</p>`:''}${e.note?`<p>${escapeHtml(e.note)}</p>`:''}<details><summary>Provenance et révision</summary><p>Confirmé le ${escapeHtml(new Date(e.createdAt).toLocaleString('fr-FR'))}. Révision ${e.revision}, mise à jour ${escapeHtml(new Date(e.updatedAt).toLocaleString('fr-FR'))}.</p><p>${e.calculation?`Calcul d’origine ${escapeHtml(e.calculation.start)} → ${escapeHtml(e.calculation.end)} · ${escapeHtml(e.calculation.engine.toUpperCase())} · ${escapeHtml(e.calculation.calculatedAt)} · ${km(e.calculation.distanceMeters)} · données ${escapeHtml(e.calculation.resourceVersion??'version non fournie')}${e.calculation.stop?' · arrêt '+escapeHtml(e.calculation.stop):''}. Ce calcul ne prouve pas le déplacement effectué.`:journalIsStaged(e)?'Origine et étapes détaillées ci-dessus.':'Saisie manuelle, sans calcul d’itinéraire associé.'}</p><p>Les corrections conservent le calcul d’itinéraire d’origine.</p></details>${journalCarbonMarkup(e)}<div class="dialog-actions"><button class="ghost" data-journal-edit="${e.id}" ${!journal.enabled?'disabled':''}>Modifier</button><button class="ghost" data-journal-delete="${e.id}">Supprimer</button></div></article>`).join('')||'<p class="note">Aucun trajet dans ce mois.</p>';
}
function carbonAmount(n){return n===0?'0 kg CO₂e':n<0.001?'< 0,001 kg CO₂e':fmt(n,3)+' kg CO₂e'}
function carbonDetails(c){
 if(c.status!=='estimated')return '<p>CO₂e non estimé. Une distance et un facteur compatible sont nécessaires.</p>';
 const f=c.factor,vehicle=f.unit==='kgCO2e/vehicle-km',rate=f.construction+f.energy;
 return `<p><strong>Part individuelle estimée : ${carbonAmount(c.valueKg)}</strong></p><p>${escapeHtml(f.label)} · ${fmt(c.input.distanceMeters/1000,3)} km × ${fmt(rate,6)} ${vehicle?'kg CO₂e / véhicule-km':'kg CO₂e / personne-km'}${vehicle?' ÷ '+c.occupants+' occupant(s), conducteur compris':''}.</p>${vehicle?`<p>Véhicule entier : ${carbonAmount(c.vehicleKg)}. Partage à parts égales ; ce total n’est pas ajouté à la part individuelle.</p>`:'<p>Facteur déjà exprimé par personne : aucune nouvelle division par le nombre de voyageurs.</p>'}<p>${CARBON_SCOPES[f.scope]} : fabrication ${fmt(f.construction,6)}, énergie ${fmt(f.energy,6)} kg CO₂e/km. Valeurs moyennes ; aucune correction selon la consommation réelle, la météo ou le chargement.${f.mode==='bike'?' Alimentation humaine exclue pour le vélo.':''} Aucune empreinte totale du mode n’est revendiquée.</p><p><a href="${f.source}" target="_blank" rel="noopener noreferrer">Source : ADEME / Impact CO₂</a> · jeu figé ${CARBON_DATA.retrievedAt} · version ${escapeHtml(c.dataset)} · calcul ${escapeHtml(c.calculatedAt)}.</p>`;
}
function journalCarbonMarkup(e){
 if(journalIsStaged(e))return '';
 const history=e.emissionsHistory??[];
 return `<details><summary>Empreinte et méthode${history.length?' · '+history.length+' estimation(s) conservée(s)':''}</summary>${carbonDetails(e.emissions)}${history.map(h=>`<details><summary>Estimation précédente — ${escapeHtml(h.archivedAt)}</summary><p>${escapeHtml(h.reason)} · ${escapeHtml(h.estimate.input.start)} → ${escapeHtml(h.estimate.input.end)} · ${escapeHtml(h.estimate.input.date)}. Exclue du bilan courant.</p>${carbonDetails(h.estimate)}</details>`).join('')}</details>`;
}
function carbonDraftInput(){return {mode:$('journalMode').value,distanceMeters:$('journalDistance').value.trim()===''?null:Number($('journalDistance').value)*1000,start:$('journalStart').value.trim(),end:$('journalEnd').value.trim(),date:$('journalDate').value}}
function refreshCarbonChoices(){
 const mode=$('journalMode').value,factors=CARBON_DATA.factors.filter(f=>f.mode===mode),old=$('carbonFactor').value;
 $('carbonFactor').replaceChildren(new Option('Choisir le véhicule ou le transport',''),...factors.map(f=>new Option(f.label,f.id)));
 if(factors.some(f=>f.id===old))$('carbonFactor').value=old;
 $('carbonCalculate').disabled=!factors.length;if(!factors.length)$('carbonCalculate').checked=false;
 $('carbonAvailability').textContent=factors.length?'Estimation facultative, calculée sur cet appareil. Choisir le modèle correspondant au déplacement, indépendamment du profil enregistré.':'Aucun facteur qualifié pour ce mode. Les émissions restent non estimées, y compris pour la marche.';
 updateCarbonPreview();
}
function updateCarbonPreview(){
 if(journalIsStaged(journalDraft?.entry))return;
 const enabled=$('carbonCalculate').checked,factor=CARBON_DATA.factors.find(f=>f.id===$('carbonFactor').value),vehicle=factor?.unit==='kgCO2e/vehicle-km';
 $('carbonFields').hidden=!enabled;$('carbonFactor').disabled=!enabled;$('carbonFactor').required=enabled;
 $('carbonOccupantsWrap').hidden=!vehicle;$('carbonOccupants').disabled=!enabled||!vehicle;$('carbonOccupants').required=enabled&&vehicle;
 if(!enabled){const old=journalDraft?.entry;$('carbonPreview').textContent=old?.emissions.status==='estimated'?'L’estimation précédente sera conservée si les données du trajet restent identiques. Une correction de date, de lieux, de mode ou de distance l’archivera et retirera sa valeur du bilan.':'Aucune estimation ne sera ajoutée sans demande explicite.';return}
 try{const c=estimateCarbon(carbonDraftInput(),$('carbonFactor').value,Number($('carbonOccupants').value),new Date().toISOString());$('carbonPreview').innerHTML=carbonDetails(c)+'<p>Ce calcul sera enregistré après confirmation du trajet. Toute estimation précédente sera conservée dans son historique.</p>'}
 catch(e){$('carbonPreview').textContent=e.message}
}

function openJournal(){if(!$('journalMonth').value)$('journalMonth').value=journalDay().slice(0,7);$('journalMessage').textContent=journalNotice;renderJournal();if(!$('journalDialog').open)$('journalDialog').showModal()}
function journalForm(entry=null,fromRoute=false,collectiveDraft=null){
 if(!journal.enabled||journalBlocked)return;
 const now=new Date().toISOString();let e=entry?structuredClone(entry):{id:crypto.randomUUID(),date:journalDay(),start:'',end:'',mode:'car',distanceMeters:null,distanceSource:'unknown',note:'',createdAt:now,updatedAt:now,revision:1,calculation:null,emissions:{version:'unavailable-v1',status:'unavailable',valueKg:null,factor:null}};
 if(fromRoute){if(!trip||busy)return;const r=selectedStop?.via||trip.base;e={...e,start:trip.places.start,end:trip.places.end,mode:trip.routing.vehicle.type,distanceMeters:r.distance,distanceSource:'route',calculation:{version:'route-snapshot-v1',engine:trip.routing.provider,start:trip.places.start,end:trip.places.end,resourceVersion:typeof r.resourceVersion==='string'?r.resourceVersion:null,calculatedAt:trip.calculatedAt,mode:trip.routing.vehicle.type,distanceMeters:r.distance,stop:selectedStop?selectedStop.station.address:null}}}
 if(collectiveDraft)e=structuredClone(collectiveDraft);
 journalDraft={entry:e,editing:!!entry,lastMode:e.mode};$('journalEditor').hidden=false;$('journalFormTitle').textContent=entry?'Corriger le trajet':'Confirmer un trajet effectué';
 for(const [id,k] of [['journalDate','date'],['journalStart','start'],['journalEnd','end'],['journalMode','mode'],['journalNote','note']])$(id).value=e[k];
 $('journalDistance').value=e.distanceMeters===null?'':String(Number((e.distanceMeters/1000).toFixed(3)));$('journalDate').max=journalDay();
 $('journalConfirm').checked=false;$('journalRepeat').checked=false;$('journalDuplicate').hidden=true;
 $('journalConfirmText').textContent=entry?'Je confirme ces corrections.':'J’ai effectué ce trajet.';
 $('journalOrigin').textContent=e.calculation?`Distance du trajet préparé (${e.calculation.engine.toUpperCase()})${e.calculation.stop?' avec arrêt : '+e.calculation.stop:''}. Ajuster si le déplacement réellement effectué diffère.`:'Saisie manuelle. La distance peut rester vide si elle est inconnue. Aucune émission n’est supposée nulle.';
 $('carbonCalculate').checked=false;refreshCarbonChoices();$('carbonFactor').value=e.emissions.status==='estimated'?e.emissions.factor.id:'';$('carbonOccupants').value=String(e.emissions.occupants??1);updateCarbonPreview();
 configureCollectiveJournal(e);if(e.calculation?.version==='cycle-snapshot-v1')$('journalOrigin').textContent=cycleJournalOrigin(e.calculation,true);$('journalMessage').textContent='';$('journalDate').focus();
}
function saveJournalEntry(event){
 event.preventDefault();if(!journalDraft||!journal.enabled||journalBlocked)return;
 try{
  const d=journalDraft,e=structuredClone(d.entry),date=journalDate($('journalDate').value);if(date>journalDay())throw new Error('Un trajet effectué ne peut pas être daté dans le futur.');
  if(!$('journalConfirm').checked)throw new Error('Confirmer que le trajet a été effectué, ou confirmer les corrections.');
  if(journalIsStaged(d.entry)){saveCollectiveJournalEntry(d,date);return}
  const raw=$('journalDistance').value.trim(),distance=raw===''?null:journalNumber(Number(raw)*1000,40000000);
  Object.assign(e,{date,start:$('journalStart').value.trim(),end:$('journalEnd').value.trim(),mode:$('journalMode').value,note:$('journalNote').value.trim(),distanceMeters:distance,updatedAt:new Date().toISOString(),revision:d.editing?e.revision+1:1});
  e.distanceSource=distance===null?'unknown':e.calculation&&e.mode===e.calculation.mode&&e.start===e.calculation.start&&e.end===e.calculation.end&&distance===Number((e.calculation.distanceMeters/1000).toFixed(3))*1000?'route':'declared';
  if(e.distanceSource==='route')e.distanceMeters=e.calculation.distanceMeters;
  const candidates=journal.entries.filter(x=>x.id!==e.id&&journalIdentity(x)===journalIdentity(e));
  if(candidates.length&&!$('journalRepeat').checked){$('journalDuplicate').hidden=false;$('journalDuplicateText').textContent=`${candidates.length} trajet(s) identique(s) déjà enregistré(s) à cette date. Modifier l’entrée existante ou confirmer un autre déplacement.`;$('journalRepeat').focus();return}
  reviseCarbon(e,d.entry,$('carbonCalculate').checked?{factorId:$('carbonFactor').value,occupants:Number($('carbonOccupants').value)}:null,e.updatedAt);
  const next={...journal,entries:d.editing?journal.entries.map(x=>x.id===e.id?e:x):[...journal.entries,e]};validateJournal(next);
  if(writeJournal(next)){journalDraft=null;$('journalEditor').hidden=true;$('journalMonth').value=e.date.slice(0,7);renderJournal();$('journalMessage').textContent=d.editing?'Trajet corrigé. Bilan recalculé.':'Trajet effectué enregistré.';$('journalNew').focus()}
 }catch(e){$('journalMessage').textContent=e.message}
}
let journalImportSequence=0,pendingJournalImport=null;
function journalImportEntry(e){
 return `${journalIsStaged(e)?collectiveJournalDetails(e):''}${e.calculation?.version==='cycle-snapshot-v1'?`<p class="note">${escapeHtml(cycleJournalOrigin(e.calculation))}</p>`:''}<p><strong>${escapeHtml(e.start)} → ${escapeHtml(e.end)}</strong></p><p>${escapeHtml(e.date)} · ${JOURNAL_MODES[e.mode]} · ${e.distanceMeters===null?'Distance inconnue':fmt(e.distanceMeters/1000,3)+' km'} · ${journalIsStaged(e)?'Empreinte détaillée par étape':currentCarbon(e)?carbonAmount(e.emissions.valueKg)+' estimés':'CO₂e non estimé'}.</p>${e.note?`<p>${escapeHtml(e.note)}</p>`:''}<p class="note">${e.distanceSource==='route'?'Distance issue du trajet préparé':e.distanceSource==='declared'?'Distance déclarée':'Distance non renseignée'} · créé le ${escapeHtml(e.createdAt)} · révision ${e.revision} · mise à jour ${escapeHtml(e.updatedAt)} · ${(e.emissionsHistory??[]).length} estimation(s) historique(s).</p><details><summary>Calcul d’itinéraire conservé</summary><p>${e.calculation?`${escapeHtml(e.calculation.engine.toUpperCase())} · ${escapeHtml(e.calculation.start)} → ${escapeHtml(e.calculation.end)} · ${fmt(e.calculation.distanceMeters/1000,3)} km · ${escapeHtml(e.calculation.calculatedAt)} · données ${escapeHtml(e.calculation.resourceVersion??'version non fournie')}${e.calculation.stop?' · arrêt : '+escapeHtml(e.calculation.stop):''}`:journalIsStaged(e)?'Origine et étapes détaillées ci-dessus.':'Aucun calcul d’itinéraire associé.'}</p></details>${journalCarbonMarkup(e)}`;
}
function refreshJournalImport(){
 const p=pendingJournalImport;if(!p)return;
 $('journalImportConfirm').checked=false;$('journalImportApply').disabled=true;
 try{
  const mode=$('journalImportMode').value,plan=planJournalImport(journal,p.source,mode,p.choices,i=>p.copyIds[i]);p.plan=plan;
  const dates=p.source.entries.map(e=>e.date).sort(),unknown=p.source.entries.filter(e=>e.distanceMeters===null).length,estimated=p.source.entries.filter(e=>journalSegments(e).some(currentCarbon)).length;
  $('journalImportSummary').textContent=`Fichier : ${p.filename}. ${p.source.entries.length} trajet(s)${dates.length?' du '+dates[0]+' au '+dates.at(-1):''} ; ${unknown} distance(s) inconnue(s), ${estimated} trajet(s) avec au moins une estimation carbone conservée. Aucun nouveau calcul. Les champs étrangers au format reconnu ne sont pas repris.`;
  $('journalImportCurrent').textContent=`Journal actuel : ${journal.entries.length} trajet(s). Il restera ${journal.enabled?'activé':'désactivé'}, indépendamment du fichier. Le profil, les autres aperçus et la copie d’origine restent inchangés.`;
  $('journalImportOutcome').textContent=mode==='replace'?`Remplacement : les ${journal.entries.length} trajet(s) actuels seront remplacés par les ${p.source.entries.length} du fichier.${!p.source.entries.length?' Ce fichier est vide : le journal courant sera vidé.':''} Exporter le journal actuel permet de conserver une sauvegarde avant confirmation.`:`Ajout : ${plan.added} trajet(s), dont ${plan.copies} copie(s) distincte(s) ; ${plan.identical} déjà identique(s), ${plan.skipped} écarté(s), ${plan.unresolved} choix restant(s). Les trajets actuels sont conservés.`;
  $('journalImportRows').innerHTML=plan.rows.map(r=>{
   const names={restore:'À restaurer',new:'À ajouter',identical:'Déjà présent, inchangé',conflict:'Deux versions différentes du même trajet',duplicate:'Doublon possible : même date, lieux, mode et distance'};
   return `<article class="saved-row"><h3>Trajet ${r.index+1} · ${names[r.kind]}</h3><details><summary>Examiner le trajet du fichier</summary>${journalImportEntry(r.entry)}</details>${r.choice==='both'?'<p>Cette copie sera comptée comme une entrée distincte dans le bilan.</p>':''}${r.relatedCount&&r.kind!=='identical'?`<details><summary>Comparer avec les ${r.relatedCount} trajet(s) déjà retenu(s)</summary>${r.related.map(journalImportEntry).join('<hr>')}${r.relatedCount>3?'<p>Les trois premiers sont affichés. Exporter le journal actuel permet de consulter toutes ses entrées.</p>':''}</details>`:''}${['conflict','duplicate'].includes(r.kind)?`<label for="journalImportChoice${r.index}">Choix pour le trajet ${r.index+1}</label><select id="journalImportChoice${r.index}" data-journal-choice="${r.index}"><option value="">Choisir avant l’import</option><option value="skip" ${r.choice==='skip'?'selected':''}>Conserver uniquement les trajets déjà retenus</option><option value="${r.kind==='conflict'?'both':'add'}" ${['both','add'].includes(r.choice)?'selected':''}>${r.kind==='conflict'?'Conserver aussi cette version comme copie distincte':'Ajouter aussi ce déplacement'}</option></select>`:''}</article>`;
  }).join('')||'<p>Le fichier ne contient aucun trajet.</p>';
  $('journalImportMessage').textContent=plan.error||(plan.unresolved?'Résoudre les choix signalés avant de confirmer.':!plan.changed?'Aucun changement à importer.':'Vérifier le résultat, puis confirmer pour enregistrer.');
  $('journalImportConfirmText').textContent=mode==='replace'?'Je confirme le remplacement du journal actuel par le contenu du fichier.':'Je confirme les ajouts et les choix présentés.';
  $('journalImportConfirm').disabled=!plan.next||!plan.changed;
 }catch(e){p.plan=null;$('journalImportMessage').textContent='Import impossible : '+e.message;$('journalImportConfirm').disabled=true}
}
function bindJournalImport(){
 $('journalImportBtn').addEventListener('click',()=>{if(!journalBlocked)$('journalImportFile').click()});
 $('journalImportCancel').addEventListener('click',()=>$('journalImportDialog').close());
 $('journalImportDialog').addEventListener('close',()=>{pendingJournalImport=null;journalImportSequence++;$('journalImportFile').value='';if($('journalDialog').open)$('journalImportBtn').focus()});
 $('journalDialog').addEventListener('close',()=>{journalImportSequence++;pendingJournalImport=null;if($('journalImportDialog').open)$('journalImportDialog').close()});
 $('journalImportExport').addEventListener('click',()=>{if(!journalBlocked)downloadProfile(journal,'DragonRoute-journal-avant-import.json')});
 $('journalImportMode').addEventListener('change',refreshJournalImport);
 $('journalImportRows').addEventListener('change',ev=>{const i=ev.target.dataset.journalChoice;if(i===undefined||!pendingJournalImport)return;pendingJournalImport.choices[i]=ev.target.value;refreshJournalImport();$('journalImportChoice'+i)?.focus()});
 $('journalImportConfirm').addEventListener('change',()=>{$('journalImportApply').disabled=!$('journalImportConfirm').checked||!pendingJournalImport?.plan?.next||!pendingJournalImport.plan.changed});
 $('journalImportFile').addEventListener('change',async ev=>{
  const file=ev.target.files[0];ev.target.value='';if(!file)return;const seq=++journalImportSequence;pendingJournalImport=null;$('journalImportApply').disabled=true;$('journalMessage').textContent='Lecture de la sauvegarde…';
  try{
   if(journalBlocked)throw new Error('Le journal actuel ne peut pas être chargé. Son remplacement est bloqué.');
   if(file.size>2000000)throw new Error('Fichier trop volumineux : limite de 2 Mo.');
   const source=validateJournal(JSON.parse((await file.text()).replace(/^\uFEFF/,'')));
   if(seq!==journalImportSequence||!$('journalDialog').open)return;
   const reserved=new Set([...journal.entries,...source.entries].map(e=>e.id)),copyIds=source.entries.map(()=>{let id;do{id=crypto.randomUUID()}while(reserved.has(id));reserved.add(id);return id});
   pendingJournalImport={source,filename:file.name.slice(0,200),choices:{},copyIds,base:JSON.stringify(journal),plan:null};$('journalImportMode').value='merge';refreshJournalImport();$('journalMessage').textContent='';if(!$('journalImportDialog').open)$('journalImportDialog').showModal();
  }catch(e){if(seq===journalImportSequence){$('journalMessage').textContent='Import refusé : '+e.message+' Le journal existant est conservé.';if($('journalImportDialog').open)$('journalImportMessage').textContent=$('journalMessage').textContent}}
 });
 $('journalImportApply').addEventListener('click',()=>{
  const p=pendingJournalImport;if(!p||!$('journalImportConfirm').checked)return;
  try{
   if(p.base!==JSON.stringify(journal))throw new Error('Le journal a changé depuis la lecture du fichier. Annuler et reprendre l’import.');
   const plan=planJournalImport(journal,p.source,$('journalImportMode').value,p.choices,i=>p.copyIds[i]);if(!plan.next||!plan.changed)throw new Error(plan.error||'Résoudre les choix avant de confirmer.');
   if(!writeJournal(plan.next))throw new Error($('journalMessage').textContent);
   const latest=journal.entries.map(e=>e.date).sort().at(-1);if(latest)$('journalMonth').value=latest.slice(0,7);
   pendingJournalImport=null;journalDraft=null;$('journalEditor').hidden=true;$('journalImportDialog').close();renderJournal();$('journalMessage').textContent='Sauvegarde importée. Sources, calculs et historiques conservés ; aucun nouveau calcul.';
  }catch(e){$('journalImportMessage').textContent=e.message+' Aucun remplacement effectué.'}
 });
}

function bindJournal(){
 $('journalExportV2').addEventListener('click',()=>{if(journalV2Snapshot!==null){try{downloadProfile(JSON.parse(journalV2Snapshot),'DragonRoute-journal-origine-v2.json')}catch{$('journalMessage').textContent='Ancienne copie v2 illisible, conservée dans le navigateur.'}}});
 bindCollectiveJournal();
 loadJournal();bindJournalImport();$('journalBtn').addEventListener('click',openJournal);
 $('journalRecordBtn').addEventListener('click',()=>{openJournal();if(journal.enabled)journalForm(null,true);else $('journalMessage').textContent='Activer volontairement le journal, puis reprendre le trajet affiché.'});
 $('journalEnable').addEventListener('change',()=>{if(writeJournal({...journal,enabled:$('journalEnable').checked})){journalDraft=null;$('journalEditor').hidden=true;renderJournal();$('journalMessage').textContent=journal.enabled?'Journal activé. Aucun trajet ajouté automatiquement.':'Journal désactivé. Les données restent conservées.'}else $('journalEnable').checked=journal.enabled});
 $('journalNew').addEventListener('click',()=>journalForm());$('journalCopy').addEventListener('click',()=>journalForm(null,true));
 $('journalMonth').addEventListener('change',renderJournal);$('journalForm').addEventListener('submit',saveJournalEntry);
 $('journalForm').addEventListener('input',e=>{if(journalDraft?.entry.calculation?.version==='cycle-snapshot-v1'&&!['journalConfirm','journalRepeat'].includes(e.target.id))$('journalConfirm').checked=false;updateCarbonPreview();if(e.target.id!=='journalRepeat'){$('journalRepeat').checked=false;$('journalDuplicate').hidden=true}});
 $('journalMode').addEventListener('change',()=>{refreshCarbonChoices();const d=journalDraft,mode=$('journalMode').value,cycle=d?.entry.calculation?.version==='cycle-snapshot-v1';if(d&&(cycle?mode!==d.lastMode:mode!==d.entry.mode)){$('journalDistance').value='';if(cycle){$('carbonCalculate').checked=false;$('carbonFactor').value='';updateCarbonPreview()}$('journalOrigin').textContent='Mode modifié : renseigner la distance effectivement parcourue dans ce mode. Le calcul d’itinéraire d’origine reste conservé comme référence.'}if(d)d.lastMode=mode});
 $('carbonCalculate').addEventListener('change',updateCarbonPreview);$('carbonFactor').addEventListener('change',updateCarbonPreview);$('journalMode').addEventListener('change',updateCarbonPreview);
 $('journalExportLegacy').addEventListener('click',()=>{if(journalLegacySnapshot!==null){try{downloadProfile(JSON.parse(journalLegacySnapshot),'DragonRoute-journal-origine.json')}catch{$('journalMessage').textContent='Ancienne copie illisible, conservée dans le navigateur.'}}});
 $('journalCancel').addEventListener('click',()=>{journalDraft=null;$('journalEditor').hidden=true;$('journalNew').focus()});
 $('journalDialog').addEventListener('close',()=>{pendingCollectiveJournal=null;pendingCycleJournal=null;journalDraft=null;$('journalEditor').hidden=true;if(!document.querySelector('dialog[open]'))$('journalBtn').focus()});
 $('journalEntries').addEventListener('click',ev=>{const b=ev.target.closest('button');if(!b)return;const e=journal.entries.find(x=>x.id===(b.dataset.journalEdit||b.dataset.journalDelete));if(!e)return;if(b.dataset.journalEdit)journalForm(e);else if(confirm('Supprimer ce trajet confirmé ? Le bilan sera recalculé.')&&writeJournal({...journal,entries:journal.entries.filter(x=>x.id!==e.id)})){journalDraft=null;$('journalEditor').hidden=true;renderJournal();$('journalMessage').textContent='Trajet supprimé. Bilan recalculé.'}});
 $('journalExport').addEventListener('click',()=>{if(!journalBlocked)downloadProfile(journal,'DragonRoute-journal.json')});
 $('journalErase').addEventListener('click',()=>{
  if(!confirm('Effacer uniquement le journal de cet environnement ? Le profil et les autres aperçus seront conservés.'))return;
  try{if(localStorage.getItem(JOURNAL_KEY)!==journalSnapshot||localStorage.getItem(V2_JOURNAL_KEY)!==journalV2Snapshot||localStorage.getItem(LEGACY_JOURNAL_KEY)!==journalLegacySnapshot)throw new Error('Journal modifié dans un autre onglet : recharger avant de l’effacer.');localStorage.removeItem(LEGACY_JOURNAL_KEY);localStorage.removeItem(V2_JOURNAL_KEY);localStorage.removeItem(JOURNAL_KEY);loadJournal();journalDraft=null;$('journalEditor').hidden=true;renderJournal();$('journalMessage').textContent='Journal effacé et désactivé.'}catch(e){$('journalMessage').textContent='Effacement impossible. '+e.message}
 });
}

function placeDescription(place){return `${place.label} · IGN · choix du ${new Date(place.resolvedAt).toLocaleDateString('fr-FR')}`}
function clearRememberedInput(field){if(field==='start'){currentPos=null;currentFix=null;updateGpsOrigin()}preparationInputs[field]=null;resumePreparation=null;updateResumePreparation();rememberedInputs[field]=null;favoriteInputs[field]=null;$(field+'PlaceNote').hidden=true}
function resetRememberedInputs(){clearRememberedInput('start');clearRememberedInput('end')}
function returnTripPlace(field){
 const value=$(field).value,trimmed=value.trim();
 if(field==='start'&&temporaryAddress(trimmed)&&currentFix&&currentPos){
  const fix=currentFix,label=`Point GPS du ${gpsDate(fix.at)} (${fix.lat.toFixed(5)}, ${fix.lon.toFixed(5)})`;
  return {value:label,place:{lat:fix.lat,lon:fix.lon,label},note:`Point GPS observé le ${gpsDate(fix.at)} (heure de Paris), précision annoncée ±${fmt(fix.accuracy,0)} m. Point historique fixe, pas une position actuelle ; aucune nouvelle localisation.`};
 }
 const saved=[preparationInputs[field],favoriteInputs[field],rememberedInputs[field]].find(p=>p?.value===trimmed&&p.place);
 if(!saved)return {value};
 return {value,place:structuredClone(saved.place),note:saved.note||`Lieu déjà confirmé : ${saved.place.label}. Coordonnées conservées pour le nouveau calcul.`};
}
function swapTripEnds(){
 if(busy)return;
 // Snapshot both confirmed points before input events invalidate their old contexts.
 const start=returnTripPlace('end'),end=returnTripPlace('start');
 $('start').value=start.value;$('end').value=end.value;
 for(const id of ['start','end'])$(id).dispatchEvent(new Event('input',{bubbles:true}));
 clearMeetingDraft();resetProspective();clearBikes();resetRange();
 $('stationDeparture').value='';$('routeArriveBy').value='';$('routeOnlyBefore').checked=false;
 for(const [field,point] of [['start',start],['end',end]])if(point.place){
  // Reuse the session's fixed-point slot; no saved preparation or profile is changed.
  preparationInputs[field]={value:point.value.trim(),place:point.place,note:point.note};
  // Only actual IGN provenance can be copied into a favorite as a resolved address.
  if(point.place.source==='ign')try{rememberedInputs[field]={value:point.value.trim(),place:validateSavedPlace(point.place)}}catch{}
  $(field+'PlaceNote').textContent=point.note;$(field+'PlaceNote').hidden=false;
 }
 tripPlaceError=null;refreshArrival();refreshTripValidation();
 setStatus('Lieux inversés. Renseigner les horaires et l’autonomie du retour, puis calculer un nouveau trajet.');
 $('swapTripBtn').focus();
}
async function resolveTripPlace(value,field,isCurrent=()=>true,signal=activeAbort?.signal){
 if(!isCurrent())throw new Error("Recherche du lieu annulée.");
 const prepared=preparationInputs[field];if(prepared?.value===value)return structuredClone(prepared.place);
 const favorite=favoriteInputs[field];
 if(favorite?.value===value&&!temporaryAddress(value)){rememberedInputs[field]=structuredClone(favorite);return favorite.place}
 rememberedInputs[field]=null;
 const place=await geocode(temporaryAddress(value)&&field==='start'?'__CURRENT__':value,field,isCurrent,signal);
 if(!isCurrent())throw new Error("Recherche du lieu annulée.");
 rememberedInputs[field]=temporaryAddress(value)?null:{value,place:{...place,source:'ign',resolvedAt:new Date().toISOString()}};
 return place;
}
function resetAddressDuplicates(){$('addressDuplicates').hidden=true;$('allowAddressDuplicate').checked=false}
function updateAddressDraft(){
 $('addressPlaceStatus').textContent=addressDraft?`Lieu mémorisé : ${placeDescription(addressDraft.place)}.`:'Lieu non mémorisé : il sera recherché lors du trajet. Vérifier le lieu permet de le conserver dès maintenant.';
}
function invalidateAddressDraft(){addressLookupSequence++;addressDraft=null;$('resolveAddressBtn').disabled=false;resetAddressDuplicates();updateAddressDraft()}
function resetAddressForm(){$('addressForm').reset();$('addressId').value='';$('cancelAddressEdit').hidden=true;invalidateAddressDraft()}
async function resolveAddressDraft(){
 const value=$('addressValue').value.trim();
 if(!value||temporaryAddress(value)){$('profileMessage').textContent='Saisir une adresse fixe complète, pas le libellé GPS temporaire.';return}
 const seq=++addressLookupSequence;const current=()=>seq===addressLookupSequence&&$('profileDialog').open&&$('addressValue').value.trim()===value;
 $('resolveAddressBtn').disabled=true;$('addressPlaceStatus').textContent='Recherche du lieu…';
 try{
  const place=await geocode(value,'address',current);if(!current())return;
  addressDraft={value,place:validateSavedPlace({...place,source:'ign',resolvedAt:new Date().toISOString()})};resetAddressDuplicates();updateAddressDraft();$('profileMessage').textContent='Lieu retenu. Enregistrer l’adresse pour le conserver.';
 }catch(e){if(current()){$('profileMessage').textContent=e.message;updateAddressDraft()}}
 finally{if(current())$('resolveAddressBtn').disabled=false}
}
function activeProfileVehicle(){return profile.vehicles.find(v=>v.id===profile.activeVehicleId)||defaultVehicle()}
function vehicleLabel(v){return (v.name||'Sans nom')+' · '+({car:'voiture',caravan:'voiture avec caravane',van:'utilitaire',truck:'camion'})[v.type]+' · '+v.fuel}
function renderVehiclePicker(){
 const select=$('savedVehicleSelect');select.replaceChildren(new Option('Réglages ponctuels',''),...profile.vehicles.map(v=>new Option(vehicleLabel(v),v.id)));
 const saved=profile.vehicles.find(v=>v.id===tripVehicleId);select.value=saved?.id||'';select.disabled=busy||profileWriteBlocked;
 $('vehiclePicker').hidden=isWalking();$('activeVehicle').hidden=isWalking();
 $('activeVehicle').textContent=saved?`Véhicule mémorisé appliqué : ${vehicleLabel(saved)}.`:'Réglages pour ce trajet uniquement. Les véhicules mémorisés restent inchangés.';
}
function detachTripVehicle(){tripVehicleId=null;renderVehiclePicker()}
function applyVehicle(){
 const v=activeProfileVehicle(),hadTrip=Boolean(trip);
 clearResults();resetProspective();resetRange();resumePreparation=null;preparedRangePending=false;updateResumePreparation();
 $('tariffClass').value='';$('tollHeight').value='';$('tollWeight').value='';$('tollVehicleConfirmed').checked=false;
 $('budgetPrice').value='';budgetReference=null;
 $('fuel').value=v.fuel;$('cons').value=v.cons;$('liters').value=v.liters;$('routeVehicle').value=v.type;
 for(const [key,id] of Object.entries(dimensionFields))$(id).value=v.dimensions?.[key]??'';
 tripVehicleId=profile.activeVehicleId;updateVehicleRouting();updateRange();updateBudget();renderVehiclePicker();
 if(hadTrip)setStatus('Véhicule modifié. Trajet à recalculer.');
 else refreshTripValidation();
}
function useSavedVehicle(id){
 if(busy)return;
 if(!id){detachTripVehicle();return}
 if(!profile.vehicles.some(v=>v.id===id)){renderVehiclePicker();return}
 const next=structuredClone(profile);next.activeVehicleId=id;
 if(saveProfile(next)){$('travelMode').value='car';applyVehicle();setStatus('Véhicule choisi. Calculer un nouveau trajet.');$('profileMessage').textContent='Véhicule choisi pour ce trajet et les prochains démarrages.'}
 else{renderVehiclePicker();setStatus($('profileMessage').textContent,true)}
}
function resetVehicleDuplicate(){$('allowVehicleDuplicate').checked=false;$('vehicleDuplicates').hidden=true}
function vehicleFormDimensions(){
 const raw=Object.fromEntries(Object.keys(dimensionFields).map(k=>[k,$('vehicleDim-'+k).value]));
 if(Object.values(raw).every(v=>v===''))return undefined;
 return validateDimensions(Object.fromEntries(Object.entries(raw).map(([k,v])=>[k,Number(v)])));
}
function showVehicleDimensions(d){
 for(const k of Object.keys(dimensionFields))$('vehicleDim-'+k).value=d?.[k]??'';
 $('savedDimensionsNote').textContent=d?'Gabarit dans le formulaire : '+dimensionLabel(d)+'. Enregistrer pour le conserver.':'Aucun gabarit renseigné.';
}
function editVehicle(id=null){
 const v=profile.vehicles.find(x=>x.id===id)||defaultVehicle();vehicleDraftId=v.id||null;
 for(const [el,key] of [['vehicleName','name'],['vehicleType','type'],['vehicleFuel','fuel'],['vehicleCons','cons'],['vehicleLiters','liters']])$(el).value=v[key];
 $('vehicleEditorTitle').textContent=vehicleDraftId?'Modifier un véhicule':'Ajouter un véhicule';showVehicleDimensions(v.dimensions);resetVehicleDuplicate();
}
function renderVehicles(){
 $('savedVehicles').innerHTML=profile.vehicles.length?profile.vehicles.map(v=>`<div class="saved-row"><strong>${escapeHtml(vehicleLabel(v))}</strong><p>${v.cons} L/100 km · ${v.liters} L à acheter par défaut${v.id===profile.activeVehicleId?' · Choisi au démarrage':''}</p><p>${v.dimensions?escapeHtml(dimensionLabel(v.dimensions)):'Gabarit non renseigné.'}</p><div class="dialog-actions"><button class="ghost" data-vehicle-use="${escapeHtml(v.id)}">Utiliser ce véhicule</button><button class="ghost" data-vehicle-edit="${escapeHtml(v.id)}">Modifier le véhicule</button><button class="ghost" data-vehicle-remove="${escapeHtml(v.id)}">Supprimer le véhicule</button></div></div>`).join(''):'<p class="note">Aucun véhicule enregistré. La préparation reste disponible avec des réglages ponctuels.</p>';
 $('newVehicleBtn').disabled=busy||profile.vehicles.length>=10;
 renderVehiclePicker();
}
function renderSaved(){
  renderVehicles();
  $("savedAddresses").innerHTML=profile.addresses.length?profile.addresses.map(a=>`<div class="saved-row"><strong>${escapeHtml(a.name)}</strong><p>${escapeHtml(a.value)}</p><p>${a.place?`Lieu mémorisé : ${escapeHtml(placeDescription(a.place))}`:temporaryAddress(a.value)?"Adresse GPS temporaire à remplacer.":"Lieu à rechercher lors du trajet."}</p><div class="dialog-actions"><button class="ghost" data-address-start="${escapeHtml(a.id)}">Départ</button><button class="ghost" data-address-end="${escapeHtml(a.id)}">Arrivée</button><button class="ghost" data-address-edit="${escapeHtml(a.id)}">Modifier</button><button class="ghost" data-address-remove="${escapeHtml(a.id)}">Supprimer</button></div></div>`).join(""):"<p class=note>Aucune adresse enregistrée.</p>";
  $("savedStations").innerHTML=profile.stations.length?profile.stations.map(s=>`<div class="saved-row"><strong>${escapeHtml(s.city||"Station")}</strong><p>${escapeHtml(s.address)}</p><div class="dialog-actions"><button class="ghost" data-favorite-open="${escapeHtml(s.id)}">Voir la station</button><button class="ghost" data-favorite-remove="${escapeHtml(s.id)}">Retirer</button></div></div>`).join(""):"<p class=note>Aucune station enregistrée.</p>";
}
function openProfile(){
  if(busy)return;
  $("profileMessage").textContent=storageNotice;
  editVehicle(profile.activeVehicleId);
  $('exportProfileBtn').disabled=profileWriteBlocked;
  for(const [id,version] of [['exportLegacyProfileBtn',1],['exportV2ProfileBtn',2]])$(id).hidden=!legacyProfiles.some(p=>p.version===version);
  renderSaved();if(!$("profileDialog").open)$("profileDialog").showModal();
}
function updateFavorite(){
  const saved=currentStation&&profile.stations.some(s=>s.id===currentStation.id);
  $("favoriteBtn").textContent=saved?"Retirer des favoris":"Enregistrer la station";
  $("favoriteBtn").setAttribute("aria-pressed",String(Boolean(saved)));
}
// BEGIN STATION HOURS MODEL
const PARIS_TIME=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Paris',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
function parisLocal(ms){return PARIS_TIME.format(new Date(ms)).replace(' ','T')}
function departureInstant(value){
  if(!/^20\d{2}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value))return {error:'Renseigner une date et une heure de départ entre 2000 et 2099 (heure de Paris).'};
  const pseudo=Date.parse(value+'Z');
  if(!Number.isFinite(pseudo)||new Date(pseudo).toISOString().slice(0,16)!==value)return {error:'Date ou heure de départ invalide.'};
  // Europe/Paris uses UTC+1/+2 in this bounded period. Matching both candidates
  // rejects nonexistent spring times and ambiguous autumn times explicitly.
  const candidates=[pseudo-36e5,pseudo-72e5].filter(ms=>parisLocal(ms)===value);
  if(candidates.length!==1)return {error:candidates.length?'Cette heure existe deux fois au changement d’heure. Choisir une heure non ambiguë.':'Cette heure n’existe pas au changement d’heure. Choisir une autre heure.'};
  return {instant:candidates[0],error:''};
}
function stationSchedule(raw,declared){
  let h;try{h=typeof raw==='string'?JSON.parse(raw):raw}catch{}
  if(!h||typeof h!=='object'||Array.isArray(h))h={};
  const rawAuto=h['@automate-24-24'],fromRaw=rawAuto==='1'?'yes':rawAuto===''?'no':null;
  const fromField=declared==='Oui'?'yes':declared==='Non'?'no':null;
  const conflict=fromRaw&&fromField&&fromRaw!==fromField;
  const automate=conflict?'unknown':fromRaw||fromField||'unknown',days={};
  const rows=Array.isArray(h.jour)?h.jour:h.jour?[h.jour]:[];
  const minute=value=>{if(typeof value!=='string'||! /^(?:[01]?\d|2[0-3])[:.]\d{2}$|^24[:.]00$/.test(value))return null;const [hr,min]=value.split(/[:.]/).map(Number);return min<60?hr*60+min:null};
  for(const row of rows.slice(0,20)){
    if(!row||! /^(?:[1-7])$/.test(String(row['@id'])))continue;
    const id=Number(row['@id']);
    if(days[id]){days[id]={known:false,slots:[]};continue}
    const slots=Array.isArray(row.horaire)?row.horaire:row.horaire?[row.horaire]:[];
    const parsed=slots.slice(0,12).map(s=>[minute(s?.['@ouverture']),minute(s?.['@fermeture'])]);
    const valid=parsed.length>0&&slots.length<=12&&parsed.every(([a,b])=>a!==null&&b!==null&&a<1440&&a!==b);
    // Closed-day flags take precedence over stale placeholder slots in the feed.
    const closed=String(row['@ferme'])==='1';
    const validFlag=row['@ferme']==null||['','0','1'].includes(String(row['@ferme']));
    days[id]={known:validFlag&&(closed||valid),closed,slots:closed?[]:parsed.filter(([a,b])=>a!==null&&b!==null&&a<1440&&a!==b)};
  }
  return {automate,conflict:Boolean(conflict),days};
}
function counterAt(schedule,arrival){
  const local=parisLocal(arrival),weekday=new Date(local.slice(0,10)+'T12:00:00Z').getUTCDay()||7;
  const t=Number(local.slice(11,13))*60+Number(local.slice(14,16)),day=schedule.days[weekday],previous=schedule.days[weekday===1?7:weekday-1];
  const carry=previous?.known&&previous.slots.some(([a,b])=>b<a&&t<b);
  if(carry&&day?.closed)return 'unknown';
  if(day?.known&&day.slots.some(([a,b])=>a<=t&&(b<a||t<b)))return 'compatible';
  if(carry)return 'compatible';
  return day?.known&&previous?.known?'outside':'unknown';
}
function arrivalOpening(station,departure){
  const schedule=stationSchedule(station.hours,station.automate),base={state:'unknown',kind:'unknown',arrival:null,automate:schedule.automate,counter:'unknown'};
  if(!Number.isFinite(departure)||!Number.isFinite(station.accessSeconds)||station.accessSeconds<0)return {...base,reason:'Arrivée non estimée : départ ou durée d’accès manquant.'};
  if(!/^(?:0[1-9]|[1-8]\d|9[0-5])\d{3}$/.test(station.postalCode||'')||!Number.isFinite(station.lat)||!Number.isFinite(station.lon)||station.lat<41.2||station.lat>51.2||station.lon< -5.5||station.lon>9.7)return {...base,reason:'Fuseau non qualifié pour cette station ; estimation limitée à la France métropolitaine.'};
  const arrival=departure+station.accessSeconds*1000;if(!Number.isFinite(arrival)||Math.abs(arrival)>8.64e15)return base;
  const counter=counterAt(schedule,arrival),result={...base,arrival,counter};
  if(schedule.conflict)return {...result,reason:'Indications d’automate contradictoires : à vérifier.'};
  if(schedule.automate==='yes'&&station.fuel!=='GPLc')return {...result,state:'compatible',kind:'automate',reason:'Automate 24 h/24 déclaré'};
  if(counter==='compatible')return {...result,state:'compatible',kind:'counter',reason:'Dans les horaires habituels du guichet'};
  if(counter==='outside'&&schedule.automate==='no')return {...result,state:'outside',kind:'counter',reason:'Hors horaires déclarés du guichet ; aucun automate 24 h/24 déclaré'};
  return {...result,reason:station.fuel==='GPLc'&&schedule.automate==='yes'?'Guichet non confirmé à cette heure ; automate non qualifié pour le GPLc.':'Horaires à l’arrivée inconnus ou incomplets.'};
}
// END STATION HOURS MODEL

function stationOpening(s){return arrivalOpening(s,departureInstant($("stationDeparture").value).instant)}
function arrivalLabel(ms){return new Intl.DateTimeFormat('fr-FR',{timeZone:'Europe/Paris',day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(ms))}
function openingText(s){const o=stationOpening(s);return (o.arrival?`Arrivée estimée le ${arrivalLabel(o.arrival)} (Paris) · `:'')+o.reason}
function refreshArrival(){
  updateResumePreparation();updateRides();updateTripTiming();
  const field=$("stationDeparture"),d=field.validity.badInput?{error:"Compléter la date et l’heure, ou effacer le champ."}:field.value?departureInstant(field.value):{error:"",instant:null};
  $("stationDeparture").setAttribute('aria-invalid',String(Boolean(d.error)));
  $("stationDepartureStatus").textContent=d.error||(d.instant===null?"Départ non renseigné : arrivée et ouverture à l’arrivée inconnues.":`Départ fixé au ${arrivalLabel(d.instant)} (Paris). Durée routière d’accès, sans pauses ni trafic en direct.${d.instant<Date.now()-60000?' Heure passée : actualiser le départ pour un trajet à venir.':''}`);
  refreshTripValidation();updatePreparationReadout();
  if(stationSearch)renderStations(compared,stopWindow().mode);
  if($("stationDialog").open&&currentStation)renderStationDetails(currentStation);
}

// BEGIN TIMING MODEL
function timingHypotheses(raw){
 if(!raw||typeof raw.onlyBefore!=='boolean')throw new Error('Filtre horaire invalide.');
 const read=(value,label)=>{if(value===null||value==='')return null;if(typeof value!=='string')throw new Error(label+' invalide.');const d=departureInstant(value);if(d.error)throw new Error(label+' : '+d.error);return d.instant};
 const departure=read(raw.departure,'Départ'),arriveBy=read(raw.arriveBy,'Heure limite');
 if(departure!==null&&arriveBy!==null&&arriveBy<departure)throw new Error('L’heure limite doit suivre le départ ou lui être égale.');
 if(raw.onlyBefore&&arriveBy===null)throw new Error('Renseigner une heure limite avant d’activer le filtre.');
 return {departure,arriveBy,onlyBefore:raw.onlyBefore};
}
function timingEstimate(duration,h){
 const known=typeof duration==='number'&&Number.isFinite(duration)&&duration>=0&&duration<=31536000;
 const arrival=known&&h.departure!==null?h.departure+duration*1000:null;
 const state=arrival===null?'unknown':h.arriveBy===null?'unconstrained':arrival<=h.arriveBy?'compatible':'late';
 return {arrival,state,lateSeconds:state==='late'?(arrival-h.arriveBy)/1000:null,admissible:state==='compatible'};
}
function timingRecord(raw){const h=timingHypotheses(raw);return {departure:h.departure===null?null:parisLocal(h.departure),arriveBy:h.arriveBy===null?null:parisLocal(h.arriveBy),onlyBefore:h.onlyBefore}}
function resumeTiming(t,now){
 const h=timingHypotheses(t),expired=h.departure===null||h.departure<now-60000;
 // Keep the original snapshot untouched. A changed departure requires reviewing its deadline too.
 return {departure:expired?null:t.departure,arriveBy:expired?null:t.arriveBy,onlyBefore:expired?false:t.onlyBefore,review:expired};
}
// Optional declared time at the fuel stop, independent of the routing response.
function stopMinutes(raw){
 if(typeof raw!=='string')throw new Error('Durée de pause invalide.');
 if(!raw.trim())return null;
 const value=Number(raw);
 if(!Number.isFinite(value)||value<0||value>1440)throw new Error('Renseigner une durée de 0 à 1 440 minutes, ou laisser vide si elle est inconnue.');
 return value;
}
function stopDuration(drivingSeconds,hasStop,minutes){
 const valid=typeof drivingSeconds==='number'&&Number.isFinite(drivingSeconds)&&drivingSeconds>=0&&drivingSeconds<=31536000;
 const known=typeof minutes==='number'&&Number.isFinite(minutes)&&minutes>=0&&minutes<=1440;
 const pauseSeconds=hasStop?(known?minutes*60:null):0;
 return {drivingSeconds:valid?drivingSeconds:null,pauseSeconds,totalSeconds:valid&&pauseSeconds!==null?drivingSeconds+pauseSeconds:null};
}
// END TIMING MODEL
function routeTimingRaw(){return {departure:$('stationDeparture').value,arriveBy:$('routeArriveBy').value,onlyBefore:$('routeOnlyBefore').checked}}
function timingText(result){
 const arrival=result.arrival===null?'Arrivée non estimée : départ ou durée absent.':`Arrivée estimée : ${arrivalLabel(result.arrival)} (Paris).`;
 return arrival+' '+({unknown:'Compatibilité avec l’heure limite inconnue.',unconstrained:'Aucune heure limite demandée.',compatible:'Compatible avec l’heure limite selon la durée estimée.',late:`Heure limite dépassée d’environ ${result.lateSeconds<60?Math.ceil(result.lateSeconds)+' s':Math.ceil(result.lateSeconds/60)+' min'} selon la durée estimée.`}[result.state]);
}
function readStopMinutes(){
 const el=$('stopMinutes');
 if(!el.validity.valid)throw new Error('Renseigner une durée de 0 à 1 440 minutes, ou laisser vide si elle est inconnue.');
 return stopMinutes(el.value);
}
function stopDurationText(duration,hasStop,minutes){
 const plan=stopDuration(duration,hasStop,minutes),road=`${fmt(duration/60,1)} min de conduite`;
 if(!hasStop)return road+' · sans arrêt carburant';
 return road+(plan.pauseSeconds===null?' · pause inconnue, hors temps du plein ; durée avec pause non estimée':` · pause prévue : ${fmt(minutes,1)} min · conduite + pause : ${fmt(plan.totalSeconds/60,1)} min`);
}
function currentDurationText(duration){
 if(trip?.routing.vehicle.type==='walk')return `${fmt(duration/60,1)} min à pied, hors pauses`;
 try{return stopDurationText(duration,Boolean(selectedStop),selectedStop?readStopMinutes():null)}catch{return `${fmt(duration/60,1)} min de conduite · pause à corriger ; durée avec pause non estimée`}
}
function updateStopDuration(){
 let minutes=null,error='';try{minutes=readStopMinutes()}catch(e){error=e.message}
 $('stopMinutes').setAttribute('aria-invalid',String(Boolean(error)));
 $('stopMinutesStatus').textContent=error||(selectedStop?(minutes===null?'Pause non renseignée : l’arrivée avec arrêt reste inconnue.':'Pause déclarée ajoutée une seule fois au trajet avec cette station.'):'Cette durée sera ajoutée uniquement après le choix d’une station.');
 $('tripDurationBreakdown').hidden=!trip||!selectedStop;
 if(trip&&selectedStop){const text=currentDurationText(selectedStop.via.duration);$('tripDurationBreakdown').textContent=text;$('selectedStop').textContent=`Arrêt choisi : ${selectedStop.station.address}. Trajet avec arrêt : ${fmt(selectedStop.via.distance/1000,1)} km · ${text}.`}
 return {minutes,error};
}
function updateTripTiming(){
 updatePreparationReadout();
 const pause=updateStopDuration();$('tripTiming').hidden=!trip;
 try{const h=timingHypotheses(routeTimingRaw());$('routeTimingStatus').textContent=h.onlyBefore?'Filtre d’heure limite repris à l’ouverture de la comparaison. Le trajet affiché reste consultable.':'';$('routeArriveBy').setAttribute('aria-invalid','false');
 if(trip){const r=selectedStop?.via||trip.base,plan=stopDuration(r.duration,Boolean(selectedStop),pause.error?null:pause.minutes),result=timingEstimate(plan.totalSeconds,h);
 const road=timingEstimate(r.duration,h),missing=selectedStop&&plan.totalSeconds===null;
 $('tripTiming').textContent=missing?(pause.error?'Pause à corriger. ':'Pause non renseignée. ')+(road.arrival===null?'':`Repère hors temps du plein : ${arrivalLabel(road.arrival)} (Paris). `)+'Arrivée avec pause non estimée. Compatibilité avec l’heure limite inconnue.':timingText(result)+(selectedStop?` Pause déclarée de ${fmt(pause.minutes,1)} min incluse.`:'');
 $('tripTiming').textContent+=' Hors autres pauses et trafic en direct. Aucune garantie d’arrivée.';$('tripTiming').dataset.timingState=pause.error&&selectedStop?'invalid':result.state;}}
 catch(e){const departureError=$('stationDeparture').value&&departureInstant($('stationDeparture').value).error;$('routeArriveBy').setAttribute('aria-invalid',String(!departureError));$('routeTimingStatus').textContent=e.message;if(trip){$('tripTiming').textContent='Horaire à vérifier : '+e.message;$('tripTiming').dataset.timingState='invalid'}}
}
function preparedTimingText(e){const t=e.timing;return `<p>Départ prévu : ${escapeHtml(t.departure?.replace('T',' ')||'non renseigné')}. Heure limite : ${escapeHtml(t.arriveBy?.replace('T',' ')||'non renseignée')} (Paris). ${t.onlyBefore?'Filtre d’heure limite demandé.':''}</p>`}

// BEGIN PREPARED TRIPS MODEL
function preparedText(v,max,required=false){if(typeof v!=='string'||v.length>max||(required&&!v.trim()))throw new Error('Texte de préparation invalide.');return v.trim()}
function preparedNumber(v,min,max){if(typeof v!=='number'||!Number.isFinite(v)||v<min||v>max)throw new Error('Valeur de préparation invalide.');return v}
function preparedEnum(v,values){if(!values.includes(v))throw new Error('Option de préparation inconnue.');return v}
function preparedBool(v){if(typeof v!=='boolean')throw new Error('Option de préparation invalide.');return v}
function preparedDate(v){if(typeof v!=='string'||!Number.isFinite(Date.parse(v))||new Date(v).toISOString()!==v)throw new Error('Date de préparation invalide.');return v}
function preparedPoint(p){if(!p||typeof p!=='object')throw new Error('Lieu de préparation manquant.');return {label:preparedText(p.label,1000,true),lat:preparedNumber(p.lat,-90,90),lon:preparedNumber(p.lon,-180,180)}}
function preparedMeetings(plan){
 if(plan==null)return null;
 if(!plan.limits)throw new Error('Limites de rencontre manquantes.');
 const pickup=preparedPoint(plan.pickup),dropoff=preparedPoint(plan.dropoff);
 if(pickup.lat===dropoff.lat&&pickup.lon===dropoff.lon)throw new Error('Prise en charge et dépose confondues.');
 return {pickup,dropoff,limits:{km:preparedNumber(plan.limits.km,0,1000),minutes:preparedNumber(plan.limits.minutes,0,1440)},stationPosition:preparedEnum(plan.stationPosition,['before','during','after'])};
}
function preparedBudget(raw,e){
 if(raw===null)return null;
 if(!raw||e.vehicle.type==='walk'||raw.currency!=='EUR')throw new Error('Budget historique invalide.');
 const capturedAt=preparedDate(raw.capturedAt);if(capturedAt>e.savedAt)throw new Error('Date du budget après la sauvegarde.');
 const f=raw.fuel,t=raw.tolls;if(!f||!t)throw new Error('Budget historique incomplet.');
 const fuel={price:f.price===null?null:preparedNumber(f.price,.000001,10),reference:preparedText(f.reference,2000,true),stationId:f.stationId===null?null:preparedText(f.stationId,80,true),updatedAt:f.updatedAt===null?null:preparedDate(f.updatedAt),receivedAt:f.receivedAt===null?null:preparedDate(f.receivedAt)};
 const cents=v=>{preparedNumber(v,0,100000000);if(!Number.isSafeInteger(v))throw new Error('Centimes entiers requis.');return v};
 const date=v=>{preparedText(v,10,true);if(!/^\d{4}-\d{2}-\d{2}$/.test(v)||!Number.isFinite(Date.parse(v+'T12:00:00Z'))||new Date(v+'T12:00:00Z').toISOString().slice(0,10)!==v)throw new Error('Date tarifaire invalide.');return v};
 const url=v=>{preparedText(v,2000,true);let u;try{u=new URL(v)}catch{throw new Error('Source tarifaire invalide.')};if(u.protocol!=='https:'||u.username||u.password)throw new Error('Source tarifaire invalide.');return v};
 if(!Array.isArray(t.segments)||t.segments.length>10)throw new Error('Tronçons mémorisés invalides.');
 const segments=t.segments.map(s=>{const kind=preparedEnum(s.kind,['matrix','passage']);return {network:preparedText(s.network,80,true),kind,entry:kind==='passage'?null:preparedText(s.entry,200,true),exit:kind==='passage'?null:preparedText(s.exit,200,true),vehicleClass:preparedEnum(s.vehicleClass,['1','2','3','4','5']),amountCents:cents(s.amountCents),date:date(s.date),source:{url:url(s.source?.url),title:preparedText(s.source?.title,1000,true),effectiveFrom:date(s.source?.effectiveFrom),lastReviewed:date(s.source?.lastReviewed),consultationUntil:date(s.source?.consultationUntil)}}});
 const tolls={state:preparedEnum(t.state,['unknown','partial','complete','no_tolls']),amountCents:t.amountCents===null?null:cents(t.amountCents),reference:preparedText(t.reference,6000,true),segments};
 if((tolls.state==='unknown')!==(tolls.amountCents===null)||tolls.state==='no_tolls'&&tolls.amountCents!==0)throw new Error('État et montant des péages incohérents.');
 if(segments.length&&(tolls.state==='unknown'||tolls.state==='no_tolls'||segments.reduce((n,s)=>n+s.amountCents,0)!==tolls.amountCents))throw new Error('Somme des tronçons incohérente.');
 const ids=segments.map(s=>JSON.stringify([s.network,s.kind,s.entry,s.exit]));if(new Set(ids).size!==ids.length)throw new Error('Tronçons mémorisés dupliqués.');
 return {currency:'EUR',capturedAt,fuel,tolls};
}
function preparedBudgetTotals(e){
 const b=e.budget;if(!b)return null;const fuel=b.fuel.price===null?null:e.snapshot.distanceMeters/1000*e.vehicle.cons/100*b.fuel.price,tolls=b.tolls.amountCents===null?null:b.tolls.amountCents/100;
 return {fuel,tolls,total:fuel!==null&&['complete','no_tolls'].includes(b.tolls.state)?fuel+tolls:null};
}
// Match names, never old array offsets or old amounts. Absence/ambiguity is not a match.
function preparedTariffMatch(s,catalog){
 if(catalog?.schemaVersion!==2)return null;const n=Object.hasOwn(catalog.networks||{},s.network)?catalog.networks[s.network]:null;if(!n||(n.kind==='passage'?'passage':'matrix')!==s.kind)return null;
 if(s.kind==='passage')return {network:s.network,entry:null,exit:null};
 const one=name=>{const ids=n.gates.map((v,i)=>v===name?i:-1).filter(i=>i>=0);return ids.length===1?ids[0]:null},entry=one(s.entry),exit=one(s.exit);
 return entry!==null&&exit!==null&&n.rows.some(r=>r[0]===entry&&r[1]===exit)?{network:s.network,entry,exit}:null;
}

function validatePreparedEntry(e,version=11){
 if(!e||!e.places||!e.vehicle||!e.preferences||!e.snapshot)throw new Error('Préparation incomplète.');
 const v=e.vehicle,p=e.preferences,r=e.snapshot,walking=v.type==='walk',nullable=(v,min,max)=>v===null?null:preparedNumber(v,min,max);
 const vehicle=walking?{type:'walk'}:{type:preparedEnum(v.type,['car','truck']),fuel:preparedEnum(v.fuel,['E10','Gazole','SP95','SP98','E85','GPLc']),cons:preparedNumber(v.cons,1,100),liters:preparedNumber(v.liters,1,2000),dimensions:null};
 if(v.type==='truck'){
  if(!v.dimensions)throw new Error('Gabarit de la préparation manquant.');
  vehicle.dimensions=Object.fromEntries(Object.entries({height:6,width:6,length:40,weight:100,axleload:30}).map(([key,max])=>[key,preparedNumber(v.dimensions[key],.01,max)]));
  if(vehicle.dimensions.axleload>vehicle.dimensions.weight)throw new Error('Charge par essieu incohérente.');
 }
 let preferences;
 if(walking){
  const max=p.maxWalkKm===null?null:preparedNumber(p.maxWalkKm,version<6?.1:0,500);if(version<6&&Object.hasOwn(p,'walkStrict'))throw new Error('Règle de marche incompatible avec cet ancien format.');const strict=version<6?false:preparedBool(p.walkStrict);if(strict&&max===null)throw new Error('Distance de marche impérative manquante.');
  if((p.avoid&&p.avoid.length)||r.stop!==null||r.engine!=='ign')throw new Error('Une préparation à pied ne contient ni arrêt carburant ni options automobiles.');
  preferences={maxWalkKm:max,walkStrict:strict};
 }else{
 if(!Array.isArray(p.avoid)||p.avoid.length>3||new Set(p.avoid).size!==p.avoid.length||!Array.isArray(p.services)||p.services.length>50)throw new Error('Filtres de préparation invalides.');
 preferences={stopMinutes:version<10?null:nullable(p.stopMinutes,0,1440),avoid:p.avoid.map(x=>preparedEnum(x,['tollways','highways','ferries'])),departure:p.departure===null?null:preparedText(p.departure,16,true),stopMode:preparedEnum(p.stopMode,['soon','near','around']),stopKm:preparedNumber(p.stopKm,version<7?5:.1,40000),stopTolerance:version<7?20:preparedNumber(p.stopTolerance,.1,40000),nearKm:version<7?50:preparedNumber(p.nearKm,.1,40000),stationScope:version<9?'route':preparedEnum(p.stationScope,['route','window']),stationRadiusKm:version<8?12:preparedNumber(p.stationRadiusKm,1,30),stationSpacingKm:version<8?30:preparedNumber(p.stationSpacingKm,5,100),stationMaxPoints:version<8?24:preparedNumber(p.stationMaxPoints,2,24),rangeMode:preparedEnum(p.rangeMode,['none','km','liters']),rangeValue:nullable(p.rangeValue,0,5000),reserveKm:preparedNumber(p.reserveKm,0,500),rangeOnly:preparedBool(p.rangeOnly),maxDetourKm:nullable(p.maxDetourKm,0,1000),maxDetourMin:nullable(p.maxDetourMin,0,1440),services:p.services.map(x=>preparedText(x,200,true)),openingFilter:preparedEnum(p.openingFilter,['all','compatible','outside','unknown']),listMode:preparedEnum(p.listMode,['recommended','all','cost','price','detour'])};
 if(!Number.isInteger(preferences.stationMaxPoints))throw new Error('Maximum de points entier requis.');
 if(preferences.departure!==null&&departureInstant(preferences.departure).error)throw new Error('Heure de départ de la préparation invalide ou ambiguë.');
 if(new Set(preferences.services).size!==preferences.services.length||(preferences.rangeMode!=='none'&&preferences.rangeValue===null)||(preferences.rangeMode==='none'&&preferences.rangeOnly)||(preferences.rangeMode==='liters'&&preferences.rangeValue>2000))throw new Error('Autonomie ou services incohérents.');
 }
 if(!Array.isArray(r.geometry)||r.geometry.length<2||r.geometry.length>25000)throw new Error('Le tracé doit contenir de 2 à 25 000 points.');
 const geometry=r.geometry.map(p=>{if(!Array.isArray(p)||p.length!==2)throw new Error('Point du tracé invalide.');return [preparedNumber(p[0],-180,180),preparedNumber(p[1],-90,90)]});
 const stop=r.stop===null?null:{id:preparedText(r.stop?.id,80,true),address:preparedText(r.stop?.address,300,true),city:preparedText(r.stop?.city,100),lat:preparedNumber(r.stop?.lat,-90,90),lon:preparedNumber(r.stop?.lon,-180,180)};
 if(walking&&e.meetings!=null)throw new Error('Rencontres automobiles incompatibles avec une préparation à pied.');
 const clean={meetings:preparedMeetings(e.meetings),optimization:e.optimization==null?null:preparedEnum(e.optimization,['fastest','shortest']),id:preparedText(e.id,80,true),name:preparedText(e.name,80,true),savedAt:preparedDate(e.savedAt),places:{start:preparedPoint(e.places.start),end:preparedPoint(e.places.end)},vehicle,preferences,snapshot:{calculatedAt:preparedDate(r.calculatedAt),engine:preparedEnum(r.engine,['osrm','ign','ors']),distanceMeters:preparedNumber(r.distanceMeters,0,40000000),durationSeconds:preparedNumber(r.durationSeconds,0,31536000),geometry,stop}};
 if(!/^[A-Za-z0-9-]+$/.test(clean.id)||clean.snapshot.calculatedAt>clean.savedAt)throw new Error('Identité ou chronologie de préparation incohérente.');
 clean.budget=version<11?null:preparedBudget(e.budget??null,clean);
 clean.timing=timingRecord(e.timing??{departure:walking?null:preferences.departure,arriveBy:null,onlyBefore:false});
 if(!walking&&clean.timing.departure!==preferences.departure)throw new Error('Départs incohérents dans la préparation.');
 return clean;
}
function validatePreparedTrips(data){
 if(!data||data.kind!=='dragonroute-preparations'||![1,2,3,4,5,6,7,8,9,10,11].includes(data.version)||!Array.isArray(data.entries)||data.entries.length>20)throw new Error('Format inconnu ou limite de 20 préparations dépassée.');
 if(data.version===1&&data.entries.some(e=>e?.vehicle?.type==='walk'))throw new Error('Le format 1 ne prend pas en charge la marche.');
 if(data.version>=3&&data.entries.some(e=>!e?.timing))throw new Error('Horaires de préparation manquants.');
 if(data.version>=4&&data.entries.some(e=>!e||!Object.hasOwn(e,'optimization')))throw new Error('Critère de préparation manquant.');
 if(data.version>=5&&data.entries.some(e=>!e||!Object.hasOwn(e,'meetings')))throw new Error('Champ rencontres manquant.');
 if(data.version>=11&&data.entries.some(e=>!e||!Object.hasOwn(e,'budget')))throw new Error('Champ budget manquant.');
 const clean={kind:'dragonroute-preparations',version:11,entries:data.entries.map(e=>validatePreparedEntry({...e,...(data.version<3?{timing:undefined}:{}),...(data.version<4?{optimization:null}:{}),...(data.version<5?{meetings:null}:{})},data.version))};
 if(new Set(clean.entries.map(e=>e.id)).size!==clean.entries.length)throw new Error('Identifiants de préparations dupliqués.');
 if(new TextEncoder().encode(JSON.stringify(clean,null,2)).length>2000000)throw new Error('Limite de 2 Mo atteinte. Exporter puis retirer des préparations avant de réessayer.');
 return clean;
}
function preparedDuplicates(entry,entries){
 const name=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().replace(/\s+/g,' ').toLocaleLowerCase('fr-FR');
 const point=p=>[p.lat,p.lon];
 const key=e=>JSON.stringify([e.budget??null,point(e.places.start),point(e.places.end),e.vehicle,e.preferences,e.timing??null,e.optimization??null,e.meetings??null,e.snapshot.stop?.id||null]);
 return entries.filter(e=>e.id!==entry.id&&(name(e.name)===name(entry.name)||key(e)===key(entry)));
}
// END PREPARED TRIPS MODEL

// BEGIN PREPARED COMPARISON MODEL
function comparePreparedTrips(rawA,rawB){
 const a=validatePreparedEntry(rawA),b=validatePreparedEntry(rawB);
 if(a.id===b.id||[a,b].some(e=>e.vehicle.type==='walk'))throw new Error('Choisir deux préparations routières distinctes.');
 const point=p=>[p.lat,p.lon],same=(x,y)=>JSON.stringify(x)===JSON.stringify(y);
 const date=v=>new Intl.DateTimeFormat('fr-CA',{timeZone:'Europe/Paris',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(v));
 const baseReasons=[],budgetReasons=[],notes=[];
 if(!['start','end'].every(k=>same(point(a.places[k]),point(b.places[k]))))baseReasons.push('Les points de départ ou d’arrivée diffèrent, même si leurs noms se ressemblent.');
 if(!same([a.vehicle.type,a.vehicle.dimensions],[b.vehicle.type,b.vehicle.dimensions]))baseReasons.push('Le type de véhicule ou son gabarit diffère.');
 if(a.vehicle.fuel!==b.vehicle.fuel)budgetReasons.push('Les carburants diffèrent.');
 if(a.vehicle.cons!==b.vehicle.cons)budgetReasons.push('Les consommations déclarées diffèrent.');
 if(!a.timing.departure||!b.timing.departure)budgetReasons.push('Le départ prévu manque dans au moins une préparation.');
 else if(a.timing.departure!==b.timing.departure)budgetReasons.push('Les dates ou heures de départ prévues diffèrent.');
 const avoid=e=>e.preferences.avoid.filter(x=>x!=='tollways').slice().sort();
 if(!same(avoid(a),avoid(b)))budgetReasons.push('Les évitements hors péages diffèrent.');
 if(a.preferences.avoid.includes('tollways')!==b.preferences.avoid.includes('tollways'))notes.push('La consigne concernant les péages diffère. Une consigne ne confirme pas l’absence de péage.');
 if(a.optimization!==b.optimization)notes.push('Les critères de calcul diffèrent.');
 const meeting=e=>e.meetings?[point(e.meetings.pickup),point(e.meetings.dropoff),e.meetings.stationPosition]:null;
 if(!same(meeting(a),meeting(b)))budgetReasons.push('Les rencontres de covoiturage mémorisées diffèrent.');
 const stop=e=>e.snapshot.stop?[e.snapshot.stop.id,e.snapshot.stop.lat,e.snapshot.stop.lon]:null;
 if(!same(stop(a),stop(b)))notes.push('Les arrêts carburant diffèrent ; leurs détours sont inclus dans les distances conservées.');
 if(a.timing.arriveBy!==b.timing.arriveBy||a.timing.onlyBefore!==b.timing.onlyBefore)notes.push('Les heures limites ou leurs filtres diffèrent ; aucun classement d’admissibilité n’est établi ici.');
 const row=e=>{const duration=stopDuration(e.snapshot.durationSeconds,Boolean(e.snapshot.stop),e.preferences.stopMinutes),budget=preparedBudgetTotals(e);return {entry:e,distanceKm:Math.round(e.snapshot.distanceMeters/100)/10,drivingMinutes:Math.round(e.snapshot.durationSeconds/6)/10,pauseMinutes:duration.pauseSeconds===null?null:duration.pauseSeconds/60,totalMinutes:duration.totalSeconds===null?null:Math.round(duration.totalSeconds/6)/10,budget}};
 const rows=[row(a),row(b)],roundMoney=v=>v===null?null:Math.round((v+Number.EPSILON)*100);
 if(!a.budget||!b.budget)budgetReasons.push('Au moins un budget n’a pas été conservé.');
 else{
  if(rows.some(r=>r.budget.total===null))budgetReasons.push('Au moins un budget carburant + péages est incomplet.');
  if(a.budget.fuel.price!==b.budget.fuel.price)budgetReasons.push('Les prix de référence du carburant diffèrent.');
  if(date(a.budget.capturedAt)!==date(b.budget.capturedAt))budgetReasons.push('Les budgets ont été constitués à des dates différentes.');
  const classes=e=>[...new Set(e.budget.tolls.segments.map(s=>s.vehicleClass))].sort();
  const ca=classes(a),cb=classes(b);
  if(ca.length>1||cb.length>1||(ca.length&&cb.length&&!same(ca,cb)))budgetReasons.push('Les classes de péage diffèrent ou sont multiples.');
  for(const [i,e] of [a,b].entries()){
   const t=e.budget.tolls,label=i?'B':'A';
   if(t.state==='complete'&&!t.segments.length)budgetReasons.push(`${label} : la classe et la période du tarif global ne sont pas vérifiables dans ce souvenir.`);
   if(t.segments.some(s=>s.date!==e.timing.departure?.slice(0,10)||s.date<s.source.effectiveFrom||s.date>s.source.consultationUntil||date(e.budget.capturedAt)>s.source.consultationUntil))budgetReasons.push(`${label} : la date d’un péage ou la période de sa source ne correspond pas à la préparation.`);
  }
 }
 const reasons=[...baseReasons,...budgetReasons],difference=(key)=>baseReasons.length||rows.some(r=>r[key]===null)?null:Math.round((rows[1][key]-rows[0][key])*10)/10;
 return {rows,baseReasons,budgetReasons:reasons,notes,distanceDelta:difference('distanceKm'),drivingDelta:difference('drivingMinutes'),totalDurationDelta:difference('totalMinutes'),budgetDelta:reasons.length?null:(roundMoney(rows[1].budget.total)-roundMoney(rows[0].budget.total))/100};
}
// END PREPARED COMPARISON MODEL


const PREPARED_KEY='dragonroute.prepared.v11.'+PROFILE_SCOPE,PREPARED_V10_KEY='dragonroute.prepared.v10.'+PROFILE_SCOPE,PREPARED_V9_KEY='dragonroute.prepared.v9.'+PROFILE_SCOPE,PREPARED_V8_KEY='dragonroute.prepared.v8.'+PROFILE_SCOPE,PREPARED_V7_KEY='dragonroute.prepared.v7.'+PROFILE_SCOPE,PREPARED_V6_KEY='dragonroute.prepared.v6.'+PROFILE_SCOPE,PREPARED_V5_KEY='dragonroute.prepared.v5.'+PROFILE_SCOPE,PREPARED_V4_KEY='dragonroute.prepared.v4.'+PROFILE_SCOPE,PREPARED_V3_KEY='dragonroute.prepared.v3.'+PROFILE_SCOPE,PREPARED_V2_KEY='dragonroute.prepared.v2.'+PROFILE_SCOPE,PREPARED_LEGACY_KEY='dragonroute.prepared.v1.'+PROFILE_SCOPE;
let preparedV10Snapshot=null,preparedV9Snapshot=null,preparedV8Snapshot=null,preparedV7Snapshot=null,preparedV6Snapshot=null,preparedV5Snapshot=null,preparedV4Snapshot=null,preparedLegacySnapshot=null,preparedV2Snapshot=null,preparedV3Snapshot=null;
let preparedTrips={kind:'dragonroute-preparations',version:11,entries:[]},preparedSnapshot=null,preparedBlocked=false,preparedNotice='',preparedDraft=null,preparedSelected=null,preparedImport=null,preparedSequence=0,resumePreparation=null,preparedRangePending=false;
const preparationInputs={start:null,end:null};
function loadPreparedTrips(){
 preparedTrips={kind:'dragonroute-preparations',version:11,entries:[]};preparedBlocked=false;preparedNotice='';
 try{preparedSnapshot=localStorage.getItem(PREPARED_KEY);preparedV10Snapshot=localStorage.getItem(PREPARED_V10_KEY);preparedV9Snapshot=localStorage.getItem(PREPARED_V9_KEY);preparedV8Snapshot=localStorage.getItem(PREPARED_V8_KEY);preparedV7Snapshot=localStorage.getItem(PREPARED_V7_KEY);preparedV6Snapshot=localStorage.getItem(PREPARED_V6_KEY);preparedV5Snapshot=localStorage.getItem(PREPARED_V5_KEY);preparedV4Snapshot=localStorage.getItem(PREPARED_V4_KEY);preparedV3Snapshot=localStorage.getItem(PREPARED_V3_KEY);preparedV2Snapshot=localStorage.getItem(PREPARED_V2_KEY);preparedLegacySnapshot=localStorage.getItem(PREPARED_LEGACY_KEY);const raw=preparedSnapshot??preparedV10Snapshot??preparedV9Snapshot??preparedV8Snapshot??preparedV7Snapshot??preparedV6Snapshot??preparedV5Snapshot??preparedV4Snapshot??preparedV3Snapshot??preparedV2Snapshot??preparedLegacySnapshot;if(raw!==null){const sourceVersion=preparedSnapshot!==null?11:preparedV10Snapshot!==null?10:preparedV9Snapshot!==null?9:preparedV8Snapshot!==null?8:preparedV7Snapshot!==null?7:preparedV6Snapshot!==null?6:preparedV5Snapshot!==null?5:preparedV4Snapshot!==null?4:preparedV3Snapshot!==null?3:preparedV2Snapshot!==null?2:1;const data=JSON.parse(raw);if(data.version!==sourceVersion)throw new Error('Version incohérente avec le stockage.');preparedTrips=validatePreparedTrips(data)}if(preparedSnapshot===null&&(preparedV10Snapshot!==null||preparedV9Snapshot!==null||preparedV8Snapshot!==null||preparedV7Snapshot!==null||preparedV6Snapshot!==null||preparedV5Snapshot!==null||preparedV4Snapshot!==null||preparedV3Snapshot!==null||preparedV2Snapshot!==null||preparedLegacySnapshot!==null))preparedNotice='Anciennes préparations reprises en lecture. Un prochain enregistrement créera une nouvelle sauvegarde ; l’original restera conservé et exportable.';}
 catch{preparedBlocked=true;preparedNotice='Préparations non chargées : format inconnu, contenu invalide ou stockage inaccessible. Les données restent conservées ; aucun remplacement automatique.'}
}
function writePreparedTrips(next){
 try{
  if(preparedBlocked)throw new Error('Préparations non chargées : remplacement bloqué.');
  if(localStorage.getItem(PREPARED_KEY)!==preparedSnapshot||localStorage.getItem(PREPARED_V10_KEY)!==preparedV10Snapshot||localStorage.getItem(PREPARED_V9_KEY)!==preparedV9Snapshot||localStorage.getItem(PREPARED_V8_KEY)!==preparedV8Snapshot||localStorage.getItem(PREPARED_V7_KEY)!==preparedV7Snapshot||localStorage.getItem(PREPARED_V6_KEY)!==preparedV6Snapshot||localStorage.getItem(PREPARED_V5_KEY)!==preparedV5Snapshot||localStorage.getItem(PREPARED_V4_KEY)!==preparedV4Snapshot||localStorage.getItem(PREPARED_V3_KEY)!==preparedV3Snapshot||localStorage.getItem(PREPARED_V2_KEY)!==preparedV2Snapshot||localStorage.getItem(PREPARED_LEGACY_KEY)!==preparedLegacySnapshot)throw new Error('Préparations modifiées dans un autre onglet. Recharger avant de réessayer.');
  const clean=validatePreparedTrips(next),raw=JSON.stringify(clean);localStorage.setItem(PREPARED_KEY,raw);preparedTrips=clean;preparedSnapshot=raw;return true;
 }catch(e){$('preparedMessage').textContent='Enregistrement impossible. '+e.message;return false}
}
function capturePreparedBudget(){
 const iso=v=>v!==null&&v!==undefined&&Number.isFinite(new Date(v).getTime())?new Date(v).toISOString():null;
 const price=Number($('budgetPrice').value),fuel={price:$('budgetPrice').value.trim()&&price>0&&price<=10?price:null,reference:$('budgetSource').textContent,stationId:budgetReference?.stationId||null,updatedAt:iso(budgetReference?.updated),receivedAt:iso(budgetReference?.receivedAt)};
 let state='unknown',amountCents=null,reference=$('tollSource').textContent||'Aucun tarif disponible.',segments=[];
 if(tableTolls.segments.length){
  segments=tableTolls.segments.map(s=>{const n=tariffData.networks[s.network];return {network:s.network,kind:n.kind==='passage'?'passage':'matrix',entry:n.kind==='passage'?null:n.gates[s.entry],exit:n.kind==='passage'?null:n.gates[s.exit],vehicleClass:s.vehicleClass,amountCents:s.amount,date:s.date,source:{url:n.source,title:n.sourceTitle||n.label||s.network,effectiveFrom:n.effectiveFrom,lastReviewed:n.lastReviewed,consultationUntil:n.consultationUntil}}});
  amountCents=segments.reduce((n,s)=>n+s.amountCents,0);state=$('tariffComplete').checked?'complete':'partial';reference=state==='complete'?'Couverture déclarée par la personne, non vérifiée sur la carte.':'Somme partielle des tronçons choisis ; autres péages inconnus.';
 }else if(tollState.quote){const q=tollState.quote;state={no_tolls:'no_tolls',estimated:'complete',partial:'partial',unavailable:'unknown'}[q.status];const amount=q.status==='partial'?q.knownSubtotalEur:q.amountEur;amountCents=state==='unknown'?null:Math.round(amount*100);reference+='. '+(q.warnings||[]).join(' ')}
 return {currency:'EUR',capturedAt:new Date().toISOString(),fuel,tolls:{state,amountCents,reference,segments}};
}
function preparedBudgetHtml(e,review=false){
 const b=e.budget;if(!b)return '<p class="note">Aucun budget historique conservé.</p>';
 const totals=preparedBudgetTotals(e),money=n=>n===null?'inconnu':fmt(n)+' €',h=escapeHtml;
 return `<section class="detail-section" aria-label="Budget historique"><h4>Budget historique · à réexaminer</h4><p>Conservé le ${h(new Date(b.capturedAt).toLocaleString('fr-FR'))}. Ce souvenir ne constitue pas un devis actuel.</p><p><strong>Carburant consommé : ${money(totals.fuel)} · Péages : ${money(totals.tolls)} (${h({unknown:'inconnus',partial:'partiels',complete:'couverture complète déclarée',no_tolls:'sans péage confirmé à cette date'}[b.tolls.state])}) · Total : ${totals.total===null?'incomplet':money(totals.total)}</strong></p><p>${fmt(e.snapshot.distanceMeters/1000,1)} km · ${h(e.vehicle.fuel)} · ${fmt(e.vehicle.cons,1)} L/100 km · prix ${b.fuel.price===null?'inconnu':fmt(b.fuel.price,3)+' €/L'}. ${h(b.fuel.reference)}${b.fuel.updatedAt?' Prix daté du '+h(new Date(b.fuel.updatedAt).toLocaleString('fr-FR'))+'.':''}${b.fuel.receivedAt?' Reçu le '+h(new Date(b.fuel.receivedAt).toLocaleString('fr-FR'))+'.':''}</p><p>${h(b.tolls.reference)}</p><ul>${b.tolls.segments.map((s,i)=>`<li><p>${h(s.network)} · ${s.kind==='passage'?'un passage':h(s.entry)+' → '+h(s.exit)} · classe ${s.vehicleClass} · ${money(s.amountCents/100)} · trajet du ${h(s.date)}.</p><p class="note">${h(s.source.title)} · tarif au ${h(s.source.effectiveFrom)}, relu le ${h(s.source.lastReviewed)}, consultation jusqu’au ${h(s.source.consultationUntil)}. <a href="${h(s.source.url)}" target="_blank" rel="noopener noreferrer">Source mémorisée</a></p>${review?`<button class="ghost" type="button" data-budget-recall="${i}" ${busy||!trip||trip.routing.vehicle.type==='walk'?'disabled':''}>Réexaminer ce péage</button>`:''}</li>`).join('')}</ul><p class="note">Hors stationnement, ferries et autres frais. Le plein acheté n’est pas ajouté au carburant consommé. Les anciennes confirmations et affectations aux passagers ne sont jamais rétablies.</p>${review?'<button id="budgetMemoryPrice" class="ghost" type="button">Renseigner un prix actuel</button>':''}</section>`;
}
let budgetRecall=null;
function renderBudgetMemory(){
 const e=resumePreparation?.entry,visible=e?.budget&&e.vehicle.type!=='walk'&&!resumePreparation.dismissed;
 $('budgetMemory').hidden=!visible;if(visible){const key=JSON.stringify([e,busy,!!trip,trip?.routing.vehicle.type]);if($('budgetMemory').dataset.key!==key){$('budgetMemory').dataset.key=key;$('budgetMemory').innerHTML='<summary>Budget mémorisé · à réexaminer</summary>'+preparedBudgetHtml(e,true)}}else{$('budgetMemory').replaceChildren();delete $('budgetMemory').dataset.key}
}
function recallBudgetSegment(index){
 if(busy||!trip||trip.routing.vehicle.type==='walk')return;
 const old=resumePreparation?.entry.budget?.tolls.segments[index],match=old&&preparedTariffMatch(old,tariffData);
 $('budgetMemoryMessage').textContent='';if(!match){$('budgetMemoryMessage').textContent='Ce tronçon ne correspond plus à une grille disponible. Choisir un péage dans le calculateur actuel ; le souvenir reste conservé.';return}
 if(tableTolls.segments.some(s=>s.date!==($('stationDeparture').value.slice(0,10)||localDate()))){$('budgetMemoryMessage').textContent='Actualiser la date des péages courants avant de réexaminer ce souvenir.';return}
 budgetRecall=null;$('tariffRecallConfirmed').checked=false;
 $('tariffNetwork').value=match.network;tariffGates(true);
 if(match.entry!==null){$('tariffEntry').value=String(match.entry);tariffGates();$('tariffExit').value=String(match.exit)}
 $('tariffClass').value=tableTolls.segments[0]?.vehicleClass||'';$('tariffDate').value=$('stationDeparture').value.slice(0,10)||localDate();$('tariffPassageConfirmed').checked=false;
 budgetRecall={old,signature:''};$('tariffCalculator').open=true;updateBudget();$('tariffClass').scrollIntoView({block:'center'});$('tariffClass').focus();
}
function syncBudgetRecall(){
 $('tariffRecall').hidden=!budgetRecall;if(!budgetRecall)return true;
 const key=JSON.stringify([tableTolls.key,...['tariffNetwork','tariffClass','tariffDate','tariffEntry','tariffExit','stationDeparture','fuel','cons','budgetPrice'].map(id=>$(id).value)]);
 if(key!==budgetRecall.signature){budgetRecall.signature=key;$('tariffRecallConfirmed').checked=false}
 const c=tariffCandidate(),departure=$('stationDeparture').value.slice(0,10),dateOk=!departure||departure===$('tariffDate').value;
 $('tariffRecallNote').textContent=`Souvenir : ${fmt(budgetRecall.old.amountCents/100)} € · classe ${budgetRecall.old.vehicleClass} · ${budgetRecall.old.date}. Choisir à nouveau la classe du véhicule. Le montant affiché provient de la grille actuellement disponible.${dateOk?'':' La date tarifaire doit correspondre au départ prévu.'} Vérifier le sens, le passage réel et l’absence de chevauchement sur ce nouveau trajet.`;
 return Boolean(trip&&!busy&&c&&dateOk&&$('tariffRecallConfirmed').checked);
}
function bindBudgetMemory(){
 $('preparedKeepBudget').addEventListener('change',()=>{$('preparedConfirm').checked=false;updatePreparedDuplicates()});
 $('budgetMemory').addEventListener('click',ev=>{const b=ev.target.closest('button');if(!b)return;if(b.dataset.budgetRecall!==undefined)recallBudgetSegment(Number(b.dataset.budgetRecall));else if(b.id==='budgetMemoryPrice'&&trip){$('budgetPrice').scrollIntoView({block:'center'});$('budgetPrice').focus()}});
 $('tariffRecallConfirmed').addEventListener('change',updateBudget);
 $('stationDeparture').addEventListener('input',()=>{if(budgetRecall)updateBudget()});
 $('tariffRecallCancel').addEventListener('click',()=>{budgetRecall=null;$('tariffRecallConfirmed').checked=false;$('tariffClass').value=tableTolls.segments[0]?.vehicleClass||'';tariffGates(true);updateBudget();$('budgetMemoryMessage').textContent='Réexamen annulé. Aucun ancien montant repris.'});
}

function capturePreparedTrip(){
 const r=selectedStop?.via||trip?.base;if(!trip||!r)throw new Error('Calculer un trajet avant de le sauvegarder.');
 if(!trip.meetings&&($('meetingPickup').value.trim()||$('meetingDropoff').value.trim()))throw new Error('Rencontres encore en préparation : les adopter ou les effacer avant de sauvegarder.');
 const walking=trip.routing.vehicle.type==='walk';
 if(!walking&&!readSamplingSettings().valid)throw new Error(readSamplingSettings().error);
 if(!walking&&!stopWindow().valid)throw new Error(stopWindow().error);
 if(!walking)for(const id of ['stopKmInput','stopTolerance','nearKm','cons','liters','reserveKm','maxDetourKm','maxDetourMin',...($('rangeMode').value==='none'?[]:['rangeValue'])]){const el=$(id),required=['stopKmInput','stopTolerance','nearKm','cons','liters','reserveKm','rangeValue'].includes(id);if(!el.validity.valid||(required&&!el.value.trim()))throw new Error('Vérifier le champ « '+(el.labels?.[0]?.textContent||id)+' » avant de sauvegarder.')}
 const number=id=>$(id).value.trim()===''?null:Number($(id).value),rangeMode=$('rangeMode').value;
 const label=(value,field)=>temporaryAddress(value)?`Position ${field==='start'?'de départ':'d’arrivée'} enregistrée`:value;
 return validatePreparedEntry({meetings:trip.meetings?preparedMeetings(trip.meetings):null,optimization:trip.routing.optimization,id:crypto.randomUUID(),name:trip.label.slice(0,80),savedAt:new Date().toISOString(),places:{start:{label:label(trip.places.start,'start'),lat:trip.a[0],lon:trip.a[1]},end:{label:label(trip.places.end,'end'),lat:trip.b[0],lon:trip.b[1]}},
  timing:timingRecord(routeTimingRaw()),
  vehicle:walking?{type:'walk'}:{type:trip.routing.vehicle.type,dimensions:trip.routing.vehicle.dimensions||null,fuel:$('fuel').value,cons:number('cons'),liters:number('liters')},
  preferences:walking?readWalkingCriteria():{stopMinutes:readStopMinutes(),avoid:[...trip.routing.avoid],departure:$('stationDeparture').value||null,stopMode:stopWindow().mode,stopKm:Number($('stopKmInput').value),stopTolerance:Number($('stopTolerance').value),nearKm:Number($('nearKm').value),stationScope:$('stationScope').value,stationRadiusKm:Number($('stationRadiusKm').value),stationSpacingKm:Number($('stationSpacingKm').value),stationMaxPoints:Number($('stationMaxPoints').value),rangeMode,rangeValue:rangeMode==='none'?null:number('rangeValue'),reserveKm:number('reserveKm'),rangeOnly:$('rangeOnly').checked,maxDetourKm:number('maxDetourKm'),maxDetourMin:number('maxDetourMin'),services:serviceSelection(),openingFilter:$('stationOpeningFilter').value,listMode:$('stationListMode').value},
  snapshot:{calculatedAt:selectedStop?.confirmedAt||trip.calculatedAt,engine:trip.routing.provider,distanceMeters:r.distance,durationSeconds:r.duration,geometry:r.geometry.coordinates.map(p=>p.slice(0,2)),stop:selectedStop?{id:selectedStop.station.id,address:selectedStop.station.address,city:selectedStop.station.city,lat:selectedStop.station.lat,lon:selectedStop.station.lon}:null}});
}
function preparedSchemaSvg(e){
 const points=e.snapshot.geometry,lon=points.map(p=>p[0]),lat=points.map(p=>p[1]),minX=Math.min(...lon),minY=Math.min(...lat),dx=Math.max(.001,Math.max(...lon)-minX),dy=Math.max(.001,Math.max(...lat)-minY),scale=Math.min(520/dx,180/dy),x0=(600-dx*scale)/2,y0=(260-dy*scale)/2;
 const project=p=>[(p[0]-minX)*scale+x0,260-y0-(p[1]-minY)*scale],path=points.map(p=>project(p).map(n=>n.toFixed(2)).join(',')).join(' '),a=project(points[0]),b=project(points.at(-1)),stop=e.snapshot.stop,sp=stop?project([stop.lon,stop.lat]):null;
 return `<svg class="prepared-schema" viewBox="0 0 600 260" role="img" aria-label="Schéma du tracé enregistré, sans fond cartographique"><polyline points="${path}" fill="none" stroke="#82baff" stroke-width="5"/>${[a,b].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="7" fill="#fff"/>`).join('')}${sp?`<circle cx="${sp[0]}" cy="${sp[1]}" r="9" fill="#f2c66d"/>`:''}</svg>`;
}
function preparedDescription(e,withMap=false){
 const p=e.preferences,s=e.snapshot,criterion='<p>Critère enregistré : '+escapeHtml(optimizationLabel(e.optimization))+'.'+(e.optimization===null?' Il devra être choisi avant le nouveau calcul.':'')+'</p>';
 if(e.vehicle.type==='walk')return `<h3>${escapeHtml(e.name)}</h3><p>${escapeHtml(e.places.start.label)} → ${escapeHtml(e.places.end.label)}</p><p class="note">Sauvegarde du ${escapeHtml(new Date(e.savedAt).toLocaleString('fr-FR'))}. Calcul IGN du ${escapeHtml(new Date(s.calculatedAt).toLocaleString('fr-FR'))}.</p><p><strong>Instantané à pied : ${fmt(s.distanceMeters/1000,1)} km · ${Math.round(s.durationSeconds/60)} min, hors pauses.</strong></p><p>${escapeHtml(walkingPreference(s.distanceMeters,p))} Aucun véhicule ni arrêt carburant associé.</p>${criterion}${preparedTimingText(e)}${withMap?preparedSchemaSvg(e):''}<p class="note">Tracé historique déclaré. Pente, escaliers, terrain et accessibilité non vérifiés. La reprise charge les paramètres et exige un nouveau calcul à pied ; aucun ancien résultat présenté comme actuel.</p>`;
 return `<h3>${escapeHtml(e.name)}</h3><p>${escapeHtml(e.places.start.label)} → ${escapeHtml(e.places.end.label)}</p><p class="note">Sauvegarde du ${escapeHtml(new Date(e.savedAt).toLocaleString('fr-FR'))}. Calcul ${s.engine.toUpperCase()} du ${escapeHtml(new Date(s.calculatedAt).toLocaleString('fr-FR'))}.</p>
 <p><strong>Instantané : ${fmt(s.distanceMeters/1000,1)} km · ${escapeHtml(stopDurationText(s.durationSeconds,Boolean(s.stop),p.stopMinutes))}</strong></p><p>Durée prévue à la station : ${p.stopMinutes===null?'non renseignée':fmt(p.stopMinutes,1)+' min'}. ${s.stop?'Incluse seulement dans l’estimation conduite + pause.':'Non appliquée : aucun arrêt mémorisé.'}</p>
 <p>${e.vehicle.type==='truck'?'Poids lourd · '+escapeHtml(dimensionLabel(e.vehicle.dimensions)):'Véhicule léger'} · ${escapeHtml(e.vehicle.fuel)} · ${fmt(e.vehicle.cons,1)} L/100 km · ${fmt(e.vehicle.liters,0)} L à acheter.</p>
 <p>Évitements : ${escapeHtml(p.avoid.length?p.avoid.map(x=>avoidLabels[x]).join(', '):'aucun')}. Départ prévu : ${escapeHtml(p.departure?p.departure.replace('T',' ')+' (Paris)':'non renseigné')}.</p>
 <p>${s.stop?'Arrêt mémorisé, à rechercher à nouveau : '+escapeHtml(s.stop.address):'Aucun arrêt mémorisé.'}</p>
 <details><summary>Préférences conservées</summary><p>Collecte géographique : ${p.stationScope==='window'?'portion recherchée':'tracé entier'}, rayon ${fmt(p.stationRadiusKm,1)} km, espacement ${fmt(p.stationSpacingKm,1)} km, maximum ${p.stationMaxPoints} points. Accès routiers à recalculer ; couverture non exhaustive.</p><p>${escapeHtml({soon:'Au plus tôt',near:'Bon compromis dans les '+p.nearKm+' premiers km',around:'Vers '+p.stopKm+' km, marge ±'+p.stopTolerance+' km'}[p.stopMode])}. Détour maximal : ${p.maxDetourKm===null?'sans limite':fmt(p.maxDetourKm,1)+' km'} / ${p.maxDetourMin===null?'sans limite':fmt(p.maxDetourMin,1)+' min'}. Services : ${escapeHtml(p.services.join(', ')||'aucun requis')}. Filtre horaires : ${escapeHtml({all:'tous',compatible:'compatibles',unknown:'inconnus',outside:'hors guichet'}[p.openingFilter])}.</p><p>Autonomie : ${p.rangeMode==='none'?'inconnue':fmt(p.rangeValue,1)+(p.rangeMode==='km'?' km':' L')+', réserve '+fmt(p.reserveKm,0)+' km'}${p.rangeOnly?' · filtre de portée demandé':''}. L’autonomie conservée devra être actualisée au nouveau départ.</p></details>
 ${e.meetings?`<p>Rencontres mémorisées : prise en charge ${escapeHtml(e.meetings.pickup.label)} → dépose ${escapeHtml(e.meetings.dropoff.label)}. Plein ${meetingPositionText(e.meetings)}. Limites totales : +${e.meetings.limits.km} km / +${e.meetings.limits.minutes} min. À recalculer puis adopter après le nouveau trajet ; anciens frais non repris.</p>`:''}${criterion}${preparedTimingText(e)}${preparedBudgetHtml(e)}${withMap?preparedSchemaSvg(e):''}<p class="note">Tracé et estimations historiques. Les informations actuelles doivent être vérifiées à nouveau. Un éventuel budget mémorisé reste historique. La reprise charge les paramètres ; elle demande un nouveau calcul et une nouvelle confirmation de l’arrêt.</p>`;
}
let preparedComparisonStale=false;
function clearPreparedComparison(message='',close=false){
 $('preparedCompareResult').hidden=true;$('preparedCompareResultBody').replaceChildren();delete $('preparedCompareResult').dataset.ids;$('preparedCompareStatus').textContent=message;
 if(close){for(const id of ['preparedCompareA','preparedCompareB'])$(id).value='';$('preparedCompareRun').disabled=true;$('preparedComparePanel').hidden=true;$('preparedCompareOpen').setAttribute('aria-expanded','false');$('preparedDialog').classList.remove('prepared-comparing')}
}
function preparedComparisonFresh(){
 try{const keys=[PREPARED_KEY,PREPARED_V10_KEY,PREPARED_V9_KEY,PREPARED_V8_KEY,PREPARED_V7_KEY,PREPARED_V6_KEY,PREPARED_V5_KEY,PREPARED_V4_KEY,PREPARED_V3_KEY,PREPARED_V2_KEY,PREPARED_LEGACY_KEY],values=[preparedSnapshot,preparedV10Snapshot,preparedV9Snapshot,preparedV8Snapshot,preparedV7Snapshot,preparedV6Snapshot,preparedV5Snapshot,preparedV4Snapshot,preparedV3Snapshot,preparedV2Snapshot,preparedLegacySnapshot];if(!keys.every((k,i)=>localStorage.getItem(k)===values[i]))preparedComparisonStale=true}catch{preparedComparisonStale=true}
 if(preparedComparisonStale){clearPreparedComparison('La liste a changé ou son stockage est inaccessible. Recharger la page avant de comparer ; les brouillons restent en place.');$('preparedCompareRun').disabled=true;return false}return !preparedBlocked;
}
function renderPreparedComparisonChoices(){
 clearPreparedComparison('',true);const entries=preparedTrips.entries.filter(e=>e.vehicle.type!=='walk');
 for(const id of ['preparedCompareA','preparedCompareB']){$(id).replaceChildren(new Option('Choisir une préparation',''));for(const e of entries)$(id).add(new Option(e.name+' · '+e.places.start.label+' → '+e.places.end.label,e.id))}
 $('preparedCompareOpen').disabled=preparedBlocked||entries.length<2;$('preparedCompareRun').disabled=true;
 $('preparedCompareHint').textContent=entries.length<2?'Enregistrer au moins deux préparations routières pour les comparer.':'Comparer deux souvenirs datés, sans nouveau calcul ni modification de la liste.';
}
function preparedComparisonCard(row,index){
 const e=row.entry,letter=index?'B':'A',h=escapeHtml,clock=v=>new Date(v).toLocaleString('fr-FR',{timeZone:'Europe/Paris'}),minutes=v=>v===null?'Inconnue':fmt(v,1)+' min';
 const field=(label,value)=>`<div><dt>${label}</dt><dd>${value}</dd></div>`;
 const p=e.preferences,s=e.snapshot,v=e.vehicle,b=row.budget,price=e.budget?.fuel.price;
 const timing=timingEstimate(row.totalMinutes===null?null:stopDuration(s.durationSeconds,Boolean(s.stop),p.stopMinutes).totalSeconds,timingHypotheses(e.timing));
 return `<article class="prepared-compare-card" aria-label="Préparation ${letter}"><h4>${letter} · ${h(e.name)}</h4><p>${h(e.places.start.label)} → ${h(e.places.end.label)}</p><p class="note">Calcul ${s.engine.toUpperCase()} du ${h(clock(s.calculatedAt))}. Enregistré le ${h(clock(e.savedAt))} (Paris).</p><dl>${field('Distance',fmt(row.distanceKm,1)+' km')}${field('Conduite',minutes(row.drivingMinutes))}${field('Pause à la station',s.stop?minutes(row.pauseMinutes):'Sans arrêt mémorisé')}${field('Conduite + pause station',minutes(row.totalMinutes))}${field('Départ prévu',h(e.timing.departure?.replace('T',' ')||'Non renseigné'))}${field('Heure limite',h(e.timing.arriveBy?.replace('T',' ')||'Non renseignée'))}${field('Arrivée estimée',h(timingText(timing)))}${field('Véhicule',h(v.type==='truck'?'Poids lourd · '+dimensionLabel(v.dimensions):'Véhicule léger'))}${field('Carburant et consommation',h(v.fuel)+' · '+fmt(v.cons,1)+' L/100 km')}${field('Prix de référence',price==null?'Inconnu':fmt(price,3)+' €/L')}${field('Carburant consommé',b?.fuel==null?'Inconnu':fmt(b.fuel)+' €')}${field('Péages',b?.tolls==null?'Inconnus':fmt(b.tolls)+' € · '+h({partial:'partiels',complete:'couverture complète déclarée',no_tolls:'sans péage confirmé à cette date'}[e.budget.tolls.state]))}${field('Total historique carburant + péages',b?.total==null?'Incomplet':fmt(b.total)+' €')}${field('Arrêt mémorisé',h(s.stop?.address||'Aucun'))}${field('Rencontres',e.meetings?h(e.meetings.pickup.label+' → '+e.meetings.dropoff.label):'Aucune')}${field('Évitements',h(p.avoid.map(x=>avoidLabels[x]).join(', ')||'Aucun'))}${field('Critère de calcul',h(optimizationLabel(e.optimization)))}</dl><details><summary>Sources et hypothèses du budget ${letter}</summary>${preparedBudgetHtml(e)}</details><button type="button" class="ghost" data-prepared-compare-resume="${e.id}">Préparer à nouveau ${letter}</button></article>`;
}
function showPreparedComparison(){
 clearPreparedComparison();if(!preparedComparisonFresh())return;
 try{const ids=[$('preparedCompareA').value,$('preparedCompareB').value],entries=ids.map(id=>preparedTrips.entries.find(e=>e.id===id)),result=comparePreparedTrips(...entries),h=escapeHtml;
 const delta=(value,unit)=>value===null?'Non comparable / incomplet':value===0?'Égalité à la précision affichée':(value>0?'+':'−')+fmt(Math.abs(value),unit==='€'?2:1)+' '+unit;
 $('preparedCompareResultBody').innerHTML=`<p class="note">Montants pour le véhicule entier, sans répartition par voyageur. Hors stationnement, ferries, autres frais, autres pauses et trafic en direct. Aucun classement de meilleur trajet ni garantie de passage ou de terrain.</p><div class="prepared-compare-grid">${result.rows.map(preparedComparisonCard).join('')}</div><section class="detail-section" aria-label="Écarts entre les préparations"><h4>Écarts B moins A</h4><dl>${[['Distance',result.distanceDelta,'km'],['Conduite',result.drivingDelta,'min'],['Conduite + pause station',result.totalDurationDelta,'min'],['Budget historique carburant + péages',result.budgetDelta,'€']].map(([label,value,unit])=>`<div><dt>${label}</dt><dd>${delta(value,unit)}</dd></div>`).join('')}</dl><p>${result.budgetDelta===null?'Les montants restent consultables, mais aucun écart budgétaire comparable n’est annoncé.':'Écart arithmétique des budgets historiques selon les hypothèses conservées. Ce n’est pas une économie actuelle garantie.'}</p>${result.budgetReasons.length?'<ul>'+result.budgetReasons.map(t=>'<li>'+h(t)+'</li>').join('')+'</ul>':''}${result.notes.length?'<ul>'+result.notes.map(t=>'<li>'+h(t)+'</li>').join('')+'</ul>':''}<p class="note">Les valeurs affichées sont arrondies avant comparaison : 0,1 km, 0,1 min et 0,01 €. Les préparations importées restent déclaratives. Reprendre chaque trajet pour actualiser ses données.</p></section>`;
 $('preparedCompareResult').dataset.ids=JSON.stringify(ids);$('preparedCompareResult').hidden=false;$('preparedCompareStatus').textContent='Comparaison affichée sans requête ni enregistrement.';$('preparedCompareResultTitle').focus();
 }catch(e){$('preparedCompareStatus').textContent='Comparaison impossible. '+e.message}
}
function bindPreparedComparison(){
 $('preparedCompareOpen').addEventListener('click',()=>{if(!preparedComparisonFresh())return;const open=$('preparedComparePanel').hidden;$('preparedComparePanel').hidden=!open;$('preparedCompareOpen').setAttribute('aria-expanded',String(open));$('preparedDialog').classList.toggle('prepared-comparing',open);if(open){$('preparedView').hidden=true;$('preparedCompareA').focus()}else clearPreparedComparison('',true)});
 for(const id of ['preparedCompareA','preparedCompareB'])$(id).addEventListener('change',()=>{clearPreparedComparison('Choix modifié : lancer la comparaison.');$('preparedCompareRun').disabled=!$('preparedCompareA').value||!$('preparedCompareB').value||$('preparedCompareA').value===$('preparedCompareB').value||!preparedComparisonFresh()});
 $('preparedCompareForm').addEventListener('submit',ev=>{ev.preventDefault();showPreparedComparison()});
 $('preparedCompareClose').addEventListener('click',()=>{clearPreparedComparison('',true);$('preparedCompareOpen').focus()});
 $('preparedCompareResult').addEventListener('click',ev=>{const button=ev.target.closest('button[data-prepared-compare-resume]');if(!button||!preparedComparisonFresh())return;if($('preparedCompareResult').dataset.ids!==JSON.stringify([$('preparedCompareA').value,$('preparedCompareB').value])){clearPreparedComparison('Choix modifié : lancer à nouveau la comparaison.');return}const id=button.dataset.preparedCompareResume;if(![$('preparedCompareA').value,$('preparedCompareB').value].includes(id))return;const e=preparedTrips.entries.find(x=>x.id===id);if(e)resumePreparedTrip(e)});
 $('preparedDialog').addEventListener('close',()=>{if(!$('preparedDialog').open)clearPreparedComparison('',true)});
 window.addEventListener('storage',ev=>{if(ev.key===null||/^dragonroute\.prepared\.v\d+\./.test(ev.key)&&ev.key.endsWith('.'+PROFILE_SCOPE)){preparedComparisonStale=true;if($('preparedDialog').open)preparedComparisonFresh()}});
}

function renderPreparedTrips(){
 renderPreparedComparisonChoices();
 $('preparedV10Export').hidden=preparedV10Snapshot===null;
 $('preparedV9Export').hidden=preparedV9Snapshot===null;
 $('preparedV8Export').hidden=preparedV8Snapshot===null;
 $('preparedV7Export').hidden=preparedV7Snapshot===null;
 $('preparedV6Export').hidden=preparedV6Snapshot===null;
 $('preparedV5Export').hidden=preparedV5Snapshot===null;$('preparedRawExport').hidden=!preparedBlocked||(preparedSnapshot??preparedV10Snapshot??preparedV9Snapshot??preparedV8Snapshot??preparedV7Snapshot??preparedV6Snapshot??preparedV5Snapshot??preparedV4Snapshot??preparedV3Snapshot??preparedV2Snapshot??preparedLegacySnapshot)===null;
 $('preparedV4Export').hidden=preparedV4Snapshot===null;
 $('preparedLegacyExport').hidden=preparedLegacySnapshot===null;
 $('preparedV2Export').hidden=preparedV2Snapshot===null;$('preparedV3Export').hidden=preparedV3Snapshot===null;
 $('preparedExport').disabled=preparedBlocked;$('preparedImportFile').disabled=preparedBlocked;
 $('preparedList').innerHTML=preparedTrips.entries.length?preparedTrips.entries.map(e=>`<article class="saved-row"><strong>${escapeHtml(e.name)}</strong><p>${escapeHtml(e.places.start.label)} → ${escapeHtml(e.places.end.label)}</p><p class="note">${escapeHtml(new Date(e.savedAt).toLocaleString('fr-FR'))} · ${e.vehicle.type==='walk'?'à pied':e.vehicle.type==='truck'?'poids lourd':'véhicule léger'} · instantané ${fmt(e.snapshot.distanceMeters/1000,1)} km</p><div class="row-actions"><button class="ghost" data-prepared-show="${e.id}">Consulter</button><button class="ghost" data-prepared-rename="${e.id}">Renommer</button><button class="ghost" data-prepared-delete="${e.id}">Supprimer</button></div></article>`).join(''):'<p class="note">Aucune préparation chargée.</p>';
 const selected=preparedTrips.entries.find(e=>e.id===preparedSelected);$('preparedView').hidden=!selected;
 if(selected)$('preparedDetails').innerHTML=preparedDescription(selected,true);
}
function openPreparedTrips(){
 if(busy)return;resetSavedTransit();resetSavedCycle();resetSavedShared();preparedDraft=null;preparedSelected=null;preparedImport=null;preparedSequence++;
 $('preparedEditor').hidden=true;$('preparedMessage').textContent=preparedNotice;renderPreparedTrips();if(!$('preparedDialog').open)$('preparedDialog').showModal();
}
function showPreparedEditor(entry,mode){
 clearPreparedComparison('',true);
 const budget=mode==='new'&&entry.vehicle.type!=='walk'?capturePreparedBudget():null;
 $('preparedBudgetChoice').hidden=!budget;$('preparedKeepBudget').checked=false;
 $('preparedBudgetPreview').innerHTML=budget?preparedBudgetHtml({...entry,budget}):'';
 preparedDraft={entry,mode,budget};$('preparedEditor').hidden=false;$('preparedName').value=entry.name;$('preparedConfirm').checked=false;$('preparedDuplicate').checked=false;
 $('preparedEditorTitle').textContent=mode==='rename'?'Renommer cette préparation':'Enregistrer cette préparation';$('preparedSave').textContent=mode==='rename'?'Enregistrer le nom':'Enregistrer dans ce navigateur';$('preparedName').focus();updatePreparedDuplicates();
}
function updatePreparedDuplicates(){
 if(!preparedDraft)return;
 const entry={...preparedDraft.entry,name:$('preparedName').value},duplicates=preparedDuplicates(entry,preparedTrips.entries);
 $('preparedDuplicateRow').hidden=!duplicates.length;$('preparedDuplicateNote').textContent=duplicates.length?`${duplicates.length} préparation(s) portent déjà ce nom ou les mêmes paramètres. Aucun remplacement automatique.`:'';
 $('preparedSave').disabled=preparedBlocked||!$('preparedConfirm').checked||(duplicates.length&&!$('preparedDuplicate').checked);
}
function resumePreparedTrip(e){
 if(busy)return;if(trip&&!confirm('Remplacer les paramètres du trajet affiché par cette préparation ? Les résultats actuels seront effacés.'))return;
 clearResults();clearMeetingDraft();resetProspective();resetRememberedInputs();detachTripVehicle();
 if(e.meetings){const plan=e.meetings;for(const [key,id] of [["pickup","meetingPickup"],["dropoff","meetingDropoff"]]){$(id).value=plan[key].label;meetingInputs[key]={value:plan[key].label,place:{...plan[key]}}}$("meetingMaxKm").value=plan.limits.km;$("meetingMaxMin").value=plan.limits.minutes;$("meetingStationPosition").value=plan.stationPosition;meetingEndpoints=JSON.stringify([[e.places.start.lat,e.places.start.lon],[e.places.end.lat,e.places.end.lon]]);}
 const timing=resumeTiming(e.timing,Date.now());$('stationDeparture').value=timing.departure??'';$('routeArriveBy').value=timing.arriveBy??'';$('routeOnlyBefore').checked=timing.onlyBefore;
 const p=e.preferences,walking=e.vehicle.type==='walk';$('travelMode').value=walking?'walk':'car';$('routeOptimization').value=e.optimization??'';
 for(const field of ['start','end']){const place=e.places[field];$(field).value=place.label;preparationInputs[field]={value:place.label,place:{lat:place.lat,lon:place.lon,label:place.label}};$(field+'PlaceNote').hidden=false;$(field+'PlaceNote').textContent='Point de la préparation sauvegardée, repris sans nouvelle recherche d’adresse.'}
 if(!walking){
 $('routeVehicle').value=e.vehicle.type;for(const [key,id] of Object.entries(dimensionFields))$(id).value=e.vehicle.dimensions?.[key]??'';
 $('fuel').value=e.vehicle.fuel;$('cons').value=e.vehicle.cons;$('liters').value=e.vehicle.liters;
 document.querySelectorAll('.avoid-options input').forEach(el=>el.checked=p.avoid.includes(el.value));
 $('budgetPrice').value='';budgetReference=null;clearTableTolls();tollState.enabled=false;resetTollQuote();
 document.querySelector(`input[name="stopMode"][value="${p.stopMode}"]`).checked=true;$('stopKmInput').value=p.stopKm;$('stopTolerance').value=p.stopTolerance;$('nearKm').value=p.nearKm;$('stationScope').value=p.stationScope;$('stationRadiusKm').value=p.stationRadiusKm;$('stationSpacingKm').value=p.stationSpacingKm;$('stationMaxPoints').value=p.stationMaxPoints;
 $('stopMinutes').value=p.stopMinutes??'';$('rangeMode').value=p.rangeMode;$('rangeValue').value=p.rangeValue??'';$('reserveKm').value=p.reserveKm;$('rangeOnly').checked=p.rangeOnly;rangeMeasuredAt=null;
 $('maxDetourKm').value=p.maxDetourKm??'';$('maxDetourMin').value=p.maxDetourMin??'';$('stationOpeningFilter').value=p.openingFilter;$('stationListMode').value=p.listMode;
 $('serviceChoices').innerHTML=p.services.map(name=>`<label class="check-label"><input type="checkbox" data-service checked value="${escapeHtml(name)}"> ${escapeHtml(name)}</label>`).join('');
 resumePreparation={entry:structuredClone(e),expired:timing.review,dismissed:false};$('activeVehicle').hidden=true;preparedRangePending=p.rangeMode!=='none';
 updateVehicleRouting();updateWindow();updateRange();refreshArrival();updateResumePreparation();
 }else{
  fillWalkingCriteria(p);resumePreparation={entry:structuredClone(e),expired:timing.review,dismissed:false};preparedRangePending=false;updateVehicleRouting();refreshArrival();updateResumePreparation();
 }
 $('preparedDialog').close();setStatus('Préparation reprise. Vérifier les paramètres puis calculer un nouveau trajet.');$(e.optimization===null?'routeOptimization':'goBtn').focus();
}
function updateResumePreparation(){
 renderBudgetMemory();
 const e=resumePreparation?.entry;$('preparedResume').hidden=!e||resumePreparation.dismissed;if(!e)return;
 const departure=departureInstant($('stationDeparture').value).instant,expired=!Number.isFinite(departure)||departure<Date.now()-60000;
 if(e.vehicle.type==='walk'){$('preparedResumeNote').textContent=(e.optimization===null?'Critère ancien non renseigné : choisir avant de recalculer. ':'')+`Préparation à pied « ${e.name} » reprise. ${trip?'Nouveau trajet calculé.':'Calculer un nouvel itinéraire à pied avant de partir.'}${expired?' Départ passé ou absent : vérifier les horaires du trajet et l’heure limite.':''}`;$('preparedStopNote').hidden=true;$('preparedReviewStop').hidden=true;return}
 let unavailable='';try{ensureRouting(routingPreferences())}catch(err){unavailable=' '+err.message}
 $('preparedResumeNote').textContent=`Préparation « ${e.name} » reprise. ${trip?'Nouveau trajet calculé ; vérifier les arrêts.':'Un nouveau calcul est nécessaire ; le tracé peut changer.'}${expired?' Départ passé ou absent : choisir une nouvelle heure dans les horaires du trajet et vérifier l’heure limite.':''}${preparedRangePending?' Autonomie mémorisée à actualiser pour ce départ.':''}${unavailable}${e.meetings&&!trip?.meetings?' Rencontres mémorisées à recalculer puis adopter dans Covoiturage ; elles ne sont pas encore incluses.':''}`;
 const stop=e.snapshot.stop,found=stop&&compared.find(s=>s.id===stop.id);
 $('preparedStopNote').hidden=!stop;$('preparedStopNote').textContent=stop?`Arrêt souhaité : ${stop.address}. `+(selectedStop?.station.id===stop.id?'Confirmé dans ce nouveau trajet.':found?'Retrouvé dans les résultats actuels ; consulter sa fiche avant de le choisir.':stationSearch?'Non retrouvé dans cette recherche limitée : hors sélection, carburant absent ou informations indisponibles possibles. Aucun arrêt ajouté.':'Rechercher les stations après le nouveau calcul pour le retrouver. Aucun arrêt ajouté.') :'';
 $('preparedReviewStop').hidden=!found;$('preparedReviewStop').disabled=busy;
}
function bindPreparedTrips(){
 bindBudgetMemory();bindPreparedComparison();
 $('clearUnavailableOptions').addEventListener('click',()=>{if(busy)return;const inputs=[...document.querySelectorAll('.avoid-options input:checked')].filter(el=>el.dataset.routingAvailable==='false');if(!inputs.length||!confirm('Retirer explicitement ces exclusions du nouveau calcul : '+inputs.map(el=>avoidLabels[el.value]).join(', ')+' ? La préparation sauvegardée reste inchangée.'))return;inputs.forEach(el=>el.checked=false);invalidateRouting();updateResumePreparation()});
 for(const id of ['rangeMode','rangeValue','reserveKm'])$(id).addEventListener('input',()=>{preparedRangePending=false;updateRange();updateResumePreparation()});
 $('preparedBtn').addEventListener('click',openPreparedTrips);
 $('savePreparationBtn').addEventListener('click',()=>{if(busy)return;openPreparedTrips();try{updateBudget();showPreparedEditor(capturePreparedTrip(),'new')}catch(e){$('preparedMessage').textContent=e.message}});
 $('preparedName').addEventListener('input',()=>{$('preparedConfirm').checked=false;$('preparedDuplicate').checked=false;updatePreparedDuplicates()});
 for(const id of ['preparedConfirm','preparedDuplicate'])$(id).addEventListener('change',updatePreparedDuplicates);
 $('preparedForm').addEventListener('submit',ev=>{
  ev.preventDefault();if(!preparedDraft)return;
  try{
   const entry=validatePreparedEntry({...preparedDraft.entry,name:$('preparedName').value,...(preparedDraft.mode==='new'?{savedAt:new Date().toISOString(),budget:$('preparedKeepBudget').checked?preparedDraft.budget:null}:{})});
   if(!$('preparedConfirm').checked||(preparedDuplicates(entry,preparedTrips.entries).length&&!$('preparedDuplicate').checked))throw new Error('Confirmer l’enregistrement et le doublon éventuel.');
   const entries=preparedDraft.mode==='rename'?preparedTrips.entries.map(e=>e.id===entry.id?entry:e):[...preparedTrips.entries,entry];
   if(writePreparedTrips({kind:'dragonroute-preparations',version:11,entries})){preparedDraft=null;$('preparedEditor').hidden=true;preparedSelected=entry.id;renderPreparedTrips();$('preparedMessage').textContent='Préparation enregistrée dans ce navigateur.'}
  }catch(e){$('preparedMessage').textContent=e.message}
 });
 $('preparedList').addEventListener('click',ev=>{
  const b=ev.target.closest('button');if(!b)return;const id=b.dataset.preparedShow||b.dataset.preparedRename||b.dataset.preparedDelete,e=preparedTrips.entries.find(x=>x.id===id);if(!e)return;
  if(b.dataset.preparedShow){preparedDraft=null;$('preparedEditor').hidden=true;preparedSelected=id;renderPreparedTrips();$('preparedView').scrollIntoView({block:'start'})}
  else if(b.dataset.preparedRename)showPreparedEditor(structuredClone(e),'rename');
  else if(confirm(`Supprimer la préparation « ${e.name} » de ce navigateur ?`)&&writePreparedTrips({kind:'dragonroute-preparations',version:11,entries:preparedTrips.entries.filter(x=>x.id!==id)})){preparedSelected=null;preparedDraft=null;$('preparedEditor').hidden=true;renderPreparedTrips();$('preparedMessage').textContent='Préparation supprimée.'}
 });
 $('preparedResumeBtn').addEventListener('click',()=>{const e=preparedTrips.entries.find(x=>x.id===preparedSelected);if(e)resumePreparedTrip(e)});
 $('preparedReviewStop').addEventListener('click',()=>{const id=resumePreparation?.entry.snapshot.stop?.id;if(id)openStation(id)});
 $('preparedDismiss').addEventListener('click',()=>{if(resumePreparation)resumePreparation.dismissed=true;updateResumePreparation()});
 $('preparedV10Export').addEventListener('click',()=>{if(preparedV10Snapshot!==null)downloadCycleText(preparedV10Snapshot,'DragonRoute-preparations-originales-v10.json')});
 $('preparedV9Export').addEventListener('click',()=>{if(preparedV9Snapshot!==null)downloadCycleText(preparedV9Snapshot,'DragonRoute-preparations-originales-v9.json')});
 $('preparedV8Export').addEventListener('click',()=>{if(preparedV8Snapshot!==null)downloadCycleText(preparedV8Snapshot,'DragonRoute-preparations-originales-v8.json')});
 $('preparedV7Export').addEventListener('click',()=>{if(preparedV7Snapshot!==null)downloadCycleText(preparedV7Snapshot,'DragonRoute-preparations-originales-v7.json')});
 $('preparedV6Export').addEventListener('click',()=>{if(preparedV6Snapshot!==null)downloadCycleText(preparedV6Snapshot,'DragonRoute-preparations-originales-v6.json')});
 $('preparedV5Export').addEventListener('click',()=>{if(preparedV5Snapshot!==null)downloadCycleText(preparedV5Snapshot,'DragonRoute-preparations-originales-v5.json')});
 $('preparedRawExport').addEventListener('click',()=>{const raw=preparedSnapshot??preparedV10Snapshot??preparedV9Snapshot??preparedV8Snapshot??preparedV7Snapshot??preparedV6Snapshot??preparedV5Snapshot??preparedV4Snapshot??preparedV3Snapshot??preparedV2Snapshot??preparedLegacySnapshot;if(raw!==null)downloadCycleText(raw,'DragonRoute-preparations-original-non-valide.json')});
 $('preparedV4Export').addEventListener('click',()=>{if(preparedV4Snapshot===null)return;try{downloadProfile(JSON.parse(preparedV4Snapshot),'DragonRoute-preparations-originales-v4.json')}catch{$('preparedMessage').textContent='Original illisible : aucun export JSON effectué.'}});
 $('preparedV3Export').addEventListener('click',()=>{if(preparedV3Snapshot===null)return;try{downloadProfile(JSON.parse(preparedV3Snapshot),'DragonRoute-preparations-originales-v3.json')}catch{$('preparedMessage').textContent='Original illisible : aucun export JSON effectué.'}});
 $('preparedV2Export').addEventListener('click',()=>{if(preparedV2Snapshot===null)return;try{downloadProfile(JSON.parse(preparedV2Snapshot),'DragonRoute-preparations-originales-v2.json')}catch{$('preparedMessage').textContent='Original illisible : aucun export JSON effectué.'}});
 $('preparedLegacyExport').addEventListener('click',()=>{if(preparedLegacySnapshot===null)return;try{downloadProfile(JSON.parse(preparedLegacySnapshot),'DragonRoute-preparations-originales-v1.json')}catch{$('preparedMessage').textContent='Original illisible : aucun export JSON effectué.'}});
 $('preparedExport').addEventListener('click',()=>{if(!preparedBlocked)downloadProfile(preparedTrips,'DragonRoute-preparations.json')});
 $('preparedBackup').addEventListener('click',()=>{if(!preparedBlocked)downloadProfile(preparedTrips,'DragonRoute-preparations-avant-import.json')});
 $('preparedErase').addEventListener('click',()=>{
  if(!confirm('Effacer les préparations route/marche de cet environnement, y compris leurs anciennes sauvegardes ? Les préparations collectives, le profil, le journal et les autres aperçus seront conservés.'))return;
  try{if(localStorage.getItem(PREPARED_KEY)!==preparedSnapshot||localStorage.getItem(PREPARED_V10_KEY)!==preparedV10Snapshot||localStorage.getItem(PREPARED_V9_KEY)!==preparedV9Snapshot||localStorage.getItem(PREPARED_V8_KEY)!==preparedV8Snapshot||localStorage.getItem(PREPARED_V7_KEY)!==preparedV7Snapshot||localStorage.getItem(PREPARED_V6_KEY)!==preparedV6Snapshot||localStorage.getItem(PREPARED_V5_KEY)!==preparedV5Snapshot||localStorage.getItem(PREPARED_V4_KEY)!==preparedV4Snapshot||localStorage.getItem(PREPARED_V3_KEY)!==preparedV3Snapshot||localStorage.getItem(PREPARED_V2_KEY)!==preparedV2Snapshot||localStorage.getItem(PREPARED_LEGACY_KEY)!==preparedLegacySnapshot)throw new Error('Données modifiées dans un autre onglet : recharger avant l’effacement.');localStorage.removeItem(PREPARED_LEGACY_KEY);localStorage.removeItem(PREPARED_V2_KEY);localStorage.removeItem(PREPARED_V4_KEY);localStorage.removeItem(PREPARED_V3_KEY);localStorage.removeItem(PREPARED_V5_KEY);localStorage.removeItem(PREPARED_V7_KEY);localStorage.removeItem(PREPARED_V6_KEY);localStorage.removeItem(PREPARED_V8_KEY);localStorage.removeItem(PREPARED_V9_KEY);localStorage.removeItem(PREPARED_V10_KEY);localStorage.removeItem(PREPARED_KEY);loadPreparedTrips();preparedSelected=null;preparedDraft=null;$('preparedEditor').hidden=true;renderPreparedTrips();$('preparedMessage').textContent='Préparations effacées.'}catch(e){$('preparedMessage').textContent='Effacement impossible. '+e.message}
 });
 $('preparedImportFile').addEventListener('change',async ev=>{
  const seq=++preparedSequence,file=ev.target.files?.[0];ev.target.value='';preparedImport=null;if(!file)return;
  try{if(preparedBlocked)throw new Error('Stockage protégé : import indisponible.');if(file.size>2000000)throw new Error('Fichier supérieur à 2 Mo.');const data=validatePreparedTrips(JSON.parse(await file.text()));if(seq!==preparedSequence||!$('preparedDialog').open)return;
   preparedImport=data;$('preparedImportSummary').textContent=`${file.name} : ${data.entries.length} préparation(s), en remplacement des ${preparedTrips.entries.length} actuellement chargées.${data.entries.length?'':' Le fichier est vide et remplacera la liste par une liste vide.'} Lieux, tracés et paramètres sont déclaratifs ; les champs étrangers au format ne sont pas repris.`;
   $('preparedImportDetails').innerHTML=data.entries.map(e=>`<details><summary>${escapeHtml(e.name)}</summary>${preparedDescription(e)}</details>`).join('');$('preparedImportConfirm').checked=false;$('preparedImportApply').disabled=true;$('preparedImportMessage').textContent='';$('preparedImportDialog').showModal();
  }catch(e){if(seq===preparedSequence)$('preparedMessage').textContent='Import refusé. '+e.message}
 });
 $('preparedImportConfirm').addEventListener('change',()=>{$('preparedImportApply').disabled=!preparedImport||!$('preparedImportConfirm').checked});
 $('preparedImportApply').addEventListener('click',()=>{if(!preparedImport||!$('preparedImportConfirm').checked)return;if(writePreparedTrips(preparedImport)){preparedImport=null;preparedSelected=null;preparedDraft=null;$('preparedEditor').hidden=true;renderPreparedTrips();$('preparedImportDialog').close();$('preparedMessage').textContent='Sauvegarde de préparations restaurée. Aucun trajet recalculé.'}else $('preparedImportMessage').textContent=$('preparedMessage').textContent});
 const cancelPreparedImport=()=>{preparedSequence++;preparedImport=null};
 $('preparedImportDialog').addEventListener('cancel',cancelPreparedImport);
 $('preparedImportDialog').querySelector('.close-dialog').addEventListener('click',cancelPreparedImport);
 $('preparedImportDialog').addEventListener('close',()=>{if($('preparedImportDialog').open)return;preparedImport=null;if($('preparedDialog').open)$('preparedImportFile').focus()});
 $('preparedDialog').addEventListener('close',()=>{preparedSequence++;preparedImport=null;preparedDraft=null});
}

function stationInfo(r){
  return {postalCode:typeof r.cp==="string"?r.cp:null,hours:r.horaires??null,automate:r.horaires_automate_24_24??null,services:Array.isArray(r.services_service)?r.services_service.filter(s=>typeof s==="string").map(s=>s.trim()).filter(Boolean).slice(0,50):[],receivedAt:new Date().toISOString()};
}
function hoursRows(raw){
  try{
    const h=typeof raw==="string"?JSON.parse(raw):raw;
    const days=Array.isArray(h?.jour)?h.jour:h?.jour?[h.jour]:[];
    return days.slice(0,7).map(day=>{
      const slots=Array.isArray(day.horaire)?day.horaire:day.horaire?[day.horaire]:[];
      const time=value=>typeof value==="string"&&/^(?:[01]?\d|2[0-3])[:h.][0-5]\d$|^24[:h.]00$/.test(value)?value.replace(/[h.]/,":"):null;
      const ranges=slots.map(slot=>[time(slot["@ouverture"]),time(slot["@fermeture"])]).filter(pair=>pair.every(Boolean)).map(pair=>pair.join(" – ")+(pair[0]===pair[1]?" (durée ambiguë — non interprétée)":""));
      return `${typeof day["@nom"]==="string"?day["@nom"]:"Jour"} : ${day["@ferme"]==="1"?"fermé":ranges.length?ranges.join(", "):"non renseigné"}`;
    });
  }catch{return []}
}
function renderStationDetails(s){
  const rows=hoursRows(s.hours);
  $("stationTitle").textContent=s.city?`Station à ${s.city}`:"Station";
  $("stationDetails").innerHTML=`<p class="detail-address">${escapeHtml(s.address)}</p><p>${Number.isFinite(s.price)?`${escapeHtml(s.fuel)} : ${fmt(s.price,3)} €/L · ${escapeHtml(stationPriceText(s))}`:"Prix actuel non renseigné pour le carburant choisi."}</p>${Number.isFinite(s.distanceFromStart)?`<p>${fmt(s.distanceFromStart,1)} km depuis le départ · ${escapeHtml(stationRangeText(s.distanceFromStart))}</p>`:""}
    <section class="detail-section"><h3>Horaires habituels à l’arrivée</h3><p class="station-opening" data-opening="${stationOpening(s).state}">${escapeHtml(openingText(s))}</p><p class="note">Départ + durée routière jusqu’à cette station, sans pauses ni trafic en direct. Jours fériés, fermetures exceptionnelles et disponibilité du carburant non vérifiés. L’automate déclaré ne précise pas les carburants accessibles.</p><h3>Horaires déclarés du guichet</h3><p class="note">Automate 24 h/24 : ${["Oui","Non"].includes(s.automate)?s.automate:"non renseigné"}. Le guichet, la boutique et l’automate sont distincts.</p>${rows.length?`<ul>${rows.map(row=>`<li>${escapeHtml(row)}</li>`).join("")}</ul>`:"<p>Horaires non renseignés.</p>"}</section>
    <section class="detail-section"><h3>Services déclarés</h3>${s.services?.length?`<ul>${s.services.map(service=>`<li>${escapeHtml(service)}</li>`).join("")}</ul>`:"<p>Services non renseignés.</p>"}</section>
    <p class="note">Source DGCCRF : horaires déclaratifs, sans date de mise à jour des horaires. La date du prix ne date pas les horaires. Ouverture et disponibilité à confirmer sur place.${s.receivedAt?` Données reçues le ${escapeHtml(new Date(s.receivedAt).toLocaleString("fr-FR"))}.`:""}</p><a class="detail-source" href="https://data.economie.gouv.fr/explore/dataset/prix-des-carburants-en-france-flux-instantane-v2/" target="_blank" rel="noopener noreferrer">Source : données officielles des carburants ↗</a>`;
}
async function openStation(id){
  if(busy)return;
  const sequence=++detailSequence,fuel=$("fuel").value;
  const live=compared.find(s=>s.id===id),saved=profile.stations.find(s=>s.id===id);
  if(!live&&!saved)return;
  currentStation=live||saved;
  $("stationMessage").textContent="";$("favoriteBtn").disabled=false;
  $("detailChooseBtn").hidden=!live;updateFavorite();renderStationDetails(currentStation);
  if(!$("stationDialog").open)$("stationDialog").showModal();
  if(live)return;
  $("stationMessage").textContent="Actualisation de la fiche enregistrée…";
  try{
    const literal=/^\d+$/.test(id)?id:"'"+id.replaceAll("'","''")+"'";
    const q=new URLSearchParams({limit:"1",where:`id=${literal}`});
    const data=await getJSON(`${C.fuelApi}?${q}`,"Fiche station");
    if(sequence!==detailSequence||fuel!==$("fuel").value)return;
    const record=data.results?.find(r=>String(r.id)===id);
    if(!record)throw new Error("Station absente de la réponse officielle.");
    currentStation=stationFrom(record,fuel)||{...saved,...stationInfo(record),price:null,updated:null,fuel};
    renderStationDetails(currentStation);$("stationMessage").textContent="Fiche actualisée. Recalcule les stations du trajet pour comparer cet arrêt.";
  }catch(e){if(sequence===detailSequence)$("stationMessage").textContent=`Informations actuelles indisponibles : ${e.message}`}
}
function dbg(...a){
  const s=a.map(v=>typeof v==="string"?v:JSON.stringify(v)).join(" ");
  log.push(new Date().toLocaleTimeString()+" "+s);
  $("diag").textContent=log.slice(-100).join("\n");
}
function setStatus(text,state=""){
  $("status").textContent=text;
  $("statusDot").className="status-dot"+(state?" "+state:"");
  dbg(text);
  refreshTripValidation();
}
function health(id,state,label){
  const el=$(id); el.className="pill"+(state?" "+state:""); if(label) el.textContent=label;
}
function fmt(n,d=2){return Number(n).toLocaleString("fr-FR",{minimumFractionDigits:d,maximumFractionDigits:d})}
function sleep(ms){return new Promise(r=>setTimeout(r,ms))}
function valueNum(id,min,max){
  const n=Number($(id).value);
  if(!Number.isFinite(n)||n<min||n>max) throw new Error(`Valeur invalide : ${id}`);
  return n;
}
function makeTimeout(ms,parent=activeAbort?.signal){
  const c=new AbortController(), t=setTimeout(()=>c.abort(),ms);
  const onAbort=()=>c.abort();
  if(parent?.aborted)c.abort();else parent?.addEventListener("abort",onAbort,{once:true});
  return {signal:c.signal,done:()=>{clearTimeout(t);parent?.removeEventListener("abort",onAbort)}};
}
async function getJSON(url,label,ms=16000,signal=activeAbort?.signal,classifyError=null){
  dbg("GET",label,url);
  const t=makeTimeout(ms,signal);
  try{
    const r=await fetch(url,{signal:t.signal,headers:{Accept:"application/json"}});
    if(t.signal.aborted)throw new DOMException("Recherche interrompue.","AbortError");
    if(!r.ok){
      const error=new Error(`${label} : HTTP ${r.status}`);
      error.status=r.status;
      const retry=r.headers.get("Retry-After");
      error.retryAfterMs=retry==null?0:/^\d+$/.test(retry)?Number(retry)*1000:Date.parse(retry)-Date.now();
      if(classifyError&&r.status===404){
        const body=await r.json().catch(()=>null);
        if(t.signal.aborted)throw new DOMException("Recherche interrompue.","AbortError");
        error.noRoute=classifyError(r.status,body)===true;
      }
      throw error;
    }
    const data=await r.json();if(t.signal.aborted)throw new DOMException("Recherche interrompue.","AbortError");return data;
  }catch(e){
    if(e.name==="AbortError") {if(signal?.aborted)throw new DOMException("Recherche interrompue.","AbortError");throw new Error(`${label} : délai dépassé`)}
    if(e instanceof TypeError) throw new Error(`${label} : requête réseau refusée`);
    throw e;
  }finally{t.done()}
}

function loadCss(href){
  return new Promise(resolve=>{
    if([...document.styleSheets].some(s=>s.href===href)) return resolve(true);
    const l=document.createElement("link"); l.rel="stylesheet"; l.href=href;
    l.onload=()=>resolve(true); l.onerror=()=>resolve(false); document.head.appendChild(l);
  });
}
function loadScript(src){
  return new Promise(resolve=>{
    const s=document.createElement("script"); s.src=src; s.async=true;
    s.onload=()=>resolve(true); s.onerror=()=>resolve(false); document.head.appendChild(s);
  });
}
async function initMap(){
  health("hMap","busy","carte…");
  const [cssOk,jsOk]=await Promise.all([loadCss(C.leafletCss),loadScript(C.leafletJs)]);
  if(!(cssOk&&jsOk&&window.L)){
    health("hMap","err","carte fallback");
    $("fallbackLabel").textContent="Carte externe indisponible — visualisation autonome active.";
    dbg("Leaflet indisponible, fallback SVG conservé.");
    return;
  }
  try{
    map=L.map("map",{zoomControl:true,attributionControl:true}).setView([46.7,2.4],6);
    L.tileLayer(C.tileUrl,{maxZoom:19,attribution:'© OpenStreetMap contributors'}).addTo(map);
    markerLayer=L.featureGroup().addTo(map);
    $("mapFallback").style.display="none";
    health("hMap","ok","carte ✓");
    let zooming=false,resizePending=false,resizeFrame=0;
    const fitAfterResize=()=>{
      cancelAnimationFrame(resizeFrame);
      resizeFrame=requestAnimationFrame(()=>{
        if(!map||zooming)return;
        resizePending=false;map.invalidateSize({pan:false});
        if(routeLayer&&map.getSize().x>0&&map.getSize().y>0){const bounds=L.featureGroup([routeLayer,markerLayer]).getBounds();if(bounds.isValid())map.fitBounds(bounds,{padding:[35,35],animate:false})}
      });
    };
    // Leaflet ignores a new zoom target during its current zoom transition.
    map.on('zoomstart',()=>{zooming=true});map.on('zoomend moveend',queueStationPoints);
    map.on('zoomend',()=>{zooming=false;if(resizePending)fitAfterResize()});
    new ResizeObserver(()=>{resizePending=true;fitAfterResize()}).observe($("map"));
    if(mapView)showOnMap(...mapView);
  }catch(e){
    map=null; health("hMap","err","carte fallback"); dbg("Map init",e.message);
  }
}
function makeGrid(){
  let s="";for(let x=100;x<1000;x+=100)s+=`<line class="gridline" x1="${x}" y1="0" x2="${x}" y2="700"/>`;
  for(let y=100;y<700;y+=100)s+=`<line class="gridline" x1="0" y1="${y}" x2="1000" y2="${y}"/>`;
  $("grid").innerHTML=s;
}

function choosePlace(places,field,signal=activeAbort?.signal){
  if(signal?.aborted)throw new DOMException("Choix du lieu annulé.","AbortError");
  const dialog=$("placeDialog");
  $("placeTitle").textContent=field==="pickup"?"Quel lieu de prise en charge ?":field==="dropoff"?"Quel lieu de dépose ?":field==="address"?"Quelle adresse enregistrer ?":field==="start"?"Quel lieu de départ ?":"Quel lieu d’arrivée ?";
  $("placeChoices").innerHTML=`<legend>Plusieurs lieux correspondent</legend>${places.map((p,i)=>`<label><input type="radio" name="placeChoice" value="${i}"><span>${escapeHtml(p.label)}</span></label>`).join("")}`;
  $("confirmPlace").disabled=true;
  dialog.showModal();
  return new Promise((resolve,reject)=>{
    const pending={places,resolve,reject,signal,cleanup:()=>signal?.removeEventListener('abort',onAbort)};
    const onAbort=()=>{pending.cleanup();if(placePending===pending){placePending=null;if(dialog.open)dialog.close()}reject(new DOMException('Choix du lieu annulé.','AbortError'))};
    placePending=pending;signal?.addEventListener('abort',onAbort,{once:true});
  });
}
function geocodedPlace(feature){
  const coordinates=feature?.geometry?.coordinates,p=feature?.properties;
  if(feature?.type!=="Feature"||feature.geometry?.type!=="Point"||!Array.isArray(coordinates)||coordinates.length!==2||
    !coordinates.every(Number.isFinite)||Math.abs(coordinates[0])>180||Math.abs(coordinates[1])>90||!p||!["address","poi"].includes(p._type))return null;
  const texts=value=>(Array.isArray(value)?value:[value]).filter(x=>typeof x==="string"&&x.trim()).map(x=>x.trim());
  const label=texts(p._type==="address"?p.label:p.toponym)[0]||texts(p.name)[0];
  if(!label)return null;
  const context=texts(p.context),categories=texts(p.category);
  const details=[...texts(p.postcode),...texts(p.city),...(context.length?context:texts(p.depcode).map(code=>"Département "+code)),
    ...(p._type==="poi"?(categories.includes("commune")?["commune"]:categories.slice(0,1)):[])];
  const parts=[label];
  for(const detail of details)if(!parts.some(part=>part.toLocaleLowerCase("fr-FR").includes(detail.toLocaleLowerCase("fr-FR"))))parts.push(detail);
  return {lat:coordinates[1],lon:coordinates[0],label:parts.join(" · ")};
}
async function geocode(q,field,isCurrent=()=>true,signal=activeAbort?.signal){
  if(!isCurrent())throw new Error("Recherche du lieu annulée.");
  if(temporaryAddress(q)&&field!=='start')throw new Error('Ce libellé GPS ne désigne pas une arrivée confirmée. Renseigner une adresse fixe.');
  if(q==="__CURRENT__"){
    if(!currentPos) throw new Error("Position GPS non disponible");
    return {lat:currentPos[0],lon:currentPos[1],label:"Ma position"};
  }
  const query=q.trim().replace(/\s+/g," "),key=query.toLocaleLowerCase("fr-FR");
  const cached=geoCache.get(key);
  let places=cached&&performance.now()-cached.at<300000?cached.places:null;
  if(!places){
    const remaining=Math.ceil((geoBlockedUntil-performance.now())/1000);
    if(remaining>0)throw new Error(`Recherche d’adresses temporairement limitée. Réessayer dans ${remaining} s.`);
    await sleep(Math.max(0,250-(performance.now()-geoLastRequest)));
    if(signal?.aborted||!isCurrent())throw new DOMException("Recherche d’adresses annulée.","AbortError");
    geoLastRequest=performance.now();
    const p=new URLSearchParams({q:query,index:"address,poi",limit:"5",autocomplete:"false"});
    let d;
    try{d=await getJSON(`${C.geocodingApi}?${p}`,"Recherche d’adresses IGN",16000,signal)}
    catch(e){
      if(e.status===429){
        const delay=Math.max(5000,Number.isFinite(e.retryAfterMs)?e.retryAfterMs:0);
        geoBlockedUntil=performance.now()+delay;
        throw new Error(`Recherche d’adresses temporairement limitée. Réessayer dans ${Math.ceil(delay/1000)} s.`);
      }
      throw e;
    }
    if(!isCurrent())throw new Error("Recherche du lieu annulée.");
    if(d?.type!=="FeatureCollection"||!Array.isArray(d.features))throw new Error("Réponse de géocodage invalide.");
    if(!d.features.length)throw Object.assign(new Error(`Lieu introuvable en France : ${query}. Préciser la commune ou le code postal.`),{code:"NO_PLACE",field});
    places=[...new Map(d.features.map(geocodedPlace).filter(Boolean).map(p=>[`${p.lat},${p.lon},${p.label}`,p])).values()].slice(0,5);
    if(!places.length)throw new Error("Réponse de géocodage invalide : aucun lieu exploitable.");
    geoCache.delete(key);
    if(geoCache.size>=30)geoCache.delete(geoCache.keys().next().value);
    geoCache.set(key,{at:performance.now(),places});
  }
  if(!isCurrent())throw new Error("Recherche du lieu annulée.");
  return places.length===1?places[0]:choosePlace(places,field,signal);
}
function validateDimensions(d){
  const maxima={height:6,width:6,length:40,weight:100,axleload:30};
  if(!d||Object.entries(maxima).some(([key,max])=>!Number.isFinite(d[key])||d[key]<=0||d[key]>max)||d.axleload>d.weight)throw new Error("Renseigner les cinq dimensions et charges du poids lourd. La charge par essieu ne peut pas dépasser le poids total.");
  return Object.fromEntries(Object.keys(maxima).map(key=>[key,d[key]]));
}
function dimensionLabel(d){return `H ${fmt(d.height,2)} m · l ${fmt(d.width,2)} m · L ${fmt(d.length,2)} m · ${fmt(d.weight,2)} t · essieu ${fmt(d.axleload,2)} t`}
function routeDimensions(){return validateDimensions(Object.fromEntries(Object.entries(dimensionFields).map(([key,id])=>[key,Number($(id).value)])))}
function routingEndpoint(){
  if(!C.routingApi)return null;
  try{const u=new URL(C.routingApi,location.href);if(u.username||u.password||u.search||u.hash||!(u.protocol==="https:"||(u.protocol==="http:"&&["localhost","127.0.0.1"].includes(u.hostname))))return null;return u.href}catch{return null}
}
// BEGIN WALKING MODEL
function walkLimit(value){
 if(value===null||value==='')return null;
 const n=typeof value==='number'?value:typeof value==='string'&&value.trim()?Number(value):NaN;
 if(!Number.isFinite(n)||n<0||n>500)throw new Error('Indiquer une limite de marche entre 0 et 500 km, ou laisser vide.');
 return n;
}
function walkingDistance(distance,limit){
 if(typeof distance!=='number'||!Number.isFinite(distance)||distance<0)throw new Error('Distance de marche invalide.');
 const max=walkLimit(limit);return {limit:max,exceeded:max!==null&&distance>max*1000};
}
function walkCriteria(maxWalkKm,walkStrict=false){if(typeof walkStrict!=='boolean')throw new Error('Règle de marche invalide.');maxWalkKm=walkLimit(maxWalkKm);if(walkStrict&&maxWalkKm===null)throw new Error('Renseigner la distance de marche impérative ou choisir une préférence.');return {maxWalkKm,walkStrict}}
function walkReview(distance,criteria){const c=walkCriteria(criteria.maxWalkKm,criteria.walkStrict),known=typeof distance==='number'&&Number.isFinite(distance)&&distance>=0,status=c.maxWalkKm===null?'not-requested':!known?'unknown':distance-c.maxWalkKm*1000>1e-6?'over':'within';return {...c,status,distance:known?distance:null,excess:status==='over'?distance-c.maxWalkKm*1000:null,admissible:!c.walkStrict||status==='within'}}
function walkingPreference(distance,criteria){const r=walkReview(distance,criteria),f=n=>n.toLocaleString('fr-FR',{minimumFractionDigits:3,maximumFractionDigits:3});if(r.status==='not-requested')return 'Marche · aucune limite personnelle renseignée.';return (r.distance===null?'Distance inconnue':f(r.distance/1000)+' km calculés')+' / '+f(r.maxWalkKm)+' km demandés. '+(r.status==='unknown'?'Distance non vérifiable.':r.status==='over'?(r.walkStrict?'Limite impérative dépassée.':'Limite souhaitée dépassée. Préférence souple.')+' Dépassement : '+(r.excess<1?'moins de 1 m':r.excess.toLocaleString('fr-FR',{maximumFractionDigits:1})+' m')+'.':r.walkStrict?'Limite impérative respectée.':'Distance dans la limite souhaitée.')+' '+(!r.admissible?'Parcours non admissible pour cette limite. ':'')+'Le tracé reste consultable. Comparaison avant arrondi ; pente, effort et accessibilité non vérifiés.'}
// END WALKING MODEL
function updatePreparationReadout(){
 const selected=id=>$(id).selectedOptions[0]?.textContent||'À renseigner',value=id=>$(id).value.trim();
 const walking=isWalking(),avoid=[...document.querySelectorAll('.avoid-options input:checked')].map(e=>avoidLabels[e.value]+(e.dataset.routingAvailable==='false'?' (indisponible)':''));
 const criteria=walking?`À pied · ${value('maxWalkKm')?value('maxWalkKm')+' km maximum · '+selected('walkRule'):'sans limite de marche demandée'}`:`${selected('routeVehicle')} · ${avoid.length?'éviter '+avoid.join(', '):'sans évitement demandé'}`;
 const clock=value('stationDeparture'),limit=value('routeArriveBy');
 $('tripReadout').textContent=`${criteria}. ${selected('routeOptimization')}. Départ : ${clock?clock.replace('T',' '):'non renseigné'} (Paris).${limit?' Arriver au plus tard : '+limit.replace('T',' ')+' (Paris).':''}${$('routeOnlyBefore').checked?' Filtre d’heure limite actif.':''}${!busy&&$('goBtn').disabled?' Calcul indisponible : vérifier les réglages.':''}`;
 for(const [id,hide] of [['routeResultLinks',!trip],['stationResultLinks',!stationSearch],['jumpRouteResult',!trip],['jumpStations',!trip||trip.routing.vehicle.type==='walk'],['jumpBudget',!trip||trip.routing.vehicle.type==='walk'],['jumpStationResult',!stationSearch],['stationResultStart',!stationSearch]])$(id).hidden=hide;
 const filters=[];for(const [id,unit] of [['maxDetourKm','km'],['maxDetourMin','min']])if(value(id))filters.push('détour ≤ '+value(id)+' '+unit);
 const services=[...document.querySelectorAll('[data-service]:checked')].map(e=>e.closest('label').textContent.trim());if(services.length)filters.push('services requis : '+services.join(', '));
 if($('stationOpeningFilter').value!=='all')filters.push(selected('stationOpeningFilter'));
 if($('rangeOnly').checked)filters.push('portée estimée uniquement');
 $('stationReadout').textContent=`${value('fuel')} · ${value('liters')||'quantité à renseigner'} L à acheter · ${value('cons')||'consommation à renseigner'} L/100 km.${filters.length?' Filtres : '+filters.join(' ; ')+'.':''}`;
}
function bindPreparationNavigation(){
 $('sheet').addEventListener('click',e=>{const b=e.target.closest('[data-preparation-target]');if(!b||b.disabled)return;const el=$(b.dataset.preparationTarget);if(!el)return;for(let p=el.parentElement;p;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true;el.focus({preventScroll:true});el.scrollIntoView({block:/^H[23]$/.test(el.tagName)?'start':'center',behavior:'instant'})});
 for(const event of ['input','change'])$('sheet').addEventListener(event,updatePreparationReadout);
}

function optimizationLabel(value){return {fastest:'Plus rapide · durée estimée',shortest:'Plus court · distance'}[value]||'Critère non renseigné'}
function routingSettings(type,avoid,dimensions,optimization=$('routeOptimization').value){
 const provider=type==='walk'||optimization==='shortest'?'ign':routingEndpoint()?'ors':C.ignRouting===true&&avoid.includes('highways')?'ign':'osrm';
 return {provider,optimization,avoid,vehicle:{type,...(dimensions?{dimensions}:{})}};
}
function updateOptimization(){
 const value=$('routeOptimization').value,walking=isWalking();
 const available=C.ignRouting===true&&(walking||($('routeVehicle').value==='car'&&[...document.querySelectorAll('.avoid-options input:checked')].every(el=>el.value==='highways')));
 $('routeOptimization').disabled=busy;$('routeOptimization').querySelector('[value="shortest"]').disabled=!available;
 $('optimizationNote').textContent=!value?'Cette ancienne préparation ne conserve pas son critère. Choisir la durée ou la distance avant de recalculer.':value==='shortest'&&!available?'Le calcul au plus court est indisponible avec ce véhicule, ces évitements ou le service actuel. Modifier explicitement le choix pour continuer.':'La durée reste une estimation sans trafic en direct. Plus court peut être plus lent et ne signifie pas moins cher. Le moteur utilisé est indiqué avec le résultat.';
 return ['fastest','shortest'].includes(value)&&(value!=='shortest'||available);
}
function isWalking(){return $('travelMode').value==='walk'}
let walkRun=null;
function walkingRule(id){const rule=$(id).value;if(!['soft','strict'].includes(rule))throw new Error('Règle de marche invalide.');return rule==='strict'}
function readWalkingCriteria(compared=false){const field=$(compared?'comparisonWalkLimit':'maxWalkKm');if(field.validity.badInput)throw new Error('Distance de marche invalide.');return walkCriteria(field.value,walkingRule(compared?'comparisonWalkRule':'walkRule'))}
function fillWalkingCriteria(c){$('maxWalkKm').value=c.maxWalkKm??'';$('walkRule').value=c.walkStrict?'strict':'soft'}
function walkingChanged(){if(walkRun){cancelTripSearch('Critères de marche modifiés : calcul annulé.');return}updateWalking()}
function updateWalking(){
 const walking=isWalking();$('routeModuleName').hidden=walking;$('carMode').setAttribute('aria-pressed',String(!walking));$('walkMode').setAttribute('aria-pressed',String(walking));$('routeModeHeading').textContent=walking?'Trajet à pied':'Trajet en véhicule';$('walkingOptions').hidden=!walking;$('routingOptions').hidden=walking;if(walking)$('activeVehicle').hidden=true;
 $('savePreparationBtn').disabled=busy;$('journalRecordBtn').disabled=busy;
 $('walkingStatus').hidden=!trip||trip.routing.vehicle.type!=='walk';if($('walkingStatus').hidden)return;
 try{const c=readWalkingCriteria();$('maxWalkKm').setAttribute('aria-invalid','false');$('walkingStatus').dataset.state=walkReview(trip.base.distance,c).admissible?'admissible':'excluded';$('walkingStatus').textContent=walkingPreference(trip.base.distance,c)}catch(e){$('maxWalkKm').setAttribute('aria-invalid','true');$('walkingStatus').dataset.state='invalid';$('walkingStatus').textContent='Critères invalides : '+e.message;$('savePreparationBtn').disabled=true;$('journalRecordBtn').disabled=true}
}
function updateVehicleRouting(){
  updateWalking();
  renderVehiclePicker();const criterionReady=updateOptimization();
  if(isWalking()){
    document.querySelectorAll('#routingOptions input,#routingOptions select,#routingOptions button').forEach(el=>el.disabled=true);
    $('goBtn').disabled=busy||C.ignRouting!==true||!criterionReady;
    if(C.ignRouting!==true)setStatus('Calcul à pied indisponible : service IGN non activé.');
    updatePreparationReadout();return;
  }
  document.querySelectorAll('#routingOptions input,#routingOptions select,#routingOptions button').forEach(el=>el.disabled=busy);
  const type=$("routeVehicle").value;
  const advanced=Boolean(routingEndpoint());
  for(const option of $("routeVehicle").options){
    option.disabled=option.value!=="car"&&(option.value!=="truck"||!advanced);
    if(option.value==="truck")option.textContent=advanced?"Poids lourd":"Poids lourd · indisponible";
  }
  document.querySelectorAll('.avoid-options input').forEach(el=>{
    const available=advanced||(C.ignRouting===true&&type==="car"&&el.value==="highways");
    el.disabled=busy||!available;el.dataset.routingAvailable=String(available);
    const label=el.closest('label').querySelector('.availability');
    if(label)label.textContent=available?"":"Indisponible";
  });
  $("avoidAvailability").textContent="";
  const unavailable=[...document.querySelectorAll('.avoid-options input:checked')].filter(el=>el.dataset.routingAvailable==='false');$("clearUnavailableOptions").hidden=!unavailable.length;$("clearUnavailableOptions").disabled=busy;
  $("goBtn").disabled=busy||!criterionReady||!["car",...(advanced?["truck"]:[])].includes(type);
  $("truckDimensions").hidden=type!=="truck";
  $("vehicleRoutingNote").hidden=type==="car";
  $("vehicleRoutingNote").textContent=type==="truck"?"Restrictions calculées selon le gabarit déclaré et les données cartographiques. La signalisation et les conditions réelles restent prioritaires. Transport exceptionnel ou de matières dangereuses non pris en charge.":"Le routage spécifique aux caravanes et utilitaires n’est pas encore validé. Aucun trajet voiture ne sera substitué automatiquement.";
  $("routingAvailability").textContent=advanced?"Service public configuré : coordonnées et gabarit transmis au service de calcul puis à OpenRouteService. Aucun compte technique requis.":C.ignRouting===true?"Plus court et sans autoroute disponibles en véhicule léger avec l’IGN, aucune clé à fournir. Les coordonnées du trajet et des arrêts sont transmises à l’IGN lors de la recherche.":"Évitements et poids lourds indisponibles : service non activé. Trajet léger standard disponible ; aucune clé à fournir.";
 updatePreparationReadout();
}
function routingPreferences(){
  if(isWalking()){readWalkingCriteria();return routingSettings('walk',[])}
  const type=$("routeVehicle").value;
  const avoid=[...document.querySelectorAll('.avoid-options input:checked')].map(el=>el.value);
  return routingSettings(type,avoid,type==="truck"?routeDimensions():undefined);
}
function routingLabel(settings){
  if(settings.vehicle.type==='walk')return 'IGN · BD TOPO · à pied · '+optimizationLabel(settings.optimization);
  return (settings.provider==="ors"?"OpenRouteService · service public":settings.provider==="ign"?"IGN · BD TOPO":"OSRM")+(settings.vehicle.type==="truck"?" · poids lourd · "+dimensionLabel(settings.vehicle.dimensions):" · véhicule léger")+(settings.avoid.length?" · exclusions : "+settings.avoid.map(x=>avoidLabels[x]).join(", "):" · sans exclusions")+" · "+optimizationLabel(settings.optimization);
}
function invalidateRouting(){
  clearResults();updateVehicleRouting();
  setStatus("Options modifiées. Trajet à recalculer.");
}
function ensureRouting(settings){
  if(!['fastest','shortest'].includes(settings.optimization))throw new Error('Choisir un critère de trajet avant de calculer.');
  if(!['ign','osrm','ors'].includes(settings.provider))throw new Error('Moteur de calcul non reconnu.');
  if(settings.optimization==='shortest'&&settings.provider!=='ign')throw new Error('Le calcul au plus court n’est pas pris en charge par ce moteur. Aucun autre critère ne sera substitué.');
  if(settings.vehicle.type==='walk'){
    if(C.ignRouting!==true||settings.provider!=='ign'||settings.avoid.length||settings.vehicle.dimensions)throw new Error('Calcul à pied indisponible ou options incompatibles. Aucun trajet voiture ne sera substitué.');
    return;
  }
  if(!["car","truck"].includes(settings.vehicle.type))throw new Error("Routage spécifique non validé pour ce véhicule. Aucun trajet voiture ne sera substitué.");
  if(settings.provider==="ign"&&(C.ignRouting!==true||settings.vehicle.type!=="car"||settings.avoid.length>1||settings.avoid.some(x=>x!=="highways")))throw new Error("L’IGN est activé pour le véhicule léger, avec ou sans autoroute. Service ou options incompatibles : les restrictions ne seront pas ignorées, ni le critère remplacé.");
  if(settings.provider==="osrm"&&(settings.avoid.length||settings.vehicle.type==="truck"))throw new Error("Service public de routage avancé non activé. Ces options ne seront pas ignorées. Le trajet standard reste disponible pour un véhicule léger sans exclusions.");
}
function hasRouteGeometry(r){
  return r?.geometry?.type==="LineString"&&Array.isArray(r.geometry.coordinates)&&r.geometry.coordinates.length>1&&r.geometry.coordinates.every(p=>Array.isArray(p)&&p.length>=2&&Number.isFinite(p[0])&&Number.isFinite(p[1])&&Math.abs(p[0])<=180&&Math.abs(p[1])<=90);
}
function hasRouteMetrics(r){return [r?.distance,r?.duration].every(n=>Number.isFinite(n)&&n>=0)}
const routingBlockedUntil=new Map();
function checkRouteRequest(isCurrent,signal){if(signal?.aborted||!isCurrent())throw new DOMException('Recherche interrompue.','AbortError')}
function routingCooldown(provider,error){
 if(error?.status===429)routingBlockedUntil.set(provider,Math.max(routingBlockedUntil.get(provider)||0,performance.now()+Math.max(5000,Number.isFinite(error.retryAfterMs)?error.retryAfterMs:0)));
 const remaining=Math.ceil(((routingBlockedUntil.get(provider)||0)-performance.now())/1000);
 if(remaining>0)throw Object.assign(new Error(`Limite du service ${provider==='ign'?'IGN':provider==='ors'?'public':'routier'} atteinte. Réessayer dans ${remaining} s. Le critère et les contraintes sont conservés.`),{status:429,retryAfterMs:remaining*1000});
}
async function orsRoutes(points,settings,alternatives=false,isCurrent=()=>true,signal=activeAbort?.signal){
  checkRouteRequest(isCurrent,signal);routingCooldown("ors");
  const endpoint=routingEndpoint();if(!endpoint)throw new Error("Service public de routage non activé.");
  await sleep(Math.max(0,1800-(performance.now()-orsLastRequest)));
  checkRouteRequest(isCurrent,signal);routingCooldown("ors");
  orsLastRequest=performance.now();
  const t=makeTimeout(25000,signal);
  const body={coordinates:points.map(([lat,lon])=>[lon,lat]),avoid:[...settings.avoid],vehicle:settings.vehicle,alternatives};
  try{
    const response=await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json",Accept:"application/geo+json"},body:JSON.stringify(body),signal:t.signal,cache:"no-store",credentials:"omit",redirect:"error",referrerPolicy:"no-referrer"});
    const data=await response.json().catch(()=>null);
    checkRouteRequest(isCurrent,signal);if(t.signal.aborted)throw new DOMException("Recherche interrompue.","AbortError");
    if(response.status===429){const retry=response.headers.get("Retry-After");routingCooldown("ors",{status:429,retryAfterMs:retry==null?0:/^\d+$/.test(retry)?Number(retry)*1000:Date.parse(retry)-Date.now()})}
    if(!response.ok||data?.error){
      const noRoute=data?.error?.code==="NO_ROUTE";
      const message=response.status===401||response.status===403?"Accès au service public refusé.":response.status===429?"Limite du service public atteinte. Réessayer plus tard.":noRoute?"Aucun trajet accessible avec ces options.":`Service public indisponible ou demande refusée (HTTP ${response.status}).`;
      throw Object.assign(new Error(message),{noRoute});
    }
    if(!Array.isArray(data?.features)||!data.features.length)throw new Error("Réponse OpenRouteService incomplète.");
    return data.features.map(feature=>{
      const p=feature.properties,r={geometry:feature.geometry,distance:p?.summary?.distance,duration:p?.summary?.duration,legs:p?.segments,alternatives:[]};
      if(!hasRouteGeometry(r)||[r.distance,r.duration].some(n=>!Number.isFinite(n)||n<0)||!Array.isArray(r.legs)||r.legs.length!==points.length-1||r.legs.some(leg=>[leg.distance,leg.duration].some(n=>!Number.isFinite(n)||n<0))||Math.abs(r.legs.reduce((s,l)=>s+l.distance,0)-r.distance)>2||Math.abs(r.legs.reduce((s,l)=>s+l.duration,0)-r.duration)>2)throw new Error("Réponse OpenRouteService incomplète ou incohérente.");
      if(p.warnings?.length)throw new Error("OpenRouteService signale une réserve sur ce trajet. Aucun trajet non vérifié n’est affiché.");
      return r;
    });
  }catch(e){
    checkRouteRequest(isCurrent,signal);health("hRoute","err","routage ✕");
    if(e.name==="AbortError")throw new Error(signal?.aborted?"Recherche interrompue.":"OpenRouteService : délai dépassé.");
    if(e instanceof TypeError)throw new Error("OpenRouteService : requête réseau refusée.");
    throw e;
  }finally{t.done()}
}
function ignNoPath(status,data){return status===404&&typeof data?.error?.message==='string'&&data.error.message.trim()==='No path found'}
async function ignRoute(points,settings,isCurrent=()=>true,signal=activeAbort?.signal){
  ensureRouting(settings);
  const walking=settings.vehicle.type==='walk',profileName=walking?'pedestrian':'car',snapKm=walking?.15:1;
  const key=JSON.stringify([points,settings.avoid,profileName,settings.optimization]),cached=ignCache.get(key);
  checkRouteRequest(isCurrent,signal);
  if(cached&&performance.now()-cached.at<300000)return structuredClone(cached.route);
  // Calls are sequential in run/scoreConstrainedCandidates. Below 5 requests/s/IP;
  // other tabs/users on the same IP may still trigger a quota: never auto-retry.
  routingCooldown("ign");await sleep(Math.max(0,550-(performance.now()-ignLastRequest)));
  checkRouteRequest(isCurrent,signal);
  routingCooldown("ign");ignLastRequest=performance.now();
  const constraint={constraintType:"banned",key:"waytype",operator:"=",value:"autoroute"};
  const query=new URLSearchParams({resource:"bdtopo-osrm",profile:profileName,optimization:settings.optimization,start:[...points[0]].reverse().join(","),end:[...points.at(-1)].reverse().join(","),geometryFormat:"geojson",crs:"EPSG:4326",distanceUnit:"meter",timeUnit:"second",getSteps:"false",getBbox:"false"});
  if(settings.avoid.includes("highways"))query.set("constraints",JSON.stringify(constraint));
  if(points.length>2)query.set("intermediates",points.slice(1,-1).map(([lat,lon])=>`${lon},${lat}`).join("|"));
  let data;
  try{data=await getJSON(`https://data.geopf.fr/navigation/itineraire?${query}`,"IGN",25000,signal,ignNoPath)}
  catch(e){
    checkRouteRequest(isCurrent,signal);health("hRoute","err","routage ✕");
    routingCooldown("ign",e);
    throw Object.assign(new Error(`${e.noRoute?'IGN : Aucun chemin trouvé avec ces points et ces options':e.message}. ${walking?"Aucun trajet voiture ne sera substitué.":settings.avoid.length?"Aucun trajet avec autoroute ne sera substitué.":"Aucun autre critère ne sera substitué."}`),{noRoute:e.noRoute===true});
  }
  checkRouteRequest(isCurrent,signal);
  const r={geometry:data.geometry,distance:data.distance,duration:data.duration,legs:data.portions,alternatives:[],resourceVersion:data.resourceVersion};
  const exclusions=data.constraints;
  const echoed=!settings.avoid.length?Array.isArray(exclusions)&&exclusions.length===0:Array.isArray(exclusions)&&exclusions.length===1&&exclusions[0].type==="banned"&&exclusions[0].key==="waytype"&&exclusions[0].operator==="="&&exclusions[0].value==="autoroute";
  const legs=Array.isArray(r.legs)&&r.legs.length===points.length-1&&r.legs.every(hasRouteMetrics)&&Math.abs(r.legs.reduce((s,l)=>s+l.distance,0)-r.distance)<=2&&Math.abs(r.legs.reduce((s,l)=>s+l.duration,0)-r.duration)<=2;
  const endpoints=legs&&r.legs.every((leg,i)=>[leg.start,leg.end].every((value,j)=>{
    if(typeof value!=="string"||!/^[-\d.]+,[-\d.]+$/.test(value))return false;
    const [lon,lat]=value.split(",").map(Number);
    return Number.isFinite(lat)&&Number.isFinite(lon)&&Math.abs(lat)<=90&&Math.abs(lon)<=180&&hav([lat,lon],points[i+j])<=snapKm;
  }));
  const geometry=hasRouteGeometry(r)&&hav([...r.geometry.coordinates[0]].slice(0,2).reverse(),points[0])<=snapKm&&hav([...r.geometry.coordinates.at(-1)].slice(0,2).reverse(),points.at(-1))<=snapKm;
  if(data.resource!=="bdtopo-osrm"||data.profile!==profileName||(walking&&(typeof data.resourceVersion!=="string"||!data.resourceVersion.trim()))||data.optimization!==settings.optimization||data.crs!=="EPSG:4326"||data.distanceUnit!=="meter"||data.timeUnit!=="second"||!echoed||!geometry||!hasRouteMetrics(r)||!legs||!endpoints){
    checkRouteRequest(isCurrent,signal);health("hRoute","err","routage ✕");
    throw new Error("Réponse IGN incomplète ou incohérente : critère, unités, accès ou exclusion non confirmés. Aucun trajet de remplacement affiché.");
  }
  r.alternativeNotice=walking?"Un itinéraire à pied calculé par l’IGN. Aucune alternative demandée ; durée estimée hors pauses. Pente, escaliers, revêtement et accessibilité non vérifiés.":`Un seul trajet ${settings.avoid.length?"sans autoroute ":""}calculé par l’IGN. Le montant des péages reste inconnu, notamment pour les ouvrages payants.`;
  if(ignCache.size>=32)ignCache.delete(ignCache.keys().next().value);
  ignCache.set(key,{at:performance.now(),route:structuredClone(r)});
  return r;
}
async function route(points,overview=true,alternatives=false,settings=trip?.routing||routingPreferences(),isCurrent=()=>true,signal=activeAbort?.signal){
  checkRouteRequest(isCurrent,signal);
  health("hRoute","busy","routage…");
  ensureRouting(settings);
  if(settings.provider==="ign"){
    const r=await ignRoute(points,settings,isCurrent,signal);
    health("hRoute","ok","routage ✓");return r;
  }
  if(settings.provider==="ors"){
    let base=(await orsRoutes(points,settings,false,isCurrent,signal))[0];
    if(alternatives&&base.distance<=100000){
      try{const all=await orsRoutes(points,settings,true,isCurrent,signal);base={...all[0],alternatives:all.slice(1)}}
      catch{checkRouteRequest(isCurrent,signal);base.alternativeNotice="Recherche d’alternatives indisponible. Le trajet calculé avec les exclusions est conservé."}
    }else if(alternatives)base.alternativeNotice="Alternatives non recherchées : limite OpenRouteService de 100 km dépassée.";
    health("hRoute","ok","routage ✓");
    return base;
  }
  if(settings.avoid.length||settings.vehicle.type!=="car")throw new Error("OSRM ne prend pas en charge ces options de véhicule ou d’exclusion.");
  const coords=points.map(p=>`${p[1]},${p[0]}`).join(";");
  const u=`${C.osrm}/route/v1/driving/${coords}?overview=${overview?"full":"false"}&geometries=geojson&steps=false&alternatives=${alternatives}`;
  routingCooldown("osrm");let d;try{d=await getJSON(u,"Routage",20000,signal)}catch(e){checkRouteRequest(isCurrent,signal);routingCooldown("osrm",e);throw e}
  checkRouteRequest(isCurrent,signal);
  if(d.code!=="Ok"||!d.routes?.length) throw new Error("Aucun itinéraire routier trouvé");
  if(!hasRouteMetrics(d.routes[0])||(overview&&!hasRouteGeometry(d.routes[0])))throw new Error("Tracé routier incomplet. Relancer la recherche.");
  if(points.length>=4){
    meetingLegs(d.routes[0],points.map(point=>({point})));
    if(!Array.isArray(d.waypoints)||d.waypoints.length!==points.length||d.waypoints.some((w,i)=>!Array.isArray(w.location)||w.location.length!==2||!w.location.every(Number.isFinite)||hav([w.location[1],w.location[0]],points[i])>.5))throw new Error('Accès aux points de rencontre non confirmés par le moteur.');
  }
  health("hRoute","ok","routage ✓");
  return {...d.routes[0],alternatives:alternatives?d.routes.slice(1).filter(r=>hasRouteGeometry(r)&&hasRouteMetrics(r)):[]};
}
async function matrix(points){
  const coords=points.map(p=>`${p[1]},${p[0]}`).join(";");
  const u=`${C.osrm}/table/v1/driving/${coords}?annotations=distance,duration`;
  const d=await getJSON(u,"Matrice routière",25000);
  if(d.code!=="Ok"||!d.distances||!d.durations) throw new Error("Matrice routière indisponible");
  return d;
}
// BEGIN STATION SAMPLING MODEL
function samplingSettings(raw){
 const values={},limits={radius:[1,30],spacing:[5,100],maxPoints:[2,24]};
 for(const [key,[min,max]] of Object.entries(limits)){const v=raw?.[key],n=(typeof v==='number'||typeof v==='string'&&v.trim())?Number(v):NaN;if(!Number.isFinite(n)||n<min||n>max||key==='maxPoints'&&!Number.isInteger(n))return {valid:false,field:key,error:`Renseigner ${key==='radius'?'le rayon':key==='spacing'?'l’espacement':'le maximum de points'} entre ${min} et ${max}${key==='maxPoints'?' (entier)':' km'}.`};values[key]=n}
 const scope=raw.scope===undefined?'route':raw.scope;if(!['route','window'].includes(scope))return {valid:false,field:'scope',error:'Choisir le tracé entier ou la portion recherchée.'};
 return {valid:true,...values,scope};
}
function hav(a,b){
  const R=6371,rad=Math.PI/180,dl=(b[0]-a[0])*rad,do_=(b[1]-a[1])*rad;
  const z=Math.sin(dl/2)**2+Math.cos(a[0]*rad)*Math.cos(b[0]*rad)*Math.sin(do_/2)**2;
  return 2*R*Math.asin(Math.sqrt(z));
}
function distSeg(p,a,b){
  const lat=p[0]*Math.PI/180,kx=111.32*Math.cos(lat),ky=110.574;
  const px=p[1]*kx,py=p[0]*ky,ax=a[1]*kx,ay=a[0]*ky,bx=b[1]*kx,by=b[0]*ky;
  const vx=bx-ax,vy=by-ay,wx=px-ax,wy=py-ay,c=vx*vx+vy*vy,t=c?Math.max(0,Math.min(1,(wx*vx+wy*vy)/c)):0;
  return Math.hypot(px-(ax+t*vx),py-(ay+t*vy));
}
function distRoute(p,c){
  let m=Infinity;for(let i=1;i<c.length;i++)m=Math.min(m,distSeg(p,c[i-1],c[i]));return m;
}
function stationSampling(coords,spacing,maxPoints){
 if(!Array.isArray(coords)||coords.length<2||coords.some(p=>!Array.isArray(p)||p.length<2||!Number.isFinite(p[0])||Math.abs(p[0])>90||!Number.isFinite(p[1])||Math.abs(p[1])>180))throw new Error('Tracé de présélection invalide.');
 if(!Number.isFinite(spacing)||spacing<5||spacing>100||!Number.isInteger(maxPoints)||maxPoints<2||maxPoints>24)throw new Error('Maillage de présélection invalide.');
 const lengths=[0];for(let i=1;i<coords.length;i++)lengths.push(lengths.at(-1)+hav(coords[i-1],coords[i]));
 const length=lengths.at(-1),requested=length===0?1:Math.ceil(length/spacing)+1,capped=requested>maxPoints,count=Math.min(requested,maxPoints);
 const distances=Array.from({length:count},(_,i)=>i===count-1?length:capped?length*i/(count-1):i*spacing),points=[];let segment=1;
 for(const d of distances){while(segment<lengths.length-1&&lengths[segment]<d)segment++;const size=lengths[segment]-lengths[segment-1],t=size?(d-lengths[segment-1])/size:0,a=coords[segment-1],b=coords[segment];points.push(d===0?coords[0].slice(0,2):d===length?coords.at(-1).slice(0,2):[a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1])])}
 const maxGap=distances.reduce((max,d,i)=>i?Math.max(max,d-distances[i-1]):max,0);
 return {points,distances,length,requested,capped,maxGap,limit:maxPoints};
}
function stationCollectionSection(coords,window,scope){
 if(!['route','window'].includes(scope))throw new Error('Portion de collecte inconnue.');
 const total=stationSampling(coords,30,24).length;
 if(!window?.valid||!Number.isFinite(window.length)||window.length<=0||!Number.isFinite(window.min)||!Number.isFinite(window.max)||window.min<0||window.max<window.min||window.max>window.length)throw new Error(window?.error||'Bornes de collecte invalides.');
 const from=scope==='route'?0:window.min,to=scope==='route'?window.length:window.max;
 if(from===0&&to===window.length)return {coords:coords.map(p=>p.slice(0,2)),scope,from,to,total,geometryFrom:0,geometryTo:total};
 if(total===0)throw new Error('Tracé sans longueur : impossible de situer la portion recherchée.');
 const low=total*from/window.length,high=total*to/window.length,lengths=[0];
 for(let i=1;i<coords.length;i++)lengths.push(lengths.at(-1)+hav(coords[i-1],coords[i]));
 const point=d=>{if(d===0)return coords[0].slice(0,2);if(d===total)return coords.at(-1).slice(0,2);let i=1;while(i<lengths.length-1&&lengths[i]<d)i++;const span=lengths[i]-lengths[i-1],t=span?(d-lengths[i-1])/span:0;return [coords[i-1][0]+t*(coords[i][0]-coords[i-1][0]),coords[i-1][1]+t*(coords[i][1]-coords[i-1][1])]};
 const part=[point(low)];for(let i=1;i<coords.length-1;i++)if(lengths[i]>low&&lengths[i]<high)part.push(coords[i].slice(0,2));part.push(point(high));
 return {coords:part,scope,from,to,total,geometryFrom:low,geometryTo:high};
}
// END STATION SAMPLING MODEL
function readSamplingSettings(){return samplingSettings({radius:$('stationRadiusKm').value,spacing:$('stationSpacingKm').value,maxPoints:$('stationMaxPoints').value,scope:$('stationScope').value})}
function stationSamplingPlan(settings=readSamplingSettings()){if(!settings.valid)throw new Error(settings.error);const section=stationCollectionSection(trip.coords,stopWindow(),settings.scope);return {...stationSampling(section.coords,settings.spacing,Math.min(settings.maxPoints,C.maxFuelSamples)),section}}
function samplingPlanText(settings,plan){return `${plan.section.scope==='window'?'Portion recherchée':'Tracé entier'} : de ${fmt(plan.section.from,1)} à ${fmt(plan.section.to,1)} km depuis le départ. ${plan.section.scope==='window'?'Repérage proportionnel sur le tracé ; les distances routières d’accès seront vérifiées séparément. ':''}${plan.points.length} point(s) de collecte, rayon ${fmt(settings.radius,1)} km autour de chaque point. Espacement demandé : ${fmt(settings.spacing,1)} km ; plus grand intervalle sur le tracé : ${fmt(plan.maxGap,1)} km.${plan.capped?` Plafond de ${plan.limit} points atteint : ${plan.requested} seraient nécessaires à cet espacement. Points répartis entre les deux bornes ; couverture partielle.`:''}${plan.maxGap>2*settings.radius?' Des espaces entre les points peuvent rester non consultés.':''}`}
function updateSampling(){
 const settings=readSamplingSettings();for(const [id,key] of [['stationRadiusKm','radius'],['stationSpacingKm','spacing'],['stationMaxPoints','maxPoints'],['stationScope','scope']])$(id).setAttribute('aria-invalid',String(settings.field===key));
 let text=settings.error||'Calculer un trajet pour connaître le nombre de points à consulter.';
 if(settings.valid&&trip)try{text=samplingPlanText(settings,stationSamplingPlan(settings))+' Au plus 100 lignes par réponse source ; ces prélèvements ne garantissent pas une couverture exhaustive.'}catch(e){text=e.message}
 if($('samplingNote').textContent!==text)$('samplingNote').textContent=text;
 let brief=text;
 if(settings.valid&&trip)try{const p=stationSamplingPlan(settings);brief=`${settings.scope==='window'?'Portion choisie':'Tout le trajet'} · rayon ${fmt(settings.radius,1)} km · ${p.points.length} points consultés au maximum. ${p.capped?'Plafond atteint : couverture partielle. ':''}${p.maxGap>2*settings.radius?'Espaces non consultés possibles. ':''}Recherche non exhaustive.`}catch{}
 $('samplingSummary').textContent=brief;
}
function geomPoint(g){
  if(!g)return null;
  if(Array.isArray(g)&&g.length>=2)return [+g[0],+g[1]];
  if(g.lat!=null&&g.lon!=null)return [+g.lat,+g.lon];
  if(g.coordinates?.length>=2)return [+g.coordinates[1],+g.coordinates[0]];
  return null;
}
function stationFrom(r,fuel){
  const f=fuelField[fuel],p=geomPoint(r.geom),price=Number(r[`${f}_prix`]);
  if(!p||!(price>.2&&price<4))return null;
  const rupture=String(r[`${f}_rupture_type`]??"").trim().toLowerCase();
  if(rupture && rupture!=="null")return null;
  return {
    id:String(r.id),lat:p[0],lon:p[1],price,
    updated:r[`${f}_maj`]||null,
    address:[r.adresse,r.cp,r.ville].filter(Boolean).join(", "),
    city:r.ville||"",...stationInfo(r),fuel
  };
}
async function stationsAround(p,fuel,radius=C.corridorRadiusKm){
  const f=fuelField[fuel],[lat,lon]=p;
  const where=`within_distance(geom, geom'POINT(${lon} ${lat})', ${radius} km) and ${f}_prix is not null`;
  const select=`id,adresse,cp,ville,geom,horaires,horaires_automate_24_24,services_service,${f}_prix,${f}_maj,${f}_rupture_type`;
  const q=new URLSearchParams({limit:"100",where,select});
  const d=await getJSON(`${C.fuelApi}?${q}`,"Carburants",18000);
  const rows=Array.isArray(d.results)?d.results:[];
  return {stations:rows.map(r=>stationFrom(r,fuel)).filter(Boolean),limited:rows.length>=100||Number(d.total_count)>rows.length};
}
async function collectStations(coords,fuel,settings,plan,isCurrent=()=>true){
  health("hFuel","busy","carburants…");
  const pts=plan.points,all=[];let failed=0,limited=0;
  dbg("Échantillons du corridor",pts.length);
  for(let i=0;i<pts.length;i+=4){
    if(!isCurrent())throw new Error("Recherche interrompue.");
    const batch=pts.slice(i,i+4);
    const rs=await Promise.all(batch.map(p=>stationsAround(p,fuel,settings.radius).catch(e=>{failed++;dbg("Carburants partiel",e.message);return {stations:[],limited:false}})));
    if(!isCurrent())throw new Error("Recherche interrompue.");
    for(const result of rs){all.push(...result.stations);if(result.limited)limited++}
  }
  const uniq=new Map();all.forEach(s=>uniq.set(s.id,s));
  const arr=[...uniq.values()].filter(s=>distRoute([s.lat,s.lon],plan.section.coords)<=settings.radius);
  health("hFuel",arr.length?"ok":"err",arr.length?"carburants ✓":"carburants ✕");
  if(failed===pts.length)throw new Error("Service carburants indisponible. Le trajet reste disponible.");
  return {stations:arr,partial:failed>0,failed,limited,samples:pts.length,settings,plan};
}
function progressKm(station,coords,totalKm){
  let length=0,best=Infinity,at=0;
  const p=[station.lat,station.lon];
  for(let i=1;i<coords.length;i++){
    const a=coords[i-1],b=coords[i],segment=hav(a,b);
    const k=Math.cos(p[0]*Math.PI/180),vx=(b[1]-a[1])*k,vy=b[0]-a[0];
    const denominator=vx*vx+vy*vy;
    const t=denominator?Math.max(0,Math.min(1,(((p[1]-a[1])*k)*vx+(p[0]-a[0])*vy)/denominator)):0;
    const distance=distSeg(p,a,b);
    if(distance<best){best=distance;at=length+segment*t}
    length+=segment;
  }
  return length?at/length*totalKm:0;
}
// BEGIN STATION WINDOW MODEL
function stationDistance(value){
 if(typeof value!=='number'&&typeof value!=='string'||typeof value==='string'&&!value.trim())return null;
 const n=Number(value);return Number.isFinite(n)&&n>=.1&&n<=40000?n:null;
}
function stationWindow(raw,length){
 const mode=raw.mode,target=stationDistance(raw.target),tolerance=stationDistance(raw.tolerance),near=stationDistance(raw.near);
 const w={mode,target,tolerance,near,length,min:0,max:null,valid:false,field:null,error:''};
 if(!['soon','near','around'].includes(mode))return {...w,error:'Choisir une intention d’arrêt.'};
 const active=mode==='around'?[['target',target],['tolerance',tolerance]]:mode==='near'?[['near',near]]:[];
 const invalid=active.find(([,v])=>v===null);
 if(invalid)return {...w,field:invalid[0],error:'Renseigner une distance entre 0,1 et 40 000 km.'};
 if(typeof length!=='number'||!Number.isFinite(length)||length<=0||length>40000)return {...w,error:'Calculer un trajet de longueur positive avant la recherche.'};
 if(mode==='around'&&target>length)return {...w,field:'target',beyond:true,error:'La cible dépasse la longueur du trajet.'};
 return {...w,valid:true,min:mode==='around'?Math.max(0,target-tolerance):0,max:mode==='around'?Math.min(length,target+tolerance):mode==='near'?Math.min(length,near):length};
}
function widerStationWindow(w){
 if(!w.valid||w.mode==='soon'||w.min===0&&w.max===w.length)return null;
 const key=w.mode==='near'?'near':'tolerance',value=Math.min(40000,Math.max(w[key]*2,w[key]+20));
 const next=stationWindow({...w,[key]:value},w.length);return next.valid&&(next.min<w.min||next.max>w.max)?{key,value,window:next}:null;
}
// END STATION WINDOW MODEL
function stopWindow(){
 return stationWindow({mode:document.querySelector('input[name="stopMode"]:checked').value,target:$('stopKmInput').value,tolerance:$('stopTolerance').value,near:$('nearKm').value},trip?.base.distance/1000);
}
function chooseCandidates(stations,coords){
  const w=stopWindow();
  return stations.map(s=>({...s,progress:progressKm(s,coords,trip.base.distance/1000)}))
    .filter(s=>s.progress>=Math.max(0,w.min-20)&&s.progress<=w.max+20)
    .sort((a,b)=>w.mode==="around"?Math.abs(a.progress-w.target)-Math.abs(b.progress-w.target):a.progress-b.progress);
}
// BEGIN STATION PAGINATION MODEL
function stationPageSize(limit){return Number.isInteger(limit)&&limit>0?Math.min(limit,20):20}
function stationPage(queue,cursor,limit=20){
 if(!Array.isArray(queue)||!Number.isInteger(cursor)||cursor<0||cursor>queue.length)throw new Error('Progression des stations invalide.');
 return queue.slice(cursor,cursor+stationPageSize(limit));
}
function commitStationPage(state,examined,scored){
 const expected=stationPage(state.queue,state.cursor,examined.length);
 if(!examined.length||examined.length>20||expected.length!==examined.length||expected.some((s,i)=>s.id!==examined[i].id))throw new Error('Lot de stations sans correspondance avec la recherche.');
 const ids=new Set(expected.map(s=>s.id)),known=new Set(state.results.map(s=>s.id)),byId=new Map();
 if(ids.size!==examined.length||[...ids].some(id=>known.has(id)))throw new Error('Station déjà comparée ou identifiant répété.');
 for(const row of scored){
  if(!ids.has(row.id)||byId.has(row.id)||['distanceFromStart','accessSeconds','extraKm','extraMin','purchase','detourFuelCost','real'].some(k=>!Number.isFinite(row[k])||row[k]<0))throw new Error('Accès de station non vérifiable.');
  byId.set(row.id,row);
 }
 const qualified=expected.map(s=>byId.get(s.id)).filter(Boolean),inside=qualified.filter(s=>s.distanceFromStart>=state.window.min&&s.distanceFromStart<=state.window.max);
 return {...state,cursor:state.cursor+examined.length,rejected:state.rejected+examined.length-qualified.length,outside:state.outside+qualified.length-inside.length,results:[...state.results,...inside.map((s,i)=>({...s,number:state.results.length+i+1}))]};
}
// END STATION PAGINATION MODEL

function scoreCandidates(cands,base,m,liters,cons){
  const endIndex=cands.length+1,out=[];
  for(let i=0;i<cands.length;i++){
    const idx=i+1,s=cands[i];
    const d1=m.distances?.[0]?.[idx],d2=m.distances?.[idx]?.[endIndex];
    const t1=m.durations?.[0]?.[idx],t2=m.durations?.[idx]?.[endIndex];
    if([d1,d2,t1,t2].some(v=>v==null||!Number.isFinite(v)||v<0))continue;
    const extraKm=(d1+d2-base.distance)/1000;
    const extraMin=(t1+t2-base.duration)/60;
    if(extraKm<0||extraMin<0)continue;
    const purchase=liters*s.price;
    const detourFuelCost=extraKm*cons/100*s.price;
    out.push({...s,distanceFromStart:d1/1000,accessSeconds:t1,extraKm,extraMin,purchase,detourFuelCost,real:purchase+detourFuelCost});
  }
  return out;
}
async function scoreConstrainedCandidates(cands,liters,cons,isCurrent=()=>true,progress=""){
  const scored=[];let unavailable=0,incomparable=0,overLimit=0;
  for(let i=0;i<cands.length;i++){
    if(!isCurrent()||activeAbort?.signal.aborted)throw new Error("Recherche interrompue.");
    $("fuelStatus").textContent=progress||`Vérification avec exclusions : station ${i+1} sur ${cands.length}…`;
    const station=cands[i];let via;
    try{via=await route(routePlanNodes(station).map(n=>n.point),true,false,trip.routing,isCurrent);if(!isCurrent())throw new Error("Recherche interrompue.");if(trip.meetings)meetingLegs(via,routePlanNodes(station))}
    catch(e){if(e.noRoute){unavailable++;continue}throw e}
    const extraKm=(via.distance-trip.base.distance)/1000,extraMin=(via.duration-trip.base.duration)/60;
    // A shorter/faster recalculated route is not silently treated as a zero detour.
    if(extraKm<0||extraMin<0){incomparable++;continue}
    if(trip.meetings&&!meetingDetour(via,trip.meetings.reference.base,trip.meetings.limits).allowed){overLimit++;continue}
    const access=trip.meetings?meetingLegs(via,routePlanNodes(station)):{accessDistance:via.legs[0].distance,accessSeconds:via.legs[0].duration};
    const purchase=liters*station.price,detourFuelCost=extraKm*cons/100*station.price;
    scored.push({...station,via,distanceFromStart:access.accessDistance/1000,accessSeconds:access.accessSeconds,extraKm,extraMin,purchase,detourFuelCost,real:purchase+detourFuelCost});
  }
  return {scored,counts:{overLimit,unavailable,incomparable},note:[overLimit?`${overLimit} station(s) au-delà de la limite totale des rencontres : exclues.`:"",unavailable?`${unavailable} station(s) sans accès calculable.`:"",incomparable?`${incomparable} trajet(s) recalculé(s) plus courts ou plus rapides : exclus du classement, comparaison à examiner.`:""].filter(Boolean).join(" ")};
}
// BEGIN PRICE FRESHNESS MODEL
function priceInstant(value){
  if(typeof value!=="string")return null;
  const m=/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?(Z|([+-])(\d{2}):(\d{2}))$/.exec(value);
  if(!m)return null;
  const [y,mo,d,h,mi,se]=m.slice(1,7).map(Number),oh=Number(m[10]||0),om=Number(m[11]||0);
  if(y<100||mo<1||mo>12||d<1||h>23||mi>59||se>59||oh>14||om>59||oh===14&&om!==0||m[8]==='-00:00')return null;
  const local=Date.UTC(y,mo-1,d,h,mi,se,Number((m[7]||'').padEnd(3,'0'))),check=new Date(local);
  if(check.getUTCMonth()!==mo-1||check.getUTCDate()!==d)return null;
  return local-(m[9]==='-'?-1:1)*(oh*60+om)*60000;
}
function priceFreshness(updated,now=Date.now(),receivedAt=null){
  const at=priceInstant(updated),received=priceInstant(receivedAt);
  const reason=!Number.isFinite(now)?'clock':!updated?'missing':at===null?'invalid':at>now?'future':received!==null&&received>now?'clock':null;
  if(reason)return {state:'unknown',eligible:false,reason,at};
  const hours=(now-at)/3600000;
  return {state:hours>168?'old':hours>48?'warning':'recent',eligible:hours<=168,reason:null,at,hours};
}
// END PRICE FRESHNESS MODEL
function stationFreshness(s){return priceFreshness(s.updated,Date.now(),s.receivedAt)}
function priceAgeText(updated,receivedAt=null){
  const f=priceFreshness(updated,Date.now(),receivedAt);
  const date=f.at===null?'':` · prix déclaré le ${new Date(f.at).toLocaleString('fr-FR',{timeZone:'Europe/Paris'})} (Paris)`;
  const labels={missing:'Date du prix absente — non vérifiable',invalid:'Date du prix invalide — non vérifiable',future:'Date du prix future — non vérifiable',clock:'Horloge incohérente — prix non vérifiable'};
  return (f.reason?labels[f.reason]:f.state==='old'?'Prix ancien — plus de 7 jours, hors classement':f.state==='warning'?'Prix à vérifier — plus de 48 h':'Prix récent — 48 h ou moins')+date;
}
function age(iso){return priceAgeText(iso)}
function stationPriceText(s){return priceAgeText(s.updated,s.receivedAt)}
let priceViewSignature='';
function expireStationBudget(){
  if(!budgetReference?.stationId)return;
  if(budgetReference.expired||!priceFreshness(budgetReference.updated,Date.now(),budgetReference.receivedAt).eligible||budgetReference.fuel!==$('fuel').value){
    $('budgetPrice').value='';budgetReference.expired=true;
  }
}
function refreshPriceFreshness(){
  if(busy)return;
  expireStationBudget();updateBudget();
  const signature=JSON.stringify(compared.map(s=>[s.id,stationFreshness(s).state,stationFreshness(s).reason]));
  if(signature!==priceViewSignature){priceViewSignature=signature;if(stationSearch)renderStations(compared,stopWindow().mode)}
  if($('stationDialog').open&&currentStation)renderStationDetails(currentStation);
}

function serviceSelection(){return [...document.querySelectorAll('[data-service]:checked')].map(el=>el.value)}
function updateServiceChoices(){
  const chosen=new Set(serviceSelection());
  const names=[...new Set([...chosen,...compared.flatMap(s=>s.services)])].sort((a,b)=>a.localeCompare(b,"fr"));
  $("serviceChoices").innerHTML=names.length?names.map(name=>`<label class="check-label"><input type="checkbox" data-service value="${escapeHtml(name)}" ${chosen.has(name)?"checked":""} ${busy?"disabled":""}> ${escapeHtml(name)}</label>`).join(""):'<p class="note">Aucun service renseigné dans les stations comparées.</p>';
}
function filterStations(stations){
  const services=serviceSelection(),range=rangeEstimate(),limits={};
  for(const [id,key,max] of [["maxDetourKm","km",1000],["maxDetourMin","min",1440]]){
    const raw=$(id).value.trim(),value=Number(raw);
    if($(id).validity.badInput||(raw&&(!Number.isFinite(value)||value<0||value>max)))return {visible:[],error:`Détour maximal ${key==="km"?"en kilomètres":"en minutes"} : saisir une valeur de 0 à ${max}, ou laisser vide.`,excluded:{}};
    limits[key]=raw?value:Infinity;
  }
  const excluded={freshness:0,detour:0,unknown:0,undeclared:0,range:0,hoursUnknown:0,hoursOutside:0,hoursOther:0};
  const hoursFilter=$("stationOpeningFilter").value,priceView=$("stationPriceView").value;
  const visible=stations.filter(s=>{
    const f=stationFreshness(s);if(priceView==="recent"?!f.eligible:f.state!==priceView){excluded.freshness++;return false}
    if(s.extraKm>limits.km+1e-9||s.extraMin>limits.min+1e-9){excluded.detour++;return false}
    if(services.length&&!s.services.length){excluded.unknown++;return false}
    if(services.some(service=>!s.services.includes(service))){excluded.undeclared++;return false}
    if($("rangeOnly").checked&&range?.valid&&s.distanceFromStart>range.useful){excluded.range++;return false}
    const opening=stationOpening(s);
    if(hoursFilter!=="all"&&opening.state!==hoursFilter){excluded[opening.state==="unknown"?"hoursUnknown":opening.state==="outside"?"hoursOutside":"hoursOther"]++;return false}
    return true;
  });
  return {visible,excluded,error:""};
}
function refreshStationMap(visible,fit=false){
  if(!trip)return;
  const chosen=selectedStop?.station,outside=chosen&&!visible.some(s=>s.id===chosen.id);
  $("filteredStopNote").hidden=!outside;
  $("filteredStopNote").textContent=outside?`L’arrêt choisi (point ${chosen.number}) ne satisfait plus les filtres. Il reste dans le trajet et sur la carte, en plus des résultats. Utiliser « Retirer l’arrêt » pour l’enlever.`:"";
  const points=outside?[...visible,chosen]:visible;
  const coords=selectedStop?selectedStop.via.geometry.coordinates.map(([lon,lat])=>[lat,lon]):trip.coords;
  showOnMap(coords,points,chosen||null,trip.a,trip.b,chosen?`${trip.label} · arrêt ${chosen.city}`:trip.label,fit);
}
function renderStations(stations,mode,fit=false){
 updatePreparationReadout();
  priceViewSignature=JSON.stringify(stations.map(s=>[s.id,stationFreshness(s).state,stationFreshness(s).reason]));
  updateResumePreparation();
  const range=rangeEstimate(),{visible,excluded,error}=filterStations(stations);
  $("stationListControls").hidden=!stations.length;
  $("eligibleCount").textContent=String(visible.length);updateStationEmpty(visible.length);
  $("stationFilterStatus").hidden=false;
  const reasons=[excluded.freshness?`${excluded.freshness} hors du groupe de fraîcheur choisi`:"",excluded.hoursUnknown?`${excluded.hoursUnknown} aux horaires inconnus`:"",excluded.hoursOutside?`${excluded.hoursOutside} hors horaires du guichet, sans automate déclaré`:"",excluded.hoursOther?`${excluded.hoursOther} aux horaires compatibles (hors vue choisie)`:"",excluded.detour?`${excluded.detour} au-delà du détour maximal`:"",excluded.unknown?`${excluded.unknown} aux services non renseignés`:"",excluded.undeclared?`${excluded.undeclared} sans tous les services requis déclarés`:"",excluded.range?`${excluded.range} hors portée estimée`:""].filter(Boolean);
  const hoursCount=stations.reduce((a,s)=>{a[stationOpening(s).state]++;return a},{compatible:0,outside:0,unknown:0});
  const hoursSummary=` Horaires habituels, avant filtres : ${hoursCount.compatible} compatibles, ${hoursCount.outside} hors guichet sans automate déclaré, ${hoursCount.unknown} inconnus. Aucune ouverture garantie.`;
  const freshnessCount=stations.reduce((a,s)=>{const f=stationFreshness(s);a[f.eligible?'recent':f.state]++;return a},{recent:0,old:0,unknown:0});
  $("stationFreshnessStatus").textContent=`Avant filtres : ${freshnessCount.recent} prix de 7 jours ou moins, ${freshnessCount.old} anciens, ${freshnessCount.unknown} non vérifiables. Les autres groupes sont consultables ci-dessus, sans classement de prix.`;
  const archival=$("stationPriceView").value!=="recent";
  $("stationRankingControls").hidden=archival;
  const baseText=error||`${visible.length} sur ${stations.length} stations comparées satisfont les filtres.${reasons.length?" Écartées : "+reasons.join(" ; ")+".":""}`+hoursSummary;
  if(!visible.length){
    $("stationFilterStatus").textContent=baseText;
    $('stationResultReadout').textContent=baseText;
    $("stationCards").innerHTML=`<p class="note">${error?"Corriger la saisie ou réinitialiser les filtres.":stations.length&&excluded.range===stations.length?"Aucune station comparée dans la portée estimée. Ne pas compter sur cette estimation pour poursuivre sans carburant.":"Aucune station comparée ne satisfait tous les filtres. Modifier ou réinitialiser les filtres sans recalculer le trajet. Aucun élargissement automatique."}</p>`;
    refreshStationMap([],fit);return;
  }
  const cost=Math.min(...visible.map(s=>Math.round(s.real*100))),price=Math.min(...visible.map(s=>Math.round(s.price*1000))),minutes=Math.min(...visible.map(s=>s.extraMin));
  const winners=archival?[]:[
    ["OPTIMAL",s=>Math.round(s.real*100)===cost],
    ["POMPE",s=>Math.round(s.price*1000)===price],
    ["RAPIDE",s=>Math.abs(s.extraMin-minutes)<1e-9]
  ];
  const listMode=$("stationListMode").value;
  const byDistance=(a,b)=>a.distanceFromStart-b.distanceFromStart||a.number-b.number;
  const sorts={all:byDistance,cost:(a,b)=>Math.round(a.real*100)-Math.round(b.real*100)||byDistance(a,b),price:(a,b)=>Math.round(a.price*1000)-Math.round(b.price*1000)||byDistance(a,b),detour:(a,b)=>a.extraMin-b.extraMin||a.extraKm-b.extraKm||byDistance(a,b)};
  const recommendations=[...new Map(winners.flatMap(([,wins])=>visible.filter(wins).sort(byDistance)).map(s=>[s.id,s])).values()];
  const list=archival?[...visible].sort(byDistance):listMode!=="recommended"?[...visible].sort(sorts[listMode]||byDistance):[...new Map([...(mode==="soon"?[...visible].sort(byDistance).slice(0,3):[]),...recommendations].map(s=>[s.id,s])).values()];
  $("stationFilterStatus").textContent=baseText+` Carte : ${visible.length} résultats ; liste : ${list.length} fiches. ${archival?"Prix exclus des recommandations et du budget ; arrêts consultables par distance.":`Badges calculés parmi ces ${visible.length} stations, sous les filtres actifs.`}`;
  $('stationResultReadout').textContent=`${list.length} fiches · ${$('stationPriceView').selectedOptions[0].textContent} · ${archival?'distance croissante':$('stationListMode').selectedOptions[0].textContent}. ${visible.length} stations retenues sous les filtres actifs.${stationSearch&&stationSearch.cursor<stationSearch.queue.length?' Comparaison partielle : candidates restantes.':''} Recherche non exhaustive. ${archival?'Prix hors classement et budget.':'Coût : achat + carburant du détour, hors péages.'} Ouverture non garantie.`;
  $("stationCards").innerHTML=list.map(s=>`<article class="result-card" data-station="${escapeHtml(s.id)}">
    <div class="result-badges">${winners.filter(([,winner])=>winner(s)).map(([name])=>`<span class="result-badge">${name}</span>`).join("")}</div>
    <span class="station-index">Point ${s.number}</span><h3>${escapeHtml(s.city||`Station ${s.id}`)}</h3><div class="result-small">${escapeHtml(s.address)}</div>
    <div class="result-line">À ${fmt(s.distanceFromStart,1)} km du départ</div>
    <p class="station-opening" data-opening="${stationOpening(s).state}">${escapeHtml(openingText(s))}</p>
    <p class="range-badge${range?.valid&&s.distanceFromStart>range.useful?" outside":""}">${escapeHtml(stationRangeText(s.distanceFromStart,range))}</p>
    ${archival?'<p class="note">Coût non comparé · prix à vérifier.</p>':`<div class="price">${fmt(s.real)} € <span class="price-note">achat + carburant du détour</span></div>`}
    <div class="result-line"><b>${fmt(s.price,3)} €/L${archival?" déclaré, à vérifier":""}</b> · +${fmt(s.extraKm,1)} km · +${Math.round(s.extraMin)} min</div>
    ${archival?'':`<div class="result-small">Achat ${fmt(s.purchase)} € · carburant du détour ${fmt(s.detourFuelCost)} €</div>`}
    <p class="price-freshness" data-freshness="${stationFreshness(s).state}">${escapeHtml(stationPriceText(s))}</p>
    <button class="ghost station-detail-link" data-details="${escapeHtml(s.id)}">Infos et favori</button><button class="choose-station" data-select="${escapeHtml(s.id)}" aria-pressed="false">${archival?"Choisir cet arrêt · prix à vérifier":"Choisir cette station"}</button>
    </article>`).join("");
  document.querySelectorAll('[data-station]').forEach(el=>el.classList.toggle('selected',el.dataset.station===selectedStop?.station.id));
  document.querySelectorAll('[data-select]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.select===selectedStop?.station.id)));
  refreshStationMap(visible,fit);
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
let stationPicker=null,stationDetailReturn=null,stationPointFrame=0;
function queueStationPoints(){cancelAnimationFrame(stationPointFrame);stationPointFrame=requestAnimationFrame(()=>{
 const points=[...document.querySelectorAll('#map [data-station-point]')].map(e=>({e,r:e.getBoundingClientRect()})).filter(p=>p.r.width&&p.r.height);
 for(const p of points){const n=points.filter(q=>p.r.left<q.r.right&&p.r.right>q.r.left&&p.r.top<q.r.bottom&&p.r.bottom>q.r.top).length;p.e.classList.toggle('station-overlap',n>1);p.e.dataset.nearbyCount=String(n)}
})}
function mapStations(){return mapView?.[1]||[]}
function stationPointSize(){return Math.max(44,parseFloat(getComputedStyle(document.documentElement).fontSize)*2.5)}
function stationPointElement(id){return [...document.querySelectorAll('#map [data-station-point]')].find(e=>e.dataset.stationPoint===id&&e.getClientRects().length)}
function returnStationFocus(target,id){
 if(document.querySelector('dialog[open]'))return;
 const next=target?.isConnected&&target.getClientRects().length?target:stationPointElement(id)||(!$('stationMapTools').hidden?$('mapStationsBtn'):$('stationsBtn'));
 if(next&&!next.disabled)next.focus();
}
function closeStationPicker(restore=true){
 const old=stationPicker;stationPicker=null;if($('stationPickerDialog').open)$('stationPickerDialog').close();
 if(restore&&old)returnStationFocus(old.focus,old.stationId);
}
function renderStationPicker(){
 if(!stationPicker)return;
 const normalize=x=>String(x).normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase();
 const query=normalize($('stationPickerSearch').value.trim());
 const current=mapStations().filter(s=>!stationPicker.ids||stationPicker.ids.includes(s.id)).slice().sort((a,b)=>a.number-b.number);
 const rows=current.filter(s=>!query||normalize(`${s.number} ${s.city} ${s.address}`).includes(query));
 const focused=document.activeElement?.dataset?.pickerStation;
 $('stationPickerCount').textContent=rows.length?`${rows.length} station(s) sur ${current.length}. Numéros conservés, ordre des points.`:current.length?'Aucune correspondance. Modifier ou effacer la recherche.':'Ces stations ne sont plus dans les résultats de la carte.';
 $('stationPickerList').innerHTML=rows.map(s=>`<button class="ghost station-picker-row" type="button" data-picker-station="${escapeHtml(s.id)}"><strong>Point ${s.number}${selectedStop?.station.id===s.id?' · arrêt choisi':''}</strong><span>${escapeHtml(s.address)}</span><span>${fmt(s.price,3)} €/L · ${escapeHtml(stationPriceText(s))}</span><span>Ouvrir la fiche</span></button>`).join('');
 if(focused&&$('stationPickerDialog').matches(':modal')){const next=[...$('stationPickerList').querySelectorAll('button')].find(b=>b.dataset.pickerStation===focused);(next||$('stationPickerSearch')).focus()}
}
function openStationPicker(ids=null,focus=document.activeElement,stationId=null){
 if(busy||!mapStations().length)return;
 stationPicker={ids,focus,stationId};$('stationPickerSearch').value='';
 $('stationPickerTitle').textContent=ids?'Points superposés sur la carte':'Stations de cette carte';
 $('stationPickerHelp').textContent=ids?'Ces points se chevauchent à ce niveau de zoom. Choisir une fiche ; leurs numéros et positions restent inchangés.':'Toutes les stations représentées sur la carte, sous les filtres actifs, ainsi que l’arrêt choisi s’il est hors filtre. La liste ne dépend pas du cadrage. Aucun nouveau calcul.';
 renderStationPicker();$('stationPickerDialog').showModal();$('stationPickerSearch').focus();
}
function activateMapStation(id,element,pointer=true){
 if(busy||!mapStations().some(s=>s.id===id))return;
 if(pointer){const a=element.getBoundingClientRect(),ids=[...document.querySelectorAll('#map [data-station-point]')].filter(e=>{const b=e.getBoundingClientRect();return b.width&&b.height&&a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top}).map(e=>e.dataset.stationPoint);
  if(ids.length>1){openStationPicker(ids,element,id);return}
 }
 stationDetailReturn={focus:element,id};openStation(id);
}
function updateStationMapTools(){
 const n=mapStations().length;$('stationMapTools').hidden=!n;$('mapStationCount').textContent=String(n);$('mapStationsBtn').disabled=busy;
 $('mapStationsBtn').setAttribute('aria-label',`Parcourir les ${n} stations de cette carte`);$('mapStationsBtn').title=`Parcourir les ${n} stations de cette carte`;
 if(stationPicker)renderStationPicker();
}
$('mapStationsBtn').addEventListener('click',()=>openStationPicker());
for(const type of ['pointerdown','mousedown','touchstart','dblclick','keydown','click'])$('stationMapTools').addEventListener(type,e=>e.stopPropagation());
$('stationPickerClose').addEventListener('click',()=>closeStationPicker());
$('stationPickerDialog').addEventListener('cancel',e=>{e.preventDefault();closeStationPicker()});
$('stationPickerDialog').addEventListener('close',()=>{if(!$('stationPickerDialog').open&&stationPicker)closeStationPicker()});
$('stationPickerSearch').addEventListener('input',renderStationPicker);
$('stationPickerList').addEventListener('click',e=>{const button=e.target.closest('[data-picker-station]');if(!button||busy)return;const id=button.dataset.pickerStation;if(!mapStations().some(s=>s.id===id)){renderStationPicker();return}stationDetailReturn={pickerId:id};openStation(id)});
const stationLayoutObserver=new ResizeObserver(()=>{
 if(!mapView)return;if(map){queueStationPoints();return}
 const id=document.activeElement?.dataset?.stationPoint;showOnMap(...mapView,false);
 if(id)returnStationFocus(null,id);
});
stationLayoutObserver.observe($('map'));stationLayoutObserver.observe($('sheet'));
function projectSvg(coords,stations=[],best=null,label="",alternatives=[]){
  if(!coords?.length)return;
  const W=1000,H=700,pad=70;
  let minLat=Infinity,maxLat=-Infinity,minLon=Infinity,maxLon=-Infinity;
  const all=coords.concat(...alternatives,stations.map(s=>[s.lat,s.lon]));
  for(const [lat,lon] of all){minLat=Math.min(minLat,lat);maxLat=Math.max(maxLat,lat);minLon=Math.min(minLon,lon);maxLon=Math.max(maxLon,lon)}
  const latSpan=Math.max(.01,maxLat-minLat),lonSpan=Math.max(.01,maxLon-minLon);
  const scale=Math.min((W-2*pad)/lonSpan,(H-2*pad)/latSpan);
  const xoff=(W-lonSpan*scale)/2,yoff=(H-latSpan*scale)/2;
  const P=([lat,lon])=>[xoff+(lon-minLon)*scale,H-(yoff+(lat-minLat)*scale)];
  $("alternativeRoutes").replaceChildren(...alternatives.map(points=>{
    const path=document.createElementNS("http://www.w3.org/2000/svg","path");
    path.setAttribute("class","route-alternative");
    path.setAttribute("d",points.map((p,i)=>{const [x,y]=P(p);return `${i?"L":"M"} ${x.toFixed(1)} ${y.toFixed(1)}`}).join(" "));
    const index=trip?.choices.findIndex(r=>JSON.stringify(r.geometry.coordinates.map(([lon,lat])=>[lat,lon]))===JSON.stringify(points));
    if(index>=0){path.dataset.routeIndex=String(index);path.addEventListener('click',()=>chooseRoute(index))}
    return path;
  }));
  $('routeVariantMarkers').replaceChildren();
  if(!best&&(trip?.choices.length||0)>1)trip.choices.forEach((r,i)=>{
   const [x,y]=P(routeVariantAnchor(r,i)),g=document.createElementNS('http://www.w3.org/2000/svg','g'),active=i===trip.choice;
   g.setAttribute('class','svg-route-variant'+(active?' current':''));g.setAttribute('role','button');g.setAttribute('tabindex','0');g.setAttribute('aria-pressed',String(active));g.setAttribute('aria-haspopup','dialog');g.setAttribute('aria-label',`T${i+1} · `+routeChoiceText(r,i)+(active?' · référence actuelle':' · comparer avant confirmation'));g.dataset.routeIndex=String(i);
   g.innerHTML=`<rect x="${x-28}" y="${y-24}" width="56" height="48" rx="8"/><text x="${x}" y="${y+7}" text-anchor="middle">T${i+1}</text>`;
   g.addEventListener('click',()=>chooseRoute(i,g));g.addEventListener('keydown',e=>{if(['Enter',' '].includes(e.key)){e.preventDefault();chooseRoute(i,g)}});$('routeVariantMarkers').append(g);
  });
  const step=Math.max(1,Math.floor(coords.length/350));let d="";
  coords.forEach((p,i)=>{if(i%step&&i!==coords.length-1)return;const [x,y]=P(p);d+=(d?" L ":"M ")+x.toFixed(1)+" "+y.toFixed(1)});
  $("routeLine").setAttribute("d",d);$("routeGlow").setAttribute("d",d);
  const a=P(coords[0]),b=P(coords.at(-1));
  $("startDot").setAttribute("cx",a[0]);$("startDot").setAttribute("cy",a[1]);
  $("endDot").setAttribute("cx",b[0]);$("endDot").setAttribute("cy",b[1]);
  const screen=$('routeViz').getScreenCTM(),markerScale=1/Math.max(.001,screen?Math.hypot(screen.a,screen.b):1),size=stationPointSize(),radius=size/2;
  $("stationDots").innerHTML=stations.map(s=>{const [x,y]=P([s.lat,s.lon]);const cl=s.id===best?.id?"station-best":"station-dot";return `<g class="svg-station" role="button" tabindex="0" data-details="${escapeHtml(s.id)}" data-station-point="${escapeHtml(s.id)}" aria-haspopup="dialog" aria-label="Voir la station ${s.number} : ${escapeHtml(s.address)} · ${escapeHtml(stationPriceText(s))} · ${escapeHtml(openingText(s))}" transform="translate(${x} ${y}) scale(${markerScale})"><title>${escapeHtml(openingText(s))}</title><rect x="${-radius}" y="${-radius}" width="${size}" height="${size}" fill="transparent"/><circle class="${cl}" r="${radius-2}"/><text y="0" dominant-baseline="central" text-anchor="middle">${s.number}</text><text class="overlap-hint" x="${radius-9}" y="${radius-5}" text-anchor="middle" aria-hidden="true">+</text></g>`}).join("");
  $('meetingDots').innerHTML=trip?.meetings?['pickup','dropoff'].map((key,i)=>{const place=trip.meetings[key],[x,y]=P([place.lat,place.lon]);return `<g><title>${escapeHtml((i?'Dépose : ':'Prise en charge : ')+place.label)}</title><circle cx="${x}" cy="${y}" r="18" fill="#5030a0" stroke="white" stroke-width="3"/><text x="${x}" y="${y+5}" text-anchor="middle" fill="white">${i?'D':'P'}</text></g>`}).join(''):'';
  tollGuide.projection=P;drawTollMarkers();
  $("fallbackLabel").textContent=label||"Visualisation autonome";queueStationPoints();
}
function showOnMap(coords,stations,best,start,end,label,fit=true){
  mapView=[coords,stations,best,start,end,label];updateStationMapTools();
  const variants=best?[]:(trip?.choices||[]).map((r,i)=>({r,i,points:r.geometry.coordinates.map(([lon,lat])=>[lat,lon])}));
  const alternatives=variants.filter(v=>v.i!==trip.choice).map(v=>v.points);
  $("routeAlternativesNote").hidden=Boolean(best);
  $("routeAlternativesNote").textContent=alternatives.length?`${alternatives.length} autre(s) trajet(s) disponible(s).`:"Aucun autre trajet proposé par le moteur pour cette recherche.";
  if(!best&&trip?.base.alternativeNotice)$("routeAlternativesNote").textContent=trip.base.alternativeNotice;
  if(!map){projectSvg(coords,stations,best,label,alternatives);return}
  if(routeLayer)map.removeLayer(routeLayer);
  markerLayer.clearLayers();
  routeLayer=L.featureGroup().addTo(map);
  variants.filter(v=>v.i!==trip.choice).forEach(({points,r,i})=>{
   const line=L.polyline(points,{color:'#82baff',weight:6,opacity:1,bubblingMouseEvents:false,className:'map-route-alternative'}).addTo(routeLayer);
   line.on('click',()=>chooseRoute(i,line.getElement()));line.bindTooltip(routeChoiceText(r,i));
   const el=line.getElement();el.setAttribute('data-route-index',String(i));el.setAttribute('tabindex','0');el.setAttribute('role','button');el.setAttribute('aria-label',routeChoiceText(r,i)+' · comparer avant confirmation');el.setAttribute('aria-haspopup','dialog');el.addEventListener('keydown',e=>{if(['Enter',' '].includes(e.key)){e.preventDefault();chooseRoute(i,el)}});
  });
  L.polyline(coords,{color:"#fff",weight:11,opacity:1,interactive:false,className:"map-route-outline"}).addTo(routeLayer);
  L.polyline(coords,{color:"#0758d9",weight:7,opacity:1,interactive:false,className:"map-route-selected"}).addTo(routeLayer);
  if(variants.length>1)for(const {r,i} of variants){
   const active=i===trip.choice,title=`T${i+1} · `+routeChoiceText(r,i)+(active?' · référence actuelle':' · comparer avant confirmation');
   const marker=L.marker(routeVariantAnchor(r,i),{icon:L.divIcon({className:'route-variant-marker'+(active?' current':''),html:'T'+(i+1),iconSize:[44,44],iconAnchor:[22,22]}),title,keyboard:true}).addTo(routeLayer);
   const el=marker.getElement();el.setAttribute('aria-label',title);el.setAttribute('aria-pressed',String(active));el.setAttribute('aria-haspopup','dialog');el.dataset.routeIndex=String(i);
   marker.on('click',()=>chooseRoute(i,el));el.addEventListener('keydown',e=>{if(['Enter',' '].includes(e.key)){e.preventDefault();e.stopPropagation();chooseRoute(i,el)}});
  }
  L.circleMarker(start,{radius:7,color:"#111",weight:3,fillColor:"#fff",fillOpacity:1}).addTo(markerLayer);
  L.circleMarker(end,{radius:7,color:"#111",weight:3,fillColor:"#fff",fillOpacity:1}).addTo(markerLayer);
  if(trip?.meetings)for(const [key,letter] of [['pickup','P'],['dropoff','D']]){const place=trip.meetings[key],title=(key==='pickup'?'Prise en charge : ':'Dépose : ')+place.label;
   const marker=L.marker([place.lat,place.lon],{icon:L.divIcon({className:'meeting-marker',html:letter,iconSize:[36,36],iconAnchor:[18,18]}),title,keyboard:true}).addTo(markerLayer);marker.getElement().setAttribute('aria-label',title);const text=document.createElement('p');text.textContent=title;marker.bindPopup(text);
  }
  stations.forEach(s=>{
    const isBest=s.id===best?.id;
    const marker=L.marker([s.lat,s.lon],{icon:L.divIcon({className:"station-marker"+(isBest?" chosen":""),html:String(s.number),iconSize:[44,44],iconAnchor:[22,22]}),title:`Voir la station ${s.number} : ${s.address} · ${stationPriceText(s)} · ${openingText(s)}`,keyboard:true}).addTo(markerLayer);
    marker.getElement().setAttribute("aria-label",`Voir la station ${s.number} : ${s.address} · ${stationPriceText(s)} · ${openingText(s)}`);
    const point=marker.getElement();point.dataset.stationPoint=s.id;point.setAttribute('aria-haspopup','dialog');
    marker.on('click',event=>activateMapStation(s.id,point,event.originalEvent?.detail!==0));
    point.addEventListener('keydown',e=>{if(['Enter',' '].includes(e.key)){e.preventDefault();e.stopPropagation();activateMapStation(s.id,point,false)}});
  });
  drawTollMarkers();queueStationPoints();
  map.invalidateSize();if(fit)map.fitBounds(L.featureGroup([routeLayer,markerLayer]).getBounds(),{padding:[35,35],animate:false});
}

function rangeEstimate(){
  const mode=$("rangeMode").value;
  if(mode==="none")return null;
  const amount=Number($("rangeValue").value),reserve=Number($("reserveKm").value),cons=Number($("cons").value);
  if(!$("rangeValue").value.trim()||!$("reserveKm").value.trim()||!Number.isFinite(amount)||amount<0||amount>(mode==="km"?5000:2000)||!Number.isFinite(reserve)||reserve<0||reserve>500||(mode==="liters"&&(!Number.isFinite(cons)||cons<1||cons>100)))return {valid:false};
  const total=mode==="liters"?amount*100/cons:amount;
  return {valid:true,total,reserve,useful:Math.max(0,total-reserve)};
}
function stationRangeText(distance,range=rangeEstimate()){
  if(!range?.valid)return "Autonomie inconnue";
  return distance<=range.useful?"Dans la portée estimée, sans garantie d’accès":"Hors portée estimée avec la réserve choisie";
}
function updateRange(){
  const mode=$("rangeMode").value,range=rangeEstimate();
  $("rangeFields").hidden=mode==="none";
  $("rangeValueLabel").textContent=mode==="liters"?"Carburant restant (L)":"Distance restante (km)";
  $("rangeValue").max=mode==="liters"?"2000":"5000";
  $("rangeOnly").disabled=busy||!range?.valid;
  if(!range?.valid)$("rangeOnly").checked=false;
  $("rangeStatus").textContent=!range?"Autonomie inconnue. Distances depuis le départ, sans suivi en temps réel.":!range.valid?"Renseigner une autonomie et une réserve valides.":`${fmt(range.total,1)} km théoriques − ${fmt(range.reserve,0)} km de réserve : ${fmt(range.useful,1)} km utiles estimés depuis le départ. ${preparedRangePending?"Valeur mémorisée dans la préparation, à actualiser.":"Saisie à "+new Date(rangeMeasuredAt||Date.now()).toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})+"."} Aucun suivi du carburant ni garantie d’accès ou d’ouverture.`;
  if(compared.length)renderStations(compared,stopWindow().mode);
}
function resetRange(){
  preparedRangePending=false;
  $("rangeMode").value="none";$("rangeValue").value="";$("rangeOnly").checked=false;rangeMeasuredAt=null;updateRange();
}
const tollState={key:'',sequence:0,abort:null,timer:null,expiry:null,quote:null,error:'',loading:false,enabled:false};
const tableTolls={key:'',segments:[],notice:'',index:new Map(),dateInitialized:false};
const tariffData=window.DRAGONROUTE_TARIFFS;
// BEGIN TOLL GUIDE GEOMETRY
function tollName(value){return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[’]/g,"'").trim().replace(/\s+/g,' ').toUpperCase()}
function tollGateLabel(gate){return typeof gate.name==='string'&&gate.name.trim()&&!gate.name.includes('\uFFFD')?gate.name:'Nom de gare incomplet dans la source'}
function guideDistance(a,b){
 const rad=Math.PI/180,z=Math.sin((b[0]-a[0])*rad/2)**2+Math.cos(a[0]*rad)*Math.cos(b[0]*rad)*Math.sin((b[1]-a[1])*rad/2)**2;
 return 6371*2*Math.asin(Math.sqrt(Math.min(1,z)));
}
function findTollGates(coords,gates,radius){
 if(!Array.isArray(coords)||coords.length<2||!Number.isFinite(radius)||radius<=0||radius>1)throw new Error('Tracé ou rayon invalide.');
 if(coords.some(p=>!Array.isArray(p)||p.length<2||!p.slice(0,2).every(Number.isFinite)))throw new Error('Coordonnées invalides.');
 let progress=0;const segments=coords.slice(1).map((b,i)=>{const a=coords[i],length=guideDistance(a,b),s={a,b,length,progress};progress+=length;return s});
 return gates.flatMap(gate=>{
  let best=null;
  for(const position of gate.positions){
   const [lat,lon]=position,kx=111.32*Math.cos(lat*Math.PI/180),ky=110.574;
   for(const s of segments){
    const {a,b}=s;
    if(lat<Math.min(a[0],b[0])-radius/ky||lat>Math.max(a[0],b[0])+radius/ky||lon<Math.min(a[1],b[1])-radius/kx||lon>Math.max(a[1],b[1])+radius/kx)continue;
    const vx=(b[1]-a[1])*kx,vy=(b[0]-a[0])*ky,wx=(lon-a[1])*kx,wy=(lat-a[0])*ky,c=vx*vx+vy*vy;
    const t=c?Math.max(0,Math.min(1,(wx*vx+wy*vy)/c)):0,distance=Math.hypot(wx-t*vx,wy-t*vy);
    if(distance<=radius&&(!best||distance<best.distance))best={distance,progress:s.progress+t*s.length,lat,lon};
   }
  }
  return best?[{...gate,...best}]:[];
 }).sort((a,b)=>a.progress-b.progress||a.id.localeCompare(b.id));
}
// END TOLL GUIDE GEOMETRY
const tollInventory=window.DRAGONROUTE_TOLL_GATES;
const tollGuide={key:'',matches:[],total:0,shown:false,layer:null,projection:null,suggested:false};
function syncTollGuide(key){
 if(key!==tollGuide.key){
  tollGuide.key=key;tollGuide.matches=[];tollGuide.total=0;tollGuide.shown=false;
  if(tollGuide.suggested){$("tariffEntry").value='';$("tariffExit").replaceChildren(new Option('Choisir une sortie',''))}
  tollGuide.suggested=false;$("tariffGateConfirmed").checked=false;
  $("tollGateList").replaceChildren();$("tollGuideChoice").textContent="";$("tollGuideStatus").textContent=trip?'Repérage à lancer pour ce trajet.':'Calculer un trajet pour repérer les gares.';
  drawTollMarkers();
 }
 $("tollLocate").disabled=busy||!trip||tollInventory?.schemaVersion!==1;
 $("tollGuideRadius").disabled=busy||!trip;
 $("tollGuideToggle").hidden=!tollGuide.matches.length;$("tollGuideToggle").disabled=busy;
 $("tollGuideToggle").textContent=tollGuide.shown?'Masquer les gares sur la carte':'Afficher les gares sur la carte';
 $("tariffGateConfirmation").hidden=!tollGuide.suggested;
 $("tariffGateConfirmed").disabled=busy||!trip;
 document.querySelectorAll('[data-toll-propose],[data-toll-map]').forEach(el=>el.disabled=busy);
 if(!tollInventory)$("tollGuideStatus").textContent='Inventaire géographique indisponible. Le choix manuel des gares reste disponible.';
}
function gateTariffNames(gate){
 if(!gate.name?.trim()||gate.name.includes('\uFFFD'))return [];
 return Object.entries(tariffData?.networks||{}).flatMap(([network,data])=>(data.kind==='passage'?[]:data.gates).flatMap((name,index)=>tollName(name)===tollName(gate.name)?[{network,index,name}]:[]));
}
function renderTollGuide(){
 $("tollGateList").innerHTML=tollGuide.matches.map((gate,i)=>{
  const names=gateTariffNames(gate),match=names.length===1?names[0]:null;
  return `<article class="toll-gate-card" id="toll-card-${gate.id}" tabindex="-1"><h4>P${i+1} · ${escapeHtml(tollGateLabel(gate))}</h4><p>${escapeHtml(gate.type)} · ${gate.positions.length} position(s) recensée(s). À ${Math.round(gate.distance*1000)} m du tracé ; vers le km ${fmt(gate.progress,1)} de sa géométrie.</p><p class="note">Passage à confirmer.${match?` Nom concordant dans la grille ${match.network} : ${escapeHtml(match.name)}.`:names.length?' Plusieurs noms tarifaires concordants : choisir manuellement le réseau et les gares.':' Aucun nom concordant dans les grilles entrée–sortie embarquées. Tarif non déduit.'}</p><div class="dialog-actions"><button class="ghost" data-toll-map="${gate.id}">Voir le point P${i+1}</button>${match?`<button class="ghost" data-toll-propose="${gate.id}" data-gate-role="entry">Proposer comme entrée ${match.network}</button><button class="ghost" data-toll-propose="${gate.id}" data-gate-role="exit">Proposer comme sortie ${match.network}</button>`:''}</div></article>`;
 }).join('');
}
function locateTollGates(){
 if(busy||!trip||tollInventory?.schemaVersion!==1)return;
 const route=selectedStop?.via||trip.base;
 try{
  const radius=Number($("tollGuideRadius").value);
  const matches=findTollGates(route.geometry.coordinates.map(([lon,lat])=>[lat,lon]),tollInventory.gates,radius);
  tollGuide.total=matches.length;tollGuide.matches=matches.slice(0,80);tollGuide.shown=true;
  $("tollGuideStatus").textContent=matches.length?`${matches.length} repère(s) candidat(s) à moins de ${Math.round(radius*1000)} m du tracé.${matches.length>80?' Les 80 premiers sont affichés ; réduire le rayon pour affiner.':''} Ni le sens de circulation ni le passage effectif ne sont confirmés.`:'Aucune gare recensée trouvée dans ce rayon. Cela ne confirme pas un trajet sans péage.';
  renderTollGuide();drawTollMarkers();syncTollGuide(tollGuide.key);
 }catch(e){tollGuide.matches=[];tollGuide.shown=false;$("tollGateList").replaceChildren();drawTollMarkers();$("tollGuideStatus").textContent=`Repérage indisponible : ${e.message}`}
}
function drawTollMarkers(){
 if(tollGuide.layer&&map){map.removeLayer(tollGuide.layer);tollGuide.layer=null}
 $("tollDots")?.replaceChildren();
 if(!tollGuide.shown)return;
 if(map){
  tollGuide.layer=L.layerGroup().addTo(map);
  tollGuide.matches.forEach((gate,i)=>{
   const marker=L.marker([gate.lat,gate.lon],{icon:L.divIcon({className:'toll-marker',html:`P${i+1}`,iconSize:[36,30],iconAnchor:[18,15]}),title:`Gare candidate ${tollGateLabel(gate)}`,keyboard:true}).addTo(tollGuide.layer);
   marker.getElement().setAttribute('aria-label',`Voir la gare candidate P${i+1} : ${tollGateLabel(gate)}`);
   marker.on('click',()=>focusTollCard(gate.id));
  });
 }else if(tollGuide.projection){
  $("tollDots").innerHTML=tollGuide.matches.map((gate,i)=>{const [x,y]=tollGuide.projection([gate.lat,gate.lon]);return `<g class="svg-toll" role="button" tabindex="0" data-toll-focus="${gate.id}" aria-label="Voir la gare candidate P${i+1} : ${escapeHtml(tollGateLabel(gate))}"><rect x="${x-18}" y="${y-15}" width="36" height="30" rx="4"/><text x="${x}" y="${y+5}" text-anchor="middle">P${i+1}</text></g>`}).join('');
 }
}
function focusTollCard(id){const card=$('toll-card-'+id);if(card){$("tariffCalculator").open=true;$("tollLocator").open=true;card.scrollIntoView({block:'center'});card.focus()}}
function proposeTollGate(id,role){
 if(busy||!trip)return;
 const gate=tollGuide.matches.find(g=>g.id===id),names=gate?gateTariffNames(gate):[];
 if(names.length!==1)return;
 const match=names[0];
 if(role==='exit'){
  const entry=$("tariffEntry").value;
  if($("tariffNetwork").value!==match.network||entry===''||!tariffData.networks[match.network].rows.some(r=>String(r[0])===entry&&r[1]===match.index)){$("tollGuideChoice").textContent=`Choisir d’abord une entrée ${match.network} compatible dans le calculateur. Aucun choix n’a été remplacé.`;return}
  $("tariffExit").value=String(match.index);
 }else{
  $("tariffNetwork").value=match.network;tariffGates(true);$("tariffEntry").value=String(match.index);tariffGates();
 }
 tollGuide.suggested=true;$("tariffGateConfirmed").checked=false;$("tollGuideChoice").textContent=`${role==='exit'?'Sortie':'Entrée'} proposée : ${match.name} (${match.network}). Vérifier les gares réellement empruntées avant l’ajout au budget.`;
 updateBudget();$(role==='exit'?'tariffExit':'tariffEntry').focus();
}

function localDate(){const d=new Date(Date.now()-new Date().getTimezoneOffset()*60000);return d.toISOString().slice(0,10)}
function tariffDateValid(network=tariffNetwork(),d=$("tariffDate").value){
 return tariffData?.schemaVersion===2&&!!network&&/^\d{4}-\d{2}-\d{2}$/.test(d)&&Number.isFinite(Date.parse(d+'T12:00:00Z'))&&new Date(d+'T12:00:00Z').toISOString().slice(0,10)===d&&d>=network.effectiveFrom&&d<=network.consultationUntil&&localDate()<=network.consultationUntil;
}
function tariffNetwork(){return tariffData?.networks[$("tariffNetwork").value]}
function tariffBudgetValid(){return tableTolls.segments.every(s=>tariffDateValid(tariffData?.networks[s.network],s.date))}
function tariffDuplicate(c){return c&&tableTolls.segments.some(s=>s.network===c.network&&(c.kind==='passage'||s.entry===c.entry&&s.exit===c.exit))}
function tariffSegmentLabel(s){const n=tariffData.networks[s.network];return s.kind==='passage'?`${n.label} · un passage payant`:`${s.network} · ${n.gates[s.entry]} → ${n.gates[s.exit]}`}
function tariffDisplayDate(d){return String(d).split('-').reverse().join('/')}
function tariffIndex(){
 const name=$("tariffNetwork").value;
 if(!tableTolls.index.has(name)){
  const index=new Map();for(const row of tariffNetwork()?.rows||[])index.set(`${row[0]}:${row[1]}`,row.slice(2));tableTolls.index.set(name,index);
 }
 return tableTolls.index.get(name);
}
function tariffOptions(select,ids,placeholder){
 select.replaceChildren(new Option(placeholder,''));
 for(const id of ids)select.add(new Option(tariffNetwork().gates[id],String(id)));
}
function tariffGates(resetEntry=false){
 const network=tariffNetwork();
 if(resetEntry){tollGuide.suggested=false;$("tariffGateConfirmed").checked=false;$("tariffPassageConfirmed").checked=false}
 if(resetEntry)tariffOptions($("tariffEntry"),[...new Set((network?.rows||[]).map(r=>r[0]))].sort((a,b)=>a-b),'Choisir une entrée');
 const entry=$("tariffEntry").value;
 tariffOptions($("tariffExit"),entry===''?[]:(network?.rows||[]).filter(r=>String(r[0])===entry).map(r=>r[1]).sort((a,b)=>a-b),'Choisir une sortie');
 updateBudget();
}
function tariffCandidate(){
 const n=tariffNetwork(),entry=$("tariffEntry").value,exit=$("tariffExit").value,vehicleClass=$("tariffClass").value;
 if(!tariffDateValid()||! /^[1-5]$/.test(vehicleClass))return null;
 if(n.kind!=='passage'&&(entry===''||exit===''))return null;
 const amount=n.kind==='passage'?n.amountsCents?.[Number(vehicleClass)-1]:tariffIndex().get(`${entry}:${exit}`)?.[Number(vehicleClass)-1];
 if(!Number.isSafeInteger(amount)||amount<0)return null;
 return {network:$("tariffNetwork").value,kind:n.kind,entry:n.kind==='passage'?null:Number(entry),exit:n.kind==='passage'?null:Number(exit),vehicleClass,amount,date:$("tariffDate").value};
}
function clearTableTolls(message=''){
 tableTolls.segments=[];tableTolls.notice=message;$("tariffPassageConfirmed").checked=false;$("tariffComplete").checked=false;
}
function syncTableTolls(){
 if(!tableTolls.dateInitialized){$("tariffDate").value=localDate();tableTolls.dateInitialized=true}
 const route=selectedStop?.via||trip?.base;
 const key=trip?JSON.stringify([trip.calculatedAt,trip.routing,route.geometry.coordinates,route.distance,selectedStop?.station.id]):'';
 if(key!==tableTolls.key){$("tariffPassageConfirmed").checked=false;if(tableTolls.segments.length)clearTableTolls('Trajet modifié : les tronçons ont été retirés du budget.');tableTolls.key=key}
 syncTollGuide(key);
 if(!tariffBudgetValid()&&tableTolls.segments.length)clearTableTolls('Grille hors période de consultation : budget retiré.');
 $("tariffFields").disabled=busy||!trip||trip.routing.vehicle.type==="walk"||!tariffData;
 $("tariffExit").disabled=$("tariffEntry").value==='';
 const n=tariffNetwork(),passage=n?.kind==='passage';
 $("tariffPairFields").hidden=passage;$("tariffPassageFields").hidden=!passage;
 $("tariffDate").min=n?.effectiveFrom||'';$("tariffDate").max=n?.consultationUntil||'';
 const c=tariffCandidate(),duplicate=tariffDuplicate(c);
 $("tariffResult").textContent=!tariffData?'Grilles indisponibles.':!tariffDateValid()?'Grille non proposée pour cette date. Une mise à jour des tarifs est nécessaire.':c?`${fmt(c.amount/100)} € TTC · classe ${c.vehicleClass} · ${c.network} · ${passage?'un passage payant':'tronçon choisi'}`:passage?(/^[1-5]$/.test($("tariffClass").value)?'Tarif indisponible pour cette classe.':'Choisir une classe tarifaire.'):'Choisir une classe, une entrée et une sortie.';
 $("tariffAdd").disabled=busy||!trip||trip.routing.vehicle.type==="walk"||!c||duplicate||tableTolls.segments.length>=10||(tollGuide.suggested&&!$("tariffGateConfirmed").checked)||(passage&&!$("tariffPassageConfirmed").checked);
 $("tariffAdd").textContent=duplicate?'Déjà ajouté au budget':passage?'Ajouter ce passage au budget':'Ajouter ce tronçon au budget';
 $("tariffSource").textContent=n?`Tarifs au ${tariffDisplayDate(n.effectiveFrom)}, consultés le ${tariffDisplayDate(n.lastReviewed)}. Consultation proposée jusqu’au ${tariffDisplayDate(n.consultationUntil)} ; vérifier la source avant le départ. ${passage?'Un passage ne constitue pas un aller-retour.':'Ce seuil ne garantit pas le maintien des prix.'}`:'';
 $("tariffAttribution").replaceChildren();
 if(passage)$("tariffAttribution").textContent=n.sourceTitle+'. Plein tarif par passage.';
 else{for(const [label,url] of [['Données : Pierlou Ramade','https://www.data.gouv.fr/datasets/tarifs-autoroutes-aprr'],['Licence Ouverte 2.0','https://www.etalab.gouv.fr/licence-ouverte-open-licence/']]){const a=document.createElement('a');a.textContent=label;a.href=url;a.target='_blank';a.rel='noopener noreferrer';$("tariffAttribution").append(a,document.createTextNode(' · '))}$("tariffAttribution").append(document.createTextNode('Noms corrigés d’après les PDF APRR/AREA.'))}
 $("tariffPdf").href=tariffNetwork()?.source||'https://voyage.aprr.fr/tarifs-de-peage';
 $("tariffComplete").disabled=busy||!tableTolls.segments.length;
 $("tariffClear").hidden=!tableTolls.segments.length;$("tariffClear").disabled=busy;
 $("tariffSegments").replaceChildren();
 tableTolls.segments.forEach((s,i)=>{
  const n=tariffData.networks[s.network],li=document.createElement('li'),text=document.createElement('span'),button=document.createElement('button');
  text.textContent=`${tariffSegmentLabel(s)} · classe ${s.vehicleClass} · ${fmt(s.amount/100)} € TTC · trajet ${tariffDisplayDate(s.date)} · tarif au ${tariffDisplayDate(n.effectiveFrom)}. `;
  const source=document.createElement('a');source.textContent='Source officielle';source.href=n.source;source.target='_blank';source.rel='noopener noreferrer';text.append(source);
  button.type='button';button.className='ghost';button.textContent='Retirer';button.disabled=busy;button.setAttribute('aria-label',`Retirer ${tariffSegmentLabel(s)}`);
  button.addEventListener('click',()=>{tableTolls.segments.splice(i,1);$("tariffComplete").checked=false;tableTolls.notice='Tronçon retiré. La couverture du trajet doit être confirmée à nouveau.';updateBudget()});
  li.append(text,button);$("tariffSegments").append(li);
 });
 if(!syncBudgetRecall())$("tariffAdd").disabled=true;
 $("tariffNotice").textContent=tableTolls.notice;
}
function tollEndpoint(){
 try{const u=new URL(C.tollsApi);return !u.username&&!u.password&&!u.search&&!u.hash&&(u.protocol==='https:'||u.protocol==='http:'&&['localhost','127.0.0.1'].includes(u.hostname))?u.href:null}catch{return null}
}
function tollParameters(){
 const height=Number($("tollHeight").value),weightKg=Number($("tollWeight").value),time=new Date($("tollDeparture").value).getTime();
 if(!$("tollVehicleConfirmed").checked||!trip||trip.routing.vehicle.type!=="car"||!Number.isFinite(height)||height<0.5||height>2||!Number.isFinite(weightKg)||weightKg<500||weightKg>3500||!Number.isFinite(time)||Math.abs(time-Date.now())>366*86400000)return null;
 return {vehicle:{type:'car',height,weightKg,axles:2},payment:$("tollPayment").value,departureTime:new Date(time).toISOString()};
}
function resetTollQuote(){
 tollState.sequence++;tollState.abort?.abort();clearTimeout(tollState.timer);clearTimeout(tollState.expiry);
 tollState.quote=null;tollState.loading=false;tollState.error='';
}
function validTollQuote(q,input){
 const amount=v=>typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=10000;
 return q&&q.requestId===input.requestId&&/^[a-f0-9]{64}$/.test(q.routeHash)&&q.provider==='TollGuru'&&q.currency==='EUR'&&Number.isFinite(Date.parse(q.fetchedAt))&&Math.abs(Date.parse(q.fetchedAt)-Date.now())<5*60000&&q.departureTime===input.departureTime&&q.payment===input.payment&&JSON.stringify(q.vehicle)===JSON.stringify(input.vehicle)&&
  ['no_tolls','estimated','partial','unavailable'].includes(q.status)&&
  (q.status==='no_tolls'?q.amountEur===0:q.status==='estimated'?amount(q.amountEur):q.amountEur===null)&&
  (q.status==='partial'?amount(q.knownSubtotalEur):q.knownSubtotalEur===null)&&
  (q.tariffValidAt===null||typeof q.tariffValidAt==='string'&&Number.isFinite(Date.parse(q.tariffValidAt)))&&
  Array.isArray(q.items)&&q.items.length<=500&&q.items.every(x=>x&&typeof x.label==='string'&&x.label.length<=240&&(x.amountEur===null||amount(x.amountEur))&&x.payment===input.payment)&&
  Array.isArray(q.warnings)&&q.warnings.length<=20&&q.warnings.every(x=>typeof x==='string'&&x.length<=500)&&
  (!(q.status==='estimated'||q.status==='no_tolls')||q.warnings.length===0)&&
  (q.status!=='no_tolls'||q.items.length===0)&&
  (q.status!=='estimated'||q.items.length>0&&q.items.every(x=>amount(x.amountEur))&&Math.abs(q.items.reduce((sum,x)=>sum+x.amountEur,0)-q.amountEur)<0.011)&&
  (q.status!=='partial'||Math.abs(q.items.reduce((sum,x)=>sum+(x.amountEur??0),0)-q.knownSubtotalEur)<0.011);
}
function syncTolls(){
 const endpoint=tollEndpoint(),supported=trip?.routing.vehicle.type==='car';
 $("tollParameters").hidden=!endpoint||!supported;
 $("tollParameters").disabled=busy||!endpoint||!supported;
 if(endpoint&&trip&&!$("tollDeparture").value){const d=new Date(Date.now()-new Date().getTimezoneOffset()*60000);$("tollDeparture").value=d.toISOString().slice(0,16)}
 const params=tollParameters(),route=selectedStop?.via||trip?.base;
 const key=trip?JSON.stringify([trip.calculatedAt,trip.routing,route.geometry.coordinates,route.distance,params]):'';
 if(key!==tollState.key){resetTollQuote();tollState.key=key}
 $("tollAvailability").textContent=!endpoint?'Calcul automatique des péages non activé.':!supported?'Tarif de ce véhicule non pris en charge.':'Tarif voiture sans remorque. Le calcul transmet le tracé complet, le gabarit et la date au service tarifaire. Les changements de trajet actualiseront ensuite le devis.';
 $("tollCalculate").disabled=busy||!endpoint||!params||tollState.loading;
 $("tollCalculate").textContent=!endpoint?'Calculer les péages — indisponible':tollState.loading?'Calcul des péages…':tollState.enabled?'Actualiser les péages':'Calculer les péages';
 if(endpoint&&params&&tollState.enabled&&!tableTolls.segments.length&&!busy&&!tollState.quote&&!tollState.error&&!tollState.loading){
  tollState.loading=true;
  const sequence=tollState.sequence;
  tollState.timer=setTimeout(()=>fetchTolls(endpoint,params,route,sequence),500);
  $("tollCalculate").disabled=true;$("tollCalculate").textContent='Calcul des péages…';
 }
}
async function fetchTolls(endpoint,params,route,sequence){
 if(sequence!==tollState.sequence)return;
 const abort=new AbortController();tollState.abort=abort;
 const input={requestId:crypto.randomUUID(),coordinates:route.geometry.coordinates.map(p=>p.slice(0,2)),distance:route.distance,...params};
 const timeout=setTimeout(()=>abort.abort(),25000);
 try{
  const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input),signal:abort.signal,credentials:'omit',referrerPolicy:'no-referrer'});
  if(!response.ok)throw Error(response.status===429?'Quota tarifaire atteint. Réessayer plus tard.':'Service tarifaire indisponible.');
  const q=await response.json();if(sequence!==tollState.sequence)return;
  if(!validTollQuote(q,input))throw Error('Devis non concordant ou incomplet.');
  tollState.quote=q;
  tollState.expiry=setTimeout(()=>{if(sequence===tollState.sequence){tollState.quote=null;tollState.error='Estimation expirée. Actualiser les péages.';updateBudget()}},15*60000);
 }catch(e){if(sequence===tollState.sequence)tollState.error=abort.signal.aborted?'Délai du service tarifaire dépassé.':e instanceof TypeError?'Service tarifaire injoignable. Réessayer plus tard.':e.message}
 finally{clearTimeout(timeout);if(sequence===tollState.sequence){tollState.loading=false;updateBudget()}}
}
function renderTolls(fuelCost){
 if(tableTolls.segments.length){
  const amount=tableTolls.segments.reduce((sum,s)=>sum+s.amount,0)/100,complete=$("tariffComplete").checked;
  $("tollAmount").textContent=`${fmt(amount)} € · ${complete?'tronçons déclarés':'partiel'}`;
  $("budgetTotal").textContent=complete&&fuelCost!==null?`${fmt(fuelCost+amount)} € · estimation déclarée`:'Incomplet';
  $("tollNotice").textContent=complete?'Couverture du trajet déclarée par vous, non vérifiée sur la carte.':'Somme des tronçons ajoutés seulement. Les autres péages éventuels restent inconnus.';
  $("tollDetails").hidden=true;$("tollSource").textContent='';$("tollItems").replaceChildren();return;
 }
 const q=tollState.quote;
 $("tollAmount").textContent=tollState.loading?'Calcul en cours':q?.status==='no_tolls'?'0,00 € · sans péage confirmé':q?.status==='estimated'?`${fmt(q.amountEur)} € · estimation`:q?.status==='partial'?`${fmt(q.knownSubtotalEur)} € connus · partiel`:'Tarif indisponible';
 const complete=q&&['estimated','no_tolls'].includes(q.status);
 $("budgetTotal").textContent=complete&&fuelCost!==null?`${fmt(fuelCost+q.amountEur)} € · estimation`:'Incomplet';
 $("tollNotice").textContent=tollState.error||(q?.warnings.join(' ')||'');
 $("tollDetails").hidden=!q;
 $("tollSource").textContent=q?`${q.provider} · obtenu le ${new Date(q.fetchedAt).toLocaleString('fr-FR')} · départ ${new Date(q.departureTime).toLocaleString('fr-FR')} · ${q.vehicle.height} m · PTAC ${q.vehicle.weightKg} kg · 2 essieux, sans remorque · ${q.payment==='cash'?'espèces':'paiement à la plaque'}. Validité des tarifs ${q.tariffValidAt?new Date(q.tariffValidAt).toLocaleString('fr-FR'):'non fournie'}. Estimation, sans garantie de prix.`:'';
 $("tollItems").replaceChildren();
 for(const item of q?.items||[]){const li=document.createElement('li');li.textContent=`${item.label} : ${item.amountEur===null?'tarif inconnu':fmt(item.amountEur)+' €'}`;$("tollItems").append(li)}
}

// BEGIN MEETINGS MODEL
function meetingNodes(a,b,plan,station=null){
 const nodes=[{kind:'start',point:a}];
 if(plan){
  if(station&&plan.stationPosition==='before')nodes.push({kind:'station',point:[station.lat,station.lon]});
  nodes.push({kind:'pickup',point:[plan.pickup.lat,plan.pickup.lon]});
  if(station&&plan.stationPosition==='during')nodes.push({kind:'station',point:[station.lat,station.lon]});
  nodes.push({kind:'dropoff',point:[plan.dropoff.lat,plan.dropoff.lon]});
  if(station&&plan.stationPosition==='after')nodes.push({kind:'station',point:[station.lat,station.lon]});
 }else if(station)nodes.push({kind:'station',point:[station.lat,station.lon]});
 nodes.push({kind:'end',point:b});return nodes;
}
function meetingLegs(route,nodes){
 if(!route||!Array.isArray(route.legs)||route.legs.length!==nodes.length-1||[route.distance,route.duration,...route.legs.flatMap(l=>[l?.distance,l?.duration])].some(v=>typeof v!=='number'||!Number.isFinite(v)||v<0))throw new Error('Distances ou durées des étapes manquantes. Aucun partage calculé.');
 const sum=(from,to,key)=>route.legs.slice(from,to).reduce((n,l)=>n+l[key],0);
 for(const key of ['distance','duration'])if(Math.abs(sum(0,nodes.length-1,key)-route[key])>2)throw new Error('Étapes incohérentes avec le total du trajet.');
 const pickup=nodes.findIndex(n=>n.kind==='pickup'),dropoff=nodes.findIndex(n=>n.kind==='dropoff'),station=nodes.findIndex(n=>n.kind==='station');
 return {sharedDistance:pickup>=0&&dropoff>pickup?sum(pickup,dropoff,'distance'):null,sharedDuration:pickup>=0&&dropoff>pickup?sum(pickup,dropoff,'duration'):null,accessDistance:station>=0?sum(0,station,'distance'):null,accessSeconds:station>=0?sum(0,station,'duration'):null};
}
function meetingDetour(route,reference,limits){
 const km=(route.distance-reference.distance)/1000,minutes=(route.duration-reference.duration)/60;
 if(!Number.isFinite(km)||!Number.isFinite(minutes)||!limits||!Number.isFinite(limits.km)||!Number.isFinite(limits.minutes)||limits.km<0||limits.km>1000||limits.minutes<0||limits.minutes>1440)throw new Error('Limites de détour invalides.');
 return {km,minutes,allowed:km<=limits.km&&minutes<=limits.minutes};
}
// END MEETINGS MODEL
let meetingProposal=null,meetingInputs={pickup:null,dropoff:null},meetingEndpoints='';
const meetingFields=['meetingPickup','meetingDropoff','meetingMaxKm','meetingMaxMin','meetingStationPosition'];
function routePlanNodes(station=null){return meetingNodes(trip.a,trip.b,trip.meetings,station)}
function meetingPositionText(plan){return {before:'avant la prise en charge',during:'entre la prise en charge et la dépose',after:'après la dépose'}[plan.stationPosition]}
function meetingRouteSummary(route,plan,reference){
 const detail=meetingLegs(route,meetingNodes(trip.a,trip.b,plan,selectedStop?.station)),delta=meetingDetour(route,reference,plan.limits);
 return `${fmt(route.distance/1000,1)} km au total, dont ${fmt(detail.sharedDistance/1000,1)} km partagés. Écart au trajet initial : ${delta.km>=0?'+':''}${fmt(delta.km,1)} km / ${delta.minutes>=0?'+':''}${fmt(delta.minutes,1)} min. Limites : +${plan.limits.km} km / +${plan.limits.minutes} min, arrêt carburant compris. Plein prévu ${meetingPositionText(plan)}. Durées hors embarquement et pauses.`;
}
function clearMeetingDraft(){
 meetingProposal=null;meetingInputs={pickup:null,dropoff:null};meetingEndpoints='';
 $('meetingPickup').value='';$('meetingDropoff').value='';$('meetingStatus').textContent='';$('meetingApply').hidden=true;
}
function updateMeetings(){
 const plan=trip?.meetings;$('meetingSummary').hidden=!plan;
 $('meetingApply').hidden=!meetingProposal;$('meetingApply').disabled=busy||!meetingProposal;
 $('meetingCalculate').disabled=busy||!trip||trip.routing.vehicle.type==='walk';$('meetingDiscard').disabled=busy;
 if(plan){$('meetingOrder').textContent='Départ → '+routePlanNodes(selectedStop?.station).slice(1,-1).map(n=>n.kind==='pickup'?'Prise en charge : '+plan.pickup.label:n.kind==='dropoff'?'Dépose : '+plan.dropoff.label:'Station : '+selectedStop.station.address).join(' → ')+' → Arrivée';$('meetingMetrics').textContent=meetingRouteSummary(selectedStop?.via||trip.base,plan,plan.reference.base)}
 $('meetingPending').hidden=!trip||Boolean(plan)||!($('meetingPickup').value.trim()||$('meetingDropoff').value.trim());
}
function removeMeetings(message='Rencontres retirées. Trajet initial rétabli ; stations à rechercher à nouveau.'){
 if(busy)return;
 if(trip?.meetings){const ref=trip.meetings.reference;Object.assign(trip,ref,{meetings:null});clearComparison();clearNavigation();tollState.enabled=false;resetTollQuote();clearTableTolls();clearStations();renderRouteChoices();}
 meetingProposal=null;$('meetingApply').hidden=true;$('meetingStatus').textContent=message;updateBudget();
}
function meetingEdited(){
 if(busy)return;
 removeMeetings('Paramètres de rencontre modifiés : recalculer puis adopter le nouveau trajet.');
 for(const [key,id] of [['pickup','meetingPickup'],['dropoff','meetingDropoff']])if(meetingInputs[key]?.value!==$(id).value)meetingInputs[key]=null;
 updateMeetings();
}
async function calculateMeetings(){
 if(busy||!trip||trip.routing.vehicle.type==='walk')return;
 meetingProposal=null;const source=trip,controller=new AbortController();activeAbort=controller;lock(true);$('meetingCancel').hidden=false;$('meetingCancel').disabled=false;
 const current=()=>trip===source&&!controller.signal.aborted;
 try{
  const read=(id,max)=>{const e=$(id),n=Number(e.value);if(!e.value.trim()||!e.validity.valid||n<0||n>max)throw new Error('Renseigner les deux limites de détour.');return n};
  const limits={km:read('meetingMaxKm',1000),minutes:read('meetingMaxMin',1440)},places={};
  for(const [key,id] of [['pickup','meetingPickup'],['dropoff','meetingDropoff']]){
   const value=$(id).value.trim();if(!value)throw new Error('Renseigner la prise en charge et la dépose.');
   $('meetingStatus').textContent=key==='pickup'?'Recherche de la prise en charge…':'Recherche de la dépose…';
   places[key]=meetingInputs[key]?.value===$(id).value?meetingInputs[key].place:await geocode(value,key,current);
   if(!current())throw new Error('Calcul annulé.');meetingInputs[key]={value:$(id).value,place:places[key]};
  }
  const plan={...places,limits,stationPosition:$('meetingStationPosition').value},nodes=meetingNodes(trip.a,trip.b,plan);
  if(nodes.some((n,i)=>i&&hav(n.point,nodes[i-1].point)<.02))throw new Error('Deux étapes successives sont confondues. Choisir des lieux distincts.');
  $('meetingStatus').textContent='Calcul du trajet avec les rencontres…';const via=await route(nodes.map(n=>n.point),true,false,trip.routing);if(!current())throw new Error('Calcul annulé.');
  meetingLegs(via,nodes);const reference=trip.meetings?.reference||{base:trip.base,coords:trip.coords,choices:trip.choices,choice:trip.choice,calculatedAt:trip.calculatedAt};
  const delta=meetingDetour(via,reference.base,limits);
  const message=`Prise en charge : ${plan.pickup.label}. Dépose : ${plan.dropoff.label}. `;
  // The proposal excludes any former station; it will be chosen again in the explicit slot.
  const detail=meetingLegs(via,nodes);
  $('meetingStatus').textContent=message+`${fmt(via.distance/1000,1)} km, ${Math.round(via.duration/60)} min ; ${fmt(detail.sharedDistance/1000,1)} km partagés. Écart : ${delta.km>=0?'+':''}${fmt(delta.km,1)} km / ${delta.minutes>=0?'+':''}${fmt(delta.minutes,1)} min. `+(delta.allowed?'Adopter pour remplacer le trajet et retirer l’ancien arrêt carburant.':'Limite de détour dépassée : proposition non adoptable, trajet précédent conservé.');
  if(delta.allowed)meetingProposal={source,via,plan:{...plan,reference},at:new Date().toISOString()};
 }catch(e){$('meetingStatus').textContent=controller.signal.aborted?'Calcul des rencontres annulé. Trajet précédent conservé.':'Rencontres non ajoutées : '+e.message}
 finally{activeAbort=null;$('meetingCancel').hidden=true;lock(false);updateMeetings()}
}
function applyMeetings(){
 const proposal=meetingProposal;if(busy||!proposal||proposal.source!==trip)return;
 if(!confirm('Adopter le trajet avec ces rencontres ? Les stations, l’arrêt et les péages précédents seront retirés. Le plein sera recherché dans l’ordre indiqué.'))return;
 clearComparison();clearNavigation();tollState.enabled=false;resetTollQuote();clearTableTolls();
 trip.meetings=proposal.plan;trip.base={...proposal.via,alternatives:[]};trip.coords=trip.base.geometry.coordinates.map(([lon,lat])=>[lat,lon]);trip.choices=[trip.base];trip.choice=0;trip.calculatedAt=proposal.at;meetingProposal=null;
 clearStations();renderRouteChoices();updateWindow();$('meetingStatus').textContent='Rencontres intégrées au trajet. Rechercher les stations si nécessaire.';updateBudget();$('meetingEdit').focus();
}
function bindMeetings(){
 meetingFields.forEach(id=>$(id).addEventListener('input',meetingEdited));
 $('meetingCalculate').addEventListener('click',calculateMeetings);$('meetingApply').addEventListener('click',applyMeetings);
 $('meetingCancel').addEventListener('click',()=>{activeAbort?.abort();if(placePending){placePending.reject(new Error('Calcul annulé.'));placePending=null;$('placeDialog').close()}});
 $('meetingRemove').addEventListener('click',()=>{removeMeetings();clearMeetingDraft();updateMeetings()});
 $('meetingDiscard').addEventListener('click',()=>{removeMeetings();clearMeetingDraft();updateMeetings()});
 for(const id of ['meetingEdit','meetingReview'])$(id).addEventListener('click',()=>{selectTab('rides');document.querySelector('input[name="rideRole"][value="driver"]').checked=true;updateRides();$('meetingPickup').focus()});
}

// BEGIN CARPOOL MODEL
function rideInteger(v,min,max){if(typeof v!=='number'||!Number.isInteger(v)||v<min||v>max)throw new Error('Nombre de places invalide.');return v}
function rideCents(v){if(v===null)return null;if(typeof v!=='number'||!Number.isFinite(v)||v<0||v>4000000)throw new Error('Montant de frais invalide.');return Math.round((v+Number.EPSILON)*100)}
function sharedTollBreakdown(items,confirmed,covered){
 if(!Array.isArray(items)||items.length>10||typeof confirmed!=='boolean'||typeof covered!=='boolean')throw new Error('Affectation des péages invalide.');
 const sums={before:0,shared:0,after:0,unassigned:0};let unassignedCount=0;
 for(const item of items){
  if(!item||!Number.isSafeInteger(item.amount)||item.amount<0||item.amount>400000000||!Object.hasOwn(sums,item.placement))throw new Error('Tronçon attribué invalide.');
  sums[item.placement]+=item.amount;if(item.placement==='unassigned')unassignedCount++;
 }
 const total=Object.values(sums).reduce((a,b)=>a+b,0),usable=confirmed&&items.length>unassignedCount;
 if(total>400000000)throw new Error('Somme des péages hors limite.');
 return {...sums,total,unassignedCount,confirmed:usable,complete:usable&&covered&&unassignedCount===0};
}
function splitRideCosts(cost,passengers,seats){
 rideInteger(seats,1,8);rideInteger(passengers,0,seats);
 const fuel=rideCents(cost.fuelEuro),tolls=rideCents(cost.tollEuro);
 if(!['unknown','partial','complete'].includes(cost.tollState)||(cost.tollState==='unknown'?tolls!==null:tolls===null))throw new Error('État des péages incohérent.');
 if(cost.shared){
  const sharedFuel=rideCents(cost.shared.fuelEuro);
  if(sharedFuel!==null&&(fuel===null||sharedFuel>fuel))throw new Error('Carburant partagé incohérent avec le trajet total.');
  const allocation=cost.shared.tolls??null;
  if(allocation&&(['before','shared','after','unassigned','total','unassignedCount'].some(k=>!Number.isSafeInteger(allocation[k])||allocation[k]<0)||allocation.total!==tolls||allocation.before+allocation.shared+allocation.after+allocation.unassigned!==tolls||typeof allocation.confirmed!=='boolean'||typeof allocation.complete!=='boolean'||allocation.complete&&(!allocation.confirmed||allocation.unassignedCount!==0||cost.tollState!=='complete')))throw new Error('Répartition des péages incohérente avec le budget.');
  const sharedTolls=allocation?.confirmed?allocation.shared:cost.tollState==='complete'&&tolls===0?0:null;
  const sharedTotal=sharedFuel===null&&sharedTolls===null?null:(sharedFuel??0)+(sharedTolls??0);
  const total=fuel===null&&tolls===null?null:(fuel??0)+(tolls??0),perPassenger=sharedTotal===null?null:Math.floor(sharedTotal/(passengers+1)),passengerTotal=passengers===0?0:perPassenger===null?null:perPassenger*passengers;
  return {fuel,tolls,sharedFuel,sharedTolls,sharedTotal,allocation,known:total!==null,total,complete:fuel!==null&&cost.tollState==='complete',sharedComplete:sharedFuel!==null&&(allocation?.complete===true||cost.tollState==='complete'&&tolls===0),occupants:passengers+1,passengers,seats,perPassenger,passengerTotal,driver:total===null||passengerTotal===null?null:total-passengerTotal};
 }
 const known=fuel!==null||tolls!==null,total=known?(fuel??0)+(tolls??0):null,perPassenger=total===null?null:Math.floor(total/(passengers+1));
 return {fuel,tolls,known,total,complete:fuel!==null&&cost.tollState==='complete',occupants:passengers+1,passengers,seats,perPassenger,passengerTotal:perPassenger===null?null:perPassenger*passengers,driver:total===null?null:total-perPassenger*passengers};
}
function ridePlain(v,max,required=false){if(typeof v!=='string'||v.length>max||/[\u0000-\u001f\u007f-\u009f\u2028-\u202e\u2066-\u2069]/.test(v)||(required&&!v.trim()))throw new Error('Libellé de partage vide, trop long ou contenant un caractère de contrôle.');return v.trim()}
// END CARPOOL MODEL

const sharedTolls={key:'',signature:'',choices:new Map(),confirmed:false,revision:0,renderKey:'',notice:''};
function sharedTollId(s){return JSON.stringify([s.network,s.kind,s.entry,s.exit,s.vehicleClass,s.date,s.amount])}
function sharedTollAvailable(){return !!trip?.meetings&&tableTolls.segments.length>0&&tariffBudgetValid()&&tableTolls.segments.every(s=>s.date===$('stationDeparture').value.slice(0,10))}
function sharedTollItems(){return tableTolls.segments.map(s=>({amount:s.amount,placement:sharedTolls.choices.get(sharedTollId(s))||'unassigned'}))}
function syncSharedTolls(){
 const plan=trip?.meetings,key=plan?JSON.stringify([tableTolls.key,plan.pickup,plan.dropoff,plan.stationPosition,$('stationDeparture').value,$('tariffClass').value,$('tariffDate').value,sharedTollAvailable()]):'';
 if(key!==sharedTolls.key){
  const had=sharedTolls.choices.size>0;sharedTolls.key=key;sharedTolls.choices.clear();sharedTolls.confirmed=false;sharedTolls.revision++;
  sharedTolls.notice=had?'Trajet, rencontres, date ou budget modifiés : affectations retirées.':'';
 }
 const signature=JSON.stringify([tableTolls.segments.map(sharedTollId),$('tariffComplete').checked]);
 if(signature!==sharedTolls.signature){
  const keep=new Set(tableTolls.segments.map(sharedTollId));for(const id of sharedTolls.choices.keys())if(!keep.has(id))sharedTolls.choices.delete(id);
  sharedTolls.confirmed=false;sharedTolls.signature=signature;sharedTolls.revision++;
 }
 $('rideTollAllocation').hidden=!plan;
 const renderKey=JSON.stringify([Boolean(plan),tableTolls.segments.map(sharedTollId)]);
 if(renderKey!==sharedTolls.renderKey){
  sharedTolls.renderKey=renderKey;$('rideTollList').replaceChildren();
  if(plan)tableTolls.segments.forEach((s,i)=>{
   const li=document.createElement('li'),label=document.createElement('label'),select=document.createElement('select'),note=document.createElement('p'),id=sharedTollId(s);
   label.htmlFor=select.id='ride-toll-'+i;label.textContent=tariffSegmentLabel(s)+' · '+fmt(s.amount/100)+' €';select.dataset.sharedToll=id;
   for(const [value,text] of [['unassigned','Non attribué / traverse une rencontre'],['before','Avant la prise en charge · conducteur'],['shared','Avec les passagers · portion commune'],['after','Après la dépose · conducteur']])select.add(new Option(text,value));
   note.className='note';note.textContent=`Classe ${s.vehicleClass} · trajet ${tariffDisplayDate(s.date)}. Choisir seulement si tout ce tronçon appartient à la portion indiquée.`;
   li.append(label,note,select);$('rideTollList').append(li);
  });
 }
 const available=sharedTollAvailable(),items=sharedTollItems(),any=items.some(i=>i.placement!=='unassigned');
 $('rideTollFields').disabled=busy||!available;for(const el of $('rideTollList').querySelectorAll('select'))el.value=sharedTolls.choices.get(el.dataset.sharedToll)||'unassigned';
 $('rideTollConfirm').checked=sharedTolls.confirmed;$('rideTollConfirm').disabled=busy||!available||!any;$('rideTollReset').disabled=busy||!sharedTolls.choices.size;$('rideTollBudget').disabled=busy||!trip;
 const a=sharedTollBreakdown(items,sharedTolls.confirmed,$('tariffComplete').checked);
 $('rideTollStatus').textContent=sharedTolls.notice+(sharedTolls.notice?' ':'')+(!tableTolls.segments.length?'Ajouter des péages connus dans le budget du trajet. Aucun montant n’est déduit des points de la carte.':!available?'Date des péages différente du départ prévu, ou grille expirée : actualiser le budget avant de répartir.':!any?'Choisir la portion de chaque péage connu, puis confirmer la vérification.':!sharedTolls.confirmed?'Choix préparés, pas encore appliqués aux frais partagés. Confirmer après vérification.':`Affectations appliquées : ${fmt(a.shared/100)} € avec les passagers, ${fmt((a.before+a.after)/100)} € hors portion commune, ${fmt(a.unassigned/100)} € non attribués (${a.unassignedCount} tronçon(s)). ${a.complete?'Couverture complète déclarée, non vérifiée sur la carte.':'Répartition partielle : des péages restent inconnus ou non attribués.'}`);
}
function bindSharedTolls(){
 $('rideTollList').addEventListener('change',e=>{
  const id=e.target.dataset.sharedToll;if(busy||!sharedTollAvailable()||!tableTolls.segments.some(s=>sharedTollId(s)===id))return;
  if(!['unassigned','before','shared','after'].includes(e.target.value))return;
  if(e.target.value==='unassigned')sharedTolls.choices.delete(id);else sharedTolls.choices.set(id,e.target.value);
  sharedTolls.confirmed=false;sharedTolls.notice='';sharedTolls.revision++;updateBudget();
 });
 $('rideTollConfirm').addEventListener('change',()=>{sharedTolls.confirmed=!busy&&sharedTollAvailable()&&$('rideTollConfirm').checked;sharedTolls.notice='';sharedTolls.revision++;updateBudget()});
 $('rideTollReset').addEventListener('click',()=>{if(busy)return;sharedTolls.choices.clear();sharedTolls.confirmed=false;sharedTolls.notice='Affectations retirées ; les péages du budget restent conservés.';sharedTolls.revision++;updateBudget()});
 $('rideTollBudget').addEventListener('click',()=>{$('tariffCalculator').open=true;$('tariffNetwork').scrollIntoView({block:'center'});$('tariffNetwork').focus()});
}

let rideFingerprint='',rideRevision=0,rideDraft=null,rideCopying=false,rideEndpoints='';
const rideMoney=c=>fmt(c/100)+' €';
function rideBudgetSnapshot(){
 expireStationBudget();
 if(!trip||trip.routing.vehicle.type==='walk')return null;
 const route=selectedStop?.via||trip.base,cons=Number($('cons').value),price=Number($('budgetPrice').value);
 const fuelEuro=$('cons').validity.valid&&cons>=1&&cons<=100&&$('budgetPrice').value.trim()&&$('budgetPrice').validity.valid&&price>0&&price<=10?route.distance/1000*cons/100*price:null;
 let tollEuro=null,tollStateName='unknown',tollSource='Péages indisponibles';
 if(tableTolls.segments.length){tollEuro=tableTolls.segments.reduce((n,s)=>n+s.amount,0)/100;tollStateName=$('tariffComplete').checked?'complete':'partial';tollSource='Tarifs '+[...new Set(tableTolls.segments.map(s=>s.network))].join(' / ')+' · '+(tollStateName==='complete'?'couverture déclarée par la personne':'tronçons partiels seulement')}
 else if(tollState.quote){const q=tollState.quote;if(['estimated','no_tolls'].includes(q.status)){tollEuro=q.amountEur;tollStateName='complete'}else if(q.status==='partial'){tollEuro=q.knownSubtotalEur;tollStateName='partial'}tollSource=q.provider+' · '+(q.status==='no_tolls'?'absence de péage confirmée par le service':'estimation du service')}
 const planned=departureInstant($('stationDeparture').value);
 if(tableTolls.segments.length&&(!tariffBudgetValid()||tableTolls.segments.some(s=>s.date!==$('stationDeparture').value.slice(0,10)))){tollEuro=null;tollStateName='unknown';tollSource='Date des tronçons différente du départ prévu : actualiser le budget des péages'}
 else if(!tableTolls.segments.length&&tollState.quote&&(!Number.isFinite(planned.instant)||Math.floor(Date.parse(tollState.quote.departureTime)/60000)!==Math.floor(planned.instant/60000))){tollEuro=null;tollStateName='unknown';tollSource='Départ du devis différent du départ prévu : actualiser les péages'}
 const detail=trip.meetings?meetingLegs(route,routePlanNodes(selectedStop?.station)):null;
 return {shared:detail?{km:detail.sharedDistance/1000,fuelEuro:fuelEuro===null?null:detail.sharedDistance/1000*cons/100*price,tolls:sharedTollAvailable()?sharedTollBreakdown(sharedTollItems(),sharedTolls.confirmed,$('tariffComplete').checked):null,tollRevision:sharedTolls.revision}:null,fuelEuro,tollEuro,tollState:tollStateName,tollSource,routeKm:route.distance/1000,durationMinutes:Math.round(route.duration/60),stopMinutes:selectedStop?$('stopMinutes').value:null,durationText:currentDurationText(route.duration),fuel:$('fuel').value,price:fuelEuro===null?null:price,cons:cons,stop:Boolean(selectedStop),calculatedAt:selectedStop?.confirmedAt||trip.calculatedAt};
}
function rideCounts(){
 const number=id=>{const el=$(id);if(!el.value.trim()||!el.validity.valid)throw new Error('Vérifier les places et le nombre de passagers.');return Number(el.value)};
 const role=document.querySelector('input[name="rideRole"]:checked').value;
 if(role==='passenger')return {role,wanted:rideInteger(number('rideWanted'),1,8)};
 const seats=rideInteger(number('rideSeats'),1,8),passengers=rideInteger(number('ridePassengers'),0,seats);return {role,seats,passengers};
}
function invalidateRideDraft(message='Paramètres modifiés : préparer un nouveau récapitulatif.'){
 rideRevision++;if(rideDraft)$('rideMessage').textContent=message;rideDraft=null;$('rideShare').hidden=true;$('rideText').value='';$('rideConsent').checked=false;$('rideCopy').disabled=true;
}
function updateRides(){
 syncSharedTolls();
 const role=document.querySelector('input[name="rideRole"]:checked').value,cost=rideBudgetSnapshot();
 $('rideDriver').hidden=role!=='driver';$('ridePassenger').hidden=role!=='passenger';$('rideDeparture').value=$('stationDeparture').value;
 if(trip){const endpoints=JSON.stringify([trip.a,trip.b]);if(rideEndpoints&&rideEndpoints!==endpoints){for(const id of ['rideFrom','rideTo','rideNeeds'])$(id).value='';$('rideMessage').textContent='Nouveaux lieux de trajet : renseigner à nouveau les secteurs à partager.'}rideEndpoints=endpoints}
 const fields=['rideSeats','ridePassengers','rideWanted','rideFrom','rideTo','rideNeeds'].map(id=>$(id).value);
 const fingerprint=JSON.stringify([trip?.calculatedAt,trip?.choice,selectedStop?.confirmedAt,trip?.routing,trip?.a,trip?.b,role,fields,$('stationDeparture').value,cost]);
 if(fingerprint!==rideFingerprint){invalidateRideDraft();rideFingerprint=fingerprint}
 $('ridePrepare').disabled=busy||!trip||trip.routing.vehicle.type==='walk';$('rideCopy').disabled=busy||rideCopying||!rideDraft||!$('rideConsent').checked;
 $('rideTrip').textContent=trip?`${trip.label} · itinéraire préparé, aucune offre intégrée.`:'Calculer un trajet pour préparer le covoiturage.';
 const departure=departureInstant($('stationDeparture').value),future=!departure.error&&departure.instant>=Date.now()-60000;
 if(rideDraft&&!future)invalidateRideDraft('Départ passé ou invalide : actualiser avant de partager.');
 $('rideDeparture').setAttribute('aria-invalid',String(!future));$('rideDepartureNote').textContent=departure.error||(!future?'Départ passé : choisir une heure à venir.':'Même départ prévu que pour les horaires des stations. Durées sans trafic en direct.');
 $('rideCostLines').replaceChildren();$('rideCostNote').textContent='';
 if(!cost)return;
 try{
  const counts=rideCounts();
  if(counts.role==='passenger'){$('ridePassengerNote').textContent=`Recherche de ${counts.wanted} place(s), sans disponibilité confirmée. Le prix sera celui de l’offre du fournisseur ; le budget du véhicule préparé n’est pas un prix passager.`;return}
  const s=splitRideCosts(cost,counts.passengers,counts.seats),line=(label,value)=>{const div=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=value;div.append(dt,dd);$('rideCostLines').append(div)};
  if(cost.shared){
   line('Carburant du trajet complet',s.fuel===null?'À renseigner':rideMoney(s.fuel));line('Carburant de la portion partagée',s.sharedFuel===null?'À renseigner':rideMoney(s.sharedFuel));
   line('Péages du trajet complet',s.tolls===null?'Inconnus':rideMoney(s.tolls)+(cost.tollState==='partial'?' · partiels':''));
   line('Péages attribués à la portion commune',s.sharedTolls===null?'Non attribués':rideMoney(s.sharedTolls)+(s.allocation?.confirmed?' · déclaration':' · sans péage confirmé'));
   if(s.allocation?.confirmed){line('Péages hors portion commune · conducteur',rideMoney(s.allocation.before+s.allocation.after));line('Péages connus non attribués',rideMoney(s.allocation.unassigned)+(s.allocation.unassignedCount?' · à vérifier':''))}
   line('Par passager · portion partagée',!counts.passengers?'Aucun passager prévu':s.perPassenger===null?'Indisponible':rideMoney(s.perPassenger)+(s.sharedComplete?' · proposition':s.sharedTolls===null?' · carburant seulement':' · frais connus seulement'));
   line('Reste conducteur sur frais connus',s.driver===null?'Indisponible':rideMoney(s.driver));
   $('rideCostNote').textContent=sharedRideNote(cost,s);return;
  }
  line('Carburant consommé',s.fuel===null?'À renseigner':rideMoney(s.fuel));line('Péages',s.tolls===null?'Inconnus':rideMoney(s.tolls)+(s.complete||cost.tollState==='complete'?' · estimation':' · partiels'));
  line(s.complete?'Carburant + péages estimés':'Montant connu · incomplet',s.total===null?'Indisponible':rideMoney(s.total));
  line(s.complete?'Par passager · proposition':'Par passager · sur montant connu',s.perPassenger===null?'Indisponible':!counts.passengers?'Aucun passager prévu':rideMoney(s.perPassenger));
  line('Part du conducteur',s.driver===null?'Indisponible':rideMoney(s.driver)+(s.complete?'':' · partielle'));
  $('rideCostNote').textContent=`Hypothèse : ${counts.passengers} passager(s) + le conducteur, soit ${s.occupants} personne(s), sur tout le trajet de ${fmt(cost.routeKm,1)} km${cost.stop?', arrêt station inclus':''}. ${s.complete?'Montants estimés ; couverture des péages selon le budget.':'Frais incomplets : aucune participation totale calculable.'} Parts égales au centime inférieur ; le conducteur garde le reliquat. ${cost.tollSource}.`;
 }catch(e){$('rideCostNote').textContent=e.message;$('ridePassengerNote').textContent=e.message}
}
function sharedRideNote(cost,s){
 const a=s.allocation,assignment=a?.confirmed?`Affectation déclarée : ${rideMoney(a.shared)} de péages avec les passagers, ${rideMoney(a.before+a.after)} hors portion commune, ${rideMoney(a.unassigned)} non attribués (${a.unassignedCount} tronçon(s)). ${s.sharedComplete?'Proposition carburant + péages, selon la couverture déclarée.':'Répartition partielle : aucune participation totale calculable. Les frais non attribués restent provisoirement dans le reste conducteur.'}`:s.sharedComplete?'Péages nuls sur le trajet selon le budget ; proposition estimée.':'Péages non attribuables à la portion commune : aucune participation totale calculable. Les montants connus restent provisoirement dans le reste conducteur.';
 return `${s.passengers} passager(s) + le conducteur sur ${fmt(cost.shared.km,1)} km partagés, pour ${fmt(cost.routeKm,1)} km au total. Carburant hors portion commune laissé au conducteur. Parts égales au centime inférieur ; reliquat au conducteur. ${assignment} ${cost.tollSource}.`;
}
function prepareRideText(){
 try{
  updateBudget();if(busy||!trip)throw new Error('Calculer un trajet avant de préparer le récapitulatif.');
  if(!trip.meetings&&($('meetingPickup').value.trim()||$('meetingDropoff').value.trim()))throw new Error('Rencontres encore en préparation : les adopter ou les effacer avant de préparer le récapitulatif.');
  if(selectedStop)readStopMinutes();
  const counts=rideCounts(),cost=rideBudgetSnapshot(),from=ridePlain($('rideFrom').value,160,true),to=ridePlain($('rideTo').value,160,true),needs=ridePlain($('rideNeeds').value,300),departure=departureInstant($('stationDeparture').value);
  if(departure.error||departure.instant<Date.now()-60000)throw new Error(departure.error||'Choisir une heure de départ à venir.');
  const lines=['Préparation de covoiturage — à convenir',counts.role==='driver'?'Rôle : conducteur':'Rôle : recherche de place',`Secteurs saisis : ${from} → ${to}`,`Départ envisagé : ${arrivalLabel(departure.instant)} (Europe/Paris).`];
  if(counts.role==='driver'){
   const s=splitRideCosts(cost,counts.passengers,counts.seats);
   if(cost.shared){lines.push(`Places proposées : ${counts.seats}, hors conducteur.`,sharedRideNote(cost,s),`Durée de conduite estimée : ${cost.durationMinutes} min, hors pauses et embarquement.`,`Péages du trajet complet : ${s.tolls===null?'inconnus':rideMoney(s.tolls)}${cost.tollState==='partial'?' · partiels':''}.`,`Carburant du trajet : ${s.fuel===null?'inconnu':rideMoney(s.fuel)} ; carburant partagé : ${s.sharedFuel===null?'inconnu':rideMoney(s.sharedFuel)}.`,!counts.passengers?'Aucun passager prévu dans la simulation.':s.perPassenger===null?'Contribution indisponible.':`Proposition ${s.sharedComplete?'carburant + péages':s.sharedTolls===null?'carburant':'sur frais connus seulement'} par passager : ${rideMoney(s.perPassenger)} ; total passagers : ${rideMoney(s.passengerTotal)}.`,`Reste conducteur sur frais connus : ${s.driver===null?'inconnu':rideMoney(s.driver)}.`,`Référence carburant : ${cost.fuel}, ${fmt(cost.cons,1)} L/100 km ; prix ${cost.price===null?'non renseigné':fmt(cost.price,3)+' €/L'}.`)}else{
   lines.push(`Places proposées : ${counts.seats}, hors conducteur, à confirmer avec le véhicule.`,`Simulation : ${counts.passengers} passager(s) + 1 conducteur, sur l’ensemble de l’itinéraire routier préparé (${fmt(cost.routeKm,1)} km, ${cost.durationMinutes} min de route, hors pauses${cost.stop?', détour station inclus':''}).`,`Carburant consommé estimé : ${s.fuel===null?'inconnu':rideMoney(s.fuel)+' ; '+cost.fuel+', '+fmt(cost.cons,1)+' L/100 km, prix de référence '+fmt(cost.price,3)+' €/L'}.`,`Péages : ${s.tolls===null?'inconnus':rideMoney(s.tolls)}. ${cost.tollSource}.`);
   if(s.total===null)lines.push('Frais indisponibles : aucune contribution calculable.');
   else lines.push(`${s.complete?'Carburant + péages estimés':'Montant connu seulement — incomplet'} : ${rideMoney(s.total)}.`,counts.passengers?`Part ${s.complete?'indicative':'partielle sur montant connu'} par passager : ${rideMoney(s.perPassenger)} ; total passagers : ${rideMoney(s.passengerTotal)}.`:'Aucun passager prévu dans la simulation.',`Part ${s.complete?'indicative':'partielle'} du conducteur : ${rideMoney(s.driver)}. Parts égales au centime inférieur ; reliquat laissé au conducteur.`);
   if(!s.complete)lines.push('Des frais restent inconnus : aucune participation totale calculable.');
   }
   if(cost.stop)lines.push('Temps du trajet préparé : '+cost.durationText+'. Hors autres pauses et embarquement.');
   lines.push('Durées routières sans trafic en direct ; hors pauses et embarquement. La pause carburant déclarée est détaillée séparément. Périmètre : carburant consommé et péages de l’aller simple. Plein acheté, stationnement, ferries et autres coûts exclus. Partage de frais à convenir, pas un tarif d’offre ni un paiement.');
  }else lines.push(`Places recherchées : ${counts.wanted}, disponibilité à confirmer. Prix de l’offre : inconnu. Aucun prix n’est déduit du budget du véhicule préparé.`);
  lines.push(`Besoins ou conditions à convenir : ${needs||'non précisés'}.`,trip.meetings&&counts.role==='driver'?'Rencontres calculées séparément. Leurs adresses ne sont pas recopiées ici ; vérifier manuellement la correspondance des secteurs à partager.':'Secteurs saisis non vérifiés sur la carte ; prise en charge intermédiaire et détour supplémentaire non calculés.','Aucune offre publiée, mise en relation ou réservation effectuée. Contact et réservation restent chez le fournisseur.',`Récapitulatif préparé le ${arrivalLabel(Date.now())} (Europe/Paris).`);
  $('rideText').value=lines.join('\n');rideDraft={text:$('rideText').value,revision:rideRevision};$('rideShare').hidden=false;$('rideConsent').checked=false;$('rideCopy').disabled=true;$('rideMessage').textContent='Relire le récapitulatif avant de le copier. Aucune transmission effectuée.';$('rideText').focus();
 }catch(e){invalidateRideDraft();$('rideMessage').textContent=e.message}
}
function bindRides(){
 bindSharedTolls();
 for(const el of document.querySelectorAll('input[name="rideRole"],#rideSeats,#ridePassengers,#rideWanted,#rideFrom,#rideTo,#rideNeeds'))el.addEventListener('input',updateRides);
 $('rideDeparture').addEventListener('input',()=>{$('stationDeparture').value=$('rideDeparture').value;refreshArrival()});
 $('ridePrepare').addEventListener('click',prepareRideText);
 $('rideConsent').addEventListener('change',()=>{$('rideCopy').disabled=busy||rideCopying||!rideDraft||!$('rideConsent').checked});
 $('rideCopy').addEventListener('click',async()=>{
  updateBudget();if(busy||rideCopying||!rideDraft||!$('rideConsent').checked)return;
  const d=rideDraft;rideCopying=true;$('rideCopy').disabled=true;
  try{if(!navigator.clipboard?.writeText)throw new Error('Presse-papiers indisponible');await navigator.clipboard.writeText(d.text);$('rideMessage').textContent=d.revision===rideRevision?'Récapitulatif copié. Aucun message envoyé.':'Une version précédente a été copiée ; les paramètres ont changé entre-temps. Préparer un nouveau récapitulatif.'}
  catch{if(d.revision===rideRevision){$('rideText').focus();$('rideText').select();$('rideMessage').textContent='Copie automatique indisponible. Le texte est sélectionné : utiliser la commande Copier du navigateur.'}}
  finally{rideCopying=false;$('rideCopy').disabled=busy||!rideDraft||!$('rideConsent').checked}
 });
}

// BEGIN PROSPECTIVE CARBON MODEL
function prospectiveFactors(fuel){
 const family=['E10','SP95','SP98'].includes(fuel)?'essence':fuel==='Gazole'?'diesel':null;
 return family?CARBON_DATA.factors.filter(f=>f.mode==='car'&&f.unit==='kgCO2e/vehicle-km'&&f.scope==='construction-energy'&&f.id.endsWith('-'+family)):[];
}
function prospectiveChoice(raw){return {enabled:raw?.enabled===true,factorId:typeof raw?.factorId==='string'?raw.factorId:'',occupants:raw?.occupants??''}}
function prospectiveCarbon(mode,distance,fuel,choice,group=null){
 const missing=reason=>({status:'unavailable',reason,vehicleKg:null,individualKg:null,groupKg:null,factor:null,dataset:null});
 if(mode!=='car')return missing('Aucun facteur qualifié pour ce mode ou véhicule ; aucune émission nulle supposée.');
 if(!prospectiveFactors(fuel).length)return missing('Aucun facteur qualifié pour ce carburant. Aucun modèle de substitution.');
 if(choice?.enabled!==true)return missing('Estimation non demandée.');
 const factor=prospectiveFactors(fuel).find(f=>f.id===choice.factorId);
 if(!factor)return missing('Choisir un modèle compatible avec le carburant du trajet.');
 const occupants=typeof choice.occupants==='number'?choice.occupants:typeof choice.occupants==='string'&&choice.occupants.trim()?Number(choice.occupants):NaN;
 if(!Number.isInteger(occupants)||occupants<1||occupants>9)return missing('Indiquer de 1 à 9 occupants, conducteur compris.');
 if(group!==null&&(!Number.isInteger(group)||group<1||group>occupants))return missing('Le groupe doit compter de 1 au nombre total d’occupants du véhicule.');
 if(typeof distance!=='number'||!Number.isFinite(distance)||distance<0||distance>40000000)return missing('Distance inconnue ou invalide.');
 const vehicleKg=distance/1000*(factor.construction+factor.energy),individualKg=vehicleKg/occupants;
 return {status:'estimated',reason:'',distanceMeters:distance,occupants,group,vehicleKg,individualKg,groupKg:group===null?null:individualKg*group,factor:structuredClone(factor),dataset:CARBON_DATA.version};
}
function segmentedCarbon(mode,route,nodes,fuel,choice,occupancies){
 const missing=reason=>({status:'unavailable',reason,vehicleKg:null,driverKg:null,othersKg:null,portions:[],factor:null,dataset:null});
 let distances;
 try{
  if(!Array.isArray(nodes)||nodes.filter(n=>n.kind!=='station').map(n=>n.kind).join(',')!=='start,pickup,dropoff,end'||nodes.filter(n=>n.kind==='station').length>1)throw new Error('Ordre des portions inconnu.');
  meetingLegs(route,nodes);
  const pickup=nodes.findIndex(n=>n.kind==='pickup'),dropoff=nodes.findIndex(n=>n.kind==='dropoff');
  const sum=(a,b)=>route.legs.slice(a,b).reduce((n,l)=>n+l.distance,0);
  distances=[sum(0,pickup),sum(pickup,dropoff),sum(dropoff,route.legs.length)];
 }catch(e){return missing(e.message)}
 const distance=distances.reduce((a,b)=>a+b,0),base=prospectiveCarbon(mode,distance,fuel,{...choice,occupants:1});
 if(base.status!=='estimated')return missing(base.reason);
 const keys=['before','shared','after'],counts=keys.map(k=>{const v=occupancies?.[k];return typeof v==='number'?v:typeof v==='string'&&v.trim()?Number(v):NaN});
 if(counts.some(n=>!Number.isInteger(n)||n<1||n>9))return missing('Indiquer de 1 à 9 occupants pour chacune des trois portions, conducteur compris.');
 const factor=base.factor.construction+base.factor.energy;
 const portions=keys.map((kind,i)=>{const vehicleKg=distances[i]/1000*factor,individualKg=vehicleKg/counts[i];return {kind,distanceMeters:distances[i],occupants:counts[i],vehicleKg,individualKg,driverKg:individualKg,othersKg:vehicleKg-individualKg}});
 const vehicleKg=portions.reduce((n,p)=>n+p.vehicleKg,0),driverKg=portions.reduce((n,p)=>n+p.driverKg,0);
 return {status:'estimated',reason:'',distanceMeters:distance,vehicleKg,driverKg,othersKg:vehicleKg-driverKg,portions,factor:base.factor,dataset:base.dataset};
}
// END PROSPECTIVE CARBON MODEL
function prospectiveMarkup(c){
 if(c.status!=='estimated')return `<p class="note">CO₂e non estimé. ${escapeHtml(c.reason)}</p>`;
 return `<p><strong>Véhicule entier : ${carbonAmount(c.vehicleKg)}</strong></p><p>Par occupant : ${carbonAmount(c.individualKg)} · partage égal entre ${c.occupants} occupant(s), conducteur compris.</p>${c.group===null?'':`<p><strong>Part attribuée au groupe : ${carbonAmount(c.groupKg)}</strong> · ${c.group} personne(s) parmi ${c.occupants} occupants. Cette part n’est pas ajoutée au total véhicule.</p>`}${prospectiveMethodMarkup(c)}`;
}
function prospectiveMethodMarkup(c){
 const f=c.factor;return `<details><summary>Facteur, source et méthode</summary><p>${escapeHtml(f.label)} · ${fmt(c.distanceMeters/1000,3)} km × ${fmt(f.construction+f.energy,6)} kg CO₂e/véhicule-km.</p><p>${CARBON_SCOPES[f.scope]} : construction ${fmt(f.construction,6)}, énergie ${fmt(f.energy,6)} kg CO₂e/véhicule-km. Valeurs moyennes, sans ajustement selon la consommation réelle, le chargement ou la météo. Infrastructures et alimentation humaine non modélisées ; aucune empreinte exhaustive.</p><p><a href="${f.source}" target="_blank" rel="noopener noreferrer">Source : ADEME / Impact CO₂</a> · jeu extrait le ${CARBON_DATA.retrievedAt} · version ${escapeHtml(c.dataset)}. Calcul local sur l’appareil, sans transmission des lieux pour cette estimation.</p></details>`;
}
const carbonPortionLabels={before:'Avant la prise en charge',shared:'Avec les passagers',after:'Après la dépose'};
const carbonPortionInputs=['routeCarbonBefore','routeCarbonShared','routeCarbonAfter'];
let segmentCarbonKey='';
function clearSegmentOccupants(){for(const id of carbonPortionInputs)$(id).value=''}
function syncSegmentCarbon(){
 const plan=trip?.meetings,key=plan?JSON.stringify([trip.a,trip.b,trip.routing,plan.pickup,plan.dropoff,plan.stationPosition,$('fuel').value]):'';
 if(key!==segmentCarbonKey){clearSegmentOccupants();segmentCarbonKey=key}
}
function segmentedCarbonMarkup(c){
 if(c.status!=='estimated')return `<p class="note">CO₂e non estimé. ${escapeHtml(c.reason)}</p>`;
 return `<p><strong>Véhicule entier : ${carbonAmount(c.vehicleKg)}</strong></p><p><strong>Part conducteur : ${carbonAmount(c.driverKg)}</strong></p><p>Autres occupants · parts cumulées : ${carbonAmount(c.othersKg)}.</p><p class="note">Le conducteur est supposé présent sur tout le trajet. Les autres occupants sont regroupés par portion ; leur identité n’est pas supposée constante. Les parts répartissent le total véhicule, sans le réduire. Arrondis d’affichage uniquement.</p><ol class="carbon-portions">${c.portions.map(p=>`<li><strong>${carbonPortionLabels[p.kind]}</strong><p>${fmt(p.distanceMeters/1000,3)} km · ${p.occupants} occupant(s), conducteur compris.</p><p>Véhicule : ${carbonAmount(p.vehicleKg)}<br>Par occupant : ${carbonAmount(p.individualKg)}<br>Autres occupants : ${carbonAmount(p.othersKg)}</p></li>`).join('')}</ol>${prospectiveMethodMarkup(c)}`;
}
function fillProspectiveChoices(prefix){
 const select=$(prefix+'Factor'),old=select.value,factors=prospectiveFactors($('fuel').value);
 const signature=factors.map(f=>f.id).join('|');
 if(select.dataset.options!==signature){select.replaceChildren(new Option('Choisir un modèle',''),...factors.map(f=>new Option(f.label,f.id)));select.dataset.options=signature;if(factors.some(f=>f.id===old))select.value=old}
 return factors.length>0;
}
function prospectiveRaw(prefix){return {enabled:$(prefix+'Enabled').checked,factorId:$(prefix+'Factor').value,occupants:$(prefix+'Occupants').value}}
function updateProspectiveControls(prefix,available){
 fillProspectiveChoices(prefix);$(prefix+'Enabled').disabled=busy||!available;$(prefix+'Fields').hidden=!available||!$(prefix+'Enabled').checked;
 for(const suffix of ['Factor','Occupants'])$(prefix+suffix).disabled=busy||!available||!$(prefix+'Enabled').checked;
}
function updateRouteCarbon(){
 syncSegmentCarbon();$('routeCarbon').hidden=!trip;if(!trip)return;
 const mode=trip.routing.vehicle.type,available=mode==='car'&&prospectiveFactors($('fuel').value).length>0,segmented=Boolean(trip.meetings);
 updateProspectiveControls('routeCarbon',available);
 $('routeCarbonUniform').hidden=segmented;$('routeCarbonSegments').hidden=!segmented;
 $('routeCarbonOccupants').disabled=busy||!available||!$('routeCarbonEnabled').checked||segmented;
 for(const id of carbonPortionInputs)$(id).disabled=busy||!available||!$('routeCarbonEnabled').checked||!segmented;
 $('routeCarbonClear').disabled=busy||!available||!carbonPortionInputs.some(id=>$(id).value);
 const r=selectedStop?.via||trip.base,choice=prospectiveRaw('routeCarbon'),c=segmented?segmentedCarbon(mode,r,routePlanNodes(selectedStop?.station),$('fuel').value,choice,{before:$('routeCarbonBefore').value,shared:$('routeCarbonShared').value,after:$('routeCarbonAfter').value}):prospectiveCarbon(mode,r.distance,$('fuel').value,choice);
 $('routeCarbonAvailability').textContent=available?(segmented?'Choisir le modèle et l’occupation de chaque portion. Les places proposées et le nombre de passagers du budget ne remplissent pas ces hypothèses.':'Choisir la taille du véhicule et le nombre total d’occupants. Le carburant sert à proposer des modèles compatibles, sans sélectionner un modèle automatiquement.'):'Aucun modèle compatible disponible pour ce mode ou carburant.';
 $('routeCarbonResult').innerHTML=segmented?segmentedCarbonMarkup(c):prospectiveMarkup(c);$('routeCarbonResult').dataset.carbonState=c.status;
 $('routeCarbonDistance').textContent=`${fmt(r.distance/1000,1)} km${selectedStop?' · détour par la station inclus':' · trajet affiché'}. Hypothèses de préparation, pas un déplacement effectué.${segmented?' Trois portions routières : avant la prise en charge, avec les passagers, après la dépose. Le plein suit sa position choisie.':''}`;
}
function resetProspective(){clearSegmentOccupants();segmentCarbonKey='';for(const prefix of ['routeCarbon','comparisonCarbon']){$(prefix+'Enabled').checked=false;$(prefix+'Factor').value='';$(prefix+'Occupants').value=''}updateRouteCarbon()}
function bindProspective(){
 fillProspectiveChoices('routeCarbon');fillProspectiveChoices('comparisonCarbon');
 $('routeCarbonClear').addEventListener('click',()=>{clearSegmentOccupants();updateRouteCarbon()});
 for(const id of carbonPortionInputs)$(id).addEventListener('input',updateRouteCarbon);
 for(const suffix of ['Enabled','Factor','Occupants'])$('routeCarbon'+suffix).addEventListener('input',()=>{updateRouteCarbon();comparisonChanged()});
 $('comparisonCarbonEnabled').addEventListener('input',()=>updateProspectiveControls('comparisonCarbon',$('routeVehicle').value==='car'&&prospectiveFactors($('fuel').value).length>0));
}

// BEGIN COMPARISON MODEL
function comparisonNumber(value,min,max,optional=false){
 if(optional&&(value===''||value===null))return null;
 const n=typeof value==='number'?value:typeof value==='string'&&value.trim()?Number(value):NaN;
 if(!Number.isFinite(n)||n<min||n>max)throw new Error('Hypothèse numérique invalide.');return n;
}
function comparisonHypotheses(raw){
 const travelers=comparisonNumber(raw.travelers,1,9);if(!Number.isInteger(travelers))throw new Error('Indiquer un groupe de 1 à 9 personnes.');
 const timing=timingHypotheses({departure:raw.departure,arriveBy:raw.arriveBy??null,onlyBefore:raw.onlyBefore??false});
 return {travelers,...timing,carbon:prospectiveChoice(raw.carbon),cons:comparisonNumber(raw.cons,1,100),price:comparisonNumber(raw.price,.001,10,true),...walkCriteria(raw.maxWalkKm,raw.walkStrict??false)};
}
function comparisonCost(mode,distance,h){
 if(!['car','walk','cycle'].includes(mode)||typeof distance!=='number'||!Number.isFinite(distance)||distance<0)throw new Error('Trajet de comparaison invalide.');
 // No complete budget is available: neither missing tolls nor walking costs are zero.
 const liters=mode==='car'?distance/1000*h.cons/100:null;
 const fuel=liters!==null&&h.price!==null?liters*h.price:null;
 return {status:fuel===null?'unknown':'partial',fuel,liters,total:null,carbonKg:null};
}
function orderComparison(entries,criterion){
 if(!['duration','distance'].includes(criterion))throw new Error('Critère de comparaison indisponible.');
 const value=e=>e.status==='ready'&&Number.isFinite(e.route?.[criterion])?Math.round(e.route[criterion]/(criterion==='duration'?60:100)):Infinity;
 return [...entries].sort((a,b)=>value(a)-value(b)||a.mode.localeCompare(b.mode));
}
// END COMPARISON MODEL
const comparisonFields=['comparisonTravelers','comparisonDeparture','comparisonCons','comparisonPrice','comparisonWalkLimit','comparisonArriveBy'];
function comparisonRaw(){return {...Object.fromEntries(['travelers','departure','cons','price','maxWalkKm','arriveBy'].map((k,i)=>[k,$(comparisonFields[i]).value])),onlyBefore:$('comparisonOnlyBefore').checked,walkStrict:walkingRule('comparisonWalkRule'),carbon:prospectiveRaw('comparisonCarbon')}}
function comparisonSignature(includeLimits=true){return JSON.stringify({a:trip?.a,b:trip?.b,fields:['start','end','routeOptimization','routeVehicle','cons','fuel','budgetPrice','maxWalkKm','walkRule','stationDeparture','routeArriveBy',...comparisonFields.filter(id=>includeLimits||id!=='comparisonWalkLimit'),...(includeLimits?['comparisonWalkRule']:[])].map(id=>$(id).value),onlyBefore:$('routeOnlyBefore').checked,cycle:[$('comparisonCycle').checked,...(includeLimits?[$('comparisonCycleLimit').value,$('comparisonCycleRule').value]:[])],carbon:['routeCarbon','comparisonCarbon'].map(p=>prospectiveRaw(p)),avoid:[...document.querySelectorAll('.avoid-options input')].map(el=>[el.value,el.checked])})}
function comparisonCarSettings(){const avoid=[...document.querySelectorAll('.avoid-options input:checked')].map(el=>el.value);return routingSettings($('routeVehicle').value,avoid)}
function clearComparison(message=''){
 if(comparison?.running){comparison.cancelled=true;comparison.controller?.abort()}
 comparison=null;$('comparisonCards').replaceChildren();$('comparisonExcluded').replaceChildren();$('comparisonExcludedWrap').hidden=true;$('comparisonTimingStatus').textContent='';$('comparisonContext').textContent='';$('comparisonSortWrap').hidden=true;
 $('comparisonStatus').textContent=message;
 if(!message){$('comparisonPanel').hidden=true;$('compareBtn').setAttribute('aria-expanded','false')}
}
function comparisonChanged(){if(comparison)clearComparison('Paramètres modifiés : relancer la comparaison. Les anciens résultats ont été retirés.')}
function openComparison(){
 if(busy||!trip)return;
 if(!$('comparisonPanel').hidden){$('comparisonHeading').focus();return}
 clearComparison();$('comparisonPanel').hidden=false;$('compareBtn').setAttribute('aria-expanded','true');
 $('comparisonArriveBy').value=$('routeArriveBy').value;$('comparisonOnlyBefore').checked=$('routeOnlyBefore').checked;
 fillProspectiveChoices('comparisonCarbon');
 for(const suffix of ['Enabled','Factor','Occupants']){const from=$('routeCarbon'+suffix),to=$('comparisonCarbon'+suffix);if(suffix==='Enabled')to.checked=from.checked;else to.value=from.value}
 if(trip.meetings)$('comparisonCarbonOccupants').value='';
 const carbonAvailable=$('routeVehicle').value==='car'&&prospectiveFactors($('fuel').value).length>0;updateProspectiveControls('comparisonCarbon',carbonAvailable);$('comparisonCarbonAvailability').textContent=carbonAvailable?'Le groupe est supposé voyager dans le même véhicule. Les occupants incluent le conducteur et les éventuelles personnes hors groupe. Capacité du véhicule non vérifiée.':'Aucun modèle compatible pour le véhicule ou carburant choisi.';
 $('comparisonDeparture').value=$('stationDeparture').value;$('comparisonCons').value=$('cons').value;$('comparisonPrice').value='';$('comparisonWalkLimit').value=$('maxWalkKm').value;$('comparisonWalkRule').value=$('walkRule').value;
 $('comparisonStatus').textContent='Vérifier les hypothèses, puis calculer les modes demandés, sans rencontres ni arrêt carburant. Le trajet affiché reste en place jusqu’au choix.';
 $('comparisonHeading').focus();
}
function renderComparison(op){
 if(comparison!==op)return;
 const available=op.entries.filter(e=>e.status==='ready').length;
 $('comparisonStatus').textContent=op.running?'Calcul des modes demandés…':op.cancelled?'Comparaison annulée. Aucun nouveau trajet sélectionné.':`${available}/${op.entries.length} trajets disponibles. ${available===op.entries.length?'Comparaison des distances et durées disponible.':'Comparaison partielle.'} Coûts totaux et empreintes incomplets.`;
 $('comparisonSortWrap').hidden=!available;
 const h=op.hypotheses;
 $('comparisonContext').textContent=`${op.source.places.start} → ${op.source.places.end}. Aller simple, sans arrêt. Groupe de ${h.travelers} personne(s), capacité du véhicule non vérifiée. ${h.departure===null?'Départ non renseigné.':`Départ souhaité : ${arrivalLabel(h.departure)} (Paris).`} ${h.arriveBy===null?'Heure limite non renseignée.':`Heure limite : ${arrivalLabel(h.arriveBy)} (Paris).`} ${h.departure!==null&&h.departure<Date.now()-60000?'Départ passé : actualiser pour un trajet à venir.':''} Estimations sans garantie d’arrivée. Calculs hors trafic temps réel et pauses ; la date et le nombre de personnes ne sont pas transmis aux moteurs. Résultats obtenus le ${new Date(op.at).toLocaleString('fr-FR')}, cache de calcul possible.`;
 const cards=[],excluded=[];let compatible=0;
 orderComparison(op.entries,$('comparisonSort').value).forEach(e=>{
  const title=e.mode==='car'?'Véhicule léger':e.mode==='cycle'?'À vélo classique':'À pied';
  if(e.status!=='ready'){cards.push(`<article class="comparison-card" data-compare-mode="${e.mode}"><h3>${title}</h3><p>${escapeHtml(e.status==='pending'?'Calcul en attente…':e.error)}</p></article>`);return}
  if(e.mode==='cycle'){const time=timingEstimate(e.route.duration,h),distanceOk=!op.cycleError&&cycleLimitReview(e.route.distance,op.cycleChoice).admissible,hidden=h.onlyBefore&&!time.admissible||!distanceOk;if(time.admissible&&distanceOk)compatible++;(hidden?excluded:cards).push(cycleComparisonCard(e,op,time));return}
  const emission=prospectiveCarbon(e.mode,e.route.distance,op.fuel,h.carbon,h.travelers),cost=comparisonCost(e.mode,e.route.distance,h),w=e.mode==='walk'?walkReview(e.route.distance,h):null;
  const time=timingEstimate(e.route.duration,h),distanceOk=!w||!op.walkError&&w.admissible,hidden=h.onlyBefore&&!time.admissible||!distanceOk;if(time.admissible&&distanceOk)compatible++;
  const html=`<article class="comparison-card" data-compare-mode="${e.mode}" data-timing-state="${time.state}"><h3>${title}</h3><p class="station-selection">${escapeHtml(timingText(time))}</p><dl class="budget-lines"><div><dt>Distance</dt><dd>${fmt(e.route.distance/1000,1)} km</dd></div><div><dt>Durée estimée</dt><dd>${Math.round(e.route.duration/60)} min</dd></div><div><dt>Carburant du véhicule</dt><dd>${e.mode==='walk'?'Sans objet':cost.fuel===null?'Prix non renseigné':`${fmt(cost.fuel)} € · partiel`}</dd></div><div><dt>Coût total du groupe</dt><dd>${cost.status==='partial'?'Incomplet':'Non estimé'}</dd></div><div><dt>CO₂e du groupe (allocation)</dt><dd>${emission.status==='estimated'?carbonAmount(emission.groupKg):'Non estimée'}</dd></div></dl><div class="prospective-carbon" data-carbon-state="${emission.status}">${prospectiveMarkup(emission)}</div><p class="note">${e.mode==='car'?`${fmt(cost.liters)} L estimés · ${escapeHtml(op.fuel)} · ${h.price===null?'prix absent':`${fmt(h.price,3)} €/L saisi`}. Péages, stationnement et autres frais inconnus. Aucun prix de station ni péage d’un autre tracé repris.`:'Budget de marche non estimé. Pente, escaliers, revêtement et accessibilité non vérifiés.'}</p>${w?`<p class="station-selection">${op.walkError?'Critères invalides : '+escapeHtml(op.walkError):escapeHtml(walkingPreference(e.route.distance,h))}</p>`:''}<p class="note">${escapeHtml(routingLabel(e.settings))}${e.route.resourceVersion?' · données '+escapeHtml(e.route.resourceVersion):''}</p><button type="button" class="ghost navigation-button" data-compare-select="${e.mode}" aria-pressed="${op.selected===e.mode}" ${op.running||(h.onlyBefore&&!time.admissible)||(w&&op.walkError)?'disabled':''}>${op.selected===e.mode?(!distanceOk?'Tracé de référence affiché':'Trajet affiché'):!distanceOk?'Consulter ce tracé à pied (hors limite)':'Afficher ce trajet'}</button></article>`;
 (hidden?excluded:cards).push(html);
 });
 $('comparisonCards').innerHTML=cards.join('');$('comparisonExcluded').innerHTML=excluded.join('');$('comparisonExcludedWrap').hidden=!excluded.length;
 $('comparisonTimingStatus').textContent=h.onlyBefore?`${compatible} trajet(s) compatibles selon l’estimation. ${excluded.length} écarté(s), consultables ci-dessous.${!compatible?' Aucun trajet ne satisfait ce filtre ; aucun mode sélectionné automatiquement.':''}`:(excluded.length?`${excluded.length} trajet(s) écarté(s) par les critères de distance, consultables ci-dessous.`:'Filtre horaire désactivé : tous les résultats restent visibles.');
 updateProspectiveControls('comparisonCarbon',$('routeVehicle').value==='car'&&prospectiveFactors($('fuel').value).length>0);
 $('comparisonCalculate').disabled=op.running;$('comparisonCancel').hidden=!op.running;$('comparisonCancel').disabled=op.cancelled;
}
async function runComparison(){
 if(busy||!trip)return;
 let hypotheses,cycleChoice;try{hypotheses=comparisonHypotheses(comparisonRaw());cycleChoice=$('comparisonCycle').checked?{enabled:true,...readCycleCriteria('comparisonCycle')}:cycleComparisonChoice(false)}catch(e){clearComparison('Vérifier les hypothèses : '+e.message);return}
 const source={a:[...trip.a],b:[...trip.b],places:{...trip.places}},car=comparisonCarSettings();
 const op={source,hypotheses,fuel:$('fuel').value,signature:comparisonSignature(),at:new Date().toISOString(),running:true,cancelled:false,entries:[{mode:'car',settings:car,status:'pending'},{mode:'walk',settings:routingSettings('walk',[]),status:'pending'}],controller:new AbortController()};
 op.cycleChoice=cycleChoice;op.limitContextSignature=comparisonSignature(false);if(cycleChoice.enabled)op.entries.push({mode:'cycle',status:'pending'});
 comparison=op;activeAbort=op.controller;lock(true);renderComparison(op);$('comparisonCancel').disabled=false;
 let ignQuota=false;
 try{
  for(const entry of op.entries){
   if(op.cancelled||comparison!==op)break;
   try{
    if(entry.mode==='cycle'){const view=await loadComparedCycle(source.a,source.b,op,()=>comparison===op&&!op.cancelled&&op.signature===comparisonSignature());if(op.cancelled||comparison!==op)break;if(op.signature!==comparisonSignature()){comparisonChanged();break}entry.cycle=view;entry.route=view.route;entry.status='ready';continue}
    if(entry.mode==='car'&&car.vehicle.type!=='car')throw new Error('Comparaison véhicule léger indisponible pour le profil choisi. Aucun poids lourd ou caravane remplacé par une voiture.');
    if(ignQuota&&entry.settings.provider==='ign')throw new Error('Quota IGN atteint : ce second calcul n’a pas été demandé. Relancer plus tard.');
    ensureRouting(entry.settings);
    const r=await route([source.a,source.b],true,false,entry.settings,()=>comparison===op&&!op.cancelled&&op.signature===comparisonSignature());
    if(op.cancelled||comparison!==op)break;
    if(op.signature!==comparisonSignature()){clearComparison('Paramètres modifiés pendant le calcul : relancer la comparaison.');break}
    entry.route=r;entry.status='ready';
   }catch(e){if(op.cancelled||comparison!==op)break;entry.status='unavailable';entry.error=e.message;if(e.message.includes('Limite du service IGN'))ignQuota=true}
  }
 }finally{
  op.running=false;op.at=new Date().toISOString();if(activeAbort===op.controller)activeAbort=null;lock(false);
  if(comparison===op){if(op.signature!==comparisonSignature())comparisonChanged();else{if(op.cancelled)op.entries=[];renderComparison(op)}}
  $('comparisonCancel').hidden=true;
 }
}
function chooseComparison(mode){
 const op=comparison;if(busy||!op||op.running||op.cancelled||mode==='cycle')return;
 if(op.signature!==comparisonSignature()){comparisonChanged();return}
 const entry=op.entries.find(e=>e.mode===mode&&e.status==='ready');if(!entry||op.selected===mode||(mode==='walk'&&op.walkError)||(op.hypotheses.onlyBefore&&!timingEstimate(entry.route.duration,op.hypotheses).admissible))return;
 if((trip?.meetings||selectedStop||compared.length||tableTolls.segments.length||tollState.quote)&&!confirm('Afficher ce trajet direct retire les rencontres, les stations, l’arrêt et les péages précédents. Continuer ?'))return;
 clearMeetingDraft();
 clearNavigation();tollState.enabled=false;tollState.key='';resetTollQuote();clearTableTolls('Nouveau trajet sélectionné : péages à vérifier.');clearStations();
 $('routeCarbonEnabled').checked=op.hypotheses.carbon.enabled;$('routeCarbonFactor').value=op.hypotheses.carbon.factorId;$('routeCarbonOccupants').value=op.hypotheses.carbon.occupants;
 $('travelMode').value=mode==='walk'?'walk':'car';$('routeOptimization').value=entry.settings.optimization;$('activeVehicle').hidden=true;
 if(mode==='walk')fillWalkingCriteria(op.hypotheses);
 else{$('cons').value=op.hypotheses.cons;$('budgetPrice').value=op.hypotheses.price??'';budgetReference=op.hypotheses.price===null?null:{label:'Prix saisi pour la comparaison',at:new Date(op.at).toLocaleString('fr-FR')}}
 resumePreparation=null;preparedRangePending=false;$('routeArriveBy').value=op.hypotheses.arriveBy===null?'':parisLocal(op.hypotheses.arriveBy);$('routeOnlyBefore').checked=op.hypotheses.onlyBefore;$('stationDeparture').value=op.hypotheses.departure===null?'':parisLocal(op.hypotheses.departure);refreshArrival();updateResumePreparation();
 const base={...structuredClone(entry.route),alternatives:[]};displayTrip(base,structuredClone(entry.settings),op.source.a,op.source.b,{label:op.source.places.start},{label:op.source.places.end});
 trip.calculatedAt=op.at;op.selected=mode;updateVehicleRouting();updateBudget();op.signature=comparisonSignature();op.limitContextSignature=comparisonSignature(false);renderComparison(op);
 setStatus(mode==='walk'&&!walkReview(entry.route.distance,op.hypotheses).admissible?'Tracé à pied consulté comme référence : non admissible pour la limite de distance.':`Trajet ${mode==='walk'?'à pied':'en véhicule léger'} sélectionné dans la comparaison.`, 'ok');$('compareBtn').focus();
}
function bindComparison(){
 for(const id of ['useStationPrice','stationDepartureNow'])$(id).addEventListener('click',comparisonChanged);
 for(const id of ['routeArriveBy','routeOnlyBefore'])$(id).addEventListener('input',updateTripTiming);
 $('compareBtn').addEventListener('click',openComparison);$('comparisonCalculate').addEventListener('click',runComparison);
 $('comparisonClose').addEventListener('click',()=>{if(!busy){clearComparison();$('compareBtn').focus()}});
 $('comparisonCancel').addEventListener('click',()=>{if(comparison?.running){comparison.cancelled=true;comparison.controller.abort();$('comparisonStatus').textContent='Annulation en cours…';$('comparisonCancel').disabled=true}});
 $('comparisonOnlyBefore').addEventListener('change',()=>{if(comparison&&!comparison.running){if($('comparisonOnlyBefore').checked&&comparison.hypotheses.arriveBy===null){$('comparisonOnlyBefore').checked=false;$('comparisonTimingStatus').textContent='Renseigner une heure limite puis relancer la comparaison.';return}comparison.hypotheses.onlyBefore=$('comparisonOnlyBefore').checked;renderComparison(comparison)}});
 $('comparisonCycle').addEventListener('change',()=>{$('comparisonCycleFields').hidden=!$('comparisonCycle').checked;comparisonChanged()});$('comparisonCycleLimit').addEventListener('input',updateComparisonCycleLimits);$('comparisonCycleRule').addEventListener('change',updateComparisonCycleLimits);
 $('comparisonSort').addEventListener('change',()=>{if(comparison&&!comparison.running)renderComparison(comparison)});
 for(const id of ['comparisonCards','comparisonExcluded'])$(id).addEventListener('click',e=>{const c=e.target.closest('[data-compare-cycle]');if(c){const op=comparison,entry=op?.entries.find(x=>x.mode==='cycle'&&x.status==='ready');if(!busy&&entry&&!op.cycleError&&op.signature===comparisonSignature()&&(!op.hypotheses.onlyBefore||timingEstimate(entry.route.duration,op.hypotheses).admissible))openComparedCycle(entry.cycle,op.source.places,op.cycleChoice.maxKm,c,op.cycleChoice.strict);return}const b=e.target.closest('[data-compare-select]');if(b)chooseComparison(b.dataset.compareSelect)});
 $('comparisonWalkLimit').addEventListener('input',updateComparisonWalkLimits);$('comparisonWalkRule').addEventListener('change',updateComparisonWalkLimits);
 for(const id of [...comparisonFields.filter(id=>id!=='comparisonWalkLimit'),'comparisonCarbonEnabled','comparisonCarbonFactor','comparisonCarbonOccupants'])$(id).addEventListener('input',comparisonChanged);
 const fields=['start','end','travelMode','routeOptimization','routeVehicle','maxWalkKm','walkRule','fuel','cons','budgetPrice','stationDeparture','routeArriveBy','routeOnlyBefore','tollDeparture','tariffDate','tariffClass'];
 for(const event of ['input','change'])$('sheet').addEventListener(event,e=>{if(fields.includes(e.target.id)||e.target.matches('.avoid-options input,#truckDimensions input'))comparisonChanged()});
}

// BEGIN ROAD CHOICES MODEL
function roadChoiceHypotheses(raw){return {...timingHypotheses(raw),cons:comparisonNumber(raw.cons,1,100),price:comparisonNumber(raw.price,.001,10,true)}}
function roadChoiceValue(entry,sort){
 if(entry.status!=='ready')return Infinity;
 return sort==='duration'?Math.ceil(entry.route.duration/60):Math.round(entry.route.distance/100);
}
function roadChoiceGroups(entries,sort='duration'){
 if(!['duration','distance'].includes(sort))throw new Error('Tri routier invalide.');
 const ready=entries.filter(e=>e.status==='ready'),ordered=[...entries].sort((a,b)=>roadChoiceValue(a,sort)-roadChoiceValue(b,sort)||a.criterion.localeCompare(b.criterion)),groups=[];
 for(const e of ordered){
  const key=e.status==='ready'?JSON.stringify(e.route.geometry.coordinates):'unavailable:'+e.criterion;
  let group=groups.find(g=>g.key===key);if(!group){group={key,entries:[]};groups.push(group)}
  group.entries.push({...e,tied:e.status==='ready'&&ready.filter(x=>roadChoiceValue(x,sort)===roadChoiceValue(e,sort)).length>1});
 }
 return groups;
}
function roadChoiceDifference(entries,h){
 const a=entries.find(e=>e.criterion==='fastest'&&e.status==='ready'),b=entries.find(e=>e.criterion==='shortest'&&e.status==='ready');if(!a||!b)return null;
 const fuel=e=>h.price===null?null:e.route.distance/1000*h.cons/100*h.price;
 return {km:(Math.round(b.route.distance/100)-Math.round(a.route.distance/100))/10,minutes:Math.ceil(b.route.duration/60)-Math.ceil(a.route.duration/60),fuel:h.price===null?null:(Math.round(fuel(b)*100)-Math.round(fuel(a)*100))/100};
}
function validateRoadChoice(r,points){
 if(!hasRouteGeometry(r)||!hasRouteMetrics(r)||r.duration>31536000||r.distance>20000000)throw new Error('Tracé routier incomplet ou métriques invalides.');
 if([r.geometry.coordinates[0],r.geometry.coordinates.at(-1)].some((p,i)=>hav([p[1],p[0]],points[i])>.5))throw new Error('Les extrémités du tracé ne correspondent pas aux lieux confirmés.');
 return r;
}
// END ROAD CHOICES MODEL

let roadComparison=null;
const roadFields=['roadDeparture','roadArriveBy','roadCons','roadPrice'];
function roadContextSignature(){return JSON.stringify([trip?.a,trip?.b,trip?.routing,trip?.calculatedAt,trip?.choice,trip?.meetings,selectedStop?.station.id,selectedStop?.confirmedAt,compared.length,...['start','end','travelMode','routeOptimization','routeVehicle','fuel','cons','budgetPrice','stationDeparture','routeArriveBy','meetingPickup','meetingDropoff'].map(id=>$(id).value),$('routeOnlyBefore').checked,...document.querySelectorAll('.avoid-options input:checked')].map(x=>x instanceof Element?[x.id,x.value]:x))}
function roadSignature(){return JSON.stringify([roadContextSignature(),...roadFields.map(id=>$(id).value)])}
function clearRoadChoices(message=''){
 if(roadComparison?.running){roadComparison.cancelled=true;roadComparison.controller.abort()}
 roadComparison=null;$('roadCards').replaceChildren();$('roadDifference').textContent='';$('roadStatus').textContent=message;$('roadSortWrap').hidden=true;
}
function roadControls(running){
 for(const id of [...roadFields,'roadOnlyBefore','roadSort','roadCalculate'])$(id).disabled=running;
 $('roadCancel').hidden=!running;$('roadCancel').disabled=false;
}
function openRoadChoices(){
 if(busy||!trip||trip.routing.vehicle.type==='walk')return;
 clearRoadChoices();$('roadDeparture').value=$('stationDeparture').value;$('roadArriveBy').value=$('routeArriveBy').value;$('roadOnlyBefore').checked=$('routeOnlyBefore').checked;$('roadCons').value=$('cons').value;$('roadPrice').value='';$('roadSort').value='duration';roadControls(false);
 $('roadContext').textContent=trip.places.start+' → '+trip.places.end+'. Même véhicule et exclusions : '+routingLabel(trip.routing)+'. Les deux critères seront demandés séparément, sans arrêt carburant ni rencontre.';
 $('roadStatus').textContent='Vérifier les hypothèses puis calculer. Le trajet affiché reste en place.';$('roadCompareDialog').showModal();$('roadTitle').focus();
}
function roadMetrics(entry,op){
 const r=entry.route,h=op.hypotheses,c=comparisonCost('car',r.distance,h),t=timingEstimate(r.duration,h),f=escapeHtml;
 return '<dl><div><dt>Distance</dt><dd>'+fmt(r.distance/1000,1)+' km</dd></div><div><dt>Conduite estimée</dt><dd>'+Math.ceil(r.duration/60)+' min</dd></div><div><dt>Carburant consommé estimé · véhicule entier</dt><dd>'+fmt(c.liters,2)+' L'+(c.fuel===null?' · prix non renseigné':' · '+fmt(c.fuel)+' €')+'</dd></div><div><dt>Péages et autres frais</dt><dd>Inconnus · budget total incomplet</dd></div></dl><p class="note">'+f(timingText(t))+' Hors pauses et trafic en direct.</p>';
}
function renderRoadChoices(){
 const op=roadComparison;if(!op)return;
 const ready=op.entries.filter(e=>e.status==='ready'),filter=op.hypotheses.onlyBefore,groups=roadChoiceGroups(op.entries,$('roadSort').value);
 $('roadStatus').textContent=op.running?'Calcul des choix routiers…':op.cancelled?'Comparaison annulée. Le trajet affiché est conservé.':ready.length+'/2 critères calculés. '+(ready.length===2?'Valeurs à comparer ; aucun meilleur trajet universel.':'Résultat partiel ; aucune variante de remplacement inventée.');
 $('roadSortWrap').hidden=!ready.length;
 $('roadCards').innerHTML=groups.map((g,i)=>{
  const es=g.entries,same=es.length===2,common=same&&es.every(e=>e.route.distance===es[0].route.distance&&e.route.duration===es[0].route.duration);
  return '<article class="road-card" data-road-group="'+i+'"><h3>'+(same?'Même tracé · deux critères':escapeHtml(optimizationLabel(es[0].criterion)))+'</h3>'+(common?roadMetrics(es[0],op):'')+es.map(e=>{
   const label=optimizationLabel(e.criterion),t=e.status==='ready'?timingEstimate(e.route.duration,op.hypotheses):null,excluded=filter&&t&&!t.admissible;
   return '<section class="road-option" data-road-criterion="'+e.criterion+'" data-state="'+(excluded?'excluded':e.status)+'">'+(same?'<h4>'+escapeHtml(label)+'</h4>':'')+'<p class="note">'+escapeHtml(routingLabel(e.settings))+'</p>'+(e.status!=='ready'?'<p>'+escapeHtml(e.status==='pending'?'En attente de calcul.':e.error||'Indisponible.')+'</p>':(!common?roadMetrics(e,op):'')+'<p class="note">Calcul obtenu le '+escapeHtml(new Date(e.at).toLocaleString('fr-FR'))+' ; cache du moteur possible.'+(e.tied?' Ex æquo à la précision affichée pour le tri choisi.':'')+'</p>'+(excluded?'<p class="road-excluded">Écarté par l’heure limite · référence consultable.</p>':'')+'<button type="button" class="ghost" data-road-adopt="'+e.criterion+'" '+(op.running||op.cancelled||excluded?'disabled':'')+'>Choisir · '+escapeHtml(label)+'</button>')+'</section>';
  }).join('')+'</article>';
 }).join('');
 const d=roadChoiceDifference(op.entries,op.hypotheses),signed=(v,n=1)=>(v>0?'+':'')+fmt(v,n);
 $('roadDifference').textContent=d?'Écarts « plus court » moins « plus rapide », à la précision affichée : '+signed(d.km)+' km · '+signed(d.minutes,0)+' min'+(d.fuel===null?' · coût carburant non comparé.':' · '+signed(d.fuel,2)+' € de carburant estimé.')+' Aucun écart de budget total calculable avec les péages et autres frais inconnus.':'';
}
async function calculateRoadChoices(){
 if(busy||!trip||trip.routing.vehicle.type==='walk')return;
 let h;try{if(roadFields.some(id=>!$(id).validity.valid))throw new Error('Vérifier les dates et valeurs saisies.');h=roadChoiceHypotheses({departure:$('roadDeparture').value,arriveBy:$('roadArriveBy').value,onlyBefore:$('roadOnlyBefore').checked,cons:$('roadCons').value,price:$('roadPrice').value})}catch(e){clearRoadChoices('Vérifier les hypothèses : '+e.message);return}
 const source={a:[...trip.a],b:[...trip.b],places:{...trip.places},routing:structuredClone(trip.routing),fuel:$('fuel').value},op={source,hypotheses:h,signature:roadSignature(),running:true,cancelled:false,controller:new AbortController(),entries:['fastest','shortest'].map(criterion=>({criterion,settings:routingSettings(source.routing.vehicle.type,[...source.routing.avoid],source.routing.vehicle.dimensions,criterion),status:'pending'}))};
 roadComparison=op;activeAbort=op.controller;lock(true);roadControls(true);renderRoadChoices();
 const current=()=>roadComparison===op&&!op.cancelled&&!op.controller.signal.aborted&&op.signature===roadSignature();let quota=false;
 try{
  for(const e of op.entries){
   if(!current())break;
   try{ensureRouting(e.settings);if(quota&&e.settings.provider==='ign')throw new Error('Quota IGN atteint : second calcul non demandé. Réessayer plus tard.');
    const r=await route([source.a,source.b],true,false,e.settings,current);if(!current())break;e.route=validateRoadChoice(r,[source.a,source.b]);e.status='ready';e.at=new Date().toISOString();
   }catch(error){if(!current())break;e.status='unavailable';e.error=error.message;if(error.message.includes('Limite du service IGN'))quota=true}
   renderRoadChoices();
  }
 }finally{
  op.running=false;if(activeAbort===op.controller)activeAbort=null;lock(false);roadControls(false);
  if(roadComparison===op){if(op.signature!==roadSignature())clearRoadChoices('Paramètres modifiés : relancer la comparaison.');else if(op.cancelled)clearRoadChoices('Comparaison annulée. Le trajet affiché est conservé.');else renderRoadChoices()}
  if(!$('roadCompareDialog').open&&!$('roadCompareBtn').hidden)$('roadCompareBtn').focus();
 }
}
function adoptRoadChoice(criterion){
 const op=roadComparison;if(busy||!op||op.running||op.cancelled)return;
 if(op.signature!==roadSignature()){clearRoadChoices('Paramètres modifiés : relancer la comparaison.');return}
 const e=op.entries.find(e=>e.criterion===criterion&&e.status==='ready');if(!e||op.hypotheses.onlyBefore&&!timingEstimate(e.route.duration,op.hypotheses).admissible)return;
 if((trip?.meetings||selectedStop||compared.length||tableTolls.segments.length||tollState.quote||$('meetingPickup').value.trim()||$('meetingDropoff').value.trim())&&!confirm('Choisir ce trajet direct retire les rencontres, les stations comparées, l’arrêt et les péages précédents. Continuer ?'))return;
 clearComparison();clearMeetingDraft();clearNavigation();budgetRecall=null;tollState.enabled=false;tollState.key='';resetTollQuote();clearTableTolls('Nouveau choix routier : péages à vérifier.');clearStations();
 $('routeOptimization').value=e.criterion;$('cons').value=op.hypotheses.cons;$('budgetPrice').value=op.hypotheses.price??'';budgetReference=op.hypotheses.price===null?null:{label:'Hypothèse du comparateur routier',at:new Date(e.at).toLocaleString('fr-FR')};
 detachTripVehicle();resumePreparation=null;preparedRangePending=false;
 $('stationDeparture').value=op.hypotheses.departure===null?'':parisLocal(op.hypotheses.departure);$('routeArriveBy').value=op.hypotheses.arriveBy===null?'':parisLocal(op.hypotheses.arriveBy);$('routeOnlyBefore').checked=op.hypotheses.onlyBefore;
 displayTrip({...structuredClone(e.route),alternatives:[]},structuredClone(e.settings),op.source.a,op.source.b,{label:op.source.places.start},{label:op.source.places.end});trip.calculatedAt=e.at;updateVehicleRouting();refreshArrival();updateBudget();
 $('roadCompareDialog').close();clearRoadChoices();$('roadCompareBtn').focus();setStatus('Choix routier adopté : '+optimizationLabel(e.criterion)+'. Rechercher maintenant les arrêts sur ce trajet.','ok');
}
function bindRoadChoices(){
 $('roadCompareBtn').addEventListener('click',openRoadChoices);$('roadCalculate').addEventListener('click',calculateRoadChoices);
 $('roadClose').addEventListener('click',()=>$('roadCompareDialog').close());
 $('roadCompareDialog').addEventListener('close',()=>{clearRoadChoices();if(!$('roadCompareBtn').hidden)$('roadCompareBtn').focus()});
 $('roadCancel').addEventListener('click',()=>{if(roadComparison?.running){roadComparison.cancelled=true;roadComparison.controller.abort();$('roadStatus').textContent='Annulation en cours…';$('roadCancel').disabled=true}});
 for(const id of roadFields)$(id).addEventListener('input',()=>clearRoadChoices('Hypothèses modifiées : relancer la comparaison.'));
 $('roadOnlyBefore').addEventListener('change',()=>{const op=roadComparison;if(!op)return;if(op.running){clearRoadChoices('Hypothèses modifiées : relancer la comparaison.');return}if($('roadOnlyBefore').checked&&op.hypotheses.arriveBy===null){$('roadOnlyBefore').checked=false;$('roadStatus').textContent='Renseigner une heure limite puis relancer la comparaison.';return}op.hypotheses.onlyBefore=$('roadOnlyBefore').checked;renderRoadChoices()});
 $('roadSort').addEventListener('change',()=>{if(roadComparison&&!roadComparison.running)renderRoadChoices()});
 $('roadCards').addEventListener('click',e=>{const b=e.target.closest('[data-road-adopt]');if(b)adoptRoadChoice(b.dataset.roadAdopt)});
 for(const event of ['input','change'])$('sheet').addEventListener(event,()=>{if(roadComparison&&roadComparison.signature!==roadSignature())clearRoadChoices('Contexte du trajet modifié : relancer la comparaison.')});
}

// BEGIN TRANSIT MODEL
function networkId(v){return typeof v==='string'&&/^[A-Za-z0-9_.:-]{1,120}$/.test(v)?v:null}
const TRANSIT_ENDPOINT='https://data.mobilites-m.fr/api/routers/default/plan';
const TRANSIT_MODES={WALK:'Marche',BUS:'Bus',TRAM:'Tram',RAIL:'Train',SUBWAY:'Métro',FUNICULAR:'Funiculaire',CABLE_CAR:'Téléphérique',GONDOLA:'Télécabine'};
function transitNumber(n,min,max){if(typeof n!=='number'||!Number.isFinite(n)||n<min||n>max)throw new Error('Donnée de transport invalide.');return n}
function transitPoint(p){if(!Array.isArray(p)||p.length!==2)throw new Error('Coordonnées de transport invalides.');return [transitNumber(p[0],44.8,45.6),transitNumber(p[1],5.3,6.2)]}
function transitNear(a,b,meters=180){const dx=(a[1]-b[1])*78500,dy=(a[0]-b[0])*111200;return Math.hypot(dx,dy)<=meters}
function transitPilot(p){return Array.isArray(p)&&p.length===2&&Number.isFinite(p[0])&&Number.isFinite(p[1])&&p[0]>=45.10&&p[0]<=45.24&&p[1]>=5.66&&p[1]<=5.81}
function transitTransferCriteria(maxTransfers=null,transferStrict=false){
 if(maxTransfers!==null&&(typeof maxTransfers!=='number'||!Number.isInteger(maxTransfers)||maxTransfers<0||maxTransfers>29))throw new Error('Choisir un nombre entier de correspondances entre 0 et 29, ou laisser vide.');
 if(typeof transferStrict!=='boolean'||(transferStrict&&maxTransfers===null))throw new Error('Une limite impérative exige un nombre de correspondances.');
 return {maxTransfers,transferStrict};
}
function transitTransferReview(route,q){
 if(q.transferError)return {status:'excluded',reason:'Critères de correspondances invalides : '+q.transferError};
 const c=transitTransferCriteria(q.maxTransfers,q.transferStrict),known=Number.isInteger(route.transfers)&&route.transfers>=0&&route.transfers<=29;
 if(c.maxTransfers===null)return {status:'ready',reason:'Aucun plafond de correspondances demandé.'};
 const fits=known&&route.transfers<=c.maxTransfers,limit=c.maxTransfers+' correspondance(s) au maximum';
 return {status:c.transferStrict&&!fits?'excluded':'ready',reason:(c.transferStrict?'Limite impérative':'Préférence')+' : '+limit+'. '+(!known?'Nombre non vérifiable.':fits?'Critère respecté.':'Critère dépassé.')+(c.transferStrict&&!fits?' Option non admissible, consultable comme référence.':'')};
}
function transitNetworkCatalog(routes){
 const entries=new Map();let unknown=0;
 for(const route of routes)for(const leg of route.legs||[]){
  if(leg.mode==='WALK')continue;const id=networkId(leg.agencyId);if(!id){unknown++;continue}
  if(!entries.has(id))entries.set(id,new Set());entries.get(id).add(transitText(leg.agency,'Nom non renseigné'));
 }
 return {entries:[...entries].map(([id,names])=>({id,names:[...names].sort()})).sort((a,b)=>a.id.localeCompare(b.id,'fr')),unknown};
}
function transitNetworkReview(route,q){
 const excluded=q.excludedNetworks??[];
 if(q.networkError||!Array.isArray(excluded)||excluded.length>1500||excluded.some(id=>!networkId(id)))return {status:'excluded',reason:'Exclusions de réseaux non vérifiables. Réinitialiser le filtre.'};
 if(!excluded.length)return {status:'ready',reason:''};
 const legs=route.legs?.filter(l=>l.mode!=='WALK');
 if(!legs?.length)return {status:'excluded',reason:'Réseau non renseigné : exclusions non vérifiables.'};
 const found=[...new Set(legs.map(l=>networkId(l.agencyId)).filter(id=>id&&excluded.includes(id)))];
 const unknown=legs.some(l=>!networkId(l.agencyId));
 if(found.length)return {status:'excluded',reason:'Réseau exclu présent : '+found.join(', ')+'.'+(unknown?' Autres étapes sans réseau vérifiable.':'')};
 if(unknown)return {status:'excluded',reason:'Réseau non renseigné pour une étape : exclusions non vérifiables.'};
 return {status:'ready',reason:'Aucun des réseaux exclus dans les étapes reçues.'};
}
function transitClockReview(q,now){
 const last=Object.hasOwn(q,'reviewNow')?q.reviewNow:q.now,valid=[q.now,last,now].every(n=>typeof n==='number'&&Number.isFinite(n))&&last>=q.now;
 return {reviewNow:valid?Math.max(last,now):last,clockError:Boolean(q.clockError)||!valid||now<last};
}
function transitTimeReview(route,q){
 const now=Object.hasOwn(q,'reviewNow')?q.reviewNow:q.now;
 if(q.clockError||![now,q.now,q.instant].every(n=>typeof n==='number'&&Number.isFinite(n))||now<q.now)return {status:'excluded',temporal:'unverified',reason:'Horloge non vérifiable ou reculée depuis cette recherche. Vérifier la date et relancer volontairement.'};
 if(now>q.instant)return {status:'excluded',temporal:'past-context',reason:'Heure demandée dépassée : référence historique, hors des propositions actuelles.'};
 if(route){
  if(typeof route.start!=='number'||!Number.isFinite(route.start))return {status:'excluded',temporal:'unverified',reason:'Heure de départ non vérifiable.'};
  if(route.start<now)return {status:'excluded',temporal:'past-departure',reason:'Départ théorique passé selon l’horloge de l’appareil : référence historique.'};
 }
 return {status:'ready',temporal:'current',reason:''};
}
function transitRouteReview(route,q){
 const transfer=transitTransferReview(route,q),network=transitNetworkReview(route,q),time=transitTimeReview(route,q);
 return {status:[transfer,network,time].some(r=>r.status==='excluded')?'excluded':'ready',temporal:time.temporal,reason:[time.reason,transfer.reason,network.reason].filter(Boolean).join(' ')};
}
function transitCriteria(raw,now=Date.now()){
 const when=departureInstant(raw.when);if(when.error)throw new Error(when.error);
 if(when.instant<now||when.instant>now+30*864e5)throw new Error('Choisir une heure future, dans les 30 prochains jours. La disponibilité dépend du calendrier du réseau.');
 if(!['depart','arrive'].includes(raw.direction))throw new Error('Choisir un départ ou une arrivée.');
 if(typeof raw.walk!=='string'||!raw.walk.trim())throw new Error('Renseigner la limite totale de marche.');
 return {instant:when.instant,now,walk:transitNumber(Number(raw.walk),100,5000),arrive:raw.direction==='arrive',when:raw.when,...transitTransferCriteria(raw.maxTransfers,raw.transferStrict)};
}
function transitRequest(a,b,raw,now=Date.now()){
 if(!transitPilot(a)||!transitPilot(b))throw new Error('Départ et arrivée doivent se situer dans le secteur pilote autour de Grenoble. La France entière n’est pas encore couverte.');
 const q=transitCriteria(raw,now);
 return {...q,a:[...a],b:[...b],url:TRANSIT_ENDPOINT+'?'+new URLSearchParams({fromPlace:a.join(','),toPlace:b.join(','),date:q.when.slice(0,10),time:q.when.slice(11),mode:'TRANSIT,WALK',arriveBy:String(q.arrive),ignoreRealtimeUpdates:'true',numItineraries:'3',maxWalkDistance:String(q.walk),locale:'fr'})};
}
function transitRoadTiming(mode,route,q){
 if(!['car','walk','cycle'].includes(mode))throw new Error('Mode non pris en charge.');
 const duration=transitNumber(route.duration,1,21600),distance=transitNumber(route.distance,0,150000);
 const start=q.arrive?q.instant-duration*1000:q.instant,end=q.arrive?q.instant:q.instant+duration*1000;
 if(start<q.now)throw new Error('Départ estimé déjà passé pour cette heure d’arrivée.');
 if(mode==='walk'&&distance>q.walk)throw new Error(`Marche directe au-delà de la limite de ${q.walk} m.`);
 return {mode,start,end,duration,elapsed:duration,distance,price:null,carbon:null,status:'ready'};
}
function transitOptionRows(routes,q,sort='elapsed'){
 if(!['elapsed','duration','walk','transfers'].includes(sort))throw new Error('Choisir un tri proposé.');
 const known=(v,max)=>typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=max?v:null;
 const rows=routes.map((r,index)=>{
  const duration=known(r.duration,21600),walk=known(r.walk,5000),transfers=Number.isInteger(r.transfers)?known(r.transfers,29):null;
  const elapsed=Number.isFinite(q.instant)&&Number.isFinite(q.arrive?r.start:r.end)?known((q.arrive?q.instant-r.start:r.end-q.instant)/1000,30*86400):null;
  const metrics={elapsed:elapsed===null?null:Math.ceil(elapsed/60),duration:duration===null?null:Math.ceil(duration/60),walk:walk===null?null:Math.ceil(walk),transfers};
  const review=transitRouteReview(r,q);return {index,...review,metrics,sortValue:metrics[sort],tied:false};
 });
 const ties=new Map();for(const r of rows)if(r.status==='ready'&&r.sortValue!==null)ties.set(r.sortValue,(ties.get(r.sortValue)||0)+1);
 for(const r of rows)r.tied=r.status==='ready'&&r.sortValue!==null&&ties.get(r.sortValue)>1;
 return rows.sort((a,b)=>{
  if((a.status==='ready')!==(b.status==='ready'))return a.status==='ready'?-1:1;
  if(a.status!=='ready')return a.index-b.index;
  if((a.sortValue===null)!==(b.sortValue===null))return a.sortValue===null?1:-1;
  if(a.sortValue===null)return a.index-b.index;
  return a.sortValue-b.sortValue||(a.metrics.duration??Infinity)-(b.metrics.duration??Infinity)||a.index-b.index;
 });
}
function transitTimeRows(routes,roads,q){
 const rows=routes.map((r,i)=>({mode:'transit',label:`Collectif · option ${i+1}`,start:r.start,end:r.end,duration:r.duration,elapsed:q.arrive?(q.instant-r.start)/1000:(r.end-q.instant)/1000,price:null,carbon:null,...transitRouteReview(r,q)}));
 if(!rows.length)rows.push({mode:'transit',label:'Transports collectifs',status:'unavailable',reason:'Aucune option collective disponible pour ces critères.'});
 for(const mode of ['car','walk',...(Object.hasOwn(roads,'cycle')?['cycle']:[])]){
  const item=roads[mode],time=item&&(item.status==='ready'||item.status==='excluded'&&Number.isFinite(item.start))?transitTimeReview(item,q):null;
  rows.push({...item,mode,label:mode==='car'?'Véhicule léger':mode==='cycle'?'Vélo classique':'Marche directe',status:time?.status==='excluded'?'excluded':item?.status||'unavailable',temporal:time?.temporal,reason:time?.status==='excluded'?[time.reason,item?.reason].filter(Boolean).join(' '):item?.reason||'Mode indisponible.'});
 }
 return rows.map((r,i)=>({...r,index:i})).sort((a,b)=>(a.status==='ready')!==(b.status==='ready')?a.status==='ready'?-1:1:a.status==='ready'?Math.ceil(a.elapsed/60)-Math.ceil(b.elapsed/60)||a.index-b.index:a.index-b.index);
}
function transitPolyline(encoded){
 if(typeof encoded!=='string'||encoded.length<2||encoded.length>100000)throw new Error('Tracé indisponible.');
 let i=0,lat=0,lon=0;const points=[];
 const next=()=>{let value=0,shift=0,c;do{if(i>=encoded.length||shift>30)throw new Error('Tracé incomplet.');c=encoded.charCodeAt(i++)-63;if(c<0||c>63)throw new Error('Tracé invalide.');value+=(c&31)*2**shift;shift+=5}while(c>=32);return value%2?-(Math.floor(value/2)+1):value/2};
 while(i<encoded.length){lat+=next();lon+=next();points.push(transitPoint([lat/1e5,lon/1e5]));if(points.length>12000)throw new Error('Tracé trop volumineux.');}
 if(points.length<2)throw new Error('Tracé insuffisant.');return points;
}
function transitText(value,fallback='Non renseigné'){return typeof value==='string'&&value.trim()?value.trim().slice(0,250):fallback}
function transitItinerary(item,q){
 if(!item||!Array.isArray(item.legs)||!item.legs.length||item.legs.length>30)throw new Error('Étapes absentes.');
 const start=transitNumber(item.startTime,q.instant-864e5,q.instant+864e5),end=transitNumber(item.endTime,start,q.instant+864e5);
 if(end<=start||end-start>6*36e5||start<q.now||(q.arrive?end>q.instant:start<q.instant))throw new Error('Horaire hors demande.');
 if(Math.abs(transitNumber(item.duration,1,21600)-(end-start)/1000)>2)throw new Error('Durée incohérente.');
 let previous=start,previousPoint=q.a,walk=0,walking=0,riding=0,waiting=0,boardings=0;
 const legs=item.legs.map((leg,index)=>{
  if(!leg||!Object.hasOwn(TRANSIT_MODES,leg.mode))throw new Error('Mode non qualifié.');
  const onTransit=leg.mode!=='WALK';
  if(leg.transitLeg!==onTransit||leg.realTime!==false||leg.cancelled===true||leg.realtimeState==='CANCELED'||leg.interlineWithPreviousLeg)throw new Error('Horaires théoriques ou correspondance non qualifiés.');
  const s=transitNumber(leg.startTime,previous,end),e=transitNumber(leg.endTime,s,end);
  if(e<=s||Math.abs(transitNumber(leg.duration,0,21600)-(e-s)/1000)>2)throw new Error('Étapes incohérentes.');
  const from=transitPoint([leg.from?.lat,leg.from?.lon]),to=transitPoint([leg.to?.lat,leg.to?.lon]);
  if(!transitNear(from,previousPoint,index?80:180))throw new Error('Rupture entre les étapes.');
  if(index===0&&s!==start)throw new Error('Début incohérent.');
  const distance=transitNumber(leg.distance,0,150000),wait=(s-previous)/1000;
  waiting+=wait;previous=e;previousPoint=to;
  if(onTransit){if(!leg.from.stopId||!leg.to.stopId||!leg.routeId)throw new Error('Ligne ou arrêts manquants.');boardings++;riding+=(e-s)/1000}else{walk+=distance;walking+=(e-s)/1000}
  // Geometry failure removes only the drawing; the validated timetable remains usable.
  let points=null;try{points=transitPolyline(leg.legGeometry?.points);if(!transitNear(points[0],from)||!transitNear(points.at(-1),to))points=null}catch{}
  return {mode:leg.mode,start:s,end:e,from,to,fromName:index===0&&leg.from.name==='Origin'?'Départ':transitText(leg.from.name,'Départ'),toName:index===item.legs.length-1&&leg.to.name==='Destination'?'Arrivée':transitText(leg.to.name,'Arrivée'),line:transitText(leg.routeShortName,transitText(leg.routeLongName,'Ligne non renseignée')),direction:transitText(leg.headsign),agency:transitText(leg.agencyName),...(onTransit&&networkId(leg.agencyId)?{agencyId:networkId(leg.agencyId)}:{}),routeId:networkId(leg.routeId),stopId:networkId(leg.from.stopId),toStopId:networkId(leg.to.stopId),tripId:networkId(leg.tripId),serviceDate:typeof leg.serviceDate==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(leg.serviceDate)?leg.serviceDate:null,distance,wait,points};
 });
 if(previous!==end||!transitNear(previousPoint,q.b)||!boardings||walk>q.walk)throw new Error('Trajet hors des critères du pilote.');
 return {start,end,duration:(end-start)/1000,walk,walking,riding,waiting,transfers:boardings-1,legs,price:null,accessibility:'unknown',realtime:false};
}
function transitResponse(data,q){
 if(data?.error){const id=Number(data.error.id);throw new Error(id===406?'Date hors du calendrier disponible. Choisir une autre date.':id===404||id===409?'Aucun itinéraire collectif trouvé pour cette demande.':'Le calculateur de transports n’a pas pu traiter cette demande.');}
 if(!data?.plan||data.plan.date!==q.instant||!Array.isArray(data.plan.itineraries)||data.plan.itineraries.length>50)throw new Error('Réponse de transport non vérifiable : date ou format inattendu.');
 if(!transitNear(transitPoint([data.plan.from?.lat,data.plan.from?.lon]),q.a)||!transitNear(transitPoint([data.plan.to?.lat,data.plan.to?.lon]),q.b))throw new Error('Réponse associée à d’autres lieux.');
 const seen=new Set(),routes=[];let excluded=0;
 for(const item of data.plan.itineraries){try{const route=transitItinerary(item,q),key=JSON.stringify(route.legs.map(l=>[l.mode,l.line,l.agencyId??null,l.start,l.end,l.from,l.to]));if(seen.has(key)){excluded++;continue}seen.add(key);routes.push(route)}catch{excluded++}}
 routes.sort(q.arrive?(a,b)=>b.start-a.start||a.end-b.end:(a,b)=>a.end-b.end||a.start-b.start);
 return {routes,excluded};
}
// END TRANSIT MODEL

// BEGIN TRANSIT CARBON MODEL
const TRANSIT_CARBON_FACTORS={TRAM:['tramway'],SUBWAY:['metro'],RAIL:['tgv','intercites','ter','rer'],BUS:['busthermique','buselectrique','autocar']};
function transitCarbonFactors(mode){
 const ids=Object.hasOwn(TRANSIT_CARBON_FACTORS,mode)?TRANSIT_CARBON_FACTORS[mode]:[];
 return CARBON_DATA.factors.filter(f=>ids.includes(f.id)&&f.unit==='kgCO2e/person-km'&&f.scope==='construction-energy'&&[f.construction,f.energy].every(n=>typeof n==='number'&&Number.isFinite(n)&&n>=0)).map(f=>({...f}));
}
function estimateTransitCarbon(route,choices){
 if(!Array.isArray(route?.legs)||!route.legs.length||route.legs.length>30||!Array.isArray(choices)||choices.length!==route.legs.length)throw new Error('Étapes ou choix d’empreinte invalides.');
 const rows=Array.from(route.legs,(leg,index)=>{
  const distance=leg?.distance,valid=typeof distance==='number'&&Number.isFinite(distance)&&distance>=0&&distance<=150000;
  const options=transitCarbonFactors(leg?.mode),factor=options.find(f=>f.id===choices[index]),row={index,mode:leg?.mode,distanceMeters:valid?distance:null,status:'unavailable',valueKg:null,constructionKg:null,energyKg:null,factor:null};
  if(!valid)return {...row,reason:'Distance de cette étape non vérifiable.'};
  if(!options.length)return {...row,reason:leg.mode==='WALK'?'Marche non estimée : aucun facteur qualifié dans ce périmètre.':'Aucun modèle qualifié pour ce mode.'};
  if(!factor)return {...row,reason:choices[index]?'Modèle incompatible avec cette étape.':'Choisir un modèle moyen pour cette étape.'};
  const constructionKg=distance/1000*factor.construction,energyKg=distance/1000*factor.energy;
  return {...row,status:'estimated',valueKg:constructionKg+energyKg,constructionKg,energyKg,factor,reason:null};
 });
 const known=rows.filter(r=>r.status==='estimated'),missing=rows.filter(r=>r.status!=='estimated'),sum=k=>known.reduce((n,r)=>n+r[k],0),subtotalKg=known.length?sum('valueKg'):null;
 return {version:'transit-carbon-v1',dataset:CARBON_DATA.version,sourceCommit:CARBON_DATA.sourceCommit,retrievedAt:CARBON_DATA.retrievedAt,publisher:CARBON_DATA.publisher,scope:'construction-energy',persons:1,rows,estimatedSteps:known.length,missingSteps:missing.length,status:!known.length?'unavailable':missing.length?'partial':'complete',subtotalKg,totalKg:missing.length?null:subtotalKg,constructionKg:known.length?sum('constructionKg'):null,energyKg:known.length?sum('energyKg'):null,estimatedMeters:known.reduce((n,r)=>n+r.distanceMeters,0),missingMeters:missing.every(r=>r.distanceMeters!==null)?missing.reduce((n,r)=>n+r.distanceMeters,0):null};
}
// END TRANSIT CARBON MODEL

// BEGIN MODAL CARBON MODEL
function modalCarbonPersons(raw){
 const n=typeof raw==='number'?raw:typeof raw==='string'&&raw.trim()?Number(raw):NaN;
 return Number.isInteger(n)&&n>=1&&n<=9?n:null;
}
function modalCarbonRows(routes,roads,q,raw){
 const persons=modalCarbonPersons(raw.persons);
 const absent=reason=>({status:'unavailable',scope:null,totalKg:null,subtotalKg:null,reason,details:[]});
 const distance=route=>Array.isArray(route?.legs)&&route.legs.length&&route.legs.every(l=>typeof l?.distance==='number'&&Number.isFinite(l.distance)&&l.distance>=0&&l.distance<=150000)?route.legs.reduce((n,l)=>n+l.distance,0):null;
 const rows=transitTimeRows(routes,roads,q).map(row=>{
  const route=row.mode==='transit'?routes[row.index]:null;
  const meters=row.mode==='transit'?distance(route):typeof row.distance==='number'&&Number.isFinite(row.distance)&&row.distance>=0&&row.distance<=150000?row.distance:null;
  let emission=absent('Aucun modèle qualifié pour ce mode ; aucun zéro attribué.');
  if(persons===null){emission=absent('Indiquer de 1 à 9 voyageurs pour comparer le même groupe.');
  }else if(row.mode==='transit'&&route){
   try{
    const c=estimateTransitCarbon(route,raw.transit?.[row.index]??route.legs.map(()=>''));
    emission={...c,reason:c.status==='complete'?'Toutes les étapes sont estimées dans le périmètre du modèle.':c.status==='partial'?'Étapes manquantes : empreinte totale indisponible.':'Choisir les modèles disponibles ; les étapes sans facteur restent inconnues.',details:c.rows};
   }catch{emission=absent('Étapes ou hypothèses incompatibles ; estimation indisponible.')}
  }else if(row.mode==='car'){
   const c=prospectiveCarbon(raw.vehicle==='car'?'car':'unqualified',meters,raw.fuel,{enabled:true,...raw.car},persons);
   if(c.status==='estimated')emission={status:'complete',scope:c.factor.scope,totalKg:c.individualKg,subtotalKg:c.individualKg,vehicleKg:c.vehicleKg,occupants:c.occupants,dataset:c.dataset,reason:'Part individuelle, selon les occupants saisis.',details:[{index:0,status:'estimated',distanceMeters:meters,factor:c.factor,valueKg:c.individualKg}]};
   else emission=absent(c.reason);
  }else if(row.mode==='cycle'){
   const f=CARBON_DATA.factors.find(f=>f.id==='velo'&&f.unit==='kgCO2e/person-km'&&f.scope==='construction'&&Number.isFinite(f.construction)&&f.construction>=0&&f.energy===0);
   if(raw.cycle===true&&f&&meters!==null){const valueKg=meters/1000*f.construction;emission={status:'complete',scope:f.scope,totalKg:valueKg,subtotalKg:valueKg,dataset:CARBON_DATA.version,reason:'Construction seule ; hors du groupe construction et énergie.',details:[{index:0,status:'estimated',distanceMeters:meters,factor:{...f},valueKg}]}}
   else emission=absent('Modèle vélo mécanique non choisi ou distance inconnue.');
  }
  emission={...emission,persons,groupTotalKg:persons!==null&&emission.totalKg!==null?emission.totalKg*persons:null,groupSubtotalKg:persons!==null&&emission.subtotalKg!==null?emission.subtotalKg*persons:null};
  return {...row,key:row.mode==='transit'?'transit-'+row.index:row.mode,distanceMeters:meters,emission,comparable:row.status==='ready'&&emission.status==='complete'&&emission.scope==='construction-energy'&&typeof emission.totalKg==='number'&&Number.isFinite(emission.totalKg)&&emission.totalKg>=0};
 });
 return rows;
}
function modalCarbonOrder(rows,sort){
 if(!['mode','time','distance','carbon'].includes(sort))throw new Error('Choisir un tri proposé.');
 const people=new Set(rows.map(r=>r.emission.persons)),peopleValid=people.size===1&&modalCarbonPersons([...people][0])!==null;
 if(!peopleValid)return {group:rows.filter(r=>r.status==='ready').map(r=>({...r,tied:false})).sort((a,b)=>a.index-b.index),other:rows.filter(r=>r.status!=='ready').map(r=>({...r,tied:false})).sort((a,b)=>a.index-b.index),eligible:0,active:false,canSortCarbon:false,peopleValid:false};
 const candidates=rows.filter(r=>r.comparable&&Number.isFinite(r.emission.groupTotalKg)),groups=new Set(candidates.map(r=>r.emission.persons));
 const compared=groups.size===1&&modalCarbonPersons([...groups][0])!==null?candidates:[],eligible=compared.length;
 // Keep a strictly positive value displayed "< 0.001" distinct from an explicit zero.
 const displayed=n=>Number(n.toLocaleString('en-US',{useGrouping:false,minimumFractionDigits:3,maximumFractionDigits:3}));
 const carbonKey=n=>n>0&&n<.001?.0005:displayed(n);
 const value=r=>sort==='time'?Math.ceil(r.elapsed/60):sort==='distance'&&r.distanceMeters!==null?displayed(r.distanceMeters/1000):sort==='carbon'&&r.comparable?carbonKey(r.emission.groupTotalKg):null;
 const canSortCarbon=eligible>=2,active=sort==='carbon'&&canSortCarbon;
 const group=active?compared:rows.filter(r=>r.status==='ready'),other=active?rows.filter(r=>!r.comparable):rows.filter(r=>r.status!=='ready');
 const counts=new Map();if(sort!=='mode'&&(sort!=='carbon'||active))for(const r of group){const v=value(r);if(v!==null&&Number.isFinite(v))counts.set(v,(counts.get(v)||0)+1)}
 const sorted=group.map(r=>({...r,tied:counts.get(value(r))>1}));
 if(sort!=='mode'&&(sort!=='carbon'||active))sorted.sort((a,b)=>{const x=value(a),y=value(b),valid=n=>n!==null&&Number.isFinite(n);return valid(x)!==valid(y)?valid(x)?-1:1:valid(x)?x-y||Math.ceil(a.elapsed/60)-Math.ceil(b.elapsed/60)||a.index-b.index:a.index-b.index});
 else sorted.sort((a,b)=>a.index-b.index);
 return {group:sorted,other:other.map(r=>({...r,tied:false})).sort((a,b)=>a.index-b.index),eligible,active,canSortCarbon,peopleValid:true};
}
// END MODAL CARBON MODEL


// BEGIN TRANSIT NETWORK MODEL
function networkLine(catalog,leg){
 if(!networkId(leg.routeId)||!Array.isArray(catalog)||catalog.length>3000)throw new Error('Catalogue des lignes non vérifiable.');
 const matches=catalog.filter(x=>x?.gtfsId===leg.routeId);
 if(matches.length!==1||!networkId(matches[0].id))throw new Error('Correspondance de ligne absente ou ambiguë.');
 const line=matches[0];if(catalog.filter(x=>x?.id===line.id).length!==1)throw new Error('Identifiant de ligne ambigu.');
 return {id:line.id,label:transitText(line.shortName),gtfsId:line.gtfsId};
}
function networkDelay(seconds){const n=Math.round(Math.abs(seconds)),m=Math.floor(n/60),s=n%60;return m?`${m} min${s?` ${s} s`:''}`:`${s} s`}
function networkDepartures(data,line,leg,now){
 if(!Array.isArray(data)||data.length>100)throw new Error('Passages non vérifiables.');
 const rows=[],seen=new Map();let rejected=0;
 for(const group of data){
  if(typeof group?.pattern?.id!=='string'||!group.pattern.id.startsWith(line.id+':')||!Array.isArray(group.times)||group.times.length>100){rejected++;continue}
  for(const t of group.times){try{
   if(t.stopId!==leg.stopId||!networkId(t.tripId)||!Number.isInteger(t.serviceDay)||t.serviceDay<946684800||t.serviceDay>4102444800)throw new Error();
   if(t.pickupType!==undefined&&String(t.pickupType)!=='0'){rejected++;continue}
   const day=t.serviceDay*1000,scheduled=(t.serviceDay+transitNumber(t.scheduledDeparture,0,172800))*1000;
   if(parisLocal(day).slice(11)!=='00:00')throw new Error();
   let predicted=null,delay=null;const cancelled=t.realtimeState==='CANCELED';
   if(typeof t.realtime!=='boolean'||!['UPDATED','SCHEDULED','CANCELED'].includes(t.realtimeState)||(t.realtime===false&&t.realtimeState!=='SCHEDULED'))throw new Error();
   if(t.realtime===true&&!cancelled){predicted=(t.serviceDay+transitNumber(t.realtimeDeparture,0,172800))*1000;delay=transitNumber(t.departureDelay,-21600,21600);if(Math.abs((predicted-scheduled)/1000-delay)>1)throw new Error()}
   if((predicted??scheduled)<now-60000||(predicted??scheduled)>now+3*36e5)continue;
   const exact=t.tripId===leg.tripId&&parisLocal(day).slice(0,10)===leg.serviceDate&&Math.abs(scheduled-leg.start)<=1000;
   const row={trip:t.tripId,stop:t.stopId,scheduled,predicted,delay,cancelled,exact,direction:transitText(group.pattern.desc),freshness:'undated'};
   const key=JSON.stringify([t.tripId,t.stopId,t.serviceDay]);if(seen.has(key)){if(JSON.stringify(seen.get(key))!==JSON.stringify(row)){seen.set(key,null);rejected++}}else seen.set(key,row);
  }catch{rejected++}}
 }
 for(const row of seen.values())if(row)rows.push(row);rows.sort((a,b)=>(a.predicted??a.scheduled)-(b.predicted??b.scheduled));return {rows:rows.slice(0,6),rejected,extra:Math.max(0,rows.length-6)};
}
function networkTranslation(v,fallback='Annonce sans titre',limit=250){const a=v?.translation;if(!Array.isArray(a))return fallback;const chosen=a.find(x=>x.language==='fr')||a.find(x=>!x.language)||a[0];return typeof chosen?.text==='string'&&chosen.text.trim()?chosen.text.trim().slice(0,limit)+(chosen.text.trim().length>limit?'… [texte abrégé]':''):fallback}
function networkLink(v){try{const u=new URL(v);return u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&['www.mobilites-m.fr','data.mobilites-m.fr'].includes(u.hostname)?u.href:null}catch{return null}}
function networkAlerts(data,route,now){
 const h=data?.header;if(h?.gtfsRealtimeVersion!=='2.0'||h.incrementality!==0||!Number.isInteger(h.timestamp)||!Array.isArray(data.entity)||data.entity.length>500)throw new Error('Flux de perturbations non vérifiable.');
 const generated=h.timestamp*1000;if(generated>now+60000||generated<now-600000)throw new Error('Flux de perturbations ancien ou date incohérente.');
 const items=[],counts=new Map();for(const e of data.entity)counts.set(e?.id,(counts.get(e?.id)||0)+1);let rejected=0,outside=0;
 for(const entity of data.entity){try{
  const a=entity.alert;if(!networkId(entity.id)||counts.get(entity.id)!==1||entity.isDeleted||!a||!Array.isArray(a.informedEntity)||!a.informedEntity.length||a.informedEntity.length>100)throw new Error();
  if(a.communicationPeriod?.length||a.impactPeriod?.length)throw new Error('Périodes étendues non qualifiées.');
  const periods=a.activePeriod??[];if(!Array.isArray(periods)||periods.length>100)throw new Error();
  const ranges=periods.map(p=>{const start=p.start===undefined?-Infinity:transitNumber(p.start,946684800,4102444800)*1000,end=p.end===undefined?Infinity:transitNumber(p.end,946684800,4102444800)*1000;if(end<=start)throw new Error();return {start,end}});
  const overlaps=!ranges.length||ranges.some(p=>p.start<=route.end&&p.end>route.start);
  if(!overlaps){outside++;continue}
  const selectors=a.informedEntity.map(x=>{if(!x||typeof x!=='object'||!Object.keys(x).length)throw new Error();return x});
  // Only exact native route/stop selectors are matched; commercial aliases remain unassigned.
  const matched=selectors.some(x=>{const keys=Object.keys(x);if(keys.some(k=>!['routeId','stopId'].includes(k))||keys.some(k=>!networkId(x[k])))return false;return route.legs.some(l=>l.mode!=='WALK'&&(!x.routeId||x.routeId===l.routeId)&&(!x.stopId||x.stopId===l.stopId||x.stopId===l.toStopId))});
  items.push({id:entity.id,title:networkTranslation(a.headerText),text:networkTranslation(a.descriptionText,'Description non fournie.',6000),matched,link:networkLink(networkTranslation(a.url,''))});
 }catch{rejected++}}
 return {generated,items,rejected,outside};
}
// END TRANSIT NETWORK MODEL

// BEGIN SAVED TRANSIT MODEL
function validateSavedTransitEntry(e,version=2){
 if(!e?.places||!e.criteria||!e.snapshot||e.snapshot.source!=='mobilites-m'||e.snapshot.route?.realtime!==false)throw new Error('Préparation collective incomplète ou source inconnue.');
 const id=preparedText(e.id,80,true),name=preparedText(e.name,80,true),savedAt=preparedDate(e.savedAt),calculatedAt=preparedDate(e.snapshot.calculatedAt);
 if(!/^[A-Za-z0-9-]+$/.test(id)||calculatedAt>savedAt)throw new Error('Identité ou dates de sauvegarde incohérentes.');
 const places={start:preparedPoint(e.places.start),end:preparedPoint(e.places.end)},criteria={when:preparedText(e.criteria.when,16,true),direction:preparedEnum(e.criteria.direction,['depart','arrive']),walk:preparedNumber(e.criteria.walk,100,5000)};
 if(version===1){if(Object.hasOwn(e.criteria,'maxTransfers')||Object.hasOwn(e.criteria,'transferStrict'))throw new Error('Critères de correspondances ambigus dans un ancien format.');Object.assign(criteria,transitTransferCriteria())}
 else {if(version!==2||!Object.hasOwn(e.criteria,'maxTransfers')||!Object.hasOwn(e.criteria,'transferStrict'))throw new Error('Critères de correspondances manquants.');Object.assign(criteria,transitTransferCriteria(e.criteria.maxTransfers,e.criteria.transferStrict))}
 const q=transitRequest([places.start.lat,places.start.lon],[places.end.lat,places.end.lon],{...criteria,walk:String(criteria.walk)},Date.parse(calculatedAt)),r=e.snapshot.route;
 if(!Array.isArray(r.legs)||r.legs.length<1||r.legs.length>30)throw new Error('Étapes collectives invalides.');
 const raw={startTime:r.start,endTime:r.end,duration:r.duration,legs:r.legs.map(l=>{
  if(!l||l.realTime===true||l.cancelled===true||l.realtimeState==='CANCELED')throw new Error('Seuls les horaires théoriques peuvent être conservés.');
  const from=transitPoint(l.from),to=transitPoint(l.to);
  return {mode:l.mode,startTime:l.start,endTime:l.end,duration:(l.end-l.start)/1000,distance:l.distance,transitLeg:l.mode!=='WALK',realTime:false,from:{lat:from[0],lon:from[1],name:preparedText(l.fromName,250,true),stopId:l.stopId},to:{lat:to[0],lon:to[1],name:preparedText(l.toName,250,true),stopId:l.toStopId},routeShortName:l.line,headsign:l.direction,agencyName:l.agency,routeId:l.routeId,tripId:l.tripId,serviceDate:l.serviceDate};
 })};
 const route=transitItinerary(raw,q);let count=0;
 route.legs.forEach((l,i)=>{const points=r.legs[i].points;if(points===null)return;if(!Array.isArray(points)||points.length<2||points.length>12000)throw new Error('Tracé collectif invalide.');count+=points.length;if(count>25000)throw new Error('Limite de 25 000 points atteinte.');l.points=points.map(transitPoint);if(!transitNear(l.points[0],l.from)||!transitNear(l.points.at(-1),l.to))throw new Error('Tracé incohérent avec les arrêts.');});
 return {id,name,savedAt,places,criteria,snapshot:{source:'mobilites-m',calculatedAt,route}};
}
function validateSavedTransit(data){
 if(data?.kind!=='dragonroute-transit-preparations'||![1,2].includes(data.version)||!Array.isArray(data.entries)||data.entries.length>20)throw new Error('Format collectif inconnu ou limite de 20 préparations dépassée.');
 const clean={kind:'dragonroute-transit-preparations',version:2,entries:data.entries.map(e=>validateSavedTransitEntry(e,data.version))};
 if(new Set(clean.entries.map(e=>e.id)).size!==clean.entries.length)throw new Error('Identifiants collectifs dupliqués.');
 if(new TextEncoder().encode(JSON.stringify(clean,null,2)).length>2000000)throw new Error('La sauvegarde collective dépasse 2 Mo.');return clean;
}
function savedTransitDuplicates(entry,entries){
 const name=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().replace(/\s+/g,' ').toLocaleLowerCase('fr-FR'),key=e=>JSON.stringify([e.places.start.lat,e.places.start.lon,e.places.end.lat,e.places.end.lon,e.criteria]);
 return entries.filter(e=>e.id!==entry.id&&(name(e.name)===name(entry.name)||key(e)===key(entry)));
}
function parseSavedTransitText(text,version){
 if(typeof text!=='string'||new TextEncoder().encode(text).length>2000000)throw new Error('Sauvegarde collective supérieure à 2 Mo ou illisible.');
 const data=JSON.parse(text);if(version!==undefined&&data?.version!==version)throw new Error('Format incohérent avec la copie enregistrée.');return validateSavedTransit(data);
}
// END SAVED TRANSIT MODEL
let transitContext=null,transitJob=null,transitRoutes=[],transitMap=null,transitLayers=null,transitNextRequest=0,transitResult=null,transitResultSignature=null,transitTimeKey=null;
const transitClock=ms=>new Intl.DateTimeFormat('fr-FR',{timeZone:'Europe/Paris',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}).format(ms);
const transitMinutes=s=>`${Math.ceil(s/60)} min`;
function transitInputSignature(){return JSON.stringify(['start','end'].map(id=>$(id).value.trim()))}
function transitStoredPlace(value,field){
 const saved=[preparationInputs[field],favoriteInputs[field],rememberedInputs[field]].find(x=>x?.value===value&&x.place);
 return saved?structuredClone(saved.place):null;
}
function clearTransit(message=''){
 transitTimeKey=null;$('transitTimeNotice').hidden=true;$('transitTimeNotice').textContent='';
 clearModalCarbon();transitComparedCycle=null;transitComparisonData=null;transitResult=null;transitResultSignature=null;
 clearTransitNetwork();clearTransitCarbon();transitCalculation=null;
 const job=transitJob;
 if(job){job.cancelled=true;job.controller.abort();if(job.resolving&&activeAbort===job.controller&&placePending){placePending.reject(new Error('Recherche de transports annulée.'));placePending=null;$('placeDialog').close()}}
 $('transitNetworkFilters').hidden=true;$('transitNetworkChoices').replaceChildren();$('transitNetworkFilterStatus').textContent='';transitRoutes=[];$('transitOptions').hidden=true;$('transitOptionsTable').replaceChildren();$('transitOptionsExcludedTable').replaceChildren();$('transitOptionsExcluded').open=false;$('transitOptionsStatus').textContent='';$('transitResults').replaceChildren();$('transitCompareResults').replaceChildren();$('transitStatus').textContent=message;$('transitCancel').hidden=true;$('transitSearch').disabled=Boolean(job);
 $('transitMapWrap').hidden=true;if(transitLayers){transitLayers.remove();transitLayers=null}$('transitSketch').replaceChildren();
}
function updateTransitContext(){
 $('transitBtn').hidden=false;
 if(transitContext&&transitContext.signature!==transitInputSignature()){clearTransit();transitContext=null;if($('transitDialog').open)$('transitDialog').close()}
}
function showTransitPlaces(){
 const c=transitContext;if(!c)return;
 $('transitPlaces').textContent=c.places?`${c.places.start} → ${c.places.end}. Parcours direct, sans arrêt intermédiaire.`:`Départ à vérifier : ${c.inputs[0]||'à renseigner'}. Arrivée à vérifier : ${c.inputs[1]||'à renseigner'}.`;
}
function openTransit(){
 if(busy)return;clearTransit();
 const inputs=['start','end'].map(id=>$(id).value.trim()),a=transitStoredPlace(inputs[0],'start'),b=transitStoredPlace(inputs[1],'end');
 transitContext={inputs,signature:transitInputSignature(),...(a&&b?{a:[a.lat,a.lon],b:[b.lat,b.lon],places:{start:a.label,end:b.label}}:{})};
 showTransitPlaces();$('transitWhen').value=parisLocal(Date.now()+5*60000);$('transitDirection').value='depart';
 $('transitDialog').showModal();$('transitTitle').focus();
 if(transitContext.a&&(!transitPilot(transitContext.a)||!transitPilot(transitContext.b)))$('transitStatus').textContent='Ces lieux sont hors du secteur pilote autour de Grenoble. Aucun appel au calculateur n’a été effectué.';
}
function renderTransitTimes(routes,roads,q){
 Object.assign(q,transitClockReview(q,Date.now()));
 transitComparisonData={routes,roads,q,signature:transitLimitContextSignature()};const c=transitComparedCycle,shown={...roads};if(c&&roads.cycle)shown.cycle=c.criteriaError?{...roads.cycle,status:'excluded',reason:'Critères de distance invalides : '+c.criteriaError}:cycleConstrainedTiming(roads.cycle,c.view.route.distance,c);
 const rows=transitTimeRows(routes,shown,q),sourceLinks={ign:'<a href="https://cartes.gouv.fr/" target="_blank" rel="noopener noreferrer">IGN · BD TOPO</a>',osrm:'<a href="https://project-osrm.org/" target="_blank" rel="noopener noreferrer">OSRM · OpenStreetMap</a>',ors:'<a href="https://openrouteservice.org/" target="_blank" rel="noopener noreferrer">openrouteservice.org by HeiGIT · OpenStreetMap</a>'};
 const sources=[...new Set(Object.values(roads).filter(r=>r.status==='ready').map(r=>sourceLinks[r.provider]).filter(Boolean))];
 $('transitCompareResults').innerHTML=`<h3>Comparer les temps</h3><p class="note">Même départ et même arrivée, pour une personne. Heure commune : ${transitClock(q.instant)} (Paris). ${q.arrive?'Comparaison entre le départ et l’heure limite, marge d’arrivée comprise.':'Comparaison depuis l’heure demandée, attente avant départ comprise.'} Places, accessibilité et disponibilité à bord non vérifiées.</p><div class="transit-table-scroll" role="region" aria-label="Comparaison des temps de déplacement" tabindex="0"><table><thead><tr><th scope="col">Mode</th><th scope="col">Temps comparé</th><th scope="col">Horaires et durée en chemin</th></tr></thead><tbody>${rows.map(r=>`<tr data-transit-mode="${r.mode}" data-transit-state="${r.status}"><th scope="row">${escapeHtml(r.label)}</th>${r.status==='ready'?`<td>${transitMinutes(r.elapsed)}</td><td>${transitClock(r.start)} → ${transitClock(r.end)}<br>${transitMinutes(r.duration)} en chemin</td>`:`<td>${r.status==='excluded'?'Écarté':'Indisponible'}</td><td>${escapeHtml(r.reason)}</td>`}</tr>`).join('')}</tbody></table></div><p class="note">Tri par minutes affichées, égalités conservées. Voiture et marche : estimations hors trafic et pauses, sans contrainte de calendrier routier. Les évitements et le profil saisis sont respectés ou le mode est déclaré indisponible. Prix totaux et empreintes non comparés dans ce tableau de temps ; aucun coût absent ne devient zéro. La carte représente toujours l’option collective choisie.</p>${sources.length?`<p class="note">Sources routières : ${sources.join(' · ')}.</p>`:''}${roads.cycle?transitCycleDescription():''}<button type="button" class="ghost" data-modal-carbon-open ${transitJob?'disabled':''}>Comparer les empreintes</button>`;
 renderTransitTimeNotice(q);refreshModalCarbon();transitTimeKey=transitTimeFingerprint(q);
 if(cycleContext?.returnFocus?.hasAttribute('data-transit-cycle')&&cycleContext.signature===transitInputSignature())cycleContext.returnFocus=document.querySelector('[data-transit-cycle]');
}
async function compareTransitTimes(job,q,result){
 const roads={},signature=transitInputSignature(),current=()=>transitJob===job&&!job.cancelled&&signature===transitInputSignature();let ignQuota=false;
 for(const mode of ['car','walk']){
  if(!current())return;
  try{
   if(mode==='car'&&job.vehicle!=='car')throw new Error('Ce profil de véhicule n’est pas qualifié pour cette comparaison ; aucun trajet voiture substitué.');
   if(ignQuota&&job.settings[mode].provider==='ign')throw new Error('Quota IGN atteint : ce second calcul n’a pas été demandé. Relancer plus tard.');
   const routeResult=await route([q.a,q.b],true,false,job.settings[mode],current);if(!current())return;
   roads[mode]={...transitRoadTiming(mode,routeResult,q),provider:job.settings[mode].provider};
  }catch(e){if(!current())return;roads[mode]={status:'unavailable',reason:e.message};if(e.message.includes('Limite du service IGN'))ignQuota=true}
 }
 if(current()&&job.cycleChoice.enabled){
  try{const view=await loadComparedCycle(q.a,q.b,job,current);if(!current())return;transitComparedCycle={view,places:{...transitContext.places},maxKm:job.cycleChoice.maxKm,strict:job.cycleChoice.strict,signature:transitInputSignature()};roads.cycle={...transitRoadTiming('cycle',view.route,q),provider:'fossgis-bike'}}catch(e){if(!current())return;roads.cycle={status:'unavailable',reason:e.message}}
 }
 if(current())renderTransitTimes(result.routes,roads,q);
}
function drawTransit(index){
 const route=transitRoutes[index];if(!route)return;if(transitCarbonView&&transitCarbonView.index!==index)clearTransitCarbon();
 document.querySelectorAll('[data-transit-map]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.transitMap)===index)));
 document.querySelectorAll('[data-transit-compare-view]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.transitCompareView)===index)));
 $('transitMapWrap').hidden=false;$('transitMapTitle').textContent=`${transitReferencePrefix(transitRouteReview(route,transitCalculation))}Option ${index+1} · ${transitClock(route.start)} → ${transitClock(route.end)}`;
 if(transitLayers){transitLayers.remove();transitLayers=null}$('transitSketch').replaceChildren();
 const complete=route.legs.every(l=>l.points)&&route.legs.reduce((n,l)=>n+l.points.length,0)<=16000;$('transitMapNote').textContent=complete?'Bleu : transport collectif. Pointillés : marche. Ce parcours est consulté séparément du trajet routier.':'Tracé incomplet : consulter les étapes. Aucune ligne droite ne remplace une géométrie absente.';
 $('transitMap').hidden=!complete||!window.L;$('transitSketch').hidden=!complete||Boolean(window.L);
 if(!complete)return;
 const points=route.legs.flatMap(l=>l.points);
 if(window.L){
  try{
   if(!transitMap){transitMap=L.map('transitMap',{scrollWheelZoom:false});L.tileLayer(C.tileUrl,{maxZoom:19,attribution:'© OpenStreetMap contributors'}).addTo(transitMap);new ResizeObserver(()=>transitMap.invalidateSize()).observe($('transitMap'))}
   transitLayers=L.featureGroup().addTo(transitMap);
   for(const leg of route.legs){L.polyline(leg.points,{color:leg.mode==='WALK'?'#6941c6':'#0966d5',weight:6,dashArray:leg.mode==='WALK'?'5 7':undefined}).addTo(transitLayers);for(const [p,name] of [[leg.from,leg.fromName],[leg.to,leg.toName]]){const label=document.createElement('span');label.textContent=name;L.circleMarker(p,{radius:5,color:'#123252',fillColor:'#fff',fillOpacity:1}).bindTooltip(label).addTo(transitLayers)}}
   transitMap.invalidateSize();transitMap.fitBounds(points,{padding:[20,20]});
  }catch{$('transitMap').hidden=true;$('transitMapNote').textContent+=' Fond de carte indisponible ; horaires et étapes conservés.'}
 }else{
  const ns='http://www.w3.org/2000/svg',svg=$('transitSketch'),ys=points.map(p=>p[0]),xs=points.map(p=>p[1]),minX=Math.min(...xs),minY=Math.min(...ys),dx=Math.max(...xs)-minX||.001,dy=Math.max(...ys)-minY||.001;
  svg.setAttribute('viewBox','0 0 500 300');
  for(const leg of route.legs){const p=document.createElementNS(ns,'polyline');p.setAttribute('points',leg.points.map(([lat,lon])=>`${20+(lon-minX)/dx*460},${280-(lat-minY)/dy*260}`).join(' '));p.setAttribute('fill','none');p.setAttribute('stroke',leg.mode==='WALK'?'#d2b8ff':'#80bdff');p.setAttribute('stroke-width','5');if(leg.mode==='WALK')p.setAttribute('stroke-dasharray','5 7');svg.append(p)}
  $('transitMapNote').textContent+=' Fond de carte indisponible : schéma du tracé, sans échelle.';
 }
}
function renderTransit(result,q){
 Object.assign(q,transitClockReview(q,Date.now()));clearTransitCarbon();transitRoutes=result.routes;transitCalculation=q;transitResult=result;transitResultSignature=transitLimitContextSignature();
 $('transitStatus').textContent=`${result.routes.length} itinéraire(s) collectif(s) compatible(s). ${result.excluded?`${result.excluded} proposition(s) écartée(s) : marche seule, doublon, limite ou données non qualifiées. `:''}Consulté le ${transitClock(Date.now())}.`;
 renderTransitTimeNotice(q);if(!result.routes.length){$('transitStatus').textContent+=' Aucun résultat ne satisfait ces critères. Les modifier puis relancer la recherche.';return}
 $('transitResults').innerHTML=result.routes.map((r,i)=>`<article class="comparison-card" data-transit-option="${i}"><h3 tabindex="-1">Option ${i+1} · ${transitMinutes(r.duration)}</h3><p data-transit-transfers="${i}" class="note"></p><p><strong>${transitClock(r.start)} → ${transitClock(r.end)}</strong> · heure de Paris</p><p>${r.transfers} correspondance(s) · ${Math.ceil(r.walk)} m de marche (${transitMinutes(r.walking)}) · ${transitMinutes(r.riding)} à bord · ${transitMinutes(r.waiting)} d’attente en chemin</p><p class="note">${q.arrive?`Arrivée ${transitMinutes((q.instant-r.end)/1000)} avant l’heure limite.`:`Départ ${transitMinutes((r.start-q.instant)/1000)} après l’heure demandée ; ${transitMinutes((r.end-q.instant)/1000)} de cette heure à l’arrivée.`}</p><ol class="transit-legs">${r.legs.map(l=>`${l.wait?`<li>Attendre ${transitMinutes(l.wait)} à ${escapeHtml(l.fromName)}</li>`:''}<li><strong>${transitClock(l.start)} — ${transitClock(l.end)} · ${TRANSIT_MODES[l.mode]}${l.mode==='WALK'?` · ${Math.ceil(l.distance)} m`:` ${escapeHtml(l.line)}`}</strong><br>${escapeHtml(l.fromName)} → ${escapeHtml(l.toName)}${l.mode==='WALK'?'':`<br>Direction : ${escapeHtml(l.direction)}<br>${escapeHtml(l.agency)}`}</li>`).join('')}</ol><p class="note">Horaires théoriques. Perturbations et retards non vérifiés. Prix total inconnu ; aucune réservation. Accessibilité, bagages et vélo à bord non vérifiés.</p><button type="button" class="ghost" data-transit-map="${i}" aria-pressed="false">Voir le parcours ${i+1}</button><p class="note">La consultation réseau transmet les lignes et arrêts consultés à Mobilités M, uniquement à la demande.</p><button type="button" class="ghost" data-transit-network="${i}" disabled>Consulter les infos réseau · option ${i+1}</button><button type="button" class="ghost" data-transit-save="${i}" disabled>Enregistrer cette option collective ${i+1}</button><button type="button" class="ghost" data-transit-journal="${i}" disabled>Déclarer ce trajet effectué · option ${i+1}</button><button type="button" class="ghost" data-transit-carbon="${i}" disabled>Estimer l’empreinte · option ${i+1}</button></article>`).join('');
 renderTransitNetworkFilters();refreshTransitTransfers();transitTimeKey=transitTimeFingerprint(q);const first=result.routes.findIndex(r=>transitRouteReview(r,q).status==='ready');if(first>=0)drawTransit(first);
}
function renderTransitChoices(){
 const q=transitCalculation,wrap=$('transitOptions');wrap.hidden=!q||!transitResult||!transitRoutes.length;if(wrap.hidden)return;
 const sort=$('transitOptionsSort').value;let rows;
 try{rows=transitOptionRows(transitRoutes,q,sort)}catch(e){$('transitOptionsTable').replaceChildren();$('transitOptionsExcludedTable').replaceChildren();$('transitOptionsExcluded').hidden=true;$('transitOptionsStatus').textContent=e.message;return}
 const ready=rows.filter(r=>r.status==='ready'),excluded=rows.filter(r=>r.status!=='ready'),unknown=ready.filter(r=>r.sortValue===null).length,selected=document.querySelector('[data-transit-map][aria-pressed="true"]')?.dataset.transitMap;
 $('transitOptionsContext').textContent=`${q.arrive?'Arrivée au plus tard à':'Départ à partir de'} ${transitClock(q.instant)} (Paris), pour une personne. Horaires théoriques consultés le ${transitClock(q.now)}.`;
 $('transitOptionsStatus').textContent=`${ready.length-unknown} option(s) admissible(s) classée(s) · ${excluded.length} écartée(s)${unknown?' · '+unknown+' sans valeur pour ce tri':''}.`;
 const metric=(r,key,unit)=>`<span data-transit-metric="${key}">${r.metrics[key]===null?'Inconnu':r.metrics[key]+unit}</span>${sort===key&&r.tied?'<small class="note">Ex æquo</small>':''}`;
 const table=(list,reference)=>`<table class="transit-options-table"><caption>${reference?'Références hors classement admissible':'Options collectives · '+escapeHtml($('transitOptionsSort').selectedOptions[0].textContent)}</caption><thead><tr><th scope="col">Option</th><th scope="col" aria-sort="${!reference&&['elapsed','duration'].includes(sort)?'ascending':'none'}">Temps</th><th scope="col" aria-sort="${!reference&&sort==='walk'?'ascending':'none'}">À pied</th><th scope="col" aria-sort="${!reference&&sort==='transfers'?'ascending':'none'}"><abbr title="Correspondances">Corresp.</abbr></th></tr></thead><tbody>${list.map(r=>`<tr data-transit-choice="${r.index}" data-choice-state="${reference?'excluded':r.sortValue===null?'unknown':'ready'}"><th scope="row"><button class="ghost" type="button" data-transit-compare-view="${r.index}" aria-label="Option ${r.index+1} · Consulter le parcours collectif${reference?', référence non admissible':''}" aria-pressed="${String(selected===String(r.index))}" ${transitJob?'disabled':''}>Option ${r.index+1}</button>${reference?'<small class="note">Écartée</small>':r.sortValue===null?'<small class="note">Non classée</small>':''}</th><td>${metric(r,'elapsed',' min')}<small class="note">Temps comparé</small>${metric(r,'duration',' min')}<small class="note">En chemin</small></td><td>${metric(r,'walk',' m')}<small class="note">Marche totale</small></td><td>${metric(r,'transfers','')}</td></tr>${reference?`<tr><td colspan="4" class="note">Option ${r.index+1} : ${escapeHtml(r.reason)}</td></tr>`:''}`).join('')}</tbody></table>`;
 $('transitOptionsTable').innerHTML=ready.length?table(ready,false):'<p class="app-notice">Aucune option admissible. Les références restent consultables ci-dessous.</p>';
 $('transitOptionsExcluded').hidden=!excluded.length;$('transitOptionsExcludedLabel').textContent=`Options écartées · ${excluded.length}`;$('transitOptionsExcludedTable').innerHTML=excluded.length?table(excluded,true):'';
 $('transitOptionsTimeHelp').textContent=q.arrive?'Temps comparé : du départ à l’heure limite, marge d’arrivée comprise. En chemin : de la première à la dernière étape.':'Temps comparé : de l’heure demandée à l’arrivée, attente avant départ comprise. En chemin : de la première à la dernière étape.';
}
function renderTransitNetworkFilters(){
 const catalog=transitNetworkCatalog(transitRoutes);$('transitNetworkFilters').hidden=!transitRoutes.length;
 $('transitNetworkChoices').innerHTML=catalog.entries.map(e=>`<label class="check-label"><input type="checkbox" data-transit-exclude-network="${escapeHtml(e.id)}"> <span>Exclure ${escapeHtml(e.names.join(' / '))}<small class="note">Identifiant reçu : ${escapeHtml(e.id)}</small></span></label>`).join('')||'<p class="note">Aucun réseau identifié dans les étapes reçues.</p>';
 refreshTransitNetworkFilters();
}
function refreshTransitNetworkFilters(){
 const q=transitCalculation;if(!q)return;const catalog=transitNetworkCatalog(transitRoutes),n=(q.excludedNetworks||[]).length;
 const unknownRoutes=transitRoutes.filter(r=>r.legs.some(l=>l.mode!=='WALK'&&!networkId(l.agencyId))).length;
 $('transitNetworkFilterStatus').textContent=q.networkError?'Exclusions non vérifiables. Réinitialiser le filtre.':`${catalog.entries.length} réseau(x) identifié(s) · ${n} exclu(s). ${unknownRoutes?unknownRoutes+' option(s) avec un réseau non renseigné ; '+(n?'elles sont écartées car le filtre ne peut pas être vérifié.':'elles restent consultables sans exclusion active.'):'Les exclusions portent sur toutes les étapes collectives reçues.'}`;
 for(const b of $('transitNetworkChoices').querySelectorAll('input'))b.disabled=Boolean(transitJob);
 $('transitNetworkReset').disabled=Boolean(transitJob)||(!n&&!q.networkError);
}
function updateTransitNetworks(reset=false){
 if(transitJob){clearTransit('Critères modifiés : calcul annulé.');return}
 const q=transitCalculation;if(!q)return;if(transitResultSignature!==transitLimitContextSignature()){clearTransit('Contexte modifié : relancer la recherche.');return}
 const checks=[...$('transitNetworkChoices').querySelectorAll('[data-transit-exclude-network]')],ids=new Set(transitNetworkCatalog(transitRoutes).entries.map(e=>e.id));
 if(reset)for(const b of checks)b.checked=false;
 const selected=checks.filter(b=>b.checked).map(b=>b.dataset.transitExcludeNetwork);
 q.networkError=selected.some(id=>!ids.has(id));q.excludedNetworks=selected;
 clearTransitNetwork();clearTransitCarbon();refreshTransitNetworkFilters();refreshTransitTransfers();
 const d=transitComparisonData;if(d)renderTransitTimes(d.routes,d.roads,q);
 if(reset)checks[0]?.focus();
}
function readTransitTransfers(){
 const text=$('transitMaxTransfers').value.trim(),rule=$('transitTransferRule').value;
 if($('transitMaxTransfers').validity.badInput||!['soft','strict'].includes(rule))throw new Error('Critères de correspondances invalides.');
 return transitTransferCriteria(text===''?null:Number(text),rule==='strict');
}
function refreshTransitTransfers(){
 const q=transitCalculation;if(!q||!transitResult)return;Object.assign(q,transitClockReview(q,Date.now()));renderTransitTimeNotice(q);refreshTransitNetworkFilters();renderTransitChoices();let admissible=0;
 for(const [i,r] of transitRoutes.entries()){
  const review=transitRouteReview(r,q),article=document.querySelector(`[data-transit-option="${i}"]`);if(!article)continue;
  article.dataset.transitState=review.status;article.dataset.transitTemporal=review.temporal;if(review.status==='ready')admissible++;
  const notice=article.querySelector('[data-transit-transfers]');notice.textContent=review.reason;notice.className=review.status==='excluded'?'app-notice':'note';
  const map=article.querySelector('[data-transit-map]');map.textContent=review.status==='excluded'?`Consulter la référence ${i+1} · non admissible`:`Voir le parcours ${i+1}`;
  for(const b of article.querySelectorAll('[data-transit-save],[data-transit-journal]'))b.disabled=Boolean(q.transferError)||Boolean(transitJob);
  if(map.getAttribute('aria-pressed')==='true')$('transitMapTitle').textContent=`${transitReferencePrefix(review)}Option ${i+1} · ${transitClock(r.start)} → ${transitClock(r.end)}`;
 }
 $('transitStatus').textContent=`${admissible} itinéraire(s) collectif(s) compatible(s), sur ${transitRoutes.length} option(s) reçue(s) et validée(s). ${transitResult.excluded?transitResult.excluded+' proposition(s) écartée(s) pour données, horaires, marche ou doublons. ':''}Consulté le ${transitClock(q.now)}. ${q.transferError?'Critères invalides : '+q.transferError:!transitRoutes.length?'Aucun résultat ne satisfait les critères de recherche. Les modifier puis relancer.':admissible?'':'Aucune option reçue ne respecte les critères actifs. Les références restent consultables ; aucun autre trajet n’est garanti.'}`;
}
function updateTransitTransfers(){
 if(transitJob){clearTransit('Critères modifiés : calcul annulé.');return}
 if(!transitCalculation)return;if(transitResultSignature!==transitLimitContextSignature()){clearTransit('Contexte modifié : relancer la recherche.');return}
 try{Object.assign(transitCalculation,readTransitTransfers(),{transferError:null})}catch(e){transitCalculation.transferError=e.message}
 refreshTransitTransfers();const d=transitComparisonData;if(d)renderTransitTimes(d.routes,d.roads,transitCalculation);
}
async function searchTransit(){
 if(transitJob||busy||!transitContext)return;
 const raw={when:$('transitWhen').value,direction:$('transitDirection').value,walk:$('transitWalk').value},context=transitContext;let cycleChoice;
 if(context.signature!==transitInputSignature()){updateTransitContext();return}
 try{if(context.inputs.some(x=>!x))throw new Error('Renseigner le départ et l’arrivée avant la recherche.');Object.assign(raw,readTransitTransfers());transitCriteria(raw);cycleChoice=$('transitCompare').checked&&$('transitCycle').checked?{enabled:true,...readCycleCriteria('transitCycle')}:cycleComparisonChoice(false);if(Date.now()<transitNextRequest)throw new Error('Patienter quelques secondes avant une nouvelle recherche.')}catch(e){clearTransit(e.message);return}
 clearTransit();const job={controller:new AbortController(),cancelled:false,resolving:true,cycleChoice,compare:$('transitCompare').checked,vehicle:$('routeVehicle').value,settings:{car:comparisonCarSettings(),walk:routingSettings('walk',[])}};
 transitJob=job;activeAbort=job.controller;lock(true);transitNextRequest=Date.now()+3000;
 $('transitSearch').disabled=true;$('transitCancel').hidden=false;
 const current=()=>transitJob===job&&!job.cancelled&&transitContext===context&&context.signature===transitInputSignature();
 try{
  if(!context.a){
   $('transitStatus').textContent='Vérification du lieu de départ auprès de l’IGN…';const ga=transitStoredPlace(context.inputs[0],'start')||await resolveTripPlace(context.inputs[0],'start',current);if(!current())return;
   $('transitStatus').textContent='Vérification du lieu d’arrivée auprès de l’IGN…';const gb=transitStoredPlace(context.inputs[1],'end')||await resolveTripPlace(context.inputs[1],'end',current);if(!current())return;
   Object.assign(context,{a:[ga.lat,ga.lon],b:[gb.lat,gb.lon],places:{start:ga.label,end:gb.label}});showTransitPlaces();
  }
  job.resolving=false;
  const q=transitRequest(context.a,context.b,raw);let result={routes:[],excluded:0};
  $('transitStatus').textContent='Recherche des horaires auprès de Mobilités M…';
  const timer=setTimeout(()=>job.controller.abort(),20000);
  try{
   const response=await fetch(q.url,{signal:job.controller.signal,credentials:'omit',referrerPolicy:'no-referrer',cache:'no-store'});
   if(!response.ok)throw new Error(response.status===429?'Limite du service atteinte. Réessayer plus tard.':'Service de transports indisponible. Réessayer plus tard.');
   const text=await response.text();if(text.length>2e6)throw new Error('Réponse de transports trop volumineuse.');let data;try{data=JSON.parse(text)}catch{throw new Error('Réponse de transports illisible.')}
   if(!current())return;result=transitResponse(data,q);renderTransit(result,q);
  }catch(e){if(!current())return;$('transitStatus').textContent=e.name==='AbortError'?'Le service n’a pas répondu à temps. Relancer la recherche si nécessaire.':e.message}
  finally{clearTimeout(timer)}
  if(job.compare&&current()&&!job.controller.signal.aborted){$('transitCompareResults').textContent='Comparaison des temps avec les modes demandés…';await compareTransitTimes(job,q,result)}
 }catch(e){if(current())$('transitStatus').textContent=e.message}
 finally{if(transitJob===job){if(context.signature!==transitInputSignature())updateTransitContext();transitJob=null;if(activeAbort===job.controller)activeAbort=null;lock(false);$('transitSearch').disabled=false;$('transitCancel').hidden=true;for(const b of document.querySelectorAll('[data-transit-network],[data-transit-save],[data-transit-carbon],[data-transit-journal],[data-modal-carbon-open]'))b.disabled=false;refreshTransitTransfers();if(!$('transitDialog').open&&!document.querySelector('dialog[open]'))$('transitBtn').focus()}}
}
function transitTimeFingerprint(q){const d=transitComparisonData,rows=transitTimeRows(transitRoutes,d?.q===q?modalShownRoads(d):{},q);return JSON.stringify([transitTimeReview(null,q),rows.map(r=>[r.mode,r.index,r.temporal])])}
function transitReferencePrefix(review){return review.temporal?.startsWith('past-')?'Référence historique · ':review.status==='excluded'?'Référence non admissible · ':''}
function renderTransitTimeNotice(q){
 const notice=$('transitTimeNotice'),context=transitTimeReview(null,q),rows=transitTimeRows(transitRoutes,transitComparisonData?.q===q?modalShownRoads(transitComparisonData):{},q),past=rows.filter(r=>r.temporal==='past-departure').length;
 notice.hidden=context.status==='ready'&&!past;
 notice.textContent=notice.hidden?'':(context.status==='excluded'?context.reason:past+' départ(s) théorique(s) passé(s) selon l’horloge de l’appareil.')+' Les résultats datés restent consultables. Choisir une nouvelle heure puis lancer une recherche pour obtenir de nouvelles propositions. Aucun départ réel, retard ou trajet effectué n’est déduit du temps écoulé.';
}
function refreshTransitFreshness(){
 const d=transitComparisonData,q=transitCalculation||d?.q;if(!q)return;
 const signature=transitResultSignature||d?.signature;
 if(signature!==transitLimitContextSignature()){clearTransit('Contexte modifié : relancer la recherche.');return}
 Object.assign(q,transitClockReview(q,Date.now()));
 const key=transitTimeFingerprint(q);
 if(key===transitTimeKey)return;transitTimeKey=key;
 const active=document.activeElement,choice=active?.dataset?.transitCompareView,cycle=active?.hasAttribute('data-transit-cycle'),region=active?.getAttribute('role')==='region'?active.getAttribute('aria-label'):null,carbonRow=active?.tagName==='SUMMARY'?active.closest('[data-modal-row]')?.dataset.modalRow:null;
 const openRows=[...document.querySelectorAll('#modalCarbonTables [data-modal-row]')].filter(e=>e.querySelector('details[open]')).map(e=>e.dataset.modalRow);
 refreshTransitTransfers();if(d)renderTransitTimes(d.routes,d.roads,q);renderTransitTimeNotice(q);
 if(transitCarbonView)$('transitCarbonTitle').textContent=transitReferencePrefix(transitRouteReview(transitCarbonView.route,q))+`Empreinte · option ${transitCarbonView.index+1}`;
 for(const id of openRows){const details=document.querySelector('#modalCarbonTables [data-modal-row="'+CSS.escape(id)+'"] details');if(details)details.open=true}
 if(active&&!active.isConnected){const next=cycle?document.querySelector('[data-transit-cycle]'):choice!==undefined?document.querySelector('[data-transit-compare-view="'+CSS.escape(choice)+'"]'):region?document.querySelector('#transitDialog [role="region"][aria-label="'+CSS.escape(region)+'"]'):carbonRow?document.querySelector('#modalCarbonTables [data-modal-row="'+CSS.escape(carbonRow)+'"] summary'):null;if(next){const details=next.closest('details');if(details)details.open=true;next.focus({preventScroll:true})}}
}
function bindTransit(){
 setInterval(()=>{if(!document.hidden)refreshTransitFreshness()},15000);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshTransitFreshness()});window.addEventListener('focus',refreshTransitFreshness);
 for(const event of ['click','input','change'])$('transitDialog').addEventListener(event,refreshTransitFreshness,{capture:true});
 $('transitNetworkCancel').addEventListener('click',()=>clearTransitNetwork('Consultation annulée.'));
 setInterval(refreshTransitNetwork,30000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshTransitNetwork()});
 $('transitBtn').addEventListener('click',openTransit);$('transitSearch').addEventListener('click',searchTransit);
 $('transitCancel').addEventListener('click',()=>clearTransit('Recherche annulée.'));
 $('transitClose').addEventListener('click',()=>{$('transitDialog').close()});
 $('transitDialog').addEventListener('close',()=>{if($('transitDialog').open)return;clearTransit();if(!document.querySelector('dialog[open]'))$('transitBtn').focus()});
 for(const id of ['transitWhen','transitDirection','transitWalk','transitCompare','transitCycle'])$(id).addEventListener('input',()=>clearTransit(transitContext?.a&&(!transitPilot(transitContext.a)||!transitPilot(transitContext.b))?'Ces lieux sont hors du secteur pilote autour de Grenoble. Aucun appel au calculateur n’a été effectué.':'Critères modifiés : relancer la recherche.'));
 $('transitNetworkChoices').addEventListener('change',()=>updateTransitNetworks());$('transitNetworkReset').addEventListener('click',()=>updateTransitNetworks(true));
 $('transitMaxTransfers').addEventListener('input',updateTransitTransfers);$('transitTransferRule').addEventListener('change',updateTransitTransfers);
 $('transitOptionsSort').addEventListener('change',()=>{if(transitCalculation&&transitResultSignature!==transitLimitContextSignature()){clearTransit('Contexte modifié : relancer la recherche.');return}renderTransitChoices()});
 $('transitOptions').addEventListener('click',e=>{const b=e.target.closest('[data-transit-compare-view]');if(!b||transitJob)return;if(transitResultSignature!==transitLimitContextSignature()){clearTransit('Contexte modifié : relancer la recherche.');return}const index=Number(b.dataset.transitCompareView);drawTransit(index);const title=document.querySelector(`[data-transit-option="${index}"] h3`);if(title){title.focus({preventScroll:true});title.scrollIntoView({block:'start'})}});
 $('transitCycleLimit').addEventListener('input',updateTransitCycleLimits);$('transitCycleRule').addEventListener('change',updateTransitCycleLimits);
 $('transitCompare').addEventListener('change',()=>{$('transitCycleOptions').hidden=!$('transitCompare').checked;if(!$('transitCompare').checked){$('transitCycle').checked=false;$('transitCycleFields').hidden=true}});$('transitCycle').addEventListener('change',()=>{$('transitCycleFields').hidden=!$('transitCycle').checked});
 $('transitCompareResults').addEventListener('click',e=>{const b=e.target.closest('[data-transit-cycle]'),c=transitComparedCycle;if(b&&c&&!c.criteriaError&&!busy&&c.signature===transitInputSignature())openComparedCycle(c.view,c.places,c.maxKm,document.querySelector('[data-transit-cycle]')||b,c.strict)});
 $('transitResults').addEventListener('click',e=>{const j=e.target.closest('[data-transit-journal]');if(j)journalFromTransit(Number(j.dataset.transitJournal));const b=e.target.closest('[data-transit-map]');if(b)drawTransit(Number(b.dataset.transitMap));const n=e.target.closest('[data-transit-network]');if(n)loadTransitNetwork(Number(n.dataset.transitNetwork));const t=e.target.closest('[data-transit-save]');if(t)saveTransitOption(Number(t.dataset.transitSave));const c=e.target.closest('[data-transit-carbon]');if(c)openTransitCarbon(Number(c.dataset.transitCarbon))});
 for(const id of ['start','end'])$(id).addEventListener('input',()=>{clearTransit();transitContext=null;$('transitBtn').hidden=false;if($('transitDialog').open)$('transitDialog').close()});
}


let transitNetworkJob=null,transitNetworkView=null,transitNetworkNext=0;
function clearTransitNetwork(message=''){
 if(transitNetworkJob){transitNetworkJob.cancelled=true;transitNetworkJob.controller.abort();transitNetworkJob=null}
 transitNetworkView=null;$('transitNetwork').hidden=!message;$('transitNetworkStatus').textContent=message;$('transitNetworkBody').replaceChildren();$('transitNetworkCancel').hidden=true;
 for(const b of document.querySelectorAll('[data-transit-network]'))b.disabled=Boolean(transitJob);
}
function renderTransitNetwork(){
 const v=transitNetworkView;if(!v)return;const now=Date.now(),old=now-v.at>300000||now<v.at-60000,alertsOld=v.alerts&&(now-v.alerts.generated>600000||now<v.alerts.generated-60000);
 v.expiry=JSON.stringify([old,Boolean(alertsOld)]);
 $('transitNetworkStatus').textContent=`Option ${v.index+1} · consultation du ${transitClock(v.at)}. Les horaires et le classement restent théoriques.`;
 const boards=v.boards.map(b=>`<article class="network-board"><h4>${escapeHtml(b.leg.fromName)} · ligne ${escapeHtml(b.leg.line)}</h4><p class="note">Étape prévue le ${transitClock(b.leg.start)} vers ${escapeHtml(b.leg.direction)}.</p>${old?'<p class="network-warning">Consultation ancienne : passages retirés. Relancer volontairement la vérification.</p>':b.error?`<p class="network-warning">${escapeHtml(b.error)} Les horaires théoriques restent disponibles.</p>`:`<p class="network-warning">Actualisation non datée. Les estimations ci-dessous sont annoncées par le réseau ; leur fraîcheur n’est pas vérifiable.</p><p>${b.data.rows.some(r=>r.exact)?'Le service prévu est présent dans cette réponse.':'Le service prévu n’est pas identifié dans les prochains passages reçus. Cela ne prouve ni annulation ni circulation.'}</p><details><summary>Prochains passages reçus à cet arrêt (${b.data.rows.length}) · distincts du trajet prévu</summary>${b.data.rows.length?`<ul>${b.data.rows.map(r=>`<li><strong>${r.cancelled?'Annulation annoncée':r.predicted!==null?'Passage annoncé':'Horaire théorique'} · ${transitClock(r.predicted??r.scheduled)}</strong><br>Prévu : ${transitClock(r.scheduled)} · direction ${escapeHtml(r.direction)}${r.exact?'<br>Même service et même horaire que l’étape prévue.':''}${r.delay!==null&&r.delay!==0?`<br>${r.delay>0?'Retard':'Avance'} annoncé : ${networkDelay(r.delay)}, actualisation non datée.`:''}${r.cancelled?'<br>Annulation à confirmer auprès du réseau, date de mise à jour non fournie.':''}</li>`).join('')}</ul>`:'<p>Aucun prochain passage exploitable dans la réponse. Aucun départ de remplacement inventé.</p>'}${b.data.extra?`<p class="note">${b.data.extra} autre(s) passage(s) non affiché(s).</p>`:''}${b.data.rejected?`<p class="note">${b.data.rejected} élément(s) non vérifiable(s) écarté(s).</p>`:''}</details>`}</article>`).join('');
 const list=items=>items.map(a=>`<article class="network-alert"><h4>${escapeHtml(a.title)}</h4><p>${escapeHtml(a.text)}</p>${a.link?`<a href="${escapeHtml(a.link)}" target="_blank" rel="noopener noreferrer">Annonce originale du réseau</a>`:''}</article>`).join('');
 let alerts=v.alertError?`<p class="network-warning">${escapeHtml(v.alertError)} Perturbations non vérifiées.</p>`:'';
 if(v.alerts){const matched=v.alerts.items.filter(x=>x.matched),others=v.alerts.items.filter(x=>!x.matched);alerts=alertsOld?'<p class="network-warning">Flux de perturbations ancien : annonces retirées. Relancer la consultation.</p>':`<p class="note">Flux généré le ${transitClock(v.alerts.generated)}. Les annonces ci-dessous recouvrent la période de l’option ; la date d’actualisation de chaque annonce n’est pas fournie.</p>${matched.length?`<h4>Annonces concernant une ligne ou un arrêt du trajet (${matched.length})</h4><p class="network-warning">Portée de l’annonce à vérifier ; aucune interruption ou correspondance recalculée automatiquement.</p>${list(matched)}`:'<p class="network-warning">Perturbations du trajet non vérifiées : aucune annonce ne peut lui être attribuée avec certitude. Cela ne signifie pas « aucune perturbation ».</p>'}<details><summary>Annonces du réseau pour cette période (${others.length}) · non attribuées au trajet</summary>${list(others)||'<p>Aucune annonce exploitable dans cette réponse pour cette période.</p>'}</details>${v.alerts.rejected?`<p class="note">${v.alerts.rejected} annonce(s) au format non qualifié écartée(s).</p>`:''}`}
 $('transitNetworkBody').innerHTML=`${v.more?`<p class="network-warning">Vérification limitée aux trois premières étapes collectives ; ${v.more} autre(s) étape(s) non vérifiée(s).</p>`:''}${boards}<h3>Perturbations du réseau</h3>${alerts}<p class="note">Source : <a href="https://data.mobilites-m.fr/donnees" target="_blank" rel="noopener noreferrer">Mobilités M / SMMAG · données ODbL</a>. Consultation ponctuelle, sans suivi automatique. <a href="https://www.mobilites-m.fr/" target="_blank" rel="noopener noreferrer">Vérifier auprès du réseau</a>.</p>`;
}
async function loadTransitNetwork(index){
 const route=transitRoutes[index];if(!Number.isInteger(index)||!route||transitJob||busy||transitNetworkJob)return;
 if(Date.now()<transitNetworkNext){clearTransitNetwork();$('transitNetwork').hidden=false;$('transitNetworkStatus').textContent='Patienter quelques secondes avant une nouvelle consultation.';return}
 clearTransitNetwork();const job={controller:new AbortController(),cancelled:false},current=()=>transitNetworkJob===job&&!job.cancelled&&transitRoutes[index]===route;
 transitNetworkJob=job;transitNetworkNext=Date.now()+10000;const v={index,at:Date.now(),boards:[],alerts:null,alertError:'',more:Math.max(0,route.legs.filter(l=>l.mode!=='WALK').length-3)};
 $('transitNetwork').hidden=false;$('transitNetworkStatus').textContent='Consultation du réseau…';$('transitNetworkCancel').hidden=false;for(const b of document.querySelectorAll('[data-transit-network]'))b.disabled=true;
 $('transitNetworkTitle').focus();let quota=false;const timer=setTimeout(()=>job.controller.abort(),30000);
 async function get(path){if(quota)throw new Error('Quota du réseau atteint. Aucun autre appel effectué.');if(job.controller.signal.aborted)throw new Error('Consultation interrompue ou délai dépassé.');const r=await fetch('https://data.mobilites-m.fr/api/'+path,{signal:job.controller.signal,credentials:'omit',referrerPolicy:'no-referrer',cache:'no-store'});if(r.status===429){quota=true;throw new Error('Quota du réseau atteint. Réessayer plus tard.')}if(!r.ok)throw new Error('Information du réseau indisponible.');const text=await r.text();if(text.length>2e6)throw new Error('Réponse du réseau trop volumineuse.');try{return JSON.parse(text)}catch{throw new Error('Réponse du réseau illisible.')}}
 try{
  let catalog,catalogError;try{catalog=await get('routers/default/index/routes')}catch(e){catalogError=e.message}
  if(!current())return;
  for(const leg of route.legs.filter(l=>l.mode!=='WALK').slice(0,3)){
   try{if(catalogError)throw new Error(catalogError);if(!leg.stopId)throw new Error('Identifiant d’arrêt non qualifié.');const line=networkLine(catalog,leg),raw=await get('routers/default/index/stops/'+encodeURIComponent(leg.stopId)+'/stoptimes?'+new URLSearchParams({route:line.id,showCancelledTrips:'true'}));if(!current())return;v.boards.push({leg,data:networkDepartures(raw,line,leg,Date.now())})}catch(e){if(!current())return;v.boards.push({leg,error:e.name==='AbortError'?'Le réseau n’a pas répondu à temps.':e.message})}
  }
  try{const raw=await get('gtfs/realtime/alert/SMA?json=true');if(!current())return;v.alerts=networkAlerts(raw,route,Date.now())}catch(e){v.alertError=e.name==='AbortError'?'Le réseau n’a pas répondu à temps.':e.message}
  if(current()){transitNetworkView=v;renderTransitNetwork()}
 }finally{clearTimeout(timer);if(current()){transitNetworkJob=null;$('transitNetworkCancel').hidden=true;for(const b of document.querySelectorAll('[data-transit-network]'))b.disabled=false}}
}
function refreshTransitNetwork(){if(!transitNetworkView)return;const v=transitNetworkView,now=Date.now(),expiry=JSON.stringify([now-v.at>300000||now<v.at-60000,Boolean(v.alerts&&(now-v.alerts.generated>600000||now<v.alerts.generated-60000))]);if(expiry!==v.expiry)renderTransitNetwork()}

let modalCarbonView=null;
function modalCarbonSignature(){return JSON.stringify([transitLimitContextSignature(),$('fuel').value,$('routeVehicle').value])}
function clearModalCarbon(focus=false){
 modalCarbonView=null;$('modalCarbon').hidden=true;$('modalCarbonModels').replaceChildren();$('modalCarbonTables').replaceChildren();$('modalCarbonStatus').textContent='';
 if(focus)document.querySelector('[data-modal-carbon-open]')?.focus();
}
function modalCarbonContext(){
 const d=transitComparisonData;if(!d)return null;
 if(d.signature!==transitLimitContextSignature()){clearTransit('Contexte modifié : relancer la recherche.');return null}
 if(modalCarbonView&&(modalCarbonView.routes!==d.routes||modalCarbonView.signature!==modalCarbonSignature())){clearModalCarbon();$('transitStatus').textContent='Hypothèses d’empreinte retirées : contexte modifié. Ouvrir une nouvelle comparaison.';return null}
 return d;
}
function modalShownRoads(d){
 const c=transitComparedCycle,roads={...d.roads};
 if(c&&roads.cycle)roads.cycle=c.criteriaError?{...roads.cycle,status:'excluded',reason:'Critères de distance invalides : '+c.criteriaError}:cycleConstrainedTiming(roads.cycle,c.view.route.distance,c);
 return roads;
}
function modalCarOptions(fuel){return '<option value="">Choisir un modèle</option>'+prospectiveFactors(fuel).map(f=>`<option value="${f.id}">${escapeHtml(f.label)}</option>`).join('')}
function modalCarControls(fuel){
 const available=prospectiveFactors(fuel).length>0;
 return `<fieldset class="transit-carbon-step"><legend>Véhicule léger · hypothèses</legend><label for="modalCarbonFuel">Carburant retenu pour cette estimation</label><select id="modalCarbonFuel" data-modal-fuel>${['E10','Gazole','SP98','SP95','E85','GPLc'].map(f=>`<option${f===fuel?' selected':''}>${f}</option>`).join('')}</select><p class="note">Choix propre à cette comparaison ; le carburant du profil et du budget reste inchangé.</p><label for="modalCarbonCar">Modèle moyen de voiture</label><select id="modalCarbonCar" data-modal-car ${available?'':'disabled'}>${modalCarOptions(fuel)}</select><p id="modalCarbonFuelNote" class="note">${available?'Modèle moyen à choisir ; aucune taille supposée.':'Aucun modèle compatible avec ce véhicule ou carburant.'}</p><label for="modalCarbonOccupants">Total des occupants, conducteur compris</label><input id="modalCarbonOccupants" data-modal-occupants type="number" min="1" max="9" step="1" inputmode="numeric" value=""><p class="note">Le groupe comparé peut n’occuper qu’une partie du véhicule. Parts égales ; capacité et occupation réelles non vérifiées. Le total véhicule reste distinct.</p></fieldset>`;
}
function openModalCarbon(){
 if(busy||transitJob)return;const d=modalCarbonContext();if(!d)return;clearModalCarbon();
 const fuel=$('fuel').value,vehicle=$('routeVehicle').value;
 modalCarbonView={routes:d.routes,signature:modalCarbonSignature(),fuel,vehicle,persons:'1',car:{factorId:'',occupants:''},cycle:false,transit:d.routes.map(r=>r.legs.map(()=>'')),sort:'mode'};
 $('modalCarbonModels').innerHTML=`<fieldset class="transit-carbon-step"><legend>Voyageurs comparés</legend><label for="modalCarbonPeople">Nombre de personnes dans le groupe</label><input id="modalCarbonPeople" data-modal-people type="number" min="1" max="9" step="1" inputmode="numeric" value="1" aria-describedby="modalCarbonPeopleNote modalCarbonPeopleError"><p id="modalCarbonPeopleNote" class="note">Le même groupe pour chaque mode. Les horaires et distances restent ceux des parcours reçus ; places, capacité, matériel et allure du groupe non vérifiés. Hypothèse propre à ce panneau, sans enregistrement.</p><p id="modalCarbonPeopleError" role="status"></p></fieldset>
 ${d.roads.car?.status==='ready'?modalCarControls(fuel):''}
 ${d.roads.cycle?.distance!==undefined?'<fieldset class="transit-carbon-step"><legend>Vélo classique · hypothèse</legend><label class="check"><input data-modal-cycle type="checkbox"> Utiliser un vélo mécanique par personne du groupe — construction seule</label><p class="note">Hypothèse d’un vélo par personne ; matériel non vérifié. Périmètre différent des modèles construction et énergie ; aucune absence d’impact supposée.</p></fieldset>':''}
 ${d.routes.map((r,i)=>`<details class="transit-carbon-step"><summary>Modèles de l’option collective ${i+1}</summary><p>${transitClock(r.start)} → ${transitClock(r.end)} · <span data-modal-persons-context>une personne</span>. Hypothèses indépendantes des autres options.</p>${r.legs.map((l,j)=>{const factors=transitCarbonFactors(l.mode);return `<fieldset class="transit-carbon-step"><legend>Étape ${j+1} · ${TRANSIT_MODES[l.mode]} ${l.mode==='WALK'?'':escapeHtml(l.line)}</legend><p>${escapeHtml(l.fromName)} → ${escapeHtml(l.toName)} · ${fmt(l.distance/1000,3)} km</p>${factors.length?`<label for="modalCarbonChoice${i}-${j}">Modèle moyen · option ${i+1}, étape ${j+1}</label><select id="modalCarbonChoice${i}-${j}" data-modal-option="${i}" data-modal-leg="${j}"><option value="">Choisir un modèle — sinon non estimé</option>${factors.map(f=>`<option value="${f.id}">${escapeHtml(f.label)}</option>`).join('')}</select>`:'<p>Aucun facteur qualifié pour cette étape ; aucun zéro attribué.</p>'}</fieldset>`}).join('')}</details>`).join('')}`;
 $('modalCarbonSort').value='mode';$('modalCarbon').hidden=false;refreshModalCarbon();$('modalCarbonTitle').focus();$('modalCarbonTitle').scrollIntoView({block:'start'});
}
function modalCarbonDetails(row){
 const c=row.emission,num=n=>new Intl.NumberFormat('fr-FR',{maximumFractionDigits:12}).format(n);
 return c.details.map(l=>l.status==='estimated'?`<li>Étape ${l.index+1} · ${escapeHtml(l.factor.label)} : ${fmt(l.distanceMeters/1000,3)} km × ${num(l.factor.construction+l.factor.energy)} ${l.factor.unit==='kgCO2e/vehicle-km'?'kg CO₂e/véhicule-km':'kg CO₂e/personne-km'}${row.mode==='car'?' ÷ '+c.occupants+' occupant(s)':''} = ${carbonAmount(l.valueKg)} par personne.${c.persons>1?` Groupe de ${c.persons} : ${carbonAmount(l.valueKg)} × ${c.persons} = ${carbonAmount(l.valueKg*c.persons)} (calcul sans arrondi intermédiaire).`:''}<br>Construction ${num(l.factor.construction)} ; énergie ${num(l.factor.energy)} dans la même unité. <a href="${l.factor.source}" target="_blank" rel="noopener noreferrer">Source du modèle</a>.</li>`:`<li>Étape ${l.index+1} · ${escapeHtml(l.reason)}</li>`).join('');
}
function modalCarbonTable(rows,label){
 if(!rows.length)return '<p>Aucune option dans ce groupe.</p>';
 return `<div class="transit-table-scroll modal-carbon-table" role="region" aria-label="${label}" tabindex="0"><table><caption>${label}</caption><thead><tr><th scope="col">Mode et trajet</th><th scope="col">Distance et temps</th><th scope="col">CO₂e · personne et groupe</th></tr></thead><tbody>${rows.map(r=>{
 const c=r.emission,known=c.subtotalKg!==null,value=known?carbonAmount(c.subtotalKg):'Non estimée';
 return `<tr data-modal-row="${r.key}" data-modal-state="${c.status}" data-modal-admissible="${r.status}" data-modal-comparable="${r.comparable}"><th scope="row">${escapeHtml(r.label)}${r.status!=='ready'?`<p class="note">${r.status==='excluded'?'Référence non admissible':'Indisponible'} · ${escapeHtml(r.reason)}</p>`:''}${r.tied?'<p class="note">Ex æquo à la précision affichée</p>':''}</th><td>${r.distanceMeters===null?'Distance inconnue':fmt(r.distanceMeters/1000,3)+' km'}<br>${Number.isFinite(r.elapsed)?transitMinutes(r.elapsed)+' comparées':'Temps indisponible'}</td><td><strong>${c.status==='partial'?'Sous-total partiel : ':known?'Estimation : ':''}${value}</strong>${known?' par personne':''}${c.groupSubtotalKg!==null&&c.persons>1?`<p><strong>${c.status==='partial'?'Sous-total du groupe':'Part du groupe'} (${c.persons} personnes) : ${carbonAmount(c.groupSubtotalKg)}</strong></p>`:''}<p>${escapeHtml(c.reason)}</p>${c.scope?`<p>${escapeHtml(CARBON_SCOPES[c.scope])}.</p>`:''}${c.estimatedSteps!==undefined?`<p>${c.estimatedSteps}/${c.rows.length} étapes estimées · ${fmt(c.estimatedMeters/1000,3)} km concernés${c.missingSteps?` ; ${c.missingSteps} étape(s) non estimée(s)${c.missingMeters!==null?' · '+fmt(c.missingMeters/1000,3)+' km':''}`:''}.</p>`:''}${c.vehicleKg!==undefined?`<p>Véhicule entier : ${carbonAmount(c.vehicleKg)} ; parts individuelle et du groupe ci-dessus, sans ajout au total.</p>`:''}${c.details.length?`<details><summary>Facteurs et calcul · ${escapeHtml(r.label)}</summary><ol>${modalCarbonDetails(r)}</ol></details>`:''}</td></tr>`
 }).join('')}</tbody></table></div>`;
}
function refreshModalCarbon(){
 if(!modalCarbonView)return;const d=modalCarbonContext();if(!d||!modalCarbonView)return;
 const v=modalCarbonView;v.persons=$('modalCarbonPeople').value;
 const persons=modalCarbonPersons(v.persons),label=persons===null?'Groupe à préciser':persons===1?'une personne':`groupe de ${persons} personnes`;
 $('modalCarbonPeople').setAttribute('aria-invalid',String(persons===null));
 $('modalCarbonPeopleError').textContent=persons===null?'Indiquer de 1 à 9 voyageurs ; les estimations restent indisponibles.':'';
 for(const e of document.querySelectorAll('[data-modal-persons-context]'))e.textContent=label;
 const rows=modalCarbonRows(d.routes,modalShownRoads(d),d.q,v);
 let result;try{result=modalCarbonOrder(rows,v.sort)}catch(e){$('modalCarbonTables').replaceChildren();$('modalCarbonStatus').textContent=e.message;return}
 if((v.sort!=='mode'&&!result.peopleValid)||(v.sort==='carbon'&&!result.canSortCarbon)){v.sort='mode';$('modalCarbonSort').value='mode';result=modalCarbonOrder(rows,'mode')}
 for(const value of ['time','distance'])$('modalCarbonSort').querySelector('[value="'+value+'"]').disabled=!result.peopleValid;
 $('modalCarbonSort').querySelector('[value="carbon"]').disabled=!result.canSortCarbon;
 $('modalCarbonContext').textContent=`${transitContext?.places?.start||'Départ'} → ${transitContext?.places?.end||'Arrivée'} · ${label} · ${transitClock(d.q.instant)} (Paris). ${d.q.arrive?'Arrivée au plus tard à cette heure.':'Départ à partir de cette heure.'} Les temps comparés incluent l’attente ou la marge d’arrivée ; distances propres à chaque parcours.`;
 $('modalCarbonStatus').textContent=`${result.eligible} estimation(s) complète(s) admissible(s) dans le périmètre construction et énergie, pour ${persons===null?'un groupe à préciser':persons===1?'une personne':`le même groupe de ${persons} personnes`}.${result.canSortCarbon?' Un tri sur la part du groupe est disponible.':' Tri carbone indisponible : au moins deux estimations complètes de même périmètre sont nécessaires.'} Les sous-totaux partiels, modes indisponibles, références hors critères et périmètres différents restent hors de ce groupe. Aucun score ni recommandation globale.`;
 $('modalCarbonTables').innerHTML=modalCarbonTable(result.group,result.active?'Groupe comparable · construction et énergie':'Valeurs des modes admissibles')+(result.other.length?`<h4>${result.active?'Hors du groupe comparable':'Références hors critères ou modes indisponibles'}</h4>`+modalCarbonTable(result.other,'Valeurs hors du groupe'):'');
}
function bindModalCarbon(){
 $('transitCompareResults').addEventListener('click',e=>{if(e.target.closest('[data-modal-carbon-open]'))openModalCarbon()});
 $('modalCarbonClose').addEventListener('click',()=>clearModalCarbon(true));
 const change=e=>{
  if(!modalCarbonView||!modalCarbonContext())return;const t=e.target,v=modalCarbonView;
  if(t.matches('[data-modal-people]'))v.persons=t.value;
  else if(t.matches('[data-modal-fuel]')){v.fuel=t.value;v.car.factorId='';$('modalCarbonCar').innerHTML=modalCarOptions(v.fuel);const available=prospectiveFactors(v.fuel).length>0;$('modalCarbonCar').disabled=!available;$('modalCarbonFuelNote').textContent=available?'Modèle moyen à choisir ; aucune taille supposée.':'Aucun modèle compatible avec ce véhicule ou carburant.'}
  else if(t.matches('[data-modal-car]'))v.car.factorId=t.value;
  else if(t.matches('[data-modal-occupants]'))v.car.occupants=t.value;
  else if(t.matches('[data-modal-cycle]'))v.cycle=t.checked;
  else if(t.matches('[data-modal-option]')){const i=Number(t.dataset.modalOption),j=Number(t.dataset.modalLeg);if(!Number.isInteger(i)||!Number.isInteger(j)||!v.transit[i]||j<0||j>=v.transit[i].length)return;v.transit[i][j]=t.value}
  else return;refreshModalCarbon();
 };
 $('modalCarbonModels').addEventListener('change',change);
 $('modalCarbonModels').addEventListener('input',e=>{if(e.target.matches('[data-modal-occupants],[data-modal-people]'))change(e)});
 $('modalCarbonSort').addEventListener('change',()=>{if(!modalCarbonView||!modalCarbonContext())return;modalCarbonView.sort=$('modalCarbonSort').value;refreshModalCarbon()});
 for(const id of ['fuel','routeVehicle'])$(id).addEventListener('change',()=>{if(modalCarbonView)clearModalCarbon()});
}

let transitCarbonView=null;
function clearTransitCarbon(focus=false){
 const index=transitCarbonView?.index;transitCarbonView=null;$('transitCarbon').hidden=true;$('transitCarbonSteps').replaceChildren();$('transitCarbonResult').replaceChildren();
 if(focus&&index!==undefined)document.querySelector(`[data-transit-carbon="${index}"]`)?.focus();
}
function openTransitCarbon(index){
 const route=transitRoutes[index];if(busy||transitJob||!route)return;
 transitCarbonView={index,route,choices:route.legs.map(()=>'')};$('transitCarbon').hidden=false;$('transitCarbonTitle').textContent=transitReferencePrefix(transitRouteReview(route,transitCalculation))+`Empreinte · option ${index+1}`;
 $('transitCarbonSteps').innerHTML=route.legs.map((l,i)=>{const options=transitCarbonFactors(l.mode);return `<fieldset class="transit-carbon-step"><legend>Étape ${i+1} · ${TRANSIT_MODES[l.mode]}${l.mode==='WALK'?'':' '+escapeHtml(l.line)}</legend><p>${escapeHtml(l.fromName)} → ${escapeHtml(l.toName)} · ${fmt(l.distance/1000,3)} km</p>${options.length?`<label for="transitCarbonChoice${i}">Modèle moyen retenu pour l’étape ${i+1}</label><select id="transitCarbonChoice${i}" data-transit-factor="${i}"><option value="">Choisir un modèle — sinon non estimé</option>${options.map(f=>`<option value="${f.id}">${escapeHtml(f.label)}</option>`).join('')}</select><p class="note">Hypothèse choisie pour le calcul ; le nom de ligne ne confirme pas le véhicule ni sa motorisation.</p>`:`<p class="note">${l.mode==='WALK'?'Marche non estimée dans le jeu qualifié.':'Aucun facteur qualifié pour ce mode.'} Aucun zéro attribué.</p>`}</fieldset>`}).join('');
 refreshTransitCarbon();$('transitCarbonTitle').focus();$('transitCarbonTitle').scrollIntoView({block:'start'});
}
function refreshTransitCarbon(){
 const view=transitCarbonView;if(!view)return;if(transitRoutes[view.index]!==view.route){clearTransitCarbon();return}
 const e=estimateTransitCarbon(view.route,view.choices),amount=n=>carbonAmount(n),factorNumber=n=>new Intl.NumberFormat('fr-FR',{maximumFractionDigits:12}).format(n);
 const heading=e.status==='unavailable'?'Empreinte non estimée':e.status==='partial'?`Sous-total partiel : ${amount(e.subtotalKg)} pour une personne`:`Estimation des étapes : ${amount(e.totalKg)} pour une personne`;
 $('transitCarbonResult').innerHTML=`<h4>${heading}</h4><p>${e.estimatedSteps} étape(s) estimée(s) sur ${e.rows.length} · ${fmt(e.estimatedMeters/1000,3)} km concernés.${e.missingSteps?` ${e.missingSteps} étape(s) non estimée(s)${e.missingMeters!==null?`, soit ${fmt(e.missingMeters/1000,3)} km`:''}. Empreinte totale indisponible.`:''}</p>${e.subtotalKg===null?'':`<p>Postes connus : construction ${amount(e.constructionKg)} ; énergie ${amount(e.energyKg)}. Somme sans arrondi intermédiaire.</p>`}<ol>${e.rows.map(r=>`<li>Étape ${r.index+1} · ${r.status==='estimated'?`${escapeHtml(r.factor.label)} : <strong>${amount(r.valueKg)}</strong><details><summary>Distance, facteur et calcul</summary><p>${fmt(r.distanceMeters/1000,3)} km × ${factorNumber(r.factor.construction+r.factor.energy)} kg CO₂e/personne-km. Construction : ${factorNumber(r.factor.construction)} ; énergie : ${factorNumber(r.factor.energy)}, dans la même unité.</p><p>Distance du calculateur Mobilités M ; modèle moyen choisi. <a href="${r.factor.source}" target="_blank" rel="noopener noreferrer">Fiche du modèle Impact CO₂</a>.</p></details>`:escapeHtml(r.reason)}</li>`).join('')}</ol><p class="note">Construction et énergie modélisées ; périmètre non exhaustif. Fréquentation moyenne déjà incluse dans les facteurs par personne : aucune seconde division par l’occupation. Ni mesure des véhicules du réseau, ni classement carbone entre options.</p>`;
}
function bindTransitCarbon(){
 bindModalCarbon();
 $('transitCarbonSteps').addEventListener('change',ev=>{const select=ev.target.closest('[data-transit-factor]');if(!select||!transitCarbonView)return;const index=Number(select.dataset.transitFactor);if(!Number.isInteger(index)||index<0||index>=transitCarbonView.choices.length)return;transitCarbonView.choices[index]=select.value;refreshTransitCarbon()});
 $('transitCarbonClose').addEventListener('click',()=>clearTransitCarbon(true));
}

let pendingCollectiveJournal=null,collectiveJournalRows=[];
function collectiveJournalDraft(route,places,calculatedAt){
 const modes={WALK:'walk',BUS:'bus',RAIL:'train',TRAM:'tram',SUBWAY:'metro',FUNICULAR:'funicular',CABLE_CAR:'cable',GONDOLA:'cable'},now=new Date().toISOString();
 const steps=route.legs.map(l=>({mode:modes[l.mode]??'other',start:l.fromName,end:l.toName,line:l.mode==='WALK'?'':l.line,distanceMeters:l.distance??null}));
 const date=parisLocal(route.start).slice(0,10),distance=journalTotalDistance(steps);
 return {id:crypto.randomUUID(),date:date<=journalDay()?date:'',start:places.start,end:places.end,mode:'collective',distanceMeters:distance,distanceSource:distance===null?'unknown':'declared',note:'',createdAt:now,updatedAt:now,revision:1,calculation:null,emissions:unavailableCarbon(),emissionsHistory:[],collective:{version:1,origin:{source:'mobilites-m',calculatedAt,departure:new Date(route.start).toISOString(),arrival:new Date(route.end).toISOString(),start:places.start,end:places.end,steps:structuredClone(steps)},steps:steps.map(s=>({...s,id:crypto.randomUUID(),included:true,emissions:unavailableCarbon(),emissionsHistory:[]}))}};
}
function offerCollectiveJournal(draft){
 pendingCycleJournal=null;
 if($('transitDialog').open)$('transitDialog').close();if($('preparedDialog').open)$('preparedDialog').close();if($('bikesDialog').open)$('bikesDialog').close();
 pendingCollectiveJournal=draft;openJournal();
 if(journal.enabled&&!journalBlocked)usePendingCollectiveJournal();else if(!journalBlocked)$('journalMessage').textContent='Activer le journal pour examiner ce brouillon à étapes. Aucun déplacement n’a été enregistré.';
}
function usePendingCollectiveJournal(){if(!pendingCollectiveJournal||!journal.enabled||journalBlocked)return;const draft=pendingCollectiveJournal;pendingCollectiveJournal=null;renderJournal();journalForm(null,false,draft)}
function journalFromTransit(index){
 if(busy||transitJob||!transitRoutes[index]||!transitContext?.places||!transitCalculation)return;
 offerCollectiveJournal(collectiveJournalDraft(transitRoutes[index],transitContext.places,new Date(transitCalculation.now).toISOString()));
}
function configureCollectiveJournal(e){
 const on=journalIsStaged(e);$('journalCollectiveEditor').hidden=!on;$('journalMode').disabled=on;$('journalCollectiveMode').hidden=e.mode!=='collective';$('journalSharedMode').hidden=e.mode!=='shared';
 $('journalDistance').disabled=on;$('journalDistance').hidden=on;document.querySelector('label[for="journalDistance"]').hidden=on;$('journalDistanceNote').hidden=on;$('journalSingleCarbon').hidden=on;
 if(!on){collectiveJournalRows=[];return}
 $('carbonCalculate').checked=false;$('carbonFactor').required=false;$('carbonFactor').disabled=true;$('carbonOccupants').required=false;$('carbonOccupants').disabled=true;
 $('journalOrigin').textContent=e.mode==='shared'?sharedJournalOriginText(e.shared.origin,true):`Brouillon issu d’une préparation Mobilités M calculée le ${new Date(e.collective.origin.calculatedAt).toLocaleString('fr-FR')}, pour un départ prévu le ${savedTransitClock(Date.parse(e.collective.origin.departure))} (Paris). Les distances proposées sont théoriques : ajuster les étapes réellement effectuées. Aucune présence ni distance mesurée n’est attestée.`;
 collectiveJournalRows=journalChain(e).steps.map(step=>({step:structuredClone(step),calculate:false,factor:step.emissions.status==='estimated'?step.emissions.factor.id:''}));renderCollectiveJournalRows();
}
function renderCollectiveJournalRows(){
 $('journalCollectiveSteps').innerHTML=collectiveJournalRows.map((r,i)=>{const s=r.step,options=CARBON_DATA.factors.filter(f=>JOURNAL_STEP_FACTORS[s.mode].includes(f.id)),prefix='jc'+i;return `<fieldset class="transit-carbon-step" data-jc-row="${i}"><legend>Étape ${i+1}</legend><label class="journal-toggle"><input type="checkbox" data-jc="included" ${s.included?'checked':''}> Étape effectuée</label><label for="${prefix}mode">Mode de l’étape ${i+1}</label><select id="${prefix}mode" data-jc="mode">${Object.entries(journalStageModes(journalDraft.entry)).map(([k,v])=>`<option value="${k}" ${s.mode===k?'selected':''}>${v}</option>`).join('')}</select><label for="${prefix}start">Départ de l’étape ${i+1}</label><input id="${prefix}start" data-jc="start" maxlength="1000" value="${escapeHtml(s.start)}" required><label for="${prefix}end">Arrivée de l’étape ${i+1}</label><input id="${prefix}end" data-jc="end" maxlength="1000" value="${escapeHtml(s.end)}" required><label for="${prefix}line">${journalDraft.entry.mode==='shared'?'Repère':'Ligne'} (facultatif)</label><input id="${prefix}line" data-jc="line" maxlength="150" value="${escapeHtml(s.line)}"><label for="${prefix}distance">Distance de l’étape ${i+1} (km, facultatif)</label><input id="${prefix}distance" data-jc="distanceMeters" type="number" min="0" max="${journalDraft.entry.mode==='shared'?300:150}" step="any" inputmode="decimal" value="${s.distanceMeters===null?'':Number((s.distanceMeters/1000).toFixed(6))}"><p class="note">Vide : distance inconnue. Distance proposée issue de la préparation, à confirmer ou corriger.</p><label class="journal-toggle"><input type="checkbox" data-jc="calculate" ${r.calculate?'checked':''} ${!options.length||!s.included?'disabled':''}> Calculer ou actualiser l’empreinte de cette étape</label><label for="${prefix}factor">Modèle moyen choisi pour l’étape ${i+1}</label><select id="${prefix}factor" data-jc="factor" ${!r.calculate||!s.included?'disabled':''}><option value="">Choisir — sinon non estimé</option>${options.map(f=>`<option value="${f.id}" ${r.factor===f.id?'selected':''}>${escapeHtml(f.label)}</option>`).join('')}</select><p class="note">${options.length?(journalDraft.entry.mode==='shared'?'Modèle générique choisi pour une personne ; aucun modèle propre au service de location. Le choix électrique ne qualifie ni routage VAE ni batterie.':'Hypothèse explicite pour une personne ; aucune motorisation déduite du nom de ligne.'):'Aucun facteur qualifié pour ce mode ; pas de zéro supposé.'} ${s.emissions.status==='estimated'?'L’estimation précédente sera conservée si les données restent identiques ; une correction l’archive.':''}</p><button type="button" class="ghost" data-jc-up="${i}" ${i===0?'disabled':''}>Monter l’étape ${i+1}</button></fieldset>`}).join('');
 $('journalCollectiveAdd').disabled=collectiveJournalRows.length>=30;refreshCollectiveJournalPreview();
}
function readCollectiveJournalEntry(date,at){
 const e=structuredClone(journalDraft.entry);Object.assign(e,{date,start:$('journalStart').value.trim(),end:$('journalEnd').value.trim(),note:$('journalNote').value.trim(),updatedAt:at,revision:journalDraft.editing?e.revision+1:1});
 if(!journalDraft.editing)e.createdAt=at;
 journalChain(e).steps=collectiveJournalRows.map(r=>{const s=structuredClone(r.step),old=journalChain(journalDraft.entry).steps.find(x=>x.id===s.id)??{...s,emissions:unavailableCarbon(),emissionsHistory:[]};
  const input={...s,date};reviseCarbon(input,old,r.calculate&&s.included?{factorId:r.factor,occupants:1}:null,at);
  if(!s.included&&input.emissions.status==='estimated'){if(input.emissionsHistory.length>=50)throw new Error('Limite de 50 estimations historiques atteinte.');input.emissionsHistory.push({archivedAt:at,reason:'Correction des données du trajet',estimate:input.emissions});input.emissions=unavailableCarbon()}
  return {...s,emissions:input.emissions,emissionsHistory:input.emissionsHistory};
 });
 e.distanceMeters=journalTotalDistance(journalChain(e).steps.filter(s=>s.included));e.distanceSource=e.distanceMeters===null?'unknown':'declared';return validateJournal({version:3,enabled:true,entries:[e]}).entries[0];
}
function refreshCollectiveJournalPreview(){
 if(!journalIsStaged(journalDraft?.entry))return;
 try{const e=readCollectiveJournalEntry(journalDate($('journalDate').value),new Date().toISOString()),steps=journalSegments(e),estimated=steps.filter(currentCarbon),kg=estimated.reduce((n,s)=>n+s.emissions.valueKg,0);$('journalCollectivePreview').textContent=`Un trajet · ${steps.length} étape(s) effectuée(s) · ${fmt(journalKnownMeters(e)/1000,3)} km renseignés${e.distanceMeters===null?' · distance totale inconnue':''}. ${estimated.length?`${estimated.length<steps.length?'Sous-total partiel':'Estimation des étapes'} : ${e.mode==='shared'?Object.entries(steps.filter(currentCarbon).reduce((g,s)=>{const k=s.emissions.factor.scope;g[k]=(g[k]??0)+s.emissions.valueKg;return g},{})).map(([k,v])=>CARBON_SCOPES[k]+' : '+carbonAmount(v)).join(' ; '):carbonAmount(kg)} pour une personne, ${estimated.length}/${steps.length} étapes estimées.`:'CO₂e non estimé.'} Construction/énergie modélisées, sans empreinte exhaustive. Les estimations précédentes restent dans l’historique.`}
 catch(e){$('journalCollectivePreview').textContent=e.message}
}
function saveCollectiveJournalEntry(d,date){
 const e=readCollectiveJournalEntry(date,new Date().toISOString()),duplicates=journal.entries.filter(x=>x.id!==e.id&&journalIdentity(x)===journalIdentity(e));
 if(duplicates.length&&!$('journalRepeat').checked){$('journalDuplicate').hidden=false;$('journalDuplicateText').textContent=`${duplicates.length} trajet(s) similaire(s) à cette date. Vérifier le journal avant de confirmer un autre déplacement.`;$('journalRepeat').focus();return}
 const next={...journal,entries:d.editing?journal.entries.map(x=>x.id===e.id?e:x):[...journal.entries,e]};
 if(writeJournal(next)){journalDraft=null;collectiveJournalRows=[];$('journalEditor').hidden=true;$('journalMonth').value=e.date.slice(0,7);renderJournal();$('journalMessage').textContent=d.editing?'Trajet à étapes corrigé. Bilan recalculé.':'Trajet à étapes effectué enregistré.';$('journalNew').focus()}
}
function collectiveJournalDetails(e){
 if(e.mode==='shared')return sharedJournalDetails(e);
 const c=e.collective,o=c.origin,steps=journalSegments(e),estimated=steps.filter(currentCarbon),kg=estimated.reduce((n,s)=>n+s.emissions.valueKg,0);
 return `<p>${fmt(journalKnownMeters(e)/1000,3)} km renseignés · ${steps.length} étape(s) effectuée(s). ${e.distanceMeters===null?'Distance totale inconnue.':''} ${estimated.length?`${estimated.length<steps.length?'Sous-total carbone partiel':'Estimation des étapes'} : ${carbonAmount(kg)} (${estimated.length}/${steps.length} étapes, une personne).`:'Empreinte non estimée.'}</p><details><summary>Étapes déclarées et origine théorique</summary><p>Préparation Mobilités M calculée le ${escapeHtml(o.calculatedAt)}, départ prévu ${escapeHtml(o.departure)}, arrivée prévue ${escapeHtml(o.arrival)}. Ces heures ne certifient pas le déplacement effectué.</p><ol>${o.steps.map(s=>`<li>Prévu : ${JOURNAL_STEP_MODES[s.mode]} ${escapeHtml(s.line)} · ${escapeHtml(s.start)} → ${escapeHtml(s.end)} · ${s.distanceMeters===null?'distance inconnue':fmt(s.distanceMeters/1000,3)+' km'}.</li>`).join('')}</ol><ol>${c.steps.map(s=>`<li>${s.included?'Effectuée':'Non effectuée — exclue des totaux'} : ${JOURNAL_STEP_MODES[s.mode]} ${escapeHtml(s.line)} · ${escapeHtml(s.start)} → ${escapeHtml(s.end)} · ${s.distanceMeters===null?'distance inconnue':fmt(s.distanceMeters/1000,3)+' km'}${journalCarbonMarkup(s)}</li>`).join('')}</ol><p>Source de la préparation : <a href="https://data.mobilites-m.fr/donnees" target="_blank" rel="noopener noreferrer">Mobilités M / SMMAG · ODbL</a>. Distances ensuite déclarées ; aucun suivi GPS. Les étapes non effectuées et leurs historiques restent conservés hors bilan.</p></details>`;
}
function bindCollectiveJournal(){
 $('journalCollectivePending').addEventListener('click',usePendingCollectiveJournal);
 $('savedTransitJournal').addEventListener('click',()=>{const e=savedTransit.entries.find(x=>x.id===savedTransitSelected);if(e)offerCollectiveJournal(collectiveJournalDraft(e.snapshot.route,{start:e.places.start.label,end:e.places.end.label},e.snapshot.calculatedAt))});
 $('journalCollectiveSteps').addEventListener('input',ev=>{const field=ev.target.dataset.jc,row=ev.target.closest('[data-jc-row]');if(!field||!row)return;const i=Number(row.dataset.jcRow),r=collectiveJournalRows[i];if(!r)return;
  if(field==='calculate')r.calculate=ev.target.checked;else if(field==='factor')r.factor=ev.target.value;else if(field==='included')r.step.included=ev.target.checked;else if(field==='distanceMeters')r.step.distanceMeters=ev.target.value.trim()===''?null:Number(ev.target.value)*1000;else r.step[field]=ev.target.value;
  if(field==='mode'){r.factor='';r.calculate=false;r.step.distanceMeters=null}
  if(['mode','calculate','included'].includes(field)){if(!r.step.included)r.calculate=false;renderCollectiveJournalRows();document.querySelector(`[data-jc-row="${i}"] [data-jc="${field}"]`)?.focus()}else refreshCollectiveJournalPreview();
  $('journalConfirm').checked=false;
 });
 $('journalCollectiveSteps').addEventListener('click',ev=>{const b=ev.target.closest('[data-jc-up]');if(!b)return;const i=Number(b.dataset.jcUp);if(i>0){[collectiveJournalRows[i-1],collectiveJournalRows[i]]=[collectiveJournalRows[i],collectiveJournalRows[i-1]];renderCollectiveJournalRows();$('journalConfirm').checked=false;document.querySelector(`[data-jc-row="${i-1}"] [data-jc="mode"]`)?.focus()}});
 $('journalCollectiveAdd').addEventListener('click',()=>{if(collectiveJournalRows.length>=30)return;collectiveJournalRows.push({step:{id:crypto.randomUUID(),included:true,mode:'walk',start:collectiveJournalRows.at(-1)?.step.end??'',end:$('journalEnd').value,line:'',distanceMeters:null,emissions:unavailableCarbon(),emissionsHistory:[]},calculate:false,factor:''});renderCollectiveJournalRows();$('journalConfirm').checked=false;document.querySelector(`[data-jc-row="${collectiveJournalRows.length-1}"] [data-jc="start"]`)?.focus()});
 $('journalForm').addEventListener('input',ev=>{if(journalIsStaged(journalDraft?.entry)){if(['journalDate','journalStart','journalEnd','journalNote'].includes(ev.target.id)){$('journalConfirm').checked=false;refreshCollectiveJournalPreview()}}});
}

const SAVED_TRANSIT_KEY='dragonroute.transit-prepared.v2.'+PROFILE_SCOPE,SAVED_TRANSIT_LEGACY_KEY='dragonroute.transit-prepared.v1.'+PROFILE_SCOPE;
function transitStorageUnchanged(){return localStorage.getItem(SAVED_TRANSIT_KEY)===savedTransitRaw&&localStorage.getItem(SAVED_TRANSIT_LEGACY_KEY)===savedTransitLegacyRaw}
let savedTransit={kind:'dragonroute-transit-preparations',version:2,entries:[]},savedTransitRaw=null,savedTransitLegacyRaw=null,savedTransitBlocked=false,savedTransitDraft=null,savedTransitSelected=null,savedTransitImport=null,savedTransitSequence=0,transitCalculation=null;
const savedTransitClock=ms=>new Intl.DateTimeFormat('fr-FR',{timeZone:'Europe/Paris',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}).format(ms);
function loadSavedTransit(){
 savedTransit={kind:'dragonroute-transit-preparations',version:2,entries:[]};savedTransitBlocked=false;savedTransitRaw=null;savedTransitLegacyRaw=null;
 try{savedTransitRaw=localStorage.getItem(SAVED_TRANSIT_KEY);savedTransitLegacyRaw=localStorage.getItem(SAVED_TRANSIT_LEGACY_KEY);const raw=savedTransitRaw??savedTransitLegacyRaw;if(raw!==null)savedTransit=parseSavedTransitText(raw,savedTransitRaw!==null?2:1);$('savedTransitMessage').textContent=savedTransitRaw===null&&savedTransitLegacyRaw!==null?'Ancien format chargé sans plafond de correspondances. La prochaine sauvegarde utilise le format 2 ; l’original reste conservé et exportable.':''}catch{savedTransitBlocked=true;$('savedTransitMessage').textContent='Préparations collectives non chargées : données invalides, version inconnue ou stockage inaccessible. Aucun remplacement automatique.'}
}
function writeSavedTransit(next){
 try{if(savedTransitBlocked)throw new Error('Stockage collectif protégé.');if(!transitStorageUnchanged())throw new Error('Préparations collectives modifiées dans un autre onglet. Fermer puis rouvrir Mes trajets avant de réessayer.');const clean=validateSavedTransit(next),raw=JSON.stringify(clean);localStorage.setItem(SAVED_TRANSIT_KEY,raw);savedTransit=clean;savedTransitRaw=raw;return true}catch(e){$('savedTransitMessage').textContent='Enregistrement impossible. '+e.message;return false}
}
const PREPARED_TABS=[['preparedRoadTab','road','preparedRoadPanel'],['preparedTransitTab','transit','savedTransitPanel'],['preparedCycleTab','cycle','savedCyclePanel'],['preparedSharedTab','shared','savedSharedPanel']];
function setPreparedTab(kind,focus=false){
 if(kind!=='road')clearPreparedComparison('',true);
 if(kind!=='road'){preparedSequence++;preparedImport=null}if(kind!=='transit'){savedTransitSequence++;savedTransitImport=null}if(kind!=='cycle'){savedCycleSequence++;savedCycleImport=null}if(kind!=='shared'){savedSharedSequence++;savedSharedImport=null}
 for(const [id,key,panel] of PREPARED_TABS){const on=key===kind,b=$(id);b.setAttribute('aria-selected',String(on));b.tabIndex=on?0:-1;$(panel).hidden=!on;if(on&&focus)b.focus()}
}
function resetSavedTransit(){savedTransitSequence++;savedTransitDraft=null;savedTransitImport=null;savedTransitSelected=null;$('savedTransitEditor').hidden=true;loadSavedTransit();renderSavedTransit();setPreparedTab('road')}
function savedTransitDiagram(route){
 const paths=route.legs.filter(l=>l.points),points=paths.flatMap(l=>l.points);if(!points.length)return '<p class="note">Tracé non conservé ; les étapes restent consultables.</p>';
 const lat=points.map(p=>p[0]),lon=points.map(p=>p[1]),x=Math.min(...lon),y=Math.min(...lat),dx=Math.max(.001,Math.max(...lon)-x),dy=Math.max(.001,Math.max(...lat)-y),scale=Math.min(520/dx,180/dy),project=p=>[(p[1]-x)*scale+(600-dx*scale)/2,260-(p[0]-y)*scale-(260-dy*scale)/2];
 return `<svg class="prepared-schema" viewBox="0 0 600 260" role="img" aria-label="Schéma historique des étapes collectives, sans fond de carte">${paths.map(l=>`<polyline points="${l.points.map(p=>project(p).map(n=>n.toFixed(2)).join(',')).join(' ')}" fill="none" stroke="${l.mode==='WALK'?'#d2b8ff':'#80bdff'}" stroke-width="5" ${l.mode==='WALK'?'stroke-dasharray="5 7"':''}/>`).join('')}</svg><p class="note">Schéma sans échelle : marche en pointillés violets, transport en bleu.${paths.length!==route.legs.length?' Certaines étapes n’ont pas de tracé conservé.':''}</p>`;
}
function savedTransitDescription(e,diagram=false){
 const r=e.snapshot.route;return `<h3>${escapeHtml(e.name)}</h3><p>${escapeHtml(e.places.start.label)} → ${escapeHtml(e.places.end.label)}</p><p class="note">Enregistré le ${savedTransitClock(Date.parse(e.savedAt))}. Calcul consulté le ${savedTransitClock(Date.parse(e.snapshot.calculatedAt))}. Heure de Paris.</p><p><strong>Instantané théorique du ${savedTransitClock(r.start)} au ${savedTransitClock(r.end)} · ${transitMinutes(r.duration)}.</strong> Cette sauvegarde ne confirme pas les horaires actuels.</p><p>Demande : ${e.criteria.direction==='arrive'?'arrivée au plus tard':'départ à partir du'} ${escapeHtml(e.criteria.when.replace('T',' '))} (Paris), marche totale maximale ${e.criteria.walk} m. ${r.transfers} correspondance(s), ${Math.ceil(r.walk)} m à pied.</p><p class="app-notice">${escapeHtml(transitTransferReview(r,e.criteria).reason)}</p><ol class="transit-legs">${r.legs.map(l=>`${l.wait?`<li>Attente : ${transitMinutes(l.wait)} à ${escapeHtml(l.fromName)}</li>`:''}<li><strong>${savedTransitClock(l.start)} → ${savedTransitClock(l.end)} · ${TRANSIT_MODES[l.mode]} ${l.mode==='WALK'?'':escapeHtml(l.line)}</strong><br>${escapeHtml(l.fromName)} → ${escapeHtml(l.toName)}${l.mode==='WALK'?'':`<br>Direction : ${escapeHtml(l.direction)} · ${escapeHtml(l.agency)}`}</li>`).join('')}</ol>${diagram?savedTransitDiagram(r):''}<p class="note">Source déclarée : <a href="https://data.mobilites-m.fr/donnees" target="_blank" rel="noopener noreferrer">Mobilités M / SMMAG · ODbL</a>. Pilote Grenoble. Prix et accessibilité inconnus ; aucune réservation. Retards et perturbations non conservés. Un import reste déclaratif : format contrôlé, circulation réelle non attestée.</p>`;
}
function renderSavedTransit(){
 for(const id of ['savedTransitExport','savedTransitImportFile','savedTransitBackup'])$(id).disabled=savedTransitBlocked;
 $('savedTransitRawExport').hidden=!savedTransitBlocked||(savedTransitRaw??savedTransitLegacyRaw)===null;$('savedTransitLegacyExport').hidden=savedTransitLegacyRaw===null;
 $('savedTransitList').innerHTML=savedTransit.entries.length?savedTransit.entries.map(e=>`<article class="saved-row"><strong>${escapeHtml(e.name)}</strong><p>${escapeHtml(e.places.start.label)} → ${escapeHtml(e.places.end.label)}</p><p>Collectif · départ historique ${savedTransitClock(e.snapshot.route.start)} · ${transitMinutes(e.snapshot.route.duration)}</p><div class="row-actions"><button type="button" class="ghost" data-saved-transit-show="${e.id}">Consulter</button><button type="button" class="ghost" data-saved-transit-rename="${e.id}">Renommer</button><button type="button" class="ghost" data-saved-transit-delete="${e.id}">Supprimer</button></div></article>`).join(''):'<p class="note">Aucune préparation collective chargée. Après une recherche collective, choisir « Enregistrer cette option ».</p>';
 const selected=savedTransit.entries.find(e=>e.id===savedTransitSelected);$('savedTransitView').hidden=!selected;$('savedTransitDetails').innerHTML=selected?savedTransitDescription(selected,true):'';
}
function editSavedTransit(entry,mode){savedTransitDraft={entry,mode};$('savedTransitEditor').hidden=false;$('savedTransitEditorTitle').textContent=mode==='rename'?'Renommer la préparation collective':'Enregistrer la préparation collective';$('savedTransitName').value=entry.name;$('savedTransitConfirm').checked=false;$('savedTransitDuplicate').checked=false;updateSavedTransitDraft();$('savedTransitName').focus()}
function updateSavedTransitDraft(){
 if(!savedTransitDraft)return;const entry={...savedTransitDraft.entry,name:$('savedTransitName').value},duplicates=savedTransitDuplicates(entry,savedTransit.entries);$('savedTransitDuplicateRow').hidden=!duplicates.length;$('savedTransitDuplicateNote').textContent=duplicates.length?'Ce nom ou ces paramètres figurent déjà dans les préparations collectives. Aucun remplacement automatique.':'';$('savedTransitSave').disabled=savedTransitBlocked||!entry.name.trim()||!$('savedTransitConfirm').checked||(duplicates.length&&!$('savedTransitDuplicate').checked);
}
function saveTransitOption(index){
 if(busy||transitJob||!transitRoutes[index]||!transitCalculation||transitCalculation.transferError||!transitContext?.places)return;
 try{const q=transitCalculation,c=transitContext,entry=validateSavedTransitEntry({id:crypto.randomUUID(),name:(c.places.start+' → '+c.places.end).slice(0,80),savedAt:new Date().toISOString(),places:{start:{label:c.places.start,lat:c.a[0],lon:c.a[1]},end:{label:c.places.end,lat:c.b[0],lon:c.b[1]}},criteria:{when:q.when,direction:q.arrive?'arrive':'depart',walk:q.walk,...readTransitTransfers()},snapshot:{source:'mobilites-m',calculatedAt:new Date(q.now).toISOString(),route:structuredClone(transitRoutes[index])}});clearTransit();$('transitDialog').close();openPreparedTrips();setPreparedTab('transit');editSavedTransit(entry,'new')}catch(e){$('transitStatus').textContent='Sauvegarde impossible. '+e.message}
}
function resumeSavedTransit(e){
 if(busy)return;
 clearTransit();transitContext={inputs:[e.places.start.label,e.places.end.label],signature:transitInputSignature(),a:[e.places.start.lat,e.places.start.lon],b:[e.places.end.lat,e.places.end.lon],places:{start:e.places.start.label,end:e.places.end.label}};showTransitPlaces();$('transitDirection').value=e.criteria.direction;$('transitWalk').value=String(e.criteria.walk);$('transitMaxTransfers').value=e.criteria.maxTransfers===null?'':String(e.criteria.maxTransfers);$('transitTransferRule').value=e.criteria.transferStrict?'strict':'soft';$('transitCompare').checked=false;
 const t=departureInstant(e.criteria.when),valid=!t.error&&t.instant>Date.now()&&t.instant<=Date.now()+30*864e5;$('transitWhen').value=valid?e.criteria.when:'';
 $('preparedDialog').close();$('transitDialog').showModal();$('transitStatus').textContent=`Préparation « ${e.name} » reprise : lieux mémorisés, aucun nouveau calcul. ${valid?'Vérifier les critères puis lancer la recherche.':'La date conservée est passée ou hors de la fenêtre de recherche : choisir une nouvelle date.'}`;$(valid?'transitTitle':'transitWhen').focus();
}
function bindSavedTransit(){
 for(const [index,[id,kind]] of PREPARED_TABS.entries()){const b=$(id);b.addEventListener('click',()=>setPreparedTab(kind));b.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const next=e.key==='Home'?0:e.key==='End'?PREPARED_TABS.length-1:(index+(e.key==='ArrowRight'?1:PREPARED_TABS.length-1))%PREPARED_TABS.length;setPreparedTab(PREPARED_TABS[next][1],true)}})}
 $('savedTransitName').addEventListener('input',()=>{$('savedTransitConfirm').checked=false;$('savedTransitDuplicate').checked=false;updateSavedTransitDraft()});for(const id of ['savedTransitConfirm','savedTransitDuplicate'])$(id).addEventListener('change',updateSavedTransitDraft);
 $('savedTransitForm').addEventListener('submit',e=>{e.preventDefault();if(!savedTransitDraft)return;try{const entry=validateSavedTransitEntry({...savedTransitDraft.entry,name:$('savedTransitName').value});if(!$('savedTransitConfirm').checked||(savedTransitDuplicates(entry,savedTransit.entries).length&&!$('savedTransitDuplicate').checked))throw new Error('Confirmer la sauvegarde et le doublon éventuel.');const entries=savedTransitDraft.mode==='rename'?savedTransit.entries.map(x=>x.id===entry.id?entry:x):[...savedTransit.entries,entry];if(writeSavedTransit({...savedTransit,entries})){savedTransitDraft=null;savedTransitSelected=entry.id;$('savedTransitEditor').hidden=true;renderSavedTransit();$('savedTransitMessage').textContent='Préparation collective enregistrée dans ce navigateur.';$('savedTransitView').scrollIntoView({block:'start'})}}catch(err){$('savedTransitMessage').textContent=err.message}});
 $('savedTransitList').addEventListener('click',ev=>{const b=ev.target.closest('button');if(!b)return;const id=b.dataset.savedTransitShow||b.dataset.savedTransitRename||b.dataset.savedTransitDelete,e=savedTransit.entries.find(x=>x.id===id);if(!e)return;if(b.dataset.savedTransitRename)editSavedTransit(structuredClone(e),'rename');else if(b.dataset.savedTransitShow){savedTransitDraft=null;$('savedTransitEditor').hidden=true;savedTransitSelected=id;renderSavedTransit();$('savedTransitView').scrollIntoView({block:'start'})}else if(confirm(`Supprimer la préparation collective « ${e.name} » ?`)&&writeSavedTransit({...savedTransit,entries:savedTransit.entries.filter(x=>x.id!==id)})){savedTransitSelected=null;savedTransitDraft=null;$('savedTransitEditor').hidden=true;renderSavedTransit();$('savedTransitMessage').textContent='Préparation collective supprimée.'}});
 $('savedTransitResume').addEventListener('click',()=>{const e=savedTransit.entries.find(x=>x.id===savedTransitSelected);if(e)resumeSavedTransit(e)});
 for(const id of ['savedTransitExport','savedTransitBackup'])$(id).addEventListener('click',()=>{if(!savedTransitBlocked)downloadProfile(savedTransit,'OuQuandQui-preparations-collectives.json')});
 $('savedTransitRawExport').addEventListener('click',()=>{const raw=savedTransitRaw??savedTransitLegacyRaw;if(raw!==null)downloadCycleText(raw,'OuQuandQui-collectif-original-non-valide.json')});
 $('savedTransitLegacyExport').addEventListener('click',()=>{if(savedTransitLegacyRaw!==null)downloadCycleText(savedTransitLegacyRaw,'OuQuandQui-collectif-original-v1.json')});
 $('savedTransitErase').addEventListener('click',()=>{if(!confirm('Effacer les préparations collectives et leurs copies anciennes de cet environnement ? Exporter une copie avant de confirmer. Les autres rubriques restent conservées.'))return;try{if(!transitStorageUnchanged())throw new Error('Données modifiées dans un autre onglet : fermer puis rouvrir Mes trajets.');localStorage.removeItem(SAVED_TRANSIT_KEY);localStorage.removeItem(SAVED_TRANSIT_LEGACY_KEY);resetSavedTransit();setPreparedTab('transit');$('savedTransitMessage').textContent='Préparations collectives effacées.'}catch(e){$('savedTransitMessage').textContent='Effacement impossible. '+e.message}});
 $('savedTransitImportFile').addEventListener('change',async e=>{const seq=++savedTransitSequence,file=e.target.files?.[0];e.target.value='';savedTransitImport=null;if(!file)return;try{if(savedTransitBlocked)throw new Error('Stockage collectif protégé.');if(file.size>2000000)throw new Error('Fichier supérieur à 2 Mo.');const data=parseSavedTransitText(await file.text());if(seq!==savedTransitSequence||!$('preparedDialog').open)return;savedTransitImport=data;$('savedTransitImportSummary').textContent=`${file.name} : ${data.entries.length} préparation(s) collective(s), en remplacement des ${savedTransit.entries.length} chargées.${data.entries.length?'':' Le fichier est vide ; la liste collective deviendra vide.'} Les préparations routières restent conservées.`;$('savedTransitImportDetails').innerHTML=data.entries.map(x=>`<details><summary>${escapeHtml(x.name)}</summary>${savedTransitDescription(x)}</details>`).join('');$('savedTransitImportConfirm').checked=false;$('savedTransitImportApply').disabled=true;$('savedTransitImportMessage').textContent='';$('savedTransitImportDialog').showModal()}catch(err){if(seq===savedTransitSequence)$('savedTransitMessage').textContent='Import collectif refusé. '+err.message}});
 $('savedTransitImportConfirm').addEventListener('change',()=>{$('savedTransitImportApply').disabled=!savedTransitImport||!$('savedTransitImportConfirm').checked});
 $('savedTransitImportApply').addEventListener('click',()=>{if(!savedTransitImport||!$('savedTransitImportConfirm').checked)return;if(writeSavedTransit(savedTransitImport)){savedTransitImport=null;savedTransitDraft=null;savedTransitSelected=null;$('savedTransitEditor').hidden=true;renderSavedTransit();$('savedTransitImportDialog').close();$('savedTransitMessage').textContent='Préparations collectives restaurées, aucun calcul ni appel réseau.'}else $('savedTransitImportMessage').textContent=$('savedTransitMessage').textContent});
 const cancel=()=>{savedTransitSequence++;savedTransitImport=null};$('savedTransitImportDialog').addEventListener('cancel',cancel);$('savedTransitImportDialog').querySelector('.close-dialog').addEventListener('click',cancel);$('savedTransitImportDialog').addEventListener('close',()=>{if($('savedTransitImportDialog').open)return;cancel();if($('preparedDialog').open)$('savedTransitImportFile').focus()});$('preparedDialog').addEventListener('close',()=>{cancel();savedTransitDraft=null;if(!document.querySelector('dialog[open]'))$('preparedBtn').focus()});
}

function updateBudget(){
  updateTransitContext();
  expireStationBudget();
  updateTripTiming();updateRouteCarbon();updateMeetings();
  $("compareBtn").hidden=!trip;
  $("roadCompareBtn").hidden=!trip||trip.routing.vehicle.type==='walk';
  $("navigationBtn").hidden=!trip;
  $("journalRecordBtn").hidden=!trip;$("savePreparationBtn").hidden=!trip;
  $("tripBudget").hidden=!trip||trip.routing.vehicle.type==="walk";
  updateWalking();
  const usable=selectedStop&&stationFreshness(selectedStop.station).eligible;
  $("useStationPrice").disabled=busy||!usable;
  $("stationPriceBudgetNote").hidden=!selectedStop&&!budgetReference?.expired;
  $("stationPriceBudgetNote").textContent=budgetReference?.expired?"Prix de station retiré du budget : ancien ou non vérifiable. Rechercher les prix à nouveau, ou saisir une hypothèse personnelle.":selectedStop?stationPriceText(selectedStop.station)+(usable?". Prix déclaré, sans garantie sur place.":". Arrêt conservé ; prix exclu du budget."):"";
  syncTableTolls();syncTolls();renderBudgetMemory();
  updateRides();
  if(!trip||trip.routing.vehicle.type==="walk")return;
  const r=selectedStop?.via||trip.base,cons=Number($("cons").value),price=Number($("budgetPrice").value);
  const liters=Number.isFinite(cons)&&cons>=1&&cons<=100?r.distance/1000*cons/100:null;
  const validPrice=$("budgetPrice").value.trim()&&Number.isFinite(price)&&price>0&&price<=10;
  $("budgetRoute").textContent=`${fmt(r.distance/1000,1)} km · ${currentDurationText(r.duration)}${trip.meetings?" · rencontres incluses":""}`;
  renderTolls(validPrice&&liters!==null?liters*price:null);
  $("budgetFuel").textContent=liters===null?"Consommation à vérifier":`${fmt(liters,2)} L${validPrice?` · ${fmt(liters*price)} €`:" · prix à renseigner"}`;
  $("budgetSource").textContent=validPrice?(budgetReference?`${budgetReference.label} · ${$("fuel").value} · ${fmt(price,3)} €/L · ${budgetReference.stationId?priceAgeText(budgetReference.updated,budgetReference.receivedAt):budgetReference.at}`:`Prix saisi · ${$("fuel").value} · ${fmt(price,3)} €/L`):"Prix de référence non renseigné ou invalide. Aucun prix moyen supposé.";
}
function navigationLinks(){
  if(!trip||!["car","walk"].includes(trip.routing.vehicle.type))return null;
  const google=new URL("https://www.google.com/maps/dir/");
  google.search=new URLSearchParams({api:"1",origin:trip.a.join(","),destination:trip.b.join(","),travelmode:trip.routing.vehicle.type==="walk"?"walking":"driving"}).toString();
  const steps=routePlanNodes(selectedStop?.station).slice(1,-1);if(steps.length)google.searchParams.set("waypoints",steps.map(n=>n.point.join(",")).join("|"));
  if(trip.routing.avoid.length)google.searchParams.set("avoid",trip.routing.avoid.map(v=>v==="tollways"?"tolls":v).join(","));
  const waze=point=>{
    const url=new URL("https://www.waze.com/ul");
    url.search=new URLSearchParams({ll:point.join(","),navigate:"yes",utm_source:"dragonroute",vehicle_type:"private"}).toString();
    for(const rule of trip.routing.avoid)url.searchParams.set({tollways:"avoid_tolls",highways:"avoid_freeways",ferries:"avoid_ferries"}[rule],"true");
    return url.href;
  };
  return {pickup:trip.meetings?waze([trip.meetings.pickup.lat,trip.meetings.pickup.lon]):null,dropoff:trip.meetings?waze([trip.meetings.dropoff.lat,trip.meetings.dropoff.lon]):null,google:google.href,arrival:trip.routing.vehicle.type==="walk"?null:waze(trip.b),station:selectedStop?waze([selectedStop.station.lat,selectedStop.station.lon]):null};
}
function clearNavigation(){
  $("navigationDialog").close();
  for(const id of ["googleMapsLink","wazeStationLink","wazeArrivalLink","wazePickupLink","wazeDropoffLink"])$(id).removeAttribute("href");
  $("navigationSummary").textContent="";$("navigationOptimizationNote").textContent="";$("navigationMessage").textContent="";
}
function openNavigation(){
  if(busy||!trip)return;
  const r=selectedStop?.via||trip.base,links=navigationLinks();
  $("navigationSummary").textContent=`${trip.places.start} → ${trip.places.end}${selectedStop?" · arrêt : "+selectedStop.station.address:""} · ${fmt(r.distance/1000,1)} km · ${currentDurationText(r.duration)}. Hors autres pauses.`;
  if(trip.meetings)$("navigationSummary").textContent+=" Ordre : "+$("meetingOrder").textContent;
  $("navigationCarLinks").hidden=!links;$("navigationVehicleNote").hidden=Boolean(links);
  for(const [id,url] of [["wazePickupLink",links?.pickup],["wazeDropoffLink",links?.dropoff],["googleMapsLink",links?.google],["wazeArrivalLink",links?.arrival],["wazeStationLink",links?.station]]){
    if(url)$(id).href=url;else $(id).removeAttribute("href");
  }
  $("wazeStationLink").hidden=!links?.station;$("wazePickupLink").hidden=!links?.pickup;$("wazeDropoffLink").hidden=!links?.dropoff;
  $('navigationWaze').hidden=trip.routing.vehicle.type==='walk';
  $('googleMapsNote').textContent=trip.routing.vehicle.type==='walk'?'Reçoit le départ, l’arrivée et le mode à pied. Google Maps recalcule son propre trajet : le tracé, la limite personnelle et l’accessibilité ne sont pas transmis.':'Reçoit le départ, l’arrivée et les étapes dans l’ordre indiqué (rencontres et station, au maximum trois). Le parcours est recalculé : vérifier que chaque étape est conservée.';
  $("navigationAvoidNote").textContent=trip.routing.vehicle.type==="walk"?"Mode à pied demandé. Vérifier le parcours proposé et les conditions sur place.":trip.routing.avoid.length?`Préférences transmises : éviter ${trip.routing.avoid.map(v=>avoidLabels[v]).join(", ")}. Ce sont des demandes au service externe, pas une garantie de les exclure.`:"Aucun évitement demandé ici. Vérifier les préférences de l’application externe.";
  $("navigationOptimizationNote").textContent=optimizationLabel(trip.routing.optimization)+". Les liens Google Maps et Waze ne transmettent pas ce critère : vérifier leur nouveau parcours. Le fichier GPX conserve le tracé et décrit le critère, sans imposer de réglage à l’application destinataire.";$("navigationMessage").textContent="";$("navigationDialog").showModal();
}
function gpxSnapshot(){
  if(!trip)throw new Error("Calculer un trajet avant de l’exporter.");
  const r=selectedStop?.via||trip.base;
  if(!hasRouteGeometry(r)||!hasRouteMetrics(r))throw new Error("Tracé incomplet : export impossible.");
  const xml=value=>escapeHtml(String(value).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g,""));
  const point=([lon,lat])=>{
    if(!Number.isFinite(lat)||!Number.isFinite(lon)||Math.abs(lat)>90||lon< -180||lon>=180)throw new Error("Coordonnées incompatibles avec le format GPX.");
    return `lat="${lat.toFixed(8)}" lon="${lon.toFixed(8)}"`;
  };
  const title=trip.places.start+" → "+trip.places.end;
  const description=`Tracé préparé, non relevé GPS. ${routingLabel(trip.routing)}. ${fmt(r.distance/1000,1)} km ; ${currentDurationText(r.duration)}. Pause déclarative, non transmise aux liens externes et sans heures de passage GPX. Calcul initial : ${trip.calculatedAt}.${selectedStop?" Arrêt confirmé : "+selectedStop.confirmedAt+".":""} Ce fichier ne contient pas de devis de péages. Les contraintes ne sont pas des réglages de navigation GPX.`;
  const labels={start:'Départ : '+trip.places.start,end:'Arrivée : '+trip.places.end,pickup:'Prise en charge : '+trip.meetings?.pickup.label,dropoff:'Dépose : '+trip.meetings?.dropoff.label,station:'Arrêt carburant : '+selectedStop?.station.address};
  const waypoints=routePlanNodes(selectedStop?.station).map(n=>({coords:[n.point[1],n.point[0]],name:labels[n.kind]}));
  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="DragonRoute" xmlns="http://www.topografix.com/GPX/1/1">
<metadata><name>${xml(title)}</name><desc>${xml(description)}</desc><time>${new Date().toISOString()}</time></metadata>
${waypoints.map(p=>`<wpt ${point(p.coords)}><name>${xml(p.name)}</name></wpt>`).join("\n")}
<trk><name>${xml(title)}</name><desc>${xml(description)}</desc><src>${xml(routingLabel(trip.routing))}</src><trkseg>
${r.geometry.coordinates.map(p=>`<trkpt ${point(p)}></trkpt>`).join("\n")}
</trkseg></trk></gpx>`;
}
function exportGpx(){
  if(busy)return;
  try{
    const content=gpxSnapshot(),blob=new Blob([content],{type:"application/gpx+xml;charset=utf-8"});
    const url=URL.createObjectURL(blob),a=document.createElement("a");
    a.href=url;a.download="DragonRoute_trajet_"+new Date().toISOString().replace(/[:.]/g,"-")+".gpx";
    document.body.appendChild(a);
    try{a.click()}finally{a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000)}
    $("navigationMessage").textContent="Téléchargement demandé. Ce fichier décrit le trajet préparé ; il ne met pas à jour les conditions de circulation.";
  }catch(e){$("navigationMessage").textContent=e.message}
}
function invalidateStationPrice(){
  if(budgetReference?.stationId){budgetReference=null;$("budgetPrice").value=""}
}
function updateTripMetrics(){
  if(!trip)return;
  const r=selectedStop?.via||trip.base;
  $("tripKm").textContent=`${fmt(r.distance/1000,1)} km`;$("tripTime").textContent=`${Math.round(r.duration/60)} min`;
  updateBudget();
}
// BEGIN ROUTE VARIANTS MODEL
function distinctRouteChoices(base,limit=3){
 const cap=Number.isInteger(limit)&&limit>=1&&limit<=3?limit:3,seen=new Set(),choices=[];
 for(const r of [base,...(Array.isArray(base?.alternatives)?base.alternatives:[])]){
  if(!hasRouteGeometry(r)||!hasRouteMetrics(r))continue;
  const key=JSON.stringify(r.geometry.coordinates.map(p=>p.slice(0,2)));
  if(seen.has(key))continue;seen.add(key);choices.push({...r,alternatives:[]});if(choices.length===cap)break;
 }
 return choices;
}
function routeVariantAnchor(route,index){
 const points=route.geometry.coordinates,segments=points.slice(1).map((p,i)=>Math.hypot(p[0]-points[i][0],p[1]-points[i][1])),total=segments.reduce((a,b)=>a+b,0),target=total*(.3+.2*index);let at=0;
 for(let i=0;i<segments.length;i++){const length=segments[i];if(length&&at+length>=target){const t=(target-at)/length,a=points[i],b=points[i+1];return [a[1]+(b[1]-a[1])*t,a[0]+(b[0]-a[0])*t]}at+=length}
 return [points[0][1],points[0][0]];
}
// END ROUTE VARIANTS MODEL
let routeChoiceProposal=null;
function routeChoiceText(r,i){return `Trajet ${i+1} · ${fmt(r.distance/1000,1)} km · ${fmt(r.duration/60,1)} min de conduite estimée`}
function routeChoiceSignature(){return JSON.stringify([roadContextSignature(),trip?.choices,selectedStop?.via,tableTolls.segments,tollState.quote,...[...$('sheet').querySelectorAll('input,select')].map(el=>[el.id,el.value,el.checked])])}
function renderRouteChoices(){
 const choices=trip?.choices||[];$('routeChoices').hidden=choices.length<2;
 $('routeChoices').innerHTML=choices.length<2?'':`<legend>Comparer les trajets reçus</legend><p class="note">Bleu foncé : trajet retenu. Bleu clair : autres propositions. Les repères T1, T2… correspondent à cette liste. Ouvrir un choix pour comparer avant confirmation.</p>${choices.map((r,i)=>`<button type="button" class="ghost route-choice" data-route-choice="${i}" aria-pressed="${i===trip.choice}" aria-haspopup="dialog"><span class="route-number">T${i+1}</span><span>${escapeHtml(routeChoiceText(r,i))}${i===trip.choice?' · référence actuelle':''}</span></button>`).join('')}`;
}
function closeRouteChoice(message=''){
 const op=routeChoiceProposal;routeChoiceProposal=null;if($('routeChoiceDialog').open)$('routeChoiceDialog').close();
 if(op){const target=op.focus?.isConnected?op.focus:document.querySelector(`[data-route-choice="${trip?.choice}"]`);if(target&&!target.disabled)target.focus();if(message)setStatus(message)}
}
function chooseRoute(index,focus=document.activeElement){
 if(busy||!trip||!Number.isInteger(index)||!trip.choices[index]||index===trip.choice)return;
 cancelGps();closeRouteChoice();const r=trip.choices[index],current=selectedStop?.via||trip.base,delta=stationPreviewDelta(current,r);
 routeChoiceProposal={trip,index,route:r,signature:routeChoiceSignature(),focus};
 $('routeChoiceContext').textContent=routingLabel(trip.routing)+' · calcul obtenu le '+new Date(trip.calculatedAt).toLocaleString('fr-FR')+'. Le choix réutilise cette proposition reçue, sans nouveau calcul.';
 $('routeChoiceMetrics').innerHTML=`<section><h3>Trajet actuel${selectedStop?' · avec station':''}</h3><p>${fmt(current.distance/1000,1)} km · ${fmt(current.duration/60,1)} min de conduite</p></section><section><h3>Proposition T${index+1}</h3><p>${fmt(r.distance/1000,1)} km · ${fmt(r.duration/60,1)} min de conduite</p></section>`;
 const signed=v=>(v>0?'+':'')+fmt(v,1);$('routeChoiceDifference').textContent=`Écart : ${signed(delta.km)} km · ${signed(delta.minutes)} min de conduite. Hors pauses et trafic en direct.`;
 const effects=[];if(compared.length||selectedStop)effects.push('Les stations comparées et l’arrêt choisi seront retirés.');if(trip.meetings||$('meetingPickup').value.trim()||$('meetingDropoff').value.trim())effects.push('Les rencontres et leur brouillon seront retirés de ce trajet direct.');
 effects.push('Les péages liés au trajet précédent devront être vérifiés à nouveau. Leur montant n’est pas supposé nul.');
 if(budgetReference?.stationId)effects.push('Le prix provenant de l’arrêt retiré ne sera pas repris.');else effects.push('Les hypothèses personnelles de consommation et de prix sont conservées pour recalculer le carburant.');
 effects.push('Les horaires seront réévalués. Les préparations enregistrées restent inchangées.');$('routeChoiceEffects').replaceChildren(...effects.map(text=>{const li=document.createElement('li');li.textContent=text;return li}));
 $('routeChoiceConfirm').textContent=`Confirmer le trajet ${index+1}`;$('routeChoiceDialog').showModal();$('routeChoiceTitle').focus();
}
function adoptRouteChoice(){
 const op=routeChoiceProposal;if(!op||busy)return;
 if(trip!==op.trip||routeChoiceSignature()!==op.signature||trip.choices[op.index]!==op.route){closeRouteChoice('Choix périmé : le contexte a changé. Comparer à nouveau les trajets.');return}
 const index=op.index;closeRouteChoice();clearRoadChoices();clearComparison();clearMeetingDraft();clearNavigation();
 tollState.enabled=false;tollState.key='';resetTollQuote();clearTableTolls('Nouveau trajet : péages à vérifier.');
 trip.choice=index;trip.base={...trip.choices[index],alternatives:trip.choices.filter((_,i)=>i!==index)};delete trip.meetings;
 trip.coords=trip.base.geometry.coordinates.map(([lon,lat])=>[lat,lon]);clearStations();renderRouteChoices();updateWindow();updateTripMetrics();
 document.querySelector(`[data-route-choice="${index}"]`)?.focus();setStatus('Trajet choisi. Les stations seront recherchées sur ce trajet.','ok');
}
$('routeChoiceCancel').addEventListener('click',()=>closeRouteChoice());
$('routeChoiceClose').addEventListener('click',()=>closeRouteChoice());
$('routeChoiceConfirm').addEventListener('click',adoptRouteChoice);
$('routeChoiceDialog').addEventListener('cancel',e=>{e.preventDefault();closeRouteChoice()});
$('routeChoiceDialog').addEventListener('close',()=>{if(!$('routeChoiceDialog').open&&routeChoiceProposal)closeRouteChoice()});
function clearStations(){
  closeStationPreview();
  closeStationPicker(false);stationDetailReturn=null;if($('stationDialog').open)$('stationDialog').close();$('stationMapTools').hidden=true;
  if(stationJob){stationJob.controller.abort();stationJob.invalid=true}
  $("stationContinuation").hidden=true;$("stationEmpty").hidden=true;
  selectedStop=null;invalidateStationPrice();
  compared=[];stationSearch=null;updateResumePreparation();
  for(const id of ["stationCoverage","stationFilterStatus","filteredStopNote"])$(id).hidden=true;
  $("eligibleCount").textContent="—";
  $("stationCards").replaceChildren();$("stationSummary").hidden=true;$("selectedStop").hidden=true;
  $("removeStopBtn").hidden=true;
  $("stationListControls").hidden=true;
  $("stationCount").textContent="—";$("testedCount").textContent="—";$("fuelStatus").textContent="";
  health("hFuel","","carburants");updatePreparationReadout();
  if(trip)showOnMap(trip.coords,[],null,trip.a,trip.b,trip.label);
  updateTripMetrics();updateBudget();
}
function clearResults(){
 closeRouteChoice();
 clearRoadChoices();if($('roadCompareDialog').open)$('roadCompareDialog').close();
 budgetRecall=null;$("budgetMemoryMessage").textContent='';
  cancelGps();
  clearTransit();transitContext=null;if($("transitDialog").open)$("transitDialog").close();
  clearComparison();
  clearNavigation();
  trip=null;meetingProposal=null;mapView=null;clearStations();
  renderRouteChoices();
  $("summary").hidden=true;$("stops").hidden=true;
  $("resolvedPlaces").hidden=true;
  $("tripKm").textContent="—";$("tripTime").textContent="—";
  for(const id of ["routeLine","routeGlow"])$(id).setAttribute("d","");
  $("alternativeRoutes").replaceChildren();$("routeVariantMarkers").replaceChildren();$("routeAlternativesNote").hidden=true;
  $("appliedRouting").hidden=true;$("routingAttribution").textContent="OSRM / IGN / OpenRouteService";
  $("stationDots").replaceChildren();$("meetingDots").replaceChildren();
  for(const id of ["startDot","endDot"]){$(id).setAttribute("cx","-50");$(id).setAttribute("cy","-50")}
  $("fallbackLabel").textContent="En attente du nouveau trajet.";
  if(map&&routeLayer){map.removeLayer(routeLayer);routeLayer=null}
  if(markerLayer)markerLayer.clearLayers();
  $("diagWrap").open=false;updatePreparationReadout();
}
function lock(value){
  if(value)cancelGps();
  busy=value;$("mapStationsBtn").disabled=value;
  $("profileBtn").disabled=value;$("preparedBtn").disabled=value;
  document.querySelectorAll('#sheet input,#sheet select,#sheet button').forEach(el=>el.disabled=value);
  if(!value){updateVehicleRouting();updateRange();updateBudget();updateResumePreparation()}
}
function windowBounds(w){return `Entre ${fmt(w.min,1)} et ${fmt(w.max,1)} km depuis le départ`}
function updateWindow(){
 updateSampling();
 const w=stopWindow(),target=stationDistance($('stopKmInput').value);
 $('distanceControl').hidden=w.mode!=='around';$('nearControl').hidden=w.mode!=='near';
 $('stopKm').max=String(Math.max(.1,Number.isFinite(w.length)?w.length:1000,target||0));
 if(target!==null)$('stopKm').value=String(target);
 $('stopKmLabel').textContent=target===null?'À renseigner':`${fmt(target,1)} km`;
 for(const [id,key] of [['stopKmInput','target'],['stopTolerance','tolerance'],['nearKm','near'],['stopKm','target']])$(id).setAttribute('aria-invalid',String(w.field===key));
 $('fitStationTarget').hidden=!w.beyond||w.length<.1;
 $('fitStationTarget').textContent=`Viser la fin du trajet (${Number.isFinite(w.length)?fmt(w.length,1):'—'} km)`;
 $('windowNote').textContent=w.valid?(w.mode==='soon'?'Stations classées par distance routière depuis le départ, dans les '+fmt(w.length,1)+' km du trajet.':windowBounds(w)+'. '+(w.mode==='near'?'Proximité demandée : '+fmt(w.near,1)+' km. ':'Cible '+fmt(w.target,1)+' km, marge ±'+fmt(w.tolerance,1)+' km. '))+'Aucun élargissement automatique.':w.error+(Number.isFinite(w.length)?` Longueur du trajet : ${fmt(w.length,1)} km.`:'');
}
function updateStationEmpty(count){
 $('stationEmpty').hidden=!stationSearch||count>0;
 if($('stationEmpty').hidden)return;
 const next=widerStationWindow(stopWindow());$('widenStationWindow').hidden=!next;
 $('widenStationWindow').textContent=next?'Élargir : '+windowBounds(next.window).toLocaleLowerCase('fr-FR'):'Élargir la zone';
 $('stationEmptyNote').textContent='Aucune station trouvée dans cette zone avec ces critères parmi les accès comparés.'+(stationSearch.cursor<stationSearch.queue.length?' Des candidates restent à examiner avec « Comparer les autres stations ».':'')+' Modifier la zone demande une nouvelle recherche.';
}
function focusStationField(id){const el=$(id);for(let p=el.parentElement;p;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true;el.scrollIntoView({block:'center'});el.focus()}
function changeStationWindow(){clearStations();updateWindow();$('fuelStatus').textContent='Zone modifiée. Lancer « Chercher les stations » pour recalculer les accès.';$('stationsBtn').focus()}
function displayTrip(base,routing,a,b,ga,gb){
    const coords=base.geometry.coordinates.map(([lon,lat])=>[lat,lon]);
    const label=`${ga.label.split(",")[0]} → ${gb.label.split(",")[0]}`;
    const choices=distinctRouteChoices(base,C.routeChoiceLimit);
    base={...choices[0],alternatives:choices.slice(1)};
    const endpoints=JSON.stringify([a,b]);if(routing.vehicle.type==='walk'||meetingEndpoints&&meetingEndpoints!==endpoints)clearMeetingDraft();meetingEndpoints=endpoints;meetingProposal=null;
    trip={a,b,base,coords,label,routing,choices,choice:0,places:{start:ga.label,end:gb.label},calculatedAt:new Date().toISOString()};renderRouteChoices();
    $("resolvedPlaces").textContent=`Départ : ${ga.label}. Arrivée : ${gb.label}.`;
    $("resolvedPlaces").hidden=false;
    $("appliedRouting").textContent=routingLabel(routing);$("appliedRouting").hidden=false;
    $("routingAttribution").innerHTML=routing.provider==="ors"?'<a href="https://openrouteservice.org/" target="_blank" rel="noopener noreferrer">© openrouteservice.org by HeiGIT</a> · © OpenStreetMap contributors':routing.provider==="ign"?'<a href="https://cartes.gouv.fr/aide/fr/guides-utilisateur/utiliser-les-services-de-la-geoplateforme/calcul-itineraire/" target="_blank" rel="noopener noreferrer">IGN · BD TOPO · Licence Ouverte 2.0</a>':"OSRM";
    if(routing.provider==="ign"&&typeof base.resourceVersion==="string")$("routingAttribution").append(document.createTextNode(" · données "+base.resourceVersion));
    showOnMap(coords,[],null,a,b,label);
    $("tripKm").textContent=`${fmt(base.distance/1000,1)} km`;
    $("tripTime").textContent=`${Math.round(base.duration/60)} min`;
    $("summary").hidden=false;$("stops").hidden=routing.vehicle.type==="walk";updatePreparationReadout();
    updateWindow();$("rideTrip").textContent=label;
    setStatus(routing.vehicle.type==="walk"?"Trajet prêt · à pied. Vérifier la distance et les conditions du parcours.":"Trajet prêt. Choisis maintenant tes arrêts.","ok");
}
// Validation of the main journey only; storage and provider models keep their contracts.
let tripValidationActive=false,tripValidationErrors=[],tripPlaceError=null,tripValidationStatus='';
function collectTripErrors(){
 const errors=[],add=(id,message)=>{if(!errors.some(e=>e.id===id))errors.push({id,message})};
 for(const [id,label] of [['start','de départ'],['end','d’arrivée']])if(!$(id).value.trim())add(id,`Renseigner le lieu ${label}.`);
 if(temporaryAddress($('end').value)&&!transitStoredPlace($('end').value.trim(),'end'))add('end','Ce libellé GPS ne désigne pas une arrivée confirmée. Renseigner une adresse fixe.');
 const mode=$('travelMode').value,vehicle=$('routeVehicle').value;
 if(!['car','walk'].includes(mode))add('carMode','Choisir un mode de déplacement.');
 if(!['fastest','shortest'].includes($('routeOptimization').value))add('routeOptimization','Choisir le trajet plus rapide ou plus court.');
 if(mode==='walk'){
  try{walkingRule('walkRule')}catch(e){add('walkRule',e.message)}
  if(!errors.some(e=>e.id==='walkRule'))try{readWalkingCriteria()}catch(e){add('maxWalkKm',e.message)}
 }else if(mode==='car'&&vehicle==='truck'&&routingEndpoint()){
  const fields=[['truckHeight','Hauteur',6,'m'],['truckWidth','Largeur',6,'m'],['truckLength','Longueur totale',40,'m'],['truckWeight','Poids en charge',100,'t'],['truckAxleload','Charge maximale par essieu',30,'t']];
  for(const [id,label,max,unit] of fields){const el=$(id),n=Number(el.value);if(el.validity.badInput||!el.value.trim()||!Number.isFinite(n)||n<=0||n>max)add(id,`${label} : renseigner une valeur supérieure à 0 et au plus égale à ${max} ${unit}.`)}
  if(!errors.some(e=>['truckWeight','truckAxleload'].includes(e.id))&&Number($('truckAxleload').value)>Number($('truckWeight').value))add('truckAxleload','La charge par essieu ne peut pas dépasser le poids en charge.');
 }
 // Availability is not inferred from an enabled checkbox or a restored profile.
 if(['car','walk'].includes(mode)&&!errors.some(e=>['routeOptimization','maxWalkKm','walkRule',...Object.values(dimensionFields)].includes(e.id))){
  try{
   if(mode==='car'&&vehicle==='truck'&&!routingEndpoint())throw new Error('Service public de routage poids lourd non activé. Choisir explicitement un véhicule disponible.');
   ensureRouting(routingPreferences());
  }catch(e){
   const unavailable=[...document.querySelectorAll('.avoid-options input:checked')].some(el=>el.dataset.routingAvailable==='false');
   add(mode==='walk'?'walkMode':unavailable?'clearUnavailableOptions':$('routeOptimization').value==='shortest'?'routeOptimization':'routeVehicle',e.message);
  }
 }
 const dates={};
 for(const [id,label] of [['stationDeparture','Départ prévu'],['routeArriveBy','Heure limite']]){
  const el=$(id);if(el.validity.badInput){add(id,`${label} : compléter la date et l’heure, ou effacer le champ.`);continue}
  if(!el.value){dates[id]=null;continue}
  const d=departureInstant(el.value);if(d.error)add(id,label+' : '+d.error);else dates[id]=d.instant;
 }
 if($('routeOnlyBefore').checked&&dates.routeArriveBy===null)add('routeArriveBy','Renseigner une heure limite pour filtrer la comparaison, ou désactiver le filtre.');
 if(Number.isFinite(dates.stationDeparture)&&Number.isFinite(dates.routeArriveBy)&&dates.routeArriveBy<dates.stationDeparture)add('routeArriveBy','L’heure limite doit suivre le départ ou lui être égale.');
 if(tripPlaceError){
  const {id,value,message}=tripPlaceError;
  const fixed=[preparationInputs[id],favoriteInputs[id]].some(p=>p?.value===value&&p.place);
  if($(id).value===value&&!fixed)add(id,message);else tripPlaceError=null;
 }
 return errors;
}
function focusTripField(id){
 const el=$(id);for(let parent=el.parentElement;parent;parent=parent.parentElement)if(parent.tagName==='DETAILS')parent.open=true;
 el.focus({preventScroll:true});el.scrollIntoView({block:'center',behavior:'instant'});
}
function renderTripErrors(errors){
 const previous=tripValidationErrors;
 for(const {id} of previous)if(!errors.some(e=>e.id===id)){
  const el=$(id),errorId=id+'TripError';$(errorId)?.remove();el.setAttribute('aria-invalid','false');
  const descriptions=(el.getAttribute('aria-describedby')||'').split(/\s+/).filter(x=>x&&x!==errorId);
  if(descriptions.length)el.setAttribute('aria-describedby',descriptions.join(' '));else el.removeAttribute('aria-describedby');
 }
 for(const {id,message} of errors){
  const el=$(id),errorId=id+'TripError';let note=$(errorId);
  if(!note){note=document.createElement('p');note.id=errorId;note.className='trip-field-error';(el.closest('.field-row')||el).insertAdjacentElement('afterend',note)}
  note.textContent=message;el.setAttribute('aria-invalid','true');
  el.setAttribute('aria-describedby',[...new Set([...(el.getAttribute('aria-describedby')||'').split(/\s+/).filter(Boolean),errorId])].join(' '));
 }
 $('tripValidation').hidden=!errors.length;
 if(JSON.stringify(errors)!==JSON.stringify(previous)){
  const list=$('tripValidationList'),focused=document.activeElement?.dataset.tripError;list.replaceChildren();
  for(const {id,message} of errors){const item=document.createElement('li'),button=document.createElement('button');button.type='button';button.className='ghost';button.dataset.tripError=id;button.textContent=message;item.append(button);list.append(item)}
  // Rebuilding the summary must not lose keyboard focus while another field changes.
  if(focused){const button=[...list.querySelectorAll('button')].find(b=>b.dataset.tripError===focused);if(button)button.focus();else focusTripField(focused)}
 }
 tripValidationErrors=errors;
}
function refreshTripValidation(){
 if(!tripValidationActive||busy)return;
 const errors=collectTripErrors();renderTripErrors(errors);
 if(tripValidationStatus&&$('status').textContent===tripValidationStatus){
  tripValidationStatus=errors.length?`À corriger : ${errors[0].message}`:'Saisies corrigées. Relancer la recherche du trajet.';
  $('status').textContent=tripValidationStatus;$('statusDot').className='status-dot'+(errors.length?' err':'');
 }
}
function showTripErrors(errors){
 tripValidationActive=true;renderTripErrors(errors);tripValidationStatus=`À corriger : ${errors[0].message}`;
 setStatus(tripValidationStatus,'err');$('diagWrap').open=false;focusTripField(errors[0].id);
}
function clearTripErrors(){tripValidationActive=false;tripPlaceError=null;tripValidationStatus='';renderTripErrors([])}
let tripRun=null,tripRequestId=0;
function tripSearchSignature(){return JSON.stringify([...['start','end','travelMode','routeOptimization','routeVehicle','maxWalkKm','walkRule',...Object.values(dimensionFields)].map(id=>[id,$(id).value]),...[...document.querySelectorAll('.avoid-options input')].map(el=>[el.id,el.checked]),currentPos])}
function finishTripSearch(job){
 if(tripRun!==job)return;tripRun=null;if(walkRun===job)walkRun=null;
 if(activeAbort===job.controller)activeAbort=null;lock(false);$('cancelTripBtn').hidden=true;
}
function cancelTripSearch(message='Recherche du trajet annulée. Saisies et options conservées.'){
 const job=tripRun;if(!job)return;job.cancelled=true;job.controller.abort();finishTripSearch(job);
 health('hGeo','','géocodage');health('hRoute','','routage');setStatus(message);$('diagWrap').open=false;
 $( $('goBtn').disabled?'start':'goBtn').focus();
}
async function run(){
 if(busy)return;
 if(activeAbort)activeAbort.abort();clearResults();
 tripPlaceError=null;const errors=collectTripErrors();if(errors.length){showTripErrors(errors);return}clearTripErrors();
 const job={id:++tripRequestId,revision:tripSearchSignature(),controller:new AbortController(),cancelled:false,phase:'hGeo'};
 tripRun=job;activeAbort=job.controller;if(isWalking())walkRun=job;
 const current=()=>tripRun===job&&!job.cancelled&&!job.controller.signal.aborted&&job.revision===tripSearchSignature();
 lock(true);$('cancelTripBtn').hidden=false;$('cancelTripBtn').disabled=false;log.length=0;
 health('hGeo','','géocodage');health('hRoute','','routage');
 try{
  const routing=routingPreferences();ensureRouting(routing);
  const sv=$('start').value.trim(),ev=$('end').value.trim();
  setStatus('Recherche du départ…','busy');health('hGeo','busy','géocodage…');
  const ga=await resolveTripPlace(sv,'start',current,job.controller.signal);checkRouteRequest(current,job.controller.signal);
  setStatus('Recherche de l’arrivée…','busy');const gb=await resolveTripPlace(ev,'end',current,job.controller.signal);checkRouteRequest(current,job.controller.signal);
  health('hGeo','ok','géocodage ✓');job.phase='hRoute';const a=[ga.lat,ga.lon],b=[gb.lat,gb.lon];setStatus('Calcul du trajet…','busy');
  const base=await route([a,b],true,true,routing,current,job.controller.signal);checkRouteRequest(current,job.controller.signal);
  displayTrip(base,routing,a,b,ga,gb);
 }catch(e){
  if(tripRun!==job)return;
  if(!current()){cancelTripSearch('Paramètres modifiés : calcul annulé. Relancer la recherche.');return}
  if(e.name==='AbortError'){cancelTripSearch(e.message+' Saisies et options conservées.');return}
  if(e.code==='NO_PLACE'&&['start','end'].includes(e.field)){
   finishTripSearch(job);tripPlaceError={id:e.field,value:$(e.field).value,message:e.message};health('hGeo','','lieu non trouvé');showTripErrors(collectTripErrors());return;
  }
  health(job.phase,'err',job.phase==='hGeo'?'géocodage ✕':'routage ✕');dbg(e.stack||e.message);setStatus(`⚠️ ${e.message}`,'err');$('diagWrap').open=true;
 }finally{finishTripSearch(job)}
}
function stationSearchSignature(){
 return JSON.stringify({inputs:['start','end','travelMode','routeOptimization','routeVehicle','stopKm','stopKmInput','stopTolerance','nearKm','stationRadiusKm','stationSpacingKm','stationMaxPoints','stationScope','fuel','liters','cons',...Object.values(dimensionFields)].map(id=>$(id).value),mode:stopWindow().mode,avoid:[...document.querySelectorAll('.avoid-options input:checked')].map(e=>e.value),routing:trip?.routing});
}
function stationSearchNote(s){return [s.counts.overLimit?`${s.counts.overLimit} station(s) au-delà de la limite totale des rencontres : exclues.`:'',s.counts.unavailable?`${s.counts.unavailable} station(s) sans accès calculable.`:'',s.counts.incomparable?`${s.counts.incomparable} trajet(s) recalculé(s) plus courts ou plus rapides : exclus du classement, comparaison à examiner.`:'',s.counts.matrix?`${s.counts.matrix} accès indisponible(s) ou trajet(s) recalculé(s) non comparable(s) : exclus du classement.`:''].filter(Boolean).join(' ')}
function updateStationCoverage(){
 const s=stationSearch;if(!s){$('stationContinuation').hidden=true;return}
 const remaining=s.queue.length-s.cursor,n=stationPage(s.queue,s.cursor,C.maxCandidates).length,f=s.found;
 $('stationCoverage').hidden=false;
 $('stationCoverageDetails').textContent=`Recherche par échantillons : ${samplingPlanText(f.settings,f.plan)} ${s.cursor} candidates examinées sur ${s.queue.length} dans la zone approchée. ${s.results.length} comparables dans la plage routière, ${s.outside} hors plage et ${s.rejected} non comparables.${remaining?' Limite atteinte : comparaison partielle. Continuer explicitement ci-dessous ou choisir une distance plus précise.':' Toutes les candidates reçues de cette sélection ont été examinées.'}${f.limited?` ${f.limited} réponse(s) limitée(s) par le service : couverture partielle.`:''}${f.failed?` ${f.failed} point(s) en échec : couverture partielle.`:''} Les filtres s’appliquent aux accès calculés, sans nouvelle recherche ni garantie d’exhaustivité.`;
 $('stationCoverageBrief').textContent=`${s.cursor} candidates examinées sur ${s.queue.length} · ${s.results.length} comparables. ${remaining?'Comparaison partielle : '+remaining+' restent à examiner.':'Candidates reçues examinées.'}${f.limited?' Réponses limitées : couverture partielle.':''}${f.failed?' Points en échec : couverture partielle.':''} Recherche non exhaustive.`;
 $('stationContinuation').hidden=false;$('continueStationsBtn').hidden=!remaining;$('continueStationsBtn').disabled=busy;
 $('continueStationsBtn').textContent=`Comparer ${n} autre${n>1?"s":""} station${n>1?"s":""}`;
 $('stationContinuationMethod').textContent=`Stations reçues le ${new Date(s.at).toLocaleString('fr-FR')}. ${remaining} candidate(s) restent à examiner. Chaque continuation calcule au plus ${stationPageSize(C.maxCandidates)} accès parmi les stations déjà reçues ; les prix gardent leur date. Pour obtenir de nouvelles données ou changer de zone, relancer la recherche.`;
 $("stationContinuationNote").textContent=remaining?`${remaining} candidates restantes. Continuer conserve la date des prix.`:"Pour actualiser les prix, relancer la recherche.";updatePreparationReadout();
}
async function searchStations(more=false){
 more=more===true;if(busy||!trip||trip.routing.vehicle.type==='walk')return;
 const w=stopWindow();if(!w.valid){updateWindow();$('fuelStatus').textContent=w.error;focusStationField({target:'stopKmInput',tolerance:'stopTolerance',near:'nearKm'}[w.field]||'stationsBtn');return}
 const settings=readSamplingSettings();if(!settings.valid){updateSampling();$('fuelStatus').textContent=settings.error;focusStationField({radius:'stationRadiusKm',spacing:'stationSpacingKm',maxPoints:'stationMaxPoints',scope:'stationScope'}[settings.field]);return}
 let session=more?stationSearch:null;
 if(more&&(!session||session.cursor>=session.queue.length))return;
 if(more&&(session.trip!==trip||session.base!==trip.base||session.signature!==stationSearchSignature())){clearStations();$('fuelStatus').textContent='Critères modifiés : relancer la recherche des stations.';return}
 if(!more)clearStations();
 const job={controller:new AbortController(),trip,base:trip.base,signature:stationSearchSignature(),invalid:false};stationJob=job;activeAbort=job.controller;lock(true);
 const context=()=>stationJob===job&&!job.invalid&&trip===job.trip&&trip?.base===job.base&&job.signature===stationSearchSignature(),current=()=>context()&&!job.controller.signal.aborted;
 $('cancelStationsBtn').hidden=false;$('cancelStationsBtn').disabled=false;updateStationCoverage();let problem='';
 try{
  if(!session){
   const fuel=$('fuel').value,liters=valueNum('liters',1,2000),cons=valueNum('cons',1,100),window=stopWindow();$('fuelStatus').textContent='Recherche des stations…';
   const found=await collectStations(trip.coords,fuel,settings,stationSamplingPlan(settings),current);if(!current())throw new Error('Recherche interrompue.');
   session={found,queue:chooseCandidates(found.stations,trip.coords),cursor:0,rejected:0,outside:0,results:[],counts:{overLimit:0,unavailable:0,incomparable:0,matrix:0},liters,cons,fuel,window,trip,base:trip.base,signature:job.signature,at:new Date().toISOString()};stationSearch=session;
   $('stationCount').textContent=String(found.stations.length);$('stationSummary').hidden=false;updateStationCoverage();
   if(!session.queue.length)throw new Error(`Aucune station ${fuel} reçue dans la zone demandée.`);
  }
  const cands=stationPage(session.queue,session.cursor,C.maxCandidates),start=session.cursor;
  const accept=(examined,scored,counts)=>{if(!current())throw new Error('Recherche interrompue.');Object.assign(session,commitStationPage(session,examined,scored));for(const [k,v] of Object.entries(counts))session.counts[k]+=v;compared=session.results;updateStationCoverage()};
  if(trip.routing.provider!=='osrm'||trip.meetings){
   for(const [i,station] of cands.entries()){
    if(!current())throw new Error('Recherche interrompue.');
    const result=await scoreConstrainedCandidates([station],session.liters,session.cons,current,`Vérification avec exclusions : candidate ${start+i+1} sur ${session.queue.length}…`);
    accept([station],result.scored,result.counts);
   }
  }else{
   $('fuelStatus').textContent=`Calcul des accès et détours de ${cands.length} stations…`;
   const mat=await matrix([trip.a,...cands.map(s=>[s.lat,s.lon]),trip.b]);if(!current())throw new Error('Recherche interrompue.');
   const scored=scoreCandidates(cands,trip.base,mat,session.liters,session.cons);accept(cands,scored,{matrix:cands.length-scored.length});
  }
 }catch(e){problem=job.controller.signal.aborted?'Recherche interrompue.':e.message;dbg(e.stack||e.message);health('hFuel','err','carburants ✕')}
 finally{
  const valid=context();if(stationJob===job)stationJob=null;if(activeAbort===job.controller)activeAbort=null;
  if(!valid){clearStations();$('fuelStatus').textContent='Critères modifiés : relancer la recherche des stations.'}
  else if(session&&stationSearch===session){
   compared=session.results;$('testedCount').textContent=String(compared.length);updateServiceChoices();renderStations(compared,session.window.mode,!more);
   const note=stationSearchNote(session);
   $('fuelStatus').textContent=(problem?problem+' Résultats valides déjà obtenus conservés. ':'')+`${compared.length} stations comparées parmi ${session.found.stations.length} reçues. ${note?note+' ':''}${session.found.partial?'Réponse partielle du service. ':''}`+(!compared.length?'Aucune station comparable dans cette plage de distance. Modifier la distance ou poursuivre les candidates restantes. ':'')+'Distances depuis le départ choisi ; pas de suivi GPS continu.';
  }else $('fuelStatus').textContent=(problem||'Recherche sans résultat.')+' Le trajet reste disponible.';
  lock(false);$('cancelStationsBtn').hidden=true;updateStationCoverage();if(more&&stationSearch)$('stationCoverage').focus({preventScroll:true});
 }
}

// BEGIN STATION PREVIEW MODEL
function stationPreviewDelta(current,proposed){
 for(const r of [current,proposed])if(!hasRouteMetrics(r))throw new Error('Distances ou durées invalides.');
 const rounded=(v,n)=>Math.round(v*10**n)/10**n;
 return {km:rounded(rounded(proposed.distance/1000,1)-rounded(current.distance/1000,1),1),minutes:rounded(rounded(proposed.duration/60,1)-rounded(current.duration/60,1),1)};
}
function stationPreviewAccess(via,nodes,fallback){
 try{const leg=meetingLegs(via,nodes),distance=leg.accessDistance;if(!Number.isFinite(distance))throw new Error('Accès absent');return {km:distance/1000,seconds:leg.accessSeconds,source:'route'}}catch{return {km:Number.isFinite(fallback)&&fallback>=0?fallback:null,seconds:null,source:'comparison'}}
}
// END STATION PREVIEW MODEL
let stationPreview=null,stationPreviewMap=null,stationPreviewLayers=null;
function stationPreviewSignature(){
 return JSON.stringify([roadContextSignature(),...['stopMinutes','rangeMode','rangeValue','reserveKm','liters','routeOnlyBefore'].map(id=>[$(id).value,$(id).checked])]);
}
function stationPreviewCurrent(op){return stationPreview===op&&trip===op.trip&&selectedStop===op.previous&&compared.includes(op.station)&&stationPreviewSignature()===op.signature}
function closeStationPreview(message='Arrêt non confirmé. Le trajet précédent est conservé.'){
 const op=stationPreview;stationPreview=null;
 if(op?.running){op.controller.abort();if(activeAbort===op.controller)activeAbort=null;lock(false)}
 if(stationPreviewMap){stationPreviewMap.remove();stationPreviewMap=null;stationPreviewLayers=null}
 $('stationPreviewMap').replaceChildren();$('stationPreviewSvg').replaceChildren();
 if($('stationPreviewDialog').open)$('stationPreviewDialog').close();
 if(op){$('fuelStatus').textContent=message;const button=[...document.querySelectorAll('[data-select]')].find(e=>e.dataset.select===op.station.id);if(button&&!button.disabled)button.focus();else returnStationFocus(null,op.station.id)}
}
function stationPreviewConsent(op){
 const old=!stationFreshness(op.station).eligible,range=rangeEstimate(),far=range?.valid&&op.access?.km!==null&&op.access.km>range.useful;
 if(old!==op.oldPrice){$('stationPreviewAcceptPrice').checked=false;op.oldPrice=old}
 if(Boolean(far)!==op.outOfRange){$('stationPreviewAcceptRange').checked=false;op.outOfRange=Boolean(far)}
 $('stationPreviewOldPrice').hidden=!old;$('stationPreviewFar').hidden=!far;
 $('stationPreviewPrice').textContent=stationPriceText(op.station)+(old?' · Prix exclu du budget et des recommandations.':' · Ce prix ne remplace pas le prix de référence du budget sans action explicite.');
 $('stationPreviewConfirm').disabled=!op.via||old&&!$('stationPreviewAcceptPrice').checked||far&&!$('stationPreviewAcceptRange').checked;
 return !old||$('stationPreviewAcceptPrice').checked ? !far||$('stationPreviewAcceptRange').checked : false;
}
function drawStationPreview(){
 const op=stationPreview;if(!op?.via)return;
 const reference=$('stationPreviewReference').checked,coords=r=>r.geometry.coordinates.map(([lon,lat])=>[lat,lon]);
 const current=coords(op.reference),proposed=coords(op.via),points=[...current,...proposed,...op.nodes.map(n=>n.point)];
 if(window.L){try{
  if(!stationPreviewMap){stationPreviewMap=L.map('stationPreviewMap',{scrollWheelZoom:false});L.tileLayer(C.tileUrl,{maxZoom:19,attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}).addTo(stationPreviewMap)}
  $('stationPreviewMap').hidden=false;$('stationPreviewSvg').setAttribute('hidden','');$('stationPreviewMapNote').textContent='Bleu foncé continu : trajet proposé avec la station. Bleu clair pointillé : trajet actuel. Les commandes de zoom et la carte sont accessibles au clavier.';
  if(stationPreviewLayers)stationPreviewMap.removeLayer(stationPreviewLayers);stationPreviewLayers=L.featureGroup().addTo(stationPreviewMap);
  if(reference)L.polyline(current,{color:'#82baff',weight:10,dashArray:'9 9',opacity:1,interactive:false}).addTo(stationPreviewLayers);
  L.polyline(proposed,{color:'#fff',weight:7,opacity:1,interactive:false}).addTo(stationPreviewLayers);L.polyline(proposed,{color:'#0758d9',weight:4,opacity:1,interactive:false}).addTo(stationPreviewLayers);
  op.nodes.forEach((n,i)=>L.marker(n.point,{icon:L.divIcon({className:'station-marker',html:String(i+1),iconSize:[32,32],iconAnchor:[16,16]}),title:(i+1)+'. '+op.labels[i],keyboard:true}).addTo(stationPreviewLayers));
  stationPreviewMap.invalidateSize();stationPreviewMap.fitBounds(points,{padding:[30,30],animate:false});return;
 }catch{if(stationPreviewMap)stationPreviewMap.remove();stationPreviewMap=null}}
 $('stationPreviewMap').hidden=true;$('stationPreviewSvg').removeAttribute('hidden');$('stationPreviewMapNote').textContent='Schéma des tracés sans fond de carte. Bleu foncé continu : proposition ; bleu clair pointillé : trajet actuel. Les points numérotés correspondent aux étapes ci-dessous.';
 const xs=points.map(p=>p[1]*Math.cos(points[0][0]*Math.PI/180)),ys=points.map(p=>p[0]),xmin=Math.min(...xs),ymin=Math.min(...ys),dx=Math.max(...xs)-xmin,dy=Math.max(...ys)-ymin,scale=Math.min(540/(dx||1e-6),300/(dy||1e-6));
 const xy=([lat,lon])=>[300+(lon*Math.cos(points[0][0]*Math.PI/180)-xmin-dx/2)*scale,180-(lat-ymin-dy/2)*scale],path=ps=>ps.map(p=>xy(p).map(v=>v.toFixed(2)).join(',')).join(' ');
 $('stationPreviewSvg').innerHTML=(reference?'<polyline points="'+path(current)+'" fill="none" stroke="#82baff" stroke-width="10" stroke-dasharray="9 9"/>':'')+'<polyline points="'+path(proposed)+'" fill="none" stroke="#fff" stroke-width="7"/><polyline points="'+path(proposed)+'" fill="none" stroke="#0758d9" stroke-width="4"/>'+op.nodes.map((n,i)=>{const [x,y]=xy(n.point);return '<g><circle cx="'+x+'" cy="'+y+'" r="13" fill="#fff" stroke="#111"/><text x="'+x+'" y="'+(y+5)+'" text-anchor="middle" fill="#111">'+(i+1)+'</text></g>'}).join('');
}
function renderStationPreview(op){
 if(!stationPreviewCurrent(op)){closeStationPreview('Aperçu périmé : le contexte a changé. Rechercher à nouveau cet arrêt.');return}
 const f=escapeHtml,delta=stationPreviewDelta(op.reference,op.via),signed=v=>(v>0?'+':'')+fmt(v,1);
 let h=null;try{h=timingHypotheses(routeTimingRaw())}catch{}
 const cons=Number($('cons').value),price=budgetReference?.stationId?null:Number($('budgetPrice').value)||null;
 const card=(r,title,hasStop)=>{const pause=stopDuration(r.duration,hasStop,op.minutes),liters=Number.isFinite(cons)&&cons>=1&&cons<=100?r.distance/1000*cons/100:null,cost=liters!==null&&price>0&&price<=10?liters*price:null;
 return '<section><h3>'+title+'</h3><p><strong>'+fmt(r.distance/1000,1)+' km</strong></p><p>'+f(stopDurationText(r.duration,hasStop,op.minutes))+'</p><p>'+f(h?timingText(timingEstimate(pause.totalSeconds,h)):'Horaire non estimé : vérifier le départ et l’heure limite.')+'</p><p>Carburant consommé estimé : '+(liters===null?'inconnu':fmt(liters,2)+' L')+(cost===null?' · prix de référence non renseigné': ' · '+fmt(cost)+' €')+'.</p></section>'};
 $('stationPreviewMetrics').innerHTML=card(op.reference,'Trajet actuel',Boolean(op.previous))+card(op.via,'Avec cette station',true);
 $('stationPreviewDifference').textContent='Écarts par rapport au trajet actuel : '+signed(delta.km)+' km · '+signed(delta.minutes)+' min de conduite. '+(op.previous?'La station actuelle sera remplacée. ':'')+'Le tracé peut changer de routes.';
 $('stationPreviewCosts').textContent='Consommation commune : '+fmt(cons,1)+' L/100 km'+(price>0?' ; prix de référence : '+fmt(price,3)+' €/L.':'. Prix du budget non repris s’il provenait de l’arrêt actuel.')+' Achat à la pompe distinct du carburant consommé. Péages et autres frais du nouveau trajet non vérifiés : budget total incomplet. Les anciens tronçons de péage seront à vérifier après adoption.';
 $('stationPreviewAccess').textContent=(op.access.km===null?'Accès à la station non mesuré':`Station à ${fmt(op.access.km,1)} km du départ · ${op.access.source==='route'?'selon les étapes du tracé':'selon la comparaison précédente, à vérifier'}`)+'. '+(op.access.km===null?'Portée non vérifiable':stationRangeText(op.access.km))+'. '+openingText(op.access.source==='route'?{...op.station,accessSeconds:op.access.seconds}:op.station);
 $('stationPreviewSteps').innerHTML=op.labels.map(label=>'<li>'+f(label)+'</li>').join('');
 $('stationPreviewBody').hidden=false;$('stationPreviewStatus').textContent='Aperçu prêt. Le trajet actuel est conservé jusqu’à confirmation. Hors trafic en direct et autres pauses ; accès et état du terrain non garantis.';
 stationPreviewConsent(op);drawStationPreview();
}
async function selectStation(id){
 if(busy||!trip||trip.routing.vehicle.type==='walk')return;
 const station=compared.find(s=>s.id===id);if(!station)return;
 let minutes;try{minutes=readStopMinutes()}catch(e){$('stopMinutesStatus').textContent=e.message;$('stopMinutes').setAttribute('aria-invalid','true');$('stopMinutes').focus();return}
 closeStationPreview();
 const nodes=routePlanNodes(station),labels=nodes.map(n=>({start:trip.places.start,end:trip.places.end,station:'Station : '+station.address,pickup:'Prise en charge : '+(trip.meetings?.pickup.label||''),dropoff:'Dépose : '+(trip.meetings?.dropoff.label||'')}[n.kind]));
 const op={trip,station,previous:selectedStop,reference:selectedStop?.via||trip.base,nodes,labels,minutes,controller:new AbortController(),running:true};
 stationPreview=op;lock(true);op.signature=stationPreviewSignature();activeAbort=op.controller;
 $('stationPreviewBody').hidden=true;$('stationPreviewConfirm').disabled=true;$('stationPreviewAcceptPrice').checked=false;$('stationPreviewAcceptRange').checked=false;$('stationPreviewReference').checked=true;
 $('stationPreviewContext').textContent=station.address+' · '+routingLabel(trip.routing)+'. Les rencontres et leurs limites sont conservées.';
 $('stationPreviewStatus').textContent='Calcul du trajet avec cette station… Le trajet actuel reste en place.';$('stationPreviewDialog').showModal();$('stationPreviewTitle').focus();
 try{
  const via=station.via||await route(nodes.map(n=>n.point),true,false,op.trip.routing,()=>stationPreviewCurrent(op));
  if(!stationPreviewCurrent(op))return;
  validateRoadChoice(via,[op.trip.a,op.trip.b]);
  if(op.trip.meetings){meetingLegs(via,nodes);if(!meetingDetour(via,op.trip.meetings.reference.base,op.trip.meetings.limits).allowed)throw new Error('Limite totale de détour des rencontres dépassée.')}
  op.via=via;op.access=stationPreviewAccess(via,nodes,station.distanceFromStart);
 }catch(e){if(stationPreview===op){dbg(e.message);$('stationPreviewStatus').textContent='Arrêt non confirmé : '+e.message;$('fuelStatus').textContent='Arrêt non confirmé : '+e.message}}
 finally{
  if(stationPreview===op){op.running=false;if(activeAbort===op.controller)activeAbort=null;lock(false);if(op.via)renderStationPreview(op);else if(!stationPreviewCurrent(op))closeStationPreview('Aperçu périmé : le contexte a changé.')}
 }
}
function confirmStationPreview(){
 const op=stationPreview;if(!op?.via||op.running)return;
 if(!stationPreviewCurrent(op)){closeStationPreview('Aperçu périmé : le contexte a changé. Rechercher à nouveau cet arrêt.');return}
 if(!stationPreviewConsent(op)){$('stationPreviewStatus').textContent='Vérifier les réserves affichées avant de confirmer cet arrêt.';return}
 if(op.access.source==='route'){op.station.distanceFromStart=op.access.km;op.station.accessSeconds=op.access.seconds}
 invalidateStationPrice();selectedStop={station:op.station,via:op.via,confirmedAt:new Date().toISOString()};
 closeStationPreview('Trajet avec la station sélectionnée affiché sur la carte.');
 updateTripMetrics();renderStations(compared,stopWindow().mode,true);
 document.querySelectorAll('[data-station]').forEach(el=>el.classList.toggle('selected',el.dataset.station===op.station.id));
 document.querySelectorAll('[data-select]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.select===op.station.id)));
 $('selectedStop').hidden=false;$('removeStopBtn').hidden=false;updateStopDuration();$('removeStopBtn').focus();
}
$('stationPreviewCancel').addEventListener('click',()=>closeStationPreview());
$('stationPreviewClose').addEventListener('click',()=>closeStationPreview());
$('stationPreviewDialog').addEventListener('cancel',e=>{e.preventDefault();closeStationPreview()});
$('stationPreviewConfirm').addEventListener('click',confirmStationPreview);
$('stationPreviewReference').addEventListener('change',drawStationPreview);
for(const id of ['stationPreviewAcceptPrice','stationPreviewAcceptRange'])$(id).addEventListener('change',()=>{if(stationPreview?.via)stationPreviewConsent(stationPreview)});
window.addEventListener('resize',()=>{if(stationPreview?.via)drawStationPreview()});
window.addEventListener('focus',()=>{if(stationPreview?.via){if(stationPreviewCurrent(stationPreview))stationPreviewConsent(stationPreview);else closeStationPreview('Aperçu périmé : le contexte a changé.')}});

function selectTab(name){
  for(const tab of ["stations","rides"]){
    $(tab+"Tab").setAttribute("aria-selected",String(tab===name));
    $(tab+"Tab").tabIndex=tab===name?0:-1;$(tab+"Panel").hidden=tab!==name;
  }
}
// BEGIN GPS ORIGIN MODEL
function gpsPosition(position,now){
 const c=position?.coords,t=position?.timestamp,n=(v,min,max)=>typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max;
 if(!n(c?.latitude,-90,90)||!n(c?.longitude,-180,180)||!n(c?.accuracy,0,Infinity)||!n(t,1,8640000000000000)||!n(now,1,8640000000000000))return {valid:false,fix:null,error:'Position incomplète ou invalide. Demander une nouvelle position.'};
 const fix={lat:c.latitude,lon:c.longitude,accuracy:c.accuracy,at:t},age=now-t,imprecise=c.accuracy>200;
 if(age < -5000)return {valid:false,fix,imprecise,error:'Date de position incohérente. Demander une nouvelle position.'};
 const stale=age>60000;return {valid:!stale,fix,imprecise,stale,error:stale?'Position de plus d’une minute. Demander une nouvelle position avant de la confirmer.':''};
}
function gpsFailure(code){return ({1:'Accès à la position refusé. La saisie manuelle reste disponible.',2:'Position indisponible. Réessayer ou saisir le départ.',3:'Délai de recherche dépassé. Réessayer ou saisir le départ.'})[code]||'La position n’a pas pu être obtenue. Réessayer ou saisir le départ.'}
// END GPS ORIGIN MODEL
let gpsJob=null,currentFix=null;
function gpsContext(){return JSON.stringify([...document.querySelectorAll('#sheet input,#sheet select')].map(e=>[e.id,e.value,e.checked]));}
function gpsDate(at){return new Intl.DateTimeFormat('fr-FR',{timeZone:'Europe/Paris',dateStyle:'short',timeStyle:'medium'}).format(at)}
function updateGpsOrigin(){
 const note=$('gpsOriginNote');note.hidden=!currentFix||!temporaryAddress($('start').value);
 note.textContent=currentFix?`Point GPS observé le ${gpsDate(currentFix.at)} (heure de Paris), précision annoncée ±${fmt(currentFix.accuracy,0)} m. Ce départ reste fixe ; la position n’est pas suivie. Une nouvelle position demande une nouvelle confirmation.`:'';
}
function cancelGps(close=true){
 if(gpsJob){clearTimeout(gpsJob.timeout);clearInterval(gpsJob.timer);gpsJob=null}
 if(close&&$('gpsDialog').open)$('gpsDialog').close();
}
function gpsIsCurrent(job){
 if(gpsJob!==job)return false;
 if(busy||job.trip!==trip||job.context!==gpsContext()){cancelGps();return false}
 return true;
}
function showGpsProposal(job){
 if(!gpsIsCurrent(job)||!job.position)return;
 const state=gpsPosition(job.position,Date.now());job.state=state;
 $('gpsFixInfo').hidden=!state.fix;$('gpsImprecise').hidden=!state.imprecise;
 if(state.fix){$('gpsCoordinates').textContent=`Latitude ${fmt(state.fix.lat,5)} · longitude ${fmt(state.fix.lon,5)}`;$('gpsAccuracy').textContent=`Précision annoncée : ±${fmt(state.fix.accuracy,0)} m.`;$('gpsObservedAt').textContent=`Observation : ${gpsDate(state.fix.at)} (heure de Paris).`}
 const message=state.error||(state.imprecise?'Position peu précise : une confirmation supplémentaire est nécessaire.':'Position reçue. Confirmer ce point pour remplacer le départ.');
 if($('gpsStatus').textContent!==message)$('gpsStatus').textContent=message;
 $('gpsConfirm').disabled=!state.valid||(state.imprecise&&!$('gpsAcceptImprecise').checked);
}
function gpsError(job,code){
 if(!gpsIsCurrent(job)||!job.waiting)return;
 clearTimeout(job.timeout);job.waiting=false;$('gpsRetry').disabled=false;$('gpsStatus').textContent=gpsFailure(code);$('gpsConfirm').disabled=true;
}
function gps(){
 if(busy)return;cancelGps(false);
 const job={context:gpsContext(),trip,waiting:true,position:null};gpsJob=job;
 $('gpsPrevious').textContent=`Départ actuel : ${$('start').value.trim()||'non renseigné'}. Arrivée conservée : ${$('end').value.trim()||'non renseignée'}.`;
 $('gpsStatus').textContent='Recherche ponctuelle de la position…';$('gpsFixInfo').hidden=true;$('gpsImprecise').hidden=true;$('gpsAcceptImprecise').checked=false;$('gpsConfirm').disabled=true;$('gpsRetry').disabled=true;
 if(!$('gpsDialog').open)$('gpsDialog').showModal();$('gpsCancel').focus();
 if(!navigator.geolocation){job.waiting=false;$('gpsStatus').textContent='Géolocalisation non disponible dans ce navigateur. La saisie manuelle reste disponible.';$('gpsRetry').disabled=false;return}
 job.timeout=setTimeout(()=>gpsError(job,3),16000);job.timer=setInterval(()=>{if(gpsIsCurrent(job)&&job.position)showGpsProposal(job)},1000);
 try{navigator.geolocation.getCurrentPosition(position=>{
  if(!gpsIsCurrent(job)||!job.waiting)return;clearTimeout(job.timeout);job.waiting=false;job.position=position;$('gpsRetry').disabled=false;showGpsProposal(job);
 },error=>gpsError(job,error?.code),{enableHighAccuracy:true,timeout:15000,maximumAge:0})}catch{gpsError(job,0)}
}
function adoptGps(){
 const job=gpsJob;if(!job||!gpsIsCurrent(job)||!job.position)return;showGpsProposal(job);
 if(!job.state.valid||job.state.imprecise&&!$('gpsAcceptImprecise').checked)return;
 const fix=job.state.fix;cancelGps();clearResults();resetRange();clearRememberedInput('start');
 currentFix={...fix};currentPos=[fix.lat,fix.lon];$('start').value='Ma position';updateGpsOrigin();
 setStatus('Nouveau départ confirmé. Recalculer le trajet ; l’autonomie est à renseigner à nouveau.','ok');$('goBtn').focus();
}
function initPwa(){
  const preview=document.body.dataset.preview==="true";
  const network=()=>{
    const offline=navigator.onLine===false;
    $("connectionNotice").hidden=!offline;
    $("connectionNotice").textContent="Connexion signalée indisponible. Mes trajets, Mon profil et Mon journal restent consultables. Nouveaux calculs, prix et fonds de carte nécessitent le réseau.";
    $("networkStatus").textContent=offline?"Le navigateur signale une absence de connexion.":"Le navigateur signale une connexion. La disponibilité de chaque service reste à vérifier lors de son utilisation.";
  };
  network();window.addEventListener("online",network);window.addEventListener("offline",network);
  if(preview){$("pwaStatus").textContent="Version d’essai : installation et préparation au redémarrage hors ligne désactivées. Les données locales restent consultables tant que cette page est chargée.";$("installHelp").hidden=true;return}
  if(!("serviceWorker" in navigator)||!window.isSecureContext){$("pwaStatus").textContent="Préparation hors ligne indisponible dans ce navigateur ou à cette adresse. La page déjà chargée reste utilisable pour consulter les données locales.";return}
  const ready=()=>{$("pwaStatus").textContent="Interface préparée pour une réouverture hors ligne dans ce navigateur, tant que ses données sont conservées. Cartes et services en ligne non enregistrés."};
  navigator.serviceWorker.register("./service-worker.js",{updateViaCache:"none"}).then(registration=>{
    const showUpdate=()=>{
      $("pwaUpdateNotice").hidden=registration.waiting?.state!=="installed";
      if(!$("pwaUpdateNotice").hidden){$("pwaUpdateNotice").textContent="Nouvelle version prête. Enregistrer les préparations utiles, puis fermer toutes les fenêtres de cette application et la rouvrir. Aucun rechargement imposé ; les données enregistrées sont conservées.";}
    };
    const watch=worker=>{if(!worker)return;const changed=()=>{if(worker.state==="activated")ready();if(worker.state==="installed")setTimeout(showUpdate,0);if(worker.state==="redundant"){setTimeout(showUpdate,0);$("pwaStatus").textContent=registration.active?"Préparation de la nouvelle version interrompue. La version déjà installée reste disponible ; réessayer la vérification plus tard.":"L’interface n’a pas pu être préparée pour une réouverture hors ligne. Réessayer avec une connexion disponible."}};worker.addEventListener("statechange",changed);changed()};
    if(registration.active)ready();else $("pwaStatus").textContent="Préparation de l’interface en cours. Garder cette page ouverte jusqu’à confirmation avant de compter sur une réouverture hors ligne.";
    const observe=()=>{watch(registration.installing);registration.addEventListener("updatefound",()=>watch(registration.installing))};
    showUpdate();observe();
    $("checkUpdateBtn").hidden=false;
    $("checkUpdateBtn").addEventListener("click",async()=>{
      if(busy){$("pwaStatus").textContent="Attendre la fin de l’opération en cours avant de vérifier les mises à jour.";return}
      $("checkUpdateBtn").disabled=true;
      try{if(!registration.active&&!registration.waiting&&!registration.installing){registration=await navigator.serviceWorker.register("./service-worker.js",{updateViaCache:"none"});observe()}else await registration.update();showUpdate();if(registration.active&&!registration.waiting&&!registration.installing)$("pwaStatus").textContent="Vérification terminée : aucune nouvelle version détectée. La disponibilité des services de trajet reste indépendante."}
      catch(e){$("pwaStatus").textContent="Vérification impossible. La version et les données déjà enregistrées restent conservées. Réessayer avec une connexion disponible.";dbg("Mise à jour",e.message)}
      finally{$("checkUpdateBtn").disabled=false}
    });
  }).catch(e=>{$("pwaStatus").textContent="L’interface n’a pas pu être préparée pour une réouverture hors ligne. Les données locales de la page chargée restent consultables.";dbg("SW",e.message)});
  window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredInstall=e;$("installBtn").hidden=false});
  window.addEventListener("appinstalled",()=>{deferredInstall=null;$("installBtn").hidden=true;$("installHelp").textContent="Installation signalée par le navigateur. L’accès hors ligne dépend de la préparation de l’interface indiquée ci-dessus."});
  $("installBtn").addEventListener("click",async()=>{
    if(!deferredInstall)return;const prompt=deferredInstall;deferredInstall=null;$("installBtn").hidden=true;
    try{await prompt.prompt();const choice=await prompt.userChoice;$("installHelp").textContent=choice.outcome==="accepted"?"Installation demandée. Attendre la confirmation du navigateur.":"Installation non demandée. L’application reste accessible dans le navigateur."}
    catch(e){$("installHelp").textContent="Installation non proposée pour le moment. Consulter le menu du navigateur."}
  });
}
function bindProfile(){
  $("profileBtn").addEventListener("click",openProfile);
  document.querySelectorAll('.close-dialog').forEach(button=>button.addEventListener("click",()=>button.closest('dialog').close()));
  $("stationDialog").addEventListener("close",()=>{detailSequence++;const back=stationDetailReturn;stationDetailReturn=null;
   if(back?.pickerId&&$('stationPickerDialog').open){const row=[...$('stationPickerList').querySelectorAll('button')].find(e=>e.dataset.pickerStation===back.pickerId);(row||$('stationPickerSearch')).focus()}
   else if(back?.focus)returnStationFocus(back.focus,back.id);
  });
  for(const id of ["stationCards","stationDots"]){
    $(id).addEventListener("click",e=>{const target=e.target.closest('[data-details]');if(target){if(id==='stationDots')activateMapStation(target.dataset.details,target,e.detail!==0);else{stationDetailReturn=null;openStation(target.dataset.details)}}});
    $(id).addEventListener("keydown",e=>{if((e.key==="Enter"||e.key===" ")&&e.target.matches('.svg-station')){e.preventDefault();activateMapStation(e.target.dataset.details,e.target,false)}});
  }
  $("favoriteBtn").addEventListener("click",()=>{
    if(!currentStation)return;const next=structuredClone(profile),s=currentStation;
    const found=next.stations.some(station=>station.id===s.id);
    next.stations=found?next.stations.filter(station=>station.id!==s.id):[...next.stations,{id:s.id,address:s.address,city:s.city,lat:s.lat,lon:s.lon}];
    if(saveProfile(next))$("stationMessage").textContent=found?"Station retirée des favoris.":"Station enregistrée dans ce navigateur.";
  });
  $("detailChooseBtn").addEventListener("click",()=>{const id=currentStation?.id;stationDetailReturn=null;closeStationPicker(false);$("stationDialog").close();if(id)selectStation(id)});
  $("vehicleForm").addEventListener("submit",e=>{
    e.preventDefault();if(busy)return;
    try{
      const dimensions=vehicleFormDimensions(),next=structuredClone(profile);
      const vehicle={id:vehicleDraftId||crypto.randomUUID(),...validateVehicle({name:$('vehicleName').value.trim(),type:$('vehicleType').value,fuel:$('vehicleFuel').value,cons:Number($('vehicleCons').value),liters:Number($('vehicleLiters').value),...(dimensions?{dimensions}:{})})};
      const duplicates=duplicateVehicles(vehicle,next.vehicles);
      if(duplicates.length&&!$('allowVehicleDuplicate').checked){$('vehicleDuplicates').hidden=false;$('vehicleDuplicateNote').textContent='Ce nom existe déjà. Les véhicules resteront distincts ; aucun ne sera remplacé.';$('allowVehicleDuplicate').focus();return}
      const index=next.vehicles.findIndex(v=>v.id===vehicle.id);if(index<0)next.vehicles.push(vehicle);else next.vehicles[index]=vehicle;
      next.activeVehicleId=vehicle.id;
      if(saveProfile(next)){$('travelMode').value='car';applyVehicle();editVehicle(vehicle.id);$('profileMessage').textContent='Véhicule enregistré et choisi. Paramètres appliqués, trajet à recalculer.'}
    }catch(err){$('profileMessage').textContent='Enregistrement impossible : '+err.message}
  });
  $("saveTruckDimensions").addEventListener("click",()=>{
    try{showVehicleDimensions(routeDimensions());resetVehicleDuplicate();$('profileMessage').textContent='Gabarit repris dans le formulaire. Enregistrer le véhicule pour le conserver.'}
    catch(e){$("profileMessage").textContent=e.message}
  });
  $('newVehicleBtn').addEventListener('click',()=>{editVehicle();$('vehicleName').focus();$('profileMessage').textContent='Nouveau véhicule. Les autres restent conservés.'});
  $('clearVehicleDimensions').addEventListener('click',()=>{showVehicleDimensions();resetVehicleDuplicate()});
  $('vehicleForm').addEventListener('input',e=>{if(e.target.id!=='allowVehicleDuplicate')resetVehicleDuplicate()});
  $('savedVehicleSelect').addEventListener('change',e=>useSavedVehicle(e.target.value));
  $('savedVehicles').addEventListener('click',e=>{
    if(busy)return;const b=e.target.closest('button');if(!b)return;
    if(b.dataset.vehicleUse){useSavedVehicle(b.dataset.vehicleUse);editVehicle(profile.activeVehicleId)}
    if(b.dataset.vehicleEdit){editVehicle(b.dataset.vehicleEdit);$('vehicleName').focus()}
    if(b.dataset.vehicleRemove){
      const id=b.dataset.vehicleRemove,v=profile.vehicles.find(v=>v.id===id);if(!v)return;
      const active=id===profile.activeVehicleId;
      if(!confirm(`Supprimer « ${v.name||'Sans nom'} » ?${active?' Les réglages ponctuels par défaut remplaceront ce véhicule et le trajet sera à recalculer.':''} Les préparations et le journal restent conservés.`))return;
      const next=structuredClone(profile);next.vehicles=next.vehicles.filter(v=>v.id!==id);if(active)next.activeVehicleId=null;
      if(saveProfile(next)){if(active)applyVehicle();if(vehicleDraftId===id)editVehicle(profile.activeVehicleId);$('profileMessage').textContent='Véhicule supprimé. Aucun autre véhicule sélectionné automatiquement.'}
    }
  });
  $('profileDialog').addEventListener('close',()=>{addressLookupSequence++;profileImportSequence++;$('resolveAddressBtn').disabled=false;updateAddressDraft()});
  $('cancelAddressEdit').addEventListener('click',resetAddressForm);
  $('addressValue').addEventListener('input',invalidateAddressDraft);
  $('addressName').addEventListener('input',resetAddressDuplicates);
  $('resolveAddressBtn').addEventListener('click',resolveAddressDraft);
  for(const [button,input] of [['copyStartBtn','start'],['copyEndBtn','end']])$(button).addEventListener('click',()=>{
    const value=$(input).value.trim();
    if(temporaryAddress(value)){$('profileMessage').textContent='Saisir une adresse fixe complète pour enregistrer ce point GPS.';return}
    invalidateAddressDraft();$('addressValue').value=value;
    const resolved=rememberedInputs[input];addressDraft=resolved?.value===value?structuredClone(resolved):null;updateAddressDraft();
  });
  $('addressForm').addEventListener('submit',e=>{
    e.preventDefault();const next=structuredClone(profile),value=$('addressValue').value.trim();
    if(temporaryAddress(value)){$('profileMessage').textContent='Saisir une adresse complète, pas le libellé GPS temporaire.';return}
    const entry={id:$('addressId').value||crypto.randomUUID(),name:$('addressName').value.trim(),value,...(addressDraft?.value===value?{place:structuredClone(addressDraft.place)}:{})};
    const duplicates=duplicateAddresses(entry,next.addresses);
    if(duplicates.length&&!$('allowAddressDuplicate').checked){$('addressDuplicates').hidden=false;$('addressDuplicateNote').textContent='Doublon possible avec : '+duplicates.map(a=>a.name).join(', ')+'. Aucun favori existant ne sera remplacé.';$('allowAddressDuplicate').focus();return}
    const index=next.addresses.findIndex(a=>a.id===entry.id);if(index<0)next.addresses.push(entry);else next.addresses[index]=entry;
    if(saveProfile(next)){resetAddressForm();$('profileMessage').textContent='Adresse enregistrée.'}
  });
  $('savedAddresses').addEventListener('click',e=>{
    const button=e.target.closest('button');if(!button)return;
    for(const [key,input] of [['addressStart','start'],['addressEnd','end']])if(button.dataset[key]){
      const a=profile.addresses.find(a=>a.id===button.dataset[key]);if(!a)return;
      if(temporaryAddress(a.value)){$('profileMessage').textContent='Cette adresse GPS temporaire doit être remplacée par une adresse fixe.';return}
      $(input).value=a.value;clearRememberedInput(input);
      if(a.place){favoriteInputs[input]={value:a.value,place:structuredClone(a.place)};rememberedInputs[input]=structuredClone(favoriteInputs[input]);$(input+'PlaceNote').textContent='Lieu mémorisé : '+placeDescription(a.place)+'.';$(input+'PlaceNote').hidden=false}
      clearResults();if(input==='start')resetRange();setStatus('Adresse choisie. Trajet à recalculer.');$('profileDialog').close();$(input).focus();return;
    }
    if(button.dataset.addressEdit){const a=profile.addresses.find(a=>a.id===button.dataset.addressEdit);if(a){invalidateAddressDraft();$('addressId').value=a.id;$('addressName').value=a.name;$('addressValue').value=a.value;addressDraft=a.place?{value:a.value,place:structuredClone(a.place)}:null;updateAddressDraft();$('cancelAddressEdit').hidden=false;$('addressName').focus()}}
    if(button.dataset.addressRemove){const next=structuredClone(profile);next.addresses=next.addresses.filter(a=>a.id!==button.dataset.addressRemove);if(saveProfile(next)){$('profileMessage').textContent='Adresse supprimée.';if($('addressId').value===button.dataset.addressRemove)resetAddressForm()}}
  });
  $("savedStations").addEventListener("click",e=>{
    const button=e.target.closest('button');if(!button)return;
    if(button.dataset.favoriteOpen){$("profileDialog").close();openStation(button.dataset.favoriteOpen)}
    if(button.dataset.favoriteRemove){const next=structuredClone(profile);next.stations=next.stations.filter(s=>s.id!==button.dataset.favoriteRemove);if(saveProfile(next))$("profileMessage").textContent="Station retirée des favoris."}
  });
  $('exportProfileBtn').addEventListener('click',()=>{if(!profileWriteBlocked)downloadProfile(profile)});
  for(const [id,version] of [['exportLegacyProfileBtn',1],['exportV2ProfileBtn',2]])$(id).addEventListener('click',()=>{const original=legacyProfiles.find(p=>p.version===version);if(original)downloadProfile(original,`DragonRoute-profil-origine-v${version}.json`)});
  $('importProfileBtn').addEventListener('click',()=>$('importProfileFile').click());
  $('exportBeforeImport').addEventListener('click',()=>{if(!profileWriteBlocked)downloadProfile(profile)});
  $('cancelProfileImport').addEventListener('click',()=>{pendingProfileImport=null;profileImportSequence++;$('profileImportDialog').close()});
  $('profileImportDialog').addEventListener('cancel',()=>{pendingProfileImport=null;profileImportSequence++});
  $('profileImportDialog').addEventListener('close',()=>{if($('profileImportDialog').open)return;pendingProfileImport=null;if($('profileDialog').open)$('importProfileBtn').focus()});
  $('importProfileFile').addEventListener('change',async e=>{
    const file=e.target.files[0];if(!file)return;const seq=++profileImportSequence;addressLookupSequence++;$('resolveAddressBtn').disabled=false;
    try{
      if(file.size>100000)throw new Error('Fichier trop volumineux');
      const next=validateProfile(JSON.parse(await file.text()));
      if(seq!==profileImportSequence||!$('profileDialog').open)return;
      if(profileWriteBlocked)throw new Error('Le profil existant n’a pas pu être chargé. Son remplacement est bloqué.');
      pendingProfileImport=next;
      const duplicates=duplicateAddressCount(next.addresses),located=next.addresses.filter(a=>a.place).length;
      const active=next.vehicles.find(v=>v.id===next.activeVehicleId),vehicleDuplicates=next.vehicles.reduce((n,v,i)=>n+duplicateVehicles(v,next.vehicles.slice(0,i)).length,0);
      $('profileImportSummary').textContent=`${next.addresses.length} adresse(s), dont ${located} avec un lieu mémorisé ; ${next.stations.length} station(s) favorite(s). ${next.vehicles.length} véhicule(s), actif au démarrage : ${active?vehicleLabel(active):'aucun, réglages ponctuels'}. ${vehicleDuplicates} nom(s) de véhicules répété(s), conservés distincts. ${duplicates?duplicates+' doublon(s) possible(s) dans les adresses.':'Aucun doublon apparent dans les adresses.'}`;
      $('profileImportCurrent').textContent=`Le profil actuel contient ${profile.vehicles.length} véhicule(s), ${profile.addresses.length} adresse(s) et ${profile.stations.length} station(s). Il sera remplacé après confirmation.`;
      $('profileImportVehicles').replaceChildren(...next.vehicles.map(v=>{const li=document.createElement('li');li.textContent=vehicleLabel(v)+` · ${v.cons} L/100 km, ${v.liters} L à acheter par défaut`+(v.dimensions?' · '+dimensionLabel(v.dimensions):' · Gabarit inconnu')+(v.id===next.activeVehicleId?' · Actif':'');return li}));
      $('profileImportNames').replaceChildren(...next.addresses.map(a=>{const li=document.createElement('li');li.textContent=a.name+' — '+a.value+(a.place?' · Lieu mémorisé : '+a.place.label:'');return li}));
      $('profileImportMessage').textContent='';$('profileImportDialog').showModal();
    }catch(e){if(seq===profileImportSequence)$('profileMessage').textContent='Import refusé : '+e.message+'. Le profil existant est conservé.'}
    finally{e.target.value=''}
  });
  $('confirmProfileImport').addEventListener('click',()=>{
    if(!pendingProfileImport)return;
    if(saveProfile(pendingProfileImport)){resetRememberedInputs();resetAddressForm();applyVehicle();$('profileImportDialog').close();openProfile();$('profileMessage').textContent='Profil importé.'}
    else $('profileImportMessage').textContent=$('profileMessage').textContent+' Le profil précédent est conservé.';
  });
  $('eraseProfileBtn').addEventListener('click',()=>{
    if(!confirm('Effacer les véhicules, les adresses et les stations de ce profil local, ainsi que ses copies d’origine ? Le journal, les préparations, les autres applications et aperçus seront conservés.'))return;
    try{
      if(!profileUnchanged())throw new Error('Profil modifié dans un autre onglet. Recharger avant de réessayer.');
      for(const {key} of [...PROFILE_SOURCES].reverse())localStorage.removeItem(key);
      loadProfile();resetRememberedInputs();applyVehicle();resetAddressForm();openProfile();$('profileMessage').textContent='Profil local effacé.';
    }catch(e){loadProfile();resetRememberedInputs();applyVehicle();resetAddressForm();openProfile();$('profileMessage').textContent='Suppression non terminée : '+e.message+'. Vérifier les données restantes avant de réessayer.'}
  });
}
function bind(){
  $('routeOptimization').addEventListener('change',()=>{if(!busy){invalidateRouting();updateResumePreparation()}});
  for(const id of ['fuel','cons','liters','routeVehicle',...Object.values(dimensionFields)])$(id).addEventListener('input',()=>{if(!busy)detachTripVehicle()});
  for(const [id,mode] of [['carMode','car'],['walkMode','walk']])$(id).addEventListener('click',()=>{if(busy||$('travelMode').value===mode)return;$('travelMode').value=mode;$('travelMode').dispatchEvent(new Event('change',{bubbles:true}))});
  $('travelMode').addEventListener('change',()=>{if(busy)return;resumePreparation=null;preparedRangePending=false;invalidateRouting();setStatus(isWalking()?(C.ignRouting===true?'Mode à pied choisi. Calculer un nouveau trajet.':'Calcul à pied indisponible : service IGN non activé.'):'Mode véhicule choisi. Options conservées ; calculer un nouveau trajet.')});
  $('maxWalkKm').addEventListener('input',walkingChanged);$('walkRule').addEventListener('change',walkingChanged);
  for(const id of ["tollHeight","tollWeight","tollPayment","tollDeparture","tollVehicleConfirmed"])$(id).addEventListener("input",updateBudget);
  $("tollCalculate").addEventListener("click",()=>{if(busy||!tollEndpoint()||!tollParameters())return;clearTableTolls('Calcul automatique demandé : les tronçons manuels ont été retirés.');tollState.enabled=true;tollState.key='';updateBudget()});
  $("tollLocate").addEventListener('click',locateTollGates);
  $("tollGuideRadius").addEventListener('change',()=>{if(!busy&&trip)locateTollGates()});
  $("tollGuideToggle").addEventListener('click',()=>{if(!busy){tollGuide.shown=!tollGuide.shown;drawTollMarkers();syncTollGuide(tollGuide.key)}});
  $("tariffGateConfirmed").addEventListener('change',updateBudget);
  for(const id of ['tariffNetwork','tariffEntry','tariffExit'])$(id).addEventListener('change',()=>{$("tariffGateConfirmed").checked=false});
  $("tollGateList").addEventListener('click',e=>{const b=e.target.closest('button');if(!b||busy)return;if(b.dataset.tollPropose)proposeTollGate(b.dataset.tollPropose,b.dataset.gateRole);if(b.dataset.tollMap){const g=tollGuide.matches.find(g=>g.id===b.dataset.tollMap);if(!g)return;tollGuide.shown=true;drawTollMarkers();syncTollGuide(tollGuide.key);if(map)map.setView([g.lat,g.lon],Math.max(map.getZoom(),13));$(map?'map':'mapFallback').scrollIntoView({block:'center'})}});
  document.addEventListener('click',e=>{const el=e.target.closest('[data-toll-focus]');if(el)focusTollCard(el.dataset.tollFocus)});
  document.addEventListener('keydown',e=>{const el=e.target.closest('[data-toll-focus]');if(el&&['Enter',' '].includes(e.key)){e.preventDefault();focusTollCard(el.dataset.tollFocus)}});
  $("tariffNetwork").addEventListener('change',()=>tariffGates(true));
  $("tariffEntry").addEventListener('change',()=>tariffGates());
  $("tariffExit").addEventListener('change',updateBudget);
  $("tariffPassageConfirmed").addEventListener('change',updateBudget);
  for(const id of ['tariffClass','tariffDate'])$(id).addEventListener('input',()=>{$("tariffPassageConfirmed").checked=false;if(tableTolls.segments.length)clearTableTolls('Classe ou date modifiée : sélectionner à nouveau les tronçons.');updateBudget()});
  $("tariffComplete").addEventListener('change',updateBudget);
  $("tariffClear").addEventListener('click',()=>{clearTableTolls('Tronçons retirés.');updateBudget()});
  $("tariffAdd").addEventListener('click',()=>{
   const c=tariffCandidate();if(!syncBudgetRecall()||busy||!trip||trip.routing.vehicle.type==='walk'||!c||(c.kind==='passage'&&!$("tariffPassageConfirmed").checked)||(tollGuide.suggested&&!$("tariffGateConfirmed").checked)||tableTolls.segments.length>=10||tariffDuplicate(c))return;
   resetTollQuote();tollState.enabled=false;tableTolls.segments.push(c);budgetRecall=null;$("tariffComplete").checked=false;tableTolls.notice='Tronçon ajouté au budget. Jusqu’à dix tronçons, sans doublon identique. Vérifier les éventuels chevauchements.';updateBudget();
  });
  tariffGates(true);
  setInterval(()=>{if(tableTolls.segments.length&&!tariffBudgetValid())updateBudget();refreshPriceFreshness()},60000);
  window.addEventListener('focus',refreshPriceFreshness);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshPriceFreshness()});
  $("stopMinutes").addEventListener("input",updateBudget);
  $("navigationBtn").addEventListener("click",openNavigation);
  $("exportGpxBtn").addEventListener("click",exportGpx);
  $("navigationDialog").addEventListener("close",()=>{if(!$("navigationDialog").open)for(const id of ["googleMapsLink","wazeStationLink","wazeArrivalLink","wazePickupLink","wazeDropoffLink"])$(id).removeAttribute("href")});
  $("placeChoices").addEventListener("change",()=>{$("confirmPlace").disabled=false});
  $("confirmPlace").addEventListener("click",()=>{
    const choice=document.querySelector('input[name=placeChoice]:checked');
    if(!placePending||!choice)return;
    placePending.result=placePending.places[Number(choice.value)];$("placeDialog").close();
  });
  $("cancelPlace").addEventListener("click",()=>$("placeDialog").close());
  $("placeDialog").addEventListener("close",()=>{
    if($("placeDialog").open||!placePending)return;
    const pending=placePending;placePending=null;pending.cleanup();
    if(pending.result)pending.resolve(pending.result);
    else pending.reject(new DOMException("Choix du lieu annulé. Préciser l’adresse puis relancer.","AbortError"));
  });
  $("budgetPrice").addEventListener("input",()=>{budgetReference={label:"Prix saisi",at:new Date().toLocaleString("fr-FR")};updateBudget()});
  $("useStationPrice").addEventListener("click",()=>{
    if(!selectedStop)return;
    const s=selectedStop.station;if(!stationFreshness(s).eligible){refreshPriceFreshness();return}$("budgetPrice").value=s.price;
    budgetReference={stationId:s.id,label:`Prix de l’arrêt : ${s.address}`,updated:s.updated,receivedAt:s.receivedAt,fuel:s.fuel};updateBudget();
  });
  for(const id of ["rangeMode","rangeValue","reserveKm","rangeOnly"]){
    $(id).addEventListener("input",()=>{
      if(id==="rangeMode")$("rangeValue").value="";
      rangeMeasuredAt=Date.now();updateRange();
    });
  }
  for(const id of ["maxDetourKm","maxDetourMin","serviceChoices","stationOpeningFilter","stationPriceView"]){$(id).addEventListener("input",()=>{if(!busy&&stationSearch)renderStations(compared,stopWindow().mode)})}
  $("resetStationFilters").addEventListener("click",()=>{
    if(busy)return;
    $("stationPriceView").value="recent";$("maxDetourKm").value="";$("maxDetourMin").value="";$("stationOpeningFilter").value="all";$("rangeOnly").checked=false;
    document.querySelectorAll('[data-service]').forEach(el=>el.checked=false);
    $("stationListMode").value="recommended";
    if(stationSearch)renderStations(compared,stopWindow().mode);
  });
  $("stationListMode").addEventListener("change",()=>{if(compared.length)renderStations(compared,stopWindow().mode)});
  document.querySelectorAll('.avoid-options input,#routeVehicle,#truckDimensions input').forEach(el=>el.addEventListener("change",()=>{if(!busy)invalidateRouting()}));
  $("cancelStationsBtn").addEventListener("click",()=>activeAbort?.abort());
  $("routeChoices").addEventListener("click",e=>{const b=e.target.closest("[data-route-choice]");if(b)chooseRoute(Number(b.dataset.routeChoice),b)});
  $("removeStopBtn").addEventListener("click",()=>{if(!busy&&trip){selectedStop=null;invalidateStationPrice();updateTripMetrics();renderStations(compared,stopWindow().mode);$("selectedStop").hidden=true;$("removeStopBtn").hidden=true;document.querySelectorAll('[data-station]').forEach(el=>el.classList.remove('selected'));document.querySelectorAll('[data-select]').forEach(el=>el.setAttribute('aria-pressed','false'));$("fuelStatus").textContent="Arrêt retiré. Trajet choisi restauré."}});
  $('cancelTripBtn').addEventListener('click',()=>cancelTripSearch());
  for(const event of ['input','change'])$('sheet').addEventListener(event,e=>{if(tripRun&&tripRun.revision!==tripSearchSignature()&&!['maxWalkKm','walkRule'].includes(e.target.id))cancelTripSearch('Paramètres modifiés : calcul annulé. Relancer la recherche.')},true);
  bindPreparationNavigation();
  $("goBtn").addEventListener("click",run);$("gpsBtn").addEventListener("click",gps);
  $('gpsCancel').addEventListener('click',()=>cancelGps());$('gpsClose').addEventListener('click',()=>cancelGps());$('gpsRetry').addEventListener('click',gps);$('gpsConfirm').addEventListener('click',adoptGps);
  $('gpsAcceptImprecise').addEventListener('change',()=>{if(gpsJob)showGpsProposal(gpsJob)});
  $('gpsDialog').addEventListener('cancel',e=>{e.preventDefault();cancelGps()});$('gpsDialog').addEventListener('close',()=>{if(!$('gpsDialog').open)cancelGps(false)});
  for(const event of ['input','change'])$('sheet').addEventListener(event,()=>{if(gpsJob)cancelGps()},true);
  $('swapTripBtn').addEventListener('click',swapTripEnds);
  ["start","end"].forEach(id=>$(id).addEventListener("keydown",e=>{if(e.key==="Enter")run()}));
  ["start","end"].forEach(id=>$(id).addEventListener("input",()=>{clearRememberedInput(id);if(!busy){clearResults();if(id==="start")resetRange();setStatus("Trajet à recalculer.")}}));
  $('tripValidationList').addEventListener('click',e=>{const button=e.target.closest('[data-trip-error]');if(button)focusTripField(button.dataset.tripError)});
  for(const event of ['input','change'])document.querySelector('.route-section').addEventListener(event,refreshTripValidation);
  $("stationDeparture").addEventListener("input",()=>{if(!busy)refreshArrival()});
  $("stationDepartureNow").addEventListener("click",()=>{if(!busy){$("stationDeparture").value=parisLocal(Date.now());if(budgetRecall)updateBudget();refreshArrival()}});
  $("stationsBtn").addEventListener("click",searchStations);$("continueStationsBtn").addEventListener("click",()=>searchStations(true));
  $("stationCards").addEventListener("click",e=>{const button=e.target.closest('[data-select]');if(button)selectStation(button.dataset.select)});
  document.querySelectorAll('input[name="stopMode"],#stopKm,#stopKmInput,#stopTolerance,#nearKm,#fuel,#liters,#cons').forEach(el=>el.addEventListener("input",()=>{if(!busy||stationJob){
    if(el.id==="fuel"){$("budgetPrice").value="";budgetReference=null}
    if(el.id==='stopKm')$('stopKmInput').value=el.value;
    clearStations();updateWindow();updateRange();updateBudget();
  }}));
  for(const id of ['stationRadiusKm','stationSpacingKm','stationMaxPoints','stationScope'])$(id).addEventListener('input',()=>{if(!busy||stationJob){clearStations();updateSampling();$('fuelStatus').textContent='Zone de collecte modifiée. Relancer volontairement la recherche des stations.'}});
  $('fitStationTarget').addEventListener('click',()=>{if(busy)return;const w=stopWindow();if(w.beyond&&w.length>=.1){$('stopKmInput').value=String(w.length);changeStationWindow()}});
  $('widenStationWindow').addEventListener('click',()=>{if(busy)return;const next=widerStationWindow(stopWindow());if(next){$({near:'nearKm',tolerance:'stopTolerance'}[next.key]).value=String(next.value);changeStationWindow()}});
  $('editStationFuel').addEventListener('click',()=>focusStationField('fuel'));
  $('editStationFilters').addEventListener('click',()=>focusStationField('maxDetourKm'));
  for(const name of ["stations","rides"]){
    $(name+"Tab").addEventListener("click",()=>selectTab(name));
    $(name+"Tab").addEventListener("keydown",e=>{if(["ArrowLeft","ArrowRight","Home","End"].includes(e.key)){e.preventDefault();const next=e.key==="Home"?"stations":e.key==="End"?"rides":name==="stations"?"rides":"stations";selectTab(next);$(next+"Tab").focus()}});
  }
}

let bikesJob=null,bikesSnapshot=null,bikesPage=0,bikesMap=null,bikesLayer=null,bikesSelected=null,bikesNext=0,bikesExpiry='',bikesTimer=null;
const bikesCache=new Map(),BIKE_PAGE_SIZE=25;
const bikesDate=ms=>ms?new Intl.DateTimeFormat('fr-FR',{timeZone:'Europe/Paris',dateStyle:'short',timeStyle:'medium'}).format(ms):'date inconnue';
function clearBikes(message='',keepResume=false){
 if(!keepResume){bikeTripResume=null;bikeTripFixed=null;bikeTripForceFresh=false;$('bikesResumeInfo').hidden=true}$('bikesResumeAccept').hidden=true;
 clearBikeTrip('',true);
 if(bikesJob){bikesJob.controller.abort();bikesJob=null}bikesSnapshot=null;bikesSelected=null;bikesExpiry='';bikesPage=0;
 $('bikesResults').replaceChildren();$('bikesStatus').textContent=message;$('bikesLoad').disabled=false;$('bikesCancel').hidden=true;$('bikesBrowse').hidden=true;$('bikesMapWrap').hidden=true;if(bikesLayer){bikesLayer.remove();bikesLayer=null}clearInterval(bikesTimer);bikesTimer=null;
}
async function bikesFetch(name,job){
 const now=Date.now(),cached=bikesCache.get(name);if(cached&&now>=cached.at&&now<cached.until)return cached.raw;
 const response=await fetch(BIKE_BASE+name+'.json',{signal:job.controller.signal,credentials:'omit',referrerPolicy:'no-referrer',cache:'no-store',redirect:'error'});
 if(response.status===429){bikesNext=Math.max(bikesNext,bikeRetryAfter(response.headers.get('Retry-After')));throw new Error('Limite du service atteinte. Réessayer après '+bikesDate(bikesNext)+'.')}
 if(!response.ok)throw new Error('Service indisponible (HTTP '+response.status+').');
 if(Number(response.headers.get('Content-Length'))>2000000)throw new Error('Réponse trop volumineuse.');
 const reader=response.body.getReader(),chunks=[];let length=0;while(true){const {done,value}=await reader.read();if(done)break;length+=value.byteLength;if(length>2000000){await reader.cancel();throw new Error('Réponse trop volumineuse.')}chunks.push(value)}const bytes=new Uint8Array(length);let pos=0;for(const chunk of chunks){bytes.set(chunk,pos);pos+=chunk.length}
 let raw;try{raw=JSON.parse(new TextDecoder().decode(bytes))}catch{throw new Error('Réponse illisible.')}const key=name==='vehicle_types'?'vehicle_types':'stations',env=bikeEnvelope(raw,key);
 if(bikesJob===job&&!job.controller.signal.aborted)bikesCache.set(name,{raw,at:now,until:now+Math.max(60,env.ttl)*1000});return raw;
}
async function loadBikes(){
 if(bikesJob||bikeTripJob)return;if(Date.now()<bikesNext){$('bikesStatus').textContent='Patienter avant une nouvelle consultation : '+bikesDate(bikesNext)+'.';return}
 if(bikeTripResume)bikesCache.clear();clearBikes('Consultation de Vélo’v…',true);const job={controller:new AbortController()};bikesJob=job;bikesNext=Date.now()+60000;$('bikesLoad').disabled=true;$('bikesCancel').hidden=false;
 const timeout=setTimeout(()=>{job.timeout=true;job.controller.abort()},20000);
 try{
  const names=['station_information','station_status','vehicle_types'],results=await Promise.allSettled(names.map(n=>bikesFetch(n,job)));if(bikesJob!==job)return;
  if(job.timeout)throw new Error('Délai dépassé. Relancer la consultation lorsque le service répond.');
  if(results[0].status!=='fulfilled')throw results[0].reason;
  const value=i=>results[i].status==='fulfilled'?results[i].value:null;
  bikesSnapshot=bikeSnapshot(value(0),value(1),value(2));bikesSnapshot.failures=results.flatMap((r,i)=>r.status==='rejected'?[['Stations','Disponibilités','Types de vélos'][i]+' : '+(r.reason?.message||'indisponible')]:[]);
  $('bikesBrowse').hidden=false;renderBikes(true);reconcileSharedStations();bikesTimer=setInterval(refreshBikes,15000);
 }catch(e){if(bikesJob===job)clearBikes('Consultation impossible. '+e.message,true)}finally{clearTimeout(timeout);if(bikesJob===job)bikesJob=null;$('bikesLoad').disabled=Boolean(bikesJob);$('bikesCancel').hidden=!bikesJob}
}
function bikesFilters(){return {text:$('bikesQuery').value,need:$('bikesNeed').value,type:$('bikesType').value}}
function renderBikes(resetMap=false){
 if(!bikesSnapshot)return;const s=bikesSnapshot,now=Date.now(),rows=bikeRows(s,bikesFilters(),now),pages=Math.max(1,Math.ceil(rows.length/BIKE_PAGE_SIZE));bikesPage=Math.min(bikesPage,pages-1);const start=bikesPage*BIKE_PAGE_SIZE,visible=rows.slice(start,start+BIKE_PAGE_SIZE);
 bikesExpiry=JSON.stringify(s.rows.map(r=>bikeFreshness(r,s,now)));
 $('bikesType').disabled=$('bikesNeed').value!=='rent';
 $('bikesStatus').textContent=`${rows.length} station(s) correspondante(s) sur ${s.rows.length} référencées. Consultation : ${bikesDate(s.observed)}. Flux de disponibilité : ${bikesDate(s.statusUpdated)}. ${s.failures.join(' ')} ${s.excluded?`${s.excluded} entrée(s) de station écartée(s). `:''}${s.missing?`${s.missing} station(s) sans état utilisable. `:''}${s.unmatched?`${s.unmatched} état(s) sans station référencée. `:''}${rows.length?'':'Aucun résultat pour ces critères ; cela ne prouve pas une absence de vélos sur le terrain.'}`;
 $('bikesPageLabel').textContent=`Page ${bikesPage+1} sur ${pages} · ${visible.length} station(s) dans la liste et sur la carte`;$('bikesPrev').disabled=bikesPage===0;$('bikesNext').disabled=bikesPage===pages-1;
 const active=document.activeElement?.dataset.bikesMap,activeRole=document.activeElement?.dataset.bikeTripRole,activeStation=document.activeElement?.dataset.bikeTripStation;
 $('bikesResults').innerHTML=visible.map(r=>{const age=bikeFreshness(r,s,now),label={recent:'Annonce récente',old:'Annonce ancienne · plus de 5 minutes',unknown:'Date non vérifiable'}[age],count=n=>n===null?'Inconnu':String(n),state=v=>v===true?'Oui':v===false?'Non':'Inconnu';return `<article class="comparison-card bike-card ${r.id===bikesSelected?'bike-selected':''}" data-bike-id="${escapeHtml(r.id)}"><h3 tabindex="-1">${r.number}. ${escapeHtml(r.name)}</h3><p>${escapeHtml(r.address)||'Adresse non renseignée'}</p><p class="bike-age" data-bike-age="${age}">${label} · station : ${bikesDate(r.reported)}</p><dl class="bike-counts"><div><dt>Vélos annoncés</dt><dd>${count(r.bikes)}</dd></div><div><dt>Places annoncées</dt><dd>${count(r.docks)}</dd></div></dl><p>Mécaniques : ${count(r.mechanical)} · Électriques : ${count(r.electric)}</p><p class="note">Station installée : ${state(r.installed)} · Location : ${state(r.renting)} · Restitution : ${state(r.returning)}. Batterie et autonomie individuelles inconnues.</p><button type="button" class="ghost" data-bikes-map="${escapeHtml(r.id)}" aria-pressed="${r.id===bikesSelected}">Repérer la station ${r.number} sur la carte</button><div class="dialog-actions"><button type="button" class="ghost" data-bike-trip-role="pickup" data-bike-trip-station="${escapeHtml(r.id)}" aria-pressed="${bikeTripChoice.pickup===r.id}">Prendre un vélo ici</button><button type="button" class="ghost" data-bike-trip-role="dropoff" data-bike-trip-station="${escapeHtml(r.id)}" aria-pressed="${bikeTripChoice.dropoff===r.id}">Rendre le vélo ici</button></div></article>`}).join('');
 renderBikeTripChoice();drawBikes(visible,resetMap);if(active){const b=[...$('bikesResults').querySelectorAll('[data-bikes-map]')].find(x=>x.dataset.bikesMap===active);b?.focus({preventScroll:true})}else if(activeRole){[...$('bikesResults').querySelectorAll('[data-bike-trip-role]')].find(b=>b.dataset.bikeTripRole===activeRole&&b.dataset.bikeTripStation===activeStation)?.focus({preventScroll:true})}
}
function drawBikes(rows,reset){
 $('bikesMapWrap').hidden=!rows.length;if(!rows.length)return;
 if(!window.L){$('bikesMap').hidden=true;$('bikesMapNote').textContent='Carte indisponible. Toutes les stations restent consultables dans la liste.';return}
 $('bikesMap').hidden=false;$('bikesMapNote').textContent='Les numéros relient la carte à la liste. Un point indique une station, sans garantie de disponibilité. Aucun itinéraire vélo calculé.';
 if(!bikesMap){bikesMap=L.map('bikesMap');L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',maxZoom:19}).addTo(bikesMap)}
 if(bikesLayer)bikesLayer.remove();bikesLayer=L.featureGroup().addTo(bikesMap);
 for(const r of rows){const icon=L.divIcon({className:'bike-marker',html:'<span>'+r.number+'</span>',iconSize:[44,44],iconAnchor:[22,22]});const marker=L.marker([r.lat,r.lon],{icon,title:r.name,alt:'Station '+r.number+' · '+r.name,keyboard:true}).addTo(bikesLayer);marker.on('click',()=>selectBike(r.id,false))}
 bikesMap.invalidateSize();if(reset||!bikesMap._loaded)bikesMap.fitBounds(bikesLayer.getBounds(),{padding:[25,25],maxZoom:15});
}
function selectBike(id,center){
 const s=bikesSnapshot?.rows.find(r=>r.id===id);if(!s)return;bikesSelected=id;const cards=[...$('bikesResults').querySelectorAll('[data-bike-id]')];for(const c of cards){const selected=c.dataset.bikeId===id;c.classList.toggle('bike-selected',selected);c.querySelector('button').setAttribute('aria-pressed',String(selected));if(selected&&!center){c.querySelector('h3').focus();c.scrollIntoView({block:'nearest'})}}
 if(center&&bikesMap&&!$('bikesMap').hidden){bikesMap.setView([s.lat,s.lon],16);$('bikesMapWrap').scrollIntoView({block:'nearest'});$('bikesMapTitle').focus({preventScroll:true})}else if(center)$('bikesMapNote').textContent='Carte indisponible. Station sélectionnée dans la liste : '+s.name;
}
function refreshBikes(){if(bikesSnapshot&&$('bikesDialog').open&&bikesExpiry!==JSON.stringify(bikesSnapshot.rows.map(r=>bikeFreshness(r,bikesSnapshot))))renderBikes(false)}
function bindBikes(){
 $('bikesBtn').addEventListener('click',()=>{clearBikes('Charger les stations pour consulter les annonces disponibles.');$('bikesDialog').showModal();$('bikesTitle').focus()});
 $('bikesClose').addEventListener('click',()=>$('bikesDialog').close());$('bikesDialog').addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();$('bikesDialog').close()}});$('bikesDialog').addEventListener('close',()=>{clearBikes();$('bikesBtn').focus()});
 $('bikesLoad').addEventListener('click',loadBikes);$('bikesCancel').addEventListener('click',()=>clearBikes('Consultation annulée.',true));
 for(const id of ['bikesQuery','bikesNeed','bikesType'])$(id).addEventListener(id==='bikesQuery'?'input':'change',()=>{bikesPage=0;bikesSelected=null;renderBikes(true)});
 for(const [id,delta] of [['bikesPrev',-1],['bikesNext',1]])$(id).addEventListener('click',()=>{bikesPage+=delta;renderBikes(true);$('bikesPageLabel').focus()});
 $('bikesResults').addEventListener('click',e=>{const b=e.target.closest('[data-bikes-map]');if(b)selectBike(b.dataset.bikesMap,true)});
 document.addEventListener('visibilitychange',refreshBikes);
}

let bikeTripResume=null,bikeTripFixed=null,bikeTripForceFresh=false;
let bikeTripChoice={pickup:null,dropoff:null},bikeTripJob=null,bikeTripResult=null,bikeTripMap=null,bikeTripLayer=null;
const bikeTripLimitFields=['bikeTripWalkMax','bikeTripWalkRule','bikeTripBikeMax','bikeTripBikeRule'];
const bikeTripFields=['bikeTripStart','bikeTripEnd','bikeTripRent','bikeTripReturn',...bikeTripLimitFields];
function readBikeTripLimits(){
 const out={};for(const [key,prefix] of [['walk','Walk'],['bike','Bike']]){const field=$('bikeTrip'+prefix+'Max'),rule=$('bikeTrip'+prefix+'Rule').value;if(field.validity.badInput||!['soft','strict'].includes(rule))throw new Error('Limite de distance invalide.');out[key]={maxKm:field.value.trim()===''?null:Number(field.value),strict:rule==='strict'}}return validateBikeTripLimits(out);
}
function fillBikeTripLimits(limits=emptyBikeTripLimits()){
 for(const [key,prefix] of [['walk','Walk'],['bike','Bike']]){$('bikeTrip'+prefix+'Max').value=limits[key].maxKm===null?'':String(limits[key].maxKm);$('bikeTrip'+prefix+'Rule').value=limits[key].strict?'strict':'soft'}
}
function bikeTripLimitsText(review){
 return review.rows.map(r=>{const name=r.key==='walk'?'Marche totale':'Vélo',distance=r.distanceMeters===null?'distance inconnue':fmt(r.distanceMeters/1000,3)+' km calculés';if(r.status==='not-requested')return name+' : aucune limite demandée ('+distance+').';const excess=r.excessMeters===null?'':r.excessMeters<1?'moins de 1 m':fmt(r.excessMeters,1)+' m';return name+' : '+distance+' / '+fmt(r.maxKm,3)+' km demandés · '+(r.strict?'limite impérative':'préférence')+' '+(r.status==='within'?'respectée':r.status==='over'?'dépassée de '+excess:'non vérifiable')+'.'}).join(' ')+' '+(review.admissible?'Aucune limite impérative de distance non satisfaite.':'Ce parcours ne satisfait pas les limites impératives de distance.')+' Comparaison sur les distances non arrondies, sans autre parcours proposé automatiquement.';
}

function bikeTripSignature(){return JSON.stringify([bikeTripChoice,...bikeTripFields.map(id=>$(id).value),$('bikeTripStrict').checked])}
function clearBikeTrip(message='',reset=false){
 const job=bikeTripJob;bikeTripJob=null;if(job){job.controller.abort();if(activeAbort===job.controller){if(placePending){placePending.reject(new Error('Parcours partagé annulé.'));placePending=null;$('placeDialog').close()}activeAbort=null;lock(false)}}
 bikeTripResult=null;$('bikeTripResult').hidden=true;$('bikeTripStatus').textContent=(message+' '+(C.cyclingApi!==CYCLE_ENDPOINT?'Le service vélo est désactivé.':'')).trim();$('bikeTripSearch').disabled=C.cyclingApi!==CYCLE_ENDPOINT;$('bikeTripCancel').hidden=true;$('bikesLoad').disabled=Boolean(bikesJob);
 if(bikeTripLayer){bikeTripLayer.remove();bikeTripLayer=null}$('bikeTripSketch').replaceChildren();$('bikeTripLimitsResult').textContent='';if(reset)bikeTripChoice={pickup:null,dropoff:null};renderBikeTripChoice();
}
function renderBikeTripChoice(){
 const rows=bikesSnapshot?.rows||[];
 for(const role of ['pickup','dropoff']){const r=rows.find(r=>r.id===bikeTripChoice[role]);$('bikeTrip'+(role==='pickup'?'Pickup':'Dropoff')).textContent=r?`${r.number}. ${r.name}`:'À choisir dans la liste';}
 for(const b of document.querySelectorAll('[data-bike-trip-role]'))b.setAttribute('aria-pressed',String(bikeTripChoice[b.dataset.bikeTripRole]===b.dataset.bikeTripStation));
 renderBikeTripAvailability();
}
function renderBikeTripAvailability(){
 if(!bikesSnapshot)return;const rows=bikesSnapshot.rows,p=rows.find(r=>r.id===bikeTripChoice.pickup),d=rows.find(r=>r.id===bikeTripChoice.dropoff),a=bikeTripAvailability(bikesSnapshot,p,d);
 $('bikeTripAvailability').textContent=[p?`Prise : ${a.pickup?'vélo mécanique annoncé récemment':'disponibilité mécanique non confirmée'} · annonce ${bikesDate(p.reported)}.`:'',d?`Restitution : ${a.dropoff?'place annoncée récemment':'place non confirmée'} · annonce ${bikesDate(d.reported)}.`:''].filter(Boolean).join(' ');
 if(bikeTripResult)renderBikeTripSummary();
}
function chooseBikeTrip(role,id){
 if(!['pickup','dropoff'].includes(role)||!bikesSnapshot?.rows.some(r=>r.id===id))return;
 bikeTripResume=null;$('bikesResumeInfo').hidden=true;clearBikeTrip('Station choisie. Calculer le parcours après avoir choisi les deux stations.');bikeTripChoice[role]=id;renderBikeTripChoice();$('bikeTripTitle').scrollIntoView({block:'start'});$('bikeTripTitle').focus({preventScroll:true});
}
function renderBikeTripSummary(){
 const r=bikeTripResult;if(!r)return;
 try{
  const rent=bikeTripMinutes($('bikeTripRent').value,'Prise du vélo'),back=bikeTripMinutes($('bikeTripReturn').value,'Restitution'),t=bikeTripTotals(r.parts,rent,back),availability=bikeTripAvailability(bikesSnapshot,r.pickup,r.dropoff),strict=$('bikeTripStrict').checked,limits=bikeTripLimitReview(r.parts,readBikeTripLimits()),admissible=!strict||(availability.pickup&&availability.dropoff);
  $('bikeTripSave').disabled=false;$('bikeTripJournal').disabled=false;$('bikeTripLimitsResult').textContent=bikeTripLimitsText(limits);
  $('bikeTripMetrics').textContent=`${fmt(t.distance/1000,2)} km dans les trois étapes, dont ${fmt(t.walking/1000,2)} km à pied. ${Math.ceil(t.moving/60)} min de déplacement estimées, hors prise et restitution.`;
  $('bikeTripTiming').textContent=!limits.admissible?'Durée assemblée non proposée : limite impérative de distance non satisfaite. Les étapes restent visibles pour examiner la préparation.':!admissible?'Ne satisfait pas le filtre de disponibilité récente. Parcours conservé comme préparation, sans disponibilité confirmée.':t.duration===null?`Durée avec prise et restitution non estimée : ${t.missing?'renseigner les deux temps. ':''}${t.joins.some(n=>n>30)?'raccordement entre les tracés supérieur à 30 m.':''}`:`Somme estimée des étapes et temps renseignés : ${Math.ceil(t.duration/60)} min. Hors pauses supplémentaires et accès fin aux bornes.`;
  $('bikeTripJoins').textContent=`Écarts entre les tracés aux stations : ${t.joins.map(n=>fmt(n,1)+' m').join(' puis ')}. Au-delà de 30 m, la durée assemblée est retirée. Les rattachements de chaque moteur peuvent différer des points demandés de 150 m au maximum. Aucun chemin de raccordement n’est inventé ; l’accès exact aux bornes reste à vérifier.`;
  $('bikeTripAssumptions').textContent=`Temps de prise : ${rent===null?'inconnu':fmt(rent,1)+' min renseignées'}. Restitution : ${back===null?'inconnue':fmt(back,1)+' min renseignées'}. Ces temps personnels ne viennent pas de Vélo’v. Prix de location et empreinte non estimés ; réservation, accès au service et batterie non confirmés.`;
 }catch(e){$('bikeTripTiming').textContent=e.message;$('bikeTripLimitsResult').textContent='Critères invalides : aucune admissibilité de distance confirmée.';$('bikeTripAssumptions').textContent='Durée assemblée non estimée tant que les critères sont invalides.';$('bikeTripSave').disabled=true;$('bikeTripJournal').disabled=true}
}
function drawBikeTrip(parts){
 if(bikeTripLayer){bikeTripLayer.remove();bikeTripLayer=null}const coords=parts.flatMap(p=>p.points),ns='http://www.w3.org/2000/svg';$('bikeTripMap').hidden=!window.L;$('bikeTripSketch').toggleAttribute('hidden',Boolean(window.L));$('bikeTripSketch').replaceChildren();$('bikeTripMapNote').textContent='Violet en pointillés : marche. Bleu : vélo. Tracés distincts, sans ligne droite ajoutée entre les étapes.';
 if(window.L)try{
  if(!bikeTripMap){bikeTripMap=L.map('bikeTripMap',{scrollWheelZoom:false});L.tileLayer(C.tileUrl,{maxZoom:19,attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}).addTo(bikeTripMap);new ResizeObserver(()=>{bikeTripMap.invalidateSize();if(bikeTripLayer&&bikeTripMap.getSize().x>0)bikeTripMap.fitBounds(bikeTripLayer.getBounds(),{padding:[25,25],animate:false})}).observe($('bikeTripMap'))}
  bikeTripLayer=L.featureGroup().addTo(bikeTripMap);for(const p of parts){const points=p.points.map(([lon,lat])=>[lat,lon]);L.polyline(points,{color:'#fff',weight:10}).addTo(bikeTripLayer);L.polyline(points,{color:p.mode==='walk'?'#7043a3':'#1674d8',weight:6,dashArray:p.mode==='walk'?'6 7':undefined}).addTo(bikeTripLayer);for(const [point,name] of [[points[0],p.from],[points.at(-1),p.to]]){const text=document.createElement('span');text.textContent=name;L.circleMarker(point,{radius:5,color:'#123252',fillColor:'#fff',fillOpacity:1}).bindTooltip(text).addTo(bikeTripLayer)}}bikeTripMap.invalidateSize();bikeTripMap.fitBounds(bikeTripLayer.getBounds(),{padding:[25,25]});return;
 }catch{$('bikeTripMap').hidden=true;$('bikeTripSketch').removeAttribute('hidden')}
 const xs=coords.map(p=>p[0]),ys=coords.map(p=>p[1]),minX=Math.min(...xs),minY=Math.min(...ys),scale=Math.min(560/Math.max(.001,Math.max(...xs)-minX),280/Math.max(.001,Math.max(...ys)-minY));
 for(const part of parts){const line=document.createElementNS(ns,'polyline');line.setAttribute('points',part.points.map(([x,y])=>`${20+(x-minX)*scale},${300-(y-minY)*scale}`).join(' '));line.setAttribute('fill','none');line.setAttribute('stroke',part.mode==='walk'?'#d2b8ff':'#80bdff');line.setAttribute('stroke-width','5');if(part.mode==='walk')line.setAttribute('stroke-dasharray','6 7');$('bikeTripSketch').append(line)}$('bikeTripMapNote').textContent+=' Fond de carte indisponible : schéma des tracés reçus, sans échelle.';
}
async function searchBikeTrip(){
 if(busy||bikeTripJob)return;let stations;
 try{stations=bikeTripStations(bikesSnapshot,bikeTripChoice.pickup,bikeTripChoice.dropoff);if(![$('bikeTripStart').value.trim(),$('bikeTripEnd').value.trim()].every(Boolean))throw new Error('Renseigner les lieux de départ et d’arrivée.');bikeTripMinutes($('bikeTripRent').value,'Prise du vélo');bikeTripMinutes($('bikeTripReturn').value,'Restitution');readBikeTripLimits();if(C.cyclingApi!==CYCLE_ENDPOINT)throw new Error('Le service vélo est désactivé.');const a=bikeTripAvailability(bikesSnapshot,stations.pickup,stations.dropoff);if($('bikeTripStrict').checked&&(!a.pickup||!a.dropoff))throw new Error('Le filtre exige un vélo mécanique et une place annoncés récemment. Actualiser les données ou retirer ce filtre pour préparer sans garantie de disponibilité.');}catch(e){$('bikeTripStatus').textContent=e.message;return}
 clearBikeTrip('Vérification des lieux…');const signature=bikeTripSignature(),job={controller:new AbortController()};bikeTripJob=job;activeAbort=job.controller;lock(true);$('bikesLoad').disabled=true;$('bikeTripSearch').disabled=true;$('bikeTripCancel').hidden=false;const current=()=>bikeTripJob===job&&signature===bikeTripSignature();let timer,step='Lieux';
 try{
  const work=async()=>{
   const places=[];for(const [i,id] of ['bikeTripStart','bikeTripEnd'].entries()){const v=$(id).value.trim(),field=i?'end':'start',p=(bikeTripFixed?.[field]?.label===v?bikeTripFixed[field]:null)||transitStoredPlace(v,field)||await geocode(v,field,current);if(!current())return;bikeTripPoint([p.lon,p.lat]);places.push(p)}
   const {pickup,dropoff}=stations,points=[[places[0].lon,places[0].lat],[pickup.lon,pickup.lat],[dropoff.lon,dropoff.lat],[places[1].lon,places[1].lat]],labels=[places[0].label,pickup.name,dropoff.name,places[1].label],parts=[];
   for(let i=0;i<3;i++){
    if(!current())return;step=['Marche vers la station','Vélo entre les stations','Marche vers l’arrivée'][i];$('bikeTripStatus').textContent=step+'…';let part;
    if(i===1){if(bikeTripForceFresh)cycleCache.delete(cycleRequest(points[i],points[i+1],C.cyclingApi).url);const v=await loadComparedCycle([...points[i]].reverse(),[...points[i+1]].reverse(),job,current);part={mode:'bike',sourceKey:'fossgis-bike',steps:v.route.steps,distance:v.route.distance,duration:v.route.duration,points:v.route.points,source:'FOSSGIS vélo classique',at:v.at,cached:v.cached,version:v.route.dataVersion,pushing:v.route.pushingMeters}}
    else if(points[i].every((n,j)=>n===points[i+1][j]))part={mode:'walk',sourceKey:'same-point',distance:0,duration:0,points:[points[i],points[i+1]],source:'Même point demandé, aucune marche calculée',at:Date.now(),version:null};
    else{if(bikeTripForceFresh)ignCache.delete(JSON.stringify([[points[i],points[i+1]].map(p=>[...p].reverse()),[],'pedestrian','fastest']));const r=await ignRoute([points[i],points[i+1]].map(p=>[...p].reverse()),{provider:'ign',vehicle:{type:'walk'},avoid:[],optimization:'fastest'});part={mode:'walk',sourceKey:'ign-pedestrian',distance:r.distance,duration:r.duration,points:r.geometry.coordinates.map(p=>p.slice(0,2)),source:'IGN piéton · résultat éventuellement conservé en mémoire pendant cinq minutes',at:Date.now(),version:r.resourceVersion}}
    if(!current())return;parts.push({...part,from:labels[i],to:labels[i+1]});
   }
   bikeTripTotals(parts,null,null);bikeTripResult={parts,...stations,places:{start:places[0],end:places[1]}};bikeTripForceFresh=false;$('bikeTripResult').hidden=false;$('bikeTripPlaces').textContent=labels.join(' → ');$('bikeTripSteps').innerHTML=parts.map((p,i)=>`<li><strong>${i+1}. ${p.mode==='walk'?'Marche':'Vélo classique'}</strong> · ${escapeHtml(p.from)} → ${escapeHtml(p.to)}<br>${fmt(p.distance/1000,2)} km · ${Math.ceil(p.duration/60)} min estimées${p.pushing?` · ${Math.ceil(p.pushing)} m annoncés vélo à la main`:''}.<p class="note">${escapeHtml(p.source)} · consulté le ${bikesDate(p.at)}${p.cached?' · cache daté':''}. ${p.version?'Version : '+escapeHtml(p.version):'Version des données non fournie.'}</p></li>`).join('');renderBikeTripSummary();drawBikeTrip(parts);$('bikeTripStatus').textContent='Les trois étapes sont calculées. Vérifier les temps de prise/restitution et les disponibilités datées.';$('bikeTripResultTitle').focus();
  };
  await Promise.race([work(),new Promise((_,reject)=>{timer=setTimeout(()=>{job.controller.abort();reject(new Error('Délai global dépassé. Aucun parcours complet présenté.'))},90000)})]);
 }catch(e){if(current())clearBikeTrip('Parcours incomplet — '+step+' : '+e.message)}finally{clearTimeout(timer);if(bikeTripJob===job){bikeTripJob=null;if(activeAbort===job.controller)activeAbort=null;lock(false);$('bikesLoad').disabled=false;$('bikeTripSearch').disabled=C.cyclingApi!==CYCLE_ENDPOINT;$('bikeTripCancel').hidden=true}}
}
function bindBikeTrip(){
 $('bikesBtn').addEventListener('click',()=>{for(const [id,src] of [['bikeTripStart','start'],['bikeTripEnd','end']])$(id).value=$(src).value.trim();$('bikeTripRent').value='';$('bikeTripReturn').value='';$('bikeTripStrict').checked=false;fillBikeTripLimits();renderBikeTripChoice()});
 $('bikesResults').addEventListener('click',e=>{const b=e.target.closest('[data-bike-trip-role]');if(b)chooseBikeTrip(b.dataset.bikeTripRole,b.dataset.bikeTripStation)});
 for(const id of ['bikeTripStart','bikeTripEnd'])$(id).addEventListener('input',()=>clearBikeTrip('Lieux modifiés : recalculer les trois étapes.'));
 for(const id of ['bikeTripRent','bikeTripReturn','bikeTripStrict',...bikeTripLimitFields])$(id).addEventListener(id==='bikeTripStrict'||id.endsWith('Rule')?'change':'input',()=>{if(bikeTripJob)clearBikeTrip('Paramètres modifiés : calcul annulé.');else renderBikeTripSummary()});
 $('bikeTripLimitsReset').addEventListener('click',()=>{fillBikeTripLimits();if(bikeTripJob)clearBikeTrip('Limites modifiées : calcul annulé.');else renderBikeTripSummary();$('bikeTripWalkMax').focus()});
 $('bikeTripSearch').addEventListener('click',searchBikeTrip);$('bikeTripCancel').addEventListener('click',()=>clearBikeTrip('Parcours partagé annulé.'));
}

let cycleJob=null,cycleContext=null,cycleResult=null,cycleMap=null,cycleLayer=null,cycleNext=0;
const cycleCache=new Map();
function clearCycle(message=''){
 const job=cycleJob;cycleJob=null;if(job){job.controller.abort();if(activeAbort===job.controller){activeAbort=null;if(placePending){placePending.reject(new Error('Calcul vélo annulé.'));placePending=null;$('placeDialog').close()}lock(false)}}
 cycleResult=null;$('cycleResult').hidden=true;$('cycleStatus').textContent=message;$('cycleSearch').disabled=C.cyclingApi!==CYCLE_ENDPOINT;$('cycleCancel').hidden=true;$('cycleExportNote').textContent='';if(cycleLayer){cycleLayer.remove();cycleLayer=null}$('cycleSketch').replaceChildren();
}
function openCycle(){
 if(busy)return;clearCycle();const inputs=['start','end'].map(id=>$(id).value.trim());cycleContext={inputs,signature:transitInputSignature()};
 $('cyclePlaces').textContent=`Départ : ${inputs[0]||'à renseigner'}. Arrivée : ${inputs[1]||'à renseigner'}.`;
 if(C.cyclingApi!==CYCLE_ENDPOINT)$('cycleStatus').textContent='Le service vélo est actuellement désactivé.';
 $('cycleDialog').showModal();$('cycleTitle').focus();
}
function readCycleCriteria(prefix){const field=$(prefix==='cycle'?'cycleMax':prefix+'Limit'),rule=$(prefix+'Rule').value;if(field.validity.badInput||!['soft','strict'].includes(rule))throw new Error('Critères de distance vélo invalides.');return cycleCriteria(field.value,rule==='strict')}
function fillCycleCriteria(c){$('cycleMax').value=c.maxKm??'';$('cycleRule').value=c.strict?'strict':'soft'}
function updateComparisonWalkLimits(){const op=comparison;if(!op)return;if(op.running||op.limitContextSignature!==comparisonSignature(false)){comparisonChanged();return}try{Object.assign(op.hypotheses,readWalkingCriteria(true));op.walkError=null;if(op.selected==='walk'){fillWalkingCriteria(op.hypotheses);updateWalking()}}catch(e){op.walkError=e.message;if(op.selected==='walk'){$('maxWalkKm').value=$('comparisonWalkLimit').value;$('walkRule').value=$('comparisonWalkRule').value;updateWalking()}}op.signature=comparisonSignature();op.limitContextSignature=comparisonSignature(false);renderComparison(op)}
function updateComparisonCycleLimits(){const op=comparison;if(!op)return;if(op.running||op.limitContextSignature!==comparisonSignature(false)){comparisonChanged();return}try{op.cycleChoice={enabled:$('comparisonCycle').checked,...readCycleCriteria('comparisonCycle')};op.cycleError=null}catch(e){op.cycleError=e.message}op.signature=comparisonSignature();renderComparison(op)}
function transitLimitContextSignature(){return JSON.stringify([transitInputSignature(),...['transitWhen','transitDirection','transitWalk','transitCompare','transitCycle'].map(id=>$(id).type==='checkbox'?$(id).checked:$(id).value),comparisonCarSettings()])}
function updateTransitCycleLimits(){if(transitJob){clearTransit('Critères modifiés : calcul annulé.');return}const d=transitComparisonData,c=transitComparedCycle;if(!d||!c)return;if(d.signature!==transitLimitContextSignature()){clearTransit('Contexte modifié : relancer la recherche.');return}try{Object.assign(c,readCycleCriteria('transitCycle'),{criteriaError:null})}catch(e){c.criteriaError=e.message}renderTransitTimes(d.routes,d.roads,d.q)}
function showCyclePreference(){if(!cycleResult)return;try{const c=readCycleCriteria('cycle');$('cycleSave').disabled=false;$('cycleJournal').disabled=false;$('cyclePreference').textContent=cyclePreference(cycleResult.route.distance,c.maxKm,c.strict)}catch(e){$('cyclePreference').textContent='Critères invalides : '+e.message;$('cycleSave').disabled=true;$('cycleJournal').disabled=true}}
function drawCycle(r){
 const points=r.points.map(([lon,lat])=>[lat,lon]);if(cycleLayer){cycleLayer.remove();cycleLayer=null}
 $('cycleMap').hidden=!window.L;$('cycleSketch').toggleAttribute('hidden',Boolean(window.L));$('cycleSketch').replaceChildren();$('cycleMapNote').textContent='Bleu : parcours cyclable calculé. Les points marquent les extrémités du tracé ; le rattachement à l’adresse peut différer de 150 m au maximum.';
 if(window.L){try{if(!cycleMap){cycleMap=L.map('cycleMap',{scrollWheelZoom:false});L.tileLayer(C.tileUrl,{maxZoom:19,attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}).addTo(cycleMap);new ResizeObserver(()=>{cycleMap.invalidateSize();if(cycleLayer)cycleMap.fitBounds(cycleLayer.getBounds(),{padding:[24,24]})}).observe($('cycleMap'))}
  cycleLayer=L.featureGroup().addTo(cycleMap);L.polyline(points,{color:'#fff',weight:10}).addTo(cycleLayer);L.polyline(points,{color:'#1674d8',weight:6}).addTo(cycleLayer);
  for(const [p,label] of [[points[0],'Départ du tracé vélo'],[points.at(-1),'Arrivée du tracé vélo']])L.circleMarker(p,{radius:7,color:'#123252',fillColor:'#fff',fillOpacity:1}).bindTooltip(label).addTo(cycleLayer);cycleMap.invalidateSize();cycleMap.fitBounds(points,{padding:[24,24]});return;
 }catch{$('cycleMap').hidden=true;$('cycleSketch').removeAttribute('hidden')}}
 const xs=r.points.map(p=>p[0]),ys=r.points.map(p=>p[1]),minX=Math.min(...xs),minY=Math.min(...ys),dx=Math.max(.001,Math.max(...xs)-minX),dy=Math.max(.001,Math.max(...ys)-minY),scale=Math.min(560/dx,280/dy),line=document.createElementNS('http://www.w3.org/2000/svg','polyline');line.setAttribute('points',r.points.map(([x,y])=>`${20+(x-minX)*scale},${300-(y-minY)*scale}`).join(' '));line.setAttribute('fill','none');line.setAttribute('stroke','#80bdff');line.setAttribute('stroke-width','5');$('cycleSketch').append(line);$('cycleMapNote').textContent='Fond de carte indisponible : schéma du vrai tracé reçu, sans échelle. Distance et détail restent consultables.';
}
function renderCycle(r,places,at,cached,q){
 cycleResult={route:r,places,at,q};$('cycleResult').hidden=false;$('cyclePlaces').textContent=places.start+' → '+places.end;
 $('cycleStatus').textContent=`Parcours vélo disponible. ${cached?'Résultat conservé en mémoire, consulté':'Calcul consulté'} le ${bikesDate(at)}. ${r.dataVersion?'Version des données : '+r.dataVersion+'.':'Date des données routières non fournie.'}`;
 $('cycleMetrics').textContent=`${fmt(r.distance/1000,2)} km · ${Math.ceil(r.duration/60)} min estimées, hors pauses. ${r.pushingMeters>0?`${Math.ceil(r.pushingMeters)} m annoncés vélo à la main.`:'Passages vélo à la main : aucun annoncé.'}`;
 $('cycleSteps').innerHTML=r.steps.filter(s=>s.distance>0).map(s=>`<li><strong>${s.mode==='pushing bike'?'Vélo à la main':'Vélo'}</strong> · ${escapeHtml(s.name)||'Voie sans nom'} · ${Math.ceil(s.distance)} m</li>`).join('');showCyclePreference();drawCycle(r);
}
async function cycleFetch(q,job){
 const response=await fetch(q.url,{signal:job.controller.signal,credentials:'omit',referrerPolicy:'origin',redirect:'error'});
 if(response.status===429){cycleNext=Math.max(cycleNext,bikeRetryAfter(response.headers.get('Retry-After')));throw new Error('Limite du service vélo atteinte. Réessayer après '+bikesDate(cycleNext)+'.')}
 if(!response.ok&&response.status!==400)throw new Error('Service vélo indisponible (HTTP '+response.status+').');
 if(Number(response.headers.get('Content-Length'))>2000000)throw new Error('Réponse vélo trop volumineuse.');const reader=response.body.getReader(),chunks=[];let length=0;
 while(true){const {done,value}=await reader.read();if(done)break;length+=value.byteLength;if(length>2000000){await reader.cancel();throw new Error('Réponse vélo trop volumineuse.')}chunks.push(value)}
 const bytes=new Uint8Array(length);let pos=0;for(const c of chunks){bytes.set(c,pos);pos+=c.byteLength}let data;try{data=JSON.parse(new TextDecoder().decode(bytes))}catch{throw new Error('Réponse vélo illisible.')}return cycleResponse(data,q);
}
async function searchCycle(){
 if(busy||cycleJob||!cycleContext)return;const context=cycleContext;
 try{if(context.signature!==transitInputSignature())throw new Error('Lieux modifiés : rouvrir le calcul vélo.');if(context.inputs.some(x=>!x))throw new Error('Renseigner le départ et l’arrivée dans Mon trajet.');readCycleCriteria('cycle');if(C.cyclingApi!==CYCLE_ENDPOINT)throw new Error('Le service vélo est désactivé.');if(Date.now()<cycleNext)throw new Error('Patienter avant un nouveau calcul vélo : '+bikesDate(cycleNext)+'.')}catch(e){$('cycleStatus').textContent=e.message;return}
 clearCycle(context.fixedPlaces?'Préparation du nouveau calcul vélo…':'Vérification des lieux auprès de l’IGN…');const job={controller:new AbortController()};cycleJob=job;activeAbort=job.controller;lock(true);$('cycleSearch').disabled=true;$('cycleCancel').hidden=false;const limitsSignature=JSON.stringify([$('cycleMax').value,$('cycleRule').value]),current=()=>cycleJob===job&&context.signature===transitInputSignature()&&limitsSignature===JSON.stringify([$('cycleMax').value,$('cycleRule').value]);let timer;
 try{
  const work=async()=>{
   const a=context.fixedPlaces?.start||transitStoredPlace(context.inputs[0],'start')||await resolveTripPlace(context.inputs[0],'start',current);if(!current())return;
   const b=context.fixedPlaces?.end||transitStoredPlace(context.inputs[1],'end')||await resolveTripPlace(context.inputs[1],'end',current);if(!current())return;
   const q=cycleRequest([a.lon,a.lat],[b.lon,b.lat],C.cyclingApi),places={start:a.label,end:b.label},now=Date.now(),cached=cycleCache.get(q.url);
   if(!context.forceFresh&&cached&&now>=cached.at&&now-cached.at<300000){renderCycle(cached.route,places,cached.at,true,q);return}
   cycleNext=now+5000;$('cyclePlaces').textContent=places.start+' → '+places.end;$('cycleStatus').textContent='Calcul auprès du moteur vélo FOSSGIS…';
   const route=await cycleFetch(q,job);if(!current())return;const at=Date.now();if(cycleCache.size>=8)cycleCache.delete(cycleCache.keys().next().value);cycleCache.set(q.url,{route,at});renderCycle(route,places,at,false,q);
  };
  await Promise.race([work(),new Promise((_,reject)=>{timer=setTimeout(()=>{job.controller.abort();reject(new Error('Délai du calcul vélo dépassé. Relancer plus tard.'))},30000)})]);
 }catch(e){if(current())clearCycle(e.name==='AbortError'?'Calcul vélo interrompu.':e.message)}
 finally{clearTimeout(timer);if(cycleJob===job){cycleJob=null;if(activeAbort===job.controller)activeAbort=null;lock(false);$('cycleSearch').disabled=C.cyclingApi!==CYCLE_ENDPOINT;$('cycleCancel').hidden=true}}
}
function bindCycle(){
 $('cycleBtn').addEventListener('click',openCycle);$('cycleSearch').addEventListener('click',searchCycle);$('cycleCancel').addEventListener('click',()=>clearCycle('Calcul vélo annulé.'));
 $('cycleClose').addEventListener('click',()=>$('cycleDialog').close());$('cycleDialog').addEventListener('close',()=>{if($('cycleDialog').open)return;const back=cycleContext?.returnFocus;clearCycle();cycleContext=null;if(back?.isConnected&&back.getClientRects().length&&!back.disabled)back.focus();else if(!document.querySelector('dialog[open]'))$('cycleBtn').focus()});$('cycleDialog').addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();$('cycleDialog').close()}});
 for(const id of ['cycleMax','cycleRule'])$(id).addEventListener(id==='cycleMax'?'input':'change',()=>{if(cycleJob)clearCycle('Limite modifiée : calcul annulé.');else showCyclePreference()});
 for(const id of ['start','end'])$(id).addEventListener('input',()=>{clearCycle();cycleContext=null;if($('cycleDialog').open)$('cycleDialog').close()});
 $('cycleExport').addEventListener('click',()=>{if(!cycleResult||cycleJob)return;try{const r=cycleResult,url=URL.createObjectURL(new Blob([cycleGpx(r.route,r.places,new Date(r.at).toISOString())],{type:'application/gpx+xml;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='OuQuandQui_trajet_velo.gpx';document.body.append(a);try{a.click()}finally{a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000)}$('cycleExportNote').textContent='Téléchargement demandé. Tracé préparé, sans guidage en direct ni carte hors ligne.'}catch(e){$('cycleExportNote').textContent=e.message}});
}

async function loadComparedCycle(a,b,owner,current){
 const q=cycleRequest([a[1],a[0]],[b[1],b[0]],C.cyclingApi),now=Date.now();
 if(!current()||owner.controller.signal.aborted)throw new DOMException('Calcul vélo annulé.','AbortError');
 const cached=cycleCache.get(q.url);if(cached&&now>=cached.at&&now-cached.at<300000)return {route:cached.route,q,at:cached.at,cached:true};
 if(Date.now()<cycleNext)throw new Error('Patienter avant un nouveau calcul vélo : '+bikesDate(cycleNext)+'.');
 const job={controller:new AbortController()};let timer,abort;cycleNext=now+5000;
 try{
  const stopped=new Promise((_,reject)=>{abort=()=>{job.controller.abort();reject(new DOMException('Calcul vélo annulé.','AbortError'))};owner.controller.signal.addEventListener('abort',abort,{once:true});timer=setTimeout(()=>{job.controller.abort();reject(new Error('Délai du calcul vélo dépassé. Relancer plus tard.'))},30000)});
  const route=await Promise.race([cycleFetch(q,job),stopped]);if(!current()||owner.controller.signal.aborted)throw new DOMException('Calcul vélo annulé.','AbortError');
  const at=Date.now();if(cycleCache.size>=8)cycleCache.delete(cycleCache.keys().next().value);cycleCache.set(q.url,{route,at});return {route,q,at,cached:false};
 }finally{clearTimeout(timer);owner.controller.signal.removeEventListener('abort',abort)}
}
function comparedCycleNote(view,maxKm,strict=false){
 return `<p class="station-selection">${escapeHtml(cyclePreference(view.route.distance,maxKm,strict))}${maxKm===null?'':` Repère : ${fmt(maxKm,2)} km.`}</p><p class="note">${view.cached?'Résultat conservé en mémoire, consulté':'Calcul consulté'} le ${bikesDate(view.at)}. ${view.route.dataVersion?'Version annoncée : '+escapeHtml(view.route.dataVersion)+'.':'Date des données routières inconnue.'} ${view.route.pushingMeters>0?`${Math.ceil(view.route.pushingMeters)} m annoncés vélo à la main.`:'Aucun passage vélo à la main annoncé.'}</p><p class="note">Vélo classique personnel supposé disponible. Durée hors pauses ; terrain, matériel, allure du groupe, VAE et accessibilité non qualifiés. Coût et empreinte non estimés. <a href="https://routing.openstreetmap.de/about.html" target="_blank" rel="noopener noreferrer">FOSSGIS</a> · <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap · ODbL</a>.</p>`;
}
function cycleComparisonCard(e,op,time){
 const disabled=op.running||op.cycleError||(op.hypotheses.onlyBefore&&!time.admissible);
 return `<article class="comparison-card" data-compare-mode="cycle" data-timing-state="${time.state}"><h3>À vélo classique</h3><p class="station-selection">${escapeHtml(timingText(time))}</p><dl class="budget-lines"><div><dt>Distance</dt><dd>${fmt(e.route.distance/1000,1)} km</dd></div><div><dt>Durée estimée</dt><dd>${Math.round(e.route.duration/60)} min</dd></div><div><dt>Coût total du groupe</dt><dd>Non estimé</dd></div><div><dt>CO₂e du groupe</dt><dd>Non estimée</dd></div></dl>${op.cycleError?`<p class="app-notice">Critères invalides : ${escapeHtml(op.cycleError)}</p>`:comparedCycleNote(e.cycle,op.cycleChoice.maxKm,op.cycleChoice.strict)}<button type="button" class="ghost navigation-button" data-compare-cycle aria-haspopup="dialog" ${disabled?'disabled':''}>Consulter le parcours vélo</button></article>`;
}
function transitCycleDescription(){const c=transitComparedCycle;return c?`<section aria-label="Parcours vélo comparé"><p>${fmt(c.view.route.distance/1000,3)} km · ${Math.ceil(c.view.route.duration/60)} min de déplacement estimées, hors pauses.</p>${c.criteriaError?`<p>Critères invalides : ${escapeHtml(c.criteriaError)}</p>`:comparedCycleNote(c.view,c.maxKm,c.strict)}<button type="button" class="ghost navigation-button" data-transit-cycle aria-haspopup="dialog" ${c.criteriaError?'disabled':''}>Consulter le parcours vélo</button></section>`:''}
function openComparedCycle(view,places,maxKm,returnFocus,strict=false){
 if(busy)return;clearCycle();cycleContext={inputs:[places.start,places.end],signature:transitInputSignature(),forceFresh:true,fixedPlaces:{start:{label:places.start,lon:view.q.a[0],lat:view.q.a[1]},end:{label:places.end,lon:view.q.b[0],lat:view.q.b[1]}},returnFocus};
 fillCycleCriteria({maxKm,strict});$('cycleDialog').showModal();renderCycle(view.route,places,view.at,view.cached,view.q);$('cycleTitle').focus();
}

let pendingCycleJournal=null;
function cycleJournalOrigin(c,draft=false){return `Préparation à vélo classique FOSSGIS consultée le ${new Date(c.calculatedAt).toLocaleString('fr-FR')} : ${fmt(c.distanceMeters/1000,3)} km, ${Math.ceil(c.durationSeconds/60)} min estimées et ${Math.ceil(c.pushingMeters)} m annoncés vélo à la main. ${draft?'Choisir la date réellement effectuée et ajuster les lieux, le mode et la distance.':'Les informations déclarées restent distinctes de cette préparation.'} Ce calcul ne mesure pas le déplacement et ne confirme ni VAE, ni matériel, ni état des voies.`}
function offerCycleJournal(draft){
 pendingCollectiveJournal=null;
 for(const id of ['transitDialog','cycleDialog','preparedDialog'])if($(id).open)$(id).close();
 pendingCycleJournal=draft;openJournal();
 if(journal.enabled&&!journalBlocked)usePendingCycleJournal();else if(!journalBlocked)$('journalMessage').textContent='Activer le journal pour examiner ce brouillon vélo. Aucun déplacement n’a été enregistré.';
}
function usePendingCycleJournal(){if(!pendingCycleJournal||!journal.enabled||journalBlocked)return;const draft=pendingCycleJournal;pendingCycleJournal=null;renderJournal();journalForm(null,false,draft)}
function journalFromCycle(){
 if(busy||cycleJob||!cycleResult?.q)return;
 try{const r=cycleResult;offerCycleJournal(cycleJournalDraft(r.route,r.places,new Date(r.at).toISOString(),new Date().toISOString(),crypto.randomUUID()))}catch(e){$('cycleStatus').textContent='Brouillon impossible. '+e.message}
}
function journalFromSavedCycle(){
 const e=savedCycle.entries.find(x=>x.id===savedCycleSelected);if(busy||savedCycleBlocked||!e)return;
 try{offerCycleJournal(cycleJournalDraft(e.snapshot.route,{start:e.places.start.label,end:e.places.end.label},e.snapshot.calculatedAt,new Date().toISOString(),crypto.randomUUID()))}catch(err){$('savedCycleMessage').textContent='Brouillon impossible. '+err.message}
}
function bindCycleJournal(){
 $('cycleJournal').addEventListener('click',journalFromCycle);$('savedCycleJournal').addEventListener('click',journalFromSavedCycle);$('journalCyclePending').addEventListener('click',usePendingCycleJournal);
}

const SAVED_CYCLE_KEY='dragonroute.cycling-prepared.v2.'+PROFILE_SCOPE,SAVED_CYCLE_LEGACY_KEY='dragonroute.cycling-prepared.v1.'+PROFILE_SCOPE;
function cycleStorageUnchanged(){return localStorage.getItem(SAVED_CYCLE_KEY)===savedCycleRaw&&localStorage.getItem(SAVED_CYCLE_LEGACY_KEY)===savedCycleLegacyRaw}
let savedCycle={kind:'dragonroute-cycling-preparations',version:2,entries:[]},savedCycleRaw=null,savedCycleLegacyRaw=null,savedCycleBlocked=false,savedCycleDraft=null,savedCycleSelected=null,savedCycleImport=null,savedCycleSequence=0;
function loadSavedCycle(){
 savedCycle={kind:'dragonroute-cycling-preparations',version:2,entries:[]};savedCycleRaw=null;savedCycleLegacyRaw=null;savedCycleBlocked=false;$('savedCycleMessage').textContent='';
 try{savedCycleRaw=localStorage.getItem(SAVED_CYCLE_KEY);savedCycleLegacyRaw=localStorage.getItem(SAVED_CYCLE_LEGACY_KEY);const raw=savedCycleRaw??savedCycleLegacyRaw;if(raw!==null)savedCycle=parseSavedCycleText(raw);if(savedCycleRaw===null&&savedCycleLegacyRaw!==null)$('savedCycleMessage').textContent='Ancien format chargé avec préférences souples. Une prochaine sauvegarde utilise le format 2 ; l’original reste conservé et exportable.'}catch{savedCycleBlocked=true;$('savedCycleMessage').textContent='Préparations vélo non chargées : données invalides, version inconnue ou stockage inaccessible. Le fichier d’origine reste protégé.'}
}
function writeSavedCycle(next){
 try{if(savedCycleBlocked)throw new Error('Stockage vélo protégé.');if(!cycleStorageUnchanged())throw new Error('Préparations vélo modifiées dans un autre onglet. Fermer puis rouvrir Mes trajets avant de réessayer.');const clean=validateSavedCycle(next),raw=JSON.stringify(clean);localStorage.setItem(SAVED_CYCLE_KEY,raw);savedCycle=clean;savedCycleRaw=raw;return true}catch(e){$('savedCycleMessage').textContent='Enregistrement impossible. '+e.message;return false}
}
function resetSavedCycle(){savedCycleSequence++;savedCycleDraft=null;savedCycleImport=null;savedCycleSelected=null;$('savedCycleEditor').hidden=true;loadSavedCycle();renderSavedCycle()}
function savedCycleDescription(e,diagram=false){
 const r=e.snapshot.route,limit=e.criteria.maxKm;
 return `<h3>${escapeHtml(e.name)}</h3><p>${escapeHtml(e.places.start.label)} → ${escapeHtml(e.places.end.label)}</p><p class="note">Enregistré le ${savedTransitClock(Date.parse(e.savedAt))}. Calcul consulté le ${savedTransitClock(Date.parse(e.snapshot.calculatedAt))}. Heure de Paris.</p><p><strong>Instantané vélo classique : ${fmt(r.distance/1000,2)} km · ${Math.ceil(r.duration/60)} min estimées, hors pauses.</strong> Les conditions actuelles ne sont pas vérifiées.</p><p>Limite souhaitée : ${limit===null?'non renseignée':fmt(limit,2)+' km'}. ${cyclePreference(r.distance,limit,e.criteria.strict)} ${r.pushingMeters>0?Math.ceil(r.pushingMeters)+' m annoncés vélo à la main.':'Aucun passage vélo à la main annoncé.'}</p>${diagram?preparedSchemaSvg({snapshot:{geometry:r.points,stop:null}})+'<p class="note">Schéma local du tracé conservé, sans échelle ni fond de carte.</p><details><summary>Voies et passages conservés</summary><ol>'+r.steps.filter(s=>s.distance>0).map(s=>`<li>${s.mode==='pushing bike'?'Vélo à la main':'Vélo'} · ${escapeHtml(s.name)||'Voie sans nom'} · ${Math.ceil(s.distance)} m</li>`).join('')+'</ol></details>':''}<p class="note">Source déclarée : <a href="https://routing.openstreetmap.de/about.html" target="_blank" rel="noopener noreferrer">OSRM / FOSSGIS</a> · <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap · ODbL</a>. ${r.dataVersion?'Version annoncée : '+escapeHtml(r.dataVersion)+'.':'Date des données routières inconnue.'} Un import reste déclaratif ; sa conformité n’authentifie pas son origine. VAE, terrain, prix et empreinte non qualifiés.</p>`;
}
function renderSavedCycle(){
 for(const id of ['savedCycleExport','savedCycleImportFile','savedCycleBackup'])$(id).disabled=savedCycleBlocked;
 $('savedCycleRawExport').hidden=!savedCycleBlocked||(savedCycleRaw??savedCycleLegacyRaw)===null;$('savedCycleLegacyExport').hidden=savedCycleLegacyRaw===null;
 $('savedCycleList').innerHTML=savedCycle.entries.length?savedCycle.entries.map(e=>`<article class="saved-row"><strong>${escapeHtml(e.name)}</strong><p>${escapeHtml(e.places.start.label)} → ${escapeHtml(e.places.end.label)}</p><p>Vélo classique · ${fmt(e.snapshot.route.distance/1000,2)} km · calcul conservé du ${savedTransitClock(Date.parse(e.snapshot.calculatedAt))}</p><div class="row-actions"><button type="button" class="ghost" data-saved-cycle-show="${e.id}">Consulter</button><button type="button" class="ghost" data-saved-cycle-rename="${e.id}">Renommer</button><button type="button" class="ghost" data-saved-cycle-delete="${e.id}">Supprimer</button></div></article>`).join(''):'<p class="note">Aucune préparation vélo chargée. Après un calcul vélo, choisir « Enregistrer ce parcours vélo ».</p>';
 const e=savedCycle.entries.find(x=>x.id===savedCycleSelected);$('savedCycleView').hidden=!e;$('savedCycleDetails').innerHTML=e?savedCycleDescription(e,true):'';
}
function updateSavedCycleDraft(){
 if(!savedCycleDraft)return;const e={...savedCycleDraft.entry,name:$('savedCycleName').value},dups=savedCycleDuplicates(e,savedCycle.entries);$('savedCycleDuplicateRow').hidden=!dups.length;$('savedCycleDuplicateNote').textContent=dups.length?'Ce nom ou ces lieux et critères figurent déjà dans les préparations vélo. Vérifier avant de conserver une autre préparation.':'';$('savedCycleSave').disabled=savedCycleBlocked||!e.name.trim()||!$('savedCycleConfirm').checked||(dups.length&&!$('savedCycleDuplicate').checked);
}
function editSavedCycle(e,mode){savedCycleDraft={entry:e,mode};$('savedCycleEditor').hidden=false;$('savedCycleEditorTitle').textContent=mode==='rename'?'Renommer la préparation vélo':'Enregistrer la préparation vélo';$('savedCycleName').value=e.name;$('savedCycleConfirm').checked=false;$('savedCycleDuplicate').checked=false;updateSavedCycleDraft();$('savedCycleName').focus()}
function offerSavedCycle(){
 if(busy||cycleJob||!cycleResult?.q)return;
 try{const r=cycleResult,e=validateSavedCycleEntry({id:crypto.randomUUID(),name:(r.places.start+' → '+r.places.end).slice(0,80),savedAt:new Date().toISOString(),places:{start:{label:r.places.start,lat:r.q.a[1],lon:r.q.a[0]},end:{label:r.places.end,lat:r.q.b[1],lon:r.q.b[0]}},criteria:readCycleCriteria('cycle'),snapshot:{source:'fossgis-bike',profile:'bicycle',calculatedAt:new Date(r.at).toISOString(),route:structuredClone(r.route)}});clearCycle();if($('transitDialog').open)$('transitDialog').close();$('cycleDialog').close();openPreparedTrips();setPreparedTab('cycle');editSavedCycle(e,'new')}catch(e){$('cycleStatus').textContent='Sauvegarde impossible. '+e.message}
}
function resumeSavedCycle(e){
 if(busy)return;clearCycle();cycleContext={inputs:[e.places.start.label,e.places.end.label],signature:transitInputSignature(),fixedPlaces:structuredClone(e.places),forceFresh:true};fillCycleCriteria(e.criteria);$('cyclePlaces').textContent=e.places.start.label+' → '+e.places.end.label;
 $('preparedDialog').close();$('cycleDialog').showModal();$('cycleStatus').textContent=`Préparation « ${e.name} » reprise avec ses lieux mémorisés. Aucun nouveau calcul. ${C.cyclingApi===CYCLE_ENDPOINT?'Lancer le calcul pour consulter un nouveau parcours.':'Service vélo actuellement désactivé.'}`;$('cycleTitle').focus();
}
function downloadCycleText(text,name,type='application/json;charset=utf-8'){
 const url=URL.createObjectURL(new Blob([text],{type})),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);try{a.click()}finally{a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000)}
}
function bindSavedCycle(){
 $('cycleSave').addEventListener('click',offerSavedCycle);
 $('savedCycleName').addEventListener('input',()=>{$('savedCycleConfirm').checked=false;$('savedCycleDuplicate').checked=false;updateSavedCycleDraft()});for(const id of ['savedCycleConfirm','savedCycleDuplicate'])$(id).addEventListener('change',updateSavedCycleDraft);
 $('savedCycleForm').addEventListener('submit',ev=>{ev.preventDefault();if(!savedCycleDraft)return;try{const e=validateSavedCycleEntry({...savedCycleDraft.entry,name:$('savedCycleName').value,savedAt:savedCycleDraft.mode==='new'?new Date().toISOString():savedCycleDraft.entry.savedAt});if(!$('savedCycleConfirm').checked||(savedCycleDuplicates(e,savedCycle.entries).length&&!$('savedCycleDuplicate').checked))throw new Error('Confirmer la sauvegarde et le doublon éventuel.');const entries=savedCycleDraft.mode==='rename'?savedCycle.entries.map(x=>x.id===e.id?e:x):[...savedCycle.entries,e];if(writeSavedCycle({...savedCycle,entries})){savedCycleDraft=null;savedCycleSelected=e.id;$('savedCycleEditor').hidden=true;renderSavedCycle();$('savedCycleMessage').textContent='Préparation vélo enregistrée dans ce navigateur.';$('savedCycleView').scrollIntoView({block:'start'})}}catch(e){$('savedCycleMessage').textContent=e.message}});
 $('savedCycleList').addEventListener('click',ev=>{const b=ev.target.closest('button');if(!b)return;const id=b.dataset.savedCycleShow||b.dataset.savedCycleRename||b.dataset.savedCycleDelete,e=savedCycle.entries.find(x=>x.id===id);if(!e)return;if(b.dataset.savedCycleRename)editSavedCycle(structuredClone(e),'rename');else if(b.dataset.savedCycleShow){savedCycleDraft=null;$('savedCycleEditor').hidden=true;savedCycleSelected=id;renderSavedCycle();$('savedCycleView').scrollIntoView({block:'start'})}else if(confirm(`Supprimer la préparation vélo « ${e.name} » ?`)&&writeSavedCycle({...savedCycle,entries:savedCycle.entries.filter(x=>x.id!==id)})){savedCycleDraft=null;savedCycleSelected=null;$('savedCycleEditor').hidden=true;renderSavedCycle();$('savedCycleMessage').textContent='Préparation vélo supprimée.'}});
 $('savedCycleResume').addEventListener('click',()=>{const e=savedCycle.entries.find(x=>x.id===savedCycleSelected);if(e)resumeSavedCycle(e)});
 $('savedCycleGpx').addEventListener('click',()=>{const e=savedCycle.entries.find(x=>x.id===savedCycleSelected);if(!e)return;try{downloadCycleText(cycleGpx(e.snapshot.route,{start:e.places.start.label,end:e.places.end.label},e.snapshot.calculatedAt),'OuQuandQui-velo-instantane.gpx','application/gpx+xml;charset=utf-8');$('savedCycleMessage').textContent='Téléchargement du tracé historique demandé, sans actualisation.'}catch(err){$('savedCycleMessage').textContent=err.message}});
 for(const id of ['savedCycleExport','savedCycleBackup'])$(id).addEventListener('click',()=>{if(!savedCycleBlocked)downloadProfile(savedCycle,'OuQuandQui-preparations-velo.json')});
 $('savedCycleRawExport').addEventListener('click',()=>{const raw=savedCycleRaw??savedCycleLegacyRaw;if(raw!==null)downloadCycleText(raw,'OuQuandQui-velo-original-non-valide.json')});
 $('savedCycleLegacyExport').addEventListener('click',()=>{if(savedCycleLegacyRaw!==null)downloadCycleText(savedCycleLegacyRaw,'OuQuandQui-velo-original-v1.json')});
 $('savedCycleErase').addEventListener('click',()=>{if(!confirm('Effacer les préparations vélo et leurs copies de format ancien de cet environnement ? Exporter une copie avant de confirmer. Les autres préparations restent conservées.'))return;try{if(!cycleStorageUnchanged())throw new Error('Données modifiées dans un autre onglet : fermer puis rouvrir Mes trajets.');localStorage.removeItem(SAVED_CYCLE_KEY);localStorage.removeItem(SAVED_CYCLE_LEGACY_KEY);resetSavedCycle();$('savedCycleMessage').textContent='Préparations vélo effacées.'}catch(e){$('savedCycleMessage').textContent='Effacement impossible. '+e.message}});
 $('savedCycleImportFile').addEventListener('change',async ev=>{const seq=++savedCycleSequence,file=ev.target.files?.[0];ev.target.value='';savedCycleImport=null;if(!file)return;try{if(savedCycleBlocked)throw new Error('Stockage vélo protégé.');if(file.size>2000000)throw new Error('Fichier supérieur à 2 Mo.');const data=parseSavedCycleText(await file.text());if(seq!==savedCycleSequence||!$('preparedDialog').open||$('savedCyclePanel').hidden)return;savedCycleImport=data;$('savedCycleImportSummary').textContent=`${file.name} : ${data.entries.length} préparation(s) vélo, en remplacement des ${savedCycle.entries.length} chargées.${data.entries.length?'':' Le fichier vide effacera la liste vélo après confirmation.'}`;$('savedCycleImportDetails').innerHTML=data.entries.map(e=>`<details><summary>${escapeHtml(e.name)}</summary>${savedCycleDescription(e)}</details>`).join('');$('savedCycleImportConfirm').checked=false;$('savedCycleImportApply').disabled=true;$('savedCycleImportMessage').textContent='';$('savedCycleImportDialog').showModal()}catch(e){if(seq===savedCycleSequence)$('savedCycleMessage').textContent='Import vélo refusé. '+e.message}});
 $('savedCycleImportConfirm').addEventListener('change',()=>{$('savedCycleImportApply').disabled=!savedCycleImport||!$('savedCycleImportConfirm').checked});
 $('savedCycleImportApply').addEventListener('click',()=>{if(!savedCycleImport||!$('savedCycleImportConfirm').checked)return;if(writeSavedCycle(savedCycleImport)){savedCycleImport=null;savedCycleDraft=null;savedCycleSelected=null;$('savedCycleEditor').hidden=true;renderSavedCycle();$('savedCycleImportDialog').close();$('savedCycleMessage').textContent='Préparations vélo restaurées. Aucun calcul ni appel réseau.'}else $('savedCycleImportMessage').textContent=$('savedCycleMessage').textContent});
 const cancel=()=>{savedCycleSequence++;savedCycleImport=null};$('savedCycleImportDialog').addEventListener('cancel',cancel);$('savedCycleImportDialog').querySelector('.close-dialog').addEventListener('click',cancel);$('savedCycleImportDialog').addEventListener('close',()=>{if($('savedCycleImportDialog').open)return;cancel();if($('preparedDialog').open&&!$('savedCyclePanel').hidden)$('savedCycleImportFile').focus()});$('preparedDialog').addEventListener('close',()=>{if($('preparedDialog').open)return;cancel();savedCycleDraft=null});
}

const SAVED_SHARED_KEY='dragonroute.shared-bike-prepared.v2.'+PROFILE_SCOPE,SAVED_SHARED_LEGACY_KEY='dragonroute.shared-bike-prepared.v1.'+PROFILE_SCOPE;
function sharedStorageUnchanged(){return localStorage.getItem(SAVED_SHARED_KEY)===savedSharedRaw&&localStorage.getItem(SAVED_SHARED_LEGACY_KEY)===savedSharedLegacyRaw}
let savedShared={kind:'dragonroute-shared-bike-preparations',version:2,entries:[]},savedSharedRaw=null,savedSharedLegacyRaw=null,savedSharedBlocked=false,savedSharedDraft=null,savedSharedSelected=null,savedSharedImport=null,savedSharedSequence=0;
function loadSavedShared(){
 savedShared={kind:'dragonroute-shared-bike-preparations',version:2,entries:[]};savedSharedRaw=null;savedSharedLegacyRaw=null;savedSharedBlocked=false;$('savedSharedMessage').textContent='';
 try{savedSharedRaw=localStorage.getItem(SAVED_SHARED_KEY);savedSharedLegacyRaw=localStorage.getItem(SAVED_SHARED_LEGACY_KEY);const raw=savedSharedRaw??savedSharedLegacyRaw;if(raw!==null)savedShared=parseSavedSharedText(raw);if(savedSharedRaw===null&&savedSharedLegacyRaw!==null)$('savedSharedMessage').textContent='Ancien format chargé sans limite de distance. Une prochaine sauvegarde utilise le nouveau format ; l’original reste conservé et exportable.'}catch{savedSharedBlocked=true;$('savedSharedMessage').textContent='Préparations partagées non chargées : données invalides, version inconnue ou stockage inaccessible. Le fichier d’origine reste protégé.'}
}
function writeSavedShared(next){
 try{if(savedSharedBlocked)throw new Error('Stockage partagé protégé.');if(!sharedStorageUnchanged())throw new Error('Préparations partagées modifiées dans un autre onglet. Fermer puis rouvrir Mes trajets avant de réessayer.');const clean=validateSavedShared(next),raw=JSON.stringify(clean);localStorage.setItem(SAVED_SHARED_KEY,raw);savedShared=clean;savedSharedRaw=raw;return true}catch(e){$('savedSharedMessage').textContent='Enregistrement impossible. '+e.message;return false}
}
function resetSavedShared(){savedSharedSequence++;savedSharedDraft=null;savedSharedImport=null;savedSharedSelected=null;$('savedSharedEditor').hidden=true;loadSavedShared();renderSavedShared()}
function updateSavedSharedDraft(){
 if(!savedSharedDraft)return;const e={...savedSharedDraft.entry,name:$('savedSharedName').value},dups=savedSharedDuplicates(e,savedShared.entries);$('savedSharedDuplicateRow').hidden=!dups.length;$('savedSharedDuplicateNote').textContent=dups.length?'Ce nom ou ces lieux et critères figurent déjà dans les préparations partagées. Vérifier avant de conserver une autre préparation.':'';$('savedSharedSave').disabled=savedSharedBlocked||!e.name.trim()||!$('savedSharedConfirm').checked||(dups.length&&!$('savedSharedDuplicate').checked);
}
function editSavedShared(e,mode){savedSharedDraft={entry:e,mode};$('savedSharedEditor').hidden=false;$('savedSharedEditorTitle').textContent=mode==='rename'?'Renommer la préparation partagée':'Enregistrer la préparation partagée';$('savedSharedName').value=e.name;$('savedSharedConfirm').checked=false;$('savedSharedDuplicate').checked=false;updateSavedSharedDraft();$('savedSharedName').focus()}
function bindSavedShared(){
 $('bikesResumeAccept').addEventListener('click',acceptSharedStations);
 $('bikeTripSave').addEventListener('click',offerSavedShared);
 $('savedSharedName').addEventListener('input',()=>{$('savedSharedConfirm').checked=false;$('savedSharedDuplicate').checked=false;updateSavedSharedDraft()});for(const id of ['savedSharedConfirm','savedSharedDuplicate'])$(id).addEventListener('change',updateSavedSharedDraft);
 $('savedSharedForm').addEventListener('submit',ev=>{ev.preventDefault();if(!savedSharedDraft)return;try{const e=validateSavedSharedEntry({...savedSharedDraft.entry,name:$('savedSharedName').value,savedAt:savedSharedDraft.mode==='new'?new Date().toISOString():savedSharedDraft.entry.savedAt});if(!$('savedSharedConfirm').checked||(savedSharedDuplicates(e,savedShared.entries).length&&!$('savedSharedDuplicate').checked))throw new Error('Confirmer la sauvegarde et le doublon éventuel.');const entries=savedSharedDraft.mode==='rename'?savedShared.entries.map(x=>x.id===e.id?e:x):[...savedShared.entries,e];if(writeSavedShared({...savedShared,entries})){savedSharedDraft=null;savedSharedSelected=e.id;$('savedSharedEditor').hidden=true;renderSavedShared();$('savedSharedMessage').textContent='Préparation partagée enregistrée dans ce navigateur.';$('savedSharedView').scrollIntoView({block:'start'})}}catch(e){$('savedSharedMessage').textContent=e.message}});
 $('savedSharedList').addEventListener('click',ev=>{const b=ev.target.closest('button');if(!b)return;const id=b.dataset.savedSharedShow||b.dataset.savedSharedRename||b.dataset.savedSharedDelete,e=savedShared.entries.find(x=>x.id===id);if(!e)return;if(b.dataset.savedSharedRename)editSavedShared(structuredClone(e),'rename');else if(b.dataset.savedSharedShow){savedSharedDraft=null;$('savedSharedEditor').hidden=true;savedSharedSelected=id;renderSavedShared();$('savedSharedView').scrollIntoView({block:'start'})}else if(confirm(`Supprimer la préparation partagée « ${e.name} » ?`)&&writeSavedShared({...savedShared,entries:savedShared.entries.filter(x=>x.id!==id)})){savedSharedDraft=null;savedSharedSelected=null;$('savedSharedEditor').hidden=true;renderSavedShared();$('savedSharedMessage').textContent='Préparation partagée supprimée.'}});
 $('savedSharedResume').addEventListener('click',()=>{const e=savedShared.entries.find(x=>x.id===savedSharedSelected);if(e)resumeSavedShared(e)});
 for(const id of ['savedSharedExport','savedSharedBackup'])$(id).addEventListener('click',()=>{if(!savedSharedBlocked)downloadProfile(savedShared,'OuQuandQui-preparations-partagees.json')});
 $('savedSharedRawExport').addEventListener('click',()=>{const raw=savedSharedRaw??savedSharedLegacyRaw;if(raw!==null)downloadCycleText(raw,'OuQuandQui-partage-original-non-valide.json')});
 $('savedSharedLegacyExport').addEventListener('click',()=>{if(savedSharedLegacyRaw!==null)downloadCycleText(savedSharedLegacyRaw,'OuQuandQui-partage-original-v1.json')});
 $('savedSharedErase').addEventListener('click',()=>{if(!confirm('Effacer les préparations partagées et leurs copies de format ancien dans cet environnement ? Exporter une copie avant de confirmer. Les autres préparations restent conservées.'))return;try{if(!sharedStorageUnchanged())throw new Error('Données modifiées dans un autre onglet : fermer puis rouvrir Mes trajets.');localStorage.removeItem(SAVED_SHARED_KEY);localStorage.removeItem(SAVED_SHARED_LEGACY_KEY);resetSavedShared();$('savedSharedMessage').textContent='Préparations partagées effacées.'}catch(e){$('savedSharedMessage').textContent='Effacement impossible. '+e.message}});
 $('savedSharedImportFile').addEventListener('change',async ev=>{const seq=++savedSharedSequence,file=ev.target.files?.[0];ev.target.value='';savedSharedImport=null;if(!file)return;try{if(savedSharedBlocked)throw new Error('Stockage partagé protégé.');if(file.size>2000000)throw new Error('Fichier supérieur à 2 Mo.');const data=parseSavedSharedText(await file.text());if(seq!==savedSharedSequence||!$('preparedDialog').open||$('savedSharedPanel').hidden)return;savedSharedImport=data;$('savedSharedImportSummary').textContent=`${file.name} : ${data.entries.length} préparation(s) vélo, en remplacement des ${savedShared.entries.length} chargées.${data.entries.length?'':' Le fichier vide effacera la liste partagée après confirmation.'}`;$('savedSharedImportDetails').innerHTML=data.entries.map(e=>`<details><summary>${escapeHtml(e.name)}</summary>${savedSharedDescription(e)}</details>`).join('');$('savedSharedImportConfirm').checked=false;$('savedSharedImportApply').disabled=true;$('savedSharedImportMessage').textContent='';$('savedSharedImportDialog').showModal()}catch(e){if(seq===savedSharedSequence)$('savedSharedMessage').textContent='Import partagé refusé. '+e.message}});
 $('savedSharedImportConfirm').addEventListener('change',()=>{$('savedSharedImportApply').disabled=!savedSharedImport||!$('savedSharedImportConfirm').checked});
 $('savedSharedImportApply').addEventListener('click',()=>{if(!savedSharedImport||!$('savedSharedImportConfirm').checked)return;if(writeSavedShared(savedSharedImport)){savedSharedImport=null;savedSharedDraft=null;savedSharedSelected=null;$('savedSharedEditor').hidden=true;renderSavedShared();$('savedSharedImportDialog').close();$('savedSharedMessage').textContent='Préparations partagées restaurées. Aucun calcul ni appel réseau.'}else $('savedSharedImportMessage').textContent=$('savedSharedMessage').textContent});
 const cancel=()=>{savedSharedSequence++;savedSharedImport=null};$('savedSharedImportDialog').addEventListener('cancel',cancel);$('savedSharedImportDialog').querySelector('.close-dialog').addEventListener('click',cancel);$('savedSharedImportDialog').addEventListener('close',()=>{if($('savedSharedImportDialog').open)return;cancel();if($('preparedDialog').open&&!$('savedSharedPanel').hidden)$('savedSharedImportFile').focus()});$('preparedDialog').addEventListener('close',()=>{if($('preparedDialog').open)return;cancel();savedSharedDraft=null});
}
function savedSharedDiagram(parts){
 const points=parts.flatMap(p=>p.points),xs=points.map(p=>p[0]),ys=points.map(p=>p[1]),x=Math.min(...xs),y=Math.min(...ys),dx=Math.max(.001,Math.max(...xs)-x),dy=Math.max(.001,Math.max(...ys)-y),scale=Math.min(550/dx,220/dy);
 return '<svg class="prepared-schema" viewBox="0 0 600 260" role="img" aria-label="Schéma historique marche et vélo partagé, sans fond de carte">'+parts.map(p=>'<polyline points="'+p.points.map(([lon,lat])=>(25+(lon-x)*scale).toFixed(2)+','+(240-(lat-y)*scale).toFixed(2)).join(' ')+'" fill="none" stroke="'+(p.mode==='walk'?'#d2b8ff':'#80bdff')+'" stroke-width="5" '+(p.mode==='walk'?'stroke-dasharray="6 7"':'')+'/>').join('')+'</svg><p class="note">Schéma local sans échelle : marche violette, vélo bleu. Trois tracés conservés, sans raccordement ajouté.</p>';
}
function savedSharedDescription(e,diagram=false){
 const t=savedSharedTotals(e),a=e.snapshot.availability,c=e.criteria,mins=v=>v===null?'inconnu':fmt(v,1)+' min',labels=[e.places.start.label,e.stations.pickup.name,e.stations.dropoff.name,e.places.end.label];
 const timing=!t.limits.admissible?'Limite impérative de distance non satisfaite à la capture : durée assemblée non proposée.':!t.available?'Le filtre strict n’était pas satisfait à la capture.':t.duration===null?'Durée assemblée non estimée : temps manquant ou écart entre tracés supérieur à 30 m.':'Somme historique des étapes et temps renseignés : '+Math.ceil(t.duration/60)+' min, hors pauses supplémentaires et accès fin aux bornes.';
 const announcements=['pickup','dropoff'].map((role,i)=>{const s=e.stations[role],r=a[role],count=i?r.docks:r.mechanical;return '<p><strong>'+['Prise','Restitution'][i]+' · '+escapeHtml(s.name)+'</strong> · identifiant '+escapeHtml(s.id)+'<br>'+escapeHtml(s.address||'Adresse non renseignée')+'<br>Ancienne annonce : '+(count===null?'compte inconnu':count+' '+(i?'place(s)':'vélo(s) mécanique(s)'))+' · '+bikesDate(r.reported)+'.</p>'}).join('');
 return '<h3>'+escapeHtml(e.name)+'</h3><p>'+escapeHtml(labels.join(' → '))+'</p><p class="note">Enregistré le '+savedTransitClock(Date.parse(e.savedAt))+'. Capture du '+savedTransitClock(Date.parse(e.snapshot.capturedAt))+'. Heure de Paris.</p><p class="app-notice">Préparation historique. Les disponibilités actuelles ne sont pas vérifiées ; aucune réservation.</p><p>'+fmt(t.distance/1000,2)+' km dont '+fmt(t.walking/1000,2)+' km à pied · '+Math.ceil(t.moving/60)+' min de déplacement estimées.</p><p>'+timing+'</p><p>'+escapeHtml(bikeTripLimitsText(t.limits))+'</p><p>Temps personnels conservés : prise '+mins(c.rentMinutes)+', restitution '+mins(c.returnMinutes)+'. Filtre de disponibilité récente : '+(c.strictAvailability?'demandé':'non demandé')+'.</p><ol class="transit-legs">'+e.snapshot.parts.map((p,i)=>'<li><strong>'+['Marche','Vélo classique','Marche'][i]+'</strong> · '+escapeHtml(labels[i])+' → '+escapeHtml(labels[i+1])+'<br>'+fmt(p.distance/1000,2)+' km · '+Math.ceil(p.duration/60)+' min'+(p.pushing?' · '+Math.ceil(p.pushing)+' m annoncés vélo à la main':'')+'.<p class="note">'+({ 'ign-pedestrian':'IGN piéton','fossgis-bike':'FOSSGIS vélo classique','same-point':'Même point demandé, sans marche calculée'}[p.source])+' · consultation conservée du '+savedTransitClock(Date.parse(p.at))+(p.cached?' · cache daté':'')+'. '+(p.version?'Version : '+escapeHtml(p.version):'Version des données inconnue.')+'</p></li>').join('')+'</ol>'+(diagram?savedSharedDiagram(e.snapshot.parts):'')+'<p class="note">Écarts historiques entre tracés : '+t.joins.map(n=>fmt(n,1)+' m').join(' puis ')+'. Accès réel aux bornes non vérifié.</p><details><summary>Stations et anciennes annonces conservées</summary>'+announcements+'<p class="note">Consultation du catalogue : '+savedTransitClock(Date.parse(a.observed))+'. Flux de disponibilité : '+bikesDate(a.statusUpdated)+'. Ces annonces ne sont jamais utilisées comme disponibilités actuelles.</p></details><p class="note">Sources déclarées : <a href="https://data.grandlyon.com/" target="_blank" rel="noopener noreferrer">Vélo’v / Métropole de Lyon</a>, IGN BD TOPO (Licence Ouverte 2.0), <a href="https://routing.openstreetmap.de/about.html" target="_blank" rel="noopener noreferrer">FOSSGIS</a> et <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap · ODbL</a>. Un import est déclaratif et n’authentifie pas les sources. Prix de location, empreinte, batterie et état actuel du parcours inconnus. Aucun déplacement effectué déduit.</p>';
}
function renderSavedShared(){
 for(const id of ['savedSharedExport','savedSharedImportFile','savedSharedBackup'])$(id).disabled=savedSharedBlocked;
 $('savedSharedRawExport').hidden=!savedSharedBlocked||(savedSharedRaw??savedSharedLegacyRaw)===null;$('savedSharedLegacyExport').hidden=savedSharedLegacyRaw===null;
 $('savedSharedList').innerHTML=savedShared.entries.length?savedShared.entries.map(e=>'<article class="saved-row"><strong>'+escapeHtml(e.name)+'</strong><p>'+escapeHtml(e.places.start.label)+' → '+escapeHtml(e.places.end.label)+'</p><p>Marche et vélo partagé · '+fmt(bikeTripTotals(e.snapshot.parts,null,null).distance/1000,2)+' km · capture du '+savedTransitClock(Date.parse(e.snapshot.capturedAt))+'</p><div class="row-actions"><button type="button" class="ghost" data-saved-shared-show="'+e.id+'">Consulter</button><button type="button" class="ghost" data-saved-shared-rename="'+e.id+'">Renommer</button><button type="button" class="ghost" data-saved-shared-delete="'+e.id+'">Supprimer</button></div></article>').join(''):'<p class="note">Aucune préparation partagée chargée. Après le calcul des trois étapes, choisir « Enregistrer ce parcours partagé ».</p>';
 const e=savedShared.entries.find(x=>x.id===savedSharedSelected);$('savedSharedView').hidden=!e;$('savedSharedDetails').innerHTML=e?savedSharedDescription(e,true):'';
}
function sharedPreparationFromResult(){
 if(!bikeTripResult||!bikesSnapshot)return null;
  const r=bikeTripResult,now=new Date().toISOString(),s=bikesSnapshot,availability={source:'velov-gbfs',observed:new Date(s.observed).toISOString(),infoUpdated:s.infoUpdated,statusUpdated:s.statusUpdated};
  for(const role of ['pickup','dropoff']){const row=r[role];availability[role]={reported:row.reported,mechanical:row.mechanical,docks:row.docks,installed:row.installed,renting:row.renting,returning:row.returning}}
  const e=validateSavedSharedEntry({id:crypto.randomUUID(),name:(r.places.start.label+' → '+r.places.end.label).slice(0,80),savedAt:now,places:r.places,stations:{pickup:r.pickup,dropoff:r.dropoff},criteria:{rentMinutes:bikeTripMinutes($('bikeTripRent').value,'Prise'),returnMinutes:bikeTripMinutes($('bikeTripReturn').value,'Restitution'),strictAvailability:$('bikeTripStrict').checked,limits:readBikeTripLimits()},snapshot:{source:'lyon-shared-bike',capturedAt:now,availability,parts:r.parts.map(p=>({...p,source:p.sourceKey,at:new Date(p.at).toISOString(),cached:Boolean(p.cached)}))}});
  return e;
}
function offerSavedShared(){
 if(busy||bikeTripJob)return;
 try{const e=sharedPreparationFromResult();if(!e)return;$('bikesDialog').close();clearBikes();openPreparedTrips();setPreparedTab('shared');editSavedShared(e,'new')}catch(e){$('bikeTripStatus').textContent='Sauvegarde impossible. '+e.message}
}
function resumeSavedShared(e){
 if(busy)return;clearBikes();bikeTripResume=structuredClone(e);bikeTripFixed=structuredClone(e.places);bikeTripForceFresh=true;
 $('bikeTripStart').value=e.places.start.label;$('bikeTripEnd').value=e.places.end.label;$('bikeTripRent').value=e.criteria.rentMinutes===null?'':String(e.criteria.rentMinutes);$('bikeTripReturn').value=e.criteria.returnMinutes===null?'':String(e.criteria.returnMinutes);$('bikeTripStrict').checked=e.criteria.strictAvailability;fillBikeTripLimits(e.criteria.limits);
 $('preparedDialog').close();$('bikesDialog').showModal();$('bikesResumeInfo').hidden=false;$('bikesResumeText').textContent='Préparation « '+e.name+' » reprise sans consultation ni calcul. Charger les stations pour vérifier les deux identifiants mémorisés, puis confirmer leur réutilisation.';$('bikesResumeAccept').hidden=true;$('bikesTitle').focus();
}
function reconcileSharedStations(){
 if(!bikeTripResume)return;const rows=sharedStationChanges(bikeTripResume,bikesSnapshot),complete=rows.every(r=>r.row);
 $('bikesResumeInfo').hidden=false;$('bikesResumeText').textContent=rows.map((r,i)=>['Prise','Restitution'][i]+' : '+r.old.name+' ['+r.old.id+'] → '+(!r.row?'absente du catalogue reçu':r.changed?r.row.name+' · '+(r.row.address||'adresse non renseignée')+' · déplacement de coordonnées '+fmt(r.gap,1)+' m':'identité, nom et coordonnées concordants')+'.').join(' ')+' '+(complete?'Confirmer les stations du catalogue reçu avant le calcul. Les disponibilités restent indépendantes.':'Choisir manuellement de nouvelles stations ; aucune substitution automatique.');
 $('bikesResumeAccept').hidden=!complete;
}
function acceptSharedStations(){
 if(!bikeTripResume||!bikesSnapshot)return;
 try{const e=bikeTripResume;bikeTripStations(bikesSnapshot,e.stations.pickup.id,e.stations.dropoff.id);bikeTripChoice={pickup:e.stations.pickup.id,dropoff:e.stations.dropoff.id};bikeTripResume=null;$('bikesResumeAccept').hidden=true;$('bikesResumeText').textContent='Stations du catalogue reçu confirmées. Lancer le calcul pour préparer les trois étapes ; disponibilités et réservation restent distinctes.';renderBikeTripChoice();$('bikeTripTitle').scrollIntoView({block:'start'});$('bikeTripTitle').focus()}catch(e){$('bikesResumeText').textContent=e.message}
}



function sharedJournalOriginText(o,draft=false){
 const minutes=v=>v===null?'inconnu':fmt(v,1)+' min';
 return `Préparation marche → vélo partagé → marche capturée le ${savedTransitClock(Date.parse(o.capturedAt))} (Paris). Stations de référence : ${o.stations.pickup.name} [${o.stations.pickup.id}] puis ${o.stations.dropoff.name} [${o.stations.dropoff.id}]. Temps personnels prévus : prise ${minutes(o.rentMinutes)}, restitution ${minutes(o.returnMinutes)}. ${draft?'Choisir la date réellement effectuée et ajuster les étapes.':'Les étapes déclarées restent distinctes de cette préparation.'} Aucun déplacement mesuré, location ou disponibilité actuelle attestés.`;
}
function sharedJournalDetails(e){
 const c=e.shared,o=c.origin,steps=journalSegments(e),estimated=steps.filter(currentCarbon),groups={};for(const s of estimated){const k=s.emissions.factor.scope;groups[k]=(groups[k]??0)+s.emissions.valueKg}
 const carbon=Object.entries(groups).map(([k,v])=>CARBON_SCOPES[k]+' : '+carbonAmount(v)).join(' ; ');
 return `<p>${fmt(journalKnownMeters(e)/1000,3)} km renseignés · ${steps.length} étape(s) effectuée(s). ${e.distanceMeters===null?'Distance totale inconnue.':''} ${estimated.length?`Empreinte partielle : ${carbon} pour une personne ; ${estimated.length}/${steps.length} étapes estimées.`:'Empreinte non estimée.'}</p><details><summary>Étapes déclarées et origine théorique</summary><p>${escapeHtml(sharedJournalOriginText(o))}</p><ol>${o.steps.map(s=>`<li>Prévu : ${JOURNAL_SHARED_MODES[s.mode]} · ${escapeHtml(s.start)} → ${escapeHtml(s.end)} · ${fmt(s.distanceMeters/1000,3)} km, ${Math.ceil(s.durationSeconds/60)} min estimées${s.pushingMeters?' ; '+Math.ceil(s.pushingMeters)+' m annoncés vélo à la main':''}.<p class="note">${s.source==='fossgis-bike'?'FOSSGIS vélo classique':s.source==='same-point'?'Même point demandé, marche nulle':'IGN piéton'} · ${escapeHtml(s.calculatedAt)} · données ${escapeHtml(s.resourceVersion??'version inconnue')}.</p></li>`).join('')}</ol><ol>${c.steps.map(s=>`<li>${s.included?'Effectuée':'Non effectuée — exclue des totaux'} : ${JOURNAL_SHARED_MODES[s.mode]} ${escapeHtml(s.line)} · ${escapeHtml(s.start)} → ${escapeHtml(s.end)} · ${s.distanceMeters===null?'distance inconnue':fmt(s.distanceMeters/1000,3)+' km'}${journalCarbonMarkup(s)}</li>`).join('')}</ol><p class="note">Sources déclarées de la préparation : Vélo’v / Métropole de Lyon, IGN BD TOPO et FOSSGIS / OpenStreetMap. Aucune annonce de disponibilité ni géométrie recopiée dans le journal. Modèles carbone génériques choisis pour les étapes déclarées, sans estimation propre au service de location. Temps prévus et données déclarées restent distincts ; aucun suivi GPS.</p></details>`;
}
function journalFromShared(saved=false){
 if(busy||bikeTripJob)return;
 try{const p=saved?savedShared.entries.find(e=>e.id===savedSharedSelected):sharedPreparationFromResult();if(!p)return;offerCollectiveJournal(sharedJournalDraft(p,new Date().toISOString(),crypto.randomUUID()))}
 catch(e){$(saved?'savedSharedMessage':'bikeTripStatus').textContent='Brouillon impossible. '+e.message}
}
function bindSharedJournal(){
 $('bikeTripJournal').addEventListener('click',()=>journalFromShared());$('savedSharedJournal').addEventListener('click',()=>journalFromShared(true));
}

loadPreparedTrips();loadSavedTransit();makeGrid();bind();bindSavedTransit();bindProfile();bindJournal();bindPreparedTrips();bindRides();bindMeetings();bindComparison();bindTransit();bindTransitCarbon();bindBikes();bindBikeTrip();bindCycle();bindSavedCycle();bindSavedShared();bindCycleJournal();bindSharedJournal();bindProspective();applyVehicle();updateRange();initPwa();bindSources();bindRoadChoices();
$("stationDeparture").value=parisLocal(Date.now());refreshArrival();
health("hJS","ok","JS ✓");
setStatus("Moteur chargé. Prêt pour un trajet réel.","ok");
initMap();
window.addEventListener("unhandledrejection",e=>dbg("Unhandled",e.reason?.message||String(e.reason)));
})();

// Keep keyboard focus below each dialog's actual sticky heading, including enlarged text.
for(const dialog of document.querySelectorAll('dialog')){
 const heading=dialog.querySelector('.dialog-heading');if(!heading)continue;
 new ResizeObserver(()=>dialog.style.setProperty('--dialog-heading-height',`${heading.getBoundingClientRect().height}px`)).observe(heading);
 dialog.addEventListener('keydown',event=>{
  if(event.key!=='Tab'||!dialog.matches(':modal'))return;
  const controls=[...dialog.querySelectorAll('button,input,select,textarea,a[href],summary,[tabindex]')].filter(e=>e.tabIndex>=0&&!e.matches(':disabled')&&e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden');
  const first=controls[0],last=controls.at(-1);if(!first)return;
  if(event.shiftKey&&(document.activeElement===first||!controls.includes(document.activeElement))){event.preventDefault();last.focus()}
  else if(!event.shiftKey&&(document.activeElement===last||!controls.includes(document.activeElement))){event.preventDefault();first.focus()}
 });
 dialog.addEventListener('focusin',event=>{
  if(!dialog.open||heading.contains(event.target))return;
  const target=event.target;if(!(target instanceof HTMLElement))return;
  const top=heading.getBoundingClientRect().bottom+12,rect=target.getBoundingClientRect();
  if(rect.top<top)dialog.scrollBy({top:rect.top-top,behavior:'instant'});
 });
}
