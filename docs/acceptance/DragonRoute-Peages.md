# DragonRoute — préparation des péages

17 novembre 2026. [Contrat V004](../specifications/OuQuandQui_API_V004_Peages_2026-11-17.md). **Tarifs réels non activés.** Cette fiche qualifie le comportement logiciel avec des réponses fictives ; elle ne qualifie aucun prix français.

## Parcours vérifiés

Sept scénarios rejoignent Inspectrice sur quatre formats :

1. Service absent : bouton indisponible, motif visible, aucun appel fournisseur, montant inconnu distinct de zéro.
2. Tarif complet : total carburant consommé + péages, indépendance du plein acheté, caractéristiques et source, texte hostile rendu littéralement ; changement de hauteur hors périmètre invalidant le devis.
3. Absence de péage confirmée, devis partiel avec paiement inconnu et refus d’une autre devise ; total incomplet pour les états incomplets.
4. Changement de variante pendant une réponse retardée : ancienne réponse ignorée même lorsque l’annulation réseau est neutralisée dans le test.
5. Station confirmée puis retirée : géométrie complète recalculée, paiement précédent non additionné, trajet initial rétabli.
6. Quota atteint, reprise volontaire, nouveau départ et expiration : carte conservée, ancien devis retiré, aucune répétition automatique.
7. Interface reliée au vrai serveur HTTP local, fournisseur remplacé par une réponse de test : requête CORS, calcul, normalisation et budget ; clé fictive présente uniquement sur l’appel serveur vers le fournisseur simulé.

Huit tests serveur complètent les contrôles : encodage et liaison au tracé, états tarifaires, pays/devise/véhicule, prix absents ou booléens, taxes, paiements dupliqués, endpoint fixe, absence de clé côté navigateur, serveur non qualifié, origines, compteur persistant après redémarrage, refus avant appel, quota amont et délai dépassé. Les compteurs journaliers ne sont pas un plafond financier total d’essai.

## Validation et limites

La suite attendue comprend 50 scénarios sur quatre formats, soit 200 exécutions navigateur, 26 contrôles de serveur/cache/rapport, puis les tests d’assemblage et d’aperçu. Le rapport du commit publié reste la référence pour les résultats complets. Les six premiers scénarios ont réussi localement sur Chrome ordinateur 1440 px et mobile simulé 390 px (12 passages). Le septième scénario, avec le serveur HTTP réel local et un fournisseur simulé, a également réussi dans les deux formats (2 passages supplémentaires). Les 26 contrôles serveur/cache/rapport ont réussi. Le serveur tarifaire utilise exclusivement des données fictives pour ces tests.

L’état par défaut publié conserve `tollsApi` vide. Aucun montant d’essai ne doit apparaître dans un trajet public. Une vérification du site doit constater : état indisponible, aucun appel tarifaire, trajet et budget carburant disponibles, métadonnées de commit et rapport concordants. Le cache PWA passe au shell 14, sans toucher aux caches d’autres applications.

Non validés : compte et clé réels, endpoint/polyline en France, règles des opérateurs, prix et taxes, concordance de masse/hauteur, import GPX ou téléphone physique, hébergement du service et protection contre les abus publics. La première qualification réelle proposée est limitée à six appels gratuits après accord ; aucune consommation n’est autorisée par cette fiche. Les modifications ne calculent pas encore les tarifs de caravanes ou de poids lourds et ne comparent pas simultanément les prix de plusieurs itinéraires.
