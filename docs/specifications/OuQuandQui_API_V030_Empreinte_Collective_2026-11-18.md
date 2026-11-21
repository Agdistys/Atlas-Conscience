# OùQuandQui — V030 · Empreinte des étapes collectives

18 novembre 2026 · MULTIMODAL-05 · Complément des exigences EMP-01/02/03/05/06 et BOU-02/03/07 du [cahier V5](OuQuandQui-Cahier-des-Charges-V5-2026-09-18.md). Réutilise les facteurs figés de [V009 — empreinte du journal](OuQuandQui_API_V009_Empreinte_Journal_2026-11-18.md), sans modifier leurs valeurs, leur version ni les estimations historiques. [V017 — empreinte routière](OuQuandQui_API_V017_Empreinte_Preparation_2026-11-18.md), [V027 — comparaison des temps](OuQuandQui_API_V027_Collectif_Direct_2026-11-18.md), [V028 — annonces réseau](OuQuandQui_API_V028_Infos_Reseau_2026-11-18.md) et [V029 — préparations collectives](OuQuandQui_API_V029_Preparations_Collectives_2026-11-18.md) sont conservées.

## Parcours

Chaque option collective calculée propose **Estimer l’empreinte**. L’action ouvre les étapes du parcours concerné dans un panneau numéroté. Elle ne recentre pas la carte et ne demande aucune nouvelle tuile. La carte reste commandée par « Voir le parcours ». L’estimation est facultative, limitée à une personne et calculée localement, sans nouvelle requête. Les boutons sont disponibles après la fin de la recherche et de sa comparaison facultative.

Chaque étape à bord présente un choix de modèle, initialement vide, même lorsqu’un seul modèle est disponible. Le mode reçu du calculateur, la distance et le modèle choisi restent distincts. Le nom d’une ligne ne choisit jamais une motorisation de bus ou une catégorie de train. La sélection constitue une hypothèse de calcul, pas une vérification du véhicule effectivement utilisé.

| Mode du calculateur | Choix qualifiés |
|---|---|
| Tram | Tramway |
| Métro | Métro |
| Train | TGV, Intercités, TER, RER / Transilien |
| Bus | Bus thermique, bus électrique, autocar thermique |
| Marche, funiculaire, téléphérique, télécabine | Aucun facteur qualifié dans ce parcours ; étape non estimée |

Changer un modèle recalcule le résultat local. Vider un choix retire l’estimation de l’étape. Un facteur incompatible ne produit aucune valeur, même si un contrôle de formulaire a été altéré. Les heures, les prix inconnus, le classement des temps, les annonces réseau, le trajet routier et son budget ne sont pas modifiés.

## Calcul et source

Le jeu `impactco2-2026-11-18-bece7af` est figé au commit ADEME / Impact CO₂ `bece7af7e3daa41c7f2233e03d169c33e82530c2`, extrait le 18 novembre 2026. Les données originales, leur SHA-256, le contrat d’occupation et la licence MIT Datagir restent dans [data/carbon](../../data/carbon/). Les contrôles de provenance de V009 vérifient la concordance exacte avec les facteurs distribués. Aucune nouvelle source, clé, licence supposée ou valeur d’émission n’est ajoutée.

Tous les facteurs utilisés ici sont exprimés en **kg CO₂e/personne-km**, dans le périmètre **construction et énergie modélisées**. Pour chaque étape de distance `d` en mètres et les deux postes du facteur choisi `c` et `e` :

- construction : `d / 1000 × c` ;
- énergie : `d / 1000 × e` ;
- part individuelle de l’étape : somme de ces deux postes.

Les facteurs collectifs comprennent déjà une fréquentation moyenne. Aucun second partage par le nombre de voyageurs ou la capacité du véhicule n’est appliqué. Les postes et étapes sont additionnés sans arrondi intermédiaire. Une valeur positive inférieure à 0,001 kg reste affichée « < 0,001 kg CO₂e », distincte d’un zéro explicitement calculé.

La distance est celle de chaque étape théorique retournée par Mobilités M, validée dans le modèle du trajet ; elle n’est pas déduite de la distance à vol d’oiseau ou du dessin simplifié. Une géométrie manquante n’invalide pas à elle seule une distance source valide. Une distance absente, textuelle, négative, non finie ou supérieure à la limite de 150 km par étape reste inconnue, sans conversion en zéro. Au plus trente étapes sont traitées.

