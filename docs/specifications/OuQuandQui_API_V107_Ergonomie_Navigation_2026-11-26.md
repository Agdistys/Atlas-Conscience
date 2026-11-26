# V107 — Navigation basse, comparaison et voix

NAV-UX-01 · 26 novembre 2026. Complète le [parcours prioritaire V106](OuQuandQui_API_V106_Recette_Android_2026-11-25.md). Les éditions antérieures sont conservées. Ces ajustements répondent aux observations d’usage ; la qualification physique du guidage reste ouverte.

## Demandes explicites

Placer les accès « 🛣️ Trajets », « 📓 Journal », « 👤 Profil » et « ⚙️ Réglages » en bas de l’écran. Renforcer le repérage des modes avec 🚘, 🚲, 🚶, 🚌 et 🚚, en conservant leurs intitulés. Faciliter la recherche d’un itinéraire alternatif et sa comparaison. Alléger la préparation du plein. Recalculer automatiquement après une sortie de route confirmée. Améliorer la lecture des annonces vocales.

## Navigation et lecture

La barre reste fixée en bas de la fenêtre, avec quatre boutons de 44 pixels au moins, un libellé visible et un indicateur de rubrique. La hauteur réservée suit la hauteur réelle de la barre et la zone système du téléphone. Le dernier contenu doit rester accessible à 360 pixels et avec le texte doublé. Après le défilement natif lié au focus, une vérification repositionne le contrôle au-dessus de la barre si nécessaire ; elle ne déplace pas le focus et ne modifie pas les panneaux modaux. Ce repositionnement attend la fin d’un appui au pointeur pour ne pas déplacer le bouton avant son activation.

Trajets rejoint la préparation ou le parcours à plusieurs arrêts déjà adopté. Les préparations enregistrées restent accessibles depuis l’en-tête commun, y compris pendant un parcours à plusieurs arrêts. Journal et Profil ouvrent leurs panneaux existants, sans modifier le trajet courant ; la fermeture rend le focus au bouton d’origine. Réglages rassemble l’accès aux options routières, à la voix et aux informations de sources et de stockage. L’ouverture d’un panneau ne déclenche ni GPS ni calcul d’itinéraire.

Les pictogrammes accompagnent les textes ; ils ne remplacent ni leurs noms accessibles ni l’information de disponibilité. Un poids lourd conserve ses contraintes propres. Les modes caravane et utilitaire non qualifiés ne deviennent pas disponibles par un changement d’icône.

## Alternatives vérifiables

Le trajet sélectionné reste bleu soutenu avec contour clair. Les variantes reçues du moteur restent bleu clair, sélectionnables sur la carte et dans la liste. Leur ouverture présente les écarts de distance et de durée avant confirmation du remplacement.

« Rechercher et comparer d’autres trajets » lance directement la comparaison des critères plus rapide et plus court pour les lieux et contraintes courants. Les moteurs déjà configurés sont utilisés selon leurs capacités ; aucun service Waze n’est ajouté. L’itinéraire courant reste en place jusqu’au choix explicite. Véhicule, exclusions et garde contre un contexte devenu périmé restent appliqués.

Deux critères ne garantissent pas deux tracés : les géométries identiques sont regroupées. Si aucun autre tracé n’est reçu, cette absence reste annoncée. Aucun détour arbitraire, double artificiel ou relâchement silencieux des contraintes ne sert à afficher une alternative. Les coûts de carburant ne deviennent un écart monétaire que si une hypothèse de prix est renseignée ; péages inconnus et budget incomplet restent distincts de zéro.

## Pause à la station

Le champ de durée est conservé dans « Pause à la station · facultatif », replié par défaut. La préparation ne demande plus cette donnée dans son parcours principal. La valeur éventuellement enregistrée reste conservée. Une durée vide reste inconnue ; zéro reste une durée explicitement nulle. Les calculs d’arrivée et les exports conservent cette distinction.

## Recalcul automatique

La case d’activation disparaît. Une sortie de route ou un retour en arrière confirmé déclenche le recalcul depuis la dernière position fiable, avec le même moteur, les exclusions et les étapes restantes. Le délai minimal entre recalculs et les contrôles de précision restent actifs. Une position isolée ou incertaine ne suffit pas.

