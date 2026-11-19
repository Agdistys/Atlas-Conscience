# V038 — Conserver et reprendre un parcours marche et vélo partagé

DOU-PARTAGE-03 · 19 novembre 2026. Complète les préparations lyonnaises [V037](OuQuandQui_API_V037_Parcours_Velo_Partage_2026-11-19.md), les protections de sauvegarde [V034](OuQuandQui_API_V034_Preparations_Velo_2026-11-19.md) et PRO-01/03–07, DOU-03/04 et ERR-01 du [cahier V5](OuQuandQui-Cahier-des-Charges-V5-2026-09-18.md). Les éditions antérieures restent conservées.

## Enregistrement volontaire

Après un calcul complet des trois étapes, « Enregistrer ce parcours partagé » ouvre la rubrique **Vélo partagé** de « Mes trajets ». Les trois autres rubriques restent présentes. L'enregistrement exige un nom et une confirmation ; modifier le nom retire cette confirmation. Un même nom normalisé ou les mêmes lieux, stations et critères demandent une confirmation supplémentaire de doublon. Aucun résultat n'est enregistré automatiquement.

La préparation conserve les lieux résolus, les identifiants et coordonnées des deux stations, les géométries distinctes marche → vélo → marche, les distances et durées brutes, les passages annoncés vélo à la main, les sources et leurs dates disponibles, les temps personnels et le filtre de disponibilité. Une durée personnelle vide reste inconnue ; zéro n'est enregistré que s'il est renseigné. Renommer conserve les dates et le contenu du calcul d'origine.

Les annonces des deux stations sont conservées uniquement comme contexte historique : compte de vélos mécaniques ou de places, états d'installation/location/restitution, dates du flux et de la station lorsqu'elles existent. **Elles ne sont jamais réutilisées comme disponibilités actuelles.** Un import est déclaratif et n'authentifie ni le fournisseur ni les données.

## Consultation locale

La liste et le détail sont accessibles sans appel de données. Le détail présente les trois étapes, les hypothèses de temps et les écarts entre tracés ; son schéma dessine séparément les géométries conservées, sans fond de carte, échelle ou raccordement inventé. La somme historique incluant prise/restitution reste absente si un temps manque, un raccordement dépasse 30 m ou le filtre strict n'était pas satisfait à la capture. Le filtre est évalué à la date de cette capture, jamais utilisé pour affirmer une disponibilité présente.

La consultation fonctionne sans connexion dans une page déjà ouverte. Un aperçu GitHub ne garantit pas sa réouverture hors connexion après fermeture. Les lieux et exports restent en clair dans ce navigateur ou dans le fichier téléchargé ; aucune synchronisation entre appareils. Prix de location, réservation, batterie, état actuel des voies et empreinte ne sont pas estimés par cette sauvegarde. Aucun trajet effectué n'en est déduit.

## Reprise et nouvelle consultation

« Préparer à nouveau ce parcours partagé » copie les lieux et critères dans le panneau Vélo partagé sans consulter de service ni calculer. Les anciennes géométries ne deviennent pas un nouveau résultat.

Une action distincte recharge les trois flux Vélo’v. Le catalogue reçu est comparé aux deux identifiants enregistrés : nom, adresse et coordonnées inchangés, modifiés ou identifiant absent. Un déplacement des coordonnées est affiché en mètres. La réutilisation des stations présentes demande une confirmation, même si leurs informations concordent. Une station absente impose un choix manuel ; aucune station voisine n'est substituée silencieusement. Les numéros de page ou de liste ne servent pas d'identifiants persistants.

Confirmer les stations ne lance aucun routage. « Calculer marche + vélo partagé » déclenche ensuite les trois étapes. Les coordonnées des lieux enregistrés sont réutilisées si leur libellé est inchangé ; modifier le texte applique le parcours de résolution habituel, avec confirmation des lieux ambigus. Pour cette première reprise, les entrées de cache concernées sont invalidées afin de demander les marches et le vélo à nouveau. Une marche de même point reste explicitement nulle sans requête.

