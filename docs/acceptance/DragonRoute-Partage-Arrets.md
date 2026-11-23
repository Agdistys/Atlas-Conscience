# Recette — Partage des frais des parcours à plusieurs arrêts

Référence : [V093](../specifications/OuQuandQui_API_V093_Partage_Arrets_2026-11-23.md).

1. Confirmer un parcours à deux stations et son budget. Ouvrir le partage : aucun groupe ni affectation implicite, aucune requête supplémentaire.
2. Choisir le groupe et la portion, affecter les postes. Examiner puis confirmer : conservation exacte des centimes, achats en station exclus, inconnus et frais non attribués visibles.
3. Comparer portion complète et portion intermédiaire ; laisser un péage entier non attribué puis l’affecter explicitement. Aucun prorata de péage.
4. Modifier après aperçu, annuler puis confirmer une nouvelle version. La vue adoptée change uniquement après une nouvelle adoption ; la référence reste intacte.
5. Contrôler zéro passager, compte invalide, portion inversée, frais absents/nuls, couverture partielle et date de budget incompatible avec le départ.
6. Nouveau budget, nouveaux horaires, copie recalculée : anciennes répartitions retirées seulement de la nouvelle préparation. Une expiration ou un recul d’horloge retire les contributions actuelles, sans réactivation automatique.
7. Sauvegarder et relire, exporter puis importer : format 4 fidèle, anciens formats intacts, régression de collection et écrasement concurrent empêchés. GPX sans contribution, journal sans dépense automatique.
8. Quatre formats, texte agrandi, clavier et schéma sans carte. Inspection complète, ressources et parcours de l’aperçu exact avant livraison.
