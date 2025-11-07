import { useState } from 'react';
import type { Person } from '../types/person';
import './BulkEditModal.css';

interface BulkEditField {
  field: string;
  label: string;
  type: 'text' | 'select' | 'date';
  options?: string[];
}

interface FieldUpdate {
  action: 'keep' | 'edit' | 'clear';
  value?: string;
}

interface BulkEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: Record<string, string | null>) => void;
  fields: BulkEditField[];
  selectedPersons: Person[]; // rows being edited
}

export default function BulkEditModal({
  isOpen,
  onClose,
  onSave,
  fields,
  selectedPersons,
}: BulkEditModalProps) {
  const [fieldUpdates, setFieldUpdates] = useState<Record<string, FieldUpdate>>({});
  const [openDropdowns, setOpenDropdowns] = useState<Set<string>>(new Set());

  if (!isOpen) return null;

  const handleFieldChange = (field: string, action: 'keep' | 'edit' | 'clear', value?: string) => {
    setFieldUpdates(prev => ({
      ...prev,
      [field]: { action, value },
    }));
  };

  const getCommonValue = (field: string): string | undefined => {
    if (!selectedPersons || selectedPersons.length === 0) return undefined;
    const first = (selectedPersons[0] as any)[field] as string | undefined | null;
    for (let i = 1; i < selectedPersons.length; i++) {
      const val = (selectedPersons[i] as any)[field] as string | undefined | null;
      if ((val || '') !== (first || '')) return undefined; // not common
    }
    return first || undefined;
  };

  const toggleDropdown = (field: string) => {
    setOpenDropdowns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(field)) {
        newSet.delete(field);
      } else {
        newSet.add(field);
      }
      return newSet;
    });
  };

  const closeDropdown = (field: string) => {
    setOpenDropdowns(prev => {
      const newSet = new Set(prev);
      newSet.delete(field);
      return newSet;
    });
  };

  const handleSave = () => {
    const updates: Record<string, string | null> = {};
    Object.entries(fieldUpdates).forEach(([field, update]) => {
      if (update.action === 'clear') {
        updates[field] = null;
      } else if (update.action === 'edit' && update.value !== undefined && update.value !== '') {
        updates[field] = update.value;
      }
      // 'keep' action means no update needed
    });
    onSave(updates);
    setFieldUpdates({});
    setOpenDropdowns(new Set());
  };

  const getFieldUpdate = (field: string): FieldUpdate => {
    return fieldUpdates[field] || { action: 'keep' };
  };

  const handleClose = () => {
    setFieldUpdates({});
    setOpenDropdowns(new Set());
    onClose();
  };

  return (
    <div className="bulk-edit-overlay" onClick={handleClose}>
      <div className="bulk-edit-modal" onClick={e => e.stopPropagation()}>
        <div className="bulk-edit-header">
          <h2>Bulk edit</h2>
          <button className="close-button" onClick={handleClose}>×</button>
        </div>

        <div className="bulk-edit-content">
          {fields.map(field => {
            const update = getFieldUpdate(field.field);
            const isDropdownOpen = openDropdowns.has(field.field);

            return (
              <div key={field.field} className="bulk-edit-field">
                <label className="field-label">{field.label}</label>
                <div className="field-dropdown-container">
                  <div
                    className="field-dropdown-header"
                    onClick={() => toggleDropdown(field.field)}
                  >
                    <span>
                      {update.action === 'keep' && 'Keep current value'}
                      {update.action === 'edit' && `Edit: ${update.value || ''}`}
                      {update.action === 'clear' && 'Clear the field'}
                    </span>
                    <span className="dropdown-arrow">{isDropdownOpen ? '▲' : '▼'}</span>
                  </div>

                  {isDropdownOpen && (
                    <div className="field-dropdown-menu">
                      <div
                        className={`dropdown-option ${update.action === 'keep' ? 'active' : ''}`}
                        onClick={() => {
                          handleFieldChange(field.field, 'keep');
                          closeDropdown(field.field);
                        }}
                      >
                        Keep current value
                        {update.action === 'keep' && <span className="checkmark">✓</span>}
                      </div>

                      <div
                        className={`dropdown-option ${update.action === 'edit' ? 'active' : ''}`}
                        onClick={() => {
                          const initial = getCommonValue(field.field);
                          handleFieldChange(field.field, 'edit', initial ?? '');
                          // Keep dropdown open for editing
                        }}
                      >
                        Edit current value...
                        {update.action === 'edit' && <span className="checkmark">✓</span>}
                      </div>

                      <div
                        className={`dropdown-option ${update.action === 'clear' ? 'active' : ''}`}
                        onClick={() => {
                          handleFieldChange(field.field, 'clear');
                          closeDropdown(field.field);
                        }}
                      >
                        Clear the field
                        {update.action === 'clear' && <span className="checkmark">✓</span>}
                      </div>
                    </div>
                  )}

                  {update.action === 'edit' && (
                    <div className="field-edit-input">
                      {field.type === 'select' && field.options ? (
                        <select
                          value={update.value || ''}
                          onChange={e => handleFieldChange(field.field, 'edit', e.target.value)}
                          className="edit-select"
                        >
                          <option value="">Select value...</option>
                          {field.options.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : field.type === 'date' ? (
                        <input
                          type="date"
                          value={update.value ? (() => {
                            // Convert dd/MM/yyyy to yyyy-MM-dd for date input
                            const parts = update.value.split('/');
                            if (parts.length === 3) {
                              const [d, m, y] = parts;
                              return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
                            }
                            return update.value;
                          })() : ''}
                          onChange={e => {
                            // Convert yyyy-MM-dd to dd/MM/yyyy
                            const date = e.target.value;
                            if (date) {
                              const [y, m, d] = date.split('-');
                              handleFieldChange(field.field, 'edit', `${d}/${m}/${y}`);
                            } else {
                              handleFieldChange(field.field, 'edit', '');
                            }
                          }}
                          className="edit-input"
                        />
                      ) : (
                        <input
                          type="text"
                          value={update.value || ''}
                          onChange={e => handleFieldChange(field.field, 'edit', e.target.value)}
                          placeholder="Enter new value..."
                          className="edit-input"
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="bulk-edit-footer">
          <button className="cancel-button" onClick={handleClose}>Cancel</button>
          <button className="save-button" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  );
}

