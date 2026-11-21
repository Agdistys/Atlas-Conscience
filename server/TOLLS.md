# Service tarifaire — préparation V001

17 novembre 2026. Node 22+, sans dépendance de production. **Non déployé ; aucun fournisseur réel testé.** Cette préparation ne donne pas d’autorisation de création de compte, de facturation ni d’envoi de trajets personnels.

## Contrat local

`POST /api/tolls`, JSON : `requestId`, `coordinates` (géométrie GeoJSON complète, longitude/latitude), `distance` en mètres, `vehicle` (`type: car`, `height` en mètres, `weightKg` PTAC déclaré, `axles: 2`), `payment` (`cash` ou `licensePlate`), `departureTime` ISO UTC. Aucun endpoint amont, clé ou méthode de facturation fourni par le visiteur. Corps 6 Mio maximum ; 100 000 points maximum, sans troncature ; enveloppe géographique métropolitaine grossière puis confirmation France seule dans la réponse. Cette enveloppe seule ne prouve pas le pays.

Réponse : `requestId`, empreinte `routeHash` incluant géométrie et hypothèses, `status` (`no_tolls`, `estimated`, `partial`, `unavailable`), `amountEur`, `knownSubtotalEur`, `currency`, `provider`, `fetchedAt`, `tariffValidAt`, `vehicle`, `payment`, `departureTime`, `items`, `warnings`. `amountEur` reste nul pour un devis partiel/indisponible. Les coûts carburant, autres paiements, abonnement, stationnement et métadonnées du fournisseur ne sont pas renvoyés comme tarifs à additionner.

Le serveur exige un retour de la géométrie encodée identique et une distance à moins de 0,5 % (minimum technique 100 m). Cette tolérance de distance ne remplace pas la concordance géométrique. Le périmètre France, le véhicule, les taxes et la cohérence somme/total sont contrôlés ; un paiement ambigu/dupliqué est refusé. Aucune tentative automatique ni redirection amont. Taille de réponse 8 Mio, délai 20 secondes, une requête amont simultanée, six départs par minute maximum.

## Configuration après qualification et accord

- `TOLLGURU_API_KEY` : secret dans le gestionnaire de secrets du serveur uniquement.
- `ALLOWED_ORIGINS` : origines HTTPS explicites. Les origines locales HTTP sont acceptées pour le développement.
- `TOLLS_FRANCE_QUALIFIED=1` : déclaration de qualification réelle des tarifs et de la convention de masse/hauteur ; jamais activée par défaut. La clé seule ne suffit pas.
- `TOLLS_DAILY_LIMIT` : plafond de requêtes décidé pour cet essai, strictement positif.
- `TOLLS_LEDGER_FILE` : chemin absolu d’un fichier persistant **préalablement initialisé**, avec `day` au format YYYY-MM-DD et `count` entier. Absence ou fichier illisible : aucun appel amont. Le compteur est réservé sur disque avant l’appel ; une erreur ou un délai dépassé reste compté. Le compteur ne contient aucune coordonnée. Ne pas le recréer à zéro lors d’un redémarrage.
- `HOST` : 127.0.0.1 par défaut ; `PORT` : 8788. Exposition HTTPS et protections publiques à approuver avant ouverture.

Lancement : `npm run start:tolls`. `/health` indique la présence des conditions de configuration, pas la validité de la clé, du compteur ou des tarifs réels. Après recette seulement, renseigner l’URL HTTPS publique `/api/tolls` dans `DragonRoute/config.js` (`tollsApi`). Aucun secret dans ce fichier.

## Limites d’exploitation

Une seule instance/processus doit posséder le compteur. Le fichier persistant et son remplacement atomique ne constituent pas un compteur distribué ni un verrou interprocessus. Une ouverture multi-instance exigerait un stockage transactionnel partagé. La limite porte sur les requêtes de l’application, pas sur une unité de facturation garantie du fournisseur ; quotas et plafonds fournisseur doivent aussi être confirmés. Une limite journalière n’est pas un plafond total d’essai.

CORS ne bloque pas un client extérieur capable de forger Origin. Une protection contre l’abus en frontal et un plafond dur du fournisseur sont nécessaires pour une ouverture publique. Le site GitHub Pages peut rester en place ; ce serveur demande un hébergement exécutant Node et conservant durablement le compteur. GitHub Actions ne doit pas devenir un calculateur de trajets personnels : ses journaux et déclenchements publics ne sont pas un remplacement de ce service.

Aucune journalisation applicative des corps ou clés. Désactiver aussi leur collecte dans l’hébergeur et le proxy. Vérifier conditions, attribution, rétention, essai, coût par endpoint et contrat commercial du fournisseur. Recette France indispensable avant `TOLLS_FRANCE_QUALIFIED` : tracé, péages payants, gratuité confirmée, taxes, paiement et masse/hauteur ; comparer aux tarifs d’exploitants. Les fixtures sont fictives et ne prouvent aucune justesse tarifaire.

Tests : `node --test tests/tolls-server.test.mjs`. [Référentiel V004](../docs/specifications/OuQuandQui_API_V004_Peages_2026-11-17.md).
