# TP GestiShop – Gestion des produits

CRUD complet en JavaScript vanilla (DOM, JSON, LocalStorage, `filter` / `map` / `reduce` / `find`).

## Lancer le projet
1. Ouvrir le dossier `tp-gestishop` dans VS Code.
2. Lancer l'extension **Live Server** (clic droit sur `index.html` → *Open with Live Server*).
   Un double-clic sur `index.html` ne fonctionne pas : `data.js` utilise `export` et `app.js` est chargé avec `type="module"`.

## Fonctionnalités réalisées
- **Read** : tableau généré avec `map`, colonne Total (prix × stock), rupture de stock en rouge + badge, message « Aucun produit » si la liste est vide.
- **Create** : formulaire validé (messages sous chaque champ), id généré avec `reduce`.
- **Update** : bouton Modifier (`find`), formulaire pré-rempli, bouton « Enregistrer » / « Annuler ».
- **Delete** : confirmation puis `filter` ; un seul écouteur sur le `<tbody>` (délégation d'événements, `data-id`).
- **Persistance** : `sauvegarder()` / `charger()` avec `JSON.stringify` / `JSON.parse`, clé `gestishop_produits`.
- **Recherche + filtre par catégorie** combinés.
- **Statistiques** (reduce / filter) : nombre de produits, valeur du stock, ruptures, note moyenne.
- **Réinitialiser** les données d'origine (avec confirmation).
- **Bonus** : tri des colonnes Prix, Note et Total au clic (`sort`)

## Difficultés rencontrées
- Code tres long 
- Difficultés a maitriser certaines subtilités du tp meme avec un IA 