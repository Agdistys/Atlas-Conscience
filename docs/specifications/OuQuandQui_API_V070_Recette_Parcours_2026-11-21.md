# V070 — Recette des parcours et état du produit

RECETTE-PARCOURS-01 · 21 novembre 2026. Lecture consolidée des huit usages PAR-01 à PAR-08 et des livrables LIV-01 à LIV-05 du [cahier V5](OuQuandQui-Cahier-des-Charges-V5-2026-09-18.md). Les exigences restent la cible ; les états ci-dessous décrivent la version candidate de la PR 6, sans déclarer tout le cahier terminé. Les éditions V001–V069 sont conservées.

## Huit usages de référence

| Usage | Fonction disponible dans l’aperçu | Limite et preuve à distinguer |
|---|---|---|
| PAR-01 · Préparer | Lieux confirmés, trajet avant arrêts, sans autoroute pour véhicule léger via IGN, choix durée/distance, variantes réellement reçues, aperçu d’un arrêt avant adoption, retour et GPX. | Sans péage, ferries, gabarits et revêtement ne deviennent pas disponibles par cette recette. Les variantes dépendent du moteur. `road-choices`, `route-variants`, `dragonroute` : maintien des contraintes et adoption volontaire. |
| PAR-02 · Plein proche | Classement selon l’accès routier, zone de proximité réglable, filtres, prix datés, poursuite explicite des comparaisons, points et fiches sur la carte. | Collecte bornée et disponibilité déclarée ; aucune garantie d’exhaustivité, de stock ou de distance à partir d’une position suivie en continu. `station-window`, `map-stations`, `dragonroute`. |
| PAR-03 · Plein planifié | Cible, marge avant/après et zone visibles ; sauvegarde des réglages, reprise et nouvelle recherche. | Aucun élargissement caché ; une cible hors trajet exige correction explicite. Le chiffre « 100 km » est un réglage, pas une promesse de station. `station-window`, `prepared-trips`. |
| PAR-04 · Caravane | Profil mémorisable, capacité indisponible visible avant calcul. | Le routage caravane reste non qualifié et bloqué. Le contrôle automatique vérifie ce refus, pas un trajet praticable. Un camion n’atteste ni la largeur réelle, ni le revêtement, ni la sécurité de l’attelage. Les gabarits poids lourd requièrent un service activé et qualifié. |
| PAR-05 · Habitudes | Véhicules, adresses, favoris, préparations et budgets locaux ; export/import avec contrôle, conflits d’onglets et stockage refusé traités. | Données limitées au navigateur ; valeurs historiques identifiées, tarifs et disponibilité à réexaminer. Aucune synchronisation de compte. `dragonroute`, `prepared-trips`, `budget-memory`. |
| PAR-06 · Comparer | Voiture, marche, vélo personnel, collectif Grenoble et vélo partagé Lyon ; contraintes, heures, marges, tris locaux et comparaison d’empreintes compatibles. | Pilotes et périmètres distincts, prix incomplets visibles, aucun agrégateur national de tous les modes. La Boussole pondérée et ses barèmes éthiques restent proposés. `transit-comparison`, `road-choices`, `modal-carbon`. |
| PAR-07 · Partager | Intentions conducteur/passager, recherche externe, rencontres préparées, portion partagée, frais et péages répartis, récapitulatif relu avant copie. | Aucune offre connectée, réservation, transaction ou messagerie. Déclarations et informations inconnues restent distinctes. `carpool`, `meetings`, `shared-tolls`. |
| PAR-08 · Bilan | Journal activé volontairement, déplacement déclaré effectué, correction, export/import, bilan par mode et CO₂e sourcé lorsque calculable. | Pas de détection automatique de déplacement ni de validation de terrain ; inconnues séparées des zéros, périmètres carbone non équivalents non classés ensemble. `journal`, `carbon`, journaux des modes. |

## Couverture consolidée du cahier

