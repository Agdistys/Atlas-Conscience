"""Rebuild public tariff tables from attributed open CSVs; qualify against official PDFs.

python3 tools/build-toll-tables.py [--check] [--qualify quality/tariffs/sources]
The qualification directory contains unchanged APRR/AREA.pdf plus pdftotext -layout outputs.
No download or supplier call is performed by this program.
"""
import argparse
import csv
import hashlib
import json
import re
from decimal import Decimal
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'data/tariffs/2026-02'
START = '// BEGIN GENERATED TARIFF TABLES\n'
END = '// END GENERATED TARIFF TABLES\n'


def cents(value):
    n = Decimal(value.replace(' €', '').replace(',', '.')) * 100
    assert n.is_finite() and n == int(n) and 0 <= n <= 1000000, value
    return int(n)


def records(network):
    path = DATA / (network + '.verified.csv')
    rows = []
    for r in csv.DictReader(path.open()):
        names = ('gare_entree', 'gare_sortie')
        a, b = [r[k] for k in names]
        assert a and b and a != b and len(a) < 100 and len(b) < 100
        rows.append((a, b, cents(r['distance_tarifaire_km']), *[cents(r[f'tarif_classe_{i}']) for i in range(1, 6)]))
    assert len(rows) == (21505 if network == 'APRR' else 955)
    assert len({r[:2] for r in rows}) == len(rows), 'Duplicate directional pair'
    return rows


def generate(qualify=None, qualify_bpnl=None):
    manifest = json.loads((DATA / 'provenance.json').read_text())
    data = {'schemaVersion': 2, 'effectiveFrom': '2026-02-01', 'lastReviewed': '2026-11-17',
            'consultationUntil': '2026-12-31', 'networks': {}}
    for network in ['APRR', 'AREA']:
        raw = (DATA / (network + '.csv')).read_bytes()
        assert hashlib.sha256(raw).hexdigest() == manifest['networks'][network]['csvSha256']
        assert hashlib.sha256((DATA / (network + '.verified.csv')).read_bytes()).hexdigest() == manifest['networks'][network]['verifiedCsvSha256']
        rows = records(network)
        if qualify:
            pdf = qualify / (network + '.pdf')
            assert hashlib.sha256(pdf.read_bytes()).hexdigest() == manifest['networks'][network]['pdfSha256']
            text = (qualify / (network + '.txt')).read_text()
            assert 'en vigueur au 1er février 2026' in text and 'euros TTC' in text
            extracted = []
            for line in text.splitlines():
                if '€' not in line or not re.search(r'\d+,\d\d', line):
                    continue
                parts = re.split(r'\s{2,}', line.strip())
                assert len(parts) == (8 if network == 'APRR' else 10), line
                if network == 'AREA':
                    parts = [parts[1], parts[3], *parts[4:]]
                extracted.append((parts[0], parts[1], *[cents(v) for v in parts[2:]]))
            assert sorted(extracted) == sorted(rows), f'{network}: CSV/PDF disagreement'
            print(f'{network}: {len(rows)} pairs and {len(rows)*5} prices match the official PDF')
        gates = sorted({r[i] for r in rows for i in [0, 1]})
        indexes = {name: i for i, name in enumerate(gates)}
        data['networks'][network] = {'kind': 'pair', 'effectiveFrom': '2026-02-01', 'consultationUntil': '2026-12-31', 'lastReviewed': '2026-11-17', 'gates': gates, 'source': manifest['networks'][network]['pdfUrl'],
            'rows': [[indexes[r[0]], indexes[r[1]], *r[3:]] for r in rows]}
    folder = ROOT / 'data/tariffs/2026-01-bpnl'
    provenance = json.loads((folder / 'provenance.json').read_text())
    raw = (folder / 'BPNL.json').read_bytes()
    assert hashlib.sha256(raw).hexdigest() == provenance['dataSha256']
    bpnl = json.loads(raw)
    assert len(bpnl['amountsCents']) == 5 and all(type(n) is int and n > 0 for n in bpnl['amountsCents'])
    if qualify_bpnl:
        assert hashlib.sha256((qualify_bpnl / 'BPNL-deliberation.pdf').read_bytes()).hexdigest() == bpnl['sourceSha256']
        page = (qualify_bpnl / 'BPNL-deliberation.txt').read_text().split('\f')[58]
        assert '2025-3243' in page and 'Fixe, pour l’année 2026, la grille tarifaire de péage du BPNL' in page
        block = page.split('VII - BPNL')[1].split('pass 14')[0]
        prices = re.findall(r'classe ([1-5])\s+passage\s+(\d+,\d{2})', block)
        assert [int(i) for i, v in prices] == list(range(1, 6))
        assert [cents(v) for i, v in prices] == bpnl['amountsCents']
        print('BPNL: all 5 full-price amounts match the public decision, page 59')
    data['networks']['BPNL'] = bpnl
    return START + 'window.DRAGONROUTE_TARIFFS = ' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ';\n' + END


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--check', action='store_true')
    parser.add_argument('--qualify', type=Path)
    parser.add_argument('--qualify-bpnl', type=Path)
    args = parser.parse_args()
    block = generate(args.qualify, args.qualify_bpnl)
    path = ROOT / 'DragonRoute/config.js'
    original = path.read_text()
    prefix = original.split(START)[0]
    expected = prefix + block
    if args.check:
        assert original == expected, 'Generated tariff configuration differs from source CSVs'
        print('Embedded tariff tables verified')
    else:
        assert path.read_text() == original
        path.write_text(expected)
        print(f'Generated {len(block.encode())} bytes')
