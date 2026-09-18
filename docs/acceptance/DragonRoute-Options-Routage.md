# Options de routage : integration personnelle OpenRouteService

## Statut

Integration optionnelle preparee, avec tests simules. La validation terrain avec
une cle personnelle valide reste a effectuer. OSRM reste le mode par defaut sans
compte. L'hebergement demeure sur GitHub Pages ; aucun secret partage n'est publie.

## Acceptation

- Options distinctes : eviter peages, autoroutes, ferries. Cocher une exclusion
  selectionne OpenRouteService ; revenir a OSRM ne decoche pas les choix.
  Une recherche OSRM avec exclusions est refusee avant tout appel de geocodage.
- Cle personnelle saisie volontairement et conservee en memoire de la page.
  Le champ est vide apres lancement ; aucun stockage local/session, export de
  profil, URL ou journal de diagnostic ne doit contenir la cle. Effacement explicite.
  Une nouvelle ouverture/recharge necessite une nouvelle saisie. La cle reste
  accessible aux outils du navigateur : ce mode ne protege pas un secret partage.
- Destination fixe HTTPS : api.heigit.org/openrouteservice/v2/directions/driving-car/geojson.
  Cle dans Authorization uniquement, POST, pas de cookies ni suivi de redirection.
- Les coordonnees du depart, de l'arrivee et de chaque station comparee sont
  transmises a HeiGIT / OpenRouteService. L'interface le signale avant activation.
- Format longitude/latitude, metres, secondes, preference fastest, profil voiture.
  Aucun controle de gabarit : le type de vehicule enregistre ne devient pas un
  profil camion/caravane. Rayons de raccordement limites a 200 m ; l'entree reelle
  de la station n'est pas certifiee.
- Exclusions identiques sur trajet direct, alternatives et trajets via station.
  Aucun repli vers OSRM ou suppression d'exclusion apres une erreur du fournisseur.
- Alternatives indicatives : tentative supplementaire seulement si trajet direct
  <= 100 km ; au-dela, limite explicite. Une erreur de cette tentative conserve le
  trajet direct calcule avec les memes exclusions, avec un avertissement explicite.
- Recherche de stations ORS : chaque candidate est verifiee avec Directions via
  la station, sans matrice OSRM. Meme selection limitee a 20 candidates du corridor
  qu'auparavant ; classement non exhaustif. Appels sequences et espaces de 1,8 s
  au minimum. Le compte peut imposer d'autres quotas ; 429 arrete la comparaison.
- Distances et durees des segments et du total validees ; geometrie invalide,
  avertissement moteur ou donnees incoherentes : resultat refuse.
- Detour = difference entre trajet avec station et trajet direct, sous memes
  exclusions. Une difference negative n'est pas ramenee silencieusement a zero :
  la candidate est exclue du classement et ce cas est compte et signale.
- Achat = litres * prix ; carburant supplementaire = detour km * conso/100 * prix.
  L'achat reste distinct du cout compare. Distances jusqu'a la station issues du
  premier segment du vrai trajet via station, puis filtrees par plage demandee.
- Absence d'acces (codes ORS 2009/2010) : station exclue et comptabilisee. Erreur
  reseau, cle refusee, quota, reponse invalide : aucun classement partiel affiche.
- Choix d'une station ORS : confirmation explicite que les routes peuvent changer,
  rappel des exclusions, distance/duree totales. Le trace propose est celui verifie
  lors du classement, sans appel supplementaire. Annulation conserve la carte.
- Modification d'option/service/cle : ancien trajet, stations et arret invalides.
- Arret de la comparaison : requetes interrompues, pas de resultats tardifs,
  trajet direct conserve. Les controles restent utilisables apres l'arret.

## Verification

Scenarios navigateur sur quatre formats : absence de cle, refus de repli OSRM,
transport des exclusions/cle, ordre des coordonnees, attribution, stations,
confirmation/annulation, export sans cle, oubli/rechargement, 403/429/500,
geometrie invalide, station inaccessible, detour negatif, panne apres resultat
intermediaire, interruption, alternatives courtes et limite de distance.

Les tests utilisent une cle factice et ne certifient pas la conformite des routes
reelles. Avant validation terrain : calculer un trajet connu avec/sans chaque
exclusion, verifier les voies et les detours de stations, puis les erreurs de quota.
Les limites des cartes demeurent : signalisation et restrictions sur place priment.

## Activation de l'essai personnel

1. Creer un compte sur https://account.heigit.org/ et une cle donnant acces a
   Directions OpenRouteService, selon les conditions et quotas affiches.
2. Ouvrir l'apercu, puis Options du trajet. Cocher les exclusions souhaitees.
3. Saisir la cle directement dans le champ masque de l'application, jamais dans
   une conversation, un fichier public ou le depot. Calculer le trajet.
4. Verifier les exclusions affichees puis les stations. Effacer la cle a la fin.

Cette integration personnelle n'est pas une strategie de cle partagee pour un
site grand public. Un tel deploiement exigerait un service protege et une decision
d'architecture distincte ; GitHub Pages seul ne peut pas garder une cle secrete.

## Sources verifiees le 17 septembre 2026

- Schema officiel (serveur, parametres, retour GeoJSON) : https://docs.openrouteservice.org/all/docs
- Exclusions : https://giscience.github.io/openrouteservice/api-reference/endpoints/directions/routing-options
- Formats : https://giscience.github.io/openrouteservice/api-reference/endpoints/directions/requests-and-return-types
- Restrictions : https://openrouteservice.org/restrictions/
- Codes d'erreur : https://giscience.github.io/openrouteservice/api-reference/error-codes
- Compte et quotas : https://account.heigit.org/

Prevol CORS du serveur officiel verifie : POST avec Authorization et Content-Type
autorises depuis l'origine GitHub Pages. Ce test sans cle ne valide pas le calcul.
