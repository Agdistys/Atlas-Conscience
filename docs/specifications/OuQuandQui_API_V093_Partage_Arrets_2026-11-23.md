# V093 — Partage des frais des parcours à plusieurs arrêts

23 novembre 2026 · ARR-MULTI-06 · ARR-06, COV-05 et CAL-05/06/07 du [cahier V5](OuQuandQui-Cahier-des-Charges-V5-2026-09-18.md). Complète les [frais partagés V013](OuQuandQui_API_V013_Covoiturage_2026-11-18.md), les [péages par portion V023](OuQuandQui_API_V023_Peages_Partages_2026-11-18.md) et les parcours [V090](OuQuandQui_API_V090_Budget_Arrets_2026-11-22.md), [V091](OuQuandQui_API_V091_Trajet_Arrets_2026-11-23.md) et [V092](OuQuandQui_API_V092_Horaires_Arrets_2026-11-23.md). Les sources, tarifs et anciennes éditions restent conservés.

## Parcours et groupe déclarés

Après confirmation d’un budget propre au parcours à plusieurs arrêts, « Répartir les frais de ce parcours » ouvre une nouvelle proposition. Elle concerne un conducteur sur tout le parcours et un seul groupe de zéro à huit passagers sur une portion continue. Aucun nombre n’est prérempli. Cette borne est une limite de saisie, sans qualification de la capacité réelle du véhicule ; les passagers prévus ne sont ni des places offertes ni des réservations.

La personne choisit deux étapes existantes dans leur ordre, ou utilise explicitement « Tout le parcours ». Lorsque des rencontres sont présentes, « Entre la prise en charge et la dépose » sélectionne leurs deux étapes. Les limites sont déclarées parmi les points déjà calculés ; elles ne déplacent aucun lieu, n’ajoutent aucun arrêt et ne prouvent pas un accès adapté à un embarquement. Le groupe conserve le même nombre de personnes sur cette portion.

Aucun montant, groupe ou affectation du trajet de référence n’est transféré. La préparation n’interroge aucun fournisseur et n’écrit ni la bibliothèque, ni le profil, ni le journal. Les noms des voyageurs et leurs coordonnées ne sont pas requis.

## Affectation des frais

Le carburant consommé du budget est réparti selon la distance de la portion commune. Les achats en station ne sont jamais ajoutés au coût du carburant consommé. La distance commune est la somme des portions routières entre les deux étapes choisies. Son rapport à la somme de toutes les portions est appliqué au coût exact du carburant du budget. Cette normalisation absorbe la tolérance existante entre somme des portions et distance globale du moteur : sélectionner tout le parcours donne exactement le carburant du budget, sans dépassement ni correction arbitraire d’un montant.

Chaque péage issu d’une grille forme un poste entier avec réseau et sens conservés. Un montant global de péages déclaré forme un seul poste. Stationnement, ferry et autres frais directs sont également des postes entiers. Les choix sont « Non attribué / traverse une limite », « Groupe sur la portion commune » et « Conducteur ». Chaque poste commence non attribué ; aucune affectation n’est déduite de sa proximité géographique.

Un péage qui traverse une limite de la portion commune ne reçoit aucun prorata kilométrique. Il reste non attribué tant que les données et la convention déclarée ne permettent pas d’affecter un poste entier. Un poste au montant inconnu ne peut être attribué. Zéro explicitement déclaré reste un montant connu, distinct d’un champ vide. La répartition ne corrige ni le passage déclaré ni la couverture du budget ; leurs limites restent applicables.

## Calcul et présentation

La base commune connue comprend le carburant consommé attribuable à la portion et les seuls postes entiers affectés au groupe. Les rapports d’entiers conservent les décimales sans arrondi intermédiaire. La base commune est arrondie une fois au centime. Pour n passagers, la proposition par passager est la partie entière de cette base divisée par n + 1. Le total passagers est n fois cette proposition ; le reste conducteur est le sous-total connu du parcours moins ce total. La somme des parts égale exactement les frais connus. Le conducteur conserve sa part, le reliquat d’arrondi et les frais hors portion commune.

Les frais non attribués restent provisoirement dans ce reste conducteur, sans être présentés comme des frais personnels définitivement convenus. Leur montant connu et leur nombre de postes sont affichés. Une répartition complète des postes renseignés exige un budget complet et tous les postes attribués. Un poste nul laissé non attribué conserve la demande d’examen.

Si aucune composante commune n’est connue, la contribution reste indisponible. Un montant commun connu nul reste nul, sans certifier l’absence de frais manquants. Zéro passager conserve les frais connus au conducteur. Les composantes inconnues et la couverture partielle ne deviennent jamais un total complet. La présentation montre périmètre, groupe, date, frais connus, base commune, proposition par passager, total passagers, reste conducteur et affectations.

