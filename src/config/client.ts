// src/config/client.ts
// -----------------------------------------------------------------------------
// Configuration centralisée du client Directus + définition des collections
// (Article & Produit) et de leurs champs.
//
// Toute la consommation Directus (API endpoints, pages admin) doit passer par
// ce fichier. Les credentials (URL, token) sont lus depuis process.env (.env)
// au démarrage.
// -----------------------------------------------------------------------------

// --- Déclarations minimales pour process / import.meta.env en ESM -----------
declare const process: { env: { [key: string]: string | undefined } };

// -----------------------------------------------------------------------------
// 1. CREDENTIALS (lus depuis .env UNIQUEMENT)
// -----------------------------------------------------------------------------
export const DIRECTUS_URL: string =
  process.env.DIRECTUS_URL ?? 'https://spirited-squid.pikapod.net';

export const DIRECTUS_TOKEN: string = process.env.DIRECTUS_TOKEN ?? '';

// Helper : header Authorization prêt à l'emploi
export const directusAuthHeader = (): Record<string, string> =>
  DIRECTUS_TOKEN ? { Authorization: `Bearer ${DIRECTUS_TOKEN}` } : {};

// -----------------------------------------------------------------------------
// 2. TYPES DE CHAMPS
// -----------------------------------------------------------------------------
/**
 * Types de champs supportés par le renderer dynamique.
 *  - text              : <input type="text">
 *  - number            : <input type="number">
 *  - decimal           : <input type="number" step="0.01">
 *  - boolean           : <input type="checkbox">
 *  - textarea          : <textarea>
 *  - select            : <select> avec options[]
 *  - html              : <textarea> + preview HTML (équivalent de l'ancien
 *                        "html-field" pour description_principale / contenu)
 *  - json              : <textarea> parsée en JSON.stringify / JSON.parse
 *  - date              : <input type="date">
 *  - datetime          : <input type="datetime-local">
 *  - asset             : champ image (géré par la zone d'upload Directus)
 *  - relation-many     : relation M2N/O2M (variantes, etc.)
 */
export type FieldType =
  | 'text'
  | 'number'
  | 'decimal'
  | 'boolean'
  | 'textarea'
  | 'select'
  | 'html'
  | 'json'
  | 'date'
  | 'datetime'
  | 'asset'
  | 'relation-many';

// -----------------------------------------------------------------------------
// 3. DÉFINITION D'UN CHAMP
// -----------------------------------------------------------------------------
export interface FieldOption {
  value: string;
  label: string;
}

export interface FieldDef {
  /** Clé technique du champ côté Directus (ex: "Nom_du_produit") */
  key: string;
  /** Libellé affiché dans le formulaire */
  label: string;
  /** Type de rendu (voir FieldType) */
  type: FieldType;
  /** Optionnel : aide affichée sous le champ */
  helper?: string;
  /** Optionnel : placeholder */
  placeholder?: string;
  /** Optionnel : true si le champ est requis */
  required?: boolean;
  /** Optionnel : true pour les champs non-éditables (lecture seule) */
  readonly?: boolean;
  /** Optionnel : pour type=select, liste des options */
  options?: FieldOption[];
  /** Optionnel : groupe d'affichage (les champs d'un même groupe sont
   *  rendus dans la même "form-section") */
  group?: string;
  /** Optionnel : forcer la largeur (utile pour les champs HTML) */
  wide?: boolean;
}

export interface CollectionDef {
  /** Identifiant interne (slug kebab-case, ex: "produits") */
  slug: string;
  /** Nom exact de la collection côté Directus (ex: "Produits") */
  collection: string;
  /** Libellé humain */
  label: string;
  /** Libellé singulier (pour les titres d'éditeur) */
  labelSingular: string;
  /** Identifiant du champ servant de "titre" dans les listes */
  titleField: string;
  /** Endpoint API custom (create / update) - facultatif */
  endpoints?: {
    create?: string;
    update?: string;
  };
  /** Champs système à NE PAS afficher dans l'éditeur */
  systemFields: string[];
  /** Champs qui ne sont PAS rendus dynamiquement car gérés à part
   *  (ex: upload image principal, zone variantes) */
  reservedFields: string[];
  /** Groupes affichés dans l'éditeur, avec leur titre / helper.
   *  Les champs d'un groupe qui n'est pas listé ici tombent dans
   *  le groupe par défaut "Champs Directus detectes". */
  groups: Array<{
    key: string;
    title: string;
    helper?: string;
  }>;
  /** Définition ordonnée des champs */
  fields: FieldDef[];
}

// -----------------------------------------------------------------------------
// 4. COLLECTION : PRODUITS
// -----------------------------------------------------------------------------
export const produitsCollection: CollectionDef = {
  slug: 'produits',
  collection: 'Produits',
  label: 'Produits',
  labelSingular: 'Produit',
  titleField: 'Nom_du_produit',
  endpoints: {
    create: '/api/create-product',
    update: '/api/update-product',
  },
  systemFields: ['id', 'date_created', 'date_updated', 'user_created', 'user_updated', 'sort'],
  reservedFields: ['image', 'variantes'],
  groups: [
    { key: 'info',     title: 'Informations produit',     helper: 'Champs essentiels de la fiche visible cote site.' },
    { key: 'commerce', title: 'Commerce et specs',        helper: 'Prix, promotion, dimensions et caracteristiques.' },
    { key: 'content',  title: 'Contenu avance',           helper: 'SEO, variantes, FAQ et reglages additionnels.' },
    { key: 'extra',    title: 'Champs Directus detectes', helper: 'Autres champs presents dans la collection Produits.' },
  ],
  fields: [
    // -- Informations produit ------------------------------------------------
    { key: 'Nom_du_produit',         label: 'Nom du produit',         type: 'text',     group: 'info',     required: true },
    { key: 'nom_court',              label: 'Nom court',              type: 'text',     group: 'info' },
    { key: 'slug',                   label: 'Slug',                   type: 'text',     group: 'info' },
    { key: 'marque',                 label: 'Marque',                 type: 'text',     group: 'info' },
    { key: 'description_simple',     label: 'Description simple',     type: 'textarea', group: 'info' },
    { key: 'description_principale', label: 'Description principale', type: 'html',     group: 'info',     wide: true },

    // -- Commerce et specs ---------------------------------------------------
    { key: 'prix',                   label: 'Prix',                   type: 'decimal',  group: 'commerce' },
    { key: 'prix_promo',             label: 'Prix promo',             type: 'decimal',  group: 'commerce' },
    { key: 'promo',                  label: 'En promo',               type: 'boolean',  group: 'commerce' },
    { key: 'poids',                  label: 'Poids',                  type: 'decimal',  group: 'commerce' },
    { key: 'autonomie',              label: 'Autonomie',              type: 'text',     group: 'commerce' },
    { key: 'assistance_max',         label: 'Assistance max',         type: 'text',     group: 'commerce' },
    { key: 'temps_charge',           label: 'Temps de charge',        type: 'text',     group: 'commerce' },
    { key: 'materiaux',              label: 'Materiaux',              type: 'text',     group: 'commerce' },
    { key: 'garantie',               label: 'Garantie',               type: 'text',     group: 'commerce' },

    // -- Contenu avance ------------------------------------------------------
    { key: 'Bouton_acheter',         label: 'Bouton acheter',         type: 'text',     group: 'content' },
    { key: 'texte_attente_sortie',   label: 'Texte attente sortie',   type: 'textarea', group: 'content' },
    { key: 'variantes',              label: 'Variantes',              type: 'json',     group: 'content', helper: 'Liste de variantes (geree par la zone Variantes).' },
    { key: 'faqs',                   label: 'FAQs',                   type: 'json',     group: 'content' },
    { key: 'seo_description',        label: 'Description SEO',        type: 'textarea', group: 'content' },
    { key: 'custom_alts',            label: 'Custom alts',            type: 'text',     group: 'content' },
    { key: 'comparateur_defaut',     label: 'Comparateur par defaut', type: 'text',     group: 'content' },
  ],
};

