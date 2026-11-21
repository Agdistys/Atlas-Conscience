# OùQuandQui — V029 · Préparations collectives locales

18 novembre 2026 · MULTIMODAL-04 · Exigences PAR-05, PRO-03/04/05/07, OFF-02 et TC-04 du [cahier V5](OuQuandQui-Cahier-des-Charges-V5-2026-09-18.md). Complément de [V012 — préparations](OuQuandQui_API_V012_Preparations_Trajets_2026-11-18.md), [V018 — hors ligne](OuQuandQui_API_V018_Hors_Ligne_Mises_A_Jour_2026-11-18.md), [V027 — collectif direct](OuQuandQui_API_V027_Collectif_Direct_2026-11-18.md) et [V028 — informations du réseau](OuQuandQui_API_V028_Infos_Reseau_2026-11-18.md). Les éditions antérieures sont conservées.

## Parcours et portée

L’accès **Mes trajets** regroupe deux rubriques : **Route et marche** et **Transports collectifs**. Après une recherche collective, chaque option propose **Enregistrer cette option collective**. Le formulaire demande un nom et une confirmation ; un nom ou des paramètres déjà présents demandent une confirmation supplémentaire. Aucune écriture n’est effectuée à l’ouverture du formulaire.

Une préparation collective conserve les lieux résolus, les critères de recherche, les étapes et le tracé théoriques disponibles. La fiche indique séparément la date de sauvegarde, celle du calcul consulté et les heures historiques de départ et d’arrivée, avec l’année et le fuseau de Paris. Renommer ne renouvelle aucune de ces dates. La durée, les lignes, directions, arrêts, attentes et correspondances restent consultables.

L’enregistrement interrompt toute consultation réseau encore en cours. Les passages annoncés, retards, annulations et perturbations de V028 ne sont jamais enregistrés comme des horaires actuels. L’instantané ne prouve aucune circulation effective. Un prix ou une accessibilité inconnus restent inconnus ; aucun billet, tarif nul ou réservation n’est déduit de la sauvegarde.

## Reprise explicite

**Reprendre les lieux et critères** ouvre le calculateur collectif avec les coordonnées conservées. L’action ne lance ni géocodage, ni calcul, ni consultation d’annonces. Les lieux de cette recherche sont affichés dans le calculateur ; les champs, le tracé et le budget de la préparation routière principale restent inchangés.

Une date encore future dans la fenêtre des trente jours peut être reprise. Une date passée, ambiguë ou hors fenêtre est retirée du champ : une nouvelle date doit être choisie explicitement. Aucun report automatique à aujourd’hui. La comparaison routière facultative est décochée à la reprise ; elle demande un nouveau choix. Une nouvelle recherche utilise les coordonnées mémorisées, sans géocodage implicite. Les résultats restent soumis aux critères et limites du fournisseur.

Fermer le calculateur ou changer les lieux de la page invalide ce contexte. L’historique conservé n’est pas adopté comme un nouveau trajet routier et ne crée aucune entrée dans le journal.

## Conservation locale et hors ligne

Les données restent dans le stockage de ce navigateur et de cet environnement. Il n’existe pas de compte, de synchronisation entre appareils ou de sauvegarde distante. Le profil, les préparations routières et le journal ont leurs propres données ; aucune conversion de leur format n’est effectuée.

La fiche et son schéma SVG ne demandent aucun fond de carte distant. La marche apparaît en pointillés violets, le transport en bleu ; le schéma est sans échelle. Une géométrie manquante est annoncée, sans inventer de segment entre deux étapes. Les étapes textuelles restent disponibles même sans tracé.

La consultation sans connexion suppose que l’application soit déjà ouverte ou que son enveloppe ait été installée et conservée selon V018. Le service worker reste désactivé dans les aperçus de PR : une page d’aperçu fermée ne promet donc pas de se rouvrir hors ligne. La conservation locale peut être effacée par le navigateur ; l’export volontaire permet une copie indépendante. Les lieux et horaires exportés figurent en clair dans le fichier choisi.

## Format et limites

Le format collectif est indépendant du format route/marche v5, dont les migrations et sauvegardes restent intactes.

