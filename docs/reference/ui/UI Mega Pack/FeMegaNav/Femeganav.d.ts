export interface FemeganavProps {
  /**
   * Nav Links
   * @default [{"label":"Men"},{"label":"Women"},{"label":"Accessories"},{"label":"Brands"}]
   */
  navLinks?: unknown[];
  /**
   * Logo — pass as `logoText` not `logo`.
   * @default "FeCommerce"
   */
  logoText?: string;
  /**
   * Logo Image
   */
  logoImage?: string;
  /**
   * Bag — pass as `bagLabel` not `bag`.
   * @default "Bag (0)"
   */
  bagLabel?: string;
  /**
   * Left Panel
   * @default {"title":"Timeless Grace","buttonLabel":"Shop Now"}
   */
  leftPanel?: Record<string, unknown>;
  /**
   * Right Panel
   * @default {"title":"Modern Outerwear","buttonLabel":"Shop Now"}
   */
  rightPanel?: Record<string, unknown>;
  /**
   * Background — pass as `backgroundColor` not `background`.
   * @default "#1A1A1A"
   */
  backgroundColor?: string;
  /**
   * Text — pass as `textColor` not `text`.
   * @default "#FFFFFF"
   */
  textColor?: string;
  /**
   * Button BG — pass as `buttonColor` not `buttonBg`.
   * @default "#FFFFFF"
   */
  buttonColor?: string;
  /**
   * Button Text — pass as `buttonTextColor` not `buttonText`.
   * @default "#1A1A1A"
   */
  buttonTextColor?: string;
  /**
   * Title Size
   * Range: min: 12, max: 64, step: 1
   * @default 34
   */
  titleSize?: number;
  /**
   * Header Height
   * Range: min: 0, max: 160, step: 2
   * @default 64
   */
  headerHeight?: number;
  /**
   * Header Radius
   * Range: min: 0, max: 60, step: 1
   * @default 24
   */
  headerRadius?: number;
  /**
   * Header Inset
   * Range: min: 0, max: 80, step: 1
   * @default 24
   */
  headerInset?: number;
  /**
   * Menu Height
   * Range: min: 0, max: 1000, step: 10
   * @default 534
   */
  menuHeight?: number;
  /**
   * Dropdown Img W — pass as `featureWidth` not `dropdownImgW`.
   * Range: min: 100, max: 1200, step: 2
   * @default 890
   */
  featureWidth?: number;
  /**
   * Dropdown Img H — pass as `featureHeight` not `dropdownImgH`.
   * Range: min: 100, max: 1000, step: 2
   * @default 500
   */
  featureHeight?: number;
  /**
   * Dropdown Img Radius — pass as `featureRadius` not `dropdownImgRadius`.
   * Range: min: 0, max: 60, step: 1
   * @default 24
   */
  featureRadius?: number;
  /**
   * Menu Font Size
   * Range: min: 12, max: 80, step: 1
   * @default 34
   */
  menuFontSize?: number;
  /**
   * Dropdown Title Size — pass as `featureTitleSize` not `dropdownTitleSize`.
   * Range: min: 12, max: 80, step: 1
   * @default 34
   */
  featureTitleSize?: number;
  /**
   * Menu Item Gap
   * Range: min: 0, max: 80, step: 2
   * @default 30
   */
  menuItemGap?: number;
  /**
   * Logo Width
   * Range: min: 0, max: 600, step: 2
   * @default 126
   */
  logoWidth?: number;
  /**
   * Logo Height
   * Range: min: 0, max: 400, step: 2
   * @default 84
   */
  logoHeight?: number;
  /**
   * Hero Btn Width
   * Range: min: 0, max: 400, step: 1
   * @default 129
   */
  heroBtnWidth?: number;
  /**
   * Hero Btn Height
   * Range: min: 0, max: 120, step: 1
   * @default 45
   */
  heroBtnHeight?: number;
  /**
   * Hero Btn Radius
   * Range: min: 0, max: 40, step: 1
   * @default 6
   */
  heroBtnRadius?: number;
  /**
   * Nav Font Size
   * Range: min: 8, max: 40, step: 1
   * @default 16
   */
  navFontSize?: number;
  /**
   * Left Width — pass as `leftPanelWidth` not `leftWidth`.
   * Range: min: 0, max: 2000, step: 10
   * @default 0
   */
  leftPanelWidth?: number;
  /**
   * Left Height — pass as `leftPanelHeight` not `leftHeight`.
   * Range: min: 0, max: 2000, step: 10
   * @default 0
   */
  leftPanelHeight?: number;
  /**
   * Right Width — pass as `rightPanelWidth` not `rightWidth`.
   * Range: min: 0, max: 2000, step: 10
   * @default 0
   */
  rightPanelWidth?: number;
  /**
   * Right Height — pass as `rightPanelHeight` not `rightHeight`.
   * Range: min: 0, max: 2000, step: 10
   * @default 0
   */
  rightPanelHeight?: number;
  /** Additional properties */
  [key: string]: unknown;
}
