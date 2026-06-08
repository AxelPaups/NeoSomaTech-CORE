// src/lib/directus.ts
import { createDirectus, rest, readItems, readItem, staticToken } from '@directus/sdk';

// TypeScript editors may underline `process` in ESM modules if Node types
// are not installed; provide a small local declaration to avoid noisy errors.
declare const process: { env: { [key: string]: string | undefined } };

const DIRECTUS_URL = process.env.DIRECTUS_URL ?? 'https://spirited-squid.pikapod.net';
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN ?? '';

// Initialise le client Directus côté serveur. Le token doit être fourni via
// la variable d'environnement `DIRECTUS_TOKEN`. Si elle est absente, on
// initialise le client sans token (lecture limitée selon configuration).
const client = createDirectus(DIRECTUS_URL);
export const directus = DIRECTUS_TOKEN
  ? client.with(staticToken(DIRECTUS_TOKEN)).with(rest())
  : client.with(rest());

// 2. Fonction pour récupérer TOUS les produits
export async function getProduits() {
  try {
    // Utilise le nom exact de ta collection (attention à la casse, souvent en minuscule)
    return await directus.request(readItems('Produits')); 
  } catch (error) {
    console.error("Erreur getProduits :", error);
    return [];
  }
}

// 3. Fonction pour récupérer UN SEUL produit par son ID
export async function getProduitById(id: string) {
  try {
    return await directus.request(readItem('Produits', id));
  } catch (error) {
    console.error(`Erreur getProduitById pour ${id} :`, error);
    return null;
  }
}
export async function getArticles() {
  try {
    return await directus.request(readItems('Articles'));
  } catch (error) {
    console.error("Erreur getArticles :", error);
    return [];
  }
}