import './FilterDropdown.css';

export interface FilterConditionLike {
  field: string;
  operator: string;
  value: string;
  id?: string;
}

export interface SavedFilter<T extends FilterConditionLike = FilterConditionLike> {
  name: string;
  conditions: T[];
  isSystem?: boolean;
}

interface FilterDropdownProps<T extends FilterConditionLike = FilterConditionLike> {
  savedFilters: Array<SavedFilter<T>>;
  activeFilterName: string | null;
  onSelectFilter: (filter: SavedFilter<T>) => void;
  onAddNewFilter: () => void;
  onRemoveFilter?: (filterName: string) => void;
}

export default function FilterDropdown<T extends FilterConditionLike = FilterConditionLike>(
  { savedFilters, activeFilterName, onSelectFilter, onAddNewFilter, onRemoveFilter }: FilterDropdownProps<T>,
) {
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

