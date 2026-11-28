# DragonRoute — navigation externe et tracé GPX

17 novembre 2026. Exigence ARR-07 du cahier des charges ; [contrat détaillé V003](../specifications/OuQuandQui_API_V003_Navigation_2026-11-17.md).

## Comportement attendu

Un trajet calculé donne accès à « Navigation et tracé GPS ». Le résumé reflète la variante courante et la station confirmée. Google Maps reçoit départ, étape éventuelle et arrivée ; Waze reçoit séparément station ou arrivée et utilise sa propre position de départ. Les préférences d’évitement sont transmises sans promettre leur respect par l’application externe. La géométrie exacte n’est conservée que dans le fichier GPX, à huit décimales.

Les liens voiture sont absents pour un profil poids lourd. Un GPX issu d’un trajet poids lourd calculé par un serveur compatible reste exportable avec les dimensions dans sa description, sans prétendre que le destinataire appliquera ces restrictions. Cette vérification simulée n’active pas le routage poids lourd dans l’aperçu public.

Fermer la fenêtre supprime les liens ; modifier une adresse ou une contrainte invalide aussi les résultats. Une nouvelle ouverture reconstitue les liens depuis l’état courant. Une erreur réseau ne restaure pas un ancien trajet. Retirer une station restitue le tracé et le budget du trajet de référence.

## Recette automatisée

Quatre nouveaux scénarios obligatoires sont exécutés sur les quatre formats d’Inspectrice :

1. Absence du bouton avant calcul, URLs correctes, aucun envoi automatique aux navigateurs externes, fermeture clavier, retour du focus, liens supprimés, contrôle d’accessibilité et de débordement.
2. Variante exportée, arrêt confirmé dans les liens et le GPX, ordre des points, distances mises à jour, puis retrait d’arrêt sans ancien point de passage.
3. Transmission des trois préférences disponibles dans une configuration de test compatible ; profil poids lourd sans lien voiture et dimensions conservées dans la description GPX.
4. Libellé contenant du HTML et un caractère interdit en XML, absence d’interprétation HTML, erreur de création du fichier visible, invalidation et échec réseau sans anciens liens.

Le cache PWA passe au shell 13 ; le contrôle de nettoyage conserve les caches d’autres applications. La suite complète attendue comprend 43 scénarios sur quatre formats, soit 172 exécutions navigateur. Le résultat complet doit être lu dans le rapport du commit testé ; les réussites des versions précédentes ne valident pas ce nouveau commit.

## Vérifications locales

Les quatre scénarios ont réussi sous Chrome sur ordinateur 1440 px et mobile simulé 390 px : 8/8. Dix fichiers GPX issus de ces parcours (variante, arrêt, retrait, poids lourd simulé et texte hostile) ont été validés avec `xmllint` contre le schéma officiel GPX 1.1 téléchargé le 17 novembre 2026. Le schéma et les captures sont conservés dans les dossiers techniques ignorés par Git, `quality/navigation/` et `test-results/`.

Ces contrôles vérifient le fichier effectivement téléchargé, sa syntaxe et ses points. Ils ne valident pas l’import dans tous les GPS, l’ouverture d’applications natives sur un téléphone physique, la sécurité routière, le trafic, un tarif de péage ou la portée de toutes les préférences des services externes. Le parcours est planifié : aucun déplacement réel n’a été enregistré.

La vérification publiée devra aussi confirmer le commit de l’aperçu, son rapport d’inspection, le calcul avec les services réels et le téléchargement depuis la page en ligne. Les traces locales de cet essai sont conservées dans `quality/navigation/`, séparément des réponses simulées.
