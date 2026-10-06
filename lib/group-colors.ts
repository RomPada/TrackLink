export type GroupColorOption = {
  value: string;
  labelEn: string;
  labelUk: string;
};

export const GROUP_COLOR_OPTIONS: GroupColorOption[] = [
  { value: '#e8eef7', labelEn: 'Dusty blue', labelUk: 'Пильний блакитний' },
  { value: '#ede8f7', labelEn: 'Soft lavender', labelUk: 'М’яка лаванда' },
  { value: '#f6e9e3', labelEn: 'Warm sand', labelUk: 'Теплий пісочний' },
  { value: '#e6f2eb', labelEn: 'Sage', labelUk: 'Шавлія' },
  { value: '#f7e8ee', labelEn: 'Dusty rose', labelUk: 'Пильна троянда' },
  { value: '#f4efd9', labelEn: 'Muted lemon', labelUk: 'Приглушений лимон' },
  { value: '#e6eff3', labelEn: 'Mist teal', labelUk: 'Туманна бірюза' },
  { value: '#eee7df', labelEn: 'Clay beige', labelUk: 'Глиняний беж' },
];

export const DEFAULT_GROUP_COLOR = GROUP_COLOR_OPTIONS[0].value;

export function normalizeGroupColor(value: string | null | undefined) {
  const normalized = String(value ?? '').trim().toLowerCase();
  return GROUP_COLOR_OPTIONS.find((item) => item.value.toLowerCase() == normalized)?.value ?? DEFAULT_GROUP_COLOR;
}
