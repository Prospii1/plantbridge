import { createSupabaseAdminClient } from '@/lib/server/supabase-admin';
import { adminAddProduct, adminToggleProductStock, adminDeleteProduct } from './actions';

async function addProductAction(formData: FormData): Promise<void> {
  'use server';
  await adminAddProduct({}, formData);
}

const CATEGORIES = ['flower', 'edible', 'tincture', 'topical', 'concentrate'] as const;

const CATEGORY_LABELS: Record<string, string> = {
  flower:      'Flower',
  edible:      'Edible',
  tincture:    'Tincture',
  topical:     'Topical',
  concentrate: 'Concentrate',
};

export default async function AdminProductsPage() {
  const supabase = createSupabaseAdminClient();

  const [productsRes, partnersRes] = await Promise.all([
    supabase
      .from('dispensary_products')
      .select('id, name, category, thc_percentage, cbd_percentage, price_cents, in_stock, state, coa_url, partner_id, created_at')
      .order('created_at', { ascending: false }),
    supabase.from('partners').select('id, company_name, region_states').order('company_name'),
  ]);

  const products  = productsRes.data  ?? [];
  const partners  = partnersRes.data  ?? [];

  const partnerMap = new Map(partners.map((p) => [p.id, p.company_name]));

  return (
    <div className="max-w-5xl space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">Products &amp; COAs</h1>
        <span className="text-sm text-muted-foreground">{products.length} products</span>
      </div>

      {/* Add product form */}
      <section className="rounded-lg border border-border bg-card p-5 space-y-4">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Add Product Manually</h2>

        <form action={addProductAction} className="space-y-4">
          {/* Row 1: partner + name */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Partner *</label>
              <select name="partner_id" required
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">Select partner…</option>
                {partners.map((p) => (
                  <option key={p.id} value={p.id}>{p.company_name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Product name *</label>
              <input type="text" name="name" required maxLength={200} placeholder="e.g. Blue Dream Tincture 500mg"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>

          {/* Row 2: category + state */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Category *</label>
              <select name="category" required
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">State (2-letter)</label>
              <input type="text" name="state" maxLength={2} placeholder="CA"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>

          {/* Row 3: THC + CBD + price */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">THC %</label>
              <input type="number" name="thc_percentage" step="0.01" min="0" max="100" placeholder="0.00"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">CBD %</label>
              <input type="number" name="cbd_percentage" step="0.01" min="0" max="100" placeholder="0.00"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Price (cents)</label>
              <input type="number" name="price_cents" min="0" placeholder="1999"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>

          {/* COA URL */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">COA URL (Certificate of Analysis)</label>
            <input type="url" name="coa_url" placeholder="https://lab.example.com/coa/12345.pdf"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Description (optional)</label>
            <textarea name="description" rows={2} maxLength={1000}
              placeholder="Short product description shown in the locator…"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>

          <button type="submit"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
            Add product
          </button>
        </form>
      </section>

      {/* Products table */}
      {products.length === 0 ? (
        <p className="text-sm text-muted-foreground">No products yet. Add one above.</p>
      ) : (
        <div className="space-y-2">
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">All Products</h2>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Product</th>
                  <th className="px-4 py-3 text-left font-medium">Partner</th>
                  <th className="px-4 py-3 text-left font-medium">Cat.</th>
                  <th className="px-4 py-3 text-left font-medium">THC</th>
                  <th className="px-4 py-3 text-left font-medium">CBD</th>
                  <th className="px-4 py-3 text-left font-medium">Price</th>
                  <th className="px-4 py-3 text-left font-medium">COA</th>
                  <th className="px-4 py-3 text-left font-medium">Stock</th>
                  <th className="px-4 py-3 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {products.map((product) => {
                  const toggleStock = adminToggleProductStock.bind(null, product.id, product.in_stock);
                  const deleteProduct = adminDeleteProduct.bind(null, product.id);
                  return (
                    <tr key={product.id} className="bg-card hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-medium text-foreground max-w-[200px] truncate">
                        {product.name}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {partnerMap.get(product.partner_id) ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground capitalize">
                          {product.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {product.thc_percentage != null ? `${product.thc_percentage}%` : '—'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {product.cbd_percentage != null ? `${product.cbd_percentage}%` : '—'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {product.price_cents != null ? `$${(product.price_cents / 100).toFixed(2)}` : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {product.coa_url ? (
                          <a
                            href={product.coa_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline"
                          >
                            View COA
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium ${product.in_stock ? 'text-primary' : 'text-muted-foreground'}`}>
                          {product.in_stock ? 'In stock' : 'Out of stock'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <form action={toggleStock}>
                            <button type="submit"
                              className="rounded border border-border px-2 py-1 text-xs hover:bg-secondary transition-colors">
                              {product.in_stock ? 'Mark out' : 'Mark in'}
                            </button>
                          </form>
                          <form action={deleteProduct}>
                            <button type="submit"
                              className="rounded border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50 transition-colors">
                              Delete
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
