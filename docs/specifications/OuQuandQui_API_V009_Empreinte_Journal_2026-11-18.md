# OùQuandQui — Empreinte sourcée du journal

V009 · 18 novembre 2026 · EMP-FACTEURS-01. Complément aux exigences EMP-01 à EMP-06 et JOU-04/JOU-05 du [cahier des charges V5](OuQuandQui-Cahier-des-Charges-V5-2026-09-18.md). Le parcours de confirmation reste décrit dans [V008](OuQuandQui_API_V008_Journal_Mobilite_2026-11-18.md) ; les états carbone et le stockage décrits ci-dessous remplacent son état historique « non estimé pour tous les modes ». V001–V008 conservés.

## Utilisation

Dans le formulaire du journal, « Calculer ou actualiser l’empreinte de ce trajet » est facultatif et décoché à chaque ouverture. Aucun trajet ancien n’est estimé automatiquement. La personne choisit explicitement le véhicule ou transport correspondant au déplacement et confirme l’enregistrement. Le profil carburant ne choisit pas automatiquement un facteur.

31 modèles disponibles : vingt combinaisons de taille et motorisation de voiture, TGV, Intercités, TER, RER/Transilien, métro, tramway, autocar thermique, bus thermique ou électrique, vélo mécanique ou électrique. « Train » ou « Bus / car » ne suffisent pas : le modèle précis est obligatoire. Les catégories servent à une estimation moyenne, pas à reproduire une mesure individuelle du véhicule.

Voiture : occupants de 1 à 9, conducteur compris, partage égal. Les modèles essence couvrent E5/E10, diesel B7/B10 ; aucun facteur E85/GPL, poids lourd, caravane ou utilitaire n’est substitué. Marche et autre restent non estimés. Un mode non pris en charge désactive le calcul. La distance inconnue bloque une estimation demandée, mais permet toujours d’enregistrer le trajet sans estimation. Une distance explicitement nulle avec un facteur compatible produit zéro ; ce comportement n’assimile pas un mode entier à zéro émission.

## Source, version et réutilisation

Les valeurs proviennent du fichier de données public du projet ADEME / Impact CO₂, branche de production `main`, figée au commit `bece7af7e3daa41c7f2233e03d169c33e82530c2` (13 novembre 2026), consulté le 18 novembre 2026. Le fichier original, le contrat API, le sous-ensemble extrait, l’empreinte SHA-256 et la licence MIT Datagir sont conservés dans [data/carbon](../../data/carbon/). Le même sous-ensemble est intégré à l’application ; un contrôle vérifie sa concordance exacte avec les sources archivées. Aucun appel à l’API Impact CO₂ n’est nécessaire pour utiliser le journal.

