# V100 — Carte et informations réseau des passagers

COV-MODES-TC-02 · 24 novembre 2026. Complément des exigences TC-02/04, UX-03 et BOU-03 du [cahier V5](OuQuandQui-Cahier-des-Charges-V5-2026-09-18.md), de la [comparaison collective V099](OuQuandQui_API_V099_Collectif_Passagers_2026-11-23.md) et des [informations réseau V028](OuQuandQui_API_V028_Infos_Reseau_2026-11-18.md). Les éditions antérieures restent conservées.

## Examiner une option sans changer de trajet

Chaque alternative collective des passagers propose **Carte et infos réseau**. L’accès est disponible depuis les résultats et depuis les étapes de la comparaison commune des modes. Le numéro d’option correspond toujours à la réponse qualifiée, même après un tri par durée ou un changement de classement. Un sélecteur permet de consulter une autre option sans relancer le calcul.

La fenêtre présente la référence actuelle, la carte ou son schéma, les étapes, lignes, directions et horaires théoriques. Les options devenues non admissibles restent consultables comme références hors critères. Le passage du temps ne renouvelle aucune requête. La fermeture rend le focus au bouton d’origine ; le trajet du conducteur, sa préparation, ses frais et les hypothèses de comparaison restent conservés.

## Tracé reçu et fond cartographique volontaire

Le tracé utilise uniquement les géométries qualifiées des étapes reçues, limitées à 16 000 points. Les transports apparaissent en bleu bordé de blanc ; la marche en violet discontinu. Les repères signalent les extrémités des passagers. Les boutons d’étapes affichent aussi un état textuel et permettent d’examiner une portion ; la couleur ne constitue pas la seule indication.

L’ouverture de la carte n’effectue aucune nouvelle recherche et ne charge pas de fond supplémentaire. **Afficher le fond OpenStreetMap** est une action volontaire, précédée de l’indication du destinataire et de la zone transmise. Le fond peut être retiré. Une panne de tuiles ne supprime pas les tracés reçus.

En l’absence du moteur cartographique, un schéma SVG reproduit les points reçus, explicitement sans échelle. Si une géométrie d’étape manque ou si le nombre de points dépasse la limite, le tracé complet est déclaré indisponible. Aucun segment droit ni chemin de remplacement n’est inventé. La liste des étapes et horaires reste utilisable. Les tracés ne certifient ni l’état réel du terrain ni l’accessibilité.

## Informations réseau à la demande

**Consulter les infos réseau** interroge le même fournisseur Mobilités M / SMMAG que le pilote Grenoble. Avant l’action, l’interface annonce la transmission des identifiants des lignes et arrêts. Aucun nom de passager, adresse textuelle, profil ou effectif n’est envoyé. Aucun nouveau fournisseur, compte, clé visiteur ou paiement n’est introduit.

Les règles de V028 sont réutilisées : catalogue commercial rapproché par identifiant GTFS exact et unique, prochains passages aux trois premiers arrêts de montée au maximum, puis annonces GTFS-RT de la période. La consultation comporte au plus cinq appels. Un identifiant manquant ou ambigu n’est pas remplacé par un rapprochement de noms.

La date de consultation reste distincte de la date d’actualisation des données. Les passages reçus demeurent sous **Actualisation non datée** lorsque la source ne fournit pas de date exploitable. Les prochains passages sont séparés du trajet prévu : un service de ce jour ne devient pas celui d’un voyage futur. Une concordance exige le même service, arrêt, jour et horaire théorique. Son absence ne prouve ni annulation ni circulation.

Les alertes ne sont attribuées au trajet que par les sélecteurs exacts déjà qualifiés. Les autres restent des annonces du réseau non attribuées au trajet. Une liste vide ne devient pas une absence de perturbation. Les horaires, correspondances, coûts, empreintes et classements restent théoriques et ne sont pas recalculés à partir de ces annonces. La consultation ne réserve aucun billet ni place.

## Durée, annulation et séparation des contextes

Les consultations partagent avec le panneau collectif indépendant un délai minimal de dix secondes et les attentes imposées par les quotas du service. Le délai d’une consultation est borné à trente secondes ; une réponse est limitée à deux millions de caractères. Une panne partielle laisse les autres informations lisibles. Un quota empêche les appels suivants, sans nouvel essai automatique.

Annuler, fermer, changer d’option ou modifier la comparaison invalide la consultation et retire ses anciennes informations. Une réponse tardive ne les restaure pas et ne déclenche pas d’appel supplémentaire. La carte des passagers et celle du panneau collectif indépendant possèdent des contextes séparés ; aucune option n’est réaffectée silencieusement à l’autre.

Après cinq minutes, les passages de la consultation sont retirés. Les annonces sont retirées lorsque la génération du flux dépasse dix minutes ou lorsque l’horloge devient incohérente. Cette vérification est locale, au retour à la fenêtre ou périodiquement ; aucun renouvellement réseau automatique. Les règles sont des limites de consultation, pas une garantie de fraîcheur à la source.

Les informations réseau ne sont pas enregistrées automatiquement dans le profil, les souvenirs de comparaison ni le journal. La conservation des étapes théoriques continue de suivre V099. Reprendre un souvenir exige toujours une nouvelle recherche et des confirmations renouvelées.

## Vérification et limites

Les scénarios couvrent l’identité des options après tri, le tracé complet ou manquant, le schéma sans moteur, le fond volontaire, le clavier, le texte agrandi et le retour du focus. Ils vérifient également demande explicite, séparation des horaires et annonces, panne partielle, quota, délai, annulation, fermeture, changement d’option, modification silencieuse du contexte, expiration et préservation du conducteur. Les scénarios essentiels sont intégrés à Firefox et WebKit ; les règles réseau antérieures sont contrôlées après leur mise en commun.

La recette publiée utilise des lieux publics de Grenoble et conserve les réponses datées des services réels. Le rapport du commit distingue ces observations des simulations, ainsi que les contrôles locaux de l’inspection complète sur GitHub. Le compte rendu final porte les nombres effectivement exécutés.

Le pilote reste Grenoble. La couverture nationale, la disponibilité réelle des places, les tarifs complets, l’accessibilité garantie et le recalcul des correspondances en temps réel restent ouverts. Aucun déplacement physique, appareil mobile réel, réservation, nouveau fournisseur, hébergement ou fusion sur le site principal n’est attesté par ce lot.
