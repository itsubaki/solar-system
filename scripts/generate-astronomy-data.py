#!/usr/bin/env python3
"""Regenerate the bright-star catalog (developer tool, Python standard library)."""
import gzip
import hashlib
import json
from pathlib import Path
import time
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
CACHE = Path('/tmp/solar-system-star-catalog-cache')

def download(url):
    CACHE.mkdir(exist_ok=True)
    cached = CACHE / (hashlib.sha256(url.encode()).hexdigest() + '.gz')
    if cached.exists():
        return gzip.decompress(cached.read_bytes()).decode()
    for attempt in range(5):
        try:
            with urllib.request.urlopen(url, timeout=90) as response:
                raw = response.read()
            text = (gzip.decompress(raw) if url.endswith(".gz") else raw).decode()
            if 'Service Temporarily Unavailable' in text:
                raise RuntimeError('Remote service temporarily unavailable')
            cached.write_bytes(gzip.compress(text.encode()))
            return text
        except Exception:
            if attempt == 4:
                raise
            time.sleep(min(2 ** attempt, 8))

def stars():
    # NASA mirror of ESA/CDS I/239. Use the original ICRS coordinate columns,
    # not a precessed browser display coordinate. Catalog epoch is J1991.25.
    text = download('https://heasarc.gsfc.nasa.gov/FTP/heasarc/dbase/tdat_files/heasarc_hipparcos.tdat.gz')
    fields_line = next(line for line in text.splitlines() if line.startswith('line[1] = '))
    names = fields_line.split(' = ')[1].split()
    rows = []
    for line in text.split('<DATA>')[1].splitlines():
        if not line.startswith('HIP '):
            continue
        fields = dict(zip(names, line.split('|')))
        try:
            magnitude = float(fields['vmag'])
            if magnitude >= 6.5:
                continue
            value = lambda name, default: float(fields[name]) if fields[name].strip() else default
            rows.append([int(fields['hip_number']), float(fields['ra_deg']), float(fields['dec_deg']),
                         magnitude, value('bv_color', 0.65), value('pm_ra', 0), value('pm_dec', 0)])
        except (ValueError, KeyError):
            continue
    rows.sort(key=lambda star: star[0])
    if len(rows) < 4000:
        raise ValueError(f'Incomplete Hipparcos catalog: {len(rows)} stars')
    (ROOT / 'data' / 'hipparcos-bright.json').write_text(json.dumps(rows, separators=(',', ':')) + '\n')
    print(f'Wrote {len(rows)} Hipparcos stars (ICRS, epoch J1991.25)', flush=True)

if __name__ == '__main__':
    stars()
