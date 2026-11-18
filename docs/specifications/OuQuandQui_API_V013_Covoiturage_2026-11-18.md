# OùQuandQui — Préparation du covoiturage et partage des frais

V013 · 18 novembre 2026 · COV-PREPARATION-01. Complément de COV-01, COV-02, COV-05 et COV-06 du [cahier des charges V5](OuQuandQui-Cahier-des-Charges-V5-2026-09-18.md). [Budget V004](OuQuandQui_API_V004_Peages_2026-11-17.md), [grilles V005](OuQuandQui_API_V005_Grilles_Peages_2026-11-17.md), [horaires V011](OuQuandQui_API_V011_Horaires_Stations_2026-11-18.md) et [préparations V012](OuQuandQui_API_V012_Preparations_Trajets_2026-11-18.md) conservés.

## Parcours disponible

Après le calcul de l’itinéraire, l’onglet Covoiturage propose deux rôles : « Je conduis » et « Je cherche une place ».

Le conducteur indique les places proposées, hors conducteur, puis le nombre de passagers prévu dans la simulation. Les places proposées ne deviennent pas des passagers confirmés. Le nombre de passagers doit être entier, compris entre zéro et les places proposées. Le plafond de huit places constitue une limite de saisie de cette version, pas une certification de capacité ou une catégorie réglementaire du véhicule. La capacité réelle doit être vérifiée.

Le passager indique le nombre de places recherché pour son groupe. Aucun prix de place n’est déduit du budget du véhicule préparé. Prix de l’offre et disponibilité restent inconnus sans fournisseur connecté.

Le départ envisagé utilise la même date et heure de Paris que les horaires des stations. Modifier l’un des deux champs actualise l’autre et les horaires déclarés des stations sans nouvelle requête. Une date passée, absente, inexistante ou ambiguë lors du changement d’heure bloque la préparation du récapitulatif. Ce départ ne transforme pas les durées routières en prévisions de trafic.

## Partage des frais

Le calcul concerne le carburant **consommé** sur l’aller simple affiché et ses péages. Il inclut le détour de la station confirmée. Les litres achetés, les frais de stationnement, les ferries et les autres coûts du véhicule restent hors périmètre. La répartition suppose que tous les passagers parcourent l’intégralité du trajet ; aucun segment partagé, détour de prise en charge ou point de rencontre intermédiaire n’est calculé dans ce lot.

Le carburant utilise distance routière, consommation et prix de référence renseigné dans le budget. Un champ absent ou invalide reste inconnu. Les péages reprennent exclusivement le mode actif du budget : tronçons APRR/AREA ou devis du service qualifié, jamais les deux additionnés. La couverture déclarée des tronçons reste une déclaration de la personne, sans vérification automatique du passage. Le service de devis demeure désactivé sur l’aperçu public ; son raccordement est testé avec réponses construites.

La date des tronçons doit correspondre au jour de départ prévu. Le départ d’un devis doit correspondre à la même minute que celui du covoiturage. Sinon les péages sont inconnus dans le partage, avec indication de la date à actualiser. Le budget général garde sa propre date visible ; aucune nouvelle requête tarifaire n’est lancée par le module de partage.

| État | Présentation |
|---|---|
| Carburant et péages inconnus | Montant indisponible ; aucune contribution calculable. |
| Une composante connue seulement, ou péages partiels | Montant connu incomplet et part sur ce montant ; aucune participation totale calculable. |
| Absence de péage explicitement confirmée | Péages à zéro ; carburant toujours évalué séparément. |
| Carburant connu et péages complets | Estimation carburant + péages et proposition de répartition. |
| Zéro passager prévu | Montant connu entièrement conservé à la charge du conducteur. |

Les montants connus sont convertis en centimes. Pour `n` passagers : part par passager = partie entière de `montant_connu_en_centimes / (n + 1)` ; total passagers = `n × part` ; part du conducteur = montant connu − total passagers. Le conducteur conserve sa part et le reliquat d’arrondi. La somme des parts égale le montant connu. Exemple de contrôle : 16,40 € pour deux passagers et un conducteur donnent 5,46 € par passager et 5,48 € pour le conducteur. Ce choix de parts égales est une convention de simulation, pas une règle générale imposée : le [Code des transports, article R3132-2](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000041969704), prévoit des proportions convenues entre conducteur et passagers. Source consultée le 18 novembre 2026.

