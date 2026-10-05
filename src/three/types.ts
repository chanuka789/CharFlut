export type PrintPassState = {
  /** 0 = blank garment, 1 = fully printed */
  progress: number;
  /** Scroll speed, drives the fabric ripple */
  velocity: number;
};