- [Données originales figées](https://github.com/incubateur-ademe/impactco2/blob/bece7af7e3daa41c7f2233e03d169c33e82530c2/src/data/categories/deplacement.ts).
- [Contrat de calcul et occupation](https://github.com/incubateur-ademe/impactco2/blob/bece7af7e3daa41c7f2233e03d169c33e82530c2/app/api/v1/transport/route.ts).
- [Licence du dépôt figé](https://github.com/incubateur-ademe/impactco2/blob/bece7af7e3daa41c7f2233e03d169c33e82530c2/license), reproduite dans les sources et le code distribué.
- [Mentions légales Impact CO₂](https://impactco2.fr/mentions-legales), dont la clause de propriété intellectuelle renvoie aux mentions contraires du dépôt GitHub. La réutilisation porte sur ses données publiées sous cette licence ; elle n’attribue pas une licence générale à tout le catalogue Base Empreinte ni aux ressources tierces qu’il peut contenir.

Identifiant du jeu : `impactco2-2026-11-18-bece7af`. Le 18 novembre est une date d’extraction, pas l’année de mesure de chaque donnée. Les pages sources sont liées pour chaque modèle ; les valeurs historiques restent celles du jeu figé même si ces pages évoluent. Aucun logo, validation ou approbation ADEME de l’application n’est revendiqué.

## Calcul et périmètres

Les postes construction (`ecv.id=5`) et énergie (`ecv.id=6`, nommé « Carburant » dans la source) sont additionnés sans arrondir les valeurs intermédiaires. La construction est incluse explicitement, contrairement au défaut de l’API. La voiture utilise les modèles de base, sans variante de covoiturage déjà divisée. Le contrat API applique l’occupation au facteur de base, avec une personne par défaut : le modèle local reproduit cette convention. Deux requêtes publiques de qualification, sans données personnelles, ont confirmé 0,14225341222954335 kg pour 1 km en voiture moyenne diesel avec une personne, puis 0,07112670611477168 kg avec deux occupants. La preuve datée est conservée avec les données ; ces requêtes ne deviennent pas une dépendance de l’application.

| Cas | Calcul de la part individuelle |
| --- | --- |
| Voiture | distance en mètres / 1 000 × (construction + énergie) / occupants |
| Train, transport collectif, vélo | distance en mètres / 1 000 × facteur déjà exprimé par personne |
| Facteur incompatible ou distance inconnue | aucune estimation, valeur `null` |

Le détail affiche la part individuelle, le total véhicule séparé quand applicable, les occupants, le facteur, les postes, les unités, la date et la version. Le total véhicule n’est jamais ajouté à la part individuelle dans le bilan. Pour les transports collectifs, la moyenne de fréquentation est déjà portée par le facteur ; aucun second partage par le nombre de voyageurs accompagnants. Les estimations ne tiennent pas compte de la météo, du chargement, de la consommation réelle ni de toutes les caractéristiques physiques du véhicule.

Le vélo mécanique est présenté dans un périmètre distinct « construction seule ». Les autres modèles sont groupés « construction et énergie modélisées ». Ces périmètres ne sont pas additionnés en une unique empreinte complète. L’alimentation humaine n’est pas calculée pour le vélo. Les infrastructures et tous les impacts non explicitement fournis ne sont pas ajoutés ni supposés inclus : il s’agit du périmètre publié par le modèle, pas d’une ACV exhaustive de chaque trajet.

Le mois présente la somme des parts individuelles par périmètre, le nombre d’entrées estimées et celui des entrées sans estimation, également par mode. Les résultats demeurent qualifiés de partiels. Un résultat positif inférieur à 0,001 kg est affiché « < 0,001 kg » plutôt qu’un zéro arrondi ; l’export conserve la valeur complète.

## Historique et données

Schéma 2, clé `dragonroute.journal.v2.` avec espace public/aperçu inchangé. Sans version 2, la version 1 est validée et reprise en mémoire, sans écriture ni calcul automatique. La première modification volontaire écrit la version 2 ; la clé originale reste conservée et exportable séparément. Une version inconnue ou un calcul incohérent bloque le remplacement. Le contrôle de concurrence porte sur les deux clés ; un ancien onglet ne peut pas être écrasé silencieusement.

Chaque estimation garde le facteur complet, le jeu de données, date/lieux/mode/distance utilisés, occupants, valeur véhicule éventuelle, part individuelle et date de calcul. Les nouvelles estimations sont recalculées à partir de ces paramètres lors de la validation, afin de détecter les valeurs incohérentes. Les mises à jour futures des facteurs devront conserver les anciens jeux reconnus : modifier les constantes d’une version existante est interdit.

Une actualisation explicitement demandée archive la précédente estimation avec sa date et sa raison. Corriger la date, les lieux, le mode ou la distance sans demander une nouvelle estimation archive l’ancienne et retire sa valeur du bilan. Une simple correction de note conserve l’estimation. Les archives restent consultables et exportées, mais sont exclues du bilan courant. Pas de réécriture silencieuse lors d’un chargement ou d’un changement de facteur dans une future application.

Limite de cinquante estimations antérieures par entrée ; au-delà, l’écriture est refusée avec une explication, sans suppression historique. Les limites antérieures de 1 000 trajets / 2 Mo exportés demeurent. L’effacement confirmé vise les deux versions du journal de cet environnement et conserve le profil. Les informations de mobilité ne sont envoyées à aucun fournisseur pour ce calcul.

## Vérification et suites

Six contrôles de modèle couvrent extraction/provenance, unités et occupants, transport collectif/vélo, incompatibilités et altérations, révisions et bilan partiel/migration. Six scénarios navigateur couvrent le parcours réel, la révision, les modes/manquants, la migration, quota/concurrence et absence d’envoi. La suite antérieure du journal reste exécutée. Le rapport d’inspection lié à l’aperçu contient les résultats réellement exécutés.

Les entrées des tests sont fictives. Le calcul est une estimation de modèle, pas la preuve d’un déplacement physique ni une mesure d’émissions. Import/restauration du journal, comparaison prospective des alternatives, vérification de facteurs complémentaires et historique général des modifications restent des axes distincts. Aucun abonnement, compte ou clé visiteur ajouté.
