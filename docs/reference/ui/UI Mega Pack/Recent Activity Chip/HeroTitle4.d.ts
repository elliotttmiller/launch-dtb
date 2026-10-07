export interface Herotitle4Props {
  /**
   * Variant
   * Friendly names map to internal IDs:
   *   "Sky Blue" → nr_UQipkw
   *   "Beige" → sme0MR6xw
   *   "Orange" → eUP3f9iaq
   */
  variant?: 'Sky Blue' | 'Beige' | 'Orange' | 'sme0MR6xw' | 'eUP3f9iaq' | 'nr_UQipkw';
  /**
   * Title — pass as `ZPdhXCb4b` not `title`.
   * @default "Air Flexs"
   */
  ZPdhXCb4b?: string;
  onZPdhXCb4bChange?: string;
  /** Additional properties */
  [key: string]: unknown;
}
