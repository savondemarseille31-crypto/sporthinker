# SporThinker — Journal de session

> Session : mai 2026 · Stack : Next.js 15 App Router · TypeScript · Tailwind CSS

---

## 🎯 Objectif du projet

**SporThinker** est une application web de stats sportives et d'aide à la décision pour les paris sportifs.  
3 sports couverts : **NBA Playoffs**, **MLB**, **Coupe du Monde 2026**.  
Public cible : utilisateurs européens (horaires en heure de Paris, texte en français).

---

## ✅ Travaux réalisés cette session

### 1. Page matchup NBA — Stats joueurs
- Correction de l'alignement des colonnes (CSS Grid fixe : `grid-cols-[20px_1fr_44px_40px_40px]`)
- Ajout d'une colonne **Saison régulière** comparée aux playoffs (delta affiché en vert/rouge)
- Fetch des stats saison via ESPN Core API : `sports.core.api.espn.com/v2/.../types/2/athletes/{id}/statistics/0`
- Correction de l'abréviation ESPN : `SAS → SA`, `GSW → GS`, `NOP → NO`, `NYK → NY` via `toESPNTeamAbbr()`
- Génération de **signaux prop bets** depuis les tendances (PTS ≥2.5 → modéré, ≥4 → fort ; REB/AST ≥1.5 → modéré, ≥2.5 → fort)

### 2. Signaux NBA — `lib/nba-signals.ts` (nouveau fichier)
- `generateNBASignalsForToday()` : fetch balldontlie playoff games → historique série → signaux OVER/UNDER/Moneyline
- Intégration dans la page `/signaux` aux côtés des signaux MLB et CdM
- Fix rate limiting balldontlie : `next: { revalidate: 60 }` à la place de `cache: 'no-store'`

### 3. Page Signaux — Reorganisation par sport
- 3 sections fixes : 🏀 NBA Playoffs (orange) / ⚾ MLB (bleu) / 🌍 CdM 2026 (emerald)
- Badge sport, état vide élégant si aucun signal
- CTA NBA → `/nba/matchup/${game.id}`

### 4. Équipe domicile en premier (tous les sports)
- **MLB liste** : home affiché en haut
- **MLB matchup** : breadcrumb `home vs away`, header home à gauche, lanceurs home en premier, offenses home en premier, forme récente home en premier
- **NBA liste** : home affiché en haut avec label `(dom.)`
- **Signaux** : `matchStr = homeTeam vs awayTeam`

### 5. Horaires en heure Europe/Paris
- `lib/mlb-api.ts` → `formatGameTime` : `timeZone: 'Europe/Paris'` (suppression du suffixe `' ET'`)
- `lib/nba-api.ts` → `formatGameStatus` : idem
- `lib/signals.ts` → tous les `heure:` : idem

### 6. Correction bug signal MLB — Raisonnement ambigu
- **Problème** : "Walbert Ureña domine face à Cleveland Guardians" alors qu'Ureña joue POUR Cleveland
- **Cause** : formulation `${betterPitcher.fullName} domine face à ${worseTeam.name}` ambiguë
- **Fix** : nouveau format explicite → `"${betterTeam.name} s'appuie sur ${betterPitcher.fullName} (ERA X.XX) face à ${worseTeam.name} dont le lanceur est vulnérable (ERA X.XX)"`
- Idem pour CAS 4 (F5)

### 7. Coupe du Monde 2026 — Mise à jour complète
- **Problème** : tous les groupes étaient faux (Jamaica, Venezuela, Bolivia… dans des groupes inventés)
- **Source** : Al Jazeera + Wikipedia + NBC Sports (tirage du 5 décembre 2025)
- **Groupes corrects** (A→L, 48 équipes) :

| Groupe | Équipes |
|--------|---------|
| A | Mexico, South Korea, South Africa, Czechia |
| B | Canada, Switzerland, Qatar, Bosnia-Herzegovina |
| C | Brazil, Morocco, Scotland, Haiti |
| D | USA, Paraguay, Australia, Turkey |
| E | Germany, Ecuador, Ivory Coast, Curaçao |
| F | Netherlands, Japan, Tunisia, Sweden |
| G | Belgium, Iran, Egypt, New Zealand |
| H | Spain, Uruguay, Saudi Arabia, Cape Verde |
| I | France, Senegal, Norway, Iraq |
| J | Argentina, Austria, Algeria, Jordan |
| K | Portugal, Colombia, Uzbekistan, DR Congo |
| L | England, Croatia, Panama, Ghana |

