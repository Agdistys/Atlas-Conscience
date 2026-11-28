# OùQuandQui — Empreinte des trajets préparés

V017 · 18 novembre 2026 · BOU-EMPREINTE-01. Complément de BOU-02/03/07 et EMP-01 à EMP-06 du [cahier des charges V5](OuQuandQui-Cahier-des-Charges-V5-2026-09-18.md). Réutilise le jeu figé qualifié dans [V009 — Empreinte du journal](OuQuandQui_API_V009_Empreinte_Journal_2026-11-18.md), sans modifier les données ni les calculs historiques du journal. [Comparaison V015](OuQuandQui_API_V015_Comparaison_2026-11-18.md) et [horaires V016](OuQuandQui_API_V016_Horaires_2026-11-18.md) conservés.

## Parcours

Après un itinéraire calculé, « Empreinte du trajet préparé » permet de demander une estimation facultative. Aucun modèle ni nombre d’occupants n’est choisi automatiquement. Le carburant du trajet limite les modèles compatibles ; la taille du véhicule et le total des occupants, conducteur compris, sont saisis explicitement. La valeur porte sur le tracé affiché, y compris le détour routier par la station sélectionnée.

Le panneau de comparaison propose la même option. Les hypothèses déjà choisies explicitement dans la préparation sont reprises à l’ouverture, puis restent modifiables. Le groupe de voyageurs et le total des occupants sont distincts : deux personnes du groupe peuvent voyager dans une voiture contenant quatre occupants au total. Cette hypothèse suppose un même véhicule et un partage égal ; elle ne vérifie ni sa capacité ni des passagers réels.

Les résultats affichent séparément véhicule entier, part par occupant et part attribuée au groupe. Une sélection du trajet comparé reprend le modèle et les occupants dans la session. La marche reste non estimée ; le tri CO₂e demeure indisponible, avec comparaison incomplète explicitement indiquée. Une donnée manquante n’améliore aucune position. Aucun score pondéré.

## Modèles et calcul

Jeu `impactco2-2026-11-18-bece7af`, source ADEME / Impact CO₂, commit figé `bece7af7e3daa41c7f2233e03d169c33e82530c2`, licence MIT Datagir. Sources, contrat d’occupation, licence et preuve de qualification restent dans [data/carbon](../../data/carbon/). Le test de provenance vérifie la concordance exacte du jeu distribué avec l’extraction et le SHA-256 archivés. Le calcul ne consulte aucun service externe.

Ce parcours routier propose huit modèles déjà qualifiés : quatre tailles essence E5/E10 et quatre tailles diesel B7/B10. E10/SP95/SP98 ouvrent les modèles essence, Gazole les modèles diesel. Aucune taille n’est inférée du profil. Les modèles électriques et hybrides présents dans le jeu général ne sont pas proposés ici, car le parcours carburant courant ne les qualifie pas comme tels. E85, GPL, caravane, utilitaire, poids lourd et marche ne reçoivent aucun modèle de substitution.

Pour une distance `d` en mètres, un facteur `f` en kg CO₂e/véhicule-km, `n` occupants et `g` personnes du groupe :

- véhicule entier : `V = d / 1000 × f` ;
- part par occupant : `P = V / n` ;
- part attribuée au groupe : `G = P × g`, uniquement dans la comparaison ;
- `1 ≤ g ≤ n ≤ 9`, nombres entiers. Le conducteur fait partie des occupants.

`f` additionne les postes construction et énergie du modèle, sans arrondi intermédiaire. Le groupe et les parts individuelles ne sont jamais ajoutés au total véhicule. La consommation saisie pour le budget carburant ne corrige pas ce facteur moyen. Une distance explicitement nulle avec un facteur compatible produit zéro ; une distance absente ou invalide produit une absence d’estimation.

Le détail expose modèle, distance, facteur et unité, postes construction/énergie, périmètre, source, date d’extraction et version. Il s’agit de valeurs moyennes modélisées, pas d’une mesure du véhicule. Chargement, météo, consommation réelle, infrastructures et alimentation humaine ne sont pas ajoutés arbitrairement. Aucun impact complet de la marche ni empreinte exhaustive n’est revendiqué.

## Inconnus et changements

Option non demandée, facteur absent ou incompatible, occupants manquants/invalides, groupe supérieur aux occupants ou distance invalide : valeurs `null`, motif lisible, aucune valeur nulle inventée. Une hypothèse carbone incomplète n’empêche pas de consulter les trajets calculés ; elle empêche seulement cette estimation. L’heure limite reste un filtre indépendant et ne devient pas moins stricte grâce à une faible empreinte.

Changer le modèle, l’occupation ou une hypothèse commune invalide le groupe comparé. Changer le carburant retire un modèle devenu incompatible. Changer de profil véhicule ou reprendre une préparation demande de choisir à nouveau le modèle. Les émissions du trajet courant suivent sa géométrie réelle et son éventuel arrêt ; aucune estimation de l’ancien tracé n’est réutilisée comme résultat du nouveau.

## Données et vérification

Les hypothèses prospectives restent en session. Elles ne sont incluses ni dans les préparations format 3 ni dans le journal des déplacements effectués. L’interface indique de les choisir à nouveau après rechargement ou reprise. Aucune nouvelle clé de stockage, aucun changement de format, aucune écriture automatique dans le profil ou le journal. Les estimations historiques et sources figées de V009 restent intactes.

Recette : valeurs de référence et concordance avec le calcul du journal, partage du groupe sans double division, modèle incompatible, zéro connu/inconnus, borne d’occupation et absence de facteur marche ; parcours navigateur du trajet et de la comparaison, sélection, heure limite, changement de carburant/profil, détour de station, invalidation, sauvegarde/reprise et absence de transmission carbone. Contrôles ordinateur/mobile et inspection de l’aperçu publié consignés séparément dans l’état de développement. Réponses simulées et services réels restent distingués ; aucun déplacement physique ou téléphone réel qualifié.

Cache `shell-28`. Aucun fournisseur, achat, compte ou hébergement ajouté. Le coût total et la comparaison carbone complète restent incomplets.
