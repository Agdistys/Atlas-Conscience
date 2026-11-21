# V039 — Journal volontaire des parcours marche et vélo partagé

JOU-PARTAGE-01 · 19 novembre 2026. Complète JOU-01 à JOU-05, DOU-04 et les protections PRO-03/04/05 du [cahier V5](OuQuandQui-Cahier-des-Charges-V5-2026-09-18.md), les [préparations partagées V038](OuQuandQui_API_V038_Preparations_Partagees_2026-11-19.md), le [journal collectif V031](OuQuandQui_API_V031_Journal_Collectif_2026-11-19.md) et la [déclaration vélo V036](OuQuandQui_API_V036_Journal_Velo_2026-11-19.md). Les éditions précédentes restent conservées.

## Une préparation, puis une déclaration

Le résultat marche → vélo partagé → marche et sa préparation conservée dans Mes trajets proposent **Déclarer ce parcours effectué**. L'action ouvre le journal sans ajouter d'entrée. Si le journal est désactivé, son activation est distincte ; « Examiner le brouillon marche et vélo partagé » ouvre ensuite le formulaire. S'il est déjà activé, le brouillon s'ouvre directement.

La date est vide à chaque nouvelle déclaration. Ni date de capture, ni consultation d'un moteur, ni sauvegarde ne constituent la date d'un déplacement effectué. La personne choisit une date présente ou passée et confirme « J’ai effectué ce trajet ». Modifier une étape ou les données globales retire la confirmation. Fermer, Échap ou annuler abandonne le brouillon ; fermer avant activation abandonne aussi la proposition en attente.

Un trajet calculé ou sauvegardé ne prouve aucune location ni présence sur le parcours. Les déclarations confirmées des tests automatisés sont fictives. Les recettes avec les services réels ouvrent puis annulent les brouillons, sans enregistrer de déplacement effectué.

## Trois étapes ajustables

Le formulaire reprend marche d'accès, vélo et marche finale, avec leurs lieux et distances théoriques. Chaque étape peut être corrigée, décochée comme non effectuée ou remontée dans l'ordre. Une étape supplémentaire peut être ajoutée, dans la limite de trente. Les modes proposés pour cette chaîne sont marche, vélo et autre ; ils décrivent une déclaration, sans activer de nouveau calculateur.

Changer le mode d'une étape retire sa distance et son modèle carbone. Une distance vide reste inconnue ; zéro est une valeur déclarée. Les lieux globaux et ceux des étapes sont ajustables indépendamment. Le repère facultatif d'étape est un texte libre, sans recherche ni interprétation automatique. Une étape décochée et ses historiques sont conservés hors des totaux. Au moins une étape doit être déclarée effectuée.

Le bilan compte **un voyage** pour l'ensemble. Les kilomètres connus sont additionnés une seule fois à partir des étapes incluses. Si une distance manque, la distance globale reste inconnue et les kilomètres renseignés forment un sous-total. Le bilan par mode distingue voyages et étapes : deux marches d'un même voyage comptent comme deux étapes à pied et un voyage comprenant de la marche. Correction, changement de mois, exclusion et suppression recalculent le bilan.

## Origine conservée séparément

Le mode global `shared` du journal version 3 contient `shared.version: 1`, une origine `shared-bike-origin-v1` et les étapes déclarées. L'origine reste inchangée lors des corrections. Elle conserve les lieux initiaux, les identifiants/noms des stations, la date de capture, les temps personnels prévus pour prise/restitution et exactement trois étapes théoriques avec modes, sources, distances, durées, consultations, versions disponibles et mètres annoncés vélo à la main.

Les géométries, coordonnées, adresses détaillées des stations et comptes de disponibilité ne sont pas recopiés dans le journal. Les libellés de lieux peuvent néanmoins être personnels et les exports restent en clair. L'origine importée est déclarative : la validation de cohérence n'authentifie pas son fournisseur, son contenu ou le déplacement.

Les consultations doivent précéder ou coïncider avec la capture. L'ordre marche/vélo/marche, les sources IGN piéton/FOSSGIS vélo, les bornes de métriques, les noms de raccordement et les stations distinctes sont contrôlés. Une marche présentée comme « même point demandé » conserve distance et durée nulles ; le journal ne possède pas les coordonnées permettant d'en revérifier la géométrie. Aucun temps effectivement mesuré n'est inventé à partir des durées préparées ou des temps personnels prévus.

Les portions annoncées vélo à la main restent dans la provenance cyclable. Elles ne deviennent pas automatiquement des étapes de marche réellement effectuées ; les étapes déclarées sont ajustées par la personne. Une correction conserve la provenance et les historiques d'estimation, sans constituer un historique exhaustif de toutes les anciennes valeurs éditées.

## Estimation d'empreinte facultative

