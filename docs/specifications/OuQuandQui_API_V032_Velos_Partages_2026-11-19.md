# V032 — Repérer les vélos partagés à Lyon

Lot DOU-PARTAGE-01, 19 novembre 2026. Complète le [cahier V5](OuQuandQui-Cahier-des-Charges-V5-2026-09-18.md) et les contrats [collectif V026](OuQuandQui_API_V026_Transports_Collectifs_2026-11-18.md) et [journal V031](OuQuandQui_API_V031_Journal_Collectif_2026-11-19.md), sans modifier leurs formats.

## Capacité et périmètre

Un accès « Vélos partagés · pilote Lyon » ouvre la consultation du réseau Vélo’v, avant ou après préparation d’un trajet. Chargement volontaire des stations et des annonces de vélos/places, recherche locale par nom/adresse/numéro, filtres de location et restitution, pagination de 25 stations et carte indépendante synchronisée avec cette page. Les autres réseaux et territoires ne sont pas couverts par ce lot.

DOU-03 est couvert pour ce pilote ; DOU-05 est respecté en laissant batterie et autonomie individuelles inconnues. DOU-04, le premier/dernier kilomètre incluant location et restitution, reste à développer. Aucun calcul vélo ou comparaison train + vélo, réservation, prix de location, guidage ou garantie à l’arrivée n’est produit. Le catalogue de types annonce une autonomie maximale de modèle : elle n’est pas utilisée comme autonomie d’un vélo présent.

## Source qualifiée

