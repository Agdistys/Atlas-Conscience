# V071 — Continuer après un accès station impossible

FIO-STATION-IMPASSE-01 · 21 novembre 2026. Complète STA-06/07/12, CAL-08/09 et PAR-02/03 du [cahier V5](OuQuandQui-Cahier-des-Charges-V5-2026-09-18.md), la [continuation V045](OuQuandQui_API_V045_Stations_Suivantes_2026-11-19.md) et la [recette V070](OuQuandQui_API_V070_Recette_Parcours_2026-11-21.md). Aucun changement de fournisseur, de périmètre ou de format personnel.

## Problème observé

La consultation réelle Lyon–Montpellier sans autoroute du 21 novembre a obtenu deux routes. Pendant la recherche de stations autour de 100 km, un détour a reçu de l’IGN un HTTP 404 avec le corps `{"error":{"message":" No path found "}}`. L’application conservait les résultats précédents, mais traitait cette réponse comme une panne de transport : la candidate restait en tête de la continuation. Le même accès pouvait ainsi interrompre à nouveau la recherche.

La reproduction déterministe utilise cinq stations : A est comparable, B renvoie cette absence de chemin et C reste accessible. Avant correction, seule A était affichée ; le test attendait A et C. Cette preuve est conservée dans `quality/station-no-path/before-fix.json`, séparément de la consultation réelle et de la recette finale.

## Comportement livré

L’adaptateur IGN reconnaît uniquement la combinaison HTTP 404 et objet JSON contenant une chaîne `error.message` exactement égale à `No path found`, après retrait des espaces en début et fin. Le message brut du service n’est pas injecté dans l’interface. Cette qualification est transmise au mécanisme existant d’accès indisponible.

Dans une recherche de stations, cette candidate est comptée comme examinée et sans accès calculable. Elle ne produit ni fiche tarifée, ni détour nul, ni garantie d’inaccessibilité sur le terrain. La recherche poursuit les autres candidates du même groupe, dans la limite existante de vingt ; le groupe suivant demande toujours une action explicite. Les points, classements, filtres, date des prix, résultats et arrêt déjà sélectionnés restent attachés à leur recherche. Aucun enregistrement personnel implicite.

Une absence de chemin pour le trajet principal reste un résultat sans trajet : aucune station n’est recherchée et aucun calcul avec d’autres contraintes n’est substitué. Ni le critère durée/distance, ni l’exclusion des autoroutes, ni le véhicule ne sont modifiés pour obtenir un résultat.

## Erreurs qui restent bloquantes

Un HTTP 404 générique, `No data found`, un corps HTML, JSON illisible ou de forme différente, une erreur 500/503 et un quota 429 ne sont pas assimilés à une absence de chemin. Les réussites précédentes restent disponibles ; la candidate non qualifiée n’est pas consommée et une reprise reste volontaire. Le délai de quota existant demeure applicable, sans répétition automatique.

L’annulation est contrôlée après lecture du corps d’erreur et de nouveau dans l’adaptateur. Une réponse tardive après annulation ou changement de critères ne fait pas avancer la file, ne recrée pas les anciennes stations et ne change pas le trajet courant. Les autres services gardent leur traitement précédent : la lecture du corps d’un HTTP 404 n’est activée que pour le calcul IGN.

## Source et portée de la reconnaissance

Le [guide officiel IGN](https://github.com/IGNF/cartes.gouv.fr-documentation/blob/main/content/fr/guides-utilisateur/utiliser-les-services-de-la-geoplateforme/calcul-itineraire.md), consulté le 21 novembre, décrit l’itinéraire avec étapes et contraintes. Le code de reconnaissance ci-dessus est fondé sur la réponse effectivement conservée du service, pas sur une généralisation de tous les HTTP 404. L’interface Swagger est accessible mais son URL de schéma annoncée a renvoyé 404 lors de cette vérification ; aucun contrat d’erreur exhaustif n’en est déduit. Si la forme du message change, le résultat revient au traitement prudent de panne, sans exclusion silencieuse.

Les preuves sources du cas initial restent dans `quality/acceptance-paths/published-source-22.json`. Les contraintes géographiques, les données de réseau et les conditions de passage demeurent celles du fournisseur ; une absence de chemin calculé ne vaut pas interdiction légale ni observation physique d’une station.

## Vérifications et livraison

Les nouveaux parcours couvrent l’accès impossible isolé, un groupe entièrement sans accès, les réponses ambiguës, la panne, le quota, la reprise du même point après erreur, l’annulation, la réponse tardive et le trajet principal. Deux parcours sont également obligatoires sur Firefox et WebKit, avec les cinquante cas précédents conservés. Les contrôles du même commit et la publication doivent réussir avant livraison ; le rapport publié porte les nombres et versions réels.

Une consultation réelle entre lieux publics vérifie ensuite le trajet et la poursuite des candidates, distinctement des sources simulées. Le dossier centralisé reçoit une édition V008, conservant V007 et les éditions antérieures. Aucun appareil physique, Safari commercial/iOS ni trajet effectué n’est qualifié par cette recette.
