export interface Nrl2gswudProps {
  /**
   * Variant
   * Friendly names map to internal IDs:
   *   "Open — Editorial" → BU646MiG6
   *   "Open — Marketplace" → pN_9iGami
   *   "Open — Pricing" → o9SepsxST
   *   "Open — Sellers" → V5TLZUmSX
   *   "Closed" → IA9qV9pnv
   *   "Open" → rIN1Kx5Og
   */
  variant?: 'Open — Editorial' | 'Open — Marketplace' | 'Open — Pricing' | 'Open — Sellers' | 'Closed' | 'Open' | 'rIN1Kx5Og' | 'IA9qV9pnv' | 'pN_9iGami' | 'V5TLZUmSX' | 'BU646MiG6' | 'o9SepsxST';
  /**
   * On Open — pass as `AshYbHZRg` not `onOpen`.
   */
  AshYbHZRg?: () => void;
  /**
   * On Close — pass as `NUPML5eQK` not `onClose`.
   */
  NUPML5eQK?: () => void;
  /**
   * Time — pass as `eCSiaI1ym` not `time`.
   * @default "10:37"
   */
  eCSiaI1ym?: string;
  oneCSiaI1ymChange?: string;
  /**
   * Show Backdrop — pass as `j1CDkm6Yi` not `showBackdrop`.
   * @default false
   */
  j1CDkm6Yi?: boolean;
  onj1CDkm6YiChange?: string;
  /**
   * Logo Name — pass as `TbpxG5_48` not `logoName`.
   * @default "ARKTER"
   */
  TbpxG5_48?: string;
  onTbpxG5_48Change?: string;
  /** Additional properties */
  [key: string]: unknown;
}
