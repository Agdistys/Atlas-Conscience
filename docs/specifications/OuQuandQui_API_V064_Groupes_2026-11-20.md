# V064 — Comparer le même groupe de voyageurs

BOU-GROUPE-COLLECTIF-01 · 20 novembre 2026. Complète BOU-02/03/07/09 et EMP-02/03/04/05 du [cahier V5](OuQuandQui-Cahier-des-Charges-V5-2026-09-18.md), prolonge [V063, comparaison des empreintes](OuQuandQui_API_V063_Comparaison_Empreintes_2026-11-20.md), et reprend la distinction groupe/occupants de [V017](OuQuandQui_API_V017_Empreinte_Preparation_2026-11-18.md). Les éditions antérieures, le catalogue carbone et les données historiques sont conservés.

## Parcours et périmètre commun

Après une recherche collective avec comparaison routière facultative, **Comparer les empreintes** propose **Nombre de personnes dans le groupe**. L’hypothèse initiale est visiblement fixée à une personne, comme dans V063 ; elle est modifiable de 1 à 9 voyageurs entiers. Le même nombre s’applique aux options collectives, à la voiture et au vélo consultés dans ce panneau. Il ne devient ni un nombre de places disponibles ni une réservation.

Les lieux, la date, l’intention horaire, les distances, les temps comparés et les contraintes proviennent des parcours déjà reçus. Modifier le groupe ne multiplie pas les kilomètres, les durées ou le nombre d’étapes. Les horaires restent théoriques et les durées routières restent estimées ; capacité, matériel, allure collective, pauses et présence réelle de voyageurs ne sont pas vérifiés. Aucune donnée voyageurs n’est envoyée à un fournisseur et aucun nouveau parcours n’est demandé.

Le tableau des temps et les panneaux d’estimation individuelle existants restent des consultations distinctes. Le nouveau groupe concerne le panneau de comparaison des empreintes ; il n’est pas transféré silencieusement vers le comparateur routier, le profil, une préparation ou le journal. Le contexte et les sous-volets des options rappellent le groupe de ce panneau.

## Allocations et unités

Les facteurs du jeu figé `impactco2-2026-11-18-bece7af`, leur provenance, leurs dates et leurs périmètres restent inchangés. Les modèles de véhicule et d’étapes demeurent des choix explicites. Aucune technologie n’est déduite de la ligne, du nom ou d’un nombre de voyageurs.

Pour une voiture, `g` voyageurs du groupe et `n` occupants au total, conducteur compris, sont deux hypothèses distinctes :

- total du véhicule `V = distance en km × facteur en kg CO₂e/véhicule-km` ;
- part individuelle `P = V / n` ;
- part du groupe `G = P × g`, avec `1 ≤ g ≤ n ≤ 9`.

Deux voyageurs dans un véhicule occupé par quatre personnes reçoivent ainsi la moitié du total véhicule. Les autres occupants ne font pas nécessairement partie du groupe comparé. Aucune part n’est ajoutée au total véhicule. Modifier `g` ne change ni `V` ni `P` tant que l’hypothèse reste compatible avec `n`. Le nombre maximal de neuf est une borne du formulaire, pas une qualification de capacité physique.

Pour les transports collectifs, le facteur est déjà exprimé par personne-kilomètre : la valeur individuelle de chaque étape est conservée et sa part pour le groupe est multipliée par `g`. Aucune nouvelle division par des occupants ou une capacité. Il s’agit d’une allocation du modèle moyen, pas des émissions marginales causées par l’ajout de personnes à un bus ou un train.

Le vélo exige l’hypothèse explicite **un vélo mécanique par personne du groupe**. La valeur individuelle, limitée à la construction, est multipliée par `g`. La disponibilité du matériel n’est pas attestée ; aucun modèle électrique ou vélo partagé n’est substitué.

