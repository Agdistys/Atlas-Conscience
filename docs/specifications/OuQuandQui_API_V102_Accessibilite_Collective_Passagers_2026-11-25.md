# V102 — Demande fauteuil dans les alternatives collectives des passagers

COV-MODES-TC-04 · 25 novembre 2026. Complète TC-06, BOU-01/06 et DAT-01 du [cahier V5](OuQuandQui-Cahier-des-Charges-V5-2026-09-18.md), la [qualification exploratoire V086](OuQuandQui_API_V086_Accessibilite_Collective_2026-11-22.md), les [alternatives des passagers V099](OuQuandQui_API_V099_Collectif_Passagers_2026-11-23.md), leur [carte V100](OuQuandQui_API_V100_Carte_Collective_Passagers_2026-11-24.md) et leur [journal V101](OuQuandQui_API_V101_Journal_Collectif_Passagers_2026-11-25.md). Les versions antérieures sont conservées.

## Choix et périmètre

Le formulaire des passagers propose **Demande fauteuil : rechercher des pistes collectives à vérifier**. Ce choix est facultatif et désactivé à l’ouverture d’une nouvelle comparaison. Il nécessite les lieux porte à porte et l’activation des transports du pilote Grenoble. Retirer ces deux options tout en gardant la demande fauteuil empêche le calcul ; aucune recherche ordinaire n’est substituée.

La sélection du besoin ne lance aucun appel. Elle retire les résultats précédents et renouvelle les confirmations des lieux et du groupe. Les lieux, l’heure de départ, la limite de déplacement et les éventuelles correspondances restent à renseigner. L’information préalable indique le destinataire de la demande et l’absence de qualification intégrale.

Au calcul volontaire, l’IGN résout les adresses si nécessaire. Mobilités M reçoit les deux coordonnées, la date, l’heure, les paramètres habituels et la demande fauteuil. L’effectif, le nom, le profil et le texte des adresses ne lui sont pas transmis. Aucun compte, nouvelle source ou conservation automatique du besoin.

## Recherche et classement

La demande utilise le contrat déjà qualifié de V086. Seul le booléen vrai ajoute le paramètre de demande fauteuil ; sa réception doit être confirmée exactement par le service. Cette confirmation ne constitue pas une preuve d’accessibilité des cheminements, arrêts, véhicules et correspondances.

Les pistes conservent leurs horaires théoriques et leurs étapes. Chaque fiche décrit séparément les accès et sorties, les montées et descentes, les véhicules et les correspondances. Pentes, largeurs, revêtements, marches, équipements, assistance et place disponible restent non renseignés ou non vérifiés. La fiche est consultable dans les résultats, la comparaison commune et la carte, sans nouvelle requête. Le lien vers le réseau reste volontaire.

Les pistes demeurent hors classement compatible. Une durée connue, un prix déclaré, un modèle carbone choisi, une distance courte ou un attribut fournisseur non qualifié ne lève pas cette exclusion. Les contrôles de chronologie, fraîcheur, marche cumulée, correspondances et heure limite s’appliquent également. Les numéros des options restent stables après tri.

Pour cette recherche, aucun accès à pied standard ni alternative routière ordinaire à pied ou à vélo n’est demandé. La portion automobile du conducteur n’est pas qualifiée pour le besoin fauteuil des passagers. Les anciennes routes et les éventuels résultats en cache ne deviennent pas admissibles. Le parcours adopté du conducteur, ses rencontres, arrêts, horaires et frais sont conservés.

Pour revenir à une comparaison ordinaire, retirer explicitement la demande fauteuil, vérifier à nouveau les lieux, la date et les confirmations, puis lancer le calcul. Aucune réponse collective antérieure n’est réutilisée comme résultat de cette nouvelle demande.

## Carte, journal et souvenirs

La carte reprend la même piste et ses limites d’accessibilité. Le choix d’une autre option conserve son identité. Le fond cartographique et les informations réseau restent facultatifs. Une annonce, un tracé ou un état de service ne transforme pas la piste en parcours intégralement accessible.

Le journal personnel de V101 peut préparer un brouillon de la piste. Les étapes sont modifiables et la date du déplacement reste à déclarer ; un départ futur n’est pas prérempli comme un déplacement effectué. Aucun voyage n’est enregistré sans confirmation. Ce journal ne constitue pas une attestation d’accessibilité et n’importe ni le groupe comparé ni un modèle carbone implicite.

Le souvenir de comparaison conserve volontairement la demande exploratoire et les limites dans son contexte et ses références. Les formats de comparaison restent inchangés. Les anciennes données ne sont pas réécrites. Les lieux et hypothèses réutilisables suivent V098 ; la nouvelle date, la recherche collective et la demande fauteuil sont à redéclarer. Le formulaire de reprise le précise et ne lance aucune requête.

## Échecs et invalidation

Une confirmation de demande absente ou incorrecte refuse les résultats. Une panne, un quota, un dépassement du délai, des coordonnées hors pilote ou une réponse non vérifiable ne déclenchent aucun repli standard. Le délai du service reste borné et partagé avec ses autres consultations. Une relance est volontaire.

Modifier le besoin, les lieux ou le contexte, annuler ou fermer invalide l’opération. Une réponse tardive est ignorée, y compris lorsqu’un transport réseau ne respecte pas l’annulation. Les lectures silencieusement modifiées sont contrôlées avant consultation de la carte, du journal, du comparateur ou d’une sauvegarde. Le conducteur et les données déjà conservées demeurent intacts.

## Vérification et limites restantes

Le modèle vérifie notamment qu’une ancienne route ordinaire marquée disponible ne peut satisfaire le besoin. Les scénarios navigateur couvrent confirmation, destination des requêtes, absence de calcul routier ordinaire, exclusion des classements, informations par étape, carte, retrait explicite, échecs, délai, annulation, réponse tardive, souvenir, reprise, journal, clavier et texte agrandi. Les cas essentiels rejoignent Firefox et WebKit ; la matrice Chromium conserve ses quatre formats.

Les simulations utilisent une confirmation de demande construite sur une fixture horaire et ne constituent pas des preuves de terrain. La recette du service existant, l’inspection du commit et la vérification de son aperçu sont consignées séparément. Les essais sur lieux publics n’enregistrent aucun déplacement effectué et n’attestent ni usage en fauteuil ni appareil physique.

La [documentation OTP 2.7](https://docs.opentripplanner.org/en/v2.7.0/Accessibility/), relue le 25 novembre 2026, décrit des réglages pour les informations inconnues et des pénalités pour certains accès. Elle ne documente pas la configuration effective du pilote. La réponse du service et la qualification datée de V086 restent les limites du contrat appliqué.

**TC-06 reste partiel.** Un filtre impératif pleinement qualifié exige encore des données vérifiables sur les accès, arrêts, véhicules et équipements ainsi que le traitement effectif des inconnus. Bagages, vélo embarqué, capacité et couverture nationale ne sont pas ajoutés. Aucun fournisseur, abonnement, paiement, nouveau déploiement ou fusion sur le site principal.

