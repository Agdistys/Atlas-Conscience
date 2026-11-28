# OùQuandQui — V083 — Budgets renseignés pour les mêmes voyageurs

Édition du 22 novembre 2026. Lot BUD-MODES-DECLARE-01. Exigences BOU02, BOU07, CAL06, CAL07, TC05 et DAT01. Complète les comparaisons de modes V078 et leur conservation V079. Les budgets des préparations historiques et les calculs de péages conservent leurs périmètres distincts.

## Parcours et périmètre

Depuis une recherche collective avec comparaison des autres modes, ouvrir « Comparer les empreintes et les budgets », préciser le groupe, puis « Renseigner les budgets du groupe ». Les modèles carbone restent facultatifs pour comparer les frais et le temps. Le périmètre collectif reste celui du pilote disponible ; ce lot n’étend pas sa couverture.

Le budget porte sur le même groupe de 1 à 9 voyageurs, les mêmes lieux, la même date et la même intention de départ ou d’arrivée, pour un aller simple. Chaque option possède ses propres montants. Les postes sont : billets ou location, carburant consommé, péages et passages payants, stationnement, autres frais directs. Les sommes couvrent le groupe entier ; elles ne sont pas multipliées automatiquement par le nombre de personnes.

Le périmètre exclut achat, entretien, assurance et amortissement du matériel. Il ne constitue pas un coût exhaustif de possession, un devis, une réservation ou une preuve de disponibilité. Un abonnement déjà payé, une gratuité, un tarif réduit ou un partage de frais doivent être décrits dans les hypothèses déclarées. Un poste déjà inclus dans un billet ou une location ne doit pas être ajouté une seconde fois.

## Origine des valeurs

Aucun tarif fournisseur n’est automatiquement relié à cette comparaison. Une somme saisie, même recopiée depuis un tarif consulté, reste une déclaration. La note facultative de 1 000 caractères accueille la date du tarif, la référence et les hypothèses ; elle n’atteste pas leur vérification.

Chaque poste accepte de 0 à 100 000 euros, avec au plus deux décimales et une virgule ou un point. Une case vide reste inconnue. Zéro est une déclaration explicite d’absence de frais. « Déclarer aucun frais pour cette option » remplit les cinq postes à zéro, après action volontaire, puis exige leur relecture et confirmation. Aucun zéro n’est déduit du mode de déplacement.

Une option sans montant est inconnue. Une option avec certains postes renseignés possède un sous-total partiel. Le budget est complet dans ce périmètre uniquement lorsque les cinq postes sont renseignés, y compris les éventuels zéros déclarés. La date de confirmation est conservée avec chaque déclaration.

## Carburant consommé

Pour une option automobile disponible, le carburant peut être déclaré directement ou estimé localement. L’estimation utilise la distance de cette option, une consommation déclarée entre 1 et 100 L/100 km et un prix déclaré entre 0,001 et 10 euros par litre, avec au plus trois décimales. Aucune consommation ni aucun prix ne sont adoptés automatiquement depuis le profil ou une préparation.

Le total des occupants, conducteur compris, provient de l’hypothèse commune du véhicule. Il doit être compris entre le nombre de voyageurs comparés et 9. La part du groupe est : distance en kilomètres × consommation / 100 × prix par litre × voyageurs comparés / occupants. Il s’agit d’une répartition égale déclarée, sans validation de capacité du véhicule ni des accords entre occupants.

Le plein acheté n’est pas ajouté à ce montant : le carburant consommé et l’achat d’un stock restent distincts. Les calculs utilisent des rapports entiers exacts sur les décimales saisies, puis un arrondi final au centime, les demi-centimes étant arrondis vers le haut. Les autres postes, déjà exprimés en centimes, sont additionnés sans arrondi intermédiaire.

Modifier le prix ou la consommation retire l’estimation précédente de la saisie jusqu’à un nouveau calcul volontaire. Le passage au montant manuel est explicite et transforme sa provenance en déclaration. La formule et ses hypothèses restent lisibles dans le récapitulatif conservé et l’export.

## Relecture, contexte et confidentialité locale