| Élément | Contrat |
|---|---|
| Enveloppe | `kind: dragonroute-transit-preparations`, `version: 1`, `entries` |
| Stockage | `dragonroute.transit-prepared.v1.` suivi du périmètre public ou du chemin d’aperçu |
| Nombre | Au plus 20 préparations collectives ; limite distincte des préparations route/marche |
| Identité | Identifiant unique, lettres/chiffres/tirets, 80 caractères maximum ; nom non vide, 80 caractères maximum |
| Dates | ISO canonique ; date du calcul antérieure ou égale à celle de la sauvegarde |
| Lieux | Libellés et coordonnées validés dans le secteur pilote Grenoble |
| Critères | Date/heure de Paris, départ ou arrivée limite, marche totale maximale de 100 à 5 000 m |
| Instantané | Source `mobilites-m`, itinéraire théorique revalidé par le modèle du calculateur |
| Étapes | De 1 à 30 ; continuité spatiale et temporelle, modes et durées contrôlés |
| Géométries | Absence explicite possible ; sinon de 2 à 12 000 points par étape, 25 000 par itinéraire au maximum ; extrémités cohérentes avec les arrêts |
| Taille | Au plus 2 Mo UTF-8 pour l’ensemble exporté, indentation comprise ; même plafond à la lecture d’un fichier |

Le modèle reconstruit une représentation canonique : les champs étrangers, données réseau volatiles et prix ajoutés ne sont pas repris. Il recalcule les durées agrégées plutôt que de croire les totaux importés. Les données hors limites, heures incohérentes, géométries invalides, annulations ou étapes marquées comme temps réel sont refusées. Un fichier importé reste déclaratif : sa conformité structurelle n’authentifie ni son auteur ni son origine réelle.

## Import, export et erreurs

L’export concerne uniquement la rubrique collective. L’import affiche les noms, lieux, dates, étapes et nombre de préparations, puis demande confirmation du remplacement de cette rubrique. Une sauvegarde de l’état courant est proposée avant validation. Un fichier vide peut vider la liste uniquement après la même confirmation explicite. Les préparations routières restent conservées.

Un fichier routier, une version inconnue, des identifiants dupliqués, un JSON invalide ou un fichier trop gros sont refusés sans écriture. Un stockage existant invalide ou d’une version inconnue est protégé : pas de remplacement automatique. L’effacement volontaire de la rubrique reste distinct, avec confirmation.

Avant toute écriture ou suppression, le contenu réellement stocké est comparé à la version chargée. Une modification par une autre fenêtre impose de fermer puis rouvrir Mes trajets ; elle n’est pas écrasée. Une erreur de stockage conserve le formulaire et son nom. Une lecture de fichier qui se termine après fermeture ou changement de rubrique ne rouvre pas une confirmation périmée. Le clavier permet de changer de rubrique et de revenir au bouton d’accès après fermeture.

Les noms et textes importés sont échappés. Les coordonnées sont validées avant génération du schéma. Aucun contenu HTML reçu n’est exécuté. Aucun nouvel appel externe, compte, abonnement ou hébergement n’est introduit par la sauvegarde.

## Vérification

Dix contrôles du modèle portent sur le cycle export/import, les dates, plafonds, versions, identifiants, lieux et critères, étapes incohérentes, champs étrangers, géométries, taille UTF-8, doublons et passages à minuit.

Onze scénarios navigateur sont exécutés sur quatre formats : sauvegarde volontaire, rechargement et consultation hors réseau, reprise avec trajet routier préservé, date passée, doublons/renommage/suppression, quota et concurrence, import aperçu/confirmation/texte hostile, refus de formats, lecture tardive, séparation public/aperçu, clavier/géométrie partielle et sauvegarde pendant une consultation réseau en attente. Les neuf scénarios existants de préparations routières sont également rejoués localement : 80 parcours au total.

La recette publiée vérifie séparément un calcul réel entre Grenoble Gares et l’avenue Innsbruck, sa sauvegarde, sa consultation locale après rechargement, son export et sa reprise sans géocodage supplémentaire. Les contrôles de l’Inspectrice et les métadonnées de l’aperçu portent le nombre effectivement exécuté pour le commit livré. Les captures ordinateur/mobile ne constituent pas une validation sur téléphone physique.

## Limites conservées

Pilote collectif Grenoble ; calcul théorique ; absence de garantie de circulation, de prix complet, d’accessibilité et de réservation. Pas de synchronisation, de navigation collective continue ou d’adoption dans le budget principal. La reprise d’un ancien instantané nécessite une nouvelle recherche pour obtenir des horaires actuels. Une géométrie locale ne remplace pas une carte navigable. Les préparations route/marche, profils et journaux conservent leurs limites existantes.