Chaque étape vélo peut recevoir un modèle moyen mécanique ou électrique du jeu ADEME / Impact CO₂ déjà figé en V009. Aucun appel de fournisseur ni facteur supplémentaire. Le calcul est décoché à chaque ouverture ; une nouvelle déclaration ne présélectionne aucun modèle. Les facteurs sont exprimés par personne-kilomètre et ne sont pas divisés à nouveau par l'occupation.

Le modèle mécanique porte la construction seule, le modèle électrique construction et énergie. Ces périmètres sont présentés séparément dans le brouillon, le détail et le bilan, y compris lorsqu'un voyage comporte plusieurs étapes vélo avec des modèles différents. Il s'agit de modèles génériques du vélo ; les effets propres au service de location ne sont pas estimés. Choisir le modèle électrique pour le déplacement déclaré ne qualifie aucun routage VAE, batterie ou autonomie.

Marche et autre restent non estimés. Une estimation demandée exige une distance connue et un modèle compatible. Une distance déclarée nulle peut produire zéro ; une distance absente ne le peut pas. Les sous-totaux et le nombre d'étapes estimées restent visibles, sans empreinte exhaustive ni classement automatique.

Corriger date, lieux d'étape, mode ou distance archive une estimation devenue incompatible et la retire du bilan, sauf recalcul explicitement demandé. Décocher une étape archive son estimation et l'exclut. Une note ou un repère seuls ne recalculent pas le modèle. Facteurs, unités, anciennes hypothèses et motifs d'archivage restent exportables ; limite de cinquante estimations historiques par étape conservée.

## Conservation, import et erreurs

La clé du journal demeure `dragonroute.journal.v3.` suivie du périmètre public ou du chemin de l'aperçu. Aucune migration à la lecture. Les copies des formats 1 et 2, entrées simples et collectives restent conservées. Le type partagé est réservé au format 3 ; une édition antérieure qui ne connaît pas ce mode refuse le document plutôt que supprimer silencieusement ses étapes. Un retour à une édition antérieure n'est pas une conversion de format.

Export, aperçu d'import, ajout/remplacement, résolution des doublons et conservation des historiques utilisent le parcours existant. Même identifiant et contenu identique n'ajoutent rien. Une nouvelle déclaration avec mêmes date, mode global, lieux normalisés et distance est un doublon possible, nécessitant confirmation distincte. Une double soumission immédiate ne crée qu'une entrée. Ce contrôle n'identifie pas physiquement deux voyages.

Limites : mille voyages, trente étapes par chaîne, 300 km par étape de cette chaîne partagée, cinquante estimations historiques, deux millions d'octets pour le journal canonique indenté. Les limites collectives antérieures restent inchangées. Nombres, types, dates, sources, identifiants, modes et estimations incohérents sont refusés ; champs étrangers supprimés et texte rendu inerte. Aucune suppression ou troncature automatique pour libérer de la place.

Quota, stockage refusé, journal invalide/futur ou conflit détecté avec un autre onglet conservent les données précédentes et le formulaire. Les trois clés courante/anciennes sont comparées avant écriture ou effacement. Cette comparaison détecte les conflits observables ; elle n'est pas une transaction atomique entre onglets simultanés. Aucune synchronisation, aucun effacement du profil ou des préparations. L'ouverture depuis une préparation chargée fonctionne sans réseau dans la page ouverte et ne déclenche aucune requête de trajet, disponibilité ou empreinte.

## Vérifications et limites

Douze contrôles de modèle : origine minimale, compte unique, distances inconnues/zéro, périmètres d'empreinte, corrections et exclusions, sources/dates/modes invalides, temps prévus, formats, restauration/doublons, données étrangères, limites et bilan mixte. Seize scénarios navigateur sur quatre formats : activation/date/confirmation, calcul actuel, préparation hors réseau, correction et historique, ajout/ordre/exclusion, import/export, double soumission, quota, deux onglets, formats hostiles, isolation d'aperçu, clavier, périmètres distincts et anciens journaux.

La première passe ordinateur a révélé un montage incomplet du scénario d'aperçu : sa préparation de test avait été fournie seulement dans l'espace public. Le jeu de données propre à l'aperçu a été ajouté ; la séparation des espaces de l'application reste active. Échec initial et reprises conservés dans `quality/shared-bike-journal`.

Recette réelle séparée avant et après publication : lieux publics Bellecour/Part-Dieu et stations 2002/3011, calcul direct vers brouillon annulé, nouvelle préparation sauvegardée puis brouillon ouvert hors réseau et annulé. Distances confrontées aux réponses reçues, six captures ordinateur/mobile relues, aucun déplacement déclaré effectué. Les résultats exécutés, commit et limites figurent dans les preuves du lot et l'état du chantier.

Ce lot lève l'absence de liaison au journal des chaînes partagées signalée en V037/V038. Il n'ajoute ni réservation, prix de location, trajet train + vélo, couverture nationale, accessibilité, validation de terrain ou téléphone physique. Pilote lyonnais et cadre d'essai gratuit modéré FOSSGIS conservés.
