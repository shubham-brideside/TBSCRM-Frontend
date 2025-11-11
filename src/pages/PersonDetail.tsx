import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { personsApi } from '../services/api';
import { clearAuthSession } from '../utils/authToken';
import type { PersonSummary } from '../types/person';
import './PersonDetail.css';

export default function PersonDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [summary, setSummary] = useState<PersonSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadPersonSummary(Number(id));
    }
  }, [id]);

  const loadPersonSummary = async (personId: number) => {
    setLoading(true);
    try {
      const data = await personsApi.getSummary(personId);
      setSummary(data);
    } catch (error) {
      console.error('Failed to load person summary:', error);
      if ((error as any)?.response?.status === 401) {
        clearAuthSession();
        navigate('/login', { replace: true });
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="person-detail-loading">Loading...</div>;
  }

  if (!summary) {
    return <div className="person-detail-error">Person not found</div>;
  }

  const { person, dealsCount } = summary;

  return (
    <div className="person-detail-container">
      <div className="person-detail-left">
        <div className="person-detail-header">
          <button onClick={() => navigate('/')} className="back-button">
            ← Back to List
          </button>
          <h1>{person.name || 'Undefined'}</h1>
        </div>

        <div className="person-detail-content">
          <div className="detail-section">
            <h2>Summary</h2>
            <div className="detail-item">
              <span className="detail-label">Full Name:</span>
              <span className="detail-value">{person.name || 'N/A'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Instagram ID:</span>
              <span className="detail-value">{person.instagramId || 'N/A'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Phone:</span>
              <span className="detail-value">{person.phone || 'N/A'}</span>
            </div>
          </div>

          <div className="detail-section">
            <h2>Lead Details</h2>
            <div className="detail-item">
              <span className="detail-label">Lead Date:</span>
              <span className="detail-value">{person.leadDate || 'N/A'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Label:</span>
              <span className="detail-value">{person.label || 'N/A'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Email:</span>
              <span className="detail-value">{person.email || 'N/A'}</span>
            </div>
          </div>

          <div className="detail-section">
            <h2>Business Details</h2>
            <div className="detail-item">
              <span className="detail-label">Category:</span>
              <span className="detail-value">{person.category || 'N/A'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Organization:</span>
              <span className="detail-value">{person.organizationName || person.organization || 'N/A'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Owner:</span>
              <span className="detail-value">{person.ownerDisplayName || person.ownerEmail || person.manager || 'N/A'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Source:</span>
              <span className="detail-value">{person.source || 'N/A'}</span>
            </div>
          </div>

          <div className="detail-section">
            <h2>Deals</h2>
            <div className="deals-count">
              <span className="deals-number">{dealsCount}</span>
              <span className="deals-label">Deal{dealsCount !== 1 ? 's' : ''} Connected</span>
            </div>
          </div>

          <div className="detail-section">
            <h2>Additional Info</h2>
            <div className="detail-item">
              <span className="detail-label">Created At:</span>
              <span className="detail-value">{person.createdAt || person.createdDate || 'N/A'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Updated At:</span>
              <span className="detail-value">{person.updatedAt || 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="person-detail-right">
        <div className="right-placeholder">
          <p>Right section content will be added here</p>
        </div>
      </div>
    </div>
  );
}

