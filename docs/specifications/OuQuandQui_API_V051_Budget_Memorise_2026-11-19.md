# OùQuandQui — Budget mémorisé et réexamen des péages

V051 · 19 novembre 2026 · PEA-MEMOIRE-BUDGET-01. Complète PAR-05, PEA-02/05/06/07 et PRO-04/05 du [cahier V5](OuQuandQui-Cahier-des-Charges-V5-2026-09-18.md), les [préparations V012](OuQuandQui_API_V012_Preparations_Trajets_2026-11-18.md) et les [péages partagés V023](OuQuandQui_API_V023_Peages_Partages_2026-11-18.md). Les éditions précédentes sont conservées. Cette édition étend la sauvegarde routière au budget historique ; elle ne rétablit aucune confirmation de passage ou affectation aux passagers.

## Enregistrer volontairement un budget

Lors de l’enregistrement d’une préparation routière, une option non cochée « Conserver aussi ce budget comme souvenir daté » permet d’inclure le budget affiché. Le détail est consultable avant confirmation. Modifier cette option retire la confirmation d’enregistrement. Sans cette option, aucun budget n’est ajouté ; les préparations à pied restent sans budget automobile.

Le souvenir conserve le prix de référence du carburant s’il est connu, son libellé de provenance et sa date lorsqu’elle était fournie, ainsi que le contexte de la préparation : distance effectivement retenue, consommation déclarée, carburant, véhicule, arrêts et horaires. Le coût consommé se calcule sur cette distance et cette consommation, sans additionner les litres achetés au plein. Un prix absent ou devenu non admissible reste inconnu.

Pour les grilles locales, chaque tronçon conserve réseau, sens entrée → sortie ou passage unique, classe, centimes, date choisie, titre et lien source, date d’effet, dernière revue et limite de consultation. Les noms de gares sont mémorisés, pas leurs positions dans un tableau. Le sous-total et la couverture déclarée restent distincts. Un éventuel résultat du service tarifaire déjà prévu est conservé comme montant et notice historique ; il ne bénéficie d’aucune réactivation ni d’une nouvelle requête. Ce service reste désactivé en usage public tant que ses conditions d’activation ne sont pas réunies.

La consultation affiche « Budget historique · à réexaminer » et sa date, puis carburant consommé, péages et total. Un total complet n’est affiché que si le carburant est connu et les péages complets. Un sous-total partiel n’est jamais promu en total ; un prix inconnu n’est pas zéro. Une ancienne confirmation d’absence de péage reste explicitement datée. Stationnement, ferries et autres frais demeurent exclus.

## Reprise et réexamen

La reprise charge les paramètres habituels, efface le prix carburant et les tarifs courants, et exige un nouveau calcul. Le souvenir reste consultable dans un volet dépliable. Il ne modifie ni le résultat courant ni les confirmations. Le prix du carburant doit être renseigné à nouveau ou obtenu depuis une station admissible actuelle.

Après le nouveau calcul, « Réexaminer ce péage » recherche les noms exacts et le sens dans le catalogue disponible. Un réseau absent, une paire absente ou un nom ambigu ne reçoit aucun substitut. Le calculateur reprend seulement ces choix de gares ; il calcule le montant depuis la grille actuelle. L’ancien montant reste visible pour comparaison. Le premier réexamen demande de choisir à nouveau une classe ; si des tronçons actuels existent déjà, leur classe commune reste affichée et doit être vérifiée lors de la confirmation du nouveau tronçon.

La date proposée est celle du nouveau départ, s’il est renseigné, sinon la date de consultation. La période admissible de la grille est contrôlée. Avec un départ renseigné, la date tarifaire doit lui correspondre. Si des tronçons actuels possèdent une autre date, ils doivent être révisés explicitement avant ce réexamen. Les tarifs mémorisés restent lisibles même s’ils sont aujourd’hui périmés ; cela n’autorise jamais leur ajout au budget courant.

L’ajout exige une nouvelle confirmation de la classe, du sens, du passage sur le trajet et de l’absence de chevauchement. Le passage BPNL conserve également sa confirmation propre. Une modification du trajet, de l’arrêt, du véhicule, de la classe, des gares, de la date, du départ ou des hypothèses carburant retire la confirmation du réexamen. Une ancienne confirmation n’est pas restaurée lorsqu’une valeur est rétablie.

