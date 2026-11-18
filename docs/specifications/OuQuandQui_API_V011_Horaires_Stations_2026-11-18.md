# OùQuandQui — Horaires déclarés des stations à l’arrivée

V011 · 18 novembre 2026 · STA-OUVERTURE-01. Complément de STA-04, STA-10, STA-11 et STA-12 du [cahier des charges V5](OuQuandQui-Cahier-des-Charges-V5-2026-09-18.md), après le lot STA-FILTRES-01. Les éditions précédentes restent conservées.

## Parcours disponible

Après le calcul du trajet, « Horaires à l’arrivée » présente une date et une heure de départ explicites, en heure de Paris. L’heure de chargement de la page est proposée puis reste fixe. « Partir maintenant » la remplace volontairement par l’heure courante. Une heure passée est signalée à la saisie ; elle reste utilisable pour examiner un horaire habituel, sans reconstituer l’ouverture réelle passée.

Chaque station comparée reçoit sa propre arrivée : départ prévu + durée routière depuis le départ jusqu’à la station. La matrice OSRM fournit cette durée ; pour les trajets contraints, la première étape du trajet routier avec arrêt la fournit. La distance à vol d’oiseau, la durée totale et le supplément de détour ne remplacent jamais cette durée. Sans durée, sans départ valide ou sans localisation métropolitaine qualifiée, l’arrivée reste inconnue.

Le panneau, les fiches et les points accessibles de la carte indiquent l’heure d’arrivée et le motif : automate déclaré, plage habituelle du guichet compatible, hors guichet sans automate déclaré, ou information inconnue. Les points conservent leur numéro. Les horaires bruts du guichet, les services et le renvoi à la source restent consultables dans la fiche.

Dans « Filtrer les stations », quatre vues sont possibles : toutes ; horaires déclarés compatibles uniquement ; inconnus à vérifier ; hors horaires du guichet sans automate déclaré. Les filtres de détour, services et autonomie se cumulent. Les badges sont recalculés dans les résultats filtrés ; aucun inconnu ne rejoint la vue compatible. Les décomptes horaires avant filtres et les exclusions sont séparés. Une sélection vide ne provoque aucun élargissement. Un arrêt déjà choisi reste dans le trajet et sur la carte avec le message existant s’il ne satisfait plus les filtres.

Changer le départ ou le filtre réévalue les données reçues, sans nouveau géocodage, routage ou appel carburants. Réinitialiser les filtres ne change pas le départ prévu. Aucun horaire ou départ n’est enregistré dans le profil ou le journal par cette fonctionnalité.

## Qualification de la source

Le [descriptif officiel Prix Carburants](https://www.prix-carburants.gouv.fr/rubrique/opendata/) distingue les horaires hebdomadaires du **guichet**, les jours de fermeture du guichet et la déclaration d’un automate de paiement accessible 24 h/24. Les données sont proposées sous Licence Ouverte. Ce descriptif ne définit pas ces horaires comme ceux de la boutique.

L’application utilise les champs déjà disponibles dans le [flux instantané v2 du ministère](https://data.economie.gouv.fr/explore/dataset/prix-des-carburants-en-france-flux-instantane-v2/) : `horaires`, `horaires_automate_24_24`, code postal et coordonnées. Le schéma et 100 exemples publics ont été figés dans [le dossier de qualification](../../data/station-hours/qualification-2026-11-18.json). Cet échantillon atteste des formats examinés, pas d’une couverture exhaustive. Le flux v2 interrogé ne comporte pas le champ `fermeture` décrit pour le XML d’origine. Il ne permet donc pas de contrôler ici les fermetures exceptionnelles. Il ne fournit pas non plus de date de dernière modification des horaires ; date du prix et heure de réception ne sont pas des dates de validation des horaires.

La déclaration d’automate ne détaille pas les carburants accessibles. Elle n’est pas utilisée pour qualifier l’accès au GPLc ; dans ce cas une plage de guichet compatible reste nécessaire. Même pour les autres carburants, un automate déclaré ne garantit ni fonctionnement, ni stock, ni accès terrain. Les ruptures déclarées restent traitées par la recherche existante.

## Contrat temporel

- Fuseau Europe/Paris, France métropolitaine et Corse uniquement ; code postal et coordonnées cohérents requis. Aucun fuseau implicite de l’appareil. Les départs acceptés vont de 2000 à 2099.
- Arrivée calculée en durée écoulée, puis projetée en heure de Paris. Les changements de jour, de semaine, d’année et d’heure sont ainsi traités.
- Heure de départ inexistante au printemps ou ambiguë à l’automne : erreur explicite, aucune sélection silencieuse de la première ou de la seconde occurrence.
- Identifiants officiels des jours 1 à 7. Une journée absente n’est ni ouverte ni fermée. Un nom de jour libre ne remplace pas son identifiant.
- Plages multiples, début inclus et fin exclue ; fin `24.00` acceptée, début `24.00` refusé. Une fermeture inférieure à l’ouverture signifie une plage nocturne reportée au lendemain. Le report de dimanche vers lundi est pris en compte.
- Deux heures identiques, plage illisible, jour dupliqué ou drapeau invalide : journée inconnue. Le drapeau officiel « guichet fermé » prime sur les anciens champs horaires restants, effectivement observés dans la source.
- Une plage nocturne de la veille qui contredit un jour explicitement fermé donne un résultat inconnu. Un jour précédent absent peut empêcher de conclure « hors horaires » ; une plage positive et valide du jour permet néanmoins la compatibilité.
- Une contradiction entre l’automate brut et le champ dérivé donne un résultat inconnu. Un automate 24 h/24 déclaré peut satisfaire la compatibilité sans horaires de guichet, sauf GPLc.

« Compatible » signifie uniquement compatible avec les **déclarations habituelles**. Les jours fériés, exceptions, accès réels, pauses, trafic en direct et horaires spécifiques de services ne sont pas vérifiés. Le filtre ne se nomme pas « ouvert maintenant » et ne promet pas une ouverture physique. STA-10 reste partiel : le filtre sur enseignes exclues ne peut pas être déduit du flux, qui ne publie pas ces enseignes.

## Vérifications et suite

Huit contrôles du modèle couvrent fuseau, bornes, plages coupées, nuit, changement de semaine et d’heure, données absentes ou invalides, automate/GPLc et conservation de l’échantillon réel. Sept scénarios navigateur couvrent les deux chemins de routage, départ figé, filtres combinés, arrêt conservé, carte Leaflet et schéma de secours, détails, mobile, accessibilité automatique et appareil dans un autre fuseau. Les comptes effectifs et la vérification de l’aperçu publié sont consignés dans le rapport du commit et l’état de développement.

Suite proposée : sauvegarder et reprendre une préparation de trajet complète, avec départ et préférences, en distinguant les paramètres conservés des prix, horaires et calculs à actualiser. Aucun abonnement ou compte supplémentaire n’est nécessaire pour cette étape locale.
