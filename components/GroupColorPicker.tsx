import { GROUP_COLOR_OPTIONS, normalizeGroupColor } from "@/lib/group-colors";
import { type Language } from "@/lib/i18n";

type Props = {
  selectedColor?: string | null;
  language: Language;
};

export default function GroupColorPicker({ selectedColor, language }: Props) {
  const current = normalizeGroupColor(selectedColor);

  return (
    <div className="group-color-picker" role="group">
      {GROUP_COLOR_OPTIONS.map((option) => {
        const label = language === "uk" ? option.labelUk : option.labelEn;
        const selected = current === option.value;
        return (
          <button
            type="submit"
            name="backgroundColor"
            value={option.value}
            className={`group-color-option${selected ? " group-color-option-selected" : ""}`}
            title={label}
            aria-label={label}
            aria-pressed={selected}
            key={option.value}
          >
            <span className="group-color-swatch" style={{ backgroundColor: option.value }} aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}
