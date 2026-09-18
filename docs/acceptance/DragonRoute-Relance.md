# Relance de recherche

## Intention

Une nouvelle recherche ne doit jamais presenter les prix, stations ou compteurs
du trajet precedent comme ses propres resultats.

## Acceptation

- Au lancement, retirer les anciens prix, compteurs et traces cartographiques.
- Une panne du geocodage ou du routage laisse les anciens resultats effaces.
- Le bouton redevient disponible apres une erreur et permet une recherche reussie.
- Entree pendant une recherche ne lance pas une seconde recherche concurrente.
- Verifier ces parcours sur les quatre formats Inspectrice avec services simules.
- Renouveler le cache PWA sans effacer ceux des autres applications.

## Inspection humaine

Dans l'apercu, lancer un trajet, changer l'arrivee puis relancer : les anciens
prix doivent disparaitre immediatement. Verifier le confort de lecture sur mobile.
Les tests automatises de carte couvrent le repli SVG, pas le moteur Leaflet reel.
L'activation du nouvel apercu et son rapport doivent etre verifies avant fusion.
