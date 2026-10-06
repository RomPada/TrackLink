import { GROUP_COLOR_OPTIONS, normalizeGroupColor } from "@/lib/group-colors";
import { translations, type Language } from "@/lib/i18n";

type Props = {
  name: string;
  selectedColor?: string | null;
  language: Language;
  idPrefix: string;
};

export default function GroupColorPicker({ name, selectedColor, language, idPrefix }: Props) {
  const text = translations[language];
  const current = normalizeGroupColor(selectedColor);

  return (
    <div className="group-color-picker" role="radiogroup" aria-label={text.groups.backgroundColor}>
      {GROUP_COLOR_OPTIONS.map((option, index) => {
        const optionId = `${idPrefix}-${index}`;
        const label = language === "uk" ? option.labelUk : option.labelEn;
        return (
          <label className="group-color-option" htmlFor={optionId} key={option.value} title={label}>
            <input
              id={optionId}
              type="radio"
              name={name}
              value={option.value}
              defaultChecked={current === option.value}
            />
            <span className="group-color-swatch" style={{ backgroundColor: option.value }} aria-hidden="true" />
            <span className="sr-only">{label}</span>
          </label>
        );
      })}
    </div>
  );
}
