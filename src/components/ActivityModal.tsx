import { useState, useEffect } from 'react';
import './ActivityModal.css';

export interface ActivityFormValues {
  subject: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  priority?: string;
  assignedUser?: string;
  notes?: string;
  personName?: string;
  organization?: string;
  personId?: number;
  dealId?: number;
  dateTime?: string;
}

export default function ActivityModal({
  isOpen,
  onClose,
  onSave,
  managers,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (values: ActivityFormValues) => Promise<void> | void;
  managers?: string[];
}) {
  const [values, setValues] = useState<ActivityFormValues>({ subject: '' });
  const update = (k: keyof ActivityFormValues, v: string | number) => {
    if (k === 'personId') {
      setValues({ ...values, [k]: typeof v === 'number' ? v : (v === '' ? undefined : parseInt(v as string, 10)) });
    } else if (k === 'dealId') {
      setValues({ ...values, [k]: typeof v === 'number' ? v : (v === '' ? undefined : parseInt(v as string, 10)) });
    } else {
      setValues({ ...values, [k]: v as string });
    }
  };

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setValues({ subject: '' });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const formatDateForBackend = (dateStr?: string): string | undefined => {
    if (!dateStr) return undefined;
    // Convert yyyy-MM-dd to dd/MM/yyyy
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  const handleSave = async () => {
    const formattedValues = {
      ...values,
      date: formatDateForBackend(values.date),
      dateTime: values.date ? `${values.date}T${values.startTime || '00:00'}:00` : new Date().toISOString(),
    };
    await onSave(formattedValues);
    setValues({ subject: '' }); // Reset after save
  };

  return (
    <div className="am-overlay" onClick={onClose}>
      <div className="am-modal" onClick={(e) => e.stopPropagation()}>
        <div className="am-header">
          <h2>Schedule activity</h2>
          <button className="am-close" onClick={onClose}>×</button>
        </div>

        <div className="am-content">
          <input className="am-input" placeholder="Follow up" value={values.subject} onChange={(e) => update('subject', e.target.value)} />

          <div className="am-row">
            <input className="am-input" type="date" value={values.date || ''} onChange={(e) => update('date', e.target.value)} />
            <input className="am-input" type="time" value={values.startTime || ''} onChange={(e) => update('startTime', e.target.value)} />
            <input className="am-input" type="time" value={values.endTime || ''} onChange={(e) => update('endTime', e.target.value)} />
          </div>

          <div className="am-row">
            <select className="am-input" value={values.priority || ''} onChange={(e) => update('priority', e.target.value)}>
              <option value="">Priority</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
            {managers && managers.length > 0 ? (
              <select className="am-input" value={values.assignedUser || ''} onChange={(e) => update('assignedUser', e.target.value)}>
                <option value="">Assigned user</option>
                {managers.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            ) : (
              <input className="am-input" placeholder="Assigned user" value={values.assignedUser || ''} onChange={(e) => update('assignedUser', e.target.value)} />
            )}
          </div>

          <textarea className="am-textarea" placeholder="Notes (not visible to event guests)" value={values.notes || ''} onChange={(e) => update('notes', e.target.value)} />

          <div className="am-meta">
            <div><strong>Organization:</strong> <input className="am-input" style={{width:200}} value={values.organization || ''} onChange={(e) => update('organization', e.target.value)} placeholder="Organization name" /></div>
          </div>
        </div>

        <div className="am-footer">
          <button className="am-btn" onClick={onClose}>Cancel</button>
          <button className="am-btn primary" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  );
}

