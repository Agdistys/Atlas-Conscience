# OùQuandQui · V113 · Instructions et arrêts de la portion choisie

Date : 28 novembre 2026. Complément de V112. État : raccordement des instructions et proposition d’un arrêt vérifiés sur un parcours public ; interface, recalcul depuis la position et recette physique encore en cours. Les étapes et éditions précédentes restent conservées.

## 🧩 Instructions continues

Les calculs séparés avant, dans et après une portion payante contiennent chacun un départ et une arrivée. Ces limites techniques ne doivent pas devenir de faux arrêts dans le guidage. Le raccordement interroge le moteur sur des zones qui chevauchent les limites ; il exige exactement le même tracé, le même sens, la même version du réseau et les mêmes attributs de péage. Une divergence interrompt la proposition, sans remplacer discrètement la portion.

Les fenêtres qui se recouvrent sont réunies pour limiter les demandes. La première manœuvre déjà connue conserve sa direction ; les suivantes proviennent du nouveau calcul vérifié. Les distances et durées sont recalculées à partir des instructions assemblées et doivent être celles présentées lors de la future confirmation. Les vrais arrêts conservent leur arrivée et leur nouveau départ.

## 🧭 Ronds-points et instructions structurées

Le relais conserve désormais le numéro structuré de sortie des ronds-points. Une sortie absente ou invalide interdit la qualification des instructions. La direction n’est pas devinée à partir du nom de la rue ou d’un texte traduit. Les types de manœuvres openrouteservice sont traduits explicitement vers le modèle commun de guidage, en conservant leur provenance.

Le parcours public Lyon–Valence produit 28 instructions, un départ, une arrivée et six ronds-points avec numéro de sortie. Les deux raccordements ont été vérifiés par le service réel. Le tracé reste identique à la portion choisie, pour environ 102,7 km et 75 minutes estimées. Ce résultat concerne le calcul ; il n’est pas un essai de conduite ni une garantie des accès physiques. Référence : [types d’instructions openrouteservice](https://giscience.github.io/openrouteservice/api-reference/endpoints/directions/instruction-types).

## ⛽ Proposition d’arrêt hors de la portion

L’adaptateur prépare un arrêt situé avant ou après la portion payante. Les deux nouveaux accès à cet arrêt doivent être sans péage et respecter les autres exclusions. Le point routier reçu doit rester à 20 mètres au plus du point demandé ; les raccordements suivants doivent être exacts. Cette proximité ne certifie ni l’entrée physique d’une station ni son sens d’accès.

La portion payante conserve son tracé. Un arrêt à l’intérieur de cette portion n’est pas encore pris en charge par cet adaptateur. La nouvelle route reste une proposition à confirmer : l’ancien trajet n’est pas modifié et aucun ancien montant n’est repris automatiquement. Une halte témoin sur une voie publique a été vérifiée par le service réel ; elle valide le maintien de deux étapes, pas l’accès à une station-service réelle.

## 🔒 Péages, quotas et annulation

Le prix reste inconnu. Les exclusions ne sont relâchées que pour interroger un raccordement recouvrant la portion autorisée ; le résultat doit reproduire exactement les attributs du tracé de référence. Les péages restent interdits sur les accès à l’arrêt. Une réponse devenue ancienne, une annulation, un réseau modifié ou un plafond atteint interrompent le calcul, sans nouvelle tentative automatique.

Le pilote conserve les plafonds globaux de 100 calculs par jour UTC et de 10 par minute glissante. Dans l’essai, assembler les instructions demande trois calculs de parties et deux de raccordement ; vérifier une halte depuis ces trois parties ajoute deux calculs d’accès et les deux raccordements. La future interface devra annoncer les demandes utiles et conserver les résultats déjà vérifiés sans relancer des calculs devenus périmés. Les clés restent côté Cloudflare.

## 🧪 Vérifications réalisées

35 nouveaux contrôles couvrent les manœuvres, leur continuité, les vraies étapes, les fenêtres qui se recouvrent, les exclusions, la géométrie exacte, le rattachement de l’arrêt, les dates, l’annulation et les erreurs du service. Les réponses publiques réelles sont archivées et utilisées pour une régression reproductible. Les suites réunies comptent 115 contrôles ciblés et 861 contrôles d’inspection réussis.

Deux scénarios distants totalisent 12 calculs HTTP 200 : raccordement direct des instructions, puis halte témoin avec maintien de la portion. Le modèle de guidage existant accepte les deux résultats. Le module est aussi exécuté dans Chromium à partir des réponses archivées, sans erreur ; cela ne vaut ni vérification de nouvelles commandes de l’application ni essai Android physique.

## ➡️ Intégration à poursuivre automatiquement

Le développement automatique est réactivé à la demande du 28 novembre. NAV-TOLLS-01 reste ouvert. Prochaine étape : raccorder l’adaptateur aux commandes de choix, comparaison et confirmation, puis préserver l’exception lors du recalcul depuis une position confirmée et de la recherche réelle des stations. Le recalcul doit distinguer une portion à venir, en cours ou déjà passée, sans imposer un retour à son entrée.

L’interface publique conserve sa version précédente pendant cette intégration. Aucun guidage de portion payante n’est activé par ce seul lot, aucun tarif inconnu n’est présenté comme gratuit et aucune qualification poids lourd ou caravane n’est déduite de l’essai automobile. La recette Android physique reste ouverte ; les 104 lots fonctionnels clos restent conservés.
