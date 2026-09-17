# <Application> — Contrat d’acceptation

Copier ce fichier pour chaque nouvelle application puis compléter les critères avant le développement.

## 1. Démarrage
- [ ] Tous les fichiers locaux référencés existent.
- [ ] Aucun crash JavaScript au chargement.
- [ ] L’interface principale reste utilisable si une dépendance secondaire tombe.

## 2. Parcours de référence
- [ ] Définir 1 scénario utilisateur minimal reproductible.
- [ ] Définir le résultat attendu sans ambiguïté.
- [ ] Définir les états d’erreur attendus.

## 3. Données
- [ ] Provenance affichée.
- [ ] Fraîcheur ou date connue quand elle compte.
- [ ] Donnée absente = `indisponible` / `je ne sais pas`, jamais donnée inventée.

## 4. Charte aMi
- [ ] Fond Onyx.
- [ ] Cormorant Garamond / Jost / Space Mono.
- [ ] Accent propre à l’application.
- [ ] Mobile sans perte de sens.
- [ ] `prefers-reduced-motion` respecté si animations.

## 5. Accessibilité & responsive
- [ ] Desktop.
- [ ] Mobile.
- [ ] Navigation clavier des actions principales.
- [ ] Libellés accessibles sur les contrôles iconiques.

## 6. Décision humaine
- [ ] Critères de recommandation visibles.
- [ ] Pas d’action personnelle irréversible automatisée sans confirmation.
- [ ] Alternatives visibles lorsque le produit effectue un classement.

## 7. Inspection
- [ ] CI verte.
- [ ] Rapport Playwright disponible.
- [ ] Preview inspectée par l’Inspectrice.
- [ ] Corrections terminées avant merge dans `main`.
