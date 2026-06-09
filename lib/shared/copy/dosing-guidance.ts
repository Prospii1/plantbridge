/**
 * Educational starting-dose guidance per recommendation subject.
 * These are educational references only — not medical advice.
 * All values require domain expert review before production launch.
 */

export interface DosingInfo {
  beginner:     string;
  moderate:     string;
  experienced:  string;
  timing?:      string;
  caution?:     string;
}

export const DOSING_GUIDANCE: Record<string, DosingInfo> = {
  cbd: {
    beginner:    '5–10 mg once daily',
    moderate:    '15–25 mg once daily',
    experienced: '25–50 mg as needed',
    timing:      'Consistent daily dosing builds steady levels over time.',
    caution:     'Effects with oral formats can take 30–90 min. Start low and wait.',
  },
  cbn: {
    beginner:    '2.5–5 mg',
    moderate:    '5–15 mg',
    experienced: '15–25 mg',
    timing:      'Take 30–60 minutes before bed for sleep support.',
  },
  cbg: {
    beginner:    '5–10 mg',
    moderate:    '10–25 mg',
    experienced: '25–40 mg',
    timing:      'Can be taken morning or evening depending on your goals.',
  },
  'thc-low': {
    beginner:    'Not yet — build a CBD foundation first',
    moderate:    '2.5 mg THC',
    experienced: '5–10 mg THC',
    caution:     'Start in a comfortable, safe environment. Psychoactive effects are possible.',
  },
  'thc-cbd-balanced': {
    beginner:    'Not yet — build CBD tolerance first',
    moderate:    '2.5 mg THC : 5 mg CBD',
    experienced: '5 mg THC : 10 mg CBD',
    caution:     'Balanced ratios can reduce anxiety from THC, but go slowly. Wait 2 hours before redosing.',
  },
  linalool: {
    beginner:    'Seek products noting linalool as a primary terpene',
    moderate:    'Seek linalool-dominant profiles',
    experienced: 'Seek linalool-dominant profiles',
    timing:      'Often paired with CBD for a synergistic calming effect.',
  },
  myrcene: {
    beginner:    'Seek myrcene-rich indica-leaning products',
    moderate:    'As needed',
    experienced: 'As needed',
    timing:      'Sedative at higher concentrations — better suited for evening use.',
  },
  caryophyllene: {
    beginner:    'Look for beta-caryophyllene listed on the COA',
    moderate:    'As needed',
    experienced: 'As needed',
    timing:      'Non-psychoactive at terpene concentrations. Acts on CB2 receptors.',
  },
  limonene: {
    beginner:    'Seek limonene-forward products',
    moderate:    'As needed',
    experienced: 'As needed',
    timing:      'Associated with uplifting effects — better suited for daytime use.',
  },
  pinene: {
    beginner:    'Seek alpha-pinene dominant products',
    moderate:    'As needed',
    experienced: 'As needed',
    timing:      'May support alertness — use during the day.',
  },
  tincture: {
    beginner:    '1–3 drops under the tongue; hold 60 seconds',
    moderate:    'Adjust by 1–2 drops per session until effective',
    experienced: 'Per your established protocol',
  },
  topical: {
    beginner:    'Small amount to affected area — can apply freely, no psychoactive effect',
    moderate:    'Up to 3–4 times daily as needed',
    experienced: 'As needed',
  },
  capsule: {
    beginner:    '1 capsule (typically 5–10 mg)',
    moderate:    '1–2 capsules',
    experienced: '2+ capsules as needed',
    timing:      'Onset is slower (1–2 hrs) but duration is longer than tinctures.',
  },
  edible: {
    beginner:    '2.5–5 mg — wait at least 2 hours before considering more',
    moderate:    '5–10 mg',
    experienced: '10–25 mg',
    caution:     'Edibles have the slowest onset and strongest duration. Avoid redosing too soon.',
  },
  'nighttime-dose': {
    beginner:    'Take your chosen product 30–60 min before your intended sleep time',
    moderate:    'As needed before bed',
    experienced: 'As needed',
  },
  'start-low-go-slow': {
    beginner:    'Start at the lowest suggested dose. Increase slowly every 3–5 days.',
    moderate:    'Titrate up slowly — increase every 3–5 days until effective.',
    experienced: 'Standard titration applies — increase gradually as needed.',
  },
  'medication-check': {
    beginner:    'Please discuss this plan with your doctor before starting.',
    moderate:    'Please discuss with your doctor — cannabinoids can affect how some medications are processed.',
    experienced: 'Please review with your doctor — CBD in particular can affect medications metabolised by the CYP450 system.',
    caution:     'CBD can inhibit CYP450 enzymes involved in metabolising many common medications including blood thinners, antidepressants, and seizure medications.',
  },
};

export type ExperienceLevel = 'beginner' | 'moderate' | 'experienced';

export function getDosingForLevel(subject: string, level: ExperienceLevel): string | null {
  const info = DOSING_GUIDANCE[subject.toLowerCase().replace(/\s+/g, '-')];
  if (!info) return null;
  return info[level] ?? info.beginner;
}