| Familles | État de la version candidate | Références de réalisation |
|---|---|---|
| Interface, adresses, position et erreurs | Réalisé en essai ; sélection des lieux, annulation, clavier, petits écrans et texte agrandi. Position ponctuelle volontaire. | V002, V047, V053, V057–V060, V068 |
| Routage, variantes et arrêts | Véhicule léger, marche, sans autoroute IGN, sélection et confirmation ; choix durée/distance et retour. | V001, V021, V054–V056, V065 |
| Véhicules et confort routier | Plusieurs profils locaux ; routage spécialisé et confort caravane non qualifiés. | V020 ; cahier §§08/31/32 |
| Stations, prix, fenêtres et autonomie | Calculs explicites, horaires déclarés à l’arrivée, filtres, fraîcheur, collecte bornée, arrêt et budget facultatifs. | V011, V025, V045–V050, V055, V060 |
| Péages et budget | Grilles sourcées de réseaux couverts, passages confirmés, montant partiel ou inconnu conservé ; budget mémorisé à réexaminer. | V004–V006, V019, V023, V051 |
| Profil et préparations | Données locales, versions protégées, export/import, reprise sans achat ni compte. | V007, V012, V020, V029, V034, V038, V051–V052 |
| Covoiturage | Préparation locale, partage et liens externes disponibles ; agrégation d’offres non raccordée. | V013, V022–V024 |
| Collectif | Pilote Grenoble : parcours, correspondances, exclusions de réseaux et fraîcheur ; horaires théoriques et information temps réel séparés. | V026–V031, V043–V044, V066–V067 |
| Marche et vélo | Marche et vélo personnel ; vélo partagé Lyon en trois étapes. Limites personnelles et préparations. VAE non qualifié. | V014, V032–V042 |
| Tapis Volant et Boussole | Comparaisons explicables des modes calculés, groupes comparables, heure limite et marges ; score pondéré non livré. | V015–V017, V035, V044, V052, V054, V063–V064 |
| Empreinte et journal | Déclaration volontaire, facteurs sourcés, portions et groupes distincts ; aucune émission inconnue changée en zéro. | V008–V010, V017, V024, V030–V031, V036, V039, V063–V064 |
| Navigation, installation, hors ligne | GPX et ouvertures externes, interface installable, consultation de préparations ; aucune navigation GPS continue ni carte hors ligne complète. | V003, V018 |
| Recharge électrique | Lot futur, non intégré. | Cahier §19 |
| Sources, cache, sécurité et concurrence | Sources remplaçables, inconnues explicites, fraîcheur, annulations et écritures volontaires ; périmètres d’essai conservés. | V025, V053, V057, V062, V067 et contrats des modes |
| Qualité et livraison | Tests automatiques, preuves liées au commit, aperçu distinct du site principal ; validation humaine et appareils réels restent distincts. | V059–V062, V069–V070 |
| Public, exploitation, coûts et gouvernance | Objectif confirmé ; pas de compte technique visiteur. Diffusion générale, exploitation des services, contrats, quotas et facturation restent à décider. | Cahier §§22/27/28/31 ; aucune fusion automatique |

Ce tableau ne constitue pas une validation exhaustive exigence par exigence. Les comportements des fichiers cités sont contrôlés ; les cibles non réalisées restent visibles. La mesure globale « pourcentage terminé » serait trompeuse car les fonctions futures n’ont pas toutes la même ampleur.

## Correction et recette obligatoire

Le bouton « Calculer les deux choix » utilise désormais la classe visuelle commune des actions secondaires. Son fond, sa couleur et sa bordure ne dépendent plus du rendu natif du navigateur. Il présentait le même balisage sans classe que le bouton de vélos partagés corrigé en V069 ; aucun échec WebKit propre à ce bouton n’est revendiqué avant exécution de la nouvelle recette. Les empreintes du cache PWA sont actualisées.

Dix scénarios existants complètent les quarante scénarios obligatoires Firefox/WebKit : indisponibilité des profils, comparaison routière et panne partielle, contraintes conservées aux arrêts, stations proches, sauvegarde de fenêtre, heure limite collective, deux parcours de covoiturage et journal. Les mêmes assertions que Chromium sont utilisées, dont les contrôles de contraste. Quatre configurations de cinquante cas sont requises, soit **200 essais**. Aucun scénario antérieur n’est retiré. Le validateur refuse l’ancienne preuve de quarante cas et chaque nouveau cas manquant.

Les résultats définitifs sont liés au commit dans le rapport d’inspection publié, le suivi autonome et `quality/acceptance-paths`. L’ensemble Chromium et les contrôles de construction restent requis. Les sources simulées testent les comportements ; une consultation réelle des services configurés est consignée séparément après publication. Firefox/WebKit épinglés ne valent ni Safari commercial/iOS ni appareil physique. Un succès automatique ne vaut pas réception humaine du produit.

## Dossier central et suite

La présentation V6 complète a été retrouvée sous `0.Protocole` ; le renvoi historique dans `Site/OuQuandQui` reste conservé. Une nouvelle édition V007 centralise cette recette dans le même document, conserve les deux onglets et les outils de lecture, et garde l’ancien état de réalisation comme historique daté. Son export Markdown contient aussi l’actualisation. Les originaux ne sont ni déplacés ni écrasés.

Prochain travail réalisable sans nouveau service : faire apparaître clairement **OùQuandQui** comme produit et **DragonRoute** comme module routier, dans l’application et son installation, en préservant les URLs et données existantes (DEC-15). Les décisions d’exploitation, de fournisseur spécialisé et de publication générale seront présentées avec leurs conséquences, après préparation concrète. Aucun compte, abonnement, paiement, infrastructure ou fusion n’est engagé par ce lot.
