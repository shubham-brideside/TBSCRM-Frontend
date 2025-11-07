import './FilterChip.css';

interface FilterChipProps {
  label: string;
  onRemove: () => void;
  onClick?: () => void;
}

export default function FilterChip({ label, onRemove, onClick }: FilterChipProps) {
  return (
    <div className="filter-chip" onClick={onClick}>
      <span className="filter-icon">🔽</span>
      <span className="filter-label">{label}</span>
      <span className="filter-separator">|</span>
      <button className="filter-remove" onClick={(e) => { e.stopPropagation(); onRemove(); }}>
        ×
      </button>
    </div>
  );
}

