# V036 — Du parcours vélo au journal volontaire

JOU-VELO-01 · 19 novembre 2026. Complète JOU-01 à JOU-05 et EMP-02/03/06 du [cahier V5](OuQuandQui-Cahier-des-Charges-V5-2026-09-18.md), le [journal V008](OuQuandQui_API_V008_Journal_Mobilite_2026-11-18.md), les [facteurs et historiques V009](OuQuandQui_API_V009_Empreinte_Journal_2026-11-18.md), la [restauration V010](OuQuandQui_API_V010_Restauration_Journal_2026-11-18.md) et le [format collectif V031](OuQuandQui_API_V031_Journal_Collectif_2026-11-19.md). Les parcours et préparations vélo restent définis en [V033](OuQuandQui_API_V033_Itineraires_Velo_2026-11-19.md), [V034](OuQuandQui_API_V034_Preparations_Velo_2026-11-19.md) et [V035](OuQuandQui_API_V035_Comparaison_Velo_2026-11-19.md). Éditions précédentes conservées.

## Parcours utilisable

La fiche d’un parcours vélo calculé et la consultation d’une préparation enregistrée proposent **Déclarer ce trajet effectué**. Le parcours peut également provenir d’une comparaison : sa fiche utilise la même action. Les panneaux précédents se ferment avant l’ouverture du journal ; le trajet principal reste en place.

Si le journal est désactivé, son activation reste une action distincte. **Examiner le brouillon vélo** ouvre ensuite le formulaire, sans ajouter d’entrée. Un journal déjà activé ouvre directement le brouillon. Une version locale inconnue ou invalide reste protégée contre les écritures.

La date du déplacement est **vide à chaque nouvelle déclaration vélo**. La date de consultation du moteur, la date de sauvegarde et une heure prévue de comparaison ne sont pas des dates de déplacement effectué. La personne doit choisir une date présente ou passée selon le jour du navigateur. Le mode proposé est vélo, les lieux et la distance viennent de la préparation ; ils restent modifiables. Le champ de distance peut être vidé lorsqu’elle est inconnue. Zéro reste une valeur déclarée distincte.

**J’ai effectué ce trajet** puis **Enregistrer dans le journal** sont nécessaires. Modifier un champ de cette déclaration retire sa confirmation. Une modification de mode retire également la distance et le modèle carbone choisis, y compris lors d’un aller-retour vers le mode vélo. Le calcul d’origine reste conservé comme référence. Annuler, fermer ou Échap abandonnent le brouillon ; la fermeture abandonne aussi une proposition encore en attente d’activation.

L’ouverture depuis une préparation chargée fonctionne sans réseau dans la page ouverte. Aucun nouveau géocodage, calcul routier, consultation de disponibilité, appel carbone ou suivi GPS n’est déclenché. La préparation, le profil, le trajet principal, les autres journaux et les autres environnements ne sont pas réécrits par cette consultation.

## Origine théorique et données déclarées

Le journal conserve une origine `cycle-snapshot-v1` dans le champ `calculation` du format 3 : source `fossgis-bike`, mode de préparation `bike`, lieux, distance brute, durée estimée, distance annoncée vélo à la main, date de consultation et version des données lorsqu’elle est fournie. Une version vide est normalisée en inconnue. Le tracé, les coordonnées, les étapes détaillées et la préférence personnelle de distance ne sont pas recopiés dans le journal.

Distance d’origine entre 1 m et 300 km, durée entre une seconde et sept jours, nombres strictement numériques et finis. Les mètres vélo à la main restent bornés par la distance avec la tolérance de cohérence du moteur déjà qualifié. Cette tolérance n’est ni une précision de mesure ni une condition physique. Source, mode, date, version et absence d’arrêt automobile sont vérifiés. Les champs étrangers au format reconnu ne sont pas exportés.

La distance reprise est affichée au mètre dans le formulaire. Lorsqu’elle est confirmée à l’identique avec les lieux et le mode, la valeur brute du calcul reste conservée ; une modification devient une distance déclarée, et une valeur vide reste inconnue. L’origine est immuable lors des corrections, même si le mode réellement déclaré devient marche ou autre. Sa durée reste celle de la préparation : aucune durée effectivement mesurée n’est créée.

Le mode global du journal décrit le déplacement déclaré. Les portions annoncées vélo à la main restent visibles dans la provenance ; elles ne sont pas automatiquement transformées en étapes réellement parcourues ni déduites de la distance déclarée. La personne ajuste celle-ci en fonction du déplacement qu’elle souhaite consigner. Aucune présence sur le tracé, disponibilité matérielle ou utilisation d’un VAE n’est attestée.

