# V088 — Préparer plusieurs arrêts carburant

22 novembre 2026 · ARR-MULTI-01 · extension de ARR-06, ARR-01/02/04/05/07 et AUT-01/04 du [cahier V5](OuQuandQui-Cahier-des-Charges-V5-2026-09-18.md). Complète l’[aperçu station V055](OuQuandQui_API_V055_Apercu_Station_2026-11-20.md). Les éditions et préparations précédentes sont conservées.

## Parcours utilisateur

Après un trajet routier et une recherche de stations, « Préparer plusieurs arrêts » ouvre un brouillon de deux ou trois stations. Les stations proviennent des résultats reçus pour le trajet et le carburant courants. Leur ajout est explicite, sans remplacement silencieux ni achat prérempli. Fermer la fenêtre permet de chercher une autre zone du même trajet ; les étapes déjà ajoutées restent dans le brouillon. Les résultats ne constituent pas une sélection exhaustive de toutes les stations.

Les boutons Avancer, Reculer et Retirer permettent d’ordonner les étapes. Départ et arrivée restent fixes. Les rencontres déjà adoptées sont conservées ; la prise en charge doit rester avant la dépose. Une station déjà sélectionnée peut amorcer le brouillon. L’ouverture seule n’enregistre rien et n’interroge pas le moteur.

« Calculer l’aperçu complet » recalcule toutes les portions dans l’ordre choisi. La confirmation suit la relecture du tracé, des distances, des pauses et des limites. Annuler, fermer, modifier une donnée ou rencontrer une erreur conserve le dernier parcours confirmé. Une réponse tardive ne peut adopter ou rouvrir un aperçu annulé. Chaque nouveau calcul est une action volontaire.

## Périmètre de cette préparation

Le parcours successif constitue une préparation distincte dans la même application. Son aperçu utilise le tracé routier réel, représenté par un schéma bleu et blanc sans fond de carte, avec étapes numérotées. L’écran principal conserve son trajet et son éventuel arrêt unique. Cette distinction est indiquée dans l’interface ; la confirmation successive ne remplace pas la carte principale, son budget ni ses péages.

Les fonctions disponibles sont l’ordre des stations, le recalcul cumulatif, l’autonomie par portion, la relecture, la modification d’une copie, l’enregistrement local et les exports JSON/GPX. La synchronisation avec la carte principale, la navigation externe à plusieurs arrêts, la comparaison avec d’autres modes, l’arrivée horaire à chaque station et le budget de péages de ce parcours restent à développer. Aucun classement optimal de l’ordre ni recherche automatique des stations suivantes n’est annoncé.

## Calcul routier qualifié

La version initiale est bornée au véhicule léger et aux raccordements IGN/OSRM existants. Le critère et les exclusions sont conservés. Un profil poids lourd, un relais non qualifié pour cette fonction ou une contrainte incompatible déclenche une explication ; aucun repli silencieux vers une voiture standard. L’absence de support caravanes n’est pas levée par ce lot.

Deux ou trois stations et au plus deux rencontres représentent cinq points intermédiaires au maximum. Les capacités IGN consultées le 22 novembre annoncent une borne de quinze points intermédiaires ; la borne de cinq est un choix du produit. L’adaptateur utilise `intermediates` pour IGN et les coordonnées ordonnées pour OSRM. Les coordonnées et contraintes sont transmises seulement au calcul. Aucun serveur, compte technique, clé visiteur ou service payant ajouté.

Un seul calcul complet fournit les métriques ; les détours de stations calculés séparément ne sont jamais additionnés. Nombre de portions, valeurs finies, somme des distances et durées et géométrie sont contrôlés. Les totaux doivent concorder à deux mètres et deux secondes près. Les points sont rapprochés du tracé dans leur ordre à un kilomètre maximum ; l’adaptateur OSRM impose également des points réseau à moins de 500 mètres. Ces tolérances cartographiques ne prouvent ni accès à la pompe ni sens de circulation réel sur place. Toute incohérence interdit la confirmation.

Les limites cumulées des rencontres restent appliquées au trajet complet par rapport à leur référence initiale. La distance partagée est recalculée entre prise en charge et dépose. Les contributions et péages partagés ne sont pas transférés au nouveau parcours.

## Pauses et autonomie

Chaque station porte une quantité prévue en litres et une pause en minutes. Champ vide : donnée inconnue ; zéro : valeur nulle déclarée. Les pauses connues s’ajoutent une fois à la conduite. Une seule pause inconnue laisse la durée totale inconnue. Autres pauses, embarquement et trafic en direct sont exclus.

Le carburant de départ, la capacité du réservoir, la consommation et la réserve en kilomètres constituent les hypothèses. La consommation théorique de chaque portion est sa distance multipliée par la consommation aux 100 km. Le volume prévu à une station n’est ajouté qu’après l’arrivée théorique à cette station.

