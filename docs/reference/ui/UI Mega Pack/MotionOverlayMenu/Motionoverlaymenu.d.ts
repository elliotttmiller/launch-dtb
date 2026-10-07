export interface MotionoverlaymenuProps {
  /**
   * Logo
   * Options: "mark" | "image" | "none"
   * @default "mark"
   */
  logo?: 'mark' | 'image' | 'none';
  /**
   * Logo Image
   */
  logoImage?: string;
  /**
   * Logo Size
   * Range: min: 14, max: 48, step: 1
   * @default 22
   */
  logoSize?: number;
  /**
   * Brand
   * @default "Meridian"
   */
  brand?: string;
  /**
   * Brand Link
   */
  brandLink?: string;
  /**
   * Brand New Tab
   * @default false
   */
  brandNewTab?: boolean;
  /**
   * Links
   * @default [{"label":"Work"},{"label":"Studio"},{"label":"Journal"},{"label":"Contact"}]
   */
  links?: unknown[];
  /**
   * Note
   * @default "© Made by Matt"
   */
  note?: string;
  /**
   * Note Link
   */
  noteLink?: string;
  /**
   * Note New Tab
   * @default false
   */
  noteNewTab?: boolean;
  /**
   * Secondary
   * @default [{"label":"Instagram"},{"label":"LinkedIn"},{"label":"X"}]
   */
  secondary?: unknown[];
  /**
   * Menu Label
   * @default "Menu"
   */
  menuLabel?: string;
  /**
   * Close Label
   * @default "Close"
   */
  closeLabel?: string;
  /**
   * Label — pass as `showLabel` not `label`.
   * @default true
   */
  showLabel?: boolean;
  /**
   * Numbers — pass as `showNumbers` not `numbers`.
   * @default true
   */
  showNumbers?: boolean;
  /**
   * Align
   * Options: "left" | "center"
   * @default "left"
   */
  align?: 'left' | 'center';
  /**
   * Reveal
   * Options: "circle" | "wipe" | "fade"
   * @default "circle"
   */
  reveal?: 'circle' | 'wipe' | 'fade';
  /**
   * Duration
   * Range: min: 0.2, max: 1.6, step: 0.05
   * @default 0.8
   */
  duration?: number;
  /**
   * Stagger
   * Range: min: 0, max: 200, step: 5
   * @default 70
   */
  stagger?: number;
  /**
   * Hover Shift
   * Range: min: 0, max: 48, step: 1
   * @default 16
   */
  hoverShift?: number;
  /**
   * Dim Others
   * @default true
   */
  dimOthers?: boolean;
  /**
   * Brand Font
   * @default {"fontSize":"15px","variant":"Medium","lineHeight":"1em","letterSpacing":"-0.01em"}
   */
  brandFont?: string;
  /**
   * Link Font
   * @default {"fontSize":"72px","variant":"Medium","lineHeight":"1.05em","letterSpacing":"-0.03em"}
   */
  linkFont?: string;
  /**
   * Header — pass as `headerColor` not `header`.
   * @default "#111111"
   */
  headerColor?: string;
  /**
   * Bar — pass as `barBackground` not `bar`.
   * @default "rgba(255, 255, 255, 0.62)"
   */
  barBackground?: string;
  /**
   * Bar Border
   * @default "rgba(0, 0, 0, 0.08)"
   */
  barBorder?: string;
  /**
   * Overlay — pass as `overlayBackground` not `overlay`.
   * @default "rgba(10, 10, 11, 0.94)"
   */
  overlayBackground?: string;
  /**
   * Overlay Text
   * @default "#FAFAFA"
   */
  overlayText?: string;
  /**
   * Overlay Bar
   * @default "rgba(255, 255, 255, 0.06)"
   */
  overlayBar?: string;
  /**
   * Accent
   * @default "#8A8A8E"
   */
  accent?: string;
  /**
   * Glow
   * @default "rgba(255, 255, 255, 0.08)"
   */
  glow?: string;
  /**
   * Bar Radius
   * @default "999px"
   */
  barRadius?: string;
  /**
   * Bar Shadow
   * @default true
   */
  barShadow?: boolean;
  /**
   * Bar Blur
   * Range: min: 0, max: 40, step: 1
   * @default 16
   */
  barBlur?: number;
  /**
   * Overlay Layer — pass as `overlayZIndex` not `overlayLayer`.
   * Range: min: 1, max: 2147483647, step: 1
   */
  overlayZIndex?: number;
  /**
   * Overlay Blur — pass as `blur` not `overlayBlur`.
   * Range: min: 0, max: 40, step: 1
   * @default 20
   */
  blur?: number;
  /**
   * Header Padding
   * @default "12px 12px 12px 24px"
   */
  headerPadding?: string;
  /**
   * Overlay Padding
   * @default "40px 32px 40px 32px"
   */
  overlayPadding?: string;
  /**
   * Open Height — pass as `canvasHeight` not `openHeight`.
   * Range: min: 480, max: 1600, step: 10
   * @default 800
   */
  canvasHeight?: number;
  /**
   * Open on Canvas
   * @default false
   */
  openOnCanvas?: boolean;
  /** Additional properties */
  [key: string]: unknown;
}
