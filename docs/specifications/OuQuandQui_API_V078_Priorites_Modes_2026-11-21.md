# V078 — Priorités communes aux modes calculés

BOU-PREFERENCES-MODES-01 · 21 novembre 2026. Complète BOU-01/02/03/07/08/09 et EMP-04/05/06 du [cahier V5](OuQuandQui-Cahier-des-Charges-V5-2026-09-18.md). Prolonge les [empreintes comparées V063](OuQuandQui_API_V063_Comparaison_Empreintes_2026-11-20.md), les [groupes de voyageurs V064](OuQuandQui_API_V064_Groupes_2026-11-20.md) et la [formule facultative V076](OuQuandQui_API_V076_Priorites_2026-11-21.md). Les éditions et fonctionnalités précédentes sont conservées.

## Parcours volontaire

Après une recherche collective avec comparaison des modes routiers, ouvrir « Comparer les empreintes », préciser les modèles et les voyageurs, puis « Comparer les modes selon mes priorités ». Le panneau s’ouvre sans indice, avec des poids nuls. Les tableaux bruts, leurs tris, les cartes, les estimations individuelles et les commandes de sauvegarde restent indépendants.

Les poids entiers de 0 à 10 portent sur le temps comparé et l’empreinte du groupe. Ils expriment une importance relative ; aucune valeur du temps en euros par heure n’est demandée. Zéro désactive un critère pour tout le groupe. « Figer les modes et appliquer » copie les options reçues et les hypothèses présentes ; les variations de poids opèrent ensuite sur cette copie datée.

La pondération demeure une proposition facultative dans l’aperçu. Elle ne sélectionne pas un itinéraire et ne crée aucun score de sécurité, d’accessibilité, d’éthique, de vie privée ou de liberté. L’identité et les sources des options restent consultables dans les tableaux d’origine.

## Contexte et unités communes

Le départ, l’arrivée, la date et le sens de recherche sont communs. Le nombre de voyageurs est celui du panneau V064 : hypothèse initiale visible d’une personne, modifiable de 1 à 9. Les occupants de la voiture sont renseignés séparément. Un groupe invalide interdit les indices ; un groupe supérieur aux occupants retire l’estimation automobile, sans modifier silencieusement l’un ou l’autre champ.

Le temps comparé est celui de V063 : durée depuis l’heure de départ demandée, attente comprise, ou durée entre le départ de l’option et l’heure limite d’arrivée, marge comprise. Il reste distinct de la durée en chemin et n’est jamais multiplié par le nombre de voyageurs. La comparaison utilise les minutes affichées, arrondies au supérieur. Pauses personnelles, trafic et capacité à voyager ensemble ne sont pas attestés.

L’empreinte retenue est la part du même groupe, en kg CO₂e, uniquement pour les options entièrement estimées dans le périmètre construction et énergie. Le catalogue figé `impactco2-2026-11-18-bece7af`, les unités et allocations de V063/V064 restent inchangés. Aucun facteur, source ou modèle nouveau. Le choix d’un modèle est une hypothèse ; il ne constitue pas l’observation du véhicule.

Pour la voiture, la part du groupe est le total véhicule divisé par les occupants puis multiplié par les voyageurs du groupe. Les facteurs collectifs sont déjà exprimés par personne-kilomètre : seule la multiplication par les voyageurs est appliquée. Les facteurs, allocations, version, dates et limites restent accessibles dans les tableaux bruts et leur détail.

La marche non estimée demeure inconnue. Un itinéraire collectif avec une étape sans modèle reste partiel, même si cette étape indique zéro mètre. Le vélo mécanique, limité à la construction, conserve un périmètre distinct. Ces options ne reçoivent pas un indice carbone par substitution ou par zéro ; elles peuvent participer à une comparaison temporelle lorsque le poids carbone est nul pour tout le groupe et que leurs autres contraintes sont satisfaites.

Le coût total est indisponible dans ce comparateur. Billets, péages et autres frais ne forment pas un ensemble complet et homogène ; le poids coût reste désactivé à zéro. Les budgets historiques V077 ne sont pas transférés vers ces options actuelles.

## Contraintes et données incomplètes

Les règles impératives de correspondances, de vélo, de réseau et de calendrier s’appliquent avant toute pondération. Les références exclues restent visibles sans indice. Une option passée selon l’horloge de l’appareil ou une horloge devenue non vérifiable ne reste pas une proposition actuelle grâce à son score. La surveillance temporelle existante réévalue l’admissibilité ; elle ne lance aucune nouvelle recherche.

