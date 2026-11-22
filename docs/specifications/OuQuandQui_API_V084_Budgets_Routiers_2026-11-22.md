# OùQuandQui — V084 · Budgets depuis les parcours routiers

## Besoin et portée

Exigences concernées : BOU-02, BOU-07, CAL-06, CAL-07 et DAT-01. Comparer les frais directs des mêmes voyageurs depuis un trajet routier, sans devoir lancer une recherche de transports collectifs dans le pilote grenoblois. Le panneau commun de [V083](OuQuandQui_API_V083_Budgets_Modes_2026-11-22.md) est réutilisé. Les deux variantes routières rapide/courte conservent leur comparateur propre.

## Parcours utilisable

Calculer un trajet, ouvrir la comparaison voiture/marche/vélo, renseigner les voyageurs et un départ daté puis calculer les modes souhaités. Le bouton « Comparer les budgets et les empreintes » ouvre les mêmes règles de budget, de modèles et de priorités. Une date absente renvoie au champ avec une explication ; aucune heure courante n’est ajoutée implicitement. Le groupe reprend le nombre de voyageurs de la comparaison routière. Les occupants, modèles, prix et composantes restent à renseigner dans ce panneau.

Le panneau réutilise exclusivement les résultats reçus. Son ouverture, les saisies et les tris ne déclenchent aucun géocodage ni routage, ne remplacent pas le trajet sur la carte et ne déclarent aucun déplacement effectué. Le vélo non demandé est explicitement indisponible. Un calcul demandé en échec conserve sa cause et ne devient pas un parcours automobile. Aucun itinéraire collectif n’est inventé hors du pilote.

## Données et contraintes

Chaque ligne conserve le mode, la distance non arrondie, la durée, les lieux, l’heure de départ, la date de consultation et le moteur déclaré. Le temps comparé est la durée du parcours direct, sans multiplication par les voyageurs et sans pauses. Les horaires routiers sont des estimations déduites du départ choisi ; ni trafic ni ponctualité ne sont garantis.

Les limites impératives de marche, de vélo et d’arrivée précèdent les budgets et les scores. Un parcours hors limite reste une référence consultable, hors classement. Une préférence souple dépassée reste signalée et admissible. Les critères invalides ne rendent pas un parcours admissible. Changer les contraintes retire les budgets ou indices liés à l’ancien contexte ; aucun montant ne retrouve implicitement sa validité en revenant à la valeur initiale.

Un départ passé de plus d’une minute selon l’horloge de l’appareil est historique et exclu. Un recul de l’horloge de plus d’une minute avant la consultation invalide le contexte. Le constat de départ passé ou d’horloge invalide reste acquis pour cette consultation. Contrôle périodique, au retour dans la page et avant les actions du panneau. L’horloge locale n’est pas synchronisée par un service ; aucun départ réel n’en est déduit.

## Distances et budgets

Les limites locales du calcul collectif — 150 km et six heures — ne sont pas appliquées aux parcours routiers déjà obtenus. Le modèle routier accepte les métriques finies du contrat existant, jusqu’à 20 000 km et un an de durée. Ces bornes de validation ne promettent aucune couverture fournisseur. Le service vélo conserve ses propres limites.

Le budget conserve les cinq postes de V083 : billets ou location, carburant consommé, péages, stationnement et autres frais directs. Vide reste inconnu ; zéro exige une déclaration. Les montants portent sur le groupe entier. La part de carburant estimée utilise la distance reçue, une consommation et un prix déclarés, ainsi que le nombre d’occupants choisi. Aucun plein acheté, ancien péage ou montant enregistré ailleurs n’est adopté automatiquement.

Un budget complet signifie que tous les postes de ce périmètre sont renseignés, sans attester un devis ou un coût exhaustif. Entretien, assurance, achat et amortissement restent exclus. Les règles d’empreinte demeurent celles des modèles qualifiés : marche inconnue, vélo mécanique en construction seule, périmètres différents non mélangés.

## Conservation et compatibilité

La conservation reste volontaire, avec aperçu et confirmation. Les nouveaux budgets routiers ont le format interne 2 et l’origine explicite `road`, en départ daté. Les budgets issus des transports conservent leur format interne 1. Une collection contenant un budget routier utilise le format 3 ; ses anciennes entrées format 1 ou 2 gardent leurs valeurs, dates et pièces déclaratives. Aucun stockage ni migration automatique à la simple consultation. Une collection format 3 n’est pas rétrogradée lors d’une suppression.

Les imports refusent les versions futures, les origines ou composantes incohérentes, les métriques hors bornes et les totaux incompatibles. Les exports JSON/TXT conservent composantes, dates, hypothèses et preuves de consultation. Ce contrôle arithmétique n’authentifie ni une déclaration importée ni sa source.

## Qualification et limites

La recette couvre l’accès routier hors du pilote collectif, les trajets longs simulés, les dates absentes/passées, les limites impératives ou souples, les modes non demandés/en échec, la conservation volontaire, les anciens formats, le clavier et le texte agrandi. L’inspection complète et la vérification de l’aperçu exact sont nécessaires avant livraison. Les montants de démonstration restent séparés des parcours reçus sur les services publics.

Ce lot étend l’accès au budget commun ; il n’active aucun fournisseur, tarif automatique, abonnement, compte ou fusion vers le site principal. Il ne qualifie ni caravane/poids lourd, ni revêtement ou largeur réelle des routes, ni appareil physique. Les autres limites de couverture du cahier restent applicables.
