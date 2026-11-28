# V042 — Limites impératives de marche

DOU-MARCHE-02 · 19 novembre 2026. Complète DOU-02, BOU-01/02/03, PRO-03/04/05 et ERR-01 du [cahier V5](OuQuandQui-Cahier-des-Charges-V5-2026-09-18.md), la [marche V014](OuQuandQui_API_V014_Marche_2026-11-18.md), la [comparaison V015](OuQuandQui_API_V015_Comparaison_2026-11-18.md) et les [limites vélo V041](OuQuandQui_API_V041_Limites_Velo_2026-11-19.md). Les éditions précédentes restent conservées.

## Distance et règle personnelle

Le calcul à pied et le comparateur routier proposent une distance maximale et deux règles : **Préférence** (choix initial) ou **Limite impérative**. La valeur va de 0 à 500 km ; vide signifie aucune distance demandée, zéro signifie explicitement zéro kilomètre. Une contrainte sans valeur est invalide. La borne de saisie n'est pas une recommandation d'effort.

Les mètres reçus sont comparés avant arrondi, avec une tolérance numérique de 0,000001 m. Une distance inconnue ne satisfait jamais une limite impérative. Un dépassement inférieur à un mètre reste annoncé. Le tracé, sa durée, sa source et sa date ne sont pas modifiés pour satisfaire la limite.

Après calcul, modifier le plafond ou la règle réévalue le résultat sans requête. Une préférence dépassée laisse le trajet admissible ; une contrainte dépassée le marque non admissible. La carte reste consultable, exportable et enregistrable comme référence historique. Des critères invalides bloquent l'enregistrement de cette référence et l'accès à la déclaration depuis ce résultat, jusqu'à correction.

Pendant le calcul, un changement de critères annule la recherche. Un changement de contexte observé lors de la réception invalide également la réponse. Celle-ci ne doit alors alimenter ni le résultat visible ni le cache IGN. Les bornes, délais et quotas existants restent appliqués.

## Comparaison et consultation d'un trajet écarté

Une marche dépassant une limite impérative sort des propositions admissibles et de leur classement. Elle reste dans les résultats écartés avec ses métriques et le motif. L'action **Consulter ce tracé à pied (hors limite)** l'affiche explicitement comme référence, en conservant sa règle et son avertissement sur la fiche principale. Cette consultation ne le rend pas admissible.

La réévaluation après calcul conserve les autres modes, les lieux, la date, la source, la géométrie et les métriques. Si le tracé à pied est déjà affiché, ses critères sont actualisés simultanément. Des critères invalides retirent uniquement l'option piétonne des propositions admissibles ; après correction, l'état est réévalué localement. Un autre changement de contexte continue d'exiger un nouveau calcul.

Le filtre horaire reste indépendant : assouplir la distance ne permet pas de sélectionner un trajet écarté par l'heure limite. La marche d'accès des transports collectifs et la marche totale d'une chaîne de vélo partagé restent des réglages distincts, avec leurs règles propres. Cette édition ne les remplace pas.

## Préparations routières et piétonnes : format 6

Le livre `dragonroute-preparations` passe en version 6, dans `dragonroute.prepared.v6.` suivi du périmètre public ou de l'aperçu. Les entrées à pied conservent `preferences.maxWalkKm` (nombre ou `null`) et `preferences.walkStrict` (booléen obligatoire). Les champs des préparations automobiles, horaires, critères de routage, rencontres et instantanés restent inchangés.

Les cinq clés précédentes restent en place. La priorité de lecture est 6 → 5 → 4 → 3 → 2 → 1 ; le format doit correspondre à sa clé. Une copie récente présente, même vide ou illisible, interdit la résurrection silencieuse d'une ancienne copie. Le format 1 ne contient pas de marche. Les formats 2 à 5 restent des préférences souples, avec leur ancienne borne minimale de 0,1 km. Un champ impératif dans un ancien format est refusé comme ambigu.

La migration se fait en mémoire, sans écriture. Un enregistrement volontaire crée ensuite la version 6 et préserve les originaux. L'original V5 est exportable octet pour octet ; la copie prioritaire non chargée, y compris de format futur ou en JSON invalide, est exportable en brut. Les exports antérieurs disponibles sont conservés.

Les six copies sont comparées avant écriture ou effacement pour détecter les modifications observables dans un autre onglet. Quota ou conflit conserve les données et le formulaire. L'effacement confirmé ne concerne que les six versions de cette rubrique dans son périmètre. Ce contrôle n'est pas une transaction atomique entre processus.

L'import vérifie le format avant remplacement explicitement confirmé : règle obligatoire, distance impérative présente, valeurs bornées, identifiants, géométries, dates, vingt entrées et 2 Mo. La règle distingue les préparations dans la détection des doublons. Une reprise charge les lieux et critères puis exige un nouveau calcul ; ni la préparation d'origine ni les autres livres ne sont modifiés. Consultation historique et aperçu d'import affichent la règle et le dépassement éventuel.

## Vérifications et limites

Les tests couvrent zéro/vide, seuil exact, distance inconnue, préférence/contrainte, indépendance des horaires, réévaluation sans réseau, réponses abandonnées, lecture des anciens formats, import/export, reprise, quota, conflit entre deux onglets et séparation public/aperçu. Des essais sur quatre dimensions d'écran et une recette sur des lieux publics, avec métriques confrontées aux réponses IGN et exports, complètent ces contrôles. Les résultats effectivement exécutés et captures sont consignés dans l'état du chantier et `quality/walking-limits`.

IGN reste le moteur de marche ; aucun fournisseur, compte, achat ou hébergement ajouté. La distance ne qualifie ni pente, escaliers, revêtement, effort, accessibilité ou sécurité. Aucune garantie d'alternative sous la limite, aucun trajet physique attesté et aucune déclaration de déplacement déduite d'une recherche. Le journal volontaire reste distinct des préférences de préparation ; aucune synchronisation entre appareils ni routage hors ligne ajouté.