- **3 pays hôtes** : Mexico (Groupe A), Canada (Groupe B), USA (Groupe D)
- **72 matchs** calendrier complet avec horaires Paris (UTC+2), stades réels
- **4 fichiers mis à jour** : `lib/cdm-fixtures.ts`, `lib/cdm-teams.ts`, `lib/cdm-groups.ts`, `app/cdm/groupes/page.tsx`

### 8. Noms complets dans les signaux
- MLB : `homeTeam.name` au lieu de `homeTeam.abbreviation` → "Cleveland Guardians vs Los Angeles Angels"
- NBA : `game.home_team.full_name` au lieu de `homeInfo.shortName` → "Minnesota Timberwolves vs Boston Celtics"

---

## 🏗️ Architecture technique clé

```
lib/
├── mlb-api.ts          — MLB Stats API (schedule, standings, pitcher stats, recent games)
├── nba-api.ts          — balldontlie API (playoff games, series history, team box scores)
├── espn-api.ts         — ESPN API (player averages playoffs + regular season, CdM odds)
├── signals.ts          — Générateur signaux MLB + CdM (CAS 1-4)
├── nba-signals.ts      — Générateur signaux NBA (OVER/UNDER/Moneyline série)
├── cdm-fixtures.ts     — 72 matchs phase de groupes CdM 2026
├── cdm-teams.ts        — 48 profils équipes (FIFA ranking, formation, points forts/faibles)
├── cdm-groups.ts       — Groupes A→L (source de vérité pour pages groupes/équipes)
└── cdm-players.ts      — Joueurs (⚠️ à mettre à jour : encore des équipes non qualifiées)

app/
├── signaux/page.tsx    — Page signaux du jour (NBA + MLB + CdM)
├── nba/page.tsx        — Liste matchs NBA du jour
├── nba/matchup/[gameId]/page.tsx  — Analyse matchup NBA (stats joueurs, prop signals)
├── mlb/page.tsx        — Liste matchs MLB du jour
├── mlb/matchup/[gamePk]/page.tsx  — Analyse matchup MLB (ERA, WHIP, forme, H2H)
└── cdm/                — Section CdM (groupes, équipes, calendrier, joueurs)
```

---

## 🔑 Points d'attention techniques

| Sujet | Détail |
|-------|--------|
| ESPN abbréviations | `SAS→SA`, `GSW→GS`, `NOP→NO`, `NYK→NY` via `toESPNTeamAbbr()` dans `espn-api.ts` |
| Rate limiting balldontlie | `next: { revalidate: 60 }` sur tous les appels (pas de `no-store`) |
| ERA fiable | Lissage vers 4.20 (moyenne ligue) si IP < 30 via `reliableERA()` |
| Signal seuils MLB | CAS 1 : avgERA<3.00 + WHIP<1.15 → UNDER fort / CAS 2 : eraDiff>1.80 + betterERA<3.50 → ML / CAS 3 : avgERA>4.80 → OVER / CAS 4 : betterERA<2.80 + worstERA>4.20 → F5 |
| CdM players.ts | ⚠️ Contient encore des joueurs d'équipes non qualifiées (Jamaica, Italy, Bolivia…) — sans impact sur les signaux mais à nettoyer |

---

## 📋 Backlog

### 🔴 Urgent — avant le 11 juin
- [ ] **Déploiement Vercel**
- [ ] **The Odds API / Pinnacle** — cotes réelles + calcul Expected Value sur chaque signal
- [ ] **API-Football (payant)** — stats live CdM, xG, compositions
- [ ] **Mise à jour `cdm-players.ts`** — 48 équipes correctes, supprimer les non-qualifiés, ajouter Norway (Haaland), Scotland (McTominay), etc.

### 🟡 Moyen terme
- [ ] **Supabase auth** — avant usage multi-appareils
- [ ] **Tennis module**

### 🔵 Octobre 2026 (reprise NBA)
- [ ] **balldontlie Starter** — stats joueurs saison régulière complètes

---

## 💬 Décisions produit prises

- **Qualité > quantité** sur les signaux : préférer 0 signal à un signal faible ("je préfère que tu sois sûr de toi")
- **Pas de placement automatique de paris** même si Stake API est intégré — l'utilisateur reste décisionnaire
- **Seuils stricts maintenus** : CAS 1-4 uniquement, pas de CAS 5+ assouplis
- **Heure Europe/Paris** partout — l'app est pensée pour un public européen
