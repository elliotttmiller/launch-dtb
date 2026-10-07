export interface Stickyscrollstory2Props {
  /**
   * Texts
   */
  texts?: unknown[];
  /**
   * Canvas Preview — pass as `activeIndex` not `canvasPreview`.
   * Range: min: 0, max: 4, step: 1
   * @default 0
   */
  activeIndex?: number;
  /**
   * Font
   * @default {"fontSize":"38px","variant":"Regular","letterSpacing":"-0.04em","lineHeight":"1.2em"}
   */
  font?: string;
  /**
   * Text Color
   * @default "#000000"
   */
  textColor?: string;
  /**
   * Background — pass as `backgroundColor` not `background`.
   * @default "#FFFFFF"
   */
  backgroundColor?: string;
  /**
   * Active Dot — pass as `activeDotColor` not `activeDot`.
   * @default "#707070"
   */
  activeDotColor?: string;
  /**
   * Inactive Dots — pass as `inactiveDotColor` not `inactiveDots`.
   * @default "#D9D9D9"
   */
  inactiveDotColor?: string;
  /**
   * Mobile Font Size
   * @default "24px"
   */
  mobileFontSize?: string;
  /** Additional properties */
  [key: string]: unknown;
}
