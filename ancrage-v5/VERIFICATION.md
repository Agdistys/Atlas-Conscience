# Vérifications — 31 octobre 2026

## Sources et permissions

Dépôt inspecté : Agdistys/Atlas-Conscience, branche main, base `27507a4e83306112d95f12ef4c59e84eb56def90`. V1 distante : blob `081e988449410a01e64b4b6ef9dd571856ae7fd8`. La connexion GitHub annonce les droits push/admin. La V5 ajoute des fichiers, sans modifier les versions précédentes ou les autres applications.

Aucune extension Cloudflare disponible n'a été trouvée dans la recherche de connexions. Le tableau de bord a demandé une connexion. La session locale Wrangler existante était expirée au premier contrôle. Diane a rétabli sa connexion ; l’autorisation Wrangler a été renouvelée avec les quatre mêmes droits existants, sans élargissement. Le sous-domaine de compte `d-serant.workers.dev` a été confirmé par lecture API. Le Worker neuf `ancrage-ami-resolver-v5` a été publié avec succès, version `e70f15b8-8ef7-4274-8ec7-c474a1e7ff56`. Les essais du service public et la connexion automatique sont consignés ci-dessous.

## Réseau réel, sans session Facebook

Le code même du résolveur a été exécuté depuis le Mac, sans cookies ni identifiants Facebook, le 31 octobre 2026 :

| Lien mobile | Destination observée | Preuve |
|---|---|---|
| `https://www.facebook.com/share/v/1DVM55EzSR/` | `https://www.facebook.com/reel/2197532477774605/` | Redirection HTTP 302 ; résolution réussie |
| `https://www.facebook.com/share/r/1FaGCQWJSS/` | `https://www.facebook.com/reel/1308103627490851/` | Redirection HTTP 302 ; résolution réussie |

Le deuxième lien ne mène pas au Reel 2197532477774605, contrairement à une association évoquée dans l'ancien échange. Aucun couple n'est codé en dur dans le résolveur. Ces premiers résultats sont des essais réseau locaux ; les mêmes liens ont ensuite été vérifiés depuis le Worker Cloudflare déployé (voir ci-dessous).

## Contrôles exécutés

- 32 tests Node réussis : normalisation, Instagram, destinations réelles simulées, liens de publication, redirections relatives, demandes de connexion, boucle, limite de redirections, métadonnées contradictoires, réponses bloquées, délai, taille, CORS, limitation, protection contre les requêtes vers des hôtes arbitraires, contrat Worker, erreurs du frontend, réponses malformées, annulation des résultats périmés, stockage indisponible et échec de copie.
- Construction Wrangler `deploy --dry-run` réussie : bundle produit, configuration et liaison de limitation reconnues. Aucun déploiement déclenché par ce contrôle.
- Chrome réel, page locale : lien court sans service → recours manuel ; iframe Facebook fourni → adresse correcte et lecteur 267 × 476 ; copie HTML relue dans le presse-papiers ; Instagram nettoyé et script conservé ; effacement ; affichage 390 px examiné, pas de débordement horizontal à 320 px ; aucun message d'erreur JavaScript capturé pendant ces parcours.

## Limites

Pas de téléphone physique, de publication Webnode ou de lecture vidéo exhaustive. L'accès réel depuis Cloudflare doit être testé après réauthentification et déploiement. La résolution ne garantit pas l'autorisation d'intégrer un contenu Facebook. Les métadonnées et refus sont testés avec des réponses simulées, distinctes des deux redirections réellement observées.

## Publication réelle et raccordement

- Page publique : https://agdistys.github.io/Atlas-Conscience/APP-Ancrage_aMi_V5.html — HTTP 200, contenu identique octet pour octet au fichier testé (SHA-256 `c4c2765e2f4ddfa6d2cbf2c7a3b6206a69b3bb7c507997174cef79ce9c4c8704`).
- Premier commit : `c4f274674fb4083ff569c4fd7f1cb310b68a5153`. Les trois vérifications GitHub (Inspectrice, Pages et publication des aperçus) ont réussi sur cette révision. Quinze ajouts, aucun fichier antérieur modifié.
- Worker : https://ancrage-ami-resolver-v5.d-serant.workers.dev — compte Cloudflare de Diane, sans compte temporaire ni modification de forfait.
- `/health` : HTTP 200, contrat V5 correct.
- Les deux liens `/share/` du tableau renvoient HTTP 200 avec `evidence: redirect` et les mêmes destinations depuis Cloudflare.
- L’origine GitHub Pages reçoit le bon en-tête CORS ; une origine étrangère reçoit 403 sans autorisation CORS. Une URL externe reçoit 400 avant toute requête vers celle-ci.
- Les cinq réponses publiques brutes sont conservées dans `tests/live-results-2026-10-31.json`.
- `config.json` référence maintenant l’origine réelle du Worker : aucune clé n’est exposée et aucun réglage manuel n’est nécessaire sur une nouvelle session de la page.

Un premier essai HTTPS a échoué pendant l’activation initiale de l’adresse. Les essais suivants ont réussi avec la vérification normale du certificat, sans contournement. La création automatique d’un nouveau sous-domaine a été bloquée ; le sous-domaine déjà attribué `d-serant` a ensuite été confirmé par l’API puis utilisé.
