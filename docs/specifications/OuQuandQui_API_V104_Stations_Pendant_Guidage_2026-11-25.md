# V104 — Stations depuis la progression du guidage

NAV-GPS-02 · 25 novembre 2026. Complète le [guidage intégré V103](OuQuandQui_API_V103_Guidage_GPS_Integre_2026-11-25.md) et STA-01/02/05/06/08/09/10/11/12, AUT-01/03/04, CAL-01 à CAL-05 du [cahier V5](OuQuandQui-Cahier-des-Charges-V5-2026-09-18.md). Les éditions précédentes sont conservées.

## Parcours prioritaire

Après le calcul et le démarrage du guidage intégré, une commande permet de chercher une station sur la suite du trajet. Ouvrir ce choix met le guidage en pause sans contacter les fournisseurs ni demander une position supplémentaire. Une recherche explicite obtient une position GPS actuelle puis réévalue la route restante avec le même moteur, le même véhicule et les mêmes exclusions. Les étapes déjà atteintes sont retirées ; les points restant à visiter conservent leur ordre.

Le panneau est destiné à une consultation à l’arrêt. Fermer sans confirmer conserve le guidage précédent en pause ; le suivi ne redémarre pas automatiquement. Après ajout confirmé, le guidage reprend sur le parcours calculé avec la station. Une arrivée à la station est une étape intermédiaire : la reprise après le plein demeure volontaire, comme dans V103.

## Position et limites temporelles

La position ponctuelle respecte les contrôles du guidage : coordonnées finies, précision annoncée de 50 m au plus et ancienneté de quinze secondes au plus. Une permission refusée, un délai dépassé, une position trop ancienne ou imprécise empêche la recherche. La demande est bornée à douze secondes et ses réponses tardives sont ignorées après annulation.

Les résultats indiquent la date et la précision du point utilisé. Après cinq minutes, ou si l’horloge recule avant ce point, ils ne peuvent plus être adoptés : une nouvelle recherche est nécessaire. Avant l’ajout, une autre position est demandée. Un déplacement de plus de 100 m depuis le point de comparaison impose une actualisation. Cette tolérance ne constitue pas une preuve d’immobilité ni une garantie de précision sur le terrain.

## Fenêtre et collecte

Les intentions sont « au plus tôt », « bon compromis proche » et « vers une distance choisie ». Les distances partent du point GPS de la nouvelle recherche. La zone proche, la cible et sa tolérance sont visibles et réglables. Une cible au-delà du trajet restant est refusée avant consultation des carburants ; aucune extension de zone implicite.

La source officielle existante est interrogée sur la portion choisie : rayon de 12 km, espacement demandé de 30 km, vingt-quatre prélèvements au maximum et cent lignes par réponse. Les prélèvements plafonnés, erreurs et réponses limitées restent signalés. Cette collecte n’est pas exhaustive. Le rattachement géographique présélectionne les stations et leur place dans l’ordre des étapes ; il ne qualifie pas leur accès routier.

Les stations déjà prévues et les doublons sont exclus. Une station placée derrière le début de la portion ou ambiguë entre plusieurs étapes n’est pas retenue automatiquement. L’insertion avant une étape est déterminée sur le tracé restant. Les contraintes de nombre de points du guidage restent applicables : douze points au maximum après insertion.

## Comparaisons routières

Chaque groupe examine au plus vingt candidates avec le moteur et les options du guidage. Les manœuvres et les accès aux points sont validés selon V103. Une continuation volontaire examine le groupe suivant sans relire ni rajeunir les prix. Une panne conserve les comparaisons acquises ; la candidate interrompue n’est pas silencieusement comptée comme examinée. Une réponse explicite sans route peut être exclue.

La distance d’accès cumule toutes les portions précédant la station, y compris les étapes encore à visiter. Le détour compare le parcours complet restant avec et sans station, depuis le même point. Un écart inférieur à moins deux mètres ou moins deux secondes est non comparable ; seul le bruit numérique inférieur ou égal à ces bornes peut être ramené à zéro. Les temps de pause, de plein et le trafic ne sont pas ajoutés implicitement.

