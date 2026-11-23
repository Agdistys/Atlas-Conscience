# V097 — Accès à pied et comparaison porte à porte des passagers

23 novembre 2026 · COV-ACCES-01. Exigences COV-04, DOU-01, DOU-02, DOU-04, BOU-02, BOU-03, BOU-07 et DAT-01 du [cahier V5](OuQuandQui-Cahier-des-Charges-V5-2026-09-18.md). Complète [V096](OuQuandQui_API_V096_Modes_Passagers_2026-11-23.md), les horaires V092 et les budgets V083/V084. Les éditions précédentes restent conservées.

## Deux périmètres explicites

Depuis un parcours adopté avec prise en charge et dépose, ouvrir la comparaison des passagers. Le périmètre initial reste la seule portion entre ces rencontres. L’option « Inclure les accès à pied : comparer porte à porte » ajoute le départ personnel et la destination des passagers. Elle est désactivée à chaque nouvelle ouverture.

Deux adresses sont nécessaires. Chaque extrémité peut être remplacée par une déclaration explicite indiquant qu’elle est déjà le point de rencontre correspondant. Seule cette déclaration supprime la demande de routage de cet accès et lui attribue une distance et une durée nulles. Un champ vide, une réponse manquante ou un service indisponible ne valent pas zéro. Des adresses géocodées proches ne sont pas automatiquement assimilées à un même lieu.

Le départ personnel est saisi en heure de Paris, sans valeur déduite de l’horaire du conducteur. Le groupe comprend de un à huit passagers, conducteur exclu. Les mêmes personnes doivent effectuer tout le déplacement, entre les mêmes adresses et au même départ pour chacun des modes. La confirmation de groupe est retirée après modification des lieux ou du périmètre. Les stations intermédiaires restent des arrêts carburant, sans destination à visiter dans les autres modes.

## Recherches et confidentialité

La consultation du formulaire ne déclenche aucun appel. Le calcul demande une confirmation propre à la recherche des adresses et des accès à pied. Les adresses renseignées sont transmises au géocodeur IGN existant. Une ambiguïté ouvre le choix des lieux ; aucun premier résultat n’est adopté sans confirmation. Les deux lieux confirmés fixent les extrémités communes de la comparaison.

Le routage IGN existant calcule les accès à pied. Le trajet direct à pied et, sur demande, le vélo mécanique utilisent les mêmes extrémités personnelles. Les moteurs ne reçoivent que les données nécessaires aux parcours, sans ajout des budgets, effectifs ou horaires déclarés. Aucun nouveau fournisseur, compte technique ou abonnement n’est introduit. Une sauvegarde ultérieure des lieux exige l’action volontaire de conservation de la comparaison ; aucun nouveau profil n’est écrit.

Un quota IGN arrête les demandes IGN suivantes de cette opération. Une erreur sur un accès ne transforme pas cet accès en zéro et n’empêche pas un autre mode indépendant de rester consultable. Si les lieux eux-mêmes ne sont pas confirmés, aucun mode n’est présenté pour des extrémités supposées. Fermeture, annulation et changement de paramètres invalident les résultats et ignorent les réponses tardives, sans relance automatique.

## Chronologie et rendez-vous

L’arrivée estimée du conducteur à la prise en charge reste l’instant exact établi dans V096, secondes et fractions comprises. Le départ des passagers est distinct. L’arrivée piétonne au rendez-vous est ce départ augmenté de la durée de l’accès reçu. L’attente avant rendez-vous est la différence entre l’arrivée estimée du conducteur et celle des passagers.

Si cette différence est négative, la voiture est indisponible dans la comparaison : les passagers arriveraient après la prise en charge estimée. Aucun retard du conducteur, rattrapage, attente du véhicule ou nouvelle heure de rendez-vous n’est inventé. Une égalité exacte donne une attente nulle. La présence et la synchronisation effectives restent à convenir.

La durée porte à porte est la somme de l’accès initial, de l’attente calculée, de la portion automobile V096 et de l’accès final. La portion automobile comprend la conduite, les pauses carburant intermédiaires, l’attente/embarquement supplémentaire déclarée après l’arrivée du conducteur, puis la dépose/sortie. Les deux attentes sont nommées et additionnées une seule fois. Les pauses avant ou après cette portion ne sont pas ajoutées une seconde fois.

Une durée manquante sur un accès ou dans la portion automobile rend le total inconnu et retire la voiture du classement. Les valeurs connues restent explicitées. Un départ ambigu au changement d’heure d’automne, inexistant au printemps ou hors des bornes existantes est refusé. Une date passée ou une horloge incohérente reste une référence hors classement.

## Distances et contraintes

