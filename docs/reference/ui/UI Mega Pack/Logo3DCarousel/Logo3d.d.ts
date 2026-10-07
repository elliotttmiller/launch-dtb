export interface Logo3dProps {
  /**
   * Logos
   */
  logos?: unknown[];
  /**
   * Enable Drag
   * @default true
   */
  enableDrag?: boolean;
  /**
   * Max Scale (Center) — pass as `maxScale` not `maxScale(center)`.
   * Range: min: 1, max: 3, step: 0.1
   * @default 2
   */
  maxScale?: number;
  /**
   * Min Scale (Edges) — pass as `minScale` not `minScale(edges)`.
   * Range: min: 0.1, max: 1, step: 0.1
   * @default 0.1
   */
  minScale?: number;
  /**
   * Max Height — pass as `itemHeight` not `maxHeight`.
   * Range: min: 20, max: 600, step: 1
   * @default 32
   */
  itemHeight?: number;
  /**
   * Gap
   * Range: min: 0, max: 200, step: 1
   * @default 64
   */
  gap?: number;
  /**
   * Speed
   * Range: min: 0, max: 96, step: 1
   * @default 32
   */
  speed?: number;
  /**
   * Direction
   * Options: "left" | "right"
   * @default "left"
   */
  direction?: 'left' | 'right';
  /**
   * Max Blur
   * Range: min: 0, max: 8, step: 0.5
   * @default 4
   */
  maxBlur?: number;
  /**
   * Blur Max (%) — pass as `blurEnd` not `blurMax(%)`.
   * Range: min: 0, max: 100, step: 1
   * @default 64
   */
  blurEnd?: number;
  /**
   * Pause on Hover
   * @default true
   */
  pauseOnHover?: boolean;
  /**
   * Hover/Drag Easing — pass as `easingResponsiveness` not `hover/dragEasing`.
   * Range: min: 1, max: 50, step: 1
   * @default 4
   */
  easingResponsiveness?: number;
  /** Additional properties */
  [key: string]: unknown;
}