Le résultat expose la source, la version du jeu, sa date d’extraction, le périmètre, les postes, l’unité, le modèle retenu et le détail de multiplication pour chaque étape estimée. Les valeurs restent des moyennes modélisées ; elles ne mesurent ni le matériel du réseau ni sa consommation, son chargement ou sa fréquentation réels. Infrastructures et alimentation humaine ne sont pas ajoutées. Aucune analyse exhaustive du cycle de vie n’est revendiquée.

## Données manquantes et lecture du résultat

Sans aucune étape estimable, le panneau affiche **Empreinte non estimée** ; il ne produit pas de sous-total nul.

Si certaines étapes sont estimées et d’autres non, il affiche un **Sous-total partiel**, le nombre d’étapes estimées sur le nombre total, les kilomètres concernés et les étapes manquantes. La somme des distances manquantes est présentée uniquement lorsque toutes ces distances sont connues. L’**empreinte totale est indisponible**. La marche, même très courte, ne devient pas une activité sans impact.

Lorsque chaque étape dispose d’un modèle compatible et d’une distance valide, la somme peut être affichée comme **Estimation des étapes**, toujours dans le périmètre limité du modèle. Elle ne devient pas une empreinte exhaustive du déplacement. L’état complet du calcul ne certifie ni la pertinence des hypothèses choisies ni le déplacement réel.

Les sous-totaux partiels ne servent pas à classer les options. Aucun badge « meilleur CO₂ », économie par rapport à la voiture, score pondéré ou recommandation environnementale n’est produit. La comparaison existante reste une comparaison de temps, avec ses hypothèses propres.

## Durée des hypothèses

Les choix restent dans la consultation courante. **Retirer l’estimation** les efface et restitue le focus au bouton de l’option. Ouvrir l’estimation d’une autre option, afficher sa carte, modifier les critères, relancer la recherche ou fermer le panneau collectif retire les anciens choix. Une nouvelle consultation commence avec les champs vides.

Une consultation d’annonces réseau ne modifie pas le calcul carbone théorique. Les retards et perturbations ne sont pas convertis en kilomètres ni en émissions supplémentaires supposées. Les résultats de deux options restent identifiés par leur numéro.

Enregistrer le trajet collectif retire le panneau carbone. L’instantané V029 garde son format : aucune hypothèse, valeur d’émission ou référence carbone n’y est ajoutée implicitement. Reprendre une préparation exige une nouvelle recherche puis de nouveaux choix de modèle. Aucun profil ou journal n’est écrit par l’estimation ; une recherche ne devient jamais un déplacement effectué.

## Vérification

Neuf contrôles du modèle couvrent correspondances exactes des modes, provenance et unités, calcul de référence, postes et sommes, absence de seconde division, étapes sans facteur, choix incompatibles, zéro explicite et distances invalides, très petites valeurs, indépendance des données, limites et étapes manquantes.

Neuf scénarios navigateur, dans les quatre formats de l’Inspectrice, couvrent : action volontaire et sous-total sourcé sans appel, motorisation de bus explicitement choisie, mode non qualifié et changement de carte, retrait/critères/réouverture, sauvegarde sans estimation implicite, trajet routier et comparaison conservés, contenu externe échappé et clavier, coexistence avec les annonces réseau et ouverture d’une autre option sans agir sur la carte. Les parcours de sauvegarde et d’information réseau sont rejoués localement, soit 112 scénarios initiaux, puis 36 parcours carbone après suppression du recentrage implicite de la carte.

La recette publiée est distincte : calcul réel entre Grenoble Gares et l’avenue Innsbruck, choix explicite du modèle reçu, vérification numérique à partir des facteurs figés et des distances, affichage partiel, absence d’appel carbone, sauvegarde sans hypothèses, concordance des fichiers publiés, captures ordinateur/mobile. Le rapport du commit livré conserve les nombres réellement exécutés. Aucun téléphone physique, mesure d’émissions, déplacement ou réservation n’est attesté.

## Limites et suites

Pilote collectif Grenoble, distances et horaires théoriques. Catégories moyennes choisies par la personne, sans qualification de motorisation propre aux lignes. Marche et modes hors catalogue non estimés. Pas de comparaison carbone complète, de budget collectif, de synchronisation ou de calcul automatique sur l’historique. Les facteurs et périmètres supplémentaires demandent leur propre qualification avant intégration.
