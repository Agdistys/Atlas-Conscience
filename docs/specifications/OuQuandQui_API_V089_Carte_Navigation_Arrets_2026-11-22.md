# V089 — Carte et navigation des parcours à plusieurs arrêts

22 novembre 2026 · ARR-MULTI-02 · prolongement de [V088 — Préparer plusieurs arrêts carburant](OuQuandQui_API_V088_Arrets_Successifs_2026-11-22.md) et des exigences ARR-04/06/07, TRA-04 et PRO-04 du [cahier V5](OuQuandQui-Cahier-des-Charges-V5-2026-09-18.md). Les éditions et sauvegardes antérieures sont conservées.

## Consulter le parcours et ses étapes

L’aperçu avant confirmation et le parcours confirmé disposent d’une carte interactive. Le tracé calculé apparaît en bleu bordé de blanc ; les étapes sont numérotées dans l’ordre, du départ à l’arrivée. « Voir tout le parcours » recadre le tracé et les points. La carte appartient à la préparation à plusieurs arrêts ; elle ne remplace pas celle du trajet principal.

Chaque point ouvre le détail de son étape : nature, distance et durée depuis l’étape précédente, distance cumulée, quantité de carburant et pause prévues lorsqu’il s’agit d’une station. La liste numérotée donne accès au même détail. Les valeurs conservées restent datées ; une sélection ne recalcule pas le trajet, ne recharge pas les prix et ne marque pas l’étape comme visitée.

Lorsque plusieurs points se chevauchent à l’échelle affichée, un repère indique leur nombre. Son activation présente leurs boutons numérotés ; chaque étape reste sélectionnable même si deux stations ont des coordonnées identiques. Le regroupement évolue avec le zoom. Les cibles mesurent au moins 44 pixels et suivent l’agrandissement du texte. Le clavier permet d’activer un repère avec Entrée ou Espace. La liste demeure disponible à toutes les échelles.

## Fond de carte facultatif et relecture locale

Le tracé et les points utilisent les coordonnées déjà conservées. Aucun fond de carte n’est chargé automatiquement dans cette préparation. « Afficher le fond OpenStreetMap » demande les tuiles de la zone consultée au fournisseur existant ; l’action est annoncée avant le chargement. Il est possible de masquer ce fond. Une erreur de tuile est signalée sans effacer le tracé, les étapes ou le schéma de secours.

Si la bibliothèque cartographique n’est pas disponible, la liste et le schéma sans fond restent utilisables. Fermer la fenêtre ou lire une autre copie libère la carte précédente et réinitialise le choix du fond. La lecture d’une copie ne lance aucun nouveau calcul routier ou tarifaire. Les ressources habituelles de l’application et sa carte principale restent soumises à leur fonctionnement existant ; cette règle concerne la nouvelle carte de la préparation.

## Préparer une ouverture dans Google Maps

« Préparer la navigation » présente l’ordre complet, la date du calcul, les limites et les liens. Les lieux ne sont transmis qu’après activation volontaire d’un lien. La case d’accord active les liens mais n’ouvre aucun service et ne déclenche aucune requête. La sélection est réinitialisée à la fermeture, lors du changement de copie, d’une modification ou d’une nouvelle confirmation.

Le lien Google Maps contient les coordonnées du départ, de l’arrivée et de tous les points intermédiaires de son tronçon, dans leur ordre. Pour tenir compte de la limite documentée de trois étapes intermédiaires dans les navigateurs mobiles, un lien comprend au plus cinq points. Un parcours plus long est réparti en tronçons numérotés à ouvrir successivement. La fin d’un tronçon est le départ du suivant ; aucun point n’est supprimé. Avec trois stations et sans rencontre, un seul lien suffit. Avec trois stations et deux rencontres, deux liens sont proposés.

La destination reste Google Maps via une URL HTTPS documentée, avec le mode voiture. Les liens sont bornés à 2 048 caractères. Les noms du parcours ou des lieux ne sont pas ajoutés aux URL. Les ouvertures utilisent une nouvelle fenêtre sans lien vers la fenêtre d’origine.

La documentation précise que certains produits peuvent ignorer les points intermédiaires. L’interface demande donc de vérifier leur présence à l’ouverture. Les liens expriment une demande de parcours ; ils ne garantissent pas que l’application externe reprendra toutes ses caractéristiques.

## Destinations successives dans Waze

Waze reçoit une destination par lien, pour chaque étape après le départ. Le numéro et le nom de cette étape sont visibles avant l’ouverture. Le départ est déterminé par Waze à partir de sa position ou de ses réglages. Aucun départ fictif ni parcours complet à plusieurs arrêts n’est annoncé.

Le passage à l’étape suivante exige de revenir à la préparation et de choisir son lien. Aucun avancement, passage en station, achat ou déplacement effectué n’est enregistré à partir de ces ouvertures.

## Contraintes et données non transférées

La préparation reste limitée aux véhicules légers et aux raccordements IGN/OSRM qualifiés dans V088. Son éventuelle demande d’évitement des autoroutes est transmise aux liens de navigation. Le service externe recalcule selon ses propres données et réglages. Le critère « trajet le plus court », la géométrie exacte, les pauses, l’autonomie, les quantités, les prix et les confirmations de péages ne sont pas transférés.

L’export GPX existant conserve le tracé calculé et tous les points ; son interprétation dépend du logiciel qui l’importe. Une copie historique reste clairement datée, sans actualisation automatique. Les liens n’accordent aucune qualification supplémentaire aux poids lourds ou aux caravanes.

Les frais du trajet principal, ses confirmations de péages et ses contributions partagées restent distincts. Leur intégration à un parcours comportant plusieurs arrêts exige une requalification sur ce parcours. Aucun coût inconnu n’est remplacé par zéro et aucun total complet n’est annoncé dans ce lot.

## Critères de réception

La recette couvre le tracé local, la sélection individuelle de points superposés, le clavier, les petits écrans et le texte agrandi. Elle vérifie la disponibilité de la liste et du schéma quand le fond ou la bibliothèque manque, ainsi que la libération des anciennes cartes lors d’un changement de copie.

Les contrôles des liens couvrent l’ordre de tous les points, les limites par tronçon, la jonction entre tronçons, l’absence d’ouverture automatique, le retrait de l’accord, les destinations Waze distinctes et l’absence de noms injectés dans les URL. Les copies sauvegardées, le profil et les données des autres rubriques doivent rester identiques pendant la consultation.

Les essais automatisés d’ouverture externe utilisent une destination simulée. La livraison ajoute une vérification du parcours sur l’aperçu publié et une revue visuelle ; ces résultats sont consignés dans le suivi. Ils ne constituent pas un essai de guidage sur téléphone physique ni un déplacement réel. Les applications natives Google Maps et Waze restent à vérifier sur les appareils concernés.

## Sources

[Google Maps — Maps URLs](https://developers.google.com/maps/documentation/urls/get-started) · [Waze — liens de navigation](https://developers.google.com/waze/deeplinks) · [Leaflet 1.9.4 — référence](https://leafletjs.com/reference-1.9.4.html) · [OpenStreetMap — politique des tuiles](https://operations.osmfoundation.org/policies/tiles/). Documentation consultée le 22 novembre 2026. Aucun fournisseur, abonnement, clé visiteur ni service payant ajouté.
