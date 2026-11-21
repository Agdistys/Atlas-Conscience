# V043 — Limite personnelle de correspondances

TC-CORRESPONDANCES-01 · 19 novembre 2026. Complète DOU-02, TC-02, BOU-01/02 et PRO-03/04/05 du [cahier V5](OuQuandQui-Cahier-des-Charges-V5-2026-09-18.md), le [pilote collectif V026](OuQuandQui_API_V026_Transports_Collectifs_2026-11-18.md), la [comparaison V027](OuQuandQui_API_V027_Collectif_Direct_2026-11-18.md) et les [préparations V029](OuQuandQui_API_V029_Preparations_Collectives_2026-11-18.md). Éditions antérieures conservées.

## Critère et calcul

Le panneau collectif propose un nombre maximal facultatif et une règle : **Préférence** ou **Limite impérative**. Vide signifie aucun plafond, zéro signifie sans changement de véhicule. Valeurs entières de 0 à 29, conformément à la borne existante de trente étapes ; cette borne technique n’est pas une recommandation. La règle initiale reste souple. Une limite impérative sans nombre est invalide et empêche la recherche.

Le nombre est recalculé à partir des montées validées, moins une. Les accès à pied ne comptent pas comme correspondances. Les déclarations agrégées du fournisseur ou d’un import ne remplacent pas ce calcul. Les étapes avec interlignage non qualifié restent refusées selon V026, car rester dans le même véhicule ne doit pas devenir une correspondance inventée.

Le critère est appliqué localement aux options effectivement reçues. La requête Mobilités M conserve son contrat existant et ne transmet pas de paramètre supplémentaire. Ce filtre ne garantit ni une recherche exhaustive ni l’existence d’une option directe. Aucun nouveau fournisseur, compte, abonnement ou appel payant.

Une préférence dépassée reste visible et n’exclut pas l’option du tri des temps. Une limite impérative dépassée retire l’option des résultats admissibles. Le tableau présente « Écarté » avec le motif, sans temps avantageux comparable ; les horaires, étapes et durée reçus restent consultables dans la fiche de référence. Les options conservent leurs numéros. Le premier parcours admissible peut être affiché ; si aucun ne convient, aucun parcours de référence n’est sélectionné automatiquement.

Changer le nombre ou la règle après calcul réévalue les résultats localement, sans requête, modification du tracé ni rajeunissement de la consultation. La carte déjà consultée est identifiée comme référence non admissible si le nouveau critère l’exclut. Corriger un critère invalide restitue les options compatibles avec les données reçues. Une erreur interdit la sauvegarde ou la déclaration depuis le résultat, sans empêcher de relire les étapes. Pendant un calcul, modifier le critère annule l’opération ; une réponse tardive ne la rétablit pas. Un changement de contexte demande un nouveau calcul.

Les horaires, la marche maximale et les limites du vélo restent indépendants. Assouplir les correspondances ne transforme pas un départ passé ou une réponse structurellement invalide en trajet admissible. La limitation reste celle du pilote Grenoble et d’horaires théoriques : aucun tarif, place, accessibilité ou circulation réelle déduit de ce critère.

## Préparations collectives : format 2

Le livre `dragonroute-transit-preparations` devient version 2. Chaque entrée conserve `criteria.maxTransfers` (entier ou `null`) et `criteria.transferStrict` (booléen obligatoire). La clé actuelle est `dragonroute.transit-prepared.v2.` suivie du périmètre public ou de l’aperçu ; la clé de format 1 reste séparée.

Sans copie récente, l’ancien livre est lu en mémoire sans plafond ni contrainte, sans écriture. Une sauvegarde volontaire écrit le nouveau format et préserve l’original exportable à l’identique. Une copie récente présente, même vide ou invalide, interdit le retour silencieux à l’ancienne. Une version incompatible avec sa clé, future, ambiguë ou invalide reste protégée et exportable en brut. Un format 1 contenant les nouveaux critères est refusé ; un format 2 doit les fournir explicitement.

La fiche, l’aperçu d’import et la reprise montrent les critères et l’état historique. Un parcours écarté peut être sauvegardé comme référence. Reprendre restitue les lieux et critères, sans recherche automatique ; une nouvelle consultation explicite est nécessaire, et une date passée doit être remplacée. Les dates, étapes et tracés d’origine restent conservés. La règle fait partie des critères de doublon.

Les contrôles V029 de coordonnées, horaires, source, géométrie, vingt entrées et deux Mo restent appliqués. Les deux copies sont comparées avant écriture ou effacement : un changement observable dans un autre onglet bloque l’opération et conserve le formulaire. Ce contrôle n’est pas une transaction atomique ni une synchronisation. L’effacement volontaire annonce les deux versions et reste limité à cette rubrique et à cet environnement. Profil, autres préparations et journal restent distincts ; sauvegarder ou consulter n’atteste jamais un déplacement effectué.

## Vérification

Contrôles de modèle : seuil inclusif, zéro/vide, valeurs et règles invalides, inconnus, comptage depuis les étapes, tri stable, indépendance horaire et migrations. Parcours navigateur sur quatre formats : recherche, réévaluation, référence, erreur, annulation, sauvegarde/export, lecture hors ligne, reprise, import, versions protégées, conflits et effacement.

La recette réelle et les preuves de publication du commit sont consignées dans `quality/transit-transfers` et dans l’état du chantier. Les scénarios simulés restent distingués des réponses actuelles du service. Les nombres réellement exécutés et les éventuelles limites figurent dans les rapports, sans prétendre à une validation sur téléphone physique ou sur route.

La suite complète de 1 824 scénarios a dépassé sa borne globale de 28 minutes sur un exécuteur hébergé, après 1 455 réussites observées et sans échec individuel observé. Cette exécution incomplète a bloqué la publication. La borne de suite passe à 45 minutes et celle du travail GitHub à 60 minutes pour conserver le temps de préparation et d’archivage. La limite individuelle de 60 secondes, l’absence de réessai automatique et l’exigence de rapport complet restent inchangées. Une nouvelle inspection du commit est requise avant livraison.
