# OùQuandQui — Sauvegarde et reprise des préparations de trajet

V012 · 18 novembre 2026 · TRAJETS-SAUVEGARDES-01. Complément de PAR-05, PRO-03, OFF-02 et OFF-03 du [cahier des charges V5](OuQuandQui-Cahier-des-Charges-V5-2026-09-18.md). Les éditions précédentes restent conservées.

## Parcours disponible

Après le calcul d’un itinéraire, « Enregistrer cette préparation » ouvre une saisie de nom et une confirmation explicite. La préparation conserve les deux lieux choisis, le véhicule et son gabarit éventuel, le carburant, la consommation, les litres à acheter, les évitements, le départ prévu, les préférences de recherche des stations, les filtres et l’arrêt éventuellement confirmé. Elle conserve aussi le tracé calculé, sa distance, sa durée, son moteur et sa date. Une position GPS devient un point fixe nommé « Position de départ enregistrée », jamais une demande implicite de géolocalisation au prochain usage.

« Mes trajets » permet de consulter, renommer, supprimer, exporter ou restaurer ces préparations. Un schéma du tracé enregistré est consultable sans fond cartographique. La date de sauvegarde et celle du calcul restent distinctes ; un renommage ne les actualise pas. Un nom ou des paramètres déjà présents déclenchent une confirmation supplémentaire, sans remplacement automatique.

« Préparer à nouveau ce trajet » remplit les paramètres et efface les résultats courants après confirmation si un trajet est déjà affiché. Les coordonnées mémorisées sont reprises sans nouveau géocodage ; leur provenance reste indiquée. Le calcul n’est lancé qu’en activant « Trouver mon trajet ». Les prix, péages, horaires, disponibilité des stations et informations de circulation ne sont pas conservés dans une préparation. Le budget précédent est effacé.

Une ancienne heure de départ passée ou absente laisse le champ vide et demande une nouvelle saisie ; elle n’est pas déplacée automatiquement à l’heure courante. Une autonomie mémorisée reste indiquée comme étant à actualiser. Le profil actif n’est pas modifié par la reprise. Les points repris restent attachés à leurs champs jusqu’à modification explicite du lieu.

Après le nouveau calcul et la nouvelle recherche des stations, l’arrêt mémorisé est recherché par son identifiant parmi les stations effectivement comparées. S’il est retrouvé, sa fiche actuelle peut être consultée puis l’arrêt choisi à nouveau. S’il est absent, le message indique les limites de cette recherche et n’en déduit pas une fermeture. Aucun arrêt n’est ajouté automatiquement. Les filtres et le plafond de comparaison existants restent applicables.

## Contraintes et intégrité

- Une préparation de poids lourd reste une préparation de poids lourd, même si le routage correspondant n’est plus disponible. Aucun remplacement automatique par une voiture.
- Les exclusions mémorisées non disponibles restent visibles. Une action explicite, avec confirmation, permet de les retirer du nouveau calcul ; la préparation enregistrée reste intacte.
- Les valeurs numériques, lieux, dates, options et gabarits sont contrôlés. Les heures de départ ambiguës ou inexistantes lors du changement d’heure sont refusées, selon le contrat temporel V011.
- Une préparation n’est pas un déplacement effectué. La sauvegarde n’active pas le journal, n’ajoute aucun déplacement et ne modifie ni le profil ni les adresses favorites.
- Consultation et restauration ne déclenchent pas de nouvelle recherche externe. Le nouveau calcul utilise les lieux enregistrés uniquement après l’action de calcul. Une préparation importée reste déclarative : la validité du format ne prouve ni la réalité du tracé ni son adéquation au véhicule.

## Stockage et récupération

Le format JSON porte le marqueur `kind: dragonroute-preparations` et la version `1`. Le stockage local possède une clé distincte du profil et du journal, isolée par chemin de l’application : site public et chaque aperçu ne partagent pas leurs préparations. Aucun compte, synchronisation ou serveur supplémentaire n’est utilisé.

Limites : 20 préparations, 25 000 points par tracé et 2 Mo pour le fichier JSON exporté avec sa mise en forme. Aucun tronquage ni simplification silencieuse du tracé. Les champs étrangers au format sont exclus ; aucune clé de service ou configuration technique n’est exportée. Les fichiers peuvent contenir des lieux personnels et sont en clair.

L’import présente le nom du fichier, le nombre de préparations, les données qui seront remplacées et le détail des paramètres. Une sauvegarde préalable est proposée. Le remplacement complet exige une confirmation ; il n’existe pas de fusion automatique. Un fichier vide est signalé comme tel. Annulation, fermeture ou lecture tardive après fermeture préservent les données en place. Les identifiants dupliqués, formats inconnus, fichiers trop volumineux et contenus invalides sont refusés.

Une erreur de quota ou une modification dans un autre onglet bloque l’écriture et conserve la saisie. Un stockage local illisible ou d’une version inconnue reste protégé : aucun écrasement implicite par une liste vide. L’effacement volontaire ne retire que les préparations de l’environnement courant ; profil, journal et autres aperçus restent conservés.

## Hors connexion et limites

Une application déjà chargée permet de consulter ses préparations et leur schéma local sans réseau. Le fonctionnement après redémarrage dépend de la disponibilité préalable de l’application dans son cache. Aucun téléchargement massif de tuiles, carte régionale hors ligne, calcul d’itinéraire local ou guidage GPS continu n’est ajouté. Une tentative de nouveau calcul sans réseau échoue explicitement, sans afficher l’ancien instantané comme un trajet actuel. Le même navigateur et le même environnement sont nécessaires ; effacer ses données peut supprimer les préparations. L’export permet d’en garder une copie indépendante.

## Vérifications et suite

Cinq contrôles du modèle couvrent le format, la conservation des paramètres, les limites, les dates et changements d’heure, les valeurs invalides et les doublons. Neuf scénarios navigateur sont exécutés sur quatre formats : sauvegarde complète avec arrêt, rechargement, reprise sans géocodage, départ passé, autonomie ancienne, absence de station, consultation sans réseau, export/import, annulation et lecture tardive, quota, concurrence, isolation, renommage, effacement, position GPS fixe et contraintes devenues indisponibles. Les parcours comprennent des contrôles d’accessibilité automatique, qui ne remplacent pas une revue humaine ou un essai sur téléphone physique.

Les résultats effectifs de la suite complète, le commit publié et la recette avec des lieux publics et des services réels figurent dans le rapport d’inspection et l’état de développement. Suite proposée : préparation d’un covoiturage et partage explicite des frais estimés, en distinguant calcul local, mise en relation, réservation et paiement.
