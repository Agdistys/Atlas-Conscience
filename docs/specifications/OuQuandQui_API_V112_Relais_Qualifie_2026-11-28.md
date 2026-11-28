# OùQuandQui · V112 · Premier calcul réel d’une portion payante

Date : 28 novembre 2026. Complément de V111 et V110. État : relais gratuit déployé, premier parcours réel vérifié ; intégration de la fonction dans l’application encore en cours. Le site reste sur GitHub Pages. Les versions précédentes sont conservées comme historique daté.

## 🔌 Connexion opérationnelle

La clé HeiGIT est acceptée et enregistrée comme secret du relais Cloudflare. Le titulaire a confirmé les deux offres gratuites dans le formulaire protégé. Aucun changement d’abonnement ni service payant n’a été effectué. L’accès disponible ne permet pas de vérifier la facturation par API : la confirmation des offres provient du titulaire.

Le relais isolé répond sur https://ouquandqui-routing.d-serant.workers.dev. Il accepte des trajets automobiles entre deux points, avec instructions et attributs des péages. Il n’active pas les profils poids lourds, caravanes, les alternatives ou les trajets à plusieurs étapes. L’aperçu public conserve sa configuration antérieure ; aucune fusion sur main ni publication Webnode n’est effectuée.

## 🛣️ Portion choisie : premier essai réel

Un parcours public Lyon–Valence a été calculé sans péage, puis avec une portion payante précisément sélectionnée et deux raccordements sans péage. Les cinq demandes réelles à travers le relais ont réussi. Le contrôle confirme la géométrie et le sens exacts de la portion, les raccordements, une même version du réseau et l’absence de péage dans les deux parties extérieures. L’adoption du modèle exige une confirmation explicite de la proposition inchangée.

Résultat du moteur : 105,1 km et environ 2 h 11 sans péage ; 102,7 km et environ 1 h 15 avec la portion retenue. Ces estimations correspondent à cet essai, sans validation sur route ni promesse de durée réelle. Le montant du péage est inconnu et reste absent du total complet ; il n’est jamais remplacé par zéro. Le test ne qualifie pas les caravanes, les poids lourds, toutes les exclusions ni l’ensemble du réseau français.

Les limites internes de la portion sont [4.844688, 45.54336] et [4.887414, 44.970212], en longitude/latitude. Ce sont des limites du réseau calculé, pas des noms d’échangeurs certifiés. Les accès physiques, la signalisation et les classes tarifaires restent à qualifier avant un usage guidé de cette fonction.

## 🧭 Accès et réponses contrôlés

Le premier point « Lyon centre » était rattaché à un accès signalé comme réservé aux livraisons. Le contrôle a refusé ce parcours. Un départ public situé juste après cette restriction a permis le nouvel essai. Les avertissements du fournisseur ne sont pas ignorés : un accès restreint reçoit un refus explicite, et une réponse ambiguë n’est pas adoptée comme itinéraire utilisable.

Le relais refuse les redirections avant tout transfert de la clé vers une autre adresse. Le mode de requête a été adapté à Cloudflare, qui prend en charge le traitement manuel des redirections. La fraîcheur des propositions utilise l’heure locale de réception effective de la réponse ; l’horodatage du serveur est conservé séparément pour éviter qu’un décalage d’horloge rende un trajet fraîchement reçu invalide. Sources : [requêtes Cloudflare](https://developers.cloudflare.com/workers/runtime-apis/request/), [restrictions routières openrouteservice](https://giscience.github.io/openrouteservice/api-reference/endpoints/directions/extra-info/road-access-restrictions).

## 🔒 Clé et capacité du pilote

La clé n’est présente ni dans le site, ni dans les fichiers suivis du dépôt, ni dans le profil des visiteurs. La copie locale temporaire a été retirée après la réussite des essais à travers Cloudflare, et le formulaire local a été arrêté. Les reçus de connexion conservés ne contiennent aucune clé. Les coordonnées utilisées pour la qualification sont publiques ; aucun trajet personnel n’a été transmis.

Le compteur persistant limite l’ensemble du pilote à 100 calculs par jour UTC et à 10 sur une minute glissante. Une recherche complète de cet essai consomme cinq calculs : référence sans péage, référence avec péage, puis trois parties. Les échecs après réservation comptent aussi. Les plafonds, les offres gratuites et les quotas du fournisseur restent distincts. Un refus n’entraîne aucun nouvel essai automatique ni fournisseur payant. Les origines autorisées protègent l’usage navigateur, sans constituer une authentification des personnes.

## 🧪 Vérifications et portée

80 contrôles ciblés réussissent : 26 pour le relais Cloudflare, 8 pour le formulaire local, 35 pour le modèle de portion choisie et 11 pour le relais Node existant. La suite locale d’inspection complète compte 826 réussites. Les refus de redirection, de clé invalide, d’origine interdite, de corps invalide, d’accès routier restreint, les plafonds persistants, l’annulation et les exclusions sont couverts selon les cas par simulation ou réponse réelle.

L’essai distant confirme cinq calculs HTTP 200 et un refus réel HTTP 422 pour l’accès restreint. Les contrôles d’origine et de requête invalide répondent respectivement 403 et 400 sans calcul fournisseur. Ce résultat qualifie ce scénario de calcul ; il ne valide ni l’interface publique de la fonction, ni le guidage, ni les manœuvres réelles, ni un téléphone Android. Les indicateurs de qualification de l’application exposés par le relais restent donc désactivés.

## ➡️ Intégration suivante

Raccorder le choix d’une portion au parcours de l’application : comparaison lisible sur la carte, tarif et plafond lorsqu’une source valable est disponible, puis confirmation avant adoption. Conserver le tracé, les instructions et l’exception limitée à la portion lors de l’ajout d’une station et du recalcul après une sortie de route. Toute modification du trajet, des exclusions, du véhicule ou du budget invalide la confirmation précédente.

Le nouvel adaptateur doit assembler les instructions et les distances des trois parties, traiter l’annulation et les réponses dépassées, puis éprouver les arrêts et le recalcul avant activation publique. Remplacer simplement l’adresse du service actuel ne suffit pas : son contrat accepte davantage de profils et de points que ce pilote. La recette Android physique reste ouverte. NAV-TOLLS-01 demeure en cours ; les 104 lots fonctionnels déjà clos sont conservés.
