import { produits as produitsInitiaux } from "./data.js";

const CLE_STOCKAGE = "gestishop_produits";
const CATEGORIES = ["informatique", "telephonie", "bureautique"];
const CHAMPS = ["nom", "categorie", "prix", "stock", "note"];

// ---------- État de l'application ----------
let produits = charger();      // copie modifiable (jamais l'import directement)
let idEnEdition = null;        // null = mode ajout, sinon id du produit modifié
let tri = { cle: null, sens: 1 }; // tri des colonnes (bonus)

// ---------- Références DOM ----------
const formulaire = document.querySelector("#formulaire");
const titreFormulaire = document.querySelector("#titre-formulaire");
const btnValider = document.querySelector("#btn-valider");
const btnAnnuler = document.querySelector("#btn-annuler");
const tbody = document.querySelector("#liste");
const tableau = document.querySelector("#tableau");
const messageVide = document.querySelector("#message-vide");
const champRecherche = document.querySelector("#recherche");
const filtreCategorie = document.querySelector("#filtre-categorie");

// =============================================================
//  Persistance (JSON + LocalStorage)
// =============================================================

/** Enregistre le tableau des produits dans LocalStorage. */
const sauvegarder = () => {
    localStorage.setItem(CLE_STOCKAGE, JSON.stringify(produits));
};

/** Lit LocalStorage ; au premier lancement (ou si données corrompues), repart de data.js. */
function charger() {
    const brut = localStorage.getItem(CLE_STOCKAGE);
    if (brut === null) return [...produitsInitiaux];
    try {
        const donnees = JSON.parse(brut);
        return Array.isArray(donnees) ? donnees : [...produitsInitiaux];
    } catch {
        return [...produitsInitiaux];
    }
}

// =============================================================
//  Utilitaires
// =============================================================

const formater = (n) => n.toLocaleString("fr-FR");
const calculerTotal = (p) => p.prix * p.stock;

/** Échappe le HTML pour éviter d'injecter du code via le champ « nom ». */
const echapper = (texte) =>
    String(texte)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;");

// =============================================================
//  Affichage (Read)
// =============================================================

/** Génère les lignes du tableau avec map, ou affiche « Aucun produit ». */
function afficherProduits(liste) {
    const vide = liste.length === 0;
    tableau.hidden = vide;
    messageVide.hidden = !vide;

    tbody.innerHTML = liste
        .map((p) => `
      <tr class="${p.stock === 0 ? "rupture" : ""}">
        <td>${p.id}</td>
        <td>${echapper(p.nom)}${p.stock === 0 ? '<span class="badge">Rupture</span>' : ""}</td>
        <td>${echapper(p.categorie)}</td>
        <td class="num">${formater(p.prix)}</td>
        <td class="num">${formater(p.stock)}</td>
        <td class="num">${p.note}</td>
        <td class="num">${formater(calculerTotal(p))}</td>
        <td class="actions">
          <button type="button" class="btn btn-petit btn-modifier" data-id="${p.id}">Modifier</button>
          <button type="button" class="btn btn-petit btn-supprimer" data-id="${p.id}">Supprimer</button>
        </td>
      </tr>`)
        .join("");
}

/** Applique recherche + catégorie ensemble, puis le tri éventuel. */
function obtenirProduitsFiltres() {
    const texte = champRecherche.value.trim().toLowerCase();
    const categorie = filtreCategorie.value;

    const filtres = produits
        .filter((p) => p.nom.toLowerCase().includes(texte))
        .filter((p) => categorie === "" || p.categorie === categorie);

    if (tri.cle === null) return filtres;

    const valeur = (p) => (tri.cle === "total" ? calculerTotal(p) : p[tri.cle]);
    return [...filtres].sort((a, b) => (valeur(a) - valeur(b)) * tri.sens);
}

/** Statistiques calculées sur l'ensemble des produits. */
function calculerStatistiques(liste) {
    const nombre = liste.length;
    const valeurStock = liste.reduce((somme, p) => somme + calculerTotal(p), 0);
    const ruptures = liste.filter((p) => p.stock === 0).length;
    const sommeNotes = liste.reduce((somme, p) => somme + p.note, 0);
    const noteMoyenne = nombre === 0 ? 0 : Math.round((sommeNotes / nombre) * 10) / 10;
    return { nombre, valeurStock, ruptures, noteMoyenne };
}

function afficherStatistiques({ nombre, valeurStock, ruptures, noteMoyenne }) {
    document.querySelector("#stat-nombre").textContent = nombre;
    document.querySelector("#stat-valeur").textContent = `${formater(valeurStock)} FCFA`;
    document.querySelector("#stat-rupture").textContent = ruptures;
    document.querySelector("#stat-note").textContent = noteMoyenne.toLocaleString("fr-FR");
}

/** Met à jour les flèches ▲ ▼ des en-têtes triables. */
function afficherFleches() {
    document.querySelectorAll("th.triable").forEach((th) => {
        th.querySelector(".fleche").textContent =
            th.dataset.tri === tri.cle ? (tri.sens === 1 ? "▲" : "▼") : "";
    });
}

/** Redessine toute l'interface à partir de l'état courant. */
function rafraichir() {
    afficherProduits(obtenirProduitsFiltres());
    afficherStatistiques(calculerStatistiques(produits));
    afficherFleches();
}

// =============================================================
//  Formulaire : lecture, validation, mode ajout / modification
// =============================================================

const lireFormulaire = () => ({
    nom: formulaire.nom.value.trim(),
    categorie: formulaire.categorie.value,
    prix: formulaire.prix.value,
    stock: formulaire.stock.value,
    note: formulaire.note.value,
});

