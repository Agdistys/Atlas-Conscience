# V090 — Budget des parcours à plusieurs arrêts

22 novembre 2026 · ARR-MULTI-03 · prolongement de [V088](OuQuandQui_API_V088_Arrets_Successifs_2026-11-22.md) et [V089](OuQuandQui_API_V089_Carte_Navigation_Arrets_2026-11-22.md). Rattachement : ARR-06, CAL-06/07, PEA-01/02/04/05/06/07/08/09, MEM-01 et PRO-04 du [cahier V5](OuQuandQui-Cahier-des-Charges-V5-2026-09-18.md). Les éditions, anciennes préparations et rubriques de stockage sont conservées.

## Préparer puis confirmer un budget

Après confirmation d’un parcours de deux ou trois stations, « Préparer le budget de ce parcours » ouvre une saisie distincte. La date prévue, les péages, le stationnement, le ferry et les autres frais directs concernent ce seul aller simple. Le carburant consommé utilise la distance complète, la consommation et le prix de référence du parcours confirmé. Modifier ces hypothèses passe par une copie et un nouveau calcul.

Aucun montant du trajet principal ni d’un budget précédent n’est repris. « Examiner le budget » présente une proposition sans modifier le budget confirmé ou les sauvegardes. Une confirmation explicite applique la proposition ; l’enregistrement d’une nouvelle copie reste une action distincte. Une annulation préserve le dernier budget confirmé. Ni la saisie, ni les grilles, ni l’examen n’envoient de requête ou n’ajoutent un déplacement au journal.

## Coût du carburant et frais inconnus

Le coût consommé suit la formule distance en kilomètres × consommation aux 100 kilomètres ÷ 100 × prix de référence. Les achats aux stations restent visibles à part et ne sont jamais ajoutés à cette consommation. Les quantités achetées et le prix de référence ne sont pas assimilés à des mesures réelles.

Champ vide : montant inconnu. Zéro saisi : frais nul déclaré. Le budget présente le sous-total des postes connus tant qu’un prix de référence, un péage nécessaire ou un autre poste manque. Une couverture partielle des péages ne produit jamais de total complet. Les frais sont bornés à 100 000 euros par poste ; la saisie monétaire accepte au plus deux décimales, avec point ou virgule.

Le calcul du carburant et son addition aux montants en centimes utilisent des rapports d’entiers, sans arrondi intermédiaire. L’arrondi final au centime est effectué une seule fois. Le total porte sur les postes renseignés pour le véhicule ; il ne comprend ni amortissement, ni répartition entre voyageurs, ni coûts non déclarés dans ce périmètre.

## Quatre façons de renseigner les péages

« Montant inconnu » conserve une valeur absente. « Montant renseigné » exige une référence ou une explication et permet une couverture partielle ou complète déclarée. « Aucun péage » est une déclaration explicite à confirmer avec le budget ; une option d’évitement ou une liste vide ne l’active jamais automatiquement. « Examiner les grilles disponibles » donne accès aux réseaux et ouvrages déjà présents dans l’application.

Les grilles APRR/AREA, BPNL, Pont de Normandie et Pont de Tancarville conservent leurs tarifs, sources et périodes déjà qualifiés. La sélection indique le réseau, la classe déclarée, la date et les gares d’entrée/sortie, ou l’ouvrage pour un passage unique. Un tarif absent, une classe non qualifiée, une paire directionnelle absente ou une date hors période empêche l’ajout. Aucune moyenne au kilomètre ni qualification de véhicule n’est substituée à un tarif indisponible.

Chaque ajout exige la vérification du passage, du sens, de la classe, de la date et de l’absence de recouvrement avec un autre paiement. Dix passages ou tronçons au maximum ; un doublon exact est refusé. L’absence de recouvrement entre deux tronçons différents reste déclarative. La couverture complète est une confirmation séparée. Ajouter, retirer ou changer la date, la classe ou la méthode retire cette confirmation ; les changements de contexte tarifaire retirent les lignes précédentes.

Les noms de gares et les passages sont conservés avec les montants en centimes, la classe, la date et les références de source. La proximité géographique d’un ouvrage ne prouve pas qu’il est emprunté. La couverture nationale reste partielle. Plein tarif seulement, sans abonnement ni réduction. Aucun nouveau fournisseur ou tarif n’est introduit dans ce lot.