Une panne de mode reste distincte d’une option exclue ou d’une empreinte partielle. Un critère actif absent retire l’option du calcul et la signale comme incomplète. Les poids ne sont pas renormalisés différemment pour chaque option. Il faut au moins deux options admissibles possédant toutes les valeurs des critères actifs ; une option restante ne reçoit pas de titre de gagnante.

Le contexte, les hypothèses et les contraintes sont contrôlés à chaque action de pondération. Les changements silencieux des champs sont relus. Changer le groupe, un modèle, les occupants, une exclusion ou l’admissibilité retire les indices jusqu’à une actualisation explicite, même si le réglage précédent est ensuite rétabli. Un simple tri des valeurs brutes ou une consultation de carte ne modifie pas la copie figée.

## Formule et précision

Le résultat porte `ami-minmax-v1-proposition`. Pour chaque critère actif à minimiser, normalisation `(valeur − minimum) / (maximum − minimum)` ; si toutes les valeurs sont égales, la valeur normalisée vaut zéro. L’indice sur 100 est la moyenne de ces valeurs selon les poids. Les bornes sont communes aux seules options admissibles et complètes pour tous les critères actifs.

Le temps est comparé à la minute affichée et le carbone au millième de kg CO₂e, selon la précision des tableaux V063. La classe strictement positive « moins de 0,001 kg CO₂e » est représentée par 0,0005 pour le calcul ; ce représentant numérique est expliqué dans le détail, ne devient pas une mesure et reste distinct du zéro explicite. Deux valeurs appartenant à cette même classe restent égales pour la pondération. Les valeurs des modèles ne sont pas réécrites.

Chaque contribution expose valeur de comparaison, bornes, poids et points. Les points sont affichés au centième et l’indice au dixième. Un même indice affiché conserve le même rang ; durée puis identifiant stabilisent l’ordre, sans annoncer une supériorité supplémentaire. Des options distinctes restent identifiées séparément lorsqu’elles sont ex æquo.

Tous les poids nuls donnent une vue sans indice ; un poids vide, négatif, fractionnaire ou supérieur à dix retire les indices jusqu’à correction. Les indices ne sont comparables ni entre recherches ni entre groupes différents. L’ajout ou le retrait d’un critère actif peut changer le sous-groupe complet ; les valeurs sources et hypothèses restent celles de la copie figée.

## Durée de vie et données personnelles

« Retirer la pondération » efface les poids et indices, puis rend le focus au bouton d’ouverture. Réouvrir recommence avec des poids nuls, en conservant les modèles du panneau d’empreintes encore ouvert. Fermer ce panneau, changer de recherche, reprendre une préparation ou fermer le collectif retire aussi la pondération. Le panneau d’empreintes conserve ses règles de réouverture avec hypothèses initiales.

Les poids et résultats restent en mémoire de consultation. Aucune clé, version de sauvegarde, migration, entrée de journal ni préférence de profil n’est créée. Enregistrer une préparation collective reste une action distincte et explicite ; elle ne transfère pas les modèles ou les poids. Une comparaison ne déclare pas un déplacement effectué. Aucun appel fournisseur n’est déclenché par les réglages de pondération.

## Vérifications et limites

Les contrôles numériques couvrent contributions, unités, temps avec attente/marge, population commune, périmètres incompatibles, sous-totaux, valeurs absentes, contraintes, petites valeurs positives, égalités et absence de mutation. Les parcours navigateur couvrent les hypothèses, poids, invalidations, changements silencieux, exclusions, vieillissement horaire, tris et cartes indépendants, sauvegarde, fermeture, clavier et texte doublé sur petits écrans.

La recette réelle porte sur des lieux publics du pilote Grenoble et des hypothèses explicitement choisies. Une réponse réelle avec accès à pied peut demeurer partielle et interdire un classement carbone. Le groupe complet sans marche utilisé dans les tests est une réponse simulée identifiée, jamais une disponibilité réelle affirmée. Inspection GitHub, publication exacte, ressources, moteurs et formats vérifiés sont consignés séparément dans le suivi. Aucun appareil physique, lecteur d’écran, déplacement ou émission observée qualifié par ces essais.

Les limites des pilotes, des véhicules et de la couverture tarifaire du [bilan V070](OuQuandQui_API_V070_Recette_Parcours_2026-11-21.md) restent applicables. Aucun fournisseur, compte, abonnement, achat, appel payant, hébergement ou fusion sur le site principal.
