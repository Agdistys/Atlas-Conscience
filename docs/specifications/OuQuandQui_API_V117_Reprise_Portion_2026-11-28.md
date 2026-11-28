# OùQuandQui · V117 · Enregistrer et reprendre une portion payante

Date : 28 novembre 2026. Complément de V116. La préparation peut conserver la portion choisie comme historique local. La reprise demande un nouveau calcul, un nouveau choix et une nouvelle confirmation. Les éditions précédentes restent conservées.

## 💾 Enregistrement volontaire

Après adoption d’une portion, « Enregistrer cette préparation » conserve le trajet, ses paramètres et la géométrie historique de la portion dans la bibliothèque habituelle. Le nom, la confirmation et l’avertissement de doublon gardent leur fonctionnement. Aucun enregistrement n’est déclenché par le calcul ou le guidage.

Le tarif déclaré de la portion est conservé seulement lorsque la conservation du budget est cochée. Sans cet accord, la portion reste mémorisée, mais sa référence tarifaire et le budget restent absents. Un prix inconnu reste inconnu ; un zéro n’est accepté que comme montant explicitement présent dans les données historiques. L’arrêt carburant éventuel reste un souhait à rechercher et confirmer à nouveau.

## 🗂️ Historique et format

Le format courant des préparations passe à 12. Le champ selectedToll contient un souvenir versionné, uniquement pour un trajet voiture au plus rapide issu du pilote. Il conserve la classe, la date, l’exception autoroutière éventuelle, les coordonnées de la portion, le fournisseur, la date du graphe et celle de la réponse. Une référence tarifaire facultative conserve les noms des gares, le sens, la classe, la date, le montant, la source et sa période.

La portion doit figurer dans le même sens à l’intérieur du tracé historique. Les limites de 20 préparations, 25 000 points par tracé et 2 Mo restent appliquées. Aucun identifiant de session, proposition exécutable, confirmation, index tarifaire ancien ou état GPS n’est restauré. Les données importées restent déclaratives : leur cohérence ne constitue pas une preuve du passage réel.

Les formats 1 à 11 restent lisibles. Leurs sauvegardes d’origine sont conservées et exportables, notamment le format 11. La nouvelle version est écrite seulement après une action volontaire. Un fichier ancien contenant une exception payante qu’il ne sait pas représenter est refusé ; la sélection n’est jamais supprimée silencieusement lors d’un import.

## 🔄 Reprise et trajet de référence

« Préparer à nouveau ce trajet » restaure les paramètres et affiche le souvenir. Cette action ne demande aucun nouveau calcul, aucune position GPS et aucune écriture dans le journal. L’ancien tracé et l’ancien prix ne deviennent pas des résultats actuels.

Le bouton principal calcule ensuite une référence sans péage avec le relais gratuit du pilote, en respectant les évitements. Ce calcul reste isolé du connecteur général. Les instructions, les attributs routiers, la proximité des points de départ et d’arrivée et l’absence de péages sont contrôlés avant l’affichage. Une panne ou une limite de service laisse la reprise en attente, sans service de substitution.

Tant que la portion n’est pas rechoisie ou retirée explicitement, le guidage, les recherches de stations, les renvois de navigation, l’enregistrement du trajet de référence et sa copie vers le journal restent bloqués. Masquer le rappel général ne retire pas ce verrou. Les lieux ou options incompatibles demandent de reprendre la préparation ou de retirer volontairement le souvenir.

## 🛣️ Nouveau choix et confirmation

« Rechoisir la portion » ouvre la comparaison actuelle. La classe mémorisée reste visible et modifiable. Aucune portion n’est cochée automatiquement, même lorsque le nouveau tracé semble identique à l’ancien. La personne choisit dans les nouvelles propositions, compare puis adopte volontairement.

« Reprendre les gares mémorisées » propose uniquement les noms présents sans ambiguïté dans la grille actuelle et dans le sens publié. Le prix affiché est recalculé pour la classe et la date actuelles ; le montant historique reste un souvenir distinct. La confirmation de correspondance des gares reste décochée. Des noms absents, renommés ou ambigus laissent le choix manuel disponible, sans rapprochement approximatif caché.

Après adoption, les stations peuvent être recherchées à nouveau et le guidage peut être démarré volontairement. Revenir à la référence précédente rétablit la reprise en attente. Retirer explicitement le souvenir efface les résultats intermédiaires et demande un nouveau calcul ordinaire ; la préparation enregistrée reste intacte.

## 🔒 Conservation et cas d’échec

Les lectures ne réécrivent pas le stockage. Une modification concurrente du format courant ou d’une ancienne sauvegarde bloque l’écriture et l’effacement. Un stockage indisponible ou plein ne remplace pas la liste précédente. Export, aperçu d’import, confirmation et limites de capacité restent communs à la bibliothèque existante.

Les champs inconnus ne transportent ni clé ni confirmation. Les sources tarifaires exigent une adresse HTTPS sans identifiants. Le type de véhicule, le moteur, le critère, la géométrie, les dates et les évitements doivent être cohérents. Un budget de portion ne peut pas transformer une déclaration de gares en couverture automatiquement vérifiée, ni compter une deuxième fois le tarif.

## 🧪 Vérifications

Les contrôles du modèle couvrent aller-retour, migration, géométrie inversée ou absente, chronologie, contexte incompatible, inconnus, prix zéro, source hostile, noms ambigus et exclusion des états exécutables. Les parcours navigateur couvrent sauvegarde et rechargement, consentement au budget, nouvelle classe, confirmation décochée, quota, annulation, retrait volontaire, export/import, sauvegarde originale et conflit entre onglets.

Les résultats locaux, ceux de GitHub et la vérification de l’aperçu publié sont consignés séparément pour le commit livré. Une simulation GPS et un navigateur de largeur mobile ne remplacent pas la recette sur Android physique. Les anciens contenus de la présentation restent conservés et datés.

## ➡️ Suite du développement

Le prochain axe porte sur le choix et la qualification d’accès intermédiaires, pour raccourcir la portion payante volontairement empruntée. Le rattachement tarifaire automatiquement vérifié et le plafond strict restent distincts des gares déclarées. La couverture nationale et la recette Android physique restent à qualifier.

Le site et ses aperçus restent sur GitHub. Openrouteservice et Cloudflare conservent exclusivement les offres gratuites autorisées ; les limites globales du pilote restent inchangées. Aucune fusion sur le site principal ni publication Webnode n’est comprise dans cette livraison.

