# Positions des gares de péage — inventaire embarqué

Source : ministère de la Transition écologique, [Gares de péage du réseau routier national concédé](https://www.data.gouv.fr/datasets/gares-de-peage-du-reseau-routier-national-concede), [CSV du 28 juillet 2025](https://static.data.gouv.fr/resources/gares-de-peage-du-reseau-routier-national-concede/20250728-140859/gares-peage-2025.csv), récupéré le 18 novembre 2026. Les 1 266 lignes portent la date de référence du **1er janvier 2025**. Licence [ODC-By 1.0](https://opendatacommons.org/licenses/by/1-0/). Les fichiers dérivés conservent cette attribution et ce renvoi à la licence.

`2025/gares-peage-2025.csv` conserve les octets reçus. `2025/provenance.json` fixe source, identifiant de ressource, dates, licence, empreintes et méthode. `2025/positions-wgs84.json` conserve le numéro de ligne du CSV, le nom, le code routier, le côté déclaré et le type de gare, avec coordonnées converties.

Les coordonnées Lambert-93 (EPSG:2154) sont converties en longitude/latitude WGS84 (EPSG:4326), avec pyproj 3.7.2 / PROJ 9.5.1, `always_xy=True`, `allow_ballpark=False`, réseau désactivé et arrondi à six décimales. Le contrôle inverse donne un écart numérique maximal de 0,067 m après arrondi. **Ce contrôle porte sur la transformation ; il ne mesure pas la précision de l’inventaire ni sa validité actuelle sur le terrain.**

Le générateur regroupe uniquement des positions dont le nom, le code routier et le type sont identiques, et dont chaque paire se trouve à moins de 300 m. Il produit 831 repères, conserve les 1 266 positions et leurs lignes sources. Ce nombre de groupes n’est pas un décompte garanti de sites physiques distincts. Le côté D/G/I n’est pas interprété comme un sens de parcours. Le CSV n’apporte pas d’identifiant commun avec les grilles APRR/AREA ; aucun exploitant n’est inféré du code routier.

Reconstruction et contrôle sans réseau ni bibliothèque tierce :

```sh
python3 tools/build-toll-gates.py
python3 tools/build-toll-gates.py --check
python3 tools/build-toll-tables.py --check
```

Pour reproduire la conversion, utiliser un environnement disposant de pyproj 3.7.2 puis `python3 tools/build-toll-gates.py --reproject`. La vérification ordinaire utilise l’instantané converti lié à son empreinte ; elle ne réexécute pas la projection. Le bloc géographique est embarqué dans `DragonRoute/config.js`, avant les grilles tarifaires ; leur générateur le préserve.

Le rapprochement avec le trajet est géométrique, effectué dans le navigateur. Une gare proche peut appartenir à une autre voie, à l’autre sens ou à un autre accès. Les distances au tracé et les kilomètres projetés sont des repères approximatifs, pas des accès routiers. Aucune proximité, absence de point ou concordance de nom ne prouve un passage, une gratuité ou un montant dû. Voir le [contrat fonctionnel V006](../../docs/specifications/OuQuandQui_API_V006_Reperage_Peages_2026-11-18.md).
