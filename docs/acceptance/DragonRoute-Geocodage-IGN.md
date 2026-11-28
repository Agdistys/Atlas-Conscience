# DragonRoute — recherche d’adresses IGN

17 novembre 2026. Complément à la recette du [trajet sans autoroute](DragonRoute-IGN.md) et au [référentiel API V002](../specifications/OuQuandQui_API_V002_Adresses_2026-11-17.md).

## Changement attendu

Une recherche de « Valence » doit permettre de distinguer les communes homonymes par leur code postal et leur département. « Lyon gorge de loup » doit aussi retrouver des lieux nommés : la recherche porte sur les adresses BAN et les points d’intérêt BD TOPO. Aucun compte ou clé n’est demandé au visiteur.

Le choix retenu doit déterminer les coordonnées envoyées au moteur de trajet. Les adresses déjà enregistrées, le profil et les favoris restent utilisables. Cette modification ne rend disponibles ni les tarifs de péages ni un routage adapté aux caravanes.

## Recette automatisée

Trois nouveaux scénarios navigateur rejoignent les scénarios obligatoires d’Inspectrice :

- communes homonymes, lieux nommés, codes postaux, suppression des doublons stricts et transmission exacte des coordonnées sélectionnées ; absence de requête pendant la frappe, accessibilité et débordement horizontal ;
- réponses vides, enveloppes invalides, coordonnées absentes, booléennes, textuelles ou hors limites, géométrie incorrecte, type de source inattendu et absence de nom ; refus sans ancien trajet ni fournisseur de secours, puis récupération après HTTP 503 ;
- HTTP 429 avec délai exposé par CORS, aucune relance automatique, nouvel appui pendant le délai sans requête, reprise manuelle et expiration du cache après cinq minutes.

Les anciens tests de géocodage sont migrés vers le contrat GeoJSON réellement utilisé : annulation au clavier, choix consécutifs départ/arrivée, libellé hostile rendu comme texte, erreurs et reprise, appuis concurrents. Les autres scénarios utilisent désormais le même géocodeur simulé. Aucun test de routage n’est contourné pour cette migration.

Le cache PWA passe au shell 12 et conserve les caches d’autres applications. Syntaxe, identifiants HTML, ancres, contrôle du rapport et assemblage de l’aperçu sont vérifiés séparément.

La suite attendue comprend 39 scénarios sur quatre formats, soit 156 exécutions navigateur. Le résultat complet doit être lu dans le rapport attaché au commit testé ; un passage local sur ordinateur ne vaut pas passage sur les quatre formats.

## Sources et observations directes

Les documents officiels IGN et BAN, les capacités du service et les réponses réelles ont été consultés le 17 novembre 2026. Les appels directs ont confirmé :

- l’accès sans clé et l’en-tête CORS autorisant l’appel navigateur ;
- le format GeoJSON, avec noms et codes postaux parfois sous forme de listes pour les lieux BD TOPO ;
- plusieurs communes nommées Valence, dont 26000 dans la Drôme et 82400 dans le Tarn-et-Garonne ;
- la gare et le quartier Gorge de Loup, ainsi que l’adresse publique de test « 10 rue de la Paix 75002 Paris ».

Il s’agit d’observations datées, pas d’un inventaire exhaustif de la couverture. Le géocodage d’une commune désigne un point représentatif ; il ne remplace pas une adresse précise ni une validation de l’accès routier d’un lieu.

## Essai navigateur avec services réels

Chrome local, 17 novembre 2026 : recherche et confirmation de « Gare de Lyon-Gorge-de-Loup » puis « Valence · 26000 · Département 26 · commune ». Aucun remplacement des réponses réseau dans cet essai. Les deux recherches IGN répondent HTTP 200 ; le moteur IGN renvoie un trajet sans autoroute de 125 982,8 m et 8 884,4 s, affiché 126,0 km et 148 min, avec l’exclusion demandée dans sa réponse. Fond Leaflet réel, vues 1440 px et 390 px sans débordement horizontal ni erreur JavaScript. Aucun appel vers Nominatim ou l’ancienne API Adresse.

Les preuves locales sont conservées dans le dossier technique ignoré par Git `quality/live-geocoding/`. Les 39 scénarios ordinateur ont été vérifiés en trois groupes ; après l’ajout du département pour les lieux nommés, les scénarios concernés sont rejoués sur ordinateur et mobile. Le rapport CI de l’aperçu reste la référence pour les quatre formats. Aucun trajet physique, téléphone réel ni estimation de péages ne fait partie de cet essai.
