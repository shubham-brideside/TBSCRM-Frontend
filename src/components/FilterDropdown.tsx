import type { PersonFilterCondition } from '../types/person';
import './FilterDropdown.css';

interface SavedFilter {
  name: string;
  conditions: PersonFilterCondition[];
  isSystem?: boolean;
}

interface FilterDropdownProps {
  savedFilters: SavedFilter[];
  activeFilterName: string | null;
  onSelectFilter: (filter: SavedFilter) => void;
  onAddNewFilter: () => void;
  onRemoveFilter?: (filterName: string) => void;
}

export default function FilterDropdown({
  savedFilters,
  activeFilterName,
  onSelectFilter,
  onAddNewFilter,
  onRemoveFilter,
}: FilterDropdownProps) {
  return (
    <div className="filter-dropdown">
      <div className="filter-dropdown-header">
        <span className="filter-icon">🔽</span>
        <span>Filters</span>
      </div>
      
      <div className="filter-dropdown-list">
        {savedFilters.map((filter, idx) => (
          <div
            key={idx}
            className={`filter-dropdown-item ${activeFilterName === filter.name ? 'active' : ''}`}
            onClick={() => onSelectFilter(filter)}
          >
            <span className="filter-padlock">🔒</span>
            <span className="filter-item-name">{filter.name}</span>
            {!filter.isSystem && onRemoveFilter && (
              <button
                className="filter-delete"
                title="Delete filter"
                onClick={(event) => {
                  event.stopPropagation();
                  onRemoveFilter(filter.name);
                }}
              >
                🗑️
              </button>
            )}
          </div>
        ))}
        
        <div className="filter-dropdown-divider"></div>
        
        <div className="filter-dropdown-item add-filter-item" onClick={onAddNewFilter}>
          <span className="add-filter-icon">+</span>
          <span>Add new filter</span>
        </div>
      </div>
    </div>
  );
}

