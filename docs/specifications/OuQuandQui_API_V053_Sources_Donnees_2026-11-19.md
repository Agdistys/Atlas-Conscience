# OùQuandQui — Sources, échanges et données locales

V053 · 19 novembre 2026 · BOU-SOURCES-DONNEES-01. Complète BOU-05, UX-07, PRO-01/07/08 et OFF-02 du [cahier V5](OuQuandQui-Cahier-des-Charges-V5-2026-09-18.md). Conserve tous les compléments précédents, dont la [comparaison V052](OuQuandQui_API_V052_Comparaison_Preparations_2026-11-19.md). Aucun nouvel opérateur, service, compte ou format de données.

## Accès et parcours

Le bouton permanent « Sources et données » ouvre un panneau avec deux rubriques au clavier : « Services et échanges » et « Sur cet appareil ». Les fiches décrivent les raccordements de la page, pas un audit du réseau ni une garantie de disponibilité.

Quinze fiches couvrent hébergement, bibliothèque cartographique, tuiles, géocodage, OSRM, IGN, relais OpenRouteService, DGCCRF, relais TollGuru, Mobilités M, FOSSGIS, Vélo’v, calculs locaux, position et sorties externes. Elles présentent déclencheur, catégories transmises, compte/accessibilité du service, licence connue, périmètre, limites et références fixes.

Les filtres « Toutes les fonctions », « Au chargement et sur la carte », « Sur demande », « Calculs locaux », « Désactivées ou à vérifier » s’exécutent localement. Les volets de détail sont repliables. L’actualisation relit seulement la configuration et la présence des copies locales. Aucun appel métier, test de disponibilité, enregistrement ou suppression. Une recherche déjà lancée dans l’application peut continuer indépendamment du panneau.

La fermeture explicite ou Échap rend le focus au bouton d’accès. Flèches, Début et Fin parcourent les deux rubriques. Les textes longs et les actions se replient sur petit écran.

## Configuration et limites des affirmations

Les paramètres utilisés par l’application sont relus : bibliothèque, fond principal, géocodeur, route standard, activation IGN, routeur vélo, relais de routage et de péages. Les services collectifs et les flux Vélo’v restent fixes dans leurs adaptateurs. Le fond propre au panneau Vélo’v reste OSM et est décrit comme tel.

- « Configuré · selon l’action » décrit un raccordement connu, sans promettre de réponse.
- « Désactivé » concerne une capacité réellement désactivée par son adaptateur (IGN, vélo, relais absents).
- Une destination différente, absente pour un raccordement non protégé, ou un relais personnalisé devient « Configuration à vérifier ». Aucune licence ou absence de compte n’est transférée à cette destination. Les références restent celles du raccordement prévu.
- « Calcul local » et « Action volontaire » ne sont pas des succès de service.
- Un autre hébergement que le domaine GitHub reconnu n’est pas réputé qualifié. Aucun secret, URL configurée, paramètre, chemin personnel ou contenu de sauvegarde n’est recopié dans les fiches.

Ce panneau n’autorise ni ne bloque les appels existants. Il ne prouve pas l’absence de journaux chez les fournisseurs et ne fournit aucun score numérique de confidentialité. L’absence de compte applicatif ne signifie pas absence d’échanges. Les licences des données, des logiciels et les conditions des services restent distinctes.

## Informations effectivement décrites

Au démarrage : fichiers de l’application, bibliothèque cartographique et carte initiale. Le déplacement ou le zoom de la carte demande les tuiles de la zone affichée. L’IP, les informations de connexion et, selon la politique du navigateur/appel, le référent peuvent accompagner une consultation.

Sur action explicite : texte des lieux vers le géocodeur ; coordonnées des extrémités, arrêts, rencontres ou stations candidates vers les routeurs ; points du corridor, rayon et carburant vers DGCCRF ; coordonnées, date/heure et marche vers le moteur collectif ; identifiants de lignes/arrêts pour le suivi du réseau. Les limites de correspondances sont appliquées localement. Le vélo transmet ses deux points à FOSSGIS ; les noms, profil et limites personnelles ne sont pas ajoutés à cette requête.

Les fichiers Vélo’v sont des demandes fixes du réseau. Le filtrage textuel demeure local ; calculer une chaîne partagée transmet ses points aux moteurs IGN/FOSSGIS. Une disponibilité ou une recherche ne constitue pas une réservation.

Le relais OpenRouteService prévu reçoit coordonnées, exclusions, véhicule/gabarit et alternatives. Le relais TollGuru prévu reçoit géométrie complète, distance, véhicule, paiement, départ et identifiant de demande. Ces relais restent désactivés dans la configuration livrée. S’ils sont configurés, le panneau les signale à qualifier ; il ne leur envoie rien. L’éventuelle activation volontaire des devis tarifaires existants peut entraîner une actualisation après un changement pertinent des paramètres.

