# Traces routiers et alternatives indicatives

## Acceptation

- Trajet principal bleu soutenu (#0758d9), epaisseur 7 px sur Leaflet,
  avec liseré blanc de 11 px, au-dessus des alternatives.
- Alternatives fournies par OSRM en bleu clair (#82baff), epaisseur 6 px.
  Aucun trace alternatif invente ; geometries absentes ou invalides ignorees.
- Cadrage incluant les routes et les stations comparees.
- Memes couleurs sur le schema de secours ; trace principal et alternatives
  distingues meme apres une recherche de stations.
- Une geometrie principale incomplete bloque la recherche avec un message
  explicite, sans anciens resultats ni stations sur un trajet invalide.
- Alternatives absentes : message explicite, trajet principal utilisable.
- Ajout d'une station : trajet via la station en bleu ; alternatives du trajet
  direct masquees car elles ne passent pas necessairement par cet arret.
- Modification des parametres de carburant : retour au trajet direct avec
  ses alternatives, effacement de l'ancien choix de station.
- Modification du depart/de l'arrivee ou echec de relance : effacement de
  tous les traces et de la mention des alternatives.
- Mise a jour du cache de l'application sans effacer celui des autres applications.

## Limites explicites

Cette livraison affiche les alternatives ; elle ne permet pas de les selectionner.
Leur selection exige de garantir la coherence du classement des stations et du
trajet recalcule avec arret. Le moteur actuel recalcule un trajet via la station,
sans garantir la conservation du trace direct initial.

Les exclusions peages/autoroutes et les restrictions de gabarit ne sont pas
operationnelles. Leur activation depend d'un moteur qui les applique reellement,
y compris aux detours par les stations. Aucun reglage ignore n'est ajoute.

## Verification

Tests navigateur sur ordinateur, tablette et deux formats mobiles : couleurs,
epaisseurs, geometries, absence d'alternative, nettoyage apres erreur, marqueurs
et fiches de stations, retour au trajet direct. Les services sont simules ; ces
tests ne garantissent ni disponibilite ni justesse des donnees du service reel.