## Rattachement et validité

Le budget conserve une représentation exacte du calcul auquel il est attaché : géométrie dirigée, portions, ordre et coordonnées des étapes, paramètres de routage, date du calcul, carburant et hypothèses. La validation vérifie cette concordance avant l’application, l’import et la conservation. Renommer une préparation ou lui attribuer un nouvel identifiant lors de sa sauvegarde ne modifie pas son parcours.

Modifier une copie et recalculer produit une préparation sans ancien budget. L’ancien parcours confirmé reste conservé pendant l’édition ; une erreur ou une annulation ne le remplace pas. L’interface distingue le budget de cette référence de celui du nouvel aperçu.

Les lignes tarifaires sont rapprochées des grilles actuelles par réseau, passage ou noms de gares non ambigus, classe et date. Un montant ou une source modifiés, une période dépassée ou un recul de l’horloge retire le total actuel et bloque une nouvelle sauvegarde présentée comme actualisée. Revenir à une ancienne date ne réactive pas implicitement ce budget. Une nouvelle préparation et une confirmation sont nécessaires. Le contrôle intervient aux actions de validation, au retour dans la fenêtre et périodiquement pendant la consultation ; l’horloge de l’appareil demeure la référence locale.

## Copies, import et export

Une copie contenant un budget utilise le format de parcours 2 et une collection 2, dans la même rubrique locale que les parcours successifs existants. Les parcours 1 restent lisibles au sein des collections 1 ou 2. Une collection 2 ne revient pas au format 1 après effacement ou import d’anciens parcours. Aucun changement du profil, du journal ou des autres collections.

La simple lecture conserve les copies d’origine sans migration ni service interrogé. Un budget enregistré est affiché comme historique, avec ses montants, hypothèses, couverture et sources ; préparer une estimation actuelle exige de modifier une copie et de recalculer. Un budget dont les tarifs ne sont plus proposés reste lisible comme historique.

Le JSON du parcours ou de la collection conserve le budget et ses références. L’import garde son aperçu et sa confirmation de remplacement ; versions futures, budgets incomplets, montants invalides, dates incohérentes et rattachements incorrects sont refusés sans écraser les données locales. Dix parcours et 3 Mo au maximum restent les bornes de la collection. La référence exacte du calcul augmente la taille d’un parcours avec budget ; le plafond est contrôlé avant l’écriture. Une modification concurrente ou une copie locale illisible conserve la protection existante.

Les fichiers sont déclaratifs. La concordance entre un budget et le parcours contenu dans le même fichier n’authentifie ni son auteur, ni un passage réel, ni un paiement. Le GPX reste un export de points et de tracé ; les montants et sources budgétaires sont conservés dans le JSON, pas dans le guidage externe.

## Réception et limites

Les contrôles couvrent inconnus et zéros, consommation distincte des achats, arrondi exact, couverture partielle, références manquantes, grilles directionnelles, dates/classes, doublons, sources modifiées, expiration et recul de l’horloge. Ils vérifient le rattachement à la géométrie et aux hypothèses, les anciens formats, les imports futurs ou incohérents et l’absence de réactivation automatique.

Les scénarios navigateur vérifient proposition sans effet, confirmation, annulation, modification du parcours, sauvegarde et import, consultation historique locale, texte agrandi et clavier. L’inspection complète et la recette sur l’aperçu publié portent sur le commit livré ; leurs preuves sont consignées dans le suivi central. Les montants déclarés lors de la recette restent des hypothèses de démonstration, sans preuve de péage emprunté ou de dépense effectuée.

Les coûts restent propres à la préparation à plusieurs arrêts. L’adoption sur la carte principale, les frais partagés et la comparaison avec les autres modes restent des intégrations distinctes. Aucun achat, abonnement, nouveau service ou élargissement de la qualification caravanes/poids lourds n’est réalisé.

## Références conservées

[Budgets routiers V084](OuQuandQui_API_V084_Budgets_Routiers_2026-11-22.md), [péages dans les budgets V085](OuQuandQui_API_V085_Peages_Budgets_2026-11-22.md) et [ponts de Normandie/Tancarville V087](OuQuandQui_API_V087_Ponts_Normandie_Tancarville_2026-11-22.md). Les sources, licences et périodes figurent dans ces qualifications et dans chaque ligne tarifaire de la préparation.
