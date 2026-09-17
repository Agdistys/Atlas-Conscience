# Trajet puis arrets

## Intention

Calculer et afficher le trajet avant de demander les parametres carburant.
Garder la carte et les commandes dans des zones distinctes sur ordinateur et mobile.

## Acceptation

- Le bouton initial est "Trouver mon trajet" ; aucun appel carburant a cette etape.
- Un trajet reussi ouvre les branches Stations et Covoiturage.
- Stations : au plus tot, compromis dans les 50 premiers kilometres, ou autour
  d'une distance choisie avec une tolerance explicite de 20 km.
- Les distances sont routieres depuis le depart saisi, pas un suivi GPS continu.
- La preselection utilise la projection sur la geometrie ; les distances definitives
  viennent de la matrice routiere. Au maximum 20 candidates sont comparees parmi
  les stations recues. Aucun elargissement silencieux si la fenetre est vide.
- Une fiche par station, avec les badges OPTIMAL/POMPE/RAPIDE cumules.
- Le choix d'une station recalcule et dessine le trajet passant par cet arret.
- Cout = achat + carburant du detour ; les minutes restent affichees separement.
- Changer le trajet efface les anciens resultats. Changer les parametres carburant
  efface les stations, mais conserve le trajet direct.
- Une panne carburant ne supprime pas le trajet. Les reponses partielles sont signalees.
- Tests sur quatre formats, axe, captures et Leaflet reel avec tuiles simulees.

## Limites explicites

- Le service OSRM public refuse actuellement exclude=motorway et exclude=toll
  (verification le 17 septembre 2026, code InvalidValue). Sans peages et sans
  autoroutes ne sont donc pas encore proposes comme options operationnelles.
- Profil caravane/camion : connexion a un moteur avec restrictions de gabarit
  a confirmer avec Diane ; ne pas assimiler un itineraire voiture a un trajet
  garanti pour vehicule encombrant. La signalisation routiere reste determinante.
- Covoiturage : branche et lien vers la recherche externe uniquement ; aucune
  annonce connectee, aucun prix ni disponibilite inventes.
- L'API carburants, ses prix et sa couverture ne garantissent pas l'ouverture
  ni la disponibilite du carburant a l'arrivee. Le mode proche n'est pas une
  assistance d'urgence ni un calcul d'autonomie restante.

Sources : https://project-osrm.org/docs/v5.24.0/api/
et https://giscience.github.io/openrouteservice/api-reference/endpoints/directions/routing-options
