# OùQuandQui · V114 · Une portion payante dans le trajet

Date : 28 novembre 2026. Complément de V113. Version d’essai intégrée à l’application : voiture au plus rapide, une portion payante explicitement choisie, stations avant ou après et guidage continu. Les éditions antérieures restent conservées. Le tarif automatique et la recette physique Android restent ouverts.

## 🛣️ Choisir et comparer

Après le calcul d’un trajet voiture, « Prendre une seule portion à péage » ouvre une comparaison. La classe de péage est déclarée séparément ; elle ne qualifie ni un gabarit, ni une caravane, ni un poids lourd. Le service repère des portions payantes ayant deux limites internes au trajet. Les noms de routes proviennent des instructions ; aucun nom de gare de péage n’est inventé.

La carte montre la référence sans péage en gris, la proposition en bleu et la portion choisie en ambre, avec ses repères d’entrée et de sortie. Un schéma remplace le fond cartographique indisponible. Les distances et durées comparées proviennent des instructions assemblées. Les durées excluent trafic en direct et pauses.

« Choisir ce trajet » est la seule action d’adoption. Annulation, modification du contexte, limite du service ou proposition ancienne conservent le trajet précédent. L’adoption retire l’ancien arrêt, les anciennes comparaisons de stations et les anciens montants de péage. « Revenir au trajet précédent » restaure la préparation antérieure ; ses stations doivent être recherchées à nouveau.

## ⛽ Stations et arrêts

Une station peut être proposée avant ou après la portion payante. Les accès doivent rester sans péage, respecter les autres évitements et rejoindre exactement les parties conservées. Un point routier à 20 mètres au plus de la coordonnée référencée ne prouve pas l’accès physique à la pompe. Les stations à l’intérieur de la portion ou dont la position est ambiguë restent exclues de ce pilote.

La carte de comparaison de l’arrêt précède sa confirmation. Une comparaison de plus de cinq minutes n’est plus adoptable. Ajouter ou retirer l’arrêt conserve le tracé payant choisi. Pendant le guidage, la recherche met le suivi en pause, demande une position récente, puis propose un arrêt avant une reprise explicite. Une seule station restante est admise ; après son passage confirmé, une autre recherche devient possible.

## 🧭 Progression et recalcul

Le fournisseur de cette fonction est isolé des itinéraires ordinaires. Les instructions gardent la provenance openrouteservice, les directions structurées et les sorties de rond-point. Les raccordements ne produisent pas de faux arrêts ; une station réelle conserve deux étapes.

La progression distingue une portion à venir, en cours et déjà passée. Seules des positions récentes et suffisamment précises, cohérentes avec le tracé suivi, font avancer cet état. Un recalcul avant la portion conserve celle-ci ; pendant son passage, il conserve son suffixe dans le bon sens ; après le passage confirmé, il ne demande que des routes sans péage et ne ramène jamais vers l’entrée.

Une progression incertaine, un réseau modifié, une position déplacée pendant le calcul ou une réponse incompatible suspendent la nouvelle proposition. Aucun trajet ordinaire n’est substitué à l’exception choisie. La validation sur téléphone Android, en conduite réelle, reste distincte des positions simulées et des réponses routières vérifiées.

## 💰 Prix, sauvegarde et périmètre

Le prix de la portion reste inconnu sans tarif vérifié pour ses limites, sa classe et sa date. Un plafond strict ne peut donc pas être satisfait par un prix absent. Le budget conserve l’état incomplet ; un ancien prix n’est pas reporté sur le nouveau trajet.

La sélection reste dans la session. L’enregistrement de cette préparation, sa copie vers le journal, les rencontres, les parcours multiples et les renvois de navigation externes sont indisponibles pour cette option tant qu’ils ne conservent pas explicitement l’exception. Les enregistrements déjà présents restent intacts. Ces limites sont affichées dans l’aide de la sélection ; les autres parcours de l’application restent disponibles.

## 🔒 Gratuité et demandes utiles

Le site reste hébergé sur GitHub. Le relais Cloudflare conserve la clé openrouteservice côté serveur ; aucun visiteur ne fournit de clé. Le pilote garde les plafonds globaux de 100 calculs par jour UTC et 10 par minute glissante. Les dépassements demandent une reprise volontaire, sans tentative automatique ni service payant de remplacement.

Une réponse identique est réutilisable en mémoire pendant une minute, avec sa date de réception originale. Les réponses assemblées gardent la date de leur élément le plus ancien. Ce cache limité ne survit pas au rechargement et ne crée pas d’historique de trajets. Les stations sont examinées une par une dans ce pilote, avec continuation explicite et conservation des résultats déjà obtenus.

## 🧪 Éléments de vérification

Le parcours public Lyon–Valence a été recalculé par le relais réel, comparé puis confirmé : environ 102,7 km et 75 minutes, 28 instructions, prix inconnu. L’ajout de la station DGCCRF 69310004, 126 boulevard de l’Europe à Oullins-Pierre-Bénite, conserve la portion payante et produit deux étapes et 38 instructions. Le rattachement routier est à environ 0,71 m de la coordonnée référencée. Dix calculs HTTP 200 ont été nécessaires, avec réutilisation des réponses communes. Cet exemple ne garantit ni tous les itinéraires ni l’accès physique à la station.

Les vérifications locales couvrent comparaison, confirmation, annulation, dates, plafond, limites gratuites, station avant/après, retrait, reprise GPS, progression avant/pendant/après, préservation du stockage, clavier et formats ordinateur/mobile. L’inspection compte 901 contrôles réussis et les tests d’assemblage sept cas réussis. Les contrôles navigateur et ceux de l’aperçu sont rattachés au commit de livraison ; une simulation ne constitue pas un essai Android physique.

## ➡️ Développement suivant

Poursuivre les tarifs sourcés par portion et classe, puis la sauvegarde et la reprise explicites de cette exception. Élargir les parcours publics de qualification et préparer la recette Android, sans assimiler le profil voiture au routage caravane ou poids lourd. NAV-TOLLS-01 reste ouvert pour ces compléments ; le guidage sur appareil physique reste à valider.
