export interface ScrolleaseProps {
  /**
   * Intensity
   * Range: min: 0, max: 100, step: 1
   * @default 70
   */
  intensity?: number;
  /** Additional properties */
  [key: string]: unknown;
}
