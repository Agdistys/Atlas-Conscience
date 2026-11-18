# OùQuandQui — Itinéraires à pied

V014 · 18 novembre 2026 · DOU-MARCHE-01. Complément de DOU-01, DOU-02, PAR-05 et OFF-02 du [cahier des charges V5](OuQuandQui-Cahier-des-Charges-V5-2026-09-18.md). Les [préparations V012](OuQuandQui_API_V012_Preparations_Trajets_2026-11-18.md), le [covoiturage V013](OuQuandQui_API_V013_Covoiturage_2026-11-18.md) et les éditions antérieures restent conservés.

## Parcours

Le choix « Mode de déplacement » propose « En véhicule » ou « À pied ». Changer de mode retire les résultats et exige un nouveau calcul explicite. Les lieux restent disponibles ; véhicule, consommation, évitements et préférences des stations restent séparés de la marche. Le mode à pied masque budget automobile, péages, stations et covoiturage. Aucune consommation, contribution financière ou absence de péage n’est calculée à partir d’une marche.

Le calcul à pied fournit sa propre géométrie et sa durée estimée. Aucun trajet automobile n’est converti en marche par un changement de vitesse. Un seul itinéraire est demandé dans cette version ; aucune variante supplémentaire n’est inventée. Le bouton de calcul est indisponible lorsque le service IGN est désactivé.

La limite personnelle est facultative, entre 0,1 et 500 km, et peut être effacée. Vide signifie inconnue ; zéro ou une valeur hors bornes est refusé avant transmission des lieux. Le dépassement est comparé à la distance exacte reçue, avant arrondi d’affichage. Le trajet reste visible avec l’indication « Limite souhaitée dépassée ». Il s’agit d’un repère personnel, pas d’une exclusion du moteur ni d’une garantie d’effort acceptable. Modifier ce repère actualise le message localement, sans nouvel appel. Pente, escaliers, revêtement, fermetures, accessibilité et adéquation aux capacités de la personne ne sont pas qualifiés. Durée du moteur, hors pauses ; aucune vitesse personnalisée ni arrivée garantie.

## Service et qualification datée

Le service public IGN déjà utilisé par l’application publie le profil `pedestrian` pour `bdtopo-osrm`. La documentation et les capacités ont été consultées le 18 novembre 2026. Quatre requêtes sur deux couples de coordonnées publiques ont reçu HTTP 200 et un accès CORS autorisé. Aucun compte, clé, serveur supplémentaire ou appel payant.

| Exemple public | Profil piéton | Profil voiture | Observation |
|---|---|---|---|
| Paris, coordonnées d’exemple de la documentation IGN | 2 510,5 m ; 2 510 s ; 72 points | 2 568,5 m ; 581,1 s ; 76 points | Géométries et durées distinctes. |
| Lyon, secteur Bellecour → Fourvière | 1 528,6 m ; 1 465,4 s ; 117 points | 2 338,2 m ; 600,8 s ; 119 points | Géométries et durées distinctes. |

La ressource retournée est `bdtopo-osrm`, version `2026-11-17`. Les requêtes exactes, réponses et capacités figurent dans [data/walking](../../data/walking/qualification.json). Ces deux cas qualifient le raccordement observé, pas une couverture exhaustive, un passage réel, une conformité de terrain ni l’accessibilité d’une montée lyonnaise.

## Contrat de calcul

- Endpoint fixe `https://data.geopf.fr/navigation/itineraire`, ressource `bdtopo-osrm`, profil `pedestrian`, optimisation `fastest`, format GeoJSON en `EPSG:4326`, mètres et secondes.
- Coordonnées de départ et d’arrivée seulement. Aucun gabarit, prix, profil, favori, limite personnelle, préférence automobile ou arrêt carburant transmis. Aucun appel pendant la frappe.
- Réponse acceptée uniquement si ressource, profil, optimisation, projection et unités concordent ; version de ressource non vide ; contraintes renvoyées vides. Géométrie et métriques finies, portions cohérentes avec le total.
- Pour la marche, extrémités des portions et du tracé à 150 m au plus des lieux demandés. C’est une borne de rejet des rattachements lointains, pas une validation d’entrée, de traversée ni de passage accessible.
- Limites existantes conservées : requêtes séquentielles espacées d’au moins 550 ms par page, délai 25 s, cache mémoire de 32 réponses pendant cinq minutes. Le profil fait partie de la clé du cache ; aucune réponse voiture réutilisée pour la marche.
- Erreurs réseau, HTTP 429, indisponibilité, géométrie absente, mauvais profil ou rattachement lointain : échec visible, aucun résultat ancien présenté comme actuel, aucune répétition automatique ni substitution automobile. Relance volontaire possible.
- Attribution IGN / BD TOPO / Licence Ouverte 2.0 et version de données rendues visibles. La limite annoncée de 5 requêtes/s/IP est partagée avec les autres usages de la connexion.

