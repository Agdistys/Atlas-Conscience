# V082 — Délais des adresses et des services vélo

Lot FIO-QUOTAS-MODES-03 · 22 novembre 2026. Complète ERR-05, ERR-01, ERR-02, GEO-07 et QUA-10 du [cahier V5](OuQuandQui-Cahier-des-Charges-V5-2026-09-18.md), après les [délais routiers V081](OuQuandQui_API_V081_Delais_Routage_2026-11-22.md). Les contrats [adresses V002](OuQuandQui_API_V002_Adresses_2026-11-17.md), [Vélo’v V032](OuQuandQui_API_V032_Velos_Partages_2026-11-19.md) et [vélo V033](OuQuandQui_API_V033_Itineraires_Velo_2026-11-19.md) restent applicables, avec les précisions ci-dessous. Éditions antérieures conservées.

## Capacité disponible

Une attente annoncée par la recherche d’adresses s’applique aux différents modes qui utilisent ce géocodeur. Une attente du moteur cyclable s’applique au calcul autonome, aux comparaisons et à la portion vélo d’un parcours partagé. Les trois fichiers du catalogue Vélo’v partagent leur propre attente. Géocodage IGN, routage IGN, routage cyclable FOSSGIS et catalogue Vélo’v restent des services distincts.

Les commandes expliquent le délai restant. Aucun rafraîchissement ni recalcul automatique n’est lancé à son expiration : une nouvelle action volontaire est nécessaire. Une attente déjà connue conserve le résultat affiché. Un catalogue partiel reste consultable, avec ses dates et les disponibilités inconnues clairement distinguées de zéro. Les annonces anciennes ne deviennent pas récentes après l’attente.

## Délais et cadence

Le HTTP 429 et le HTTP 503 accompagné d’un `Retry-After` lisible utilisent le même modèle que les carburants, transports et moteurs routiers. Secondes entières et dates HTTP sont acceptées. Une date serveur exposée sert de référence ; sinon l’heure de réception est utilisée. Un en-tête non exposé par CORS reste inaccessible au navigateur. Le 503 sans en-tête reste une indisponibilité, sans délai serveur inventé.

L’écoulement de l’attente est mesuré par l’horloge monotone de la page : avancer ou reculer l’heure civile ne permet pas de relancer prématurément. Les délais extrêmes ne sont ni tronqués ni ramenés à quelques secondes ; une durée non représentable reste bloquante dans la page et explicitement signalée. Une réponse plus courte ne réduit jamais une attente encore active.

Le minimum pour les adresses reste cinq secondes lorsqu’un délai lisible plus court est reçu. **Le repli en l’absence de délai lisible passe de cinq à soixante secondes**, explicitement annoncé ; cette précision remplace la règle de repli V002. Vélo et Vélo’v conservent leur minimum d’une minute. Les cadences ordinaires restent distinctes : 250 ms entre recherches d’adresses, cinq secondes entre appels cyclables, une minute entre consultations Vélo’v. Les deux dernières cadences utilisent désormais également l’horloge monotone.

Les caches mémoire conservent leurs règles, bornes et dates d’origine. Une donnée valide réutilisée sans appel ne consomme pas le quota. Le calcul vélo autonome vérifie l’attente avant résolution des lieux et à nouveau avant le véritable appel ; les comparateurs peuvent consulter un résultat en cache sans réseau. Les dates de données restent des dates civiles : une incohérence d’horloge n’est pas masquée par le changement de mesure des délais.

## Annulation et reprise

L’identité du calcul, son contexte et son annulation sont contrôlés avant d’installer un délai provenant d’une réponse. Une réponse arrivée après fermeture, annulation ou modification du contexte ne bloque pas l’opération suivante. La cadence minimale d’un appel réellement lancé reste applicable après annulation. Les réponses valides tardives ne remplissent pas le cache ni l’interface d’une autre opération.

Les contraintes, lieux choisis, limites de distance, durées de prise/restitution et règles de disponibilité ne sont pas relâchés pour contourner une panne. La reprise volontaire réutilise uniquement les caches encore valides. Aucun moteur automobile substitué, aucun fournisseur de secours et aucune écriture de profil, préparation ou journal.

## Première comparaison de stations interrompue

Lorsque la première matrice d’accès aux stations est indisponible, les stations reçues restent conservées et le message indique qu’aucun accès n’a encore été calculé. Le résultat est **non concluant** ; il n’invite plus prématurément à élargir la distance. La reprise poursuit les candidates conservées sans nouvelle collecte carburants. Une absence réellement établie de station comparable reste un état distinct.

## Vérifications et portée

Seize nouveaux scénarios navigateur couvrent les attentes partagées, 429, 503 avec délai, repli sans en-tête, dates serveur, durées extrêmes, changements d’heure, annulation avec réponse tardive, cache, catalogue partiel, clavier, reprise des parcours partagés et première matrice non concluante. Quatre formats Chromium et deux parcours supplémentaires dans la matrice Firefox/WebKit. Les anciens scénarios de reprise simulent désormais aussi le temps monotone écoulé ; les tests de vieillissement des données gardent leur contrôle séparé de l’heure civile. Le contrôle de l’ancien calcul de date Vélo’v est remplacé par celui du minimum cyclable dans le modèle commun.

Les résultats effectifs sont liés au commit dans le rapport d’inspection de l’aperçu et les preuves du lot `quality/mode-quotas`. La vérification publiée distingue les consultations réelles de lieux publics lyonnais et de Vélo’v des quotas simulés sur réponses rejouées. Aucun quota réel provoqué. Aucun téléphone physique, Safari commercial, trajet ou disponibilité future qualifiés.

## Sources et limites conservées

Le traitement des délais suit [RFC 9110, Retry-After](https://www.rfc-editor.org/rfc/rfc9110.html#name-retry-after). La [présentation officielle FOSSGIS](https://routing.openstreetmap.de/about.html), relue le 22 novembre, rappelle l’attribution, le référent valide et la charge modérée. Endpoints, données transmises, licences, territoire pilote et périmètre gratuit d’essai restent ceux des contrats V002, V032 et V033. Aucun nouveau fournisseur, abonnement, compte, clé visiteur, service serveur, tarif ni qualification commerciale.

Les attentes sont propres à la page, sans registre persistant ni coordination de tous les visiteurs d’une même IP. Un rechargement ne certifie pas que le quota du fournisseur est libéré. Les limites de couverture française, véhicules avec gabarit, péages incomplets et transports collectifs demeurent explicites. La suite du développement suit les écarts du cahier ; la fusion sur le site principal reste distincte de la publication d’un aperçu.