Les grilles et facteurs intégrés sont téléchargés avec les fichiers de l’application puis calculés localement ; les liens sources sont une navigation distincte. La position dépend de l’autorisation et des services de localisation du navigateur/appareil, sans suivi permanent demandé. Son adoption puis un calcul ou une carte peuvent communiquer ce point ou sa zone.

Google Maps/Waze reçoivent les points/options prévus lorsqu’un lien est ouvert. Les conditions, comptes éventuels et recalculs relèvent du destinataire. Les exports JSON/GPX sont des fichiers locaux pouvant contenir lieux, coordonnées et historique ; leur partage reste volontaire.

## Données sur cet appareil

Six familles : profil, préparations route/marche, préparations collectives, préparations vélo, préparations vélo partagé et journal. Seules les 23 clés de versions connues de l’environnement courant sont examinées. Pas de parcours de toutes les clés du navigateur ni lecture d’un autre aperçu/site public.

L’inventaire donne le nombre de copies de formats présentes, pas le nombre d’éléments ni leur contenu. Une chaîne vide ou invalide reste une copie présente : sa validité n’est pas présumée. Stockage refusé = présence inconnue, jamais zéro. Les anciens formats sont comptés sans migration. Un événement de stockage du même environnement peut actualiser cette présence, sans remplacer les données chargées par les autres écrans.

Trois accès ouvrent les fonctions existantes du profil, des trajets et du journal. Ils n’effacent, n’importent, n’exportent ou n’enregistrent rien implicitement ; un calcul en cours conserve les verrous existants. Les sauvegardes, confirmations et exports restent ceux de chaque rubrique.

Le panneau distingue sauvegardes persistées, recherches en mémoire et cache statique de l’interface. Il reprend l’état PWA réel de la page, sans promettre l’installation ni le redémarrage hors ligne d’un aperçu. Le cache ordinaire du navigateur demeure distinct. Le diagnostic existant peut montrer des URL contenant lieux/coordonnées : vérifier avant copie ou capture. Aucun chiffrement ou synchronisation n’est annoncé.

## Références vérifiées

Références officielles consultées le 19 novembre 2026, en complément des qualifications V001–V052 :

- [GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages) : hébergement statique et conservation de l’IP de visite à des fins de sécurité.
- [OpenStreetMap](https://www.openstreetmap.org/copyright) et [service de tuiles](https://operations.osmfoundation.org/policies/tiles/) : données ODbL, attribution et conditions du service, sans disponibilité garantie.
- [Leaflet](https://leafletjs.com/) et [jsDelivr](https://www.jsdelivr.com/terms/privacy-policy) : bibliothèque et distributeur distincts ; document jsDelivr relu dans le navigateur.
- [Géocodage IGN](https://cartes.gouv.fr/aide/fr/guides-utilisateur/utiliser-les-services-de-la-geoplateforme/geocodage/) et [itinéraires IGN](https://cartes.gouv.fr/aide/fr/guides-utilisateur/utiliser-les-services-de-la-geoplateforme/calcul-itineraire/) : sources BAN/BD TOPO, coordonnées, profils et options. Licence BD TOPO issue de la qualification conservée V001.
- [OSRM](https://project-osrm.org/) et [FOSSGIS](https://routing.openstreetmap.de/about.html) : moteur, données OSM, journal des demandes et règles d’usage. Le cadre d’essai modéré non commercial V033 demeure distinct d’une publication payante.
- [DGCCRF](https://data.economie.gouv.fr/explore/dataset/prix-des-carburants-en-france-flux-instantane-v2/information/) : métadonnées de l’API enregistrées dans la preuve locale, producteur DGCCRF et Licence Ouverte 2.0.
- [Mobilités M](https://data.mobilites-m.fr/mentions-legales) : mentions rendues dans le navigateur, ODbL confirmée ; conservation et qualification du pilote V026/V028 préservées.
- [Vélo’v](https://transport.data.gouv.fr/datasets/stations-velov-de-la-metropole-de-lyon-disponibilites-temps-reel) : producteurs et fichiers ; écart Licence Ouverte 2.0 / lien 1.0 du flux conservé selon V032, sans le résoudre arbitrairement.
- Sources et périodes des grilles, inventaire des gares et facteurs d’empreinte conservées dans leurs modules ; aucun nouveau tarif, facteur ou droit de redistribution inféré.

## Vérifications

Contrôles du modèle : configuration connue/personnalisée/absente, vrais états désactivés, absence de secrets et de liens dérivés de paramètres, catégories transmises, filtres, clés exactes, anciens formats, contenu invalide, stockage inaccessible et absence de mutation.

Parcours navigateur sur quatre formats : absence de requête/écriture à la consultation, configuration simulée, séparation des aperçus, relecture, conflit externe, raccourcis sans sauvegarde implicite, verrou pendant calcul, clavier et affichage. Recette séparée sur la page réelle, comparaison des fichiers/métadonnées du commit publié et capture des échanges déclenchés. Les valeurs de test et simulations sont distinguées des consultations réelles ; aucune qualification de téléphone physique ou audit exhaustif des fournisseurs.

