export type GroupColorOption = {
  value: string;
  labelEn: string;
};

export const GROUP_COLOR_OPTIONS: GroupColorOption[] = [
  { value: '#e8eef7', labelEn: 'Dusty blue' },
  { value: '#ede8f7', labelEn: 'Soft lavender' },
  { value: '#f6e9e3', labelEn: 'Warm sand' },
  { value: '#e6f2eb', labelEn: 'Sage' },
  { value: '#f7e8ee', labelEn: 'Dusty rose' },
  { value: '#f4efd9', labelEn: 'Muted lemon' },
  { value: '#e6eff3', labelEn: 'Mist teal' },
  { value: '#eee7df', labelEn: 'Clay beige' },
];

export const DEFAULT_GROUP_COLOR = GROUP_COLOR_OPTIONS[0].value;

export function normalizeGroupColor(value: string | null | undefined) {
  const normalized = String(value ?? '').trim().toLowerCase();
  return GROUP_COLOR_OPTIONS.find((item) => item.value.toLowerCase() == normalized)?.value ?? DEFAULT_GROUP_COLOR;
}
