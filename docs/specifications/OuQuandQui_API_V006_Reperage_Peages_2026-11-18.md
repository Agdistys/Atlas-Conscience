# OùQuandQui — Repérage des gares de péage

V006 · 18 novembre 2026 · Lot PEA-TRACE-01. Complément aux [grilles V005](OuQuandQui_API_V005_Grilles_Peages_2026-11-17.md) et au [cahier des charges V5](OuQuandQui-Cahier-des-Charges-V5-2026-09-18.md), conservés.

## Parcours disponible

Après calcul d’un trajet, ouvrir « Budget du trajet → Calculer un péage APRR / AREA — gratuit → Repérer les gares proches du trajet ». Le bouton lance une recherche locale dans l’inventaire embarqué. Le rayon de proximité est réglable à 100 m, 300 m par défaut ou 1 km. Les repères candidats sont ordonnés selon leur projection sur la géométrie du trajet affiché, y compris l’arrêt sélectionné. La limite de 80 repères affichés est annoncée lorsque la recherche en trouve davantage. Une boucle ne produit qu’un repère par groupe, au point le plus proche ; les passages répétés ne sont pas recensés.

Chaque fiche donne le nom déclaré, le type, le nombre de positions regroupées, la distance approximative au tracé et le kilomètre projeté sur sa géométrie. Des points violets P1, P2… ouvrent les fiches depuis la carte ; une fiche peut recentrer la carte sur son point. Ces points sont indépendants des stations de carburant et du tracé bleu. Ils peuvent être masqués sans effacer les résultats. Le mode cartographique de secours SVG conserve les points et leur accès au clavier.

Un nom exactement concordant après normalisation des accents, casse, espaces et apostrophe typographique permet de **proposer** une entrée ou une sortie dans l’unique grille concordante. Aucun rapprochement partiel ou approximatif de noms n’est utilisé. Un nom ambigu ou absent laisse le choix manuel disponible, sans proposition automatique. La sélection d’une sortie exige une entrée du même réseau et une paire présente dans la grille.

Une proposition ne confirme pas l’identité physique de la gare ni son passage. Avant d’ajouter ce tronçon au budget, la personne doit vérifier entrée/sortie et cocher « Ces gares proposées sont bien celles de mon passage ». Le montant affiché reste celui du couple tarifaire choisi ; il n’est pas attribué par la géométrie. Changer une gare retire la confirmation. Le calcul manuel direct des grilles reste disponible sans utiliser ce repérage.

La somme reste partielle après ajout, conformément à V005. La confirmation de passage d’un couple de gares ne confirme pas la couverture de tous les péages du trajet. Le total carburant + péages reste soumis à la confirmation distincte de couverture et à un prix de carburant renseigné. Aucun zéro n’est créé lorsque la recherche est vide, hors couverture, ambiguë ou indisponible.

## Validité et données

Source géographique : [inventaire du ministère](https://www.data.gouv.fr/datasets/gares-de-peage-du-reseau-routier-national-concede), référence **01/01/2025**, fichier publié le 28/07/2025, consulté le 18/11/2026, licence [ODC-By 1.0](https://opendatacommons.org/licenses/by/1-0/). 1 266 positions sont conservées dans 831 groupes géographiques. Les positions peuvent être anciennes ou incomplètes. Le calcul n’infère ni exploitant, ni sens de circulation, ni gares effectivement traversées. La route voisine d’un péage peut être gratuite ; le rayon de recherche n’est donc pas une preuve de passage.

La transformation EPSG:2154 → EPSG:4326 et la provenance sont documentées dans le [dossier des sources](../../data/toll-gates/README.md). La géométrie utilise une projection locale pour la proximité et des distances sphériques pour la progression. Ces repères ne servent ni à calculer un détour routier ni à garantir une entrée ou une sortie accessible.

Les coordonnées du trajet ne quittent pas le navigateur pour cette fonction. Aucun compte, fournisseur, serveur, clé ou abonnement n’est ajouté. Les services de calcul initial du trajet restent nécessaires. Les données sont embarquées avec les grilles, compatibles avec la publication GitHub existante et la mise en cache du site.

## Invalidations et contrôle

Un nouveau trajet, une variante ou un arrêt modifiant la géométrie efface les repères, les choix issus de l’aide et leur confirmation. Les invalidations du budget de V005 restent actives. Le manque d’inventaire désactive uniquement l’aide au repérage ; les grilles manuelles restent utilisables.

Les contrôles couvrent la conservation des 1 266 positions, les empreintes des sources, la reconstruction du bloc, la préservation des tarifs, les routes parallèles, le rayon, le sens inversé de la géométrie, les segments nuls et boucles, les données invalides, les noms ambigus, la confirmation, les changements de trajet, l’absence de requête supplémentaire et les deux modes de carte. Six nouveaux scénarios navigateur sont exécutés sur les quatre formats de la suite. Le rapport d’inspection courant et la PR consignent les résultats exécutés ; les routes simulées ne prouvent aucun passage réel. Les vérifications sur le site publié sont consignées séparément.

## Limites restantes

Cette aide ne réalise pas le calcul automatique des péages en France. Les seuls tarifs intégrés demeurent les grilles APRR/AREA de V005 ; l’inventaire géographique plus étendu n’élargit pas cette couverture tarifaire. Restent à qualifier : correspondances entre identifiants de gare et tarifs, topologie et sens des voies d’accès, contrôle des entrées/sorties réellement empruntées, passages répétés, chevauchements des tronçons, nouveaux millésimes et autres réseaux. TollGuru demeure désactivé. Aucun routage caravane ou poids lourd n’est certifié par ces données.
