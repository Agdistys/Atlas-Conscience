# OùQuandQui — Empreinte des portions personnelles et partagées

V024 · 18 novembre 2026 · EMP-SEGMENTS-01. Complète EMP-01 à EMP-04 du [cahier V5](OuQuandQui-Cahier-des-Charges-V5-2026-09-18.md), [l’empreinte prospective V017](OuQuandQui_API_V017_Empreinte_Preparation_2026-11-18.md) et [les rencontres V022](OuQuandQui_API_V022_Rencontres_2026-11-18.md). Les éditions antérieures et les estimations historiques du journal sont conservées.

## Parcours et hypothèses

Avec une prise en charge et une dépose adoptées, « Empreinte du trajet préparé » demande trois nombres d’occupants : avant la prise en charge, avec les passagers et après la dépose. Chaque nombre inclut le conducteur, de 1 à 9 personnes entières. Tous les champs commencent vides. Aucun effectif n’est déduit des places proposées, du partage financier ou du profil du véhicule. Le modèle compatible avec le carburant reste un choix explicite.

Le conducteur est supposé présent sur les trois portions. Les autres occupants peuvent différer d’une portion à l’autre : leur identité et leur présence sur l’ensemble du trajet ne sont pas déduites des effectifs. L’affichage donne le véhicule entier, la part cumulée du conducteur, les parts cumulées des autres occupants et le détail de chaque portion. « Par occupant » dans ce détail porte uniquement sur la portion concernée. Une occupation de 1 laisse toute cette portion au conducteur.

Sans rencontres adoptées, le parcours V017 à occupation constante demeure disponible. La comparaison directe voiture/marche conserve son périmètre sans rencontres ni plein : ouvrir cette comparaison depuis un trajet avec rencontres demande une nouvelle occupation constante. Les trois effectifs ne sont ni moyennés ni transformés en une occupation unique.

## Distance, facteur et allocation

Les distances proviennent des étapes routières calculées, regroupées avant, entre et après les rencontres. Le détour carburant est inclus dans la portion où le plein a été explicitement placé. Aucune projection sur la carte n’est utilisée pour estimer une distance partagée.

La cohérence des étapes est vérifiée par le contrat V022 : nombre, ordre, valeurs finies non négatives et sommes conformes au total routier à sa tolérance de 2 mètres / 2 secondes. Le total segmenté utilise la somme des distances des étapes, sans répartir artificiellement un écart d’arrondi du fournisseur.

Pour la portion `i`, sa distance `dᵢ` en kilomètres, le facteur `f` en kg CO₂e/véhicule-km et l’occupation `nᵢ` :

- véhicule : `Vᵢ = dᵢ × f` ;
- conducteur et chaque occupant présent sur cette portion : `Pᵢ = Vᵢ / nᵢ` ;
- autres occupants de la portion : `Aᵢ = Vᵢ − Pᵢ` ;
- total véhicule : `V = Σ Vᵢ` ; part conducteur : `P = Σ Pᵢ` ; autres occupants : `A = V − P`.

Les allocations se partagent le total véhicule ; elles ne s’y ajoutent pas. Modifier les effectifs ne réduit pas les émissions estimées du véhicule. Aucun arrondi intermédiaire ; l’affichage arrondit les valeurs et peut donc présenter de petits écarts entre sommes de nombres affichés. Une distance explicitement nulle produit zéro ; une distance absente ou incohérente ne le fait pas.

Le jeu figé, sa provenance et ses unités restent ceux de V017 et de [V009](OuQuandQui_API_V009_Empreinte_Journal_2026-11-18.md) : `impactco2-2026-11-18-bece7af`, huit modèles routiers essence/diesel qualifiés, construction et énergie. Source, version, date d’extraction et méthode sont accessibles dans le résultat. La consommation du budget ne corrige pas un facteur moyen. Aucun facteur électrique, hybride, E85, GPL, marche, caravane ou poids lourd n’est substitué à un modèle absent. Aucune nouvelle source ni requête carbone.

## Changements et inconnus

Un modèle incompatible, une option inactive, un effectif vide, non entier ou hors borne, ou des étapes invalides retirent l’estimation et affichent le motif. Aucune ancienne valeur ni zéro fictif ne reste affiché comme résultat courant.

Changer les rencontres, l’ordre du plein, le véhicule routier ou le carburant retire les trois effectifs. Leur retour aux anciennes valeurs ne restaure pas l’ancienne hypothèse. Recalculer puis adopter les rencontres demande de les renseigner à nouveau lorsque ce contexte a changé. Un nouvel arrêt carburant dans le même ordre conserve les effectifs explicitement choisis et recalcule les distances et parts ; son retrait revient au tracé sans arrêt. Changer le modèle ou un effectif recalcule l’estimation. « Effacer les occupants par portion » conserve le modèle choisi et retire les trois effectifs.

## Conservation et vérification

Les hypothèses restent en session. Les préparations format 5, leur import/export, les profils et le journal ne reçoivent aucun nouveau champ ni écriture implicite. Recharger, reprendre une préparation ou changer de profil demande de choisir à nouveau les hypothèses prospectives. Aucune estimation historique n’est réécrite et aucune préparation ne devient un déplacement effectué.

Les contrôles couvrent la conservation des sommes, les unités, les effectifs invalides, les modèles incompatibles, zéro/inconnus, les trois positions du plein, les changements de contexte, le clavier, la comparaison directe, les préparations et la conservation du journal. Les preuves de l’inspection du commit et de la recette publiée figurent dans l’état de développement. Réponses construites, services IGN réellement consultés et observations sur route restent distincts : ni déplacement réel, ni occupation réelle, ni téléphone physique ne sont attestés par ces tests.
