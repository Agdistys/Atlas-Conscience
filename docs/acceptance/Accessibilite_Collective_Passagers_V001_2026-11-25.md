# Recette V001 — Demande fauteuil des passagers

25 novembre 2026 · COV-MODES-TC-04 · [Contrat V102](../specifications/OuQuandQui_API_V102_Accessibilite_Collective_Passagers_2026-11-25.md).

## Parcours à vérifier

Adopter un parcours du conducteur avec prise en charge et dépose, puis ouvrir la comparaison des passagers. Renseigner les lieux porte à porte, un départ futur et le groupe. La demande fauteuil renouvelle les confirmations ; elle ne déclenche aucun appel. Elle exige l’activation explicite du collectif du pilote Grenoble.

La recherche transmet la demande au service existant et exige sa confirmation. Les pistes reçues restent hors classement compatible. Les accès, arrêts, véhicules, correspondances, équipements et inconnus sont lisibles dans les résultats, le tableau commun et la carte. Aucun calcul ordinaire à pied ou à vélo n’est lancé ; le parcours du conducteur et ses données sont inchangés.

Vérifier l’absence de repli en cas de besoin sans collectif, hors secteur, réponse non confirmée, panne, quota ou délai. Modifier le besoin ou fermer pendant la requête, puis laisser parvenir la réponse : elle ne doit pas être adoptée. Après invalidation, une nouvelle recherche doit être possible. Une modification silencieuse interdit l’ouverture d’une ancienne carte ou d’un ancien brouillon.

Conserver volontairement une comparaison, puis la reprendre. Le souvenir doit garder la demande et ses limites ; le nouveau formulaire doit demander de redéclarer le besoin et les confirmations, sans appel implicite. Le journal individuel reste un brouillon volontaire, avec date à déclarer et sans déplacement enregistré à l’ouverture.

## Preuves et contrôle des régressions

Les tests construisent une confirmation fournisseur sur une fixture horaire existante ; cette simulation ne qualifie pas le terrain. Douze scénarios couvrent le parcours et ses échecs. Deux rejoignent les essentiels Firefox/WebKit. Le plafond de cette matrice passe de 18 à 22 minutes pour conserver une marge sous le job de 25 minutes après extension ; aucun cas ni contrôle n’est retiré.

Un contrôle du modèle ajoute une ancienne route ordinaire disponible : elle doit rester non qualifiée dès que la demande fauteuil est active, sans modifier l’objet source. Les contrôles antérieurs des préparations et des versions demeurent applicables.

Le premier passage local a exposé un bouton de calcul laissé désactivé après un changement de contexte pendant une requête. La fin de l’opération invalide rétablit désormais ce bouton lorsqu’aucune autre comparaison n’est active. Deux attentes du test ont également été corrigées : ressaisir la date après réactivation du porte à porte, et refermer le panneau avant de comparer les champs du conducteur dans leur emplacement initial. Les six échecs initiaux et les dix-huit cas réussis restent conservés ; ils ne sont pas présentés comme un passage intégral réussi.

Les preuves du lot se trouvent dans `quality/passenger-transit-accessibility` de l’atelier actif. Les rapports du modèle, des scénarios, de l’inspection GitHub et de la publication portent leurs propres résultats. L’aperçu ne doit être déclaré livré qu’après concordance du commit, des ressources servies et de la recette publiée.

## Recette du service et présentation

La recette réelle utilise des lieux publics : conducteur Hôtel de Ville de Grenoble → mairie d’Échirolles, passagers Gare de Grenoble → Patinoire Polesud. Les coordonnées des passagers et leur départ commun sont contrôlés ; la réponse doit confirmer la demande fauteuil. Les modes ordinaires restent sans nouvelle requête et aucune option n’est classée compatible.

La consultation des étapes, de la comparaison et de la carte, puis les trois accès au journal, s’effectue sur ordinateur, petit écran et texte agrandi. L’annulation laisse zéro déplacement enregistré. La recette locale et celle de l’aperçu sont distinctes ; chacune conserve réponses, captures, erreurs et état du conducteur.

La présentation V039 ajoute le chapitre 66. V038, styles, contrôleur de navigation et anciens chapitres sont conservés. Vérifier sommaire, clavier, export Markdown cumulatif, liens internes et formats ordinateur/mobile.

## Portée

Pilote Grenoble, horaires théoriques, recherche exploratoire. TC-06 reste partiel : aucune attestation d’accessibilité intégrale, d’usage en fauteuil, d’équipement disponible ou de trajet effectué. Aucun téléphone physique testé. Les prix, bagages, vélo embarqué et couverture nationale restent indépendants. Aucun nouveau fournisseur, compte, paiement, hébergement ni fusion.