Un échec rend une nouvelle tentative volontaire nécessaire, sans boucle de requêtes. Une réponse tardive après pause, fermeture ou arrivée ne peut réactiver le suivi. Le retour après verrouillage ou changement d’application demande toujours une reprise volontaire. L’automatisme porte sur la sortie de route confirmée pendant le guidage actif, pas sur la remise en marche du GPS après interruption.

## Voix et débit

Les réglages proposent uniquement les voix françaises déclarées locales par le navigateur et trois débits : posé (0,9), normal (1) et plus rapide (1,1). Le choix recommandé privilégie une voix locale par défaut puis une voix fr-FR. Les choix restent en mémoire de la page, sans nouvel enregistrement de profil ni synchronisation.

Les distances des annonces sont prononcées en mètres ou kilomètres, avec une phrase continue. Un essai vocal à l’arrêt permet de comparer les rendus sans position GPS. Modifier la voix ou le débit pendant le guidage le met en pause ; la reprise reste volontaire. La disparition d’une voix choisie ne déclenche aucun remplacement distant. Les erreurs audio et les événements tardifs restent traités comme en V106.

Une voix audible et compréhensible a été rapportée le 26 novembre, avec une fluidité à améliorer. Le modèle de téléphone et le navigateur ne sont pas précisés dans ce retour. La naturalité dépend des voix installées : les simulations vérifient le choix, les paramètres et les phrases, pas leur qualité à l’écoute.

## Référence ergonomique Waze

L’observation des écrans et interactions publics de Waze peut servir de référence pour la hiérarchie de l’information, les commandes proches du pouce, la mise en avant de la prochaine manœuvre et la comparaison des trajets. L’interface d’OùQuandQui reste une implémentation propre, avec ses données, ses limites et sa charte.

[WazeRouteCalculator](https://github.com/kovacsbalu/WazeRouteCalculator) est une bibliothèque Python de calcul de durées et distances, sous GPL-3.0. Elle ne fournit pas l’interface Waze ; son calcul de plusieurs routes peut en retourner moins que demandé. Elle n’est pas intégrée à l’application.

[WazeTripper](https://github.com/jnsdias/wazetripper) transmet les instructions d’une version modifiée de Waze au boîtier Tripper Pod de motos Royal Enfield. Ce n’est pas une base d’interface générale ; aucun APK modifié, code injecté ou outil de ce dépôt n’est installé ou intégré.

L’[aide officielle Waze](https://support.google.com/waze/answer/6273629?hl=fr) décrit les trajets alternatifs lorsqu’ils sont disponibles. Cette condition reste nécessaire dans OùQuandQui : une alternative distincte n’est pas garantie pour toute paire de lieux et toute combinaison de contraintes.

## Critères d’acceptation

1. Les quatre accès sont présents en bas, utilisables au clavier et au toucher, sans masquer le dernier lien avec un texte doublé.
2. Ouvrir puis fermer Journal, Profil ou Réglages conserve départ, arrivée et préparation, et restaure le focus.
3. Les modes gardent leur nom textuel et leurs capacités réelles ; les options non qualifiées restent indisponibles.
4. La pause facultative est repliée au chargement ; inconnue, zéro et durée renseignée conservent leurs effets distincts.
5. La comparaison directe conserve les exclusions, affiche les écarts et ne remplace pas le trajet avant sélection ; un même tracé est regroupé.
6. Un écart confirmé déclenche le recalcul sans case à cocher ; une panne n’entraîne aucune répétition automatique.
7. La voix et le débit choisis sont transmis au moteur local ; le test n’active pas le GPS et n’utilise aucune voix distante.
8. Le réglage vocal en cours de suivi impose une pause ; les réponses devenues périmées restent sans effet.
9. Les tests logiciels, la publication vérifiée et les observations physiques sont rapportés séparément.

## Sources techniques et prochain axe

Consultées le 26 novembre 2026 : [débit de synthèse vocale](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisUtterance/rate), [caractère local d’une voix](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisVoice/localService), dépôts et aide Waze cités ci-dessus.

Le prochain axe reste la qualification du parcours prioritaire sur Android : lecture et voix à l’arrêt, position, maintien de l’écran, interruptions, puis progression, station et arrivée lors d’un parcours observé comme passagère. Aucun nouveau fournisseur, compte, coût ou guidage en arrière-plan n’est introduit. L’automatisation planifiée reste en pause ; ce lot répond à une demande directe.
