# Portion des passagers : recette

Contrat : [V096](../specifications/OuQuandQui_API_V096_Modes_Passagers_2026-11-23.md). Lot ARR-MULTI-09. Résultats datés conservés dans `quality/multi-passenger-modes/` ; le rapport de l’aperçu fait foi pour le commit publié.

- Modèle : seize cas couvrent portions, pauses avant/dans/après, absence distincte de zéro, bornes, décimales, précision temporelle, heure répétée, immutable préparation et conducteur exclu des allocations.
- Interface : quatorze scénarios sur les quatre formats Chromium ; deux scénarios repris dans les quatre configurations Firefox/WebKit.
- Recette locale simulée puis publique : Lyon–Valence, prise en charge Lyon Perrache et dépose Vienne, deux stations intermédiaires, attente/embarquement 2 min et sortie 3 min, deux passagers déclarés. Ces lieux publics ne représentent pas les adresses personnelles d’un utilisateur.
- Comparer voiture et marche à partir des rencontres, contrôler une seule demande IGN piéton et aucun recalcul automobile, puis la distance propre à la portion et les pauses comprises. Confirmer explicitement le groupe ; coûts comparatifs fictifs de 5 € voiture et 0 € marche, sans prétention tarifaire.
- Conserver volontairement la comparaison, vérifier l’instant, les métriques et le contexte. Vérifier le parcours adopté inchangé, les horaires, les frais partagés, les informations de stations, les exports et le retour à la référence.
- Maintenir la distinction entre tests automatisés, revue visuelle, fournisseurs consultés et déplacement physique non effectué. Aucune certification générale d’accessibilité ou de sécurité routière.