Les dates et limites des réponses reçues restent visibles : un flux reconsulté peut contenir des annonces anciennes. Le filtre strict continue de refuser une annonce insuffisante ; confirmer une identité de station ne confirme pas sa disponibilité. Annuler ou échouer conserve la préparation enregistrée, sans présenter un ancien tracé comme un calcul réussi. Les règles de délai, annulation et espacement des consultations V037 restent applicables.

## Format et protections

Stockage indépendant `dragonroute.shared-bike-prepared.v1.` suivi du périmètre public ou du chemin de l'aperçu. Format `dragonroute-shared-bike-preparations`, version 1, maximum **20 préparations**, **2 000 000 octets UTF-8** pour le fichier brut et la représentation canonique indentée. Aucun remplacement ou migration des livres route, collectifs, vélo, du profil ou du journal.

Le validateur contrôle types, identifiants uniques, tailles, dates ordonnées, lieux du pilote, stations distinctes, ordre et sources des trois étapes. Les marches comportent un rattachement aux lieux de 150 m au maximum, des segments de 5 km au maximum et une distance cohérente avec la géométrie à 75 m ou 5 % près. Le vélo réutilise le validateur V034. La marche de même point exige des points exactement identiques et des métriques nulles. Ces contrôles de cohérence n'attestent pas la praticabilité physique.

L'export contient exclusivement ce format. L'import est vérifié avant l'aperçu ; sa confirmation remplace seulement cette rubrique. Le bouton d'export de la liste présente permet une copie préalable. Un fichier vide annonce explicitement qu'il videra cette liste. Champs étrangers supprimés, texte rendu inerte, fichier incohérent, excessif ou version inconnue refusés sans écriture. Une version future déjà présente bloque les écritures ; son contenu brut lisible reste exportable avant un éventuel effacement confirmé.

Quota, stockage refusé ou modification dans un autre onglet empêchent la confirmation de succès et conservent le formulaire. Avant écriture ou effacement, comparaison avec le contenu précédemment chargé ; en cas de conflit, fermeture et réouverture de Mes trajets demandées. Cette détection protège les conflits déjà observables ; localStorage n'offre pas de transaction atomique entre plusieurs onglets écrivant simultanément. Une lecture de fichier arrivée après changement de rubrique ou fermeture est ignorée. Effacement et suppression exigent confirmation, sans nettoyage global du navigateur.

## Vérifications et périmètre

Douze tests de modèle couvrent format et géométries, temps inconnus/zéro, dates et modes invalides, marche nulle, données étrangères, annonces inconnues et anciennes, raccordements, changements de stations, doublons et bornes. Dix-huit scénarios navigateur, exécutés sur quatre formats, couvrent enregistrement, relecture locale, renommage, import/export/annulation, version future, quota, deux onglets, réponses tardives, reprise et nouveaux appels, stations déplacées ou disparues, services indisponibles, clavier et séparation public/aperçu. Les comptes et dates simulés restent distincts des réponses réelles.

Le premier passage a repéré un montage incorrect du scénario d'aperçu : l'interception générique des requêtes empêchait l'injection de son périmètre. L'ordre du montage et une assertion explicite du périmètre ont été corrigés ; les données publiques avaient correctement bloqué l'écriture. Les résultats exécutés et les recettes réelles avant/après publication sont conservés dans `quality/shared-bike-saved` et dans l'état du chantier.

La recette réelle utilise seulement des lieux publics Bellecour/Part-Dieu et les stations 2002/3011 : calcul, sauvegarde confirmée, export, consultation hors réseau, rechargement volontaire des stations, confirmation puis nouveau calcul. Captures ordinateur/mobile et conservation du livre initial vérifiées séparément. Aucun compte, location, déplacement physique ou déclaration de trajet réalisé.

Ce lot lève l'absence de sauvegarde de la chaîne partagée mentionnée en V037. La liaison de cette chaîne au journal, le train + vélo, le VAE et la couverture nationale restent des développements distincts. FOSSGIS demeure dans le cadre de l'essai gratuit modéré déjà qualifié ; aucune commercialisation ou forte charge n'est validée ici.
