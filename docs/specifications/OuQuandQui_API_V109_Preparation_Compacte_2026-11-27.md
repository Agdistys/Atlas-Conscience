# OùQuandQui — V109 — Préparation compacte, préférences et adresses

Date : 27 novembre 2026. Lot NAV-UX-03. Complément du référentiel V108 ; les exigences et preuves antérieures sont conservées. Le parcours prioritaire reste la préparation du trajet puis le guidage dans l’application, avant l’enrichissement des arrêts et alternatives.

## Choix du déplacement

« Comment se déplacer ? » devient un menu repliable. Son résumé affiche le dernier mode choisi, ou la voiture lors d’une première ouverture. Voiture, marche, vélo personnel, transports collectifs et vélo partagé restent accessibles au clavier et au toucher. Le véhicule enregistré et son type se choisissent dans ce même menu ; aucune seconde rubrique « Véhicule pour ce trajet » ne figure dans les options. La liste des véhicules mémorisés disparaît lorsqu’elle est vide.

Le profil permet de définir le mode par défaut. L’enregistrement explicite de ce défaut remplace le dernier mode mémorisé. Réouvrir la page ne lance ni géolocalisation ni calcul et n’ouvre pas spontanément une fenêtre vélo ou transports : le bouton principal ouvre la préparation correspondante. Les limites de couverture restent celles des services existants.

## Critères et informations

Le calcul conserve deux critères distincts : « 🐎 Plus rapide » et « 🪽 Plus court ». « 💨 Vitesse » choisit le critère de durée. « 💰 Coût » ouvre la comparaison des variantes après le calcul : mêmes lieux, consommation et prix de carburant renseigné. Les dépenses inconnues restent inconnues ; la plus petite distance n’est jamais présentée comme une preuve de coût total minimal. Le choix final d’un tracé reste volontaire. Cette comparaison de dépenses concerne le véhicule routier.

« Partir plus tard » regroupe les dates et l’heure limite. Les explications ordinaires sont disponibles sous ⓘ. Les erreurs bloquantes et exclusions indisponibles restent signalées. Le diagnostic des services est déplacé dans Réglages et accessible depuis le profil.

## Carte de nuit et bande horaire

Les choix Jour, Nuit et Selon l’appareil sont mémorisés localement. Un bouton sous la carte bascule Jour/Nuit. Le mode nuit transforme uniquement les couleurs des tuiles, sans nouveau fournisseur ; les tracés, repères et attributions restent distincts. Il ne s’agit pas d’un fond cartographique natif nocturne.

La bande sous la carte indique l’heure de Paris et l’arrivée estimée à partir du départ prévu. Elle réutilise le calcul temporel existant : une pause inconnue ou une date invalide ne produit pas une arrivée certaine. La date est ajoutée lorsque l’arrivée est un autre jour. Le guidage conserve son propre calcul de progression ; cette bande de préparation ne constitue ni une mesure du trafic ni une progression GPS.

## Profil et dossiers d’adresses

Le profil local passe au format 4. Les formats 1, 2 et 3 restent lisibles et leurs copies d’origine restent conservées et exportables. Aucune migration n’est écrite lors d’une simple lecture. Export, import avec aperçu et confirmation, refus d’un format inconnu, contrôle des modifications entre onglets et gestion du stockage plein restent applicables.

Jusqu’à vingt dossiers peuvent classer les cinquante adresses du profil. Création, renommage, déplacement d’une adresse et filtre par dossier sont disponibles. Supprimer un dossier conserve ses adresses sans classement. Les noms vides ou déjà utilisés sont refusés. Les dossiers sont inclus dans l’export ; une référence à un dossier absent est refusée à l’import.

Une adresse de départ ou d’arrivée peut être enregistrée depuis son champ. La fiche d’une station propose « Enregistrer dans mes adresses » : nom, dossier, coordonnées et provenance DGCCRF sont conservés après validation. Cette provenance n’est pas attribuée à l’IGN. Le lien vers la fiche permet de demander des informations actuelles ; la copie locale ne garantit pas les horaires ni les prix. Les favoris de stations existants restent conservés séparément.

## Péages et véhicule

Chaque véhicule peut mémoriser une classe de péage déclarée, une hauteur et un PTAC. Le PTAC est distinct du poids réel en charge utilisé pour le routage. Ces valeurs sont reprises dans le budget, avec une confirmation du véhicule pour le trajet ; elles n’activent aucun service de routage lourd et ne constituent pas une classification automatique.

Les tarifs restent limités aux grilles datées disponibles, notamment APRR/AREA et BPNL, avec leurs règles propres. Il n’existe pas encore de total national automatique qualifié. La [classification ASFA](https://www.autoroutes.fr/fr/classification-des-vehicules.htm) distingue hauteur, PTAC, essieux et ensembles avec remorque.

## Portions payantes à choisir — exigence conservée, non livrée

Objectif : dans le détail textuel, identifier une portion payante, afficher son prix selon le véhicule et autoriser explicitement cette seule portion malgré un évitement général. L’acceptation doit vérifier entrée, sortie, sens, géométrie parcourue, classe, date, source du tarif et maintien des exclusions sur le reste du trajet. Un point proche d’un péage ne prouve pas le passage et ne peut pas remplacer cette vérification. Une portion autorisée à un prix maximal ne doit pas être adoptée si son prix est inconnu.

Les capacités du service IGN configuré ont été consultées et conservées dans les preuves du lot. Les [contraintes, étapes et attributs de l’API IGN](https://cartes.gouv.fr/aide/fr/guides-utilisateur/utiliser-les-services-de-la-geoplateforme/calcul-itineraire/) nécessitent un raccordement et une qualification spécifiques pour cet usage. Le présent lot ne prétend pas imposer une section exacte ni certifier une portion à deux euros.

## Radars — étude, sans activation

Des positions sont publiées, notamment dans le [jeu communautaire Radars automatiques](https://www.data.gouv.fr/datasets/radars-automatiques), sous Licence Ouverte. Le fichier principal affiché est daté d’octobre 2018 ; la modification de la page en 2024 ne constitue pas une actualisation de ces positions. Cette source n’est donc pas intégrée comme alerte actuelle.

Une fonction publique nécessite une source entretenue, des droits de réutilisation vérifiés et un examen du dispositif au regard des règles françaises, notamment [l’article R413-15 du Code de la route](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000025111528). Afficher une zone de vigilance ne revient pas à afficher un contrôle précis. Aucun détecteur, signalement communautaire en temps réel ou garantie d’absence de radar n’est ajouté.

## Vérification et périmètre

Les contrôles portent sur conservation des anciens profils, dossiers et provenance, préférences persistantes sans recherche implicite, retour du focus, lisibilité mobile, mode nuit, horaires inconnus et comparaison sans faux budget. L’inspection complète et la publication doivent concerner le même commit avant livraison de l’aperçu. L’essai physique Android, notamment GPS, audio, interruptions et parcours réel, reste ouvert.

L’étude ergonomique utilise des captures et documents publics de Waze. L’application Android Waze n’a pas été exécutée ni décompilée. Aucun composant propriétaire, nouveau fournisseur, compte, coût, hébergement ou fusion de la branche principale n’est introduit.