/** Retourne un objet { champ: message } ; vide si tout est valide. */
function validerProduit({ nom, categorie, prix, stock, note }) {
    const erreurs = {};

    if (nom.length < 2) erreurs.nom = "Le nom est obligatoire (2 caractères minimum).";
    if (!CATEGORIES.includes(categorie)) erreurs.categorie = "Choisissez une catégorie.";

    const prixNum = Number(prix);
    if (prix === "" || !Number.isFinite(prixNum) || prixNum <= 0) {
        erreurs.prix = "Le prix est obligatoire et doit être strictement positif.";
    }

    const stockNum = Number(stock);
    if (stock === "" || !Number.isInteger(stockNum) || stockNum < 0) {
        erreurs.stock = "Le stock doit être un entier supérieur ou égal à 0.";
    }

    const noteNum = Number(note);
    const unePecimale = Math.abs(noteNum * 10 - Math.round(noteNum * 10)) < 1e-9;
    if (note === "" || !Number.isFinite(noteNum) || noteNum < 0 || noteNum > 5 || !unePecimale) {
        erreurs.note = "La note doit être comprise entre 0 et 5 (une décimale maximum).";
    }

    return erreurs;
}

function afficherErreurs(erreurs) {
    CHAMPS.forEach((champ) => {
        document.querySelector(`[data-erreur="${champ}"]`).textContent = erreurs[champ] ?? "";
        formulaire[champ].classList.toggle("invalide", champ in erreurs);
    });
}

/** Passe le formulaire en mode ajout et le vide. */
function reinitialiserFormulaire() {
    idEnEdition = null;
    formulaire.reset();
    afficherErreurs({});
    titreFormulaire.textContent = "Nouveau produit";
    btnValider.textContent = "Ajouter";
}

// =============================================================
//  Create / Update / Delete
// =============================================================

/** Construit un produit propre (types convertis) à partir des champs validés. */
const construireProduit = (id, saisie) => ({
    id,
    nom: saisie.nom,
    categorie: saisie.categorie,
    prix: Number(saisie.prix),
    stock: Number(saisie.stock),
    note: Number(saisie.note),
});

function ajouterProduit(saisie) {
    const nouvelId = produits.reduce((max, p) => Math.max(max, p.id), 0) + 1;
    produits = [...produits, construireProduit(nouvelId, saisie)];
}

function modifierProduit(id, saisie) {
    produits = produits.map((p) => (p.id === id ? construireProduit(id, saisie) : p));
}

function supprimerProduit(id) {
    produits = produits.filter((p) => p.id !== id);
}

/** Pré-remplit le formulaire avec le produit choisi (mode modification). */
function demarrerModification(id) {
    const produit = produits.find((p) => p.id === id);
    if (!produit) return;

    idEnEdition = id;
    formulaire.nom.value = produit.nom;
    formulaire.categorie.value = produit.categorie;
    formulaire.prix.value = produit.prix;
    formulaire.stock.value = produit.stock;
    formulaire.note.value = produit.note;
    afficherErreurs({});

    titreFormulaire.textContent = `Modifier le produit n° ${id}`;
    btnValider.textContent = "Enregistrer";
    formulaire.scrollIntoView({ behavior: "smooth", block: "start" });
    formulaire.nom.focus();
}

// =============================================================
//  Gestionnaires d'événements
// =============================================================

// Soumission : ajout ou enregistrement selon le mode
formulaire.addEventListener("submit", (e) => {
    e.preventDefault();
    const saisie = lireFormulaire();
    const erreurs = validerProduit(saisie);
    afficherErreurs(erreurs);
    if (Object.keys(erreurs).length > 0) return;

    if (idEnEdition === null) ajouterProduit(saisie);
    else modifierProduit(idEnEdition, saisie);

    sauvegarder();
    reinitialiserFormulaire();
    rafraichir();
});

btnAnnuler.addEventListener("click", reinitialiserFormulaire);

// Délégation d'événements : un seul écouteur sur le <tbody>
tbody.addEventListener("click", (e) => {
    const bouton = e.target.closest("button[data-id]");
    if (!bouton) return;
    const id = Number(bouton.dataset.id);

    if (bouton.classList.contains("btn-supprimer")) {
        const produit = produits.find((p) => p.id === id);
        if (!confirm(`Supprimer « ${produit.nom} » ?`)) return;
        supprimerProduit(id);
        sauvegarder();
        if (idEnEdition === id) reinitialiserFormulaire();
        rafraichir();
    } else if (bouton.classList.contains("btn-modifier")) {
        demarrerModification(id);
    }
});

// Recherche et filtre combinés
champRecherche.addEventListener("input", rafraichir);
filtreCategorie.addEventListener("change", rafraichir);

// Réinitialisation : retour aux données d'origine de data.js
document.querySelector("#btn-reinitialiser").addEventListener("click", () => {
    if (!confirm("Recharger les données d'origine ? Vos modifications seront perdues.")) return;
    produits = [...produitsInitiaux];
    sauvegarder();
    champRecherche.value = "";
    filtreCategorie.value = "";
    tri = { cle: null, sens: 1 };
    reinitialiserFormulaire();
    rafraichir();
});

// Bonus : tri au clic sur Prix, Note, Total (clic répété = inverse l'ordre)
document.querySelectorAll("th.triable").forEach((th) => {
    th.addEventListener("click", () => {
        const cle = th.dataset.tri;
        tri = tri.cle === cle ? { cle, sens: -tri.sens } : { cle, sens: 1 };
        rafraichir();
    });
});

// ---------- Démarrage ----------
rafraichir();