// -----------------------------------------------------------------------------
// 5. COLLECTION : ARTICLES
// -----------------------------------------------------------------------------
export const articlesCollection: CollectionDef = {
  slug: 'articles',
  collection: 'Articles',
  label: 'Articles',
  labelSingular: 'Article',
  titleField: 'titre',
  endpoints: {
    create: '/api/create-article',
    update: '/api/update-article',
  },
  systemFields: ['id', 'date_created', 'date_updated', 'user_created', 'user_updated', 'sort'],
  reservedFields: ['image_principale'],
  groups: [
    { key: 'info',  title: 'Informations article',     helper: 'Champs essentiels de la fiche visible cote site.' },
    { key: 'meta',  title: 'Publication et meta',      helper: 'Date, auteur, categorie et reglages additionnels.' },
    { key: 'extra', title: 'Champs Directus detectes', helper: 'Autres champs presents dans la collection Articles.' },
  ],
  fields: [
    // -- Informations article ------------------------------------------------
    { key: 'titre',            label: 'Titre',             type: 'text',     group: 'info',  required: true },
    { key: 'slug',             label: 'Slug',              type: 'text',     group: 'info' },
    { key: 'excerpt',          label: 'Extrait',           type: 'textarea', group: 'info' },
    { key: 'contenu',          label: 'Contenu',           type: 'html',     group: 'info',  wide: true },

    // -- Publication et meta -------------------------------------------------
    { key: 'date_publication', label: 'Date de publication', type: 'date',     group: 'meta' },
    { key: 'auteur',           label: 'Auteur',              type: 'text',    group: 'meta' },
    { key: 'categorie',        label: 'Categorie',           type: 'text',    group: 'meta' },
    { key: 'tags',             label: 'Tags',                type: 'text',    group: 'meta' },
    { key: 'seo_description',  label: 'Description SEO',     type: 'textarea', group: 'meta' },
    { key: 'custom_alts',      label: 'Custom alts',         type: 'text',    group: 'meta' },
  ],
};

// -----------------------------------------------------------------------------
// 6. REGISTRE GLOBAL + HELPERS
// -----------------------------------------------------------------------------
export const collections: Record<string, CollectionDef> = {
  [produitsCollection.slug]: produitsCollection,
  [articlesCollection.slug]: articlesCollection,
};

/** Récupère une collection par son slug. Throw si introuvable. */
export function getCollection(slug: string): CollectionDef {
  const c = collections[slug];
  if (!c) {
    throw new Error(
      `[config] Collection inconnue : "${slug}". ` +
      `Slugs disponibles : ${Object.keys(collections).join(', ')}`,
    );
  }
  return c;
}

/** Renvoie la liste des champs qui NE doivent PAS être rendus dans
 *  l'editeur (systemFields + reservedFields). */
export function getHiddenFields(c: CollectionDef): Set<string> {
  return new Set([...c.systemFields, ...c.reservedFields]);
}

/** Découpe les champs d'une collection en groupes, dans l'ordre déclaré
 *  par `c.groups`. Les champs dont le groupe n'est pas reconnu sont
 *  accumulés dans le groupe "extra" (s'il existe) ou dans un groupe
 *  generique en fin de liste. */
export function groupCollectionFields(
  c: CollectionDef,
): Array<{ key: string; title: string; helper?: string; fields: FieldDef[] }> {
  const buckets = new Map<string, FieldDef[]>();
  for (const group of c.groups) buckets.set(group.key, []);

  for (const field of c.fields) {
    const g = field.group && buckets.has(field.group) ? field.group : 'extra';
    buckets.get(g)!.push(field);
  }

  return c.groups
    .map((g) => ({
      key: g.key,
      title: g.title,
      helper: g.helper,
      fields: buckets.get(g.key) ?? [],
    }))
    .filter((g) => g.fields.length > 0);
}
