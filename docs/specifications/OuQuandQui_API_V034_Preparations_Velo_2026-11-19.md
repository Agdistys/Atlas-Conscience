# V034 — Préparations vélo enregistrées

Lot DOU-VELO-02 · 19 novembre 2026. Complète PAR-05, OFF-02, PRO-04/05 et ERR-01 du [cahier V5](OuQuandQui-Cahier-des-Charges-V5-2026-09-18.md), à partir des [itinéraires vélo V033](OuQuandQui_API_V033_Itineraires_Velo_2026-11-19.md). Les [préparations routières](OuQuandQui_API_V012_Preparations_Trajets_2026-11-18.md) et [collectives V029](OuQuandQui_API_V029_Preparations_Collectives_2026-11-18.md) restent distinctes. Versions antérieures conservées.

## Parcours disponible

Après un calcul vélo réussi, « Enregistrer ce parcours vélo » ouvre un formulaire dans « Mes trajets → À vélo ». La préparation comporte un nom, les lieux confirmés, le repère de distance souhaité et une copie datée du résultat. Le formulaire exige une confirmation ; l'ouverture seule n'écrit rien. Un nom équivalent ou les mêmes lieux et critères déclenchent une confirmation supplémentaire de doublon.

Les préparations peuvent être retrouvées après rechargement, consultées, renommées et supprimées. La fiche présente les dates d'enregistrement et de consultation du calcul, le tracé conservé sous forme de schéma local, la distance, la durée estimée, les voies et les portions annoncées vélo à la main. Les conditions actuelles restent inconnues. Le renommage conserve les dates et le calcul. La suppression est volontaire et confirmée.

La consultation de la fiche ne fait aucun appel de calcul, de géocodage ou de carte. Elle fonctionne sans réseau dans une page déjà chargée. Le schéma conserve la géométrie reçue, sans échelle ni fond de carte ; il ne remplace pas une nouvelle préparation avant le départ. Ce lot ne garantit pas un démarrage à froid hors connexion de l'aperçu.

« Préparer à nouveau ce trajet vélo » prépare les lieux mémorisés et le repère de distance, sans transmettre de demande à l'ouverture. Un second geste explicite lance un nouveau calcul vélo, même si un résultat précédent se trouve en mémoire. Les coordonnées confirmées sont réutilisées sans géocodage. Le trajet principal et ses champs restent inchangés. Une panne ou un fournisseur désactivé ne substitue ni l'ancien tracé ni une route automobile. La fiche enregistrée reste disponible.

## Conservation et échanges

Stockage local au navigateur, sans compte ni synchronisation entre appareils : `dragonroute.cycling-prepared.v1.` suivi du périmètre existant, public ou aperçu. Aucune migration des préparations routières ou collectives, du profil ou du journal. Les calculs ne deviennent pas des déplacements effectués.

Schéma versionné `dragonroute-cycling-preparations`, version 1, au maximum 20 fiches et 2 Mo UTF-8. Chaque fiche conserve :

- identité et nom, date d'enregistrement ;
- départ et arrivée avec libellé et coordonnées ;
- limite personnelle en kilomètres, ou `null` si non renseignée ;
- source déclarée `fossgis-bike`, profil `bicycle`, date du calcul consulté ;
- géométrie, mètres, secondes, étapes vélo/vélo à la main et éventuelle version des données routières.

Le téléchargement JSON porte uniquement sur les préparations vélo. Le GPX de la fiche reprend ses points et sa date de calcul d'origine, sans actualisation, altitude ou horaires de passage inventés. L'attribution FOSSGIS/OpenStreetMap reste visible.

L'import vérifie le fichier avant tout remplacement. Un aperçu indique les lieux, dates, critères et métriques ; une copie de la liste existante peut être téléchargée avant confirmation. L'import remplace explicitement la seule liste vélo, y compris lorsqu'un fichier vide est confirmé. L'annulation conserve les données. Une lecture de fichier achevée après fermeture ou changement de rubrique est ignorée.

La validation technique d'un import n'authentifie pas son origine. Les sources et dates importées restent déclaratives. Les champs étrangers au schéma ne sont pas conservés ; les textes restent inertes.

## Intégrité et erreurs

Les lieux, bornes, profil, géométrie et sommes métriques repassent par le validateur vélo V033. Le schéma ne peut pas transformer un itinéraire automobile en parcours cyclable. Dates ISO normalisées ; calcul postérieur à l'enregistrement refusé. Identifiants uniques, noms limités à 80 caractères. Limite facultative numérique de 0,1 à 300 km, jamais zéro pour une donnée absente. La distance vélo à la main est recalculée à partir des étapes.

Deux contrôles de taille : fichier brut UTF-8 avant analyse, collection canonique exportable avant écriture. Géométrie de 2 à 25 000 points et au maximum 1 500 étapes par fiche, avec les contrôles V033 de continuité, d'extrémités, de distances et de durées. Version inconnue, doublon d'identifiant, coordonnées invalides, profil étranger et fichier illisible sont refusés sans écraser la liste.

Un stockage local invalide ou d'une version future reste protégé. Lorsque son contenu est lisible, son original exact peut être téléchargé ; son effacement exige une action explicite. Un accès bloqué ou un quota saturé produit un message et conserve le formulaire. Une modification par un autre onglet est détectée avant écriture ou effacement et empêche d'écraser la version concurrente. Cette garde n'est pas une base transactionnelle entre processus.

## Recette

Douze contrôles du modèle : aller-retour canonique, dates, versions et identités, profils et lieux, géométrie et métriques, limite inconnue, portions à pied, champs étrangers, taille brute et exportable, doublons et GPX exact. Fixture de sauvegarde construite à partir du tracé public lyonnais V033 ; noms, identifiants, dates et limite de test explicitement synthétiques dans sa notice.

Treize scénarios navigateur sur quatre formats, avec données simulées : confirmation et consultation sans réseau, reprise fraîche sans géocodage, renommage/doublon/suppression, import/annulation/copie préalable, contenu hostile, fichiers refusés, version future protégée, quota, conflit réel entre deux pages, import tardif, panne, service désactivé, clavier à trois rubriques, export GPX, isolation des aperçus et limite de vingt fiches. Régression des préparations existantes et du calcul vélo. Captures ordinateur/mobile et contrôles automatiques d'accessibilité, sans certification ni test de téléphone physique.

La suite complète, le commit publié et la recette sur services réels sont consignés séparément dans `quality/cycling-saved` et l'état du développement. Aucun appel payant, nouveau fournisseur ou serveur ajouté. Les conditions de l'essai gratuit modéré FOSSGIS définies en V033 restent applicables ; le présent lot ne qualifie ni commercialisation, ni terrain, ni VAE, ni location avec premier/dernier kilomètre. DOU-04 reste à développer.
