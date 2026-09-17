# Stations, favoris et profil local

## Intention

Rendre toutes les stations comparees identifiables sur la carte, ouvrir leur fiche
et memoriser les lieux et le vehicule dans un profil local sans compte.

## Acceptation

- Points numerotes contrastes sur Leaflet et schema de secours, accessibles au
  clavier et ouvrant la meme fiche que le bouton de la liste.
- Le cadrage inclut les stations, pas seulement le trajet direct.
- Horaires declares par jour, automate 24 h/24 distingue de la boutique, services
  et source officielle. Valeur absente ou illisible = non renseigne.
- Favoris persistants par identifiant ; aucun prix sauvegarde dans le profil.
  A la reouverture d'un favori hors recherche courante, demander une fiche fraiche.
  En cas de panne, conserver l'adresse mais ne pas inventer d'informations actuelles.
- Vehicule : nom, type, carburant, consommation, litres par defaut. Parametres
  appliques au prochain calcul carburant. Type non voiture : limite de routage visible.
- Adresses nommees : ajout, modification, suppression, reprise comme depart/arrivee.
- Export JSON, import valide et confirme, suppression du profil confirmee.
- Profil public separe de chaque dossier d'apercu ; aucune synchronisation serveur.
- Stockage refuse, quota, fichier invalide : message explicite, pas de faux succes.
- Ne jamais effacer le stockage des autres applications.

## Donnees

API du ministere de l'Economie, champs horaires (JSON imbrique),
horaires_automate_24_24 et services_service verifies le 17 septembre 2026.
Source : https://data.economie.gouv.fr/explore/dataset/prix-des-carburants-en-france-flux-instantane-v2/
Les horaires sont declaratifs, ils ne certifient pas une ouverture en temps reel.

Le profil reste sur cet appareil/navigateur. Les adresses choisies sont transmises
au geocodeur lors du calcul d'un trajet, comme les adresses saisies manuellement.
Les fichiers exportes contiennent des adresses personnelles et doivent rester prives.
Limites du profil : 50 adresses, 100 stations ; import JSON limite a 100 Ko.

## Verification

Scenarios navigateur sur quatre formats : points Leaflet et SVG, detail d'horaires,
favoris apres rechargement, reutilisation d'adresse, persistance du vehicule,
stockage indisponible, import invalide/valide, export relu, effacement cible.
Audits axe et captures supplementaires du profil et de la fiche station.