- Producteurs : Métropole de Lyon / JCDecaux. [Fiche du Point d’accès national](https://transport.data.gouv.fr/datasets/stations-velov-de-la-metropole-de-lyon-disponibilites-temps-reel).
- [Découverte GBFS](https://download.data.grandlyon.com/files/rdata/jcd_jcdecaux.jcdvelov/gbfs.json), version 2.3 constatée. Chemins fixes issus de cette découverte : `station_information.json`, `station_status.json`, `vehicle_types.json`, sous le même répertoire. Aucun endpoint fourni par une donnée reçue n’est suivi.
- [Norme GBFS 2.3](https://github.com/MobilityData/gbfs/blob/v2.3/gbfs.md) : jointure sur `station_id`, types sur `vehicle_type_id`, `last_reported` pour la date propre à la station ; `last_updated` date le flux. Aucune substitution entre ces dates.
- La fiche nationale indique Licence Ouverte 2.0 ; le `system_information.json` du producteur renvoie à la [Licence Ouverte 1.0, octobre 2011](https://developer.jcdecaux.com/files/Open-Licence-fr.pdf). Cette différence de version est conservée. L’interface cite les producteurs, les dates et la licence effectivement liée par le flux ; aucune affiliation revendiquée.
- Consultation HTTP 200 sans compte ni clé ; autorisation CORS observée pour l’origine GitHub Pages. Réponses datées et en-têtes consignés dans `quality/shared-bikes/source-proof.json`. La disponibilité future du service n’en est pas déduite.

## Interactions

1. Ouvrir le panneau ne consulte aucun flux Vélo’v.
2. « Charger / actualiser » demande les trois flux fixes, au maximum une fois chacun. Résultats précédents retirés pendant cette action. Annulation et fermeture invalident la requête ; une réponse tardive ne réaffiche rien.
3. Les recherches textuelles et filtres s’exécutent localement sur le catalogue reçu. Chaque page comprend au plus 25 cartes et 25 marqueurs. Numéros stables dans le catalogue trié, indépendants des filtres.
4. Un marqueur sélectionne et focalise la carte de station correspondante. Le bouton de cette carte centre la carte géographique. La liste reste disponible sans Leaflet ou fond cartographique.
5. Le trajet routier, le collectif, le profil, les préparations et le journal ne sont ni modifiés ni enregistrés. Fermeture par bouton ou Échap, retour du focus à l’accès initial.

## Disponibilités et états incomplets

Les comptes sont des entiers entre 0 et 10 000. Absent, négatif, non entier ou chaîne numérique devient inconnu, jamais zéro. Installation, location et restitution exigent de vrais booléens. Une station non installée, fermée ou de statut inconnu ne satisfait pas les filtres positifs.

Les comptes mécaniques/électriques ne sont utilisés que pour des types `bicycle` explicitement `human` ou `electric_assist`. Identifiants typés dupliqués, compte invalide ou somme différente du total connu rendent cette ventilation inconnue. L’absence d’un type ne donne pas zéro. Le total fourni reste affiché indépendamment, sans déduire les places de la capacité.

Doublons d’identifiant de station : toutes les occurrences ambiguës sont écartées de la jointure. Coordonnées non numériques, nom vide ou coordonnées hors de la fenêtre pilote (45,5–46,05 N ; 4,5–5,2 E) : entrée retirée, total d’exclusions affiché. Cette fenêtre borne l’intégration, sans constituer une frontière administrative. États absents ou orphelins explicités.

Première réponse enregistrée : 467 entrées ; trois exclues (station vide à 0/0, coordonnées à Plaisir hors pilote, nom vide). Les 464 restantes sont consultables. Ces nombres décrivent cet instantané, pas une constante du service.

## Fraîcheur

« Annonce récente » exige simultanément une date de station et une date de flux d’au plus cinq minutes, sans incohérence temporelle. C’est une règle conservatrice de l’application, affichée dans le panneau, et non une garantie du producteur. Une tolérance de 60 secondes est accordée aux écarts d’horloge. Une date absente, trop future, une station plus récente que son flux au-delà de cette tolérance ou un recul de l’horloge de consultation rend la date non vérifiable.

Les annonces anciennes restent consultables comme telles dans « Toutes les stations ». Elles sont retirées des filtres « vélos/places annoncés récemment ». Le vieillissement est réévalué localement toutes les quinze secondes et au retour sur l’onglet, sans appel réseau. Certaines stations du flux réel sont bien plus anciennes que le fichier : le rafraîchissement de celui-ci ne les rajeunit pas.

## Réseau et confidentialité

Aucune adresse, coordonnée personnelle ni texte de recherche n’est envoyé au fournisseur : seuls trois fichiers fixes du réseau entier sont demandés. Requêtes sans identifiants, cookies ou référent. Le serveur voit néanmoins une connexion et son origine/IP, comme pour toute consultation HTTP. Les tuiles OpenStreetMap suivent les règles de la carte existante ; leurs requêtes correspondent à la zone du réseau affichée.

Une consultation manuelle par minute au minimum ; cache mémoire respectant le TTL de chaque fichier (minimum 60 secondes, TTL accepté jusqu’à 24 h). `Retry-After` 429 respecté lorsqu’il est lisible via CORS, sans relance automatique ; sinon attente minimale d’une minute. Une instruction non exposée par le serveur ne peut pas être lue par le navigateur. Aucun sondage réseau périodique, cache persistant ou sauvegarde de disponibilité. Limitation propre à l’onglet, pas un quota global de tous les visiteurs.

Délai global 20 secondes ; chaque réponse bornée à 2 Mo pendant la lecture, au plus 2 000 entrées. Une version différente de 2.3 est refusée. Les textes sont échappés ; les liens sont fixes, sans liens arbitraires issus du flux. Pas de nouveau serveur, compte, achat, abonnement ou clé technique.

## Pannes

Le catalogue absent ou invalide empêche l’affichage des stations. Une panne du statut conserve le catalogue et affiche des disponibilités inconnues. Une panne des types conserve les comptes globaux mais interdit un filtre positif typé. Quota, HTTP indisponible, délai dépassé, données illisibles, format incompatible et absence de résultat sont distingués. Une erreur ne devient ni une station vide ni une route alternative.

## Validation et limites

Les réponses du fournisseur enregistrées dans `tests/fixtures/shared-bikes` restent brutes, avec provenance. Les scénarios déterministes modifient explicitement leurs dates/comptes et simulent erreurs/retards : ils ne prouvent pas des disponibilités réelles. Contrôles de modèle, navigation clavier, carte et liste, réseau, pagination, vieillissement, erreurs, fermeture, préservation du stockage et du trajet, formats ordinateur/mobile. Recette réelle séparée avant et après publication, fichiers et commit comparés.

Les résultats effectifs de chaque passe figurent dans `quality/shared-bikes`, l’état du chantier et le rapport de la PR. Aucun téléphone physique ni location sur place validé. L’accessibilité automatique ne remplace pas une revue humaine. Le périmètre ultérieur demeure le cahier des charges ; aucun paiement ou compte fournisseur implicite.
