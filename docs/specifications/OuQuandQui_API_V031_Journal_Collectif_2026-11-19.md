# OùQuandQui — V031 · Journal des trajets collectifs

19 novembre 2026 · MULTIMODAL-06 · JOU-01/02/03/04/05, EMP-02/03/05. Complément du [cahier V5](OuQuandQui-Cahier-des-Charges-V5-2026-09-18.md), du [journal V008](OuQuandQui_API_V008_Journal_Mobilite_2026-11-18.md), des [facteurs V009](OuQuandQui_API_V009_Empreinte_Journal_2026-11-18.md), de la [restauration V010](OuQuandQui_API_V010_Restauration_Journal_2026-11-18.md), des [préparations V029](OuQuandQui_API_V029_Preparations_Collectives_2026-11-18.md) et de l’[empreinte collective V030](OuQuandQui_API_V030_Empreinte_Collective_2026-11-18.md). Éditions précédentes conservées.

## De la préparation au déplacement déclaré

Chaque option collective calculée et chaque préparation collective sauvegardée proposent **Déclarer ce trajet effectué**. L’action ouvre le journal. S’il est désactivé, son activation reste nécessaire ; elle ne crée aucune entrée. **Examiner le brouillon collectif** ouvre ensuite le formulaire. Un journal déjà activé ouvre directement ce brouillon.

Le brouillon reprend les lieux, les étapes et les distances théoriques. La date proposée est celle du départ prévu, en heure de Paris. Si elle est future, le champ reste vide : aucune conversion automatique en voyage effectué aujourd’hui. La date de journal concerne le voyage déclaré ; ses étapes ne sont pas ventilées sur plusieurs jours et leurs heures effectives ne sont pas saisies. La date du déplacement peut être corrigée ; une date future ou impossible est refusée à l’enregistrement. Une recherche, une sauvegarde, une estimation carbone, l’ouverture du journal ou l’activation de celui-ci ne prouvent aucun déplacement.

Chaque étape permet de corriger le mode, les lieux, la ligne et la distance, de décocher **Étape effectuée** ou de demander une estimation carbone. Une étape supplémentaire peut être ajoutée, puis remontée dans l’ordre. Changer de mode vide la distance et le modèle de calcul : l’ancien kilométrage ne devient pas celui du nouveau mode. Les champs vides de distance restent inconnus ; zéro est une valeur explicitement déclarée.

**J’ai effectué ce trajet** et **Enregistrer dans le journal** sont nécessaires. Une modification des données collectives retire la confirmation. Au moins une étape doit être déclarée effectuée. Une double soumission ne crée qu’une entrée ; une reprise avec mêmes date, mode global, lieux normalisés et distance totale signale un doublon possible, avec confirmation distincte d’un autre déplacement. Cette détection est conservatrice : elle ne prouve pas l’identité physique de deux voyages.

Annuler, Échap ou fermer le journal abandonne le brouillon. La préparation sauvegardée reste intacte. Ouvrir ce parcours ne remplace pas le trajet routier principal, ne lance pas de nouvelle recherche ni de consultation réseau. Les préparations déjà chargées peuvent alimenter ce formulaire hors connexion dans l’application ouverte, sous les limites de V018.

## Origine et étapes déclarées

Une entrée collective conserve un seul identifiant de voyage, sa date déclarée, ses lieux globaux, sa note, ses dates de création/modification et sa révision. Son origine contient la source déclarée Mobilités M, la date du calcul, les heures prévues de départ/arrivée, les lieux et les étapes théoriques initiales avec leur mode, ligne et distance. La géométrie et les annonces réseau volatiles ne sont pas recopiées dans le journal.

L’origine reste immuable lors des corrections. La liste des étapes déclarées est distincte : elle représente les données confirmées par la personne, sans mesure GPS ni certification de présence. Les étapes non effectuées restent conservées avec leurs historiques, mais sont exclues des distances et émissions courantes. Les corrections incrémentent la révision ; il ne s’agit pas d’un historique exhaustif de toutes les anciennes valeurs éditées.

Modes d’étape : marche, bus/car, train, tram, métro, funiculaire, téléphérique/télécabine, autre. Ils n’activent aucun routage nouveau. La déclaration d’une étape ajoutée n’est pas contrôlée sur le terrain ni soumise à un calcul d’itinéraire. Les lieux globaux et les lieux d’étape restent ajustables indépendamment, comme données déclarées.

## Distances et bilan mensuel

Le bilan compte **un voyage**, quelle que soit sa quantité d’étapes. Les kilomètres renseignés sont la somme des distances des étapes effectuées, sans ajouter une seconde fois la distance globale. La distance totale du voyage est connue seulement si toutes ces étapes ont une distance ; sinon elle vaut `null` et le kilométrage renseigné reste un sous-total.

La répartition par mode indique le nombre de voyages contenant ce mode, le nombre d’étapes, leurs kilomètres connus et leurs distances manquantes. Exemple fictif : marche 400 m, tram 6 km, marche 100 m donnent un voyage, trois étapes, 6,5 km, un voyage comprenant deux étapes à pied et un voyage comprenant une étape de tram. La somme des nombres de voyages par mode n’est pas un nombre de voyages distincts. Le bilan l’explique.

