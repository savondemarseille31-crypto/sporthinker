#!/usr/bin/env python3
"""
Calcule les stats clay ATP + WTA depuis les données Jeff Sackmann (GitHub).
Sources : 2023 + 2024 + 2025 + 2026 (partiel) — surface Clay uniquement.

Usage : python3 scripts/calc-clay-stats.py
"""

import urllib.request
import csv
import io
from collections import defaultdict

BASE = "https://raw.githubusercontent.com/JeffSackmann"

def fetch(url):
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=15) as r:
            return r.read().decode('utf-8')
    except Exception as e:
        print(f"  SKIP {url.split('/')[-1]}: {e}")
        return ""

def flt(v):
    try: return float(v) if v.strip() else 0.0
    except: return 0.0

def process(csv_text, stats):
    reader = csv.DictReader(io.StringIO(csv_text))
    for row in reader:
        if row.get('surface', '').strip() != 'Clay':
            continue
        winner = row.get('winner_name', '').strip()
        loser  = row.get('loser_name',  '').strip()
        if not winner or not loser:
            continue

        # Bilan victoires/défaites
        stats[winner]['wins']  += 1
        stats[winner]['total'] += 1
        stats[loser]['losses'] += 1
        stats[loser]['total']  += 1

        # Stats service (agrégées pour pouvoir pondérer)
        for pfx, name in [('w_', winner), ('l_', loser)]:
            svpt      = flt(row.get(f'{pfx}svpt',   ''))
            first_in  = flt(row.get(f'{pfx}1stIn',  ''))
            first_won = flt(row.get(f'{pfx}1stWon', ''))
            second_won= flt(row.get(f'{pfx}2ndWon', ''))
            if svpt <= 0 or first_in <= 0:
                continue
            second_svpt = svpt - first_in
            p = stats[name]
            p['svpt']       += svpt
            p['first_in']   += first_in
            p['first_won']  += first_won
            if second_svpt > 0:
                p['second_svpt'] += second_svpt
                p['second_won']  += second_won

def calc(tour):
    stats = defaultdict(lambda: {
        'wins':0,'losses':0,'total':0,
        'svpt':0,'first_in':0,'first_won':0,
        'second_svpt':0,'second_won':0,
    })
    repo = f"tennis_{tour}"
    for year in [2023, 2024, 2025, 2026]:
        url = f"{BASE}/{repo}/master/{tour}_matches_{year}.csv"
        print(f"  {year}…", end=' ', flush=True)
        text = fetch(url)
        if text:
            process(text, stats)
            print("ok")
        else:
            print("(vide)")

    MIN = 15
    results = []
    for name, p in stats.items():
        if p['total'] < MIN:
            continue
        wr   = p['wins'] / p['total']
        sp   = p['first_in'] / p['svpt']      if p['svpt']       > 0 else None
        p1   = p['first_won'] / p['first_in'] if p['first_in']   > 0 else None
        p2   = p['second_won'] / p['second_svpt'] if p['second_svpt'] > 0 else None
        results.append({
            'name': name,
            'wins': p['wins'], 'losses': p['losses'], 'total': p['total'],
            'wr': round(wr, 3),
            'sp': round(sp, 3) if sp else None,
            'p1': round(p1, 3) if p1 else None,
            'p2': round(p2, 3) if p2 else None,
        })

    return sorted(results, key=lambda x: -x['wr'])

def print_table(results, label):
    print(f"\n{'='*90}")
    print(f"  {label} — {len(results)} joueurs (≥15 matchs clay)")
    print(f"{'='*90}")
    print(f"  {'Joueur':<28} {'G':>4} {'D':>4} {'Tot':>4}  {'WR%':>6}  {'1stSv%':>7}  {'Pts1st%':>8}  {'Pts2nd%':>8}")
    print(f"  {'-'*80}")
    for r in results[:60]:
        sp = f"{r['sp']*100:.1f}%" if r['sp'] else "   —  "
        p1 = f"{r['p1']*100:.1f}%" if r['p1'] else "    —   "
        p2 = f"{r['p2']*100:.1f}%" if r['p2'] else "    —   "
        print(f"  {r['name']:<28} {r['wins']:>4} {r['losses']:>4} {r['total']:>4}  "
              f"{r['wr']*100:>5.1f}%  {sp:>7}  {p1:>8}  {p2:>8}")

def print_typescript(results, varname):
    """Génère le tableau TypeScript pour rg-players.ts"""
    print(f"\n// ── {varname} (généré automatiquement) ──")
    print(f"export const {varname}: ClayProfile[] = [")
    for r in results[:50]:
        sp_comment = ""
        if r['sp'] and r['p1'] and r['p2']:
            sp_comment = f"  // 1stSv={r['sp']*100:.0f}% Pts1st={r['p1']*100:.0f}% Pts2nd={r['p2']*100:.0f}%"
        print(f"  {{ name: '{r['name']:<28}', rank: 999, clayWinRate: {r['wr']:.3f}, clayMatches: {r['total']} }},{sp_comment}")
    print("]")

if __name__ == '__main__':
    print("\n=== ATP ===")
    atp = calc('atp')
    print_table(atp, "ATP Clay 2023-2026")

    print("\n=== WTA ===")
    wta = calc('wta')
    print_table(wta, "WTA Clay 2023-2026")

    print("\n\n=== TYPESCRIPT OUTPUT ===")
    print_typescript(atp, "ATP_CLAY_PROFILES_GENERATED")
    print_typescript(wta, "WTA_CLAY_PROFILES_GENERATED")
