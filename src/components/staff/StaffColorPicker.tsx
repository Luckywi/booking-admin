'use client';

interface StaffColorPickerProps {
  color: string;
  onChange: (color: string) => void;
}

const availableColors = [
    '#2563EB', // Bleu royal profond
    '#7C3AED', // Violet profond
    '#059669', // Vert émeraude
    '#DC2626', // Rouge rubis
    '#D97706', // Orange ambré
    '#7E22CE', // Violet améthyste
    '#0891B2', // Bleu turquoise
    '#BE185D', // Rose framboise
  ];

export default function StaffColorPicker({ color, onChange }: StaffColorPickerProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-gray-700">Couleur des rendez-vous</span>
      <div className="flex gap-2">
        {availableColors.map((colorOption) => (
          <button
            key={colorOption}
            type="button"
            onClick={() => onChange(colorOption)}
            className={`w-6 h-6 rounded-full border-2 ${
              color === colorOption ? 'border-gray-900' : 'border-transparent'
            }`}
            style={{ backgroundColor: colorOption }}
            aria-label={`Sélectionner la couleur ${colorOption}`}
          />
        ))}
      </div>
    </div>
  );
}