Une étape de tram dont la distance est inconnue conserve les 500 m de marche renseignés, sans annoncer un total de 500 m pour le déplacement. Corrections, déplacement vers un autre mois, exclusion d’étape et suppression recalculent le bilan. Les entrées simples des versions antérieures restent comptées comme une étape chacune.

## Estimation et historiques carbone

Aucun choix de V030 n’est transféré automatiquement. **Calculer ou actualiser l’empreinte de cette étape** est décoché à chaque ouverture. Le modèle est choisi explicitement pour chaque étape : tramway pour tram, métro pour métro, TGV/Intercités/TER/RER pour train, bus thermique/électrique ou autocar pour bus/car. Les autres modes restent non estimés. Les facteurs figés, unités, sources et licence sont ceux de V009 ; aucune valeur ni API ajoutée.

Les valeurs collectives sont déjà en kg CO₂e/personne-km. La multiplication utilise la distance déclarée sans seconde division par l’occupation. Une distance inconnue empêche une estimation demandée ; elle n’empêche pas d’enregistrer sans estimation. Les valeurs sont additionnées sans arrondi intermédiaire, avec le détail des modèles et facteurs conservé et consultable.

Une correction de date, lieux d’étape, mode ou distance archive une estimation devenue incompatible et retire sa valeur du bilan, sauf demande explicite d’actualisation. Décocher une étape archive son estimation et l’exclut des totaux. Les anciennes valeurs, facteurs, hypothèses, dates et raisons d’archivage sont conservés. Une note ou le libellé de ligne seul ne recalcule pas le facteur. L’activation du calcul sur une étape estimée archive également la précédente estimation.

Le bilan distingue sous-total partiel, étapes estimées et voyages sans estimation complète. La marche n’est pas supposée sans impact. Les périmètres construction seule et construction/énergie des entrées simples restent séparés. Aucun score, classement multimodal carbone ni empreinte exhaustive n’est déduit. Une somme positive très petite reste distincte de zéro à l’affichage.

## Format 3 et sauvegardes

Clé courante : `dragonroute.journal.v3.` suivie de l’espace public ou du chemin d’aperçu. Les formats 1 et 2 restent reconnus et normalisés en mémoire. En l’absence de version 3, priorité à la version 2 puis à la version 1. La lecture seule n’écrit rien ; une première modification volontaire écrit la version 3, sans toucher aux anciennes clés. Chaque ancienne copie reste exportable séparément. Aucun calcul historique n’est automatiquement remplacé.

Les entrées simples conservent leurs champs et historiques. Une entrée `mode: collective` est réservée au format 3 et possède `collective.version: 1`, une origine et des étapes identifiées. Chaque étape porte `included`, mode, lieux, ligne, distance, estimation et historique. La distance globale est revalidée à partir des étapes incluses ; les données incohérentes sont refusées. Les formats anciens ne peuvent pas importer une entrée collective en supprimant silencieusement ses étapes.

Limites : 1 000 voyages, 30 étapes par voyage (effectuées ou exclues), 150 km par étape collective, 50 estimations historiques par étape ou entrée simple, 2 Mo pour le journal exporté. Les textes sont bornés, les identifiants uniques et les dates/nombres/facteurs contrôlés. Aucune troncature ou suppression automatique des données les plus anciennes. Les champs étrangers au format reconnu ne sont pas exportés ; les textes sont échappés.

L’import V010 conserve ses choix explicites de fusion/remplacement, conflits et doublons, avec détail des étapes et de l’origine. Les estimations sont validées avec leurs facteurs figés et ne sont pas actualisées. Le fichier exporté reste en clair, local jusqu’à partage volontaire. Pas de compte ni synchronisation. Le journal public et celui d’un aperçu ne se mélangent pas.

Avant chaque écriture ou effacement, les trois clés sont comparées aux valeurs chargées. Un autre onglet, y compris une ancienne version écrivant la version 2, ne peut être écrasé silencieusement. Quota/refus de stockage préservent l’ancien document et le brouillon. Un journal courant invalide ou futur reste protégé. L’effacement explicite concerne les trois versions de cet environnement, avec confirmation ; profil et préparations sont conservés.

## Vérification et portée

Huit contrôles nouveaux du modèle : comptage, distances inconnues, unités carbone, corrections et historiques, étapes exclues, migration, données invalides et restauration. Neuf scénarios navigateur couvrent confirmation, corrections, origine, exclusions/ordre/ajout, migration et export/import, doublons/dates/annulation, quota/concurrence, préparation hors connexion, formats hostiles/isolation et modes sans facteur. Les suites journal, empreinte, import, marche et PWA accompagnent les vérifications locales ; la suite globale distante porte les nombres effectivement exécutés pour le commit publié.

Les entrées confirmées dans les tests automatisés sont fictives. La recette avec services réels utilise uniquement des lieux publics : recherche collective Grenoble Gares vers l’avenue Innsbruck, ouverture du brouillon, examen et annulation sans confirmer de déplacement réel. Les métadonnées et ressources de l’aperçu publié sont comparées au commit ; captures ordinateur/mobile inspectées. Aucune présence dans un transport, mesure physique d’émissions ou validation sur téléphone physique n’est attestée.

La couverture collective reste celle du pilote Grenoble. Tarification, réservation, accessibilité, qualification nationale et synchronisation restent des travaux distincts. Ce lot rend le journal utilisable pour les étapes déclarées ; il n’atteste ni la circulation d’un service ni la réalité des voyages importés.
