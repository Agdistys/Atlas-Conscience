# V059 — Texte agrandi et écrans en paysage

QUA-LECTURE-01 · 20 novembre 2026. Complète QUA-02, QUA-04 et UX-01/02/05/06 du [cahier V5](OuQuandQui-Cahier-des-Charges-V5-2026-09-18.md), la [confirmation des stations V055](OuQuandQui_API_V055_Apercu_Station_2026-11-20.md), les [variantes V056](OuQuandQui_API_V056_Variantes_Carte_2026-11-20.md) et les [saisies V058](OuQuandQui_API_V058_Validation_Trajet_2026-11-20.md). Éditions antérieures conservées.

## Lecture et mise en page

Les tailles de texte de l’interface suivent maintenant la taille de police racine du navigateur, au lieu de rester en pixels fixes. Le contrôle local de référence faisait rester les champs à 14 pixels après doublement de cette préférence. Les champs passent désormais à 28 pixels dans le même essai ; labels, titres, messages et boutons sont également contrôlés.

Les champs ont une hauteur minimale tenant compte de leur texte et de leur espacement. L’en-tête prend la hauteur de ses commandes et peut occuper plusieurs lignes ; la zone carte/panneau utilise l’espace restant. À petite largeur, la carte et le formulaire conservent leur organisation dans le flux. Les groupes de champs passent à une colonne lorsque la largeur disponible devient insuffisante par rapport au texte. Les titres longs des fenêtres peuvent revenir à la ligne, sans repousser leur fermeture hors de la fenêtre.

Les boutons principaux et fermetures vérifiés conservent une cible d’au moins 44 × 44 pixels CSS. Cette vérification ne constitue pas encore un inventaire de toutes les cibles cartographiques.

## Fenêtres et confirmations

Les confirmations d’une variante et d’un arrêt disposent d’une fermeture dans l’en-tête, accessible pendant la lecture. Elle réutilise l’annulation existante : aucune adoption, écriture de profil ou requête supplémentaire. L’arrêt en cours de calcul conserve son mécanisme d’annulation et le retour au bouton déclencheur.

Les commandes de confirmation restent dans le flux défilant. Elles n’occupent plus une seconde bande fixe susceptible de recouvrir le contenu sur un écran peu haut. L’en-tête et sa fermeture restent visibles pendant le défilement.

La marge de défilement des fenêtres suit la hauteur réelle de leur titre. La navigation au clavier ramène un champ situé sous ce titre dans la partie visible. Tabulation et tabulation inverse restent dans la fenêtre modale ; Échap et les fermetures existantes gardent leurs effets et leur retour de focus. Les données saisies sont conservées pendant le redimensionnement ou la rotation.

## Recette

Huit scénarios couvrent le doublement effectif du texte, les dimensions des champs, les erreurs du trajet, les variantes, les fiches et favoris de stations, la confirmation d’un arrêt, la modification du profil, la conservation des saisies à la rotation et la navigation clavier sans défilement artificiel du test.

La matrice additionnelle comporte 1024 × 768, 768 × 1024, 844 × 390 et 360 × 800 avec police racine doublée. Le paysage 844 × 390 est aussi essayé sans agrandissement. Les formats habituels de la suite complète restent conservés. Les tests déterministes emploient des lieux et profils fictifs et ne consultent pas les services publics.

L’agrandissement est reproduit en doublant la police racine CSS, avec mesure des tailles calculées ; il ne s’agit pas d’un simple agrandissement de capture ou d’un changement de largeur présenté comme un zoom texte. Cela ne remplace pas les réglages natifs de tous les navigateurs, un lecteur d’écran ni un essai sur téléphone physique. Les captures locales et publiées sont relues séparément des tests automatiques.

Résultats, versions exactes, contrôles et recette publique figurent dans `quality/reading-layout` et l’état de développement. Aucune modification des calculs, fournisseurs, formats de stockage, profils enregistrés, tarifs ou conditions d’accès. Aucun nouvel abonnement, hébergement ou compte.
