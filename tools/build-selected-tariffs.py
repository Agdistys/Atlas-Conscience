"""Reproduce the official ASF text, preserving missing prices and direction."""
from pathlib import Path
from decimal import Decimal
import csv, hashlib, json, sys

root = Path(__file__).resolve().parents[1]
folder = root / 'data/tariffs/2026-06-asf'
meta = json.loads((folder / 'provenance.json').read_text())
raw = (folder / 'Tarifs_ASF.txt').read_bytes()
assert hashlib.sha256(raw).hexdigest() == meta['sourceSha256']
source = list(csv.DictReader(raw.decode('utf-8-sig').splitlines(), delimiter=';'))
assert len(source) == meta['rows'] == 2055

def cents(value):
    if value == '#N/A': return None
    number = Decimal(value.replace(',', '.')) * 100
    assert number.is_finite() and number == int(number) and 0 <= number <= 100000
    return int(number)

def gate(row, role):
    road, name = row['autoroute_' + role], row['nom_' + role]
    assert road and name and len(road) < 20 and len(name) < 100
    return road + ' · ' + name

gates = sorted({gate(row, role) for row in source for role in ['entree', 'sortie']})
indexes = {name: i for i, name in enumerate(gates)}
rows = [[indexes[gate(row, 'entree')], indexes[gate(row, 'sortie')],
         *[cents(row['classe' + str(k)]) for k in range(1, 6)]] for row in source]
assert len({tuple(row[:2]) for row in rows}) == len(rows)
assert sum(value is None for row in rows for value in row[2:]) == 5
data = {key: meta[key] for key in ['source', 'sourcePage', 'sourceSha256', 'sourceTitle',
        'publisher', 'effectiveFrom', 'lastReviewed', 'consultationUntil']}
data.update(kind='pair', label='ASF', gates=gates, rows=rows)
expected = '// Generated from the preserved official text; do not hand-edit.\nexport const asfReferenceTariffs=' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ';\n'
target = root / 'server/selected-tolls/asf-tariffs.mjs'
if '--check' in sys.argv:
    assert target.read_text() == expected, 'Selected tariff source differs; rebuild it.'
else:
    target.write_text(expected)
print(f'ASF: {len(rows)} explicit pairs, five unknown cells preserved.')