Une estimation de frais n’est ni le prix contractuel d’une offre, ni une réservation, ni un paiement. Aucun prix d’offre, avis, disponibilité ou revenu n’est inventé.

## Récapitulatif sous le contrôle de la personne

« Préparer un récapitulatif à partager » demande deux libellés de secteurs ou points publics à communiquer, ainsi que des besoins ou conditions facultatifs. Les adresses du trajet, les coordonnées, les adresses du profil et l’adresse de la station ne sont pas recopiées automatiquement. Ces libellés sont déclaratifs : ils ne déplacent pas le trajet et ne créent pas un détour géocodé.

Le texte présente rôle, départ, places et conditions. Pour le conducteur, il ajoute l’hypothèse d’occupation, le périmètre kilométrique complet, les composantes connues, leurs limites et la répartition. Pour le passager, il conserve un prix inconnu et le nombre de places demandé. Le texte rappelle l’absence de publication et de réservation.

Le contenu apparaît dans une zone de texte à relire. La copie exige une confirmation explicite des lieux et informations. Aucun message n’est envoyé et aucune action de partage native n’est déclenchée. Si le navigateur refuse l’accès au presse-papiers, le texte est sélectionné pour une copie manuelle. Si les paramètres changent pendant une copie en cours, le résultat signale que la version copiée est antérieure.

Modifier rôle, places, libellés, besoins, départ, trajet, variante, véhicule, arrêt, prix ou état des péages retire le récapitulatif préparé et sa confirmation. Une heure devenue passée est contrôlée à nouveau avant copie. Un changement des coordonnées de départ ou d’arrivée efface aussi les libellés de secteurs, à ressaisir pour le nouveau trajet. Une fois un texte copié hors de l’application, il reste sous le contrôle de la personne ; aucune actualisation à distance de cette copie n’est possible.

## Sources externes et données locales

Le lien [BlaBlaCar](https://www.blablacar.fr/), vérifié le 18 novembre 2026, ouvre uniquement sa page d’accueil. Aucun paramètre de trajet, texte du récapitulatif ou référent de page n’est ajouté au lien. La recherche, la publication d’une offre, les échanges et la réservation restent sur le site du fournisseur. Le lien ne constitue pas un accès à une API ni une autorisation de collecter ses annonces.

Le rôle, les nombres de places, les libellés partagés et le récapitulatif restent dans la session courante. Aucun stockage supplémentaire, compte, synchronisation, nouvel hébergement, abonnement ou appel payant. Profil, préparations V012 et journal ne sont ni activés ni modifiés. Une préparation V012 ne mémorise pas automatiquement ce brouillon de covoiturage. Le départ partagé suit toutefois les paramètres de trajet existants.

## Vérifications et couverture

Quatre contrôles du modèle vérifient les valeurs inconnues, zéro, montants partiels, conservation des centimes, bornes et caractères de contrôle. Huit scénarios navigateur couvrent les rôles, comptages, grilles locales et devis simulés, dates, expiration, arrêts, variantes, copie confirmée, refus du presse-papiers, réponse tardive, adresses exclues du texte et absence de stockage/transmission implicite. Ils sont prévus sur quatre formats, avec inspection visuelle et contrôles automatiques d’accessibilité. Les exécutions effectives et la recette publiée avec lieux et services réels figurent dans l’état de développement et le rapport du commit ; les scénarios de devis simulés restent distingués de cette recette.

COV-01 et COV-05 sont disponibles dans ce périmètre local ; COV-02 et COV-06 restent un parcours externe explicite. COV-03 (offres intégrées), COV-04 (rencontres/détours) et COV-07 (réputation portable) ne sont pas livrés par ce lot. Aucun trajet physique ni téléphone réel n’est attesté par les tests navigateur.