## Empreinte facultative et révisions

L’estimation reste décochée à chaque ouverture et aucun facteur n’est présélectionné. Le modèle mécanique ou électrique est choisi pour le déplacement déclaré, indépendamment du profil classique utilisé par le calculateur. Ce choix dans le journal ne valide aucun routage, batterie ou autonomie VAE.

Les facteurs ADEME / Impact CO₂ déjà figés en V009 sont réutilisés localement. Le modèle mécanique porte la construction seule ; le modèle électrique porte construction et énergie. Ces périmètres restent séparés dans le bilan. Les unités par personne-kilomètre ne sont pas divisées à nouveau par un nombre de voyageurs. L’alimentation humaine et les impacts non fournis par le modèle ne sont pas ajoutés ni supposés inclus.

Distance inconnue ou modèle absent : empreinte non estimée. Une distance explicitement nulle et un modèle choisi peuvent produire zéro ; le mode vélo n’est jamais déclaré sans impact par défaut. Corriger date, lieux, mode ou distance archive l’estimation précédente et la retire du bilan courant, sauf demande explicite de recalcul. Corriger uniquement une note conserve l’estimation. Les facteurs, unités, valeurs, dates et historiques restent exportables.

## Format, import et conservation

La clé courante demeure `dragonroute.journal.v3.` suivie du périmètre public ou de l’aperçu. Cette extension ajoute un type de calcul historique explicite : elle ne migre ni ne réécrit les journaux lors d’une lecture. Les anciens calculs routiers et les étapes collectives restent reconnus. Les copies d’origine des formats 1 et 2 sont conservées selon V031.

Un calcul `cycle-snapshot-v1` est accepté uniquement dans le format 3 ; le présenter comme format 1 ou 2 est refusé. Les éditions antérieures de l’application qui ne reconnaissent pas ce type de calcul refusent le document au lieu de supprimer sa provenance. Revenir à une édition antérieure ne constitue donc pas une migration vers un ancien format.

Export, import avec aperçu, ajout/remplacement et choix des doublons conservent l’origine et les estimations. Un document importé cohérent ne prouve pas son authenticité ni la réalisation du déplacement. Même identifiant et contenu identique : aucune deuxième entrée. Même date, mode, lieux normalisés et distance : doublon possible, nécessitant la déclaration d’un autre déplacement. La détection ne constitue pas une identification physique des voyages.

Les règles existantes restent actives : 1 000 voyages, 2 Mo exportés, 50 estimations historiques par entrée simple, concurrence contrôlée sur les trois clés de journal, quotas et formats futurs protégés. Une double soumission immédiate ne crée qu’une entrée. Modification, suppression et restauration recalculent le bilan ; une erreur conserve les données et le formulaire. Aucun effacement, synchronisation ou activation implicite.

## Vérifications

Dix contrôles du modèle couvrent la date à déclarer, l’origine minimale, les limites et versions, les corrections, les inconnus, les unités/périmètres carbone, les historiques, les bilans, la restauration et les conflits. Treize scénarios navigateur sur quatre formats couvrent activation, confirmations, parcours direct/sauvegardé/comparé, consultation sans réseau, changements de mode, doubles soumissions/doublons, corrections et suppression, dates futures, quotas/concurrence, anciens formats, import altéré, textes inertes et isolation des aperçus.

Le premier essai ordinateur a révélé une erreur dans le scénario d’isolation : après rechargement, les lieux d’essai n’étaient pas ressaisis et la simulation renvoyait deux fois le même point. L’application a refusé ces lieux identiques ; le scénario est corrigé sans modifier cette protection. Les suites journal, carbone, import, collectif, vélo, sauvegardes et comparaisons accompagnent la recette.

Les entrées enregistrées dans les tests automatisés sont fictives. La recette sur services réels utilise des lieux publics, ouvre le brouillon depuis le calcul et la préparation, puis l’annule : aucun déplacement réel n’est déclaré. Métadonnées du commit, fichiers publiés et affichages ordinateur/mobile sont vérifiés séparément. Aucun téléphone physique, trajet sur route ou mesure d’émissions attestés.

Les preuves exécutées et leurs limites sont consignées dans `quality/cycling-journal` et l’état de développement. Ce lot n’ajoute ni fournisseur, compte, service payant, hébergement, routage VAE ni chaîne avec location/restitution.
