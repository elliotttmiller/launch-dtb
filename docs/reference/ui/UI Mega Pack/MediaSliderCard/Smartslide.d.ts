export interface SmartslideProps {
  /**
   * Thumbnail Image
   */
  thumbnailImage?: string;
  /**
   * Thumbnail Title
   * @default "Essential"
   */
  thumbnailTitle?: string;
  /**
   * Slides
   * @default [{"media":{"src":"https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg","alt":"Slide 1"},"mediaType":"image","title":"50 MP OIS Main Camera","description":"50 MP OIS Main Camera 1/1.3'' sensor, 24 mm focal length, ƒ/1.68 aperture, advanced image processing"}]
   */
  slides?: unknown[];
  /**
   * Autoplay
   * @default false
   */
  autoplay?: boolean;
  /**
   * Autoplay Interval
   * Range: min: 1000, max: 10000, step: 500
   * @default 3000
   */
  autoplayInterval?: number;
  /**
   * Cards BG — pass as `cardBackground` not `cardsBg`.
   * @default "rgba(255, 255, 255, 0.4)"
   */
  cardBackground?: string;
  /**
   * Text Color
   * @default "#000000"
   */
  textColor?: string;
  /**
   * Close Button — pass as `closeButtonColor` not `closeButton`.
   * @default "#000000"
   */
  closeButtonColor?: string;
  /**
   * Arrow Color
   * @default "#FFFFFF"
   */
  arrowColor?: string;
  /**
   * Dot Color
   * @default "rgba(255, 255, 255, 0.3)"
   */
  dotColor?: string;
  /**
   * Active Dot — pass as `activeDotColor` not `activeDot`.
   * @default "#FFFFFF"
   */
  activeDotColor?: string;
  /**
   * Card Radius — pass as `cardBorderRadius` not `cardRadius`.
   * Range: min: 0, max: 40, step: 1
   * @default 16
   */
  cardBorderRadius?: number;
  /**
   * Heading Font
   * @default {"fontSize":"22px","variant":"Semibold","letterSpacing":"-0.01em","lineHeight":"1.2em"}
   */
  headingFont?: string;
  /**
   * Body Font
   * @default {"fontSize":"15px","variant":"Medium","letterSpacing":"-0.01em","lineHeight":"1.3em"}
   */
  bodyFont?: string;
  /** Additional properties */
  [key: string]: unknown;
}
