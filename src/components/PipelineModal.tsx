import { FormEvent, useEffect, useMemo, useState } from 'react';
import type { Pipeline, PipelineRequest } from '../types/pipeline';
import './PipelineModal.css';

interface PipelineModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  pipeline?: Pipeline | null;
  onClose: () => void;
  onSubmit: (payload: PipelineRequest) => Promise<void>;
}

const INITIAL_FORM: PipelineRequest = {
  name: '',
  category: '',
  team: '',
  organization: '',
  description: '',
  active: true,
  dealProbabilityEnabled: false,
  displayOrder: undefined,
  ownerUserId: undefined,
};

export default function PipelineModal({
  isOpen,
  mode,
  pipeline,
  onClose,
  onSubmit,
}: PipelineModalProps) {
  const [form, setForm] = useState<PipelineRequest>(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const title = useMemo(
    () => (mode === 'create' ? 'Create pipeline' : `Edit pipeline`),
    [mode],
  );

  useEffect(() => {
    if (!isOpen) {
      setForm(INITIAL_FORM);
      setSaving(false);
      setError(null);
      return;
    }

    if (pipeline && mode === 'edit') {
      setForm({
        name: pipeline.name ?? '',
        category: pipeline.category ?? '',
        team: pipeline.team ?? '',
        organization: pipeline.organization ?? '',
        description: pipeline.description ?? '',
        active: pipeline.active ?? true,
        dealProbabilityEnabled: pipeline.dealProbabilityEnabled ?? false,
        displayOrder: pipeline.displayOrder ?? undefined,
        ownerUserId: pipeline.ownerUserId ?? undefined,
      });
    } else {
      setForm({
        ...INITIAL_FORM,
        active: true,
        dealProbabilityEnabled: false,
      });
    }
  }, [isOpen, pipeline, mode]);

  if (!isOpen) return null;

  const handleChange = <K extends keyof PipelineRequest>(key: K, value: PipelineRequest[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleNumberChange = (key: keyof PipelineRequest) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value.trim();
    if (raw === '') {
      handleChange(key, undefined as PipelineRequest[typeof key]);
      return;
    }
    const parsed = Number(raw);
    if (!Number.isNaN(parsed)) {
      handleChange(key, parsed as PipelineRequest[typeof key]);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setError('Pipeline name is required.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSubmit({
        ...form,
        name: form.name.trim(),
        category: form.category?.trim() || undefined,
        team: form.team?.trim() || undefined,
        organization: form.organization?.trim() || undefined,
        description: form.description?.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Failed to save pipeline.';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pipeline-modal-overlay" onClick={onClose}>
      <div className="pipeline-modal" onClick={(event) => event.stopPropagation()}>
        <header className="pipeline-modal-header">
          <h2>{title}</h2>
          <button className="pipeline-modal-close" onClick={onClose} aria-label="Close pipeline modal">×</button>
        </header>
        <p className="pipeline-modal-subtitle">
          {mode === 'create'
            ? 'Set up a pipeline to organize deals across stages.'
            : 'Update pipeline details, ownership, and visibility.'}
        </p>

        <form className="pipeline-modal-form" onSubmit={handleSubmit}>
          <label className="pipeline-modal-label">
            Pipeline name
            <input
              type="text"
              value={form.name}
              onChange={(event) => handleChange('name', event.target.value)}
              placeholder="Enterprise deals"
              className="pipeline-modal-input"
              required
            />
          </label>

          <div className="pipeline-modal-grid">
            <label className="pipeline-modal-label">
              Category
              <input
                type="text"
                value={form.category ?? ''}
                onChange={(event) => handleChange('category', event.target.value)}
                placeholder="e.g. Weddings"
                className="pipeline-modal-input"
              />
            </label>
            <label className="pipeline-modal-label">
              Team
              <input
                type="text"
                value={form.team ?? ''}
                onChange={(event) => handleChange('team', event.target.value)}
                placeholder="Sales East"
                className="pipeline-modal-input"
              />
            </label>
          </div>

  <label className="pipeline-modal-label">
            Organization
            <input
              type="text"
              value={form.organization ?? ''}
              onChange={(event) => handleChange('organization', event.target.value)}
              placeholder="Brideside"
              className="pipeline-modal-input"
            />
          </label>

          <label className="pipeline-modal-label">
            Description
            <textarea
              value={form.description ?? ''}
              onChange={(event) => handleChange('description', event.target.value)}
              placeholder="Describe the purpose of this pipeline…"
              className="pipeline-modal-textarea"
              rows={3}
            />
          </label>

          <div className="pipeline-modal-grid">
            <label className="pipeline-modal-label">
              Display order
              <input
                type="number"
                value={form.displayOrder ?? ''}
                onChange={handleNumberChange('displayOrder')}
                placeholder="Defaults to last"
                className="pipeline-modal-input"
                min={0}
              />
            </label>
            <label className="pipeline-modal-label">
              Owner user ID
              <input
                type="number"
                value={form.ownerUserId ?? ''}
                onChange={handleNumberChange('ownerUserId')}
                placeholder="User ID"
                className="pipeline-modal-input"
                min={0}
              />
            </label>
          </div>

          <div className="pipeline-modal-checkbox-group">
            <label className="pipeline-modal-checkbox">
              <input
                type="checkbox"
                checked={form.active ?? true}
                onChange={(event) => handleChange('active', event.target.checked)}
              />
              <span>Pipeline is active</span>
            </label>
            <label className="pipeline-modal-checkbox">
              <input
                type="checkbox"
                checked={form.dealProbabilityEnabled ?? false}
                onChange={(event) => handleChange('dealProbabilityEnabled', event.target.checked)}
              />
              <span>Enable deal probability</span>
            </label>
          </div>

          {error && <div className="pipeline-modal-error">{error}</div>}

          <div className="pipeline-modal-actions">
            <button type="button" className="pipeline-modal-cancel" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="pipeline-modal-submit" disabled={saving}>
              {saving ? 'Saving…' : mode === 'create' ? 'Create pipeline' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


