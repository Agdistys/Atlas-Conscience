# V063 — Comparer les empreintes des modes calculés

BOU-EMPREINTE-COLLECTIVE-01 · 20 novembre 2026. Complète BOU-01/02/03/07/09, EMP-01 à EMP-06 et QUA-01/02 du [cahier V5](OuQuandQui-Cahier-des-Charges-V5-2026-09-18.md). Prolonge [V017, empreinte routière](OuQuandQui_API_V017_Empreinte_Preparation_2026-11-18.md), [V027, comparaison des temps](OuQuandQui_API_V027_Collectif_Direct_2026-11-18.md), [V030, étapes collectives](OuQuandQui_API_V030_Empreinte_Collective_2026-11-18.md) et [V035, comparaison vélo](OuQuandQui_API_V035_Comparaison_Velo_2026-11-19.md). Les versions antérieures et estimations historiques sont conservées.

## Parcours

Dans le pilote collectif, activer la comparaison des temps avec les modes routiers, et éventuellement le vélo classique, puis lancer la recherche. Une fois les calculs terminés, **Comparer les empreintes** ouvre un panneau indépendant. Les lieux, la date, le sens de recherche et **une personne** constituent le contexte commun. Chaque option conserve sa distance propre ; aucune distance à vol d’oiseau ou distance d’un autre mode n’est substituée.

Aucun nouveau calcul d’itinéraire ni appel carbone n’est effectué. Une panne d’un mode ne retire pas les autres résultats. Le collectif peut rester indisponible si son service échoue ; il ne reçoit pas les données d’un autre mode.

Pour la voiture, le carburant courant est présenté, avec possibilité de le modifier **uniquement pour cette estimation**. Le modèle et le total des occupants sont initialement vides. Le modèle doit être compatible avec le carburant ; E85 et GPL restent sans modèle qualifié. Modifier le carburant retire l’ancien choix de modèle. Le profil et le budget ne sont pas modifiés. Les occupants, conducteur compris, sont une hypothèse entière de 1 à 9 ; aucune capacité réelle n’est déduite.

Chaque option collective possède ses propres modèles d’étapes, dans un volet dépliable. Les choix commencent vides, même lorsqu’un seul modèle est disponible. Une ligne de bus ou de train ne détermine pas automatiquement sa technologie. Le vélo mécanique exige une case explicite ; son facteur reste limité à la construction. Aucun facteur n’est attribué à la marche.

Le panneau affiche les valeurs brutes, le périmètre, les étapes couvertes ou manquantes et le détail des calculs. Les panneaux d’estimation individuels existants et la carte restent indépendants : ouvrir une fiche ou afficher une autre option ne transfère pas les modèles d’une option à l’autre.

## Formules et provenance

Le catalogue figé `impactco2-2026-11-18-bece7af`, ses sources, empreintes, unités et licence sont inchangés. Les [données archivées](../../data/carbon/) et contrôles de provenance existants restent la référence. Aucune mise à jour implicite des facteurs, source supplémentaire ou requête externe.

- **Voiture** : distance du trajet en kilomètres × facteur construction et énergie en kg CO₂e/véhicule-km ; allocation individuelle = total du véhicule ÷ occupants saisis. Le total du véhicule est présenté séparément et n’est jamais ajouté à sa part individuelle.
- **Étapes collectives** : distance de chaque étape × facteur en kg CO₂e/personne-km ; la fréquentation moyenne est déjà incluse. Aucune seconde division par des occupants ou une capacité.
- **Vélo mécanique** : distance du trajet cyclable × facteur construction seule en kg CO₂e/personne-km. Aucune substitution par un modèle de vélo électrique.
- **Marche** : absence de facteur qualifié ; aucune émission nulle supposée, y compris pour une étape de distance explicitement nulle.

Les sommes et allocations sont calculées sans arrondi intermédiaire. L’affichage utilise les règles existantes : trois décimales, et « < 0,001 kg CO₂e » pour une petite valeur strictement positive. Un zéro calculé avec un facteur compatible reste distinct d’une distance inconnue ou d’un modèle absent.

La source et le détail de chaque facteur sont accessibles dans la ligne correspondante. Le panneau commun précise version, date d’extraction, licence, périmètres et limites. Ces valeurs moyennes ne mesurent ni un véhicule ni une consommation réels. Infrastructures et alimentation humaine ne sont pas ajoutées ; aucune empreinte exhaustive ou économie causale n’est annoncée.

