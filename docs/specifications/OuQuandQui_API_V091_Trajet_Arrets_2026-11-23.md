# V091 — Parcours à plusieurs arrêts dans la vue principale

23 novembre 2026 · ARR-MULTI-04 · prolongement de [V088](OuQuandQui_API_V088_Arrets_Successifs_2026-11-22.md), [V089](OuQuandQui_API_V089_Carte_Navigation_Arrets_2026-11-22.md) et [V090](OuQuandQui_API_V090_Budget_Arrets_2026-11-22.md). Rattachement : ARR-01/04/05/06/07, CAL-05/06, MEM-01 et PRO-04 du [cahier V5](OuQuandQui-Cahier-des-Charges-V5-2026-09-18.md). Les éditions et copies antérieures sont conservées.

## Choisir le parcours affiché

Après calcul et confirmation d'une préparation à plusieurs arrêts, « Adopter dans la vue du trajet » propose une synthèse avant adoption : départ, arrivée, nombre de stations, distance, durée avec pauses renseignées et présence ou absence de budget propre. La préparation de référence conservée est identifiée. Une case puis une confirmation explicite autorisent le changement de vue. L'ouverture, l'annulation et la fermeture de cette proposition ne modifient aucun parcours.

Une adoption vérifie à nouveau le calcul, sa date, sa structure, son éventuel budget et le contexte présenté. Une copie enregistrée reste historique : elle doit être reprise et recalculée avant adoption. Un calcul en cours, un contexte modifié ou une estimation périmée bloque l'adoption. Aucun calcul automobile de substitution, péage repris ou nouvelle requête de routage n'est déclenché par cette confirmation.

## Carte, étapes et hypothèses propres

La vue principale présente le parcours entier, ses étapes numérotées dans l'ordre, les distances des portions, les durées de conduite, les pauses carburant, l'autonomie déclarative et le budget propre. La carte et la liste désignent les mêmes points ; le cadrage global et le détail d'une étape restent accessibles. Le schéma de secours reste disponible si le composant cartographique ne charge pas. Le fond géographique de cette vue se charge à la demande, comme dans la préparation.

Les pauses absentes restent inconnues et empêchent une durée totale complète. Les montants absents restent inconnus ; les achats en station ne sont pas ajoutés au carburant consommé. La présence d'une estimation ne prouve ni la disponibilité d'une station à l'arrivée, ni la circulation, ni l'état d'une chaussée. Ce lot n'ajoute pas d'heure d'arrivée par étape ni de nouvelle qualification de véhicule.

Le panneau du trajet de référence est masqué pendant cette consultation afin que ses commandes et montants ne se confondent pas avec ceux du parcours adopté. Les boutons « Préparation et budget », « Préparer la navigation », export et déclaration d'un déplacement utilisent le parcours effectivement affiché. Les réglages d'un profil et les autres modes ne constituent pas des hypothèses automatiquement transférées à ce parcours.

## Modification, budget et retour

« Préparation et budget » reprend une copie du parcours affiché. Modifier les étapes, quantités, pauses ou hypothèses exige un nouveau calcul et une confirmation ; le budget précédent n'est pas transféré au nouveau calcul. L'ancien parcours adopté reste visible jusqu'à une nouvelle adoption explicite, y compris après une erreur de service ou une fermeture de l'éditeur. Ajouter des stations d'une autre recherche passe par le retour à la préparation de référence et une nouvelle recherche.

Le budget de V090 conserve ses dates, sources et limites. Une expiration ou un recul de l'horloge retire le total actuel et demande un réexamen ; le tracé reste visible comme référence datée. Revenir à une ancienne date ne réactive pas implicitement l'estimation. L'action d'adopter vérifie la validité au moment de la confirmation, indépendamment du rafraîchissement périodique de l'écran.

« Revenir à la préparation de référence » restaure le trajet, sa station sélectionnée, ses réglages, ses résultats et ses péages sans nouveau calcul ni réécriture de leurs valeurs. Si aucun trajet n'avait encore été calculé, le formulaire de départ est retrouvé. L'adoption ne remplace pas les données de la préparation de référence ; un nouveau calcul volontaire de celle-ci quitte la vue adoptée. Lire une autre copie dans la bibliothèque ne remplace pas le parcours affiché.

## Exports, navigation et journal

Les exports GPX et JSON de la vue principale portent sur le parcours adopté entier. Le GPX conserve les points et le tracé ; le JSON conserve également les hypothèses et le budget éventuel. Les liens de navigation conservent l'ordre des étapes dans les limites du fournisseur : groupes de points pour Google Maps et destinations successives pour Waze. La préparation de ces liens conserve son consentement distinct ; aucun guidage natif ou lancement externe n'est réalisé par la simple consultation.

Le journal reste volontaire. Après activation, la reprise du trajet préremplit la distance routière complète et une synthèse des étapes ; elle n'enregistre aucun déplacement. La confirmation d'un déplacement effectué reste distincte. Cette reprise n'importe ni dépenses, ni géométrie, ni calcul automatique d'émissions, ni répartition des voyageurs par portion. Après retour à la référence, la même commande reprend de nouveau la distance de celle-ci.

## Conservation et confidentialité

L'adoption est une vue de session. Elle n'écrit ni le profil, ni la bibliothèque, ni le journal ; elle ne promet pas une reprise après fermeture du navigateur. La conservation durable exige toujours « Enregistrer une copie » ou un export explicite. Les formats 1 et 2 introduits précédemment restent inchangés. Les copies existantes et leurs octets ne sont pas réécrits à la consultation.

L'adoption et le retour n'interrogent ni le routage ni les prix. La carte peut charger son composant déjà utilisé par l'application ; le fond géographique reste une action séparée. La préparation de référence, les contributions et les péages de ses autres outils ne sont pas assimilés au budget du parcours adopté.

## Réception et limites

La réception vérifie confirmation et annulation, conservation de la référence, modification en attente, échec de recalcul, copie historique puis revalidation, budget périmé, exports de tous les points, reprise volontaire dans le journal, bibliothèque indépendante, clavier, texte agrandi, rotation et quatre formats. La compatibilité Firefox/WebKit couvre l'adoption et la navigation depuis la vue principale. Les preuves de l'inspection et de la recette publiée sont rattachées au commit livré dans le suivi central.

Les frais partagés, les horaires détaillés des étapes et la comparaison de ce parcours avec les autres modes restent des intégrations distinctes. La couverture tarifaire demeure partielle et déclarative. Aucun nouveau fournisseur, compte, abonnement, hébergement, qualification poids lourd/caravane ou déplacement réel n'est introduit dans ce lot.