Un seul éditeur d’option est ouvert à la fois. Appliquer et annuler restent distincts. Toute modification retire la confirmation précédente. L’application recontrôle également les valeurs réelles des champs lors de l’application, y compris si elles ont changé sans événement de saisie.

Une modification du groupe, des occupants, des lieux, de la date, de l’intention, des distances ou de l’admissibilité invalide les budgets pour le classement. Revenir à l’ancienne valeur ne les réactive pas. Les montants restent lisibles dans le panneau invalidé lorsque le comparateur reste ouvert ; « Commencer un nouveau budget » les remplace explicitement par une saisie vide pour le contexte courant. Un changement de recherche ou la fermeture du comparateur retire sa saisie courante.

La saisie et le classement n’ajoutent aucun appel fournisseur et n’écrivent rien dans le profil, les préparations ou le journal. La conservation exige l’enregistrement explicite de la comparaison figée. Aucun transfert à un autre mode ou une autre recherche n’est effectué.

## Tri brut et priorités

Le tri financier place d’abord les budgets complets des options admissibles, par montant croissant. Les options partielles, inconnues, historiques, exclues ou indisponibles restent identifiées hors classement. Deux budgets complets admissibles au minimum sont nécessaires pour une comparaison ; les égalités au centime sont conservées.

Le poids « Budget renseigné du groupe » devient disponible après ouverture du panneau des budgets. Il est initialement nul, comme les autres poids. Activer ce critère exclut les options dont le budget est incomplet. Le remettre à zéro permet de comparer les autres critères pour tout le groupe. Les contraintes impératives et l’admissibilité horaire restent prioritaires sur les scores.

Le gel et l’enregistrement sont bloqués pendant une saisie ou lorsque son contexte est invalidé. Une nouvelle déclaration retire les indices précédents et demande un nouveau gel. Les valeurs brutes, le tri financier et la pondération restent distincts ; aucun trajet n’est choisi automatiquement. La formule relative V078 demeure inchangée, avec des budgets au centime comme troisième critère facultatif.

## Conservation et échanges

La collection de comparaisons accepte désormais le format 2. Le format 1 reste lisible sans réécriture. La première sauvegarde explicite d’une comparaison avec budgets passe la collection au format 2 tout en préservant les anciens enregistrements et leurs valeurs. Supprimer une entrée ne rétrograde pas la collection. Une entrée ancienne exportée seule peut conserver le format 1 ; un export global conserve la version de la collection.

Le nom historique de l’emplacement local reste inchangé pour conserver l’accès aux données. Une ancienne application qui ne connaît pas le format 2 doit protéger cette collection, sans l’écraser. Les formats futurs ou incohérents restent protégés et leur original reste exportable. Les confirmations d’import, limites de taille, conflits d’onglet et erreurs de stockage gardent les règles V079.

Chaque budget conservé contient le périmètre, le groupe, la date et l’intention communes, les identités et distances des options, les cinq composantes, leur provenance déclarée ou estimée, les hypothèses du carburant, la note et la date de confirmation. Les totaux et les résultats pondérés sont recalculés à la validation ; un total incompatible avec ses composantes est rejeté. Un fichier auto-cohérent reste déclaratif : cette validation ne prouve ni son authenticité ni les tarifs renseignés.

Les exports JSON et texte conservent les montants, inconnus, sous-totaux, dates, formules et limites. Relire une comparaison historique ne relance aucun service et ne restaure pas automatiquement ses budgets dans la recherche courante.

## Vérification et limites de livraison

Les contrôles de modèle couvrent décimales, zéros, inconnus, arrondi exact, allocation du carburant, contexte commun, contraintes, égalités, formats 1 et 2 et altération des composantes. Les parcours navigateur couvrent saisie, confirmation, changements silencieux, annulation, invalidation, tri, pondération, migration volontaire, exports, import incohérent, clavier, petit écran et texte agrandi.

La qualification de la version publiée est consignée dans le rapport d’inspection de l’aperçu correspondant au commit. Les scénarios automatisés utilisent des données simulées identifiées ; la vérification publique distingue les itinéraires reçus des montants saisis pour la démonstration. Aucun tarif réel ou budget nul n’est déduit de ces essais. Les appareils physiques, la capacité réelle des véhicules et les règles commerciales des opérateurs restent hors de cette qualification.
