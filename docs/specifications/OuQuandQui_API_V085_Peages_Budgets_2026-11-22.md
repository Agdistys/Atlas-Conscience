# OùQuandQui — V085 · Péages dans les budgets comparés

## Besoin et portée

Exigences concernées : CAL-06, CAL-07, BOU-02, BOU-07 et DAT-01, en continuité des grilles PEA-01 à PEA-09. Proposer dans le budget automobile les péages déjà examinés pour ce même aller simple, avec leurs sources, leur date et la part des voyageurs comparés. Cette extension du panneau de [V084](OuQuandQui_API_V084_Budgets_Routiers_2026-11-22.md) utilise uniquement les grilles APRR/AREA et le passage BPNL déjà embarqués. Aucun nouveau fournisseur, devis automatique ou abonnement.

## Parcours et confirmation

Dans le budget du trajet, choisir les tronçons, la classe tarifaire et la date, puis déclarer la couverture connue. Ouvrir la comparaison des modes calculés, préciser le même départ, les voyageurs et le total des occupants, conducteur compris. Dans le budget automobile, « Examiner les péages du trajet » prépare une proposition sans modifier le poste. La proposition expose le montant véhicule, la fraction du groupe, chaque tronçon, les sources et les périodes tarifaires.

La confirmation porte sur le passage, le sens, la classe, la date, la couverture, l’absence de chevauchement entre tronçons, l’occupation constante et l’absence de double compte. « Utiliser cette part de péages » remplit ensuite la saisie ; la confirmation du budget entier reste nécessaire. Un poste déjà renseigné, même à zéro, ne peut pas être remplacé par cette action. Le retour à un montant saisi est explicite ; annuler conserve le dernier budget appliqué.

L’ouverture, la proposition, la saisie et les classements n’effectuent aucune requête ni écriture de profil, n’adoptent aucun trajet sur la carte et ne déclarent aucun déplacement effectué. Seule la conservation volontaire de la comparaison écrit dans sa collection locale.

## Identité du trajet

La proposition exige l’égalité exacte du tracé dirigé, des coordonnées de départ et d’arrivée, de la distance, de la durée, du moteur, de ses paramètres et de la version de ressource disponible entre le trajet portant les péages et l’option automobile comparée. Deux noms de ville identiques, une proximité géographique ou une durée ressemblante ne suffisent pas. Un autre tracé rapide ou court est refusé. Les arrêts en station et les rencontres excluent ce transfert : le comparateur porte sur un trajet direct.

Les départs datés doivent correspondre, et la date du péage doit être celle du départ en Europe/Paris. Toutes les lignes doivent employer la classe choisie et leur montant exact dans la grille locale, avec une période de consultation encore admissible. Une classe, une date ou un tarif incohérent bloque la proposition. Les périmètres et contraintes de V084 restent appliqués avant tout indice.

L’égalité du tracé ne prouve pas que les gares déclarées sont effectivement traversées. Le passage, le sens, la classe applicable et la couverture restent à vérifier. Aucune largeur de chaussée, accessibilité caravane/poids lourd ou couverture nationale des péages n’est qualifiée par ce lot.

## Répartition et inconnus

Le groupe compte de un à neuf voyageurs. Le total des occupants est saisi séparément, de un à neuf et au moins égal au groupe. La part proposée est la somme des tronçons en centimes multipliée par le nombre de voyageurs du groupe, divisée par les occupants constants. Aucun prorata kilométrique ou découpage par rencontres n’est appliqué. Les règles de partage segmenté du covoiturage restent distinctes.

Les fractions du carburant consommé et des péages sont additionnées avant l’arrondi final au centime. Leurs effectifs d’occupants doivent être identiques. Le montant du plein acheté n’est pas ajouté au carburant consommé. Les postes manuels restent des déclarations du groupe, sans détection automatique d’un même coût déjà inclus dans un autre poste.

Une couverture partielle conserve son sous-total connu, même nul, mais laisse les péages manquants inconnus : le budget demeure hors du classement financier. Une couverture complète est une déclaration, pas une certification cartographique ou tarifaire. Les autres frais directs doivent toujours être renseignés pour comparer un budget complet dans le périmètre de V083.

## Changement et validité

Le lien avec les sources est réexaminé avant application, classement et conservation, lors des changements du budget du trajet, ainsi qu’au contrôle périodique et au retour dans la page. Une modification du trajet, des sources, de leur couverture, de leur classe, de leur date ou du groupe retire le budget concerné du classement. Revenir aux anciennes valeurs ne réactive pas implicitement ce budget. Il faut commencer un nouveau budget dans le contexte actuel.

Renseigner les autres modes conserve ce lien automobile. Une proposition périmée est retirée ; une modification pendant le calcul de son empreinte est refusée. Une valeur modifiée dans un champ en lecture seule ou après confirmation ne peut pas être appliquée sans contrôle. L’horloge de l’appareil reste la référence locale, avec les limites de V084.

## Conservation et formats

Un péage proposé conserve la date, la classe, les occupants, la couverture déclarée, l’heure de relecture et les lignes tarifaires : réseau, type de passage, entrée/sortie, montant véhicule, titre et URL de source, dates d’effet, de consultation et de fin de consultation. La référence du trajet conserve moteur, métriques, dates de calcul/comparaison, version de ressource et empreinte SHA-256 de son identité exacte. Cette empreinte est une référence historique ; elle n’authentifie pas un fichier importé.

Les budgets contenant cette composante utilisent le format interne 3, origine `road`, et la collection format 4. Les budgets internes 1 et 2 ainsi que les collections 1 à 3 restent lisibles avec leurs valeurs et sources. Aucune migration à la simple lecture ; aucune rétrogradation d’une collection 4 devenue vide. Le format futur 5 est refusé.

Les imports contrôlent les clés, dates possibles, périodes, montants entiers bornés, doublons, effectifs, mode, composante, distances et résultats recalculés. Les sources doivent être des URL HTTPS sans identifiants. Les limites de vingt options, dix tronçons, cent mille euros par poste déclaré ou somme de grilles, deux cent mille caractères par fiche et deux mégaoctets par collection restent bornées. Une archive datée peut être relue sans demander un tarif actuel ; elle ne devient pas une estimation actualisée. JSON et texte conservent les sources et les hypothèses, sans authentifier les déclarations importées.

## Recette et limites de preuve

Les cas couvrent proposition sans effet, confirmation, ancien montant, annulation, part du groupe, réseaux mixtes, fractions avant arrondi, couverture partielle et zéro connu, date/classe incohérentes, variante différente, source modifiée, expiration, conservation format 4 et anciens formats. Le clavier, le texte agrandi et les quatre formats de la recette sont contrôlés ; trois parcours rejoignent la matrice Firefox/WebKit.

Les premiers essais ont révélé que l’application d’un budget d’un autre mode effaçait le suivi de la source automobile. Ce suivi est désormais conservé jusqu’à la modification du poste automobile ; le scénario de changement de couverture après saisie de la marche vérifie son invalidation durable. L’inspection complète du commit et la vérification de son aperçu restent nécessaires avant livraison.

Les parcours simulés, les parcours reçus des services publics et les passages tarifaires déclarés sont des preuves distinctes. Une recette de transfert ne certifie ni le passage réel par une gare ni le prix finalement facturé. Aucun appareil physique ou nouveau service public de péages n’est qualifié.