La distance complète additionne les deux accès et les seules portions automobiles entre les rencontres. La distance automobile reste distincte. La limite de marche s’applique à la somme des accès pour l’option combinée, et à tout le trajet pour l’option à pied directe. Une limite impérative dépassée ou inconnue exclut l’option avant tout indice. Une préférence souple dépassée reste visible sans exclusion. La contrainte horaire porte sur l’arrivée personnelle finale, accès de sortie inclus.

Les modes à pied et à vélo restent directs entre les lieux personnels ; ils n’imposent pas les rencontres ni les stations du véhicule. Les classements emploient le même départ, groupe et périmètre. Les valeurs brutes précèdent les priorités. Les règles de V078 sur les inconnus, les égalités et l’absence de choix automatique restent applicables.

La géométrie automobile de la portion n’est pas reconstruite artificiellement depuis le tracé complet. Le parcours adopté et sa carte conservent tous les points du conducteur. Cette comparaison fournit des métriques et une chronologie de scénario ; elle n’atteste ni les conditions réelles du terrain, ni la pente, les escaliers, l’accessibilité ou la sécurité d’un accès.

## Budget et empreinte

Les cinq postes du budget restent des frais propres au groupe des passagers pour le déplacement complet. Aucun achat aux stations, coût du conducteur, partage existant ou tarif d’un autre trajet n’est recopié. Un poste vide est inconnu ; un zéro exige une déclaration. Les budgets incomplets restent hors du classement financier.

L’estimation facultative du carburant applique uniquement la distance automobile, la consommation et le prix déclarés, puis la fraction passagers comparés / occupants. Les occupants incluent au moins les passagers et le conducteur exclu du groupe. Les kilomètres d’accès à pied ne consomment pas de carburant dans cette formule. Le plein acheté n’est pas ajouté au carburant consommé. L’arrondi intervient au centime après le calcul.

Le modèle d’empreinte automobile s’applique également aux seuls kilomètres en voiture. Dès qu’un accès à pied comporte une distance positive, cette valeur reste un sous-total : faute de modèle qualifié des accès, l’empreinte porte à porte est inconnue et ne peut être classée comme complète. Le détail automobile demeure consultable. Aucun zéro carbone n’est attribué à la marche par défaut.

## Conservation et compatibilité

Le budget de format 4 distingue `distanceMeters`, distance complète de l’option, et `vehicleDistanceMeters`, portion automobile connue ou null. Les autres modes portent null pour cette seconde valeur. Une estimation carburant doit correspondre exactement à la distance automobile ; l’import refuse la distance complète à sa place, un conducteur absorbé dans le groupe, les distances incohérentes et les champs absents. Les reprises de péages sourcés d’un autre trajet restent interdites dans ce périmètre ; une déclaration de péages reste possible.

La collection de comparaisons adopte le format 5 uniquement lors d’une sauvegarde explicite contenant ce budget. Les formats 1 à 4 restent lisibles sans réécriture. Une collection ne rétrograde pas lors d’une suppression ou d’une sauvegarde ancienne. Un format futur reste protégé. Les formats de profil et de préparation automobile ne changent pas.

Le souvenir conserve les lieux, coordonnées, groupe, départ commun, instant du rendez-vous, distances, durées, attentes, pauses, contraintes, valeurs comparées et budget déclaré ou estimé. La référence automobile reste datée. Les exports et la relecture historique n’attestent pas un déplacement effectué et ne relancent pas le calcul. Reprendre automatiquement les adresses dans un nouveau scénario n’est pas inclus dans ce lot.

Fermer le panneau restitue le comparateur précédent. Le parcours adopté, ses points, horaires, coûts, stations, partages et exports restent intacts. Changer de périmètre retire les résultats précédents et rétablit le départ exact de la portion V096. Aucune adoption de trajet ni écriture au journal n’est implicite.

## Critères d’Achèvement

Vérifier les adresses explicites, le consentement, le choix ambigu annulé, les mêmes lieux déclarés, l’heure ambiguë, les durées inconnues et le rendez-vous manqué. Contrôler la somme des distances et durées, les deux attentes, la limite de marche cumulée, les changements silencieux, quotas et réponses tardives. Tester le carburant sur la seule portion, les occupants, l’empreinte partielle, les formats mixtes, la sauvegarde et la relecture sans mutation des anciennes copies.

La qualification couvre quatre formats Chromium, les parcours Firefox/WebKit, le clavier, le texte agrandi et le retour au parcours initial. La recette de l’aperçu exact distingue réponses simulées, trajets réellement consultés et coûts fictifs déclarés. L’inspection complète et la publication doivent correspondre au même commit. Aucun déplacement physique, rendez-vous réel, guidage natif ou validation poids lourd/caravane n’est déduit de ces essais. Aucun paiement, nouvel hébergement, réorganisation ou fusion n’est requis.
