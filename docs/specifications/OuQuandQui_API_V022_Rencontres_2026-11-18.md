# OùQuandQui — Rencontres, détour et portion partagée

V022 · 18 novembre 2026 · COV-RENCONTRES-01. Complète COV-04/05 et TRA-05/09/10 du [cahier V5](OuQuandQui-Cahier-des-Charges-V5-2026-09-18.md), le [partage V013](OuQuandQui_API_V013_Covoiturage_2026-11-18.md) et les [critères V021](OuQuandQui_API_V021_Criteres_Routiers_2026-11-18.md). Éditions antérieures conservées.

## Parcours et périmètre

Après le trajet initial, Covoiturage → Je conduis permet de préparer une prise en charge et une dépose pour un même groupe. Les lieux sont résolus par le géocodage IGN existant ; les homonymes demandent un choix. Il ne s’agit ni d’une offre, ni d’une rencontre confirmée, ni d’une réservation. L’accessibilité réelle des lieux et les conditions d’arrêt restent à convenir.

L’ordre est départ → prise en charge → dépose → arrivée. La personne indique deux limites obligatoires : kilomètres supplémentaires et minutes supplémentaires, comparés au trajet initial. Valeurs proposées : 30 km et 45 min ; bornes de saisie 0–1 000 km et 0–1 440 min. Zéro signifie aucun dépassement, jamais absence de limite. Une station éventuelle est explicitement placée avant, pendant ou après la portion partagée.

Le calcul conserve le moteur, le véhicule, les exclusions et le critère déjà appliqués. Une proposition présente les lieux résolus, le total, la portion commune et les écarts signés. Un recalcul plus court ou plus rapide garde son écart négatif ; il n’est pas présenté comme un détour nul. Dépasser une limite interdit l’adoption. Une erreur ou annulation garde le trajet courant, sans remplacement par un autre moteur ou suppression des contraintes.

L’adoption exige une confirmation : elle remplace le tracé et retire les anciennes stations, l’arrêt carburant et les péages associés. Le prix de référence saisi manuellement reste disponible ; un prix provenant d’une ancienne station est retiré. La route initiale et ses variantes restent en mémoire pour le retrait des rencontres. Modifier un champ de rencontre rétablit cette référence et invalide les résultats dépendants ; le nouveau brouillon exige un calcul et une adoption. Retirer les rencontres restaure la référence sans requête. Changer les lieux du trajet ou passer à la marche retire le brouillon devenu incompatible.

## Carte, carburant et navigation

Des marqueurs P et D repèrent la prise en charge et la dépose sur la carte et le schéma de secours. Les mêmes lieux et l’ordre des étapes figurent dans une liste textuelle. La recherche de stations suit le nouveau tracé. Chaque candidate est calculée via les étapes ordonnées, y compris sous OSRM : la matrice directe à trois points n’est plus utilisée pour un trajet avec rencontres.

L’accès à une station est la somme des étapes depuis le départ jusqu’à cette station. La portion commune est la somme des étapes entre prise en charge et dépose ; elle inclut le détour carburant uniquement si le plein a été placé entre ces points. Les limites cumulées des rencontres s’appliquent aussi au trajet avec station. Les filtres habituels de stations restent distincts et s’appliquent au détour ajouté à la route avec rencontres. Les recherches demeurent limitées aux candidates reçues et comparées ; aucune exhaustivité annoncée.

Les étapes et leurs métriques sont contrôlées avant adoption : nombre attendu, valeurs finies non négatives et cohérence des sommes. OSRM doit confirmer les points d’accès dans le même ordre, à moins de 500 m des coordonnées demandées ; cela ne certifie pas une entrée praticable ou un arrêt autorisé. IGN conserve ses contrôles de portions et de contraintes. Aucune distance commune n’est déduite d’une simple projection sur la carte.

Google Maps reçoit jusqu’à trois étapes intermédiaires ordonnées, rencontres et station comprises. Certains environnements peuvent ignorer des étapes ; le parcours externe est à vérifier. Waze reçoit des liens séparés vers chaque destination, sans enchaînement automatique. Le GPX contient le tracé actif et les points d’étape ordonnés avec leurs libellés. Cet export explicite contient donc les lieux de rencontre, contrairement au texte de covoiturage destiné à être relu avant copie. Les applications externes recalculent et ne reçoivent pas le critère rapide/court.

## Frais de la portion commune

Sans rencontres adoptées, le contrat V013 continue de supposer tous les passagers présents sur l’ensemble du trajet. Avec rencontres, le carburant total du conducteur et celui de la portion commune sont affichés séparément, avec consommation et prix de référence du budget. Même groupe de passagers sur toute la portion commune ; plusieurs prises en charge ou déposes de groupes distincts hors périmètre.