Le montant affiché est le sous-total achat plus carburant du détour, estimé au prix de cette station. Péages, stationnement et autres frais restent explicitement exclus. Le plein acheté n’est jamais ajouté au budget de carburant consommé du voyage. Les badges « Compromis », « Pompe » et « Rapide » sont regroupés sur une seule fiche lorsque la même station les obtient ; les égalités restent visibles. Le classement porte uniquement sur les stations effectivement comparées et compatibles avec les filtres.

## Filtres, autonomie et informations

Les limites de détour, services nécessaires et filtre d’horaires sont repris comme critères visibles, modifiables dans ce panneau. Une information inconnue ne satisfait pas un filtre strict. Les prix absents, incohérents, trop anciens selon la politique de fraîcheur existante, ou les ruptures déclarées ne permettent pas de comparaison chiffrée courante.

L’autonomie du point de départ n’est jamais réutilisée comme autonomie actuelle. Une saisie facultative renseigne une distance restante estimée maintenant, avec une réserve explicite de 30 km initialement proposée et modifiable. Une valeur absente signifie inconnue ; zéro reste une valeur distincte. Le filtre de portée utilise la distance routière cumulée d’accès. Hors filtre strict, un choix dépassant la portée avec réserve exige une confirmation explicite. Aucune jauge du véhicule n’est lue ; ce lot ne déduit pas automatiquement le carburant restant à partir du trajet effectué.

Les fiches présentent prix et ancienneté, adresse, horaires déclarés du guichet, services et source. Les horaires habituels à l’arrivée restent une information déclarative. S’il existe une étape antérieure à la station dont la pause n’est pas renseignée, l’heure d’arrivée et sa compatibilité sont inconnues. Une déclaration d’automate ne qualifie pas l’accès au GPLc. Disponibilité, fermetures exceptionnelles et entrée physique ne sont pas certifiées.

Les stations comparées disposent de numéros stables pour la recherche et de points activables sur la carte. La liste donne accès au même choix sans dépendre du fond cartographique. La sélection ouvre une proposition avec son insertion, sa distance d’accès, son détour et ses limites avant ajout.

## Confirmation et conservation

La confirmation vérifie une nouvelle position, recalcule le trajet restant et le parcours via la station, puis contrôle à nouveau la portion, l’ordre des étapes, les critères et la fraîcheur du prix. Une modification sensible de distance, de durée ou du sous-total demande une nouvelle confirmation. Une erreur, une annulation, un changement de critères ou de trajet propriétaire interdit l’ajout et conserve le parcours précédent.

L’ajout modifie uniquement la session en mémoire. La préparation initiale, ses budgets, ses horaires, les favoris, le profil et le journal restent conservés. Une recherche ne crée aucune trace GPS persistante et n’atteste pas de déplacement effectué. Les prix ne sont pas présentés comme relus lors du dernier recalcul routier.

Le passage en arrière-plan ferme la recherche et garde le guidage en pause. La fermeture, l’annulation et le changement de contexte empêchent l’intégration des réponses devenues tardives. Les quotas et délais des fournisseurs existants restent appliqués ; aucun autre service, compte, clé visiteur, hébergement ou paiement ajouté.

## Vérifications et suite

Les contrôles doivent couvrir le parcours complet, les deux moteurs, les étapes restantes, les fenêtres, filtres et données inconnues, les prix périmés, la pagination, les pertes de position, réponses tardives, erreurs partielles, changements de contexte et confirmations. La recette publiée distingue les réponses de services réels, les positions simulées et l’essai physique.

Android reste la plateforme pilote choisie pour les essais physiques, non réalisés par les simulations navigateur. Le fonctionnement écran verrouillé et en arrière-plan reste hors qualification. Prochain axe : autonomie déclarée et consommation estimée pendant la progression du guidage, avec datation, réserve et gestion explicite des recalculs et des pleins ; aucune lecture automatique de jauge à prétendre.
