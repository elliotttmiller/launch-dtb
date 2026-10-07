export interface Heroshoecta21Props {
  /**
   * Variant
   * Friendly names map to internal IDs:
   *   "Sky Blue" → XvtF263f1
   *   "Beige" → pU3JDp4XQ
   *   "Orange" → i8LqbqhM_
   */
  variant?: 'Sky Blue' | 'Beige' | 'Orange' | 'pU3JDp4XQ' | 'i8LqbqhM_' | 'XvtF263f1';
  /**
   * Phone Breakpoint — pass as `PRmy6BIEU` not `phoneBreakpoint`.
   * @default false
   */
  PRmy6BIEU?: boolean;
  onPRmy6BIEUChange?: string;
  /** Additional properties */
  [key: string]: unknown;
}