## Groupe comparable et tris

Les contraintes strictes passent avant le classement. Une option collective exclue par le nombre de correspondances, un vélo hors limite impérative ou un critère invalide restent des références hors groupe. Les critères souples restent visibles sans devenir des interdictions.

Les tris par temps et distance opèrent sur les modes admissibles. Temps comparé et durée en chemin restent distincts : le premier comprend l’attente avant le départ demandé ou la marge jusqu’à l’heure d’arrivée limite. Les références non admissibles et modes indisponibles sont séparés.

Le tri **CO₂e croissant · groupe comparable seulement** devient disponible lorsqu’au moins deux options admissibles disposent d’une estimation de toutes leurs étapes dans le même périmètre **construction et énergie**, pour une personne. Il présente un tableau de ce groupe, puis un tableau séparé contenant les options non comparables. Aucune ligne sans donnée ne prend la première place grâce à une absence de valeur.

Un sous-total collectif avec marche non estimée demeure partiel. Le vélo mécanique reste dans un autre périmètre. Leurs valeurs sont consultables, mais elles n’entrent pas dans le groupe construction et énergie. Si le groupe devient trop petit après une modification, le tri carbone est retiré et l’ordre des modes est restauré avec un motif visible.

Sur petit écran, les tableaux disposent d’un défilement horizontal annoncé, utilisable au clavier après mise au focus. La page et la fenêtre conservent leur largeur.

Les égalités sont signalées à la précision affichée : minutes arrondies vers le haut, mètres affichés et kg CO₂e au millième. Les petites valeurs positives affichées sous 0,001 restent distinctes du zéro. L’ordre secondaire par temps puis numéro est déterministe ; il ne signifie pas une supériorité environnementale. Aucun score pondéré, badge « meilleur », coût total inventé ou comparaison exhaustive de tous les modes.

## Durée des hypothèses et interactions

Les choix appartiennent à la consultation, sans nouvelle clé de stockage ni modification de format. **Retirer la comparaison d’empreintes** les efface et rend le focus au bouton d’ouverture. Réouvrir recommence avec des modèles vides.

Une nouvelle recherche, fermeture du panneau collectif, changement des lieux/date/modes ou contexte devenu incohérent retire les anciens résultats. Les limites locales de correspondances ou de vélo réévaluent l’admissibilité sans nouvel appel et sans transfert de modèles. Un changement du carburant global ou du véhicule invalide les hypothèses de la comparaison ; un changement silencieux est contrôlé à l’action suivante.

Enregistrer une préparation collective ou déclarer volontairement un déplacement suit les parcours existants. Aucune hypothèse de ce comparateur n’est incluse implicitement dans ces documents. Une recherche, un tri ou un clic ne déclare aucun trajet effectué. Les estimations historiques restent intactes.

## Validation

Contrôles numériques : unités, allocation individuelle, périmètres, modèles incompatibles, étapes absentes, distances invalides, zéro explicite, petits nombres, égalités, identité des options, absence de mutation et contraintes prioritaires.

Parcours navigateur : ouverture volontaire, données complètes/partielles/indisponibles, choix de modèles et carburant, occupation, changement de critères, erreurs et réponses tardives, fermeture/focus, sauvegarde sans hypothèses, indépendance de la carte et des autres estimations, contenu externe inerte, clavier, petits écrans et paysage à texte agrandi. Les itinéraires sans accès à pied utilisés pour exercer le groupe complet sont des **réponses simulées identifiées**, pas une preuve de disponibilité réelle.

La recette distante du commit, la publication exacte et la consultation réelle du pilote Grenoble sont consignées séparément dans le suivi de développement. Une réponse réelle peut rester partielle ; aucun modèle de marche ni arrêt fictif n’est ajouté pour rendre le groupe complet. Les moteurs et formats testés ne qualifient ni appareil physique ni lecteur d’écran.

## Limites conservées

Comparaison d’une personne, pilote collectif Grenoble et vélo classique. Pas de comparaison de groupes, couverture collective nationale, profil caravane/poids lourd, suivi GPS, réservation, train + vélo, total de coûts ou nouvelle source carbone. Le jeu actuel ne permet pas une comparaison carbone complète porte-à-porte de tous les modes. Aucun nouveau fournisseur, compte, achat, hébergement ou fusion sur le site principal.
