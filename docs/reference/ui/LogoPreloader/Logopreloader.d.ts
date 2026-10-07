export interface LogopreloaderProps {
  /**
   * Logo
   */
  logo?: string;
  /**
   * Video Background — pass as `videoFile` not `videoBackground`.
   */
  videoFile?: string;
  /**
   * Background Image
   */
  backgroundImage?: string;
  /**
   * Background — pass as `backgroundColor` not `background`.
   * @default "#FFFFFF"
   */
  backgroundColor?: string;
  /**
   * Duration (s) — pass as `duration` not `duration(s)`.
   * Range: min: 0.5, max: 10, step: 0.1
   * @default 2
   */
  duration?: number;
  /**
   * Logo Size
   * Range: min: 24, max: 400
   * @default 80
   */
  logoSize?: number;
  /**
   * Logo In Easing
   * Options: "ease" | "ease-in" | "ease-out" | "ease-in-out" | "cubic-bezier(.7,.2,.2,1)" | "cubic-bezier(.25,.46,.45,.94)" | "cubic-bezier(.55,.085,.68,.53)" | "cubic-bezier(.25,.1,.25,1)" | "cubic-bezier(.175,.885,.32,1.275)" | "custom"
   * @default "cubic-bezier(.7,.2,.2,1)"
   */
  logoInEasing?: 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'cubic-bezier(.7,.2,.2,1)' | 'cubic-bezier(.25,.46,.45,.94)' | 'cubic-bezier(.55,.085,.68,.53)' | 'cubic-bezier(.25,.1,.25,1)' | 'cubic-bezier(.175,.885,.32,1.275)' | 'custom';
  /**
   * Custom Logo In Easing — pass as `logoInEasingCustom` not `customLogoInEasing`.
   * @default "cubic-bezier(.7,.2,.2,1)"
   */
  logoInEasingCustom?: string;
  /**
   * Logo Out Easing
   * Options: "ease" | "ease-in" | "ease-out" | "ease-in-out" | "cubic-bezier(.7,.2,.2,1)" | "cubic-bezier(.25,.46,.45,.94)" | "cubic-bezier(.55,.085,.68,.53)" | "cubic-bezier(.25,.1,.25,1)" | "cubic-bezier(.175,.885,.32,1.275)" | "custom"
   * @default "cubic-bezier(.7,.2,.2,1)"
   */
  logoOutEasing?: 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'cubic-bezier(.7,.2,.2,1)' | 'cubic-bezier(.25,.46,.45,.94)' | 'cubic-bezier(.55,.085,.68,.53)' | 'cubic-bezier(.25,.1,.25,1)' | 'cubic-bezier(.175,.885,.32,1.275)' | 'custom';
  /**
   * Custom Logo Out Easing — pass as `logoOutEasingCustom` not `customLogoOutEasing`.
   * @default "cubic-bezier(.7,.2,.2,1)"
   */
  logoOutEasingCustom?: string;
  /**
   * Background Fade Easing
   * Options: "ease" | "ease-in" | "ease-out" | "ease-in-out" | "cubic-bezier(.7,.2,.2,1)" | "cubic-bezier(.25,.46,.45,.94)" | "cubic-bezier(.55,.085,.68,.53)" | "cubic-bezier(.25,.1,.25,1)" | "cubic-bezier(.175,.885,.32,1.275)" | "custom"
   * @default "cubic-bezier(.7,.2,.2,1)"
   */
  backgroundFadeEasing?: 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'cubic-bezier(.7,.2,.2,1)' | 'cubic-bezier(.25,.46,.45,.94)' | 'cubic-bezier(.55,.085,.68,.53)' | 'cubic-bezier(.25,.1,.25,1)' | 'cubic-bezier(.175,.885,.32,1.275)' | 'custom';
  /**
   * Custom Background Fade Easing — pass as `backgroundFadeEasingCustom` not `customBackgroundFadeEasing`.
   * @default "cubic-bezier(.7,.2,.2,1)"
   */
  backgroundFadeEasingCustom?: string;
  /** Additional properties */
  [key: string]: unknown;
}