Il s’agit d’une convention de simulation à convenir entre personnes, sans offre commerciale, consentement présumé des voyageurs, réservation ou paiement. Les montants ne deviennent pas des dépenses effectuées.

## Proposition, confirmation et validité

« Examiner la répartition » produit un aperçu sans modifier la préparation confirmée. Une case de relecture et une confirmation distinctes appliquent les hypothèses. Tout changement d’un champ retire la proposition et son acceptation. Annuler conserve la répartition antérieure. La préparation confirmée et le parcours adopté restent distincts : une nouvelle adoption est nécessaire pour changer la vue principale. L’enregistrement local est une action séparée.

La répartition est liée au budget exact, lequel est lui-même lié au tracé dirigé, à ses portions, à l’ordre des étapes, au calcul, aux hypothèses et aux horaires lorsqu’ils existent. La confirmation doit être postérieure à celle du budget et antérieure à la sauvegarde. Si un départ horaire est choisi, la date tarifaire doit correspondre à son jour de départ. Ce rapprochement ne certifie pas les dates réelles de passage, notamment lorsqu’un trajet traverse minuit.

La validité du budget est vérifiée avant préparation et confirmation. Une expiration tarifaire ou un recul de l’horloge retire les contributions actuelles et demande un réexamen ; les montants historiques restent conservés. Revenir aux anciennes dates ne réactive pas automatiquement une répartition invalidée. L’adoption et la sauvegarde contrôlent à nouveau ces conditions.

Confirmer un nouveau budget retire la répartition de cette préparation, avec indication dans le formulaire. Confirmer de nouveaux horaires retire ensemble budget et répartition. Modifier une copie et recalculer conserve l’ancienne préparation pendant le travail, puis produit une nouvelle copie sans ces confirmations. Les étapes, horaires et budgets des copies précédentes ne sont jamais réécrits.

## Format et copies historiques

Le format de parcours 4 ajoute un champ obligatoire `sharing`, nul ou contenant la version, la liaison au budget, la date de confirmation, le nombre de passagers, les indices de début/fin et les affectations des postes. Le champ `timing` est un objet validé lorsqu’un horaire a été confirmé, ou null si aucun horaire n’a été établi. Cette absence permet de prolonger un budget de format 2 sans inventer de départ ni modifier sa liaison. Le budget reste obligatoire dans la structure, éventuellement nul après modification ; une répartition non nulle exige un budget.

Les collections 4 lisent les formats 1 à 4. Lire ne migre ni ne réécrit les copies. Une collection ne régresse pas lors d’un import ancien ou d’un effacement. Les formats futurs, portions invalides, affectations incohérentes, budgets altérés, dates incompatibles, champs obligatoires absents et modifications concurrentes sont refusés avant écriture. Les limites de dix parcours et 3 Mo restent applicables.

Le JSON conserve les hypothèses et sources du budget ainsi que la répartition. Les montants sont recalculés à partir de ces données validées, sans champs monétaires dérivés modifiables indépendamment. La liaison n’authentifie pas un fichier : les données importées restent déclaratives. La lecture historique conserve la proposition datée, même si une grille n’est plus actuelle ; préparer un nouveau partage exige une copie recalculée et un nouveau budget.

Le GPX et les liens de navigation conservent leurs points sans transmettre de contributions. Le journal ne reçoit ni voyageurs, ni répartition, ni dépense automatiquement. Aucune publication de coordonnées, création de compte, synchronisation ou nouvelle source n’est ajoutée.

## Critères d’Achèvement

Vérifier parts et reliquats, portions intermédiaires, distances décimales, zéro passager, frais absents et nuls, péages non attribués, montants partiels et conservation exacte du total. Tester les comptes et indices invalides, les dates, les liaisons au budget, l’expiration, l’annulation et le changement de contexte.

Vérifier confirmation et adoption distinctes, anciennes copies intactes, import explicite, versions futures ou altérées refusées, collection sans régression et conflit de stockage. Contrôler les exports, l’absence de requête de données et d’écriture implicite, quatre formats, clavier, texte agrandi et carte indisponible. L’inspection et la recette publiée doivent concerner le même commit ; les données de démonstration, les services réellement consultés et un déplacement physique restent distingués.

Les comparaisons multimodales du parcours successif et la qualification des horaires d’ouverture à chaque arrivée restent des compléments distincts. Aucun calcul national exhaustif de péages, guidage natif, paiement, capacité de véhicule ou trajet réel n’est attesté par ce lot.
