# OùQuandQui · V115 · Estimer le péage de la portion choisie

Date : 28 novembre 2026. Complément de V114. Le pilote ajoute un tarif de référence pour des gares d’entrée et de sortie explicitement déclarées. Il conserve la distinction entre un prix sourcé et la vérification automatique de son application au tracé. Les éditions antérieures restent conservées.

## 💰 Estimation avant le choix

Après la sélection d’une portion, « Estimer le péage » propose un réseau, une gare d’entrée et une gare de sortie. Le montant apparaît avec la classe déclarée, la date du trajet, la date d’effet du tarif et son lien de source. La confirmation « Ces gares correspondent à toute la portion choisie » est nécessaire pour joindre ce montant à la proposition.

La comparaison affiche distance, durée et « Péage estimé · gares déclarées ». L’adoption du trajet reste une action séparée. La consultation du tarif n’envoie aucune nouvelle requête de routage et ne modifie ni la préparation ni les enregistrements. Il est possible de poursuivre sans estimation ; le prix reste alors inconnu.

## 📚 Sources et couverture

Les réseaux APRR et AREA réutilisent leurs tables officielles déjà présentes. Le catalogue ASF ajoute 2 055 lignes directionnelles publiées dans le fichier officiel, avec les tarifs au 1er juin 2026. La copie source, son empreinte et sa provenance restent conservées. Les directions absentes ne sont pas extrapolées. Les cinq cellules manquantes du passage Puymorens ne deviennent pas zéro ; un zéro explicitement publié reste distinct d’un prix absent.

Source ASF : [fichier officiel VINCI Autoroutes](https://public-content.vinci-autoroutes.com/PDF/Tarifs-peage-asf/Tarifs_ASF.txt), accessible depuis la [page des tarifs](https://www.vinci-autoroutes.com/fr/conseils/autoroute-mode-demploi/tarifs-peage-vinci-autoroutes/). Le montant Vienne → Valence nord a été recoupé dans les grilles PDF des classes 1 et 2 : respectivement 9,00 € et 14,40 €. Ce recoupement de deux cellules ne qualifie pas visuellement l’intégralité du catalogue.

Le pilote reste limité aux classes déclarées 1 et 2, sans réduction. La consultation ASF a été vérifiée le 28 novembre 2026 ; la borne interne de consultation est fixée au 31 décembre 2026. Cette borne ne constitue pas une promesse d’absence de modification tarifaire. Les tables devront être revues avant de prolonger leur usage. Les tarifs des ponts et autres passages isolés restent dans leur parcours existant, sans ajout automatique à la portion choisie.

## 📍 Gares déclarées et correspondance routière

La déclaration porte sur toute la portion sélectionnée. Les repères d’entrée et de sortie sur la carte restent des limites du réseau routier ; leurs noms de gare ne sont pas identifiés automatiquement. Un point proche d’une gare ne prouve ni son franchissement ni la paire tarifaire effectivement utilisée.

Le montant est donc enregistré dans la sélection comme estimation fondée sur des gares déclarées, distincte d’un prix automatiquement vérifié pour la géométrie. La classe de péage ne certifie pas le gabarit, la caravane, les restrictions de circulation ou l’accès physique. Les trajets voiture conservent leur périmètre V114.

## 🧾 Budget, station et unicité

Après adoption, le résumé de la portion et le budget affichent le montant avec la mention « gares déclarées ». Le total carburant et péage n’est présenté comme estimation déclarée que si le poste carburant est lui aussi disponible. Une source absente, une date incompatible ou une classe différente maintient un budget incomplet.

L’ajout d’une station avant ou après la portion, puis son retrait, conserve la référence tarifaire lorsque la même portion payante est conservée. Le calcul de carburant suit le parcours retenu. Les autres tables manuelles et le fournisseur tarifaire ordinaire ne s’ajoutent pas à cette estimation : un même péage n’est pas compté deux fois.

La préparation affiche le prix de la portion complète, pas un montant restant à payer déduit de la progression GPS. Les remboursements, réductions, autres frais et tarifs de carburant futurs ne sont pas présumés. La sauvegarde de cette exception reste à développer avec son format explicite.

## 🔒 Validité et plafond

Modifier les gares ou retirer leur confirmation invalide la proposition. La classe, la date, la source et l’identité de la portion sont liées à l’estimation. Elles sont contrôlées à la confirmation puis lors de l’affichage du budget ; une référence devenue incompatible ne doit plus être ajoutée au total. L’expiration d’une proposition routière reste fixée à cinq minutes.

Un plafond strict requiert une correspondance vérifiée entre le prix et le trajet. Une déclaration de gares, même accompagnée d’un tarif officiel inférieur au plafond, ne satisfait pas cette condition. Le calcul refuse cette combinaison avant toute nouvelle requête routière et conserve le trajet précédent. Le champ peut rester vide pour comparer une estimation déclarée.

## 🧪 Vérifications et limites

Les contrôles couvrent la reconstruction de la source, les directions explicites, les valeurs manquantes et les zéros, les dates et classes, la confirmation des gares, l’annulation, les mutations de contexte, la conservation de la référence lors d’un arrêt et l’absence de double comptage. Les scénarios navigateur vérifient également clavier, lisibilité et formats ordinateur/téléphone.

Les résultats de l’inspection, de la compatibilité et de l’aperçu publié sont rattachés au commit de livraison. Une simulation de routage ou de GPS n’est pas une recette physique Android. La qualification automatique des gares, les trajets caravane/poids lourd et les tarifs hors catalogue restent ouverts.

## ➡️ Suite du développement

Qualifier la correspondance entre les gares tarifaires et la portion routière, puis les entrées et sorties intermédiaires. Définir la sauvegarde et la reprise de l’exception avec ses hypothèses, ses dates et sa source. NAV-TOLLS-01 reste ouvert ; les offres gratuites, les plafonds du relais et l’hébergement GitHub restent inchangés.