## Navigation, export et journal

Google Maps reçoit volontairement les deux points et `travelmode=walking`, sans clé ni appel avant ouverture du lien. Son itinéraire est recalculé : tracé IGN, limite personnelle et accessibilité ne sont pas transmis. Waze est masqué pour la marche. Aucun lien voiture n’est proposé à sa place.

Le GPX conserve la géométrie piétonne réellement affichée et le mode dans sa description et sa source, sans altitude ou temps de passage inventé. Ce fichier contient les lieux et reste sous le contrôle de la personne. Il ne constitue ni un relevé GPS, ni un guidage continu, ni un téléchargement de carte hors ligne. Aucune application native n’est validée par les contrôles navigateur.

« J’ai effectué ce trajet » reste une action distincte, dans le journal volontaire. La reprise conserve `mode: walk` et la distance du calcul IGN ; le formulaire doit être confirmé. Aucun enregistrement automatique au calcul ou à la sauvegarde. L’empreinte reste inconnue : aucun facteur voiture substitué, aucune émission nulle inventée.

## Préparations locales : format 2

Les préparations voiture et poids lourd conservent leurs champs. Une préparation à pied contient `vehicle: {type: 'walk'}`, `preferences: {maxWalkKm: nombre ou null}`, les lieux et l’instantané daté du tracé, calculé avec `engine: ign`, sans arrêt carburant. Une préparation à pied avec moteur automobile, arrêt station, évitements automobiles ou limite invalide est refusée. Les champs étrangers au format sont exclus.

Le format `kind: dragonroute-preparations`, version `2`, est écrit sous une nouvelle clé locale `dragonroute.prepared.v2.<environnement>`. La version 1 est lisible/importable comme préparation automobile. Si seule l’ancienne clé existe, elle est lue sans écriture ; le prochain enregistrement volontaire crée la version 2 et conserve exactement l’ancienne valeur. Un bouton permet d’exporter cet original. Le changement de l’une des deux valeurs dans un autre onglet bloque l’écriture. Une ancienne application peut encore consulter sa copie ; les deux éditions ne se synchronisent pas. L’effacement volontaire mentionne et retire les deux sauvegardes du seul environnement courant.

Les limites V012 restent : 20 préparations, 25 000 points par tracé, export de 2 Mo au plus, examen et confirmation avant remplacement à l’import, quota et données inconnues protégés. Profil et journal restent indépendants. Export en clair pouvant contenir des lieux personnels.

Consulter une marche mémorisée ne déclenche aucun appel. Reprendre charge le mode à pied et la limite, sans écraser les préférences automobiles ; un nouveau calcul explicite reste nécessaire. Une application déjà chargée permet de consulter son instantané sans réseau. Le redémarrage dépend du cache préalable ; aucun routage hors ligne ou ancienne géométrie présentée comme fraîche après un échec.

## Vérifications et périmètre restant

Contrôles du modèle : bornes et inconnus, comparaison exacte de distance, format piéton, absence d’options automobiles, compatibilité des anciens formats. Scénarios navigateur : cache séparé, transitions des modes, limite invalidée avant transmission, service désactivé, réponses incohérentes, absence de repli, export GPX et lien piéton, sauvegarde/reprise, consultation sans réseau, conservation de l’original et conflit d’onglet, journal volontaire. Les résultats effectifs, versions publiées, contrôles d’accessibilité et essais réels sont consignés dans le rapport du commit et l’état de développement.

Ce lot traite la marche seule. Vélo et VAE, vélo partagé, transports publics et correspondances, pente et accessibilité restent à développer avec leurs sources propres. Aucun téléphone physique ni déplacement réel ne sont attestés par les essais automatisés.

## Sources

- [IGN : calcul d’itinéraire](https://cartes.gouv.fr/aide/fr/guides-utilisateur/utiliser-les-services-de-la-geoplateforme/calcul-itineraire/), [capacités](https://data.geopf.fr/navigation/getCapabilities), consultés le 18 novembre 2026.
- [IGN : conditions d’utilisation](https://cartes.gouv.fr/cgu/?lang=fr), cadre conservé du raccordement V001.
- [Google Maps : modes des URLs de trajet](https://developers.google.com/maps/documentation/urls/get-started), mode `walking`, consulté le 18 novembre 2026.
