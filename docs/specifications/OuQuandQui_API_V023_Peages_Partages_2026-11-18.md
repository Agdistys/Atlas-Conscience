# OùQuandQui — Péages de la portion partagée

V023 · 18 novembre 2026 · COV-PEAGES-PARTAGES-01. Complète COV-04/05 du [cahier V5](OuQuandQui-Cahier-des-Charges-V5-2026-09-18.md), les [rencontres V022](OuQuandQui_API_V022_Rencontres_2026-11-18.md) et les [grilles V005](OuQuandQui_API_V005_Grilles_Peages_2026-11-17.md). Éditions antérieures conservées.

## Parcours

Après adoption des rencontres, « Covoiturage → Répartir les péages entre les portions » permet d’attribuer chaque tronçon déjà ajouté dans le budget APRR, AREA ou BPNL. Le lien « Choisir les péages dans le budget » ouvre le calculateur existant. Le tarif, la classe et la date restent visibles.

Quatre choix sont proposés : non attribué / traverse une rencontre ; avant la prise en charge ; avec les passagers ; après la dépose. Tout tronçon commence non attribué. Le choix porte sur le tronçon tarifaire entier. Si un tronçon traverse la prise en charge ou la dépose, son montant ne peut pas être découpé automatiquement : il reste non attribué tant que des tarifs appropriés ne permettent pas une attribution entière. Aucun prorata de distance ni rattachement par proximité d’un point sur la carte.

Les choix préparés ne changent pas les contributions avant la confirmation « J’ai vérifié les portions choisies, leur sens et l’absence de chevauchement entre les tronçons ». La couverture de tous les péages reste une confirmation distincte dans le budget. Il est possible de confirmer une affectation partielle ; les tronçons non attribués et la couverture incomplète restent explicitement signalés.

## Calculs

Les sommes sont calculées en centimes entiers : péages avant, communs, après et non attribués. Chaque tronçon figure dans une seule catégorie. Les doublons orientés restent refusés par le budget existant ; les chevauchements de tronçons ne sont pas détectés automatiquement et doivent être vérifiés par la personne.

Avec `n` passagers :

- Base commune connue = carburant consommé sur la portion commune, s’il est connu, + péages communs confirmés, s’ils sont attribuables.
- Proposition par passager = partie entière de `base_commune_en_centimes / (n + 1)`.
- Total passagers = `n × proposition` ; zéro passager laisse tous les frais connus au conducteur.
- Reste conducteur sur frais connus = frais connus du trajet entier − total passagers. Il conserve le carburant hors portion commune, les péages avant/après et le reliquat. Les péages non attribués restent provisoirement dans ce reste, sans devenir des frais définitivement personnels.

Une proposition complète requiert un carburant commun connu, une couverture des péages déclarée complète, aucun tronçon non attribué et la confirmation des affectations. Sinon, seul le montant connu peut être présenté, comme partiel. Une affectation non confirmée ne répartit aucun péage. Une absence de péage confirmée par le service sur tout le trajet permet toujours zéro sur la portion commune. Un devis positif non localisé n’est pas partagé par approximation.

Carburant absent et péages communs connus permettent une contribution sur ces seuls péages, indiquée incomplète. Si aucun coût commun n’est connu, la contribution reste indisponible. Un montant commun connu nul ne certifie pas une absence de frais manquants. Ces calculs restent une convention de simulation à convenir, pas une offre commerciale, une règle de tarification ou un paiement.

## Validité et changements

Les affectations sont liées au tracé et à ses rencontres, à l’arrêt éventuel, au départ prévu, à la classe et à la date des tarifs. Chaque tronçon conserve son réseau, son sens entrée → sortie, son montant et sa date. Changer ce contexte retire les affectations ; revenir aux anciennes valeurs ne les restaure pas. Une date de péages différente du départ prévu ou une grille expirée bloque l’affectation et conserve les inconnus.

Ajouter un tronçon conserve les choix des tronçons existants, initialise le nouveau à non attribué et retire la confirmation. Retirer un tronçon retire son affectation. Modifier la couverture globale retire aussi la confirmation d’affectation. Modifier le nombre de passagers ou le prix du carburant recalcule les frais et invalide le texte partagé ; cela ne déplace pas les péages.

« Effacer les affectations » conserve les péages du budget. Changer les rencontres, choisir/retirer un arrêt ou recalculer le trajet retire les péages dépendants et leurs affectations. Un devis automatique, uniquement dans les tests simulés tant que son service reste désactivé, remplace les tronçons déclarés et ne reprend jamais leurs affectations.

## Partage et conservation

Le récapitulatif indique les péages communs, personnels, non attribués et les limites de couverture. Les adresses des rencontres, coordonnées et noms de gares ne sont pas recopiés automatiquement dans ce texte. Une modification d’affectation ou de confirmation invalide le texte préparé et le consentement à copier, même si la somme ne change pas.

Affectations et confirmation restent uniquement dans la session. Aucun stockage, import, export ou transmission implicite n’est ajouté. Les préparations format 5 restent inchangées : leur reprise demande de recalculer les rencontres, reconstituer les péages et confirmer à nouveau leur répartition. Profil, journal et anciens formats sont préservés. Aucun nouveau fournisseur, compte, abonnement, serveur ou appel tarifaire distant.

## Vérification et limites

Les contrôles couvrent confirmation, couverture, montants inconnus, conservation des centimes, zéro passager, sommes incompatibles et affectations invalides. Les parcours navigateur vérifient budget mixte, ajout/retrait, effacement, changement de contexte, expiration, texte partagé, préparation/reprise, navigation clavier, absence de stockage implicite et remplacement par un devis simulé. Les preuves exécutées, captures et recette de l’aperçu exact sont consignées dans l’état de développement.

La répartition est déclarative : elle ne démontre ni passage réel, ni absence de chevauchement, ni validité des lieux d’arrêt. Un seul groupe, avec une prise en charge et une dépose intermédiaires distinctes, demeure le périmètre V022. Aucun calcul automatique de tous les péages français, aucune réservation ni nouvelle garantie pour les caravanes/poids lourds. Les tarifs et leur qualification restent ceux des éditions précédentes.
