'use client';

export interface RadioOption<T extends string> {
  value: T;
  label: string;
  description?: string;
}

interface RadioGroupProps<T extends string> {
  legend: string;
  name: string;
  options: RadioOption<T>[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
}

export default function RadioGroup<T extends string>({
  legend,
  name,
  options,
  value,
  onChange,
  disabled = false,
}: RadioGroupProps<T>) {
  return (
    <fieldset disabled={disabled}>
      <legend className="mb-1 text-sm font-medium text-neutral-700 dark:text-neutral-300">{legend}</legend>
      {options.map((option) => (
        <label key={option.value} className="flex min-h-11 cursor-pointer items-center gap-3 py-1">
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
            className="h-4 w-4 shrink-0 accent-blue-600"
          />
          <span>
            <span className="block font-medium">{option.label}</span>
            {option.description && (
              <span className="block text-sm text-neutral-500 dark:text-neutral-400">{option.description}</span>
            )}
          </span>
        </label>
      ))}
    </fieldset>
  );
}
