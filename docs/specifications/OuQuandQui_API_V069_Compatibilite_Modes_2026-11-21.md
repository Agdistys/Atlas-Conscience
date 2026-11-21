# V069 — Compatibilité des modes de déplacement

QUA-COMPATIBILITE-MODES-01 · 21 novembre 2026. Complète QUA-01/02/12, UX-02/05 et TC-07 du [cahier V5](OuQuandQui-Cahier-des-Charges-V5-2026-09-18.md), le [socle de compatibilité V061](OuQuandQui_API_V061_Compatibilite_2026-11-20.md) et les [accès aux modes V068](OuQuandQui_API_V068_Acces_Modes_2026-11-21.md). Les éditions précédentes restent conservées.

## Périmètre requis

La recette Firefox/WebKit passe de vingt à quarante scénarios par configuration. Les vingt parcours routiers de V061 restent obligatoires. V069 ajoute vingt parcours existants concernant les accès communs, la marche, le vélo personnel, le collectif Grenoble et les vélos partagés Lyon. Les assertions fonctionnelles sont partagées avec la recette Chromium ; aucun scénario parallèle simplifié n'est créé.

| Famille ajoutée | Scénarios par configuration | Comportements exigés |
|---|---:|---|
| Accès communs | 5 | Cinq entrées avant les réglages du véhicule ; ouverture sans appel ni écriture ; commandes accessibles à texte agrandi ; trois fenêtres ouvertes au clavier avec lieux communs et retour du focus. |
| Marche | 2 | Profil de calcul et cache distincts de la voiture ; préférences automobiles préservées ; sauvegarde, export et reprise cohérents. |
| Vélo personnel | 3 | Calcul volontaire sans voiture préalable, limites géographiques ; annulation des résultats tardifs ; reprise avec nouveau calcul sans géocodage superflu. |
| Collectif Grenoble | 5 | Recherche autonome, lieux confirmés, données incomplètes et hors pilote ; annulation du géocodage ; sauvegarde et lecture hors réseau ; focus conservé lorsqu'un horaire devient historique. |
| Vélos partagés Lyon | 5 | Trois étapes marche–vélo–marche et choix explicites ; stations manquantes, identiques ou hors pilote ; annulation ; reprise avec catalogue confirmé et navigation au clavier. |

La liste exacte figure dans `compatibilityModeCases`, dans `tests/compatibility-contract.mjs`. `compatibilityRoadCases` conserve le socle précédent. La configuration sélectionne ces scénarios dans leurs fichiers existants, sans modifier leurs assertions.

## Matrice et contrôle de publication

Quatre configurations restent requises : Firefox et WebKit, chacun à 1440 × 900 et 390 × 844 pixels CSS, soit **160 essais**. Certains scénarios contrôlent aussi le paysage et le texte doublé. Playwright 1.64.1 reste verrouillé avec son image GitHub correspondante ; les versions réellement démarrées sont relevées dans chaque preuve.

Le contrôle exige un unique succès par scénario et configuration, sans nouvelle tentative, pour le même commit. Une ancienne preuve ne couvrant que les vingt cas routiers ne suffit plus. Un test de ce contrôle vérifie explicitement le refus de cette ancienne matrice et de chacun des nouveaux cas manquants. Un échec, une absence de moteur, une interruption ou un scénario ignoré reste bloquant. La limite globale de douze minutes est conservée.

La preuve complète conditionne l'inspection Chromium, la construction de l'aperçu et son assemblage à blanc. Le programme de publication présent sur la branche principale reçoit seulement l'artefact issu de ces contrôles réussis ; il vérifie ensuite l'identité de l'aperçu. Ce programme n'est pas modifié par V069. Les preuves des anciennes éditions ne sont pas réécrites.

## Correction issue de la recette

La première exécution distante a réussi 156 essais sur 160. WebKit a détecté le même défaut dans deux parcours de vélos partagés, sur les deux formats : le bouton « Charger / actualiser les stations » conservait son fond natif gris clair avec un texte blanc, pour un contraste mesuré de 1,81:1. Firefox ne signalait pas ce défaut.

Le bouton adopte désormais la classe visuelle commune aux actions secondaires : fond sombre, texte clair et bordure définis par la charte. Ses fonctions, son nom accessible et son état de chargement restent identiques. Le contrôle de contraste et les quatre scénarios concernés sont conservés sans exception ; l'ensemble de la matrice doit réussir avant publication. Les empreintes de l'interface PWA sont actualisées avec ce changement.

## Vérification et limites

Les résultats datés sont conservés dans `quality/compatibility-modes`, le rapport publié et le journal de livraison. La qualification définitive appartient au commit contrôlé, pas au présent document. La préparation locale a réussi 484 contrôles et 7 tests d'assemblage ; la liste de recette contient exactement 160 essais. Le démarrage local de Firefox et WebKit a échoué, leurs exécutables associés à cette version étant absents. La tentative Firefox n'a donc validé aucun parcours. La recette complète utilise le banc GitHub existant, et son résultat doit être vérifié avant la livraison.

Les sources des scénarios automatiques sont simulées ; elles vérifient le comportement de l'application, pas la disponibilité d'un service réel. Après publication, les métadonnées, les fichiers servis et les preuves sont contrôlés, puis un parcours entre lieux publics est consulté avec les services configurés. Cette consultation réelle reste distincte d'un déplacement effectué.

Ces moteurs épinglés et fenêtres redimensionnées ne qualifient ni Safari commercial, ni Safari iOS, ni les versions stables actuelles de tous les navigateurs, ni un appareil physique ou un lecteur d'écran. La couverture géographique, les fournisseurs, les formats de données et les fonctionnalités de l'application restent ceux des éditions antérieures. V069 élargit la vérification obligatoire avant publication.
