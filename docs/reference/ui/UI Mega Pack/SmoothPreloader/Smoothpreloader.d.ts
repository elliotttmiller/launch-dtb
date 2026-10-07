export interface SmoothpreloaderProps {
  /**
   * Logo
   */
  logo?: string;
  /**
   * Logo Size
   * Range: min: 50, max: 500
   * @default 200
   */
  logoSize?: number;
  /**
   * Background — pass as `backgroundColor` not `background`.
   * @default "#FFFFFF"
   */
  backgroundColor?: string;
  /**
   * Counter Color
   * @default "#000000"
   */
  counterColor?: string;
  /**
   * Counter Font
   * @default {"fontSize":"80px","lineHeight":"1em","letterSpacing":"-0.02em"}
   */
  counterFont?: string;
  /**
   * Duration
   * Range: min: 1, max: 10
   * @default 3
   */
  duration?: number;
  /**
   * Exit Effect
   * Options: "fade" | "slideUp" | "slideDown"
   * @default "fade"
   */
  exitEffect?: 'fade' | 'slideUp' | 'slideDown';
  onComplete?: () => void;
  /** Additional properties */
  [key: string]: unknown;
}
