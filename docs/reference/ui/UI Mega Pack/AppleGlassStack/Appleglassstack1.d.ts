export interface Appleglassstack1Props {
  /**
   * Items
   * @default [{"title":"Innovation","body":"Experience the future of design with liquid glass aesthetics"},{"title":"Performance","body":"Smooth animations and seamless interactions"},{"title":"Design","body":"Beautiful glassmorphism inspired by Apple's design language"}]
   */
  items?: unknown[];
  /**
   * Direction
   * Options: "vertical" | "horizontal"
   * @default "vertical"
   */
  direction?: 'vertical' | 'horizontal';
  /**
   * Gap
   * Range: min: 0, max: 100, step: 1
   * @default 20
   */
  gap?: number;
  /**
   * Container Padding
   * Range: min: 0, max: 100, step: 1
   * @default 20
   */
  containerPadding?: number;
  /**
   * Allow Overflow
   * @default true
   */
  allowOverflow?: boolean;
  /**
   * Glass Color — pass as `backgroundColor` not `glassColor`.
   * @default "rgba(255, 255, 255, 0.1)"
   */
  backgroundColor?: string;
  /**
   * Glass Opacity
   * Range: min: 0, max: 1, step: 0.05
   * @default 0.8
   */
  glassOpacity?: number;
  /**
   * Border Radius
   * Range: min: 0, max: 50, step: 1
   * @default 24
   */
  borderRadius?: number;
  /**
   * Padding
   * Range: min: 0, max: 100, step: 1
   * @default 40
   */
  padding?: number;
  /**
   * Title Font
   * @default {"fontSize":"32px","variant":"Semibold","letterSpacing":"-0.03em","lineHeight":"1em"}
   */
  titleFont?: string;
  /**
   * Body Font
   * @default {"fontSize":"15px","variant":"Medium","letterSpacing":"-0.01em","lineHeight":"1.3em"}
   */
  bodyFont?: string;
  /**
   * Title Color
   * @default "#FFFFFF"
   */
  titleColor?: string;
  /**
   * Body Color
   * @default "rgba(255, 255, 255, 0.8)"
   */
  bodyColor?: string;
  /**
   * Hover Lift
   * Range: min: 0, max: 30, step: 1
   * @default 8
   */
  hoverLift?: number;
  /**
   * Background Blur
   * Range: min: 0, max: 100, step: 1
   * @default 0
   */
  backgroundBlur?: number;
  /**
   * Stroke Size
   * Range: min: 0, max: 10, step: 0.5
   * @default 1
   */
  strokeSize?: number;
  /**
   * Stroke Color
   * @default "rgba(255, 255, 255, 0.18)"
   */
  strokeColor?: string;
  /**
   * Shine Color
   * @default "rgba(255, 255, 255, 0.25)"
   */
  shineColor?: string;
  /**
   * Box Width
   * Range: min: 100, max: 1000, step: 10
   * @default 300
   */
  boxWidth?: number;
  /**
   * Box Height
   * Range: min: 100, max: 800, step: 10
   * @default 200
   */
  boxHeight?: number;
  /** Additional properties */
  [key: string]: unknown;
}
