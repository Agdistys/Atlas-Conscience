# OùQuandQui — Grilles de péage gratuites

V005 · 17 novembre 2026. Complément au [cahier des charges V5](OuQuandQui-Cahier-des-Charges-V5-2026-09-18.md) et au [raccordement tarifaire V004](OuQuandQui_API_V004_Peages_2026-11-17.md), conservés.

## Fonction disponible

Après calcul du trajet, « Budget du trajet → Calculer un péage APRR / AREA — gratuit » permet de sélectionner le réseau, la classe tarifaire, la date, puis les gares d’entrée et de sortie. Le montant TTC vient de la paire exacte dans la grille du 1er février 2026. Aucun compte, clé, abonnement ou appel tarifaire distant. Les données sont embarquées dans le site GitHub Pages ; consultation possible sans réseau une fois l’application mise en cache. Le calcul initial d’un itinéraire continue de nécessiter ses services de géocodage/routage.

Une classe n’est jamais choisie automatiquement à partir du mode de routage. Les classes 1 à 5 sont disponibles avec renvoi au guide ASFA. Le tarif ne certifie ni le passage possible d’une caravane/poids lourd ni les dimensions admissibles des routes. Les gares doivent être choisies par la personne ; aucune correspondance automatique avec la carte n’est annoncée.

Jusqu’à dix tronçons peuvent être ajoutés au budget. Un doublon orienté du même réseau est refusé. Les chevauchements entre tronçons ou entre réseaux ne sont pas détectés : la personne doit les contrôler. La somme est **partielle** par défaut. Un total carburant + péages n’apparaît qu’avec un prix de carburant et la confirmation explicite « Ces tronçons correspondent à mon trajet et couvrent tous ses péages ». Il porte la mention **estimation déclarée**, distincte d’une validation cartographique ou automatique. Le plein acheté n’est jamais ajouté.

Ajouter/retirer un tronçon retire la confirmation de couverture. Changer de classe, date, variante, arrêt, véhicule ou trajet efface les tronçons du budget. Une paire inexistante, une classe non choisie ou une date hors période ne produit aucun zéro implicite. Les tarifs n’établissent pas que les réseaux non couverts sont gratuits. Aucun tarif après le 31 décembre 2026 : ce seuil de consultation est interne, sans garantie de maintien du tarif jusqu’à cette date. Une session restée ouverte contrôle l’expiration au moins chaque minute lorsqu’un budget de tronçons existe.

Le devis automatique candidat TollGuru reste désactivé sur le site. S’il est activé ultérieurement après qualification, il remplace le budget des tronçons déclarés ; les deux modes ne sont jamais additionnés. Les protections du serveur V004 restent inchangées.

## Origine et qualification

21 505 paires APRR et 955 paires AREA, cinq classes : **112 300 montants** confrontés aux PDF officiels, avec distances tarifaires. Les CSV communautaires contenaient 9 099 paires dont la séparation des noms était erronée ; les montants concordaient. Les noms ont été corrigés depuis les PDF, et les sources originales conservées. Exemples et méthode reproductible : [dossier des données](../../data/tariffs/2026-02/README.md). Le contrôle intégral ne prouve ni l’absence d’erreur dans la grille publiée par l’exploitant ni son applicabilité à un parcours choisi sans vérification des gares.

Exemple de référence AREA : Aiguebelette → Aix Nord, classe 1, **3,50 € TTC** ; classe 2, **5,50 € TTC**. Ce montant concerne ce couple de gares, pas un trajet Lyon–Valence. Source : [grille officielle AREA, page 2 du PDF](https://voyage.aprr.fr/sites/default/files/2026-02/TARIFS_AREA.pdf).

## Limites et suite

Cette étape fournit des prix réels de grilles pour les tronçons choisis. Le calcul automatique France entière, la reconnaissance des entrées/sorties sur la géométrie, les remises, les nouveaux millésimes, la comparaison automatique avec/sans péage et l’intégration au classement des stations restent à développer. Aucun fournisseur commercial ni hébergement supplémentaire n’est engagé.

Contrôles : reconstruction exacte depuis les sources, paires directionnelles uniques, centimes entiers, noms corrigés ; parcours navigateur de sélection, classes, somme partielle/confirmation, invalidations, absence d’appel externe et séparation des deux modes de calcul. La suite requiert désormais 56 scénarios sur quatre formats (224 passages). Les résultats courants sont consignés dans la PR et son rapport ; une suite prévue ne vaut pas une exécution réussie.

[Sources de l’exploitant](https://voyage.aprr.fr/tarifs-de-peage) · [Données ouvertes et attribution](https://www.data.gouv.fr/datasets/tarifs-autoroutes-aprr) · [Guide ASFA](https://www.autoroutes.fr/FCKeditor/UserFiles/File/ASFA_classes_vehicules_2022.pdf).
