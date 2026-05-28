// Dutchie GraphQL API client — Phase 4
// API reference: https://dutchie.com/graphql (requires Dutchie API key)
// In Phase 3 we used mock seed data. This replaces that with live Dutchie data
// behind the DUTCHIE_SYNC_ENABLED feature flag.

export interface DutchieProduct {
  externalId: string;
  name: string;
  category: string;
  thcPercentage: number | null;
  cbdPercentage: number | null;
  terpeneProfile: Record<string, number> | null;
  description: string | null;
  priceCents: number | null;
  inStock: boolean;
  state: string;
}

const DUTCHIE_GRAPHQL_URL = 'https://api.dutchie.com/graphql';

const PRODUCTS_QUERY = `
  query GetProducts($retailerId: ID!) {
    retailer(id: $retailerId) {
      products(limit: 200) {
        id
        name
        category { name }
        thcContent { unit value }
        cbdContent { unit value }
        terpenes { terpene { name } value }
        description
        variants { priceRec }
        inStock
        dispensary { state }
      }
    }
  }
`;

function toPercent(value: number | null | undefined, unit: string | null | undefined): number | null {
  if (value == null) return null;
  if (unit === 'PERCENTAGE') return value;
  if (unit === 'MILLIGRAMS') return null; // can't convert without serving size
  return value;
}

function normalizeCategory(raw: string): string {
  const map: Record<string, string> = {
    flower: 'flower',
    edible: 'edible',
    edibles: 'edible',
    tincture: 'tincture',
    tinctures: 'tincture',
    topical: 'topical',
    topicals: 'topical',
    concentrate: 'concentrate',
    concentrates: 'concentrate',
  };
  return map[raw.toLowerCase()] ?? 'flower';
}

export async function fetchDutchieProducts(retailerId: string): Promise<DutchieProduct[]> {
  const apiKey = process.env.DUTCHIE_API_KEY;
  if (!apiKey) throw new Error('DUTCHIE_API_KEY is not set');

  const res = await fetch(DUTCHIE_GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ query: PRODUCTS_QUERY, variables: { retailerId } }),
  });

  if (!res.ok) throw new Error(`Dutchie API error: ${res.status} ${res.statusText}`);

  const json = (await res.json()) as {
    data?: {
      retailer?: {
        products?: Array<{
          id: string;
          name: string;
          category: { name: string };
          thcContent: { unit: string; value: number } | null;
          cbdContent: { unit: string; value: number } | null;
          terpenes: Array<{ terpene: { name: string }; value: number }> | null;
          description: string | null;
          variants: Array<{ priceRec: number | null }>;
          inStock: boolean;
          dispensary: { state: string };
        }>;
      };
    };
    errors?: Array<{ message: string }>;
  };

  if (json.errors?.length) throw new Error(`Dutchie GQL error: ${json.errors[0]?.message}`);

  const products = json.data?.retailer?.products ?? [];

  return products.map((p) => {
    const terpenes = (p.terpenes ?? []).reduce<Record<string, number>>((acc, t) => {
      acc[t.terpene.name.toLowerCase()] = t.value;
      return acc;
    }, {});

    const priceRec = p.variants[0]?.priceRec;

    return {
      externalId: p.id,
      name: p.name,
      category: normalizeCategory(p.category.name),
      thcPercentage: toPercent(p.thcContent?.value, p.thcContent?.unit),
      cbdPercentage: toPercent(p.cbdContent?.value, p.cbdContent?.unit),
      terpeneProfile: Object.keys(terpenes).length > 0 ? terpenes : null,
      description: p.description,
      priceCents: priceRec != null ? Math.round(priceRec * 100) : null,
      inStock: p.inStock,
      state: p.dispensary.state.toUpperCase().slice(0, 2),
    };
  });
}
