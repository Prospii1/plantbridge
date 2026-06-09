import type { Metadata } from 'next';
import { DISCLAIMERS } from '@/lib/shared/copy/disclaimers';

export const metadata: Metadata = { title: 'Resources — PlantBridge' };

interface ResourceItem {
  name: string;
  description: string;
  url: string;
  tag: string;
}

interface ResourceSection {
  title: string;
  description: string;
  items: ResourceItem[];
}

const TAG_COLORS: Record<string, string> = {
  Research:    'bg-violet-100 text-violet-700',
  Education:   'bg-emerald-100 text-emerald-700',
  Advocacy:    'bg-blue-100 text-blue-700',
  Medical:     'bg-rose-100 text-rose-700',
  Legal:       'bg-amber-100 text-amber-700',
  Guide:       'bg-secondary text-secondary-foreground',
  Locator:     'bg-teal-100 text-teal-700',
  Consultant:  'bg-indigo-100 text-indigo-700',
  Network:     'bg-orange-100 text-orange-700',
  CBD:         'bg-green-100 text-green-700',
  Grow:        'bg-lime-100 text-lime-700',
};

const RESOURCE_SECTIONS: ResourceSection[] = [
  {
    title: 'Research Databases',
    description: 'Peer-reviewed research on cannabinoids, terpenes, and the endocannabinoid system.',
    items: [
      {
        name: 'PubMed — Cannabis Research',
        description: 'The US National Library of Medicine\'s database of biomedical literature. Search for peer-reviewed studies on CBD, THC, cannabinoids, and specific conditions.',
        url: 'https://pubmed.ncbi.nlm.nih.gov/?term=cannabinoid',
        tag: 'Research',
      },
      {
        name: 'Project CBD',
        description: 'Non-profit dedicated to promoting and publicizing research into the medical uses of CBD and other components of the cannabis plant.',
        url: 'https://www.projectcbd.org',
        tag: 'Education',
      },
      {
        name: 'National Academies — Cannabis Report',
        description: 'Comprehensive review of the evidence on the health effects of cannabis and cannabis-derived products.',
        url: 'https://www.nationalacademies.org/our-work/the-health-effects-of-cannabis-and-cannabinoids',
        tag: 'Research',
      },
    ],
  },
  {
    title: 'Medical Marijuana Certification Clinics',
    description: 'Find licensed healthcare providers who can evaluate you for a medical marijuana card in your state.',
    items: [
      {
        name: 'Leafly — MMJ Doctor Finder',
        description: 'Searchable directory of medical marijuana doctors and clinics by state. Filter by telehealth availability, specialty, and accepted insurance.',
        url: 'https://www.leafly.com/medical-marijuana-doctors',
        tag: 'Locator',
      },
      {
        name: 'NuggMD — Medical Card Platform',
        description: 'Online platform connecting patients with licensed cannabis doctors for evaluations in legal MMJ states. Telehealth-first, fast appointments.',
        url: 'https://www.nuggmd.com',
        tag: 'Medical',
      },
      {
        name: 'Veriheal — MMJ Evaluations',
        description: 'Telehealth service for medical marijuana evaluations. Operates in 20+ states with licensed physicians and money-back guarantee if not approved.',
        url: 'https://veriheal.com',
        tag: 'Medical',
      },
      {
        name: 'Leafwell — Online MMJ Cards',
        description: 'Licensed medical cannabis evaluations via telehealth. Covers most legal medical states with board-certified physicians and fast turnaround.',
        url: 'https://leafwell.com',
        tag: 'Medical',
      },
      {
        name: 'American Cannabis Nurses Association',
        description: 'Directory of cannabis-specialized nurses and healthcare professionals. Good for finding practitioners who specialize in cannabis education and integration.',
        url: 'https://www.cannabisnurses.org',
        tag: 'Medical',
      },
    ],
  },
  {
    title: 'CBD & Hemp Product Partners',
    description: 'Non-dispensary CBD and hemp-derived product vendors with verified third-party testing. Accessible in all 50 states.',
    items: [
      {
        name: 'Charlotte\'s Web — CBD Products',
        description: 'One of the most established US CBD brands. Full-spectrum hemp extract products with comprehensive third-party COAs. Starting point for CBD wellness exploration.',
        url: 'https://www.charlottesweb.com',
        tag: 'CBD',
      },
      {
        name: 'Lazarus Naturals — Affordable CBD',
        description: 'High-potency, affordable full-spectrum CBD with batch-level COAs. Known for an assistance program offering 60% discount for veterans, low-income, and disabled individuals.',
        url: 'https://lazarusnaturals.com',
        tag: 'CBD',
      },
      {
        name: 'Cornbread Hemp — USDA Certified',
        description: 'USDA-certified organic full-spectrum CBD from Kentucky. Whole-flower extraction for maximum terpene preservation. Strong third-party testing documentation.',
        url: 'https://cornbreadhemp.com',
        tag: 'CBD',
      },
      {
        name: 'Social CBD — Broad Spectrum',
        description: 'Broad-spectrum (THC-free) CBD products ideal for users who cannot consume any THC due to testing requirements or personal preference.',
        url: 'https://socialcbd.com',
        tag: 'CBD',
      },
      {
        name: 'Find COA — Lab Result Database',
        description: 'Directory for verifying third-party lab results for CBD and cannabis products. Paste a product batch number to verify authenticity of a COA.',
        url: 'https://www.findcoa.com',
        tag: 'Guide',
      },
    ],
  },
  {
    title: 'Home Grow Consultants & Resources',
    description: 'Resources for patients and wellness users in legal home cultivation states. Educational information only — always verify your state\'s home grow laws.',
    items: [
      {
        name: 'NORML — Home Grow Laws by State',
        description: 'Up-to-date guide to which states allow home cultivation, plant limits per household, and any medical vs recreational distinctions.',
        url: 'https://norml.org/laws/',
        tag: 'Legal',
      },
      {
        name: 'Leafly — Growing Guides',
        description: 'Comprehensive beginner-to-advanced growing guides covering soil vs hydro, lighting, nutrients, harvest timing, and strain selection for different wellness goals.',
        url: 'https://www.leafly.com/learn/growing',
        tag: 'Grow',
      },
      {
        name: 'Royal Queen Seeds — Grow Academy',
        description: 'Free online cannabis growing education covering germination through curing. Particularly strong on terpene preservation techniques during harvest and drying.',
        url: 'https://www.royalqueenseeds.com/blog',
        tag: 'Grow',
      },
      {
        name: 'Subcool\'s The Dank — Organic Methods',
        description: 'Community-driven resource for organic and living soil cannabis cultivation. Focuses on full-spectrum plant medicine through regenerative growing practices.',
        url: 'https://www.icmag.com',
        tag: 'Grow',
      },
      {
        name: 'Home Growers Association',
        description: 'Advocacy and education organization for home cannabis cultivators. Tracks legislation, publishes grow guides, and provides resources on patient rights in cultivation states.',
        url: 'https://homegrowersassociation.org',
        tag: 'Consultant',
      },
    ],
  },
  {
    title: 'Plant Wellness Network',
    description: 'Communities, organizations, and practitioners at the intersection of plant medicine and holistic wellness.',
    items: [
      {
        name: 'Americans for Safe Access',
        description: 'Largest national member-based organization of patients, medical professionals and supporters working to ensure safe and legal access to cannabis for therapeutic use.',
        url: 'https://www.safeaccessnow.org',
        tag: 'Advocacy',
      },
      {
        name: 'Society of Cannabis Clinicians',
        description: 'Professional organization for physicians and other healthcare practitioners who incorporate cannabis into their clinical practice.',
        url: 'https://www.cannabisclinicians.org',
        tag: 'Medical',
      },
      {
        name: 'Realm of Caring Foundation',
        description: 'Non-profit focused on cannabinoid research, education, and patient navigation. Run by one of the founding CBD families. Free patient support line available.',
        url: 'https://therealmofcaring.org',
        tag: 'Network',
      },
      {
        name: 'Cannabis Nurses Network',
        description: 'Global network of nurses advancing cannabis science, education, and clinical practice. Offers patient referrals to cannabis-specialized nurses by specialty.',
        url: 'https://cannabisnursesnetwork.com',
        tag: 'Network',
      },
      {
        name: 'Multidisciplinary Association for Psychedelic Studies (MAPS)',
        description: 'Leading research organization for cannabinoids and plant medicines in clinical contexts. PTSD, anxiety, and end-of-life care research. Strong evidence base.',
        url: 'https://maps.org',
        tag: 'Research',
      },
      {
        name: 'Holistic Cannabis Academy',
        description: 'Training and certification for cannabis wellness coaches, nurses, and practitioners. Curriculum covers endocannabinoid system, clinical protocols, and patient education.',
        url: 'https://holisticcannabisacademy.com',
        tag: 'Education',
      },
    ],
  },
  {
    title: 'State Regulations & Legal Resources',
    description: 'Understanding the legal landscape in your state.',
    items: [
      {
        name: 'NORML State Laws',
        description: 'Up-to-date information on cannabis laws in every US state — medical, recreational, and CBD-specific regulations.',
        url: 'https://norml.org/laws/',
        tag: 'Legal',
      },
      {
        name: 'Medical Marijuana Program Finder',
        description: 'Find your state\'s official medical marijuana program, qualifying conditions, and application process.',
        url: 'https://www.mpp.org/states/',
        tag: 'Legal',
      },
    ],
  },
  {
    title: 'Understanding Lab Reports (COAs)',
    description: 'How to read and verify cannabis product certificates of analysis.',
    items: [
      {
        name: 'ACS Laboratory — COA Guide',
        description: 'Step-by-step guide to reading a cannabis COA, understanding potency panels, terpene profiles, and contaminant testing.',
        url: 'https://acslabcannabis.com/blog/tools/how-to-read-a-cannabis-certificate-of-analysis/',
        tag: 'Guide',
      },
      {
        name: 'SC Labs — Terpene Library',
        description: 'Comprehensive guide to terpenes found in cannabis, their aromas, and potential properties.',
        url: 'https://www.sclabs.com/terpene-library/',
        tag: 'Education',
      },
    ],
  },
];

