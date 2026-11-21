// A bounded contract, shared by collection and publication: removing a case is not a pass.
export const compatibilityRoadCases = [
  'saisies trajet : deux lieux vides, résumé clavier, correction locale et descriptions conservées',
  'saisies trajet : panne ou réponse illisible ne désigne pas l’adresse comme erronée',
  'trajet disponible avant toute recherche de station',
  'panne carburants ne supprime pas le trajet et peut etre relancee',
  'fiche station et favoris actualises apres rechargement',
  'vehicule et adresses persistes modifiables et reutilisables',
  'variantes : schéma et liste cohérents, clavier et refus sans effet',
  'variantes : adoption depuis le schéma synchronise budget, repères et GPX sans requête',
  'variantes : Leaflet au clavier, au toucher et tracé cliquable',
  'points schéma : superposition, choix explicite et favori stable',
  'points Leaflet : superposition, choix explicite et favori stable',
  'points : aperçu refusé et changement de critères effacent les anciens points',
  'points : choix utilisable en paysage à texte doublé et tabulation bornée',
  'préparations : trajet avec arrêt, préférences, reprise après rechargement et confirmation renouvelée',
  'préparations : import vérifiable, export préalable, annulation et restauration complète',
  'préparations : stockage plein et conflit d’onglet préservent formulaire et données',
  'lecture : texte réellement doublé, champs non coupés et en-tête adapté',
  'lecture : erreurs et variante au clavier, fermeture permanente et adoption',
  'lecture : profil modifiable, clavier visible et rotation conserve les saisies',
  'lecture : tabulation réelle du profil sans masquer le champ actif'
];
// Additional autonomous-mode flows use the same assertions as Chromium.
export const compatibilityModeCases = [
  "accès modes : cinq entrées avant le véhicule, limites visibles et aucun effet externe",
  "accès modes : commandes accessibles en paysage, texte agrandi et petit écran",
  "accès modes : cycleBtn au clavier, lieux communs et retour du focus",
  "accès modes : transitBtn au clavier, lieux communs et retour du focus",
  "accès modes : bikesBtn au clavier, lieux communs et retour du focus",
  "marche : vrai profil, préférences séparées, distance et cache distincts de la voiture",
  "marche : sauvegarde, export et reprise gardent le mode et les préférences automobiles",
  "vélo : calcul volontaire, vrai profil, schéma, limite locale et stockage conservé",
  "vélo : annulation et réponse tardive ignorées, reprise indépendante possible",
  "vélo sauvegardé : reprise explicite sans géocodage, nouveau calcul même avec cache",
  "collectif direct : accessible sans voiture, aucun routage caché et lieux résolus explicites",
  "collectif direct : géocodage tardif annulé sans mémorisation ni appel supplémentaire",
  "collectif direct : saisies incomplètes et périmètre extérieur ne déclenchent pas de routage",
  "collectif sauvegardé : enregistrement explicite, rechargement, étapes hors réseau et export complet",
  "horaires : focus de la même option conservé lorsqu’elle passe parmi les références",
  "parcours partagé : choix explicites, trois moteurs/étapes, données et trajet principal conservés",
  "parcours partagé : stations manquantes ou identiques et lieux hors pilote",
  "parcours partagé : annulation et réponse tardive ne réaffichent aucun résultat",
  "partagé sauvegardé : reprise volontaire, catalogue confirmé, nouveau calcul sans géocodage",
  "partagé sauvegardé : clavier à quatre rubriques et fermeture avec retour du focus"
];
// Complete reference journeys retain the exact Chromium assertions.
export const compatibilityJourneyCases = [
  "carte et liste Leaflet : retour au même point et à sa page sans recalcul",
  "carte et liste schéma : paysage et texte doublé sans masquer les commandes",
  "pages stations : 100 fiches accessibles, rendu borné et navigation sans effet externe",
  "pages stations Leaflet : carte, fiche et bonne page sans modifier les filtres",
  "préparation lisible : actions proches des choix, navigation clavier et critères explicites",
  "préparation lisible : méthode repliée, limites visibles et suite volontaire",
  'accès station IGN : absence de chemin isolée, suite bornée et contraintes conservées',
  'accès station IGN : 404 générique interrompt sans consommer la candidate',
  "service public absent : controles indisponibles avant recherche",
  "choix routiers : deux critères, écarts lisibles, tri sans appel et adoption volontaire",
  "choix routiers : mêmes exclusions IGN, cache distinct et arrêts recalculés sur le choix",
  "choix routiers : panne partielle sans repli et moteur désactivé explicite",
  "fenêtre : proximité choisie filtre les accès routiers puis relance explicite",
  "fenêtre : sauvegarde format 11, export, rechargement et reprise gardent les trois valeurs",
  "comparaison collective : arrivée avant limite inclut la marge et conserve les identités",
  "covoiturage : frais inconnus, partiels puis déclarés, partage exact sans addition du plein",
  "covoiturage : récapitulatif relu et copié, lieux privés exclus et aucune transmission automatique",
  "journal : activation volontaire, confirmation et doublon après rechargement"
];
export const compatibilityCases = [...compatibilityRoadCases, ...compatibilityModeCases, ...compatibilityJourneyCases];
export const compatibilityMatrix = ['firefox', 'webkit'].flatMap(engine => [
  { name: `${engine}-desktop-1440`, engine, viewport: { width: 1440, height: 900 }, readingViewport: { width: 1024, height: 768 } },
  { name: `${engine}-small-390`, engine, viewport: { width: 390, height: 844 }, readingViewport: { width: 390, height: 844 } }
]);
export const compatibilityLimits = 'Moteurs épinglés de Playwright, services simulés, petit écran redimensionné ; ni Firefox stable actuel, ni Safari commercial, ni Safari iOS, ni appareil physique qualifiés.';

export function validCompatibility(proof, commit) {
  return !!(proof && proof.schemaVersion === 1 && proof.state === 'passed' &&
    proof.commit === commit && proof.runnerExitCode === 0 && proof.errors?.length === 0 &&
    typeof proof.playwright === 'string' && proof.playwright.length &&
    typeof proof.platform === 'string' && proof.platform.length &&
    proof.matrix?.length === compatibilityMatrix.length && compatibilityMatrix.every(expected => {
      const rows = proof.matrix.filter(row => row.name === expected.name);
      if (rows.length !== 1) return false;
      const row = rows[0];
      return row.engine === expected.engine && typeof row.version === 'string' && row.version.length > 0 &&
        row.viewport?.width === expected.viewport.width && row.viewport?.height === expected.viewport.height &&
        row.cases?.length === compatibilityCases.length && compatibilityCases.every(title => {
          const cases = row.cases.filter(test => test.title === title);
          return cases.length === 1 && cases[0].passed === true && cases[0].attempts === 1;
        });
    }));
}
