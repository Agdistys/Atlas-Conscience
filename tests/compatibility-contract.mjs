// A bounded contract, shared by collection and publication: removing a case is not a pass.
export const compatibilityCases = [
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
