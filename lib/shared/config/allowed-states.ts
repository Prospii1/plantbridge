export const ALLOWED_STATES = [
  'AZ', 'CA', 'CO', 'CT', 'DE', 'IL', 'MA', 'MD', 'ME', 'MI',
  'MN', 'MO', 'NJ', 'NM', 'NV', 'NY', 'OH', 'OR', 'VT', 'WA',
] as const;

export type AllowedState = typeof ALLOWED_STATES[number];

export function isAllowedState(state: string): state is AllowedState {
  return (ALLOWED_STATES as readonly string[]).includes(state);
}
