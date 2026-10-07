export interface GooglemapembedProps {
  /**
   * Address
   * @default "Los Angeles"
   */
  address?: string;
  /**
   * Zoom
   * Range: min: 1, max: 21, step: 1
   * @default 14
   */
  zoom?: number;
  /**
   * Map Type
   * Options: "roadmap" | "satellite"
   * @default "roadmap"
   */
  mapType?: 'roadmap' | 'satellite';
  /**
   * Grayscale
   * @default false
   */
  grayscale?: boolean;
  /**
   * Radius — pass as `borderRadius` not `radius`.
   * Range: min: 0, max: 100
   * @default 0
   */
  borderRadius?: number;
  /** Additional properties */
  [key: string]: unknown;
}
