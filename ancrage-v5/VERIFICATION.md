# Vérifications — 31 octobre 2026

## Sources et permissions

Dépôt inspecté : Agdistys/Atlas-Conscience, branche main, base `27507a4e83306112d95f12ef4c59e84eb56def90`. V1 distante : blob `081e988449410a01e64b4b6ef9dd571856ae7fd8`. La connexion GitHub annonce les droits push/admin. La V5 ajoute des fichiers, sans modifier les versions précédentes ou les autres applications.

Aucune extension Cloudflare disponible n'a été trouvée dans la recherche de connexions. Le tableau de bord a demandé une connexion. La session locale Wrangler existante était expirée et non renouvelable lors du contrôle. Déploiement Cloudflare : en attente de réauthentification du compte de Diane. Aucune adresse Worker active n'est annoncée ; `config.json` reste vide.

## Réseau réel, sans session Facebook

Le code même du résolveur a été exécuté depuis le Mac, sans cookies ni identifiants Facebook, le 31 octobre 2026 :

| Lien mobile | Destination observée | Preuve |
|---|---|---|
| `https://www.facebook.com/share/v/1DVM55EzSR/` | `https://www.facebook.com/reel/2197532477774605/` | Redirection HTTP 302 ; résolution réussie |
| `https://www.facebook.com/share/r/1FaGCQWJSS/` | `https://www.facebook.com/reel/1308103627490851/` | Redirection HTTP 302 ; résolution réussie |

Le deuxième lien ne mène pas au Reel 2197532477774605, contrairement à une association évoquée dans l'ancien échange. Aucun couple n'est codé en dur dans le résolveur. Ces résultats réseau locaux ne prouvent pas encore le comportement depuis les adresses IP Cloudflare.

## Contrôles exécutés

- 32 tests Node réussis : normalisation, Instagram, destinations réelles simulées, liens de publication, redirections relatives, demandes de connexion, boucle, limite de redirections, métadonnées contradictoires, réponses bloquées, délai, taille, CORS, limitation, protection contre les requêtes vers des hôtes arbitraires, contrat Worker, erreurs du frontend, réponses malformées, annulation des résultats périmés, stockage indisponible et échec de copie.
- Construction Wrangler `deploy --dry-run` réussie : bundle produit, configuration et liaison de limitation reconnues. Aucun déploiement déclenché par ce contrôle.
- Chrome réel, page locale : lien court sans service → recours manuel ; iframe Facebook fourni → adresse correcte et lecteur 267 × 476 ; copie HTML relue dans le presse-papiers ; Instagram nettoyé et script conservé ; effacement ; affichage 390 px examiné, pas de débordement horizontal à 320 px ; aucun message d'erreur JavaScript capturé pendant ces parcours.

## Limites

Pas de téléphone physique, de publication Webnode ou de lecture vidéo exhaustive. L'accès réel depuis Cloudflare doit être testé après réauthentification et déploiement. La résolution ne garantit pas l'autorisation d'intégrer un contenu Facebook. Les métadonnées et refus sont testés avec des réponses simulées, distinctes des deux redirections réellement observées.
