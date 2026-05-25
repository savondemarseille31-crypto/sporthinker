#!/usr/bin/env python3
"""
Calcule les profils joueurs ATP + WTA pour toutes les surfaces (clay/grass/hard).
Source : Jeff Sackmann GitHub CSVs (tennis_atp, tennis_wta)
Output : lib/player-profiles.json

Formule probabilité :
  P = 50% Elo_surface + 28% WR_18mois + 22% forme_6matchs

Usage : python3 scripts/compute-player-profiles.py
"""

import csv, json, urllib.request, os, sys
from datetime import datetime, timedelta
from collections import defaultdict
from io import StringIO
from typing import Optional, Dict, List

BASE = {
    'atp': 'https://raw.githubusercontent.com/JeffSackmann/tennis_atp/master',
    'wta': 'https://raw.githubusercontent.com/JeffSackmann/tennis_wta/master',
}

# Matches depuis 2015 pour calibrer l'Elo (plus = mieux, mais plus lent)
YEARS       = range(2015, 2027)
ELO_START   = 1500
K_FACTOR    = 32
TOP_N       = 200
MIN_MATCHES_WR   = 5   # min matchs sur surface (18m) pour calculer le win rate
MIN_MATCHES_FORM = 3   # min matchs au total pour calculer la forme


def fetch(url: str) -> str:
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.read().decode('utf-8', errors='replace')
    except Exception as e:
        return ''


def parse_csv(text: str) -> list[dict]:
    if not text.strip():
        return []
    reader = csv.DictReader(StringIO(text))
    return list(reader)


def get_top_ids(tour: str, n: int = TOP_N) -> Dict[str, int]:
    """player_id → rank pour les top N joueurs."""
    rows = parse_csv(fetch(f"{BASE[tour]}/{tour}_rankings_current.csv"))
    if not rows:
        sys.exit(f"Impossible de charger les rankings {tour}")
    latest = max(r['ranking_date'] for r in rows)
    ranked = sorted([r for r in rows if r['ranking_date'] == latest], key=lambda r: int(r['rank']))
    return {r['player']: int(r['rank']) for r in ranked[:n]}


def get_names(tour: str) -> Dict[str, str]:
    """player_id → 'Prénom Nom'"""
    rows = parse_csv(fetch(f"{BASE[tour]}/{tour}_players.csv"))
    return {
        r['player_id']: f"{r.get('name_first','')} {r.get('name_last','')}".strip()
        for r in rows if r.get('player_id')
    }


def norm_surface(s: str) -> Optional[str]:
    s = (s or '').lower().strip()
    if 'clay'                       in s: return 'clay'
    if 'grass'                      in s: return 'grass'
    if 'hard' in s or 'carpet' in s    : return 'hard'
    return None


def parse_date(d: str) -> datetime:
    try:
        return datetime.strptime(str(d).strip()[:8], '%Y%m%d')
    except Exception:
        return datetime.min


def compute(tour: str, top_ids: Dict[str, int], names: Dict[str, str]) -> dict:
    """Calcule Elo surface + WR 18m + forme pour tous les joueurs du top."""

    # Elo par joueur par surface
    elo: dict[str, dict[str, float]] = defaultdict(
        lambda: {'clay': ELO_START, 'grass': ELO_START, 'hard': ELO_START}
    )

    cutoff_18m = datetime.now() - timedelta(days=548)  # ~18 mois

    # wins/losses sur 18m par surface
    wl18: dict[str, dict[str, dict[str, int]]] = defaultdict(
        lambda: {'clay': {'w': 0, 'l': 0}, 'grass': {'w': 0, 'l': 0}, 'hard': {'w': 0, 'l': 0}}
    )

    # liste chronologique de résultats (1=victoire, 0=défaite)
    form: dict[str, list[int]] = defaultdict(list)

    all_matches: list[dict] = []
    for year in YEARS:
        print(f"    {tour.upper()} {year}...", end=' ', flush=True)
        rows = parse_csv(fetch(f"{BASE[tour]}/{tour}_matches_{year}.csv"))
        # Filtrer les matchs principaux (hors qualifs, hors Davis/Billie Jean/Fed Cup non pertinents)
        main = [
            r for r in rows
            if r.get('round', '').strip() not in ('Q1', 'Q2', 'Q3', 'Q4', 'QR')
            and r.get('tourney_level', '').strip() in ('G', 'M', 'A', 'F', 'P', 'PM', '')
        ]
        all_matches.extend(main)
        print(f"{len(main)} matchs", flush=True)

    # Tri chronologique pour Elo
    all_matches.sort(key=lambda m: parse_date(m.get('tourney_date', '')))

    for m in all_matches:
        wid = m.get('winner_id', '').strip()
        lid = m.get('loser_id', '').strip()
        surface = norm_surface(m.get('surface', ''))
        if not wid or not lid or not surface:
            continue

        # Mise à jour Elo
        ew, el = elo[wid][surface], elo[lid][surface]
        pw = 1 / (1 + 10 ** ((el - ew) / 400))
        delta = K_FACTOR * (1 - pw)
        elo[wid][surface] += delta
        elo[lid][surface] -= delta

        # WR 18 mois
        mdate = parse_date(m.get('tourney_date', ''))
        if mdate >= cutoff_18m:
            wl18[wid][surface]['w'] += 1
            wl18[lid][surface]['l'] += 1

        # Forme (ordre chronologique → derniers éléments = matchs récents)
        form[wid].append(1)
        form[lid].append(0)

    # Construction des profils
    profiles: dict = {}
    for pid, rank in top_ids.items():
        name = names.get(pid, '').strip()
        if not name:
            continue

        profile: dict = {'rank': rank}
        for surf in ('clay', 'grass', 'hard'):
            s = wl18[pid][surf]
            total = s['w'] + s['l']
            wr = round(s['w'] / total, 3) if total >= MIN_MATCHES_WR else None
            recent = form[pid][-6:] if len(form[pid]) >= MIN_MATCHES_FORM else None
            profile[surf] = {
                'elo':        round(elo[pid][surf], 1),
                'wr18m':      wr,
                'matches18m': total,
                'form6':      sum(recent) if recent is not None else None,
            }

        profiles[name] = profile

    return profiles


def main():
    output: dict = {}
    for tour in ('atp', 'wta'):
        print(f"\n{'='*50}")
        print(f" {tour.upper()} — chargement rankings + noms...")
        top_ids = get_top_ids(tour)
        names   = get_names(tour)
        print(f" {len(top_ids)} joueurs identifiés dans le top {TOP_N}")
        print(f" Calcul des profils (matchs 2015-2026)...")
        profiles = compute(tour, top_ids, names)
        output[tour] = profiles
        print(f" ✓ {len(profiles)} profils calculés")

    # Métadonnées
    output['_meta'] = {
        'generated': datetime.now().isoformat()[:19],
        'top_n': TOP_N,
        'years': f"{min(YEARS)}-{max(YEARS)}",
        'elo_k': K_FACTOR,
        'min_matches_wr': MIN_MATCHES_WR,
    }

    out_path = os.path.join(os.path.dirname(__file__), '..', 'lib', 'player-profiles.json')
    out_path = os.path.normpath(out_path)
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, separators=(',', ':'))

    print(f"\n✅  Profils sauvegardés → {out_path}")
    print(f"   ATP : {len(output['atp'])} joueurs")
    print(f"   WTA : {len(output['wta'])} joueurs")
    size = os.path.getsize(out_path) / 1024
    print(f"   Taille : {size:.0f} KB")


if __name__ == '__main__':
    main()