Une capacité ou un niveau initial inconnu empêche une affirmation de portée. Une quantité de ravitaillement inconnue rend les portions suivantes inconnues. Un achat dépassant la place disponible est signalé et empêche de poursuivre le calcul de portée avec cette hypothèse. Aucun rabattement automatique à la capacité ni plein supposé. Une quantité initiale supérieure à la capacité est refusée.

Une réserve entamée reste distincte d’un volume insuffisant pour atteindre l’étape. Une station théoriquement inaccessible ne remet pas le réservoir à niveau pour les étapes suivantes. Les états possibles sont portée théorique avec réserve, réserve entamée, carburant insuffisant et autonomie inconnue. L’acceptation de ces limites permet de conserver une préparation ; elle ne prouve pas qu’un déplacement peut être effectué.

## Achats, consommation et tarifs

Le coût du carburant consommé utilise uniquement le prix de référence déclaré dans cette préparation. Les achats en station forment un montant distinct. Un prix ou une quantité manquants laisse les achats incomplets ; un sous-total connu peut être affiché. Les achats ne s’ajoutent jamais au coût de consommation du trajet.

La fraîcheur des prix est vérifiée au calcul et à la confirmation. Les prix devenus anciens ou non vérifiables sont exclus du chiffrage. La lecture d’une copie enregistrée reste historique et ne les présente pas comme actuels. La modification d’une copie ne déclenche aucune actualisation automatique de prix.

Les anciennes confirmations de péages ne sont pas attribuées à cette nouvelle géométrie. Péages, ferries et autres frais demeurent non qualifiés ; aucun total complet ni économie globale annoncés. Le budget de la préparation principale reste intact.

## Conservation et exports

Une sauvegarde volontaire exige un nom et une confirmation de conservation locale. Dix copies au maximum, format 1, clé propre à l’environnement `dragonroute.multi-stops.v1.<scope>`. Profil, anciens formats routiers, autres modes et journal sont conservés. Aucun déplacement effectué n’est déduit d’une préparation. Les copies d’un aperçu ne sont pas celles du site public ni d’un autre aperçu.

« Mes trajets préparés », rubrique route/marche, donne accès à « Mes trajets à plusieurs arrêts ». La lecture d’une copie ne fait aucun appel de routage ou de carburant. Les noms, points, hypothèses, tracé, portions et dates sont conservés en clair sur ce navigateur. Aucun compte ni synchronisation entre appareils.

L’export JSON permet de conserver le parcours ou la copie locale originale. L’import est limité à 3 Mo et dix entrées ; structure, valeurs, identifiants, géométrie et portions sont validés. L’aperçu du remplacement et une confirmation explicite précèdent l’écriture. Les parcours importés restent déclaratifs et historiques. Une copie illisible est protégée contre l’écrasement et peut être exportée lorsqu’elle reste accessible. Une modification concurrente dans une autre fenêtre bloque l’écriture. L’effacement exige une confirmation et concerne seulement cette rubrique.

Le GPX exporte tous les points dans l’ordre et le tracé confirmé, avec nom, date et provenance. Il ne fournit ni guidage vocal ni restrictions encodées. Un logiciel qui importe ce fichier peut suivre ou recalculer le parcours selon ses propres règles. Les fichiers contiennent des lieux en clair ; aucun envoi à un tiers n’est réalisé par l’export.

## Vérification et observations

Les contrôles locaux couvrent valeurs manquantes, pauses nulles, consommation, achats, réserve, panne théorique, capacité dépassée, ordre des rencontres, limites cumulées, portions incohérentes, géométrie, profils incompatibles, formats de sauvegarde et doublons d’identifiants. Les essais navigateur couvrent calcul, adoption, modifications, annulation, erreur réseau, stockage concurrent ou corrompu, import confirmé, exports et reprise sans requête.

Les services réels ont été interrogés le 22 novembre sur des lieux publics entre Lyon et Valence : IGN, sept points et six portions, 114 566,6 m et 11 171 s, ressource du 20 novembre ; OSRM, quatre points et trois portions, 106 447 m et 6 990,4 s. Les réponses ont été conservées et contrôlées avec le validateur de la préparation. Il s’agit de recettes de calcul sur lieux publics, sans trajet personnel envoyé ni déplacement réel attesté.

L’inspection complète du commit, les vues ordinateur/mobile, les résultats Firefox/WebKit et la vérification de l’aperçu publié sont consignés dans le suivi de livraison. Ces observations ne qualifient pas tous les trajets français, l’état des routes ou un téléphone physique.

## Références

[IGN — calcul d’itinéraire](https://cartes.gouv.fr/aide/fr/guides-utilisateur/utiliser-les-services-de-la-geoplateforme/calcul-itineraire/) · [capacités du service IGN](https://data.geopf.fr/navigation/getCapabilities) · [OSRM — contrat HTTP](https://project-osrm.org/docs/v26.6.1/http.html). Consultés le 22 novembre 2026. Les raccordements et conditions antérieurs restent décrits dans les sources de l’application.