Les calculs utilisent les valeurs non arrondies. Les arrondis servent uniquement à l’affichage. Le détail montre les facteurs, le calcul individuel et, au-delà d’une personne, le multiplicateur et la part du groupe. Les champs individuels du modèle restent distincts des nouveaux champs `groupTotalKg` et `groupSubtotalKg`. Les calculs historiques du journal et des estimations individuelles restent inchangés.

## Inconnus, contraintes et tri

Un groupe vide, non entier, inférieur à un ou supérieur à neuf rend les estimations indisponibles. Le champ porte une erreur accessible ; les anciens montants sont retirés. Les tris numériques sont désactivés et l’ordre des modes est rétabli. Corriger le nombre permet un nouveau calcul local avec les modèles déjà choisis, sans nouvel appel réseau. Une modification silencieuse du champ est relue à l’action suivante.

Lorsque le groupe dépasse les occupants renseignés, seule l’estimation voiture devient indisponible, avec un motif explicite. Les valeurs collectives restent calculables pour ce groupe. Corriger le groupe ou les occupants réévalue la voiture ; aucune hausse automatique des occupants et aucune baisse automatique du groupe.

Les contraintes strictes restent prioritaires. Une option hors critère n’entre pas dans le classement, même si sa valeur carbone est faible. Le tri carbone utilise **la part du groupe** et exige au moins deux options entièrement estimées, admissibles, de même périmètre et pour le même groupe. Un mélange de populations incompatibles ne peut pas être classé.

Une portion à pied sans facteur reste inconnue, y compris lorsque sa distance déclarée est nulle. Les sous-totaux collectifs indiquent leur couverture et la part du groupe ; ils ne deviennent pas des totaux complets par multiplication. Le vélo mécanique conserve son périmètre de construction seule et reste hors du groupe construction et énergie. Les valeurs strictement positives affichées sous 0,001 restent distinctes du zéro. Les égalités suivent la précision affichée de la part du groupe, sans score ni gagnant global.

## Durée des hypothèses et consultation

Le nombre de voyageurs est propre à la consultation. Fermer puis rouvrir la comparaison revient à une personne et à des modèles vides. Un changement du contexte de recherche retire le panneau et ses hypothèses. Changer le carburant local conserve le nombre de voyageurs mais retire le modèle automobile devenu incompatible. Les changements de carburant ou véhicule globaux suivent les invalidations de V063.

Ouvrir une estimation collective individuelle ou consulter une autre carte ne modifie pas le groupe. Enregistrer volontairement une préparation suit le format existant : le groupe et les modèles de cette comparaison n’y sont pas inclus. Le texte de l’interface indique cette absence de mémorisation. Aucune nouvelle clé de stockage, migration, synchronisation ou entrée automatique au journal.

Les tableaux se consultent horizontalement sur petit écran, avec l’indication et l’accès clavier de V063. Les champs et la fermeture restent accessibles en paysage à texte agrandi.

## Vérification et limites

Les contrôles numériques couvrent allocation voiture, groupe de neuf, unités par passager, données absentes, sous-totaux, groupe supérieur aux occupants, populations incompatibles, contraintes, arrondis et absence de mutation des sources. Les scénarios navigateur couvrent calculs, corrections, champs invalides, changements silencieux, fermeture, nouvelle recherche, indépendance des panneaux, sauvegarde sans transfert implicite et clavier/petits écrans.

Les options collectives complètes sans accès à pied employées pour exercer le classement sont des réponses simulées identifiées. La recette distante et l’aperçu exact avec lieux publics de Grenoble sont consignés dans le suivi. Les facteurs choisis pour cette recette sont des hypothèses, pas des modèles observés dans les véhicules. Une réponse cyclable contenant un segment de transport reste rejetée comme vélo direct. Les formats redimensionnés ne qualifient ni téléphone physique ni lecteur d’écran.

Le lot ne calcule ni tarifs de groupe, billets, capacité disponible, empreinte exhaustive, itinéraire adapté à l’allure de plusieurs cyclistes, ni combinaison train + vélo. Les pilotes et limites de routage existants sont conservés. Aucun nouveau fournisseur, compte, achat, hébergement, facteur carbone ou fusion sur le site principal.
