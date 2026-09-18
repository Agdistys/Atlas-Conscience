# DragonRoute : acces public et vehicules

Date : 18 septembre 2026. Succede a la fiche Options-Routage, dont la saisie de cle personnelle n'est plus le parcours cible.

## Decisions produit

Application publique, usage personnel et partage, sans cle technique visiteur. France comme territoire de depart ; couverture reelle a qualifier source par source, notamment outre-mer. Poids leger et poids lourd distincts. Un chemin non revetu est une propriete de route, pas un type de vehicule. Recharge electrique reportee. Aucun compte payant, abonnement, paiement ou hebergement cree.

## Modification realisee

- Suppression de la cle personnelle et du choix technique de fournisseur dans l'interface.
- Options visibles des l'ouverture. Absence de service public clairement signalee ; pas de repli ignorant une contrainte.
- Contrat serveur strict, cle uniquement cote serveur, cible ORS fixe, limitations de charge et erreurs non sensibles.
- Poids lourd avec cinq valeurs declarees ; transmission identique au trajet direct, aux alternatives et aux arrets. Pas de garantie de passage physique.
- Gabarit enregistrable dans le profil local, anciens profils sans gabarit toujours lisibles. Plages de consommation et d'achat adaptees jusqu'a 100 L/100 km et 2000 L (bornes techniques, pas prescriptions).
- Caravane/utilitaire : type conserve, calcul specifique bloque plutot que voiture substituee.
- Alternatives selectionnables avec distances/durees ; carte et corridor recalcules. Stations precedentes effacees apres confirmation ; refus preserve l'etat.
- Retrait de l'arret : restauration du trajet choisi sans nouvelle requete et suppression du statut selectionne.
- Detours negatifs OSRM egalement exclus du classement, au lieu d'etre presentes comme nuls. Un trajet plus court/rapide signale un changement de reference : comparaison complete a ameliorer dans un lot suivant.

## Recette et limites

96 scenarios navigateur prevus sur quatre tailles, dont camion valide/invalide, profil, arrets, quotas, absence de service public, alternatives et annulation. Onze tests du service couvrent secret, bornes, liste blanche, erreurs, quotas, timeout et concurrence. Aucune cle reelle utilisee.

Le service public n'est PAS active dans l'apercu : `routingApi` vide. Voir `server/README.md` pour les prealables d'ouverture, notamment quota durable et conditions des fournisseurs.

Alternatives : uniquement celles du fournisseur ; limite de requete alternative ORS a 100 km appliquee par le client. Une recherche peut ne fournir qu'une seule route.

Restent hors de cette livraison : activation/reception sur route reelle du service, couverture complete France/outre-mer, caravane, chemins, autonomie, geocodage ambigu, transport public, offres de covoiturage connectees, journal, CO2e, facturation et compte synchronise. Le cahier des charges global n'est pas declare termine.
