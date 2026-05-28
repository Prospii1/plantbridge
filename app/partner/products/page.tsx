import { createSupabaseServerClient } from '@/lib/server/supabase-server';
import { createSupabaseAdminClient } from '@/lib/server/supabase-admin';
import { addProduct, deleteProduct } from './actions';

const CATEGORIES = ['flower', 'edible', 'tincture', 'topical', 'concentrate'] as const;

export default async function PartnerProductsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const adminSupabase = createSupabaseAdminClient();

  const partnerRes = await adminSupabase
    .from('partners')
    .select('id')
    .eq('user_id', user.id)
    .single();

  const partnerId = partnerRes.data?.id;

  const products = partnerId
    ? (await adminSupabase
        .from('dispensary_products')
        .select('id, name, category, thc_percentage, cbd_percentage, state, price_cents, in_stock')
        .eq('partner_id', partnerId)
        .order('created_at', { ascending: false })).data ?? []
    : [];

  return (
    <div className="max-w-3xl space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">Products</h1>
        <span className="text-sm text-muted-foreground">{products.length} listed</span>
      </div>

      {/* Add product form */}
      <section className="rounded-lg border border-border bg-card p-5 space-y-4">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Add Product</h2>
        <form action={addProduct} className="grid grid-cols-2 gap-3">
          <div className="col-span-2 space-y-1">
            <label className="text-xs text-muted-foreground">Product name</label>
            <input type="text" name="name" required placeholder="Evening Haze"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Category</label>
            <select name="category" required
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
              {CATEGORIES.map((c) => (
                <option key={c} value={c} className="capitalize">{c}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">State (2-letter)</label>
            <input type="text" name="state" maxLength={2} placeholder="CA"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">THC %</label>
            <input type="number" name="thc_percentage" min="0" max="100" step="0.1" placeholder="18.5"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">CBD %</label>
            <input type="number" name="cbd_percentage" min="0" max="100" step="0.1" placeholder="0.3"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Price (cents, e.g. 1500 = $15.00)</label>
            <input type="number" name="price_cents" min="0" placeholder="1500"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div className="col-span-2 space-y-1">
            <label className="text-xs text-muted-foreground">Description</label>
            <textarea name="description" rows={2} placeholder="Educational description of this product…"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
          </div>
          <div className="col-span-2">
            <button type="submit"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              Add product
            </button>
          </div>
        </form>
      </section>

      {/* Product list */}
      {products.length === 0 ? (
        <p className="text-sm text-muted-foreground">No products yet. Add your first product above.</p>
      ) : (
        <ul className="space-y-3">
          {products.map((p) => {
            const removeWithId = deleteProduct.bind(null, p.id);
            return (
              <li key={p.id} className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium text-foreground">{p.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {p.category}
                    {p.state ? ` · ${p.state}` : ''}
                    {p.thc_percentage != null ? ` · THC ${p.thc_percentage}%` : ''}
                    {p.cbd_percentage != null ? ` · CBD ${p.cbd_percentage}%` : ''}
                    {p.price_cents != null ? ` · $${(p.price_cents / 100).toFixed(2)}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs ${p.in_stock ? 'text-primary' : 'text-muted-foreground'}`}>
                    {p.in_stock ? 'In stock' : 'Out of stock'}
                  </span>
                  <form action={removeWithId}>
                    <button type="submit" className="text-xs text-muted-foreground hover:text-destructive">
                      Remove
                    </button>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
