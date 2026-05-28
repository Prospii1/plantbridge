import type { Metadata } from 'next';
import { DISCLAIMERS } from '@/lib/shared/copy/disclaimers';

export const metadata: Metadata = {
  title: 'Medical Disclaimer',
  description: 'PlantBridge Medical Disclaimer',
};

export default function DisclaimerPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Medical Disclaimer</h1>
        <p className="text-sm text-muted-foreground">Last updated: May 2026</p>
      </div>

      <section className="space-y-4 text-sm text-foreground leading-relaxed">
        <h2 className="text-lg font-semibold">Educational Information Only</h2>
        <p>{DISCLAIMERS.standard}</p>
      </section>

      <section className="space-y-4 text-sm text-foreground leading-relaxed">
        <h2 className="text-lg font-semibold">Medications and Health Conditions</h2>
        <p>{DISCLAIMERS.medication}</p>
        <p>
          Cannabis compounds such as cannabidiol (CBD) and tetrahydrocannabinol (THC) may interact with certain prescription and over-the-counter medications. These interactions can affect how drugs are metabolized in your body. Always disclose cannabis use to your healthcare provider.
        </p>
      </section>

      <section className="space-y-4 text-sm text-foreground leading-relaxed">
        <h2 className="text-lg font-semibold">No Doctor-Patient Relationship</h2>
        <p>
          Using PlantBridge does not create a doctor-patient or healthcare provider relationship. PlantBridge is not a licensed medical provider. No information provided through the platform should be used to self-diagnose or self-treat any medical condition.
        </p>
      </section>

      <section className="space-y-4 text-sm text-foreground leading-relaxed">
        <h2 className="text-lg font-semibold">Individual Results Vary</h2>
        <p>
          Cannabis affects individuals differently based on genetics, tolerance, consumption method, product quality, and many other factors. PlantBridge makes no representation that any suggested approaches will produce a particular result for any individual user. Educational information presented here reflects general research and wellness guidance, not guaranteed outcomes.
        </p>
      </section>

      <section className="space-y-4 text-sm text-foreground leading-relaxed">
        <h2 className="text-lg font-semibold">Care Plan Disclaimer</h2>
        <p>{DISCLAIMERS.carePlanFooter}</p>
      </section>

      <section className="space-y-4 text-sm text-foreground leading-relaxed">
        <h2 className="text-lg font-semibold">Age and Legal Requirements</h2>
        <p>{DISCLAIMERS.ageAndState}</p>
        <p>
          Laws regarding cannabis vary significantly by jurisdiction. It is your responsibility to ensure compliance with all applicable local, state, and federal laws.
        </p>
      </section>

      <section className="space-y-4 text-sm text-foreground leading-relaxed">
        <h2 className="text-lg font-semibold">Emergency Situations</h2>
        <p>
          If you are experiencing a medical emergency, call 911 or your local emergency number immediately. Do not use PlantBridge as a substitute for emergency medical care.
        </p>
      </section>
    </div>
  );
}
