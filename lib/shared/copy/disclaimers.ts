// All user-facing disclaimer text lives here.
// Every care plan view, recommendation card, and outcome form must include
// the relevant disclaimer. Do not inline these strings in components.
//
// LEGAL REVIEW REQUIRED before public launch.

export const DISCLAIMERS = {
  standard:
    'This information is for educational purposes only and does not constitute medical advice, diagnosis, or treatment. Consult a qualified healthcare provider before making any changes to your health or wellness routine.',

  medication:
    'Talk to your healthcare provider before making any changes to your medications or health routine, especially if you are currently taking prescription medications.',

  carePlanFooter:
    'This care plan is an educational resource based on your wellness goals. It is not a medical diagnosis or treatment plan. PlantBridge is an educational platform, not a healthcare provider.',

  outcomeLog:
    'Outcome data you log is used to personalize your educational guidance. It is not shared with healthcare providers and does not constitute a medical record.',

  ageAndState:
    'PlantBridge is available only in jurisdictions where adult-use cannabis is legal and to users who are 21 years of age or older.',
} as const;

export type DisclaimerKey = keyof typeof DISCLAIMERS;
