import Link from 'next/link';

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight text-primary">PlantBridge</span>
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            <Link href="/legal/terms" className="hidden text-muted-foreground transition-colors hover:text-foreground sm:block">
              Legal
            </Link>
            <Link href="/login" className="text-muted-foreground transition-colors hover:text-foreground">
              Sign in
            </Link>
            <Link
              href="/signup"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              Get started
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30 px-6 py-12">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-col gap-2">
              <span className="text-lg font-bold text-primary">PlantBridge</span>
              <p className="max-w-xs text-xs text-muted-foreground leading-relaxed">
                Personalized cannabis wellness education. Not medical advice.
                Available only where adult-use cannabis is legal and to users 21+.
              </p>
            </div>
            <div className="flex gap-12 text-sm">
              <div className="flex flex-col gap-3">
                <p className="font-medium text-foreground">Product</p>
                <Link href="/signup" className="text-muted-foreground hover:text-foreground transition-colors">Get started</Link>
                <Link href="/login" className="text-muted-foreground hover:text-foreground transition-colors">Sign in</Link>
              </div>
              <div className="flex flex-col gap-3">
                <p className="font-medium text-foreground">Legal</p>
                <Link href="/legal/terms" className="text-muted-foreground hover:text-foreground transition-colors">Terms</Link>
                <Link href="/legal/privacy" className="text-muted-foreground hover:text-foreground transition-colors">Privacy</Link>
                <Link href="/legal/disclaimer" className="text-muted-foreground hover:text-foreground transition-colors">Disclaimer</Link>
              </div>
            </div>
          </div>
          <div className="mt-10 border-t border-border pt-6 text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} PlantBridge. For educational purposes only. Not medical advice.
          </div>
        </div>
      </footer>
    </div>
  );
}
