import { BodyMeasurementSite } from '@/lib/prisma-client';

// ============================================================
// Body measurements (issue #202) - pure display helpers
// ============================================================
// Tape-measure tracking, stored always in cm (BodyMeasurement.valueCm). These
// helpers keep the site ordering and human labels in one place so the card,
// the API and any future consumer agree.

// Centimeters per inch, for the imperial display path.
export const CM_PER_INCH = 2.54;

// The sites in the order they appear in the selector (top-down, left/right
// paired). The enum is the source of truth for validity; this is the source of
// truth for presentation order.
export const MEASUREMENT_SITES: BodyMeasurementSite[] = [
  'NECK',
  'SHOULDERS',
  'CHEST',
  'WAIST',
  'HIPS',
  'ARM_LEFT',
  'ARM_RIGHT',
  'FOREARM_LEFT',
  'FOREARM_RIGHT',
  'THIGH_LEFT',
  'THIGH_RIGHT',
  'CALF_LEFT',
  'CALF_RIGHT',
];

// Human-readable label per site, for the selector and the list rows.
const SITE_LABELS: Record<BodyMeasurementSite, string> = {
  WAIST: '腰围',
  HIPS: '臀围',
  CHEST: '胸围',
  SHOULDERS: '肩宽',
  NECK: '颈围',
  ARM_LEFT: '左臂',
  ARM_RIGHT: '右臂',
  FOREARM_LEFT: '左前臂',
  FOREARM_RIGHT: '右前臂',
  THIGH_LEFT: '左腿',
  THIGH_RIGHT: '右腿',
  CALF_LEFT: '左小腿',
  CALF_RIGHT: '右小腿',
};

export function measurementSiteLabel(site: BodyMeasurementSite): string {
  return SITE_LABELS[site];
}

// Converts a stored cm value to the display unit. The app's weight unit doubles
// as the length unit: KG -> metric (cm), LB -> imperial (inches), matching how
// bodyweight already keys off User.unit.
export function toDisplayLength(valueCm: number, metric: boolean): number {
  return metric ? valueCm : valueCm / CM_PER_INCH;
}

// Inverse of toDisplayLength: a value typed in the display unit back to cm for
// storage.
export function fromDisplayLength(value: number, metric: boolean): number {
  return metric ? value : value * CM_PER_INCH;
}

// Rounds a length to one decimal for display, trimming trailing zeros.
export function roundLength(value: number): number {
  return Math.round(value * 10) / 10;
}

// Formats a stored cm value for display: "82.5 cm" or "32.5 in".
export function formatLength(valueCm: number, metric: boolean): string {
  const shown = roundLength(toDisplayLength(valueCm, metric));
  return metric ? `${shown} 厘米` : `${shown} 英寸`;
}