export default function ResourcesPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <div className="space-y-1 pt-2">
        <h1 className="font-display text-2xl font-medium text-foreground">Resources</h1>
        <p className="text-sm text-muted-foreground">
          Curated resources for research, patient support, MMJ certification, CBD sourcing, home cultivation, and cannabis wellness communities.
        </p>
      </div>

      {/* Section jump links */}
      <div className="flex flex-wrap gap-2">
        {RESOURCE_SECTIONS.map((section) => (
          <a
            key={section.title}
            href={`#${section.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
            className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
          >
            {section.title}
          </a>
        ))}
      </div>

      {RESOURCE_SECTIONS.map((section) => (
        <section
          key={section.title}
          id={section.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}
          className="space-y-4 scroll-mt-6"
        >
          <div>
            <h2 className="text-sm font-semibold text-foreground">{section.title}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{section.description}</p>
          </div>
          <div className="space-y-3">
            {section.items.map((item) => (
              <a
                key={item.name}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-4 rounded-2xl border border-border bg-card p-4 hover:border-primary/40 hover:bg-secondary transition-colors card-shadow"
              >
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                      {item.name}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${TAG_COLORS[item.tag] ?? 'bg-muted text-muted-foreground'}`}>
                      {item.tag}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground shrink-0 mt-0.5 group-hover:text-primary transition-colors" aria-hidden="true">
                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
                  <path d="M15 3h6v6M10 14L21 3"/>
                </svg>
              </a>
            ))}
          </div>
        </section>
      ))}

      <p className="text-xs text-muted-foreground border-t border-border pt-4 pb-2">
        {DISCLAIMERS.standard} External links are provided for educational purposes only.
        PlantBridge does not endorse or guarantee the accuracy of third-party websites.
        Always verify medical marijuana eligibility requirements with a licensed healthcare provider in your state.
      </p>
    </div>
  );
}
