# Recette — Horaires des parcours à plusieurs arrêts

Référence : [V092](../specifications/OuQuandQui_API_V092_Horaires_Arrets_2026-11-23.md).

1. Préparer et confirmer deux stations, ouvrir les horaires : départ vide, pauses conservées, aucune requête routière supplémentaire.
2. Choisir une date et examiner : arrivée avant pause, départ après pause, arrivée finale cohérente. Modifier un champ retire l’acceptation ; annuler conserve le parcours.
3. Confirmer puis adopter : mêmes heures dans la préparation, les points et la vue principale. Une modification ultérieure attend une nouvelle adoption.
4. Laisser une pause vide puis la mettre à zéro : la propagation de l’inconnu disparaît seulement après confirmation de zéro. Aucune ouverture de station déduite.
5. Vérifier minuit, année, printemps et automne, refus des départs locaux ambigus/inexistants, date passée sans report automatique.
6. Confirmer un budget, annuler les horaires puis les confirmer : budget conservé à l’annulation, retiré à la confirmation, nouveau budget lié au format 3.
7. Enregistrer, exporter, relire puis modifier une copie : originaux inchangés, ancien format lisible, départ passé retiré seulement de la nouvelle copie à recalculer.
8. Import futur/incohérent ou stockage concurrent : aucun écrasement. Collection 3 ne régresse pas. GPX sans heures de passage ; navigation sans transfert d’hypothèses horaires.
9. Quatre formats, clavier, rotation et texte agrandi ; repli sans carte, inspection complète et aperçu du même commit avant livraison.
