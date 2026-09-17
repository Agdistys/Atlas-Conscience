# 🐉 DragonRoute — Contrat d’acceptation

Une version n’est « prête pour inspection » que si tous les points obligatoires ci-dessous passent.

## Mécanique

- [ ] Tous les fichiers locaux référencés par `index.html` existent.
- [ ] Le JavaScript passe `node --check`.
- [ ] L’application démarre même si Leaflet/CDN est indisponible.
- [ ] Aucune donnée fictive n’est inventée quand une source échoue.

## Parcours de référence

Scénario : **Lyon → Valence · E10 · 40 L · 6,2 L/100 km**.

- [ ] Géocodage du départ et de l’arrivée.
- [ ] Itinéraire routier obtenu.
- [ ] Stations carburant reçues.
- [ ] Détours routiers mesurés.
- [ ] Trois lectures affichées : `🏆 Optimal`, `💶 Pompe`, `⚡ Rapide`.
- [ ] Le résultat affiche prix/L, coût comparé, détour km et détour min.

## Résilience

- [ ] Sans Leaflet : visualisation SVG et moteur toujours utilisables.
- [ ] API en panne : message d’erreur explicite + diagnostic, jamais faux résultat.
- [ ] Refus GPS : saisie manuelle toujours utilisable.

## Responsive

- [ ] Tests Chromium sur les quatre formats definis dans `Inspectrice-v2.md`.
- [ ] Captures demarrage et resultats, audits axe-core et parcours clavier.
- [ ] Pas d’erreur JavaScript non gérée au démarrage.

## Décision humaine

- [ ] L’application explique ce qu’elle compare.
- [ ] `Optimal` ne masque pas `Pompe` et `Rapide`.
- [ ] Les hypothèses utilisateur (litres, consommation, valeur du temps) restent visibles.

## Statut

Le workflow `.github/workflows/apps-ci.yml` constitue le garde-barrière automatique. La validation visuelle et fonctionnelle finale reste celle de l’Inspectrice des travaux finis. 🐾