Les tronçons sont ajoutés individuellement, dans la limite existante de dix, avec refus des doublons orientés. L’ajout reste partiel tant que la couverture complète n’est pas confirmée séparément. Les affectations aux portions du covoiturage demeurent à reconstruire et confirmer dans leur interface ; aucun prorata automatique n’est ajouté. Annuler le réexamen n’ajoute rien et conserve le souvenir. Le repérage des noms et la validation du format ne prouvent pas le passage réel.

## Stockage, migration et import

Le format routier devient `dragonroute-preparations`, version `11`, avec un champ `budget` obligatoire : `null` ou un objet historique en EUR. La clé locale est `dragonroute.prepared.v11.<environnement>`. Chaque aperçu conserve son périmètre indépendant.

Les versions 1 à 10 sont converties en mémoire avec `budget: null`, même si un champ étranger portant ce nom était présent. Les originaux restent intacts. Une écriture volontaire crée la copie 11 ; l’original 10 est exportable exactement, y compris sa mise en forme. Les copies antérieures gardent leurs possibilités de récupération. Une copie actuelle vide est prioritaire ; une copie actuelle invalide bloque le chargement, sans repli silencieux sur une ancienne liste.

La sauvegarde et l’effacement vérifient les onze copies pour détecter une modification intervenue dans un autre onglet. Cette protection reste une coordination volontaire, sans transaction atomique. En cas de quota, conflit ou refus de stockage, le brouillon et l’option choisie restent présents. Le renommage ne modifie ni le budget ni ses dates.

Le budget est inclus dans l’export JSON et dans l’aperçu d’import. L’import exige la confirmation habituelle et conserve les données existantes s’il est annulé ou invalide. Montants négatifs/non finis, centimes fractionnaires, somme incohérente, doublons, dates invalides, devise étrangère, source non HTTPS ou porteuse d’identifiants et budget automobile sur un trajet à pied sont refusés. Les champs étrangers, clés techniques, confirmations et affectations ne sont pas repris. Les liens des sources importées ne sont jamais consultés automatiquement. L’ensemble reste déclaratif, en clair et local : aucune signature ne certifie l’authenticité d’un fichier importé.

Limites inchangées : vingt préparations, vingt-cinq mille points par tracé, export de deux Mo. Aucun compte, synchronisation, paiement, fournisseur ou hébergement ajouté.

## Vérification

Les contrôles du modèle couvrent aller-retour, migration, inconnus/zéro/partiel/complet, prix consommé, montants, sources, dates, doublons, exclusions et rapprochement des gares par nom. Les parcours navigateur couvrent enregistrement volontaire, export, rechargement, renommage, reprise, relecture de plusieurs tronçons, prix modifié, date/classe/arrêt/variante, passage BPNL, expiration, source absente, quota, concurrence, import annulé et confirmé, et priorité de la copie actuelle.

Les simulations, essais locaux avec les services réels, inspection GitHub et vérification de l’aperçu publié sont consignés séparément dans le suivi de développement. Aucun essai sur téléphone physique ou parcours routier réel n’est déduit de ces contrôles. La couverture tarifaire reste limitée aux grilles déjà qualifiées ; aucune couverture nationale ni adéquation caravane/poids lourd n’est ajoutée par la mémorisation.

## Incident de validation conservé

La première inspection GitHub (`44598360393`, commit `f74bec4`) a atteint la borne globale de 45 minutes avant de produire un rapport navigateur complet. Le scénario de copie refusée du covoiturage a également dépassé sa minute sur le format 390 px ; sa trace s’arrête pendant la première préparation du récapitulatif, avant le test de copie. Aucune publication n’a été faite. La borne globale passe à 55 minutes dans le job de 60 minutes ; les délais individuels, l’absence de nouvelle tentative automatique et l’exigence de réussite complète restent inchangés. Les résultats et traces de cet essai sont conservés.

Le recontrôle local ciblé du covoiturage a réussi ses 32 parcours sur les quatre formats, sans modification du produit ou des assertions. Le blocage isolé du navigateur hébergé n’a pas été reproduit ; la nouvelle inspection complète reste nécessaire.
