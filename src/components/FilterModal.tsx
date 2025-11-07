import { useState } from 'react';
import './FilterModal.css';

export interface FilterCondition {
  id: string;
  field: string;
  operator: string;
  value: string;
}

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (conditions: FilterCondition[], filterName: string) => void;
  availableFields: Array<{ value: string; label: string; type: 'text' | 'select' | 'date' }>;
  fieldOptions?: Record<string, string[]>;
}

const OPERATORS = {
  text: [
    { value: 'equals', label: 'is' },
    { value: 'contains', label: 'contains' },
    { value: 'startsWith', label: 'starts with' },
  ],
  select: [
    { value: 'equals', label: 'is' },
    { value: 'notEquals', label: 'is not' },
  ],
  date: [
    { value: 'equals', label: 'is' },
    { value: 'after', label: 'is after' },
    { value: 'before', label: 'is before' },
    { value: 'between', label: 'is between' },
  ],
};

export default function FilterModal({
  isOpen,
  onClose,
  onSave,
  availableFields,
  fieldOptions = {},
}: FilterModalProps) {
  const [conditions, setConditions] = useState<FilterCondition[]>([
    { id: '1', field: '', operator: 'equals', value: '' },
  ]);
  const [filterName, setFilterName] = useState('My Filter');

  if (!isOpen) return null;

  const handleAddCondition = () => {
    setConditions([
      ...conditions,
      { id: Date.now().toString(), field: '', operator: 'equals', value: '' },
    ]);
  };

  const handleRemoveCondition = (id: string) => {
    setConditions(conditions.filter(c => c.id !== id));
  };

  const handleConditionChange = (id: string, key: keyof FilterCondition, value: string) => {
    setConditions(
      conditions.map(c => {
        if (c.id === id) {
          const updated = { ...c, [key]: value };
          // Reset operator and value when field changes
          if (key === 'field') {
            const field = availableFields.find(f => f.value === value);
            const defaultOp = OPERATORS[field?.type || 'text'][0].value;
            return { ...updated, operator: defaultOp, value: '' };
          }
          return updated;
        }
        return c;
      })
    );
  };

  const handleSave = () => {
    if (conditions.every(c => c.field && c.value)) {
      onSave(conditions, filterName);
      setConditions([{ id: '1', field: '', operator: 'equals', value: '' }]);
      setFilterName('My Filter');
      onClose();
    }
  };

  const getFieldType = (fieldValue: string) => {
    const field = availableFields.find(f => f.value === fieldValue);
    return field?.type || 'text';
  };

  const getOperators = (fieldValue: string) => {
    const type = getFieldType(fieldValue);
    return OPERATORS[type] || OPERATORS.text;
  };

  const renderValueInput = (condition: FilterCondition) => {
    const field = availableFields.find(f => f.value === condition.field);
    const type = field?.type || 'text';

    if (type === 'select' && fieldOptions[condition.field]) {
      return (
        <select
          value={condition.value}
          onChange={e => handleConditionChange(condition.id, 'value', e.target.value)}
          className="filter-value-input"
        >
          <option value="">Select value...</option>
          {fieldOptions[condition.field].map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      );
    }

    if (type === 'date') {
      return (
        <input
          type="date"
          value={condition.value}
          onChange={e => handleConditionChange(condition.id, 'value', e.target.value)}
          className="filter-value-input"
        />
      );
    }

    return (
      <input
        type="text"
        value={condition.value}
        onChange={e => handleConditionChange(condition.id, 'value', e.target.value)}
        placeholder="Enter value..."
        className="filter-value-input"
      />
    );
  };

  return (
    <div className="filter-modal-overlay" onClick={onClose}>
      <div className="filter-modal" onClick={e => e.stopPropagation()}>
        <div className="filter-modal-header">
          <h2>Create new filter</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="filter-modal-content">
          <div className="filter-section">
            <div className="filter-section-header">
              <h3>Match ALL of these conditions</h3>
              <span className="info-icon" title="All conditions must be met">ℹ️</span>
            </div>

            {conditions.map((condition, index) => (
              <div key={condition.id} className="condition-row">
                <span className="condition-label">{index === 0 ? 'WHERE' : 'AND'}</span>
                
                <select
                  value={condition.field}
                  onChange={e => handleConditionChange(condition.id, 'field', e.target.value)}
                  className="filter-field-select"
                >
                  <option value="">Select field...</option>
                  {availableFields.map(field => (
                    <option key={field.value} value={field.value}>
                      {field.label}
                    </option>
                  ))}
                </select>

                {condition.field && (
                  <>
                    <select
                      value={condition.operator}
                      onChange={e => handleConditionChange(condition.id, 'operator', e.target.value)}
                      className="filter-operator-select"
                    >
                      {getOperators(condition.field).map(op => (
                        <option key={op.value} value={op.value}>
                          {op.label}
                        </option>
                      ))}
                    </select>

                    {renderValueInput(condition)}
                  </>
                )}

                <button
                  className="remove-condition-button"
                  onClick={() => handleRemoveCondition(condition.id)}
                >
                  🗑️
                </button>
              </div>
            ))}

            <button className="add-condition-button" onClick={handleAddCondition}>
              + Add condition
            </button>
          </div>

          <div className="filter-settings">
            <div className="filter-setting-row">
              <label>Filter name:</label>
              <input
                type="text"
                value={filterName}
                onChange={e => setFilterName(e.target.value)}
                className="filter-name-input"
                placeholder="Enter filter name..."
              />
            </div>
          </div>
        </div>

        <div className="filter-modal-footer">
          <button className="preview-button">Preview</button>
          <button className="save-button" onClick={handleSave}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

