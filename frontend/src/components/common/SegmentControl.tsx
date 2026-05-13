export interface SegmentOption<T extends string = string> {
  value: T;
  label?: string;
  icon?: React.ReactNode;
  title?: string;
}

interface SegmentControlProps<T extends string = string> {
  options: readonly SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

export function SegmentControl<T extends string = string>({
  options,
  value,
  onChange,
}: SegmentControlProps<T>): React.ReactElement {
  return (
    <div
      className="p-0.5 rounded-full inline-flex gap-0.5 shrink-0"
      style={{ backgroundColor: 'rgba(28, 29, 26, 0.06)', padding: '0.2rem 0.2rem' }}
    >
      {options.map((option) => {
        const active = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            title={option.title}
            aria-label={option.title}
            className={`flex items-center justify-center gap-1 rounded-full cursor-pointer transition-all duration-150 ${
              active
                ? 'bg-lime text-dark-green font-semibold'
                : 'text-body-gray hover:text-near-black'
            } ${
              option.icon ? 'px-2.5' : 'px-4'
            }`}
            style={{
              height: '28px',
              fontSize: '11px',
              lineHeight: 1,
              whiteSpace: 'nowrap',
              fontWeight: active ? 600 : 500,
            }}
          >
            {option.icon && <span className="w-3.5 h-3.5 flex-shrink-0">{option.icon}</span>}
            {option.label && <span>{option.label}</span>}
          </button>
        );
      })}
    </div>
  );
}

export default SegmentControl;
