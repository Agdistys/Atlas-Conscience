# OùQuandQui — V108 · Guidage épuré et informations à la demande

26 novembre 2026. Lot NAV-UX-02. Complément de la [V107](OuQuandQui_API_V107_Ergonomie_Navigation_2026-11-26.md), conservée. Périmètre : guidage au premier plan, en priorité sur téléphone Android. Le parcours reste préparer le trajet → guider → choisir une station → poursuivre. La qualification sur appareil physique reste ouverte.

## Besoin explicite

Simplifier l’ergonomie en s’inspirant des parcours visibles de Waze. Réduire le texte affiché pendant le guidage, privilégier les repères intuitifs et rendre les explications secondaires accessibles par une aide ⓘ. Conserver les alertes nécessaires à une décision immédiate.

## Observation de référence et indépendance

Les captures officielles de [Waze sur Google Play](https://play.google.com/store/apps/details?id=com.waze&hl=fr), observées le 26 novembre 2026, présentent une prochaine manœuvre au-dessus de la carte, une synthèse de temps et distance en bas et des commandes contextuelles compactes. Il s’agit de captures de présentation, pas d’un essai de l’application Android. [L’aide officielle Waze](https://support.google.com/waze/answer/6286774?hl=fr) documente également un accès à l’arrêt depuis la barre du trajet.

La transposition conserve la charte, les sources et le fonctionnement propres à OùQuandQui : aucune reprise de code, de pictogrammes propriétaires, de données de trafic ou de voix Waze. Aucun paquet Waze n’a été téléchargé ou exécuté. La carte reste orientée au nord ; perspective 3D, rotation selon le cap, trafic en direct et limitation de vitesse ne sont pas ajoutés par ce lot.

[Reverse Engineer Anything](https://github.com/morluto/rea) est un outil d’analyse du fonctionnement de logiciels. Son analyse Android demande notamment un environnement Java/JADX ; l’installation de l’outil ne fournit pas un téléphone ni le service routier distant. Il n’est pas nécessaire pour cette étude d’interface. Aucun agent REA, APK, émulateur ou accès distant supplémentaire n’est installé.

## Composition de l’écran

La prochaine manœuvre et sa distance précèdent la carte. Un pictogramme accompagne la consigne textuelle sans la remplacer. Il dépend exclusivement du type et du modificateur de la manœuvre fournis par le moteur routier validé. Le texte d’une rue ne détermine jamais une direction. Un rond-point conserve dans la consigne son numéro de sortie.

La durée et la distance restantes forment une synthèse courte sous la carte, explicitement estimée et hors trafic. Aucune heure d’arrivée garantie ni valeur issue du trafic ne sont ajoutées. La carte affiche le trajet suivi et la position qualifiée ; sans fond disponible, le schéma reste explicitement identifié.

Les actions sont courtes : Démarrer ou Reprendre, Pause, Recalculer seulement lorsque nécessaire, Repartir à l’étape, Terminer ; Station, Recentrer et Autonomie. Le recalcul automatique existant conserve ses conditions de confirmation. La voix reste un choix volontaire directement accessible ; les réglages de voix, débit et écran sont repliés par défaut et accessibles à l’arrêt.

## Informations à la demande

Le panneau ⓘ Informations rassemble le résumé du trajet et du moteur, les explications sur le GPS et le recalcul, la précision et l’heure de la dernière position, le calcul détaillé de durée et distance, l’estimation d’autonomie avec sa provenance, les étapes et les limites du guidage. L’ouverture de ce panneau ne demande ni position, ni recalcul, ni écriture des données personnelles.

Les aides s’ouvrent au toucher ou au clavier. Le contenu reste dans le flux de lecture et peut défiler sur petit écran ou en texte agrandi ; aucune information ne dépend du survol. Les réglages avancés peuvent toujours être ouverts directement depuis Réglages → Voix.

## Alertes et incertitudes

La confirmation normale de suivi est annoncée aux technologies d’assistance sans occuper une ligne de texte permanente. Les états de recherche GPS, position imprécise, ancienne ou ambiguë, refus d’accès, sortie de route, recalcul impossible, pause, étape et arrivée restent visibles.

Lorsqu’une position n’est plus qualifiée, la flèche directionnelle, la distance à la manœuvre et les estimations restantes sont retirées. L’écran ne conserve pas une ancienne instruction comme si elle était actuelle. La dernière précision horodatée demeure consultable dans les informations.

Une panne vocale affiche une alerte courte hors des aides et désactive les annonces, tout en conservant le guidage visuel. Une autonomie à réactualiser ou une réserve atteinte est également signalée hors des aides. La portée affichée sur la commande Autonomie reste une estimation déclarée, sans lecture de jauge. Le rappel « Garder l’application ouverte » reste visible : l’arrière-plan met le guidage en pause.

## Critères d’acceptation

1. À l’ouverture, le GPS est arrêté et les explications longues ainsi que les réglages avancés sont repliés ; aucune action technique n’est déclenchée par une consultation d’aide.
2. À 390 × 844 pixels et taille de texte normale, la manœuvre, une carte d’au moins 250 pixels de hauteur et les commandes principales restent accessibles dans la première vue de guidage actif.
3. La synthèse courante reste inférieure à 80 mots dans le scénario de contrôle ; les erreurs prioritaires peuvent augmenter ce volume.
4. La flèche gauche est conservée lorsque le moteur indique gauche, même si le nom de rue contient « droite » ; les consignes textuelles restent présentes.
5. Après perte de précision ou refus GPS, aucune ancienne flèche, distance ou durée courante ne reste présentée ; l’explication et la reprise appropriée demeurent accessibles.
6. Une panne audio ou une estimation d’autonomie devenue incertaine est perceptible sans ouvrir les informations.
7. Sur écran de 360 pixels, en paysage et avec texte doublé, les aides, réglages et commande Terminer restent accessibles sans débordement horizontal.
8. Les contrôles importants ont une cible d’au moins 44 pixels, un nom accessible et une commande clavier. Fermer le guidage interrompt la surveillance GPS et rend le focus à son déclencheur.
9. Les parcours IGN/OSRM, exclusions, étapes, stations, autonomie, voix locale, retour de focus et données de préparation conservent leurs contrôles de non-régression.

## Portée des vérifications

Les essais de navigateur reproduisent des positions et événements vocaux. Ils ne qualifient ni la fluidité réelle sur Android, ni la conduite sur route, ni le maintien d’écran sur un téléphone donné. Le guidage au premier plan reste la capacité visée ; l’écran verrouillé et le fonctionnement natif en arrière-plan restent hors de cette livraison. Aucun nouveau fournisseur, compte, coût, fusion ou changement d’hébergement n’est nécessaire.
