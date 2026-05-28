import { DISCLAIMERS } from '@/lib/shared/copy/disclaimers';

export default function NotAvailablePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="flex flex-col gap-3">
        <h1 className="text-2xl font-semibold text-foreground">
          Not available in your area
        </h1>
        <p className="max-w-md text-muted-foreground">
          PlantBridge is currently available only in US states where adult-use
          cannabis is legal. We&apos;re working to expand — check back soon.
        </p>
      </div>
      <p className="max-w-md text-xs text-muted-foreground">
        {DISCLAIMERS.ageAndState}
      </p>
    </div>
  );
}