Pour `n` passagers : carburant commun converti en centimes, proposition par passager = partie entière de `centimes_communs / (n + 1)`. Le conducteur conserve le carburant hors portion commune et le reliquat. Le reste sur frais connus est le montant connu du trajet complet moins la somme proposée aux passagers. Une composante inconnue reste inconnue ; aucune contribution carburant n’est calculée sans prix/consommation exploitables.

Les tarifs du budget ne localisent pas les péages à l’intérieur de la portion commune. Un montant positif, partiel ou inconnu ne peut donc être réparti : les péages connus restent provisoirement dans le reste conducteur, et la contribution totale est annoncée non calculable. Seule une absence de péage confirmée sur tout le trajet permet de considérer les péages de la portion commune comme nuls. Aucun prorata kilométrique automatique. Il s’agit d’une convention de simulation à convenir, pas d’un prix d’offre ni d’une règle réglementaire nouvelle.

Le récapitulatif ne recopie ni les adresses ni les coordonnées des rencontres. Ses secteurs publics restent saisis séparément ; il mentionne le kilométrage partagé, les hypothèses et les frais manquants. Modifier le trajet, les rencontres, l’arrêt, les effectifs ou le budget invalide le texte et sa confirmation. Un brouillon de rencontres non adopté doit être adopté ou effacé avant de préparer le texte ou sauvegarder le trajet.

La comparaison voiture/marche reste une comparaison directe, sans rencontres ni plein, annoncée comme telle. Choisir un résultat confirme le retrait des rencontres. La simulation carbone conserve son hypothèse d’occupation constante ; elle indique explicitement que les changements de passagers ne sont pas modélisés. Les frais partagés ne deviennent pas une estimation carbone par personne.

## Préparations format 5

La clé courante devient `dragonroute.prepared.v5.<environnement>`. Chaque entrée possède `meetings`, soit `null`, soit les deux lieux résolus (`label`, `lat`, `lon`), les limites (`km`, `minutes`) et `stationPosition` (`before`, `during`, `after`). La référence interne au trajet direct, les propositions non adoptées, les coûts, le texte partagé et les passagers ne sont pas conservés. Le tracé historique reste celui affiché lors de l’enregistrement explicite.

Lecture prioritaire des clés 5 → 4 → 3 → 2 → 1, avec correspondance stricte entre clé et version. Les formats antérieurs migrent en mémoire avec `meetings: null`, sans inférence ni écriture. Les originaux restent exportables et intacts. Chaque écriture et effacement contrôle les cinq clés pour détecter un changement concurrent. Un document prioritaire invalide bloque l’écriture ; aucune sélection silencieuse d’une version ancienne. Limites de 20 préparations et 2 Mo inchangées.

Une reprise charge les points mémorisés sans nouvelle recherche d’adresse. Elle exige d’abord un nouveau trajet initial, puis le recalcul et l’adoption des rencontres ; le bandeau indique qu’elles ne sont pas encore incluses. Le retour des stations reste une recherche et une confirmation distinctes. Import et export préservent le contrat ; une préparation à pied avec rencontres automobiles est refusée. Profil et journal restent indépendants ; aucune sauvegarde personnelle implicite.

## Vérifications et sources

Les modèles testent ordre des étapes, sommes, accès station, limites cumulées, états inconnus, arrondis et migrations. Les parcours navigateur couvrent OSRM/IGN, acceptation/refus, trois positions du plein, carte, budget, navigation/GPX, panne, annulation, réponse incohérente, reprise, import, conflit, adresses exclues du partage et changement de mode. Les preuves exécutées et la recette publiée sont consignées dans l’état de développement et le rapport du commit. Des réponses construites ne constituent pas une qualification sur route réelle.

- [OSRM, API Route et étapes](https://project-osrm.org/docs/v5.24.0/api/), consultée le 18 novembre 2026.
- [Google Maps URLs et étapes intermédiaires](https://developers.google.com/maps/documentation/urls/get-started), consultée le 18 novembre 2026.
- [Calcul d’itinéraire IGN](https://cartes.gouv.fr/aide/fr/guides-utilisateur/utiliser-les-services-de-la-geoplateforme/calcul-itineraire/), fournisseur déjà utilisé.

Aucun nouveau fournisseur, compte, abonnement, hébergement ou appel payant. Aucun service de réservation ou envoi de message. Cette livraison ne qualifie ni déplacement réel, ni téléphone physique, ni compatibilité caravane/poids lourd. Les ressources PWA et leurs empreintes sont actualisées ensemble.
