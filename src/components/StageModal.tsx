import { FormEvent, useEffect, useMemo, useState } from 'react';
import type { Stage } from '../types/pipeline';
import './StageModal.css';

interface StageModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  pipelineName: string;
  stage?: Stage | null;
  onClose: () => void;
  onSubmit: (payload: {
    name: string;
    order?: number;
    active: boolean;
    probability?: number | null;
    rottenFlag?: boolean;
    rottenDays?: number;
  }) => Promise<void>;
}

export default function StageModal({
  isOpen,
  mode,
  pipelineName,
  stage,
  onClose,
  onSubmit,
}: StageModalProps) {
  const [name, setName] = useState('');
  const [order, setOrder] = useState<string>('');
  const [active, setActive] = useState(true);
  const [probability, setProbability] = useState<string>('');
  const [rottenFlag, setRottenFlag] = useState(false);
  const [rottenDays, setRottenDays] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const title = useMemo(
    () => (mode === 'create' ? 'Add Stage' : 'Edit Stage'),
    [mode],
  );

  useEffect(() => {
    if (!isOpen) {
      setName('');
      setOrder('');
      setActive(true);
      setProbability('');
      setRottenFlag(false);
      setRottenDays('');
      setSaving(false);
      setError(null);
      return;
    }

    if (stage && mode === 'edit') {
      setName(stage.name ?? '');
      setOrder(Number.isFinite(stage.order) ? String(stage.order) : '');
      setActive(stage.active ?? true);
      setProbability(
        stage.probability !== undefined && stage.probability !== null
          ? String(stage.probability)
          : '',
      );
      setRottenFlag(Boolean(stage.rottenFlag));
      setRottenDays(
        stage.rottenDays !== undefined && stage.rottenDays !== null
          ? String(stage.rottenDays)
          : '',
      );
    } else {
      setName('');
      setOrder('');
      setActive(true);
      setProbability('');
      setRottenFlag(false);
      setRottenDays('');
    }
    setError(null);
  }, [isOpen, stage, mode]);

  if (!isOpen) return null;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) {
      setError('Stage name is required.');
      return;
    }
    const parsedOrder = order.trim() === '' ? undefined : Number(order);
    if (parsedOrder !== undefined && Number.isNaN(parsedOrder)) {
      setError('Order must be a valid number.');
      return;
    }
    const parsedProbability = probability.trim() === '' ? undefined : Number(probability);
    if (parsedProbability !== undefined) {
      if (Number.isNaN(parsedProbability) || parsedProbability < 0 || parsedProbability > 100) {
        setError('Probability must be between 0 and 100.');
        return;
      }
    }
    const parsedRottenDays = rottenDays.trim() === '' ? undefined : Number(rottenDays);
    if (parsedRottenDays !== undefined && (Number.isNaN(parsedRottenDays) || parsedRottenDays < 0)) {
      setError('Rotten days must be zero or positive.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await onSubmit({
        name: name.trim(),
        order: parsedOrder,
        active,
        probability: parsedProbability,
        rottenFlag,
        rottenDays: parsedRottenDays,
      });
      onClose();
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Failed to save stage.';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="stage-modal-overlay" onClick={onClose}>
      <div className="stage-modal" onClick={(event) => event.stopPropagation()}>
        <div className="stage-modal-header">
          <h2>{title}</h2>
          <button className="stage-modal-close" onClick={onClose} aria-label="Close stage modal">×</button>
        </div>
        <p className="stage-modal-subtitle">
          {mode === 'create'
            ? `Create a new stage in the “${pipelineName}” pipeline.`
            : `Update stage details for “${stage?.name ?? ''}” in the “${pipelineName}” pipeline.`}
        </p>

        <form className="stage-modal-form" onSubmit={handleSubmit}>
          <label className="stage-modal-label">
            Stage name
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Follow Up"
              className="stage-modal-input"
              required
            />
          </label>

          <label className="stage-modal-label">
            Order (optional)
            <input
              type="number"
              value={order}
              onChange={(event) => setOrder(event.target.value)}
              placeholder="Leave empty to append"
              className="stage-modal-input"
              min={0}
              step={1}
            />
          </label>

          <label className="stage-modal-label">
            Probability %
            <input
              type="number"
              value={probability}
              onChange={(event) => setProbability(event.target.value)}
              placeholder="0 - 100"
              className="stage-modal-input"
              min={0}
              max={100}
            />
          </label>

          <label className="stage-modal-checkbox">
            <input
              type="checkbox"
              checked={active}
              onChange={(event) => setActive(event.target.checked)}
            />
            <span>Stage is active</span>
          </label>

          <div className="stage-modal-rotten">
            <label className="stage-modal-checkbox">
              <input
                type="checkbox"
                checked={rottenFlag}
                onChange={(event) => setRottenFlag(event.target.checked)}
              />
              <span>Enable rotten tracking</span>
            </label>
            {rottenFlag && (
              <label className="stage-modal-label">
                Rotten after (days)
                <input
                  type="number"
                  value={rottenDays}
                  onChange={(event) => setRottenDays(event.target.value)}
                  className="stage-modal-input"
                  min={0}
                />
              </label>
            )}
          </div>

          {error && <div className="stage-modal-error">{error}</div>}

          <div className="stage-modal-actions">
            <button type="button" className="stage-modal-cancel" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="stage-modal-submit" disabled={saving}>
              {saving ? 'Saving…' : mode === 'create' ? 'Create stage' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


