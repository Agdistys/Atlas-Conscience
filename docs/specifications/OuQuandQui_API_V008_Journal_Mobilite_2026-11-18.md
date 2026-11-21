# OùQuandQui — Journal volontaire de mobilité

V008 · 18 novembre 2026 · Lot JOURNAL-01. Complément au [cahier des charges V5](OuQuandQui-Cahier-des-Charges-V5-2026-09-18.md), JOU-01 à JOU-05 et EMP-01. V001–V007 conservés.

## Parcours utilisable

« Mon journal » ouvre un journal local désactivé par défaut. L’activation n’ajoute aucune entrée. Une recherche d’itinéraire, un arrêt choisi et une navigation ouverte ne sont jamais réputés effectués. Après activation, « Reprendre le trajet affiché » prépare un formulaire ; « J’ai effectué ce trajet » et l’enregistrement sont nécessaires. Une saisie manuelle permet aussi de renseigner un déplacement en voiture, poids lourd, train, bus/car, vélo, marche ou autre. Ces modes déclarés n’activent aucun nouveau moteur de routage.

Le formulaire contient date, départ, arrivée, mode, distance facultative et note facultative. Les dates impossibles, antérieures à 1900 ou futures lors d’un ajout/correction sont refusées. Les dates conservées restent lisibles si l’horloge de l’appareil recule. Le jour est celui du navigateur, sans conversion UTC qui déplacerait un jour civil. La distance est en kilomètres dans le formulaire, en mètres dans les données ; elle est bornée à 40 000 km. Le champ vide vaut inconnu ; zéro reste une valeur déclarée.

Un trajet préparé reprend sa distance avec l’arrêt sélectionné, les lieux, le moteur, la date du calcul et la version des données lorsqu’elle est fournie. Ce sont des références de préparation, pas une mesure GPS du déplacement. Modifier la distance ou les lieux en fait une distance déclarée ; changer de mode vide la distance à renseigner. Le calcul d’origine demeure conservé et visible, même après correction. Une nouvelle recherche, une modification de destination ou le retrait d’un arrêt ne modifie jamais le journal existant.

## Confirmation, correction et doublons

Un identifiant est créé pour le formulaire et une confirmation réussie ferme ce formulaire. Double soumission immédiate : une seule écriture. Après rechargement ou nouvelle recherche, une entrée ayant même date, mode, lieux normalisés et distance signale un doublon possible. La personne peut modifier l’entrée existante ou confirmer explicitement « Il s’agit d’un autre déplacement ». Des voyages répétés le même jour restent donc possibles. Une différence de texte ou de distance n’est pas un détecteur certain d’identité physique : aucune surveillance GPS n’est introduite.

Les entrées peuvent être corrigées et supprimées. Une correction incrémente la révision, conserve la date de création et le calcul d’origine, et actualise la date de modification. La confirmation de correction est distincte de l’ouverture du formulaire. Fermer le journal, Échap ou Annuler n’enregistre pas le brouillon. Une suppression exige une confirmation et recalcule le bilan. Il n’existe pas encore d’historique complet de chaque ancienne valeur éditée : le calcul initial, les dates et le numéro de révision sont conservés.

## Bilan et empreinte

Le mois choisi présente le nombre de trajets confirmés, la somme des distances renseignées, le nombre de distances manquantes et la répartition par mode. Une somme partielle n’est pas présentée comme une distance totale connue. Les corrections de date déplacent l’entrée vers le mois correspondant ; les suppressions recalculent les totaux. Un mois vide est identifié comme tel.

Aucun facteur carbone n’est introduit dans ce lot. Chaque entrée conserve explicitement `emissions: {version: "unavailable-v1", status: "unavailable", valueKg: null, factor: null}`. Le bilan indique « CO₂e non estimé », y compris pour marche et vélo. Aucun trajet sans facteur ne devient un trajet à émission nulle. Une version future de calcul devra être reconnue avant lecture/écriture et ne pourra pas réécrire silencieusement cette absence historique. La qualification des facteurs et des périmètres par mode forme le lot suivant.

## Données et limites

Clé distincte `dragonroute.journal.v1.` suivie du même espace public/aperçu que le profil. Aucun profil existant ni autre aperçu n’est modifié. Le journal n’est pas inclus dans l’export/effacement du profil : les deux interfaces l’indiquent. Désactiver conserve les entrées consultables et exportables ; l’ajout et la correction deviennent indisponibles. L’effacement confirmé ne supprime que ce journal et le désactive.

Le schéma 1 conserve jusqu’à 1 000 entrées et 2 000 000 octets pour l’export JSON formaté ; lieux limités à 1 000 caractères et notes à 500. Aucun écrasement du plus ancien ni troncature automatique. Le validateur contrôle versions, identifiants, dates, métriques, modes, provenance et cohérence entre distance et calcul. Seuls les champs reconnus sont exportés ; les textes ne sont pas interprétés comme du HTML. Un format futur ou un journal invalide bloque les écritures et l’export d’un faux journal vide ; l’original reste en place.

Chaque écriture compare l’état chargé au stockage courant pour empêcher l’écrasement d’une modification depuis un autre onglet. Quota et refus de stockage préservent les données précédentes et le formulaire ; aucun faux message de réussite. L’écriture du document JSON entier est atomique pour cette clé. La suppression échouée ne produit pas une confirmation de suppression.

L’export JSON contient des lieux, dates et notes en clair, reste sur l’appareil jusqu’au partage et exclut les champs étrangers. Import/restauration du journal, synchronisation et comptes restent hors de ce lot. Ce fichier est une restitution structurée des données, pas encore un bouton de restauration. Aucune collecte automatique, trajectoire GPS continue, transmission du journal à un fournisseur, nouvelle API ou dépense.

## Vérification

Quatre contrôles du modèle : dates/versions/limites, bilan partiel, provenance historique et identité de doublon. Huit scénarios navigateur : consentement et double soumission/rechargement, correction et bilan, changement de mode, quota et concurrence, désactivation/annulation/effacement, format inconnu/date future, séparation aperçu/public et texte non interprété, instantané avec arrêt. Audits automatiques, clavier, débordement et captures accompagnent la suite. Le rapport de la PR consigne les résultats exécutés sur le commit livré.

La recette publiée utilise un navigateur neuf et des lieux publics. Les entrées créées dans ce navigateur sont des données de recette explicitement fictives, pas des déplacements physiquement effectués ni le journal personnel de la propriétaire. Tests simulés, services réels consultés et appareils physiques restent distingués.
