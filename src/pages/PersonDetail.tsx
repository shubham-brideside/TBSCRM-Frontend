import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { personsApi } from '../services/api';
import { activitiesApi } from '../services/activities';
import { clearAuthSession } from '../utils/authToken';
import type { Person, FilterMeta } from '../types/person';
import ActivityModal, { type ActivityFormValues } from '../components/ActivityModal';
import './PersonDetail.css';

export default function PersonDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [person, setPerson] = useState<Person | null>(null);
  const [filterMeta, setFilterMeta] = useState<FilterMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<Partial<Person>>({});
  const [expandedSections, setExpandedSections] = useState({
    summary: true,
    details: true,
    organization: true,
    deals: false,
  });
  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [showDetailsMenu, setShowDetailsMenu] = useState(false);
  const [showCustomizeFields, setShowCustomizeFields] = useState(false);
  const [showAddCustomField, setShowAddCustomField] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [callData, setCallData] = useState({
    callType: '',
    date: '',
    time: '',
    assignedUser: '',
    scheduledBy: '',
    notes: '',
  });
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [meetingData, setMeetingData] = useState({
    subject: '',
    date: '',
    startTime: '',
    endTime: '',
    assignedUser: '',
    scheduledBy: '',
    notes: '',
  });
  type ActivityItem = {
    id: number;
    type: 'activity' | 'call' | 'meeting';
    subject: string;
    date: string;
    time?: string;
    assignedUser?: string;
    status: 'open' | 'done';
  };
  const [items, setItems] = useState<ActivityItem[]>([]);
  const addItem = (item: ActivityItem) => setItems(prev => [item, ...prev]);
  const markDone = (id: number) => setItems(prev => prev.map(i => i.id === id ? { ...i, status: 'done' } : i));
  const isOverdue = (item: ActivityItem): boolean => {
    if (!item.date) return false;
    const today = new Date();
    const due = new Date(item.date);
    today.setHours(0,0,0,0);
    due.setHours(0,0,0,0);
    return due.getTime() < today.getTime();
  };
  const [newFieldData, setNewFieldData] = useState({
    name: '',
    fieldType: '',
    personAddView: false,
    leadDealAddView: false,
    markAsRequired: false,
    markAsImportant: false,
  });
  const [activeTab, setActiveTab] = useState<'activity' | 'notes' | 'meeting' | 'call' | 'email' | 'sendQuote' | 'contract' | 'worklinks'>('activity');
  const menuRef = useRef<HTMLDivElement>(null);
  const [showOnlyFilledDetails, setShowOnlyFilledDetails] = useState(false);
  const [showOnlyFilledOrganization, setShowOnlyFilledOrganization] = useState(false);

  useEffect(() => {
    if (id) {
      loadPerson(Number(id));
      loadFilterMeta();
    }
  }, [id]);

  const loadPerson = async (personId: number) => {
    setLoading(true);
    try {
      const data = await personsApi.get(personId);
      setPerson(data);
      setFormData({
        id: data.id,
        name: data.name || '',
        instagramId: data.instagramId || '',
        email: (data as any).email || '',
        phone: data.phone || '',
        weddingDate: data.weddingDate || '',
        venue: data.venue || '',
        organization: data.organization || '',
        manager: data.manager || '',
        category: data.category || '',
        source: data.source || '',
        eventType: data.eventType || '',
        createdDate: data.createdDate || '',
      });
    } catch (error) {
      console.error('Failed to load person:', error);
      if ((error as any)?.response?.status === 401) {
        clearAuthSession();
        navigate('/login', { replace: true });
      }
    } finally {
      setLoading(false);
    }
  };

  const loadFilterMeta = async () => {
    try {
      const meta = await personsApi.getFilters();
      setFilterMeta(meta);
    } catch (error) {
      console.error('Failed to load filter metadata:', error);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowDetailsMenu(false);
      }
    };

    if (showDetailsMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDetailsMenu]);

  if (loading) {
    return <div className="person-detail-loading">Loading...</div>;
  }

  if (!person) {
    return <div className="person-detail-error">Person not found</div>;
  }

  const handleInputChange = (field: keyof Person, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const formatDateForInput = (ddMMyyyy?: string): string => {
    if (!ddMMyyyy) return '';
    const parts = ddMMyyyy.split('/');
    if (parts.length !== 3) return '';
    const [d, m, y] = parts;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  };

  const formatDateFromInput = (yyyyMMdd: string): string => {
    const [y, m, d] = yyyyMMdd.split('-');
    return `${d}/${m}/${y}`;
  };

  const formatDateReadable = (ddMMyyyy?: string): string => {
    if (!ddMMyyyy) return '';
    const parts = ddMMyyyy.split('/');
    if (parts.length !== 3) return '';
    const [d, m, y] = parts;
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const monthIndex = parseInt(m) - 1;
    const day = parseInt(d);
    const year = parseInt(y);
    return `${monthNames[monthIndex]} ${day}, ${year}`;
  };

  const handleStartEdit = (field: string, currentValue: string) => {
    setEditingField(field);
    if (field === 'weddingDate' || field === 'createdDate') {
      setTempValue(formatDateForInput(currentValue) || '');
    } else {
      setTempValue(currentValue || '');
    }
  };

  const handleSaveEdit = (field: keyof Person) => {
    if (field === 'weddingDate' || field === 'createdDate') {
      if (tempValue) {
        handleInputChange(field, formatDateFromInput(tempValue));
      }
    } else if (field === 'name') {
      const currentName = formData.name || '';
      if (editingField === 'firstName') {
        const lastName = currentName.split(' ').slice(1).join(' ') || '';
        handleInputChange('name', `${tempValue} ${lastName}`.trim());
      } else if (editingField === 'lastName') {
        const firstName = currentName.split(' ')[0] || '';
        handleInputChange('name', `${firstName} ${tempValue}`.trim());
      } else {
        handleInputChange(field, tempValue);
      }
    } else {
      handleInputChange(field, tempValue);
    }
    setEditingField(null);
    setTempValue('');
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    setTempValue('');
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.name.trim()) {
      alert('Please enter a name for the person.');
      return;
    }
    
    setSaving(true);
    try {
      const personData = { ...formData };
      if (!personData.createdDate) {
        const today = new Date();
        const dd = String(today.getDate()).padStart(2, '0');
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const yyyy = today.getFullYear();
        personData.createdDate = `${dd}/${mm}/${yyyy}`;
      }
      
      if (formData.id != null) {
        await personsApi.update(formData.id, personData);
        // Reload person data
        await loadPerson(formData.id);
        alert('Person updated successfully!');
      }
    } catch (error: any) {
      console.error('Failed to update person:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to update person. Please try again.';
      alert(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const openWhatsApp = (action: 'quote' | 'contract' | 'worklinks') => {
    const rawPhone = (formData.phone || '').replace(/[^0-9]/g, '');
    const base = rawPhone ? `https://wa.me/${rawPhone}` : 'https://wa.me/';
    const personName = formData.name ? ` ${formData.name}` : '';
    const actionLabel = action === 'quote' ? 'a quote' : action === 'contract' ? 'the contract' : 'work links';
    const text = encodeURIComponent(`Hi${personName}, I'll share ${actionLabel} here.`);
    const url = `${base}?text=${text}`;
    window.open(url, '_blank');
  };

  const openGmail = () => {
    const to = (formData as any).email || '';
    const subject = '';
    const body = '';
    const url = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="add-person-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#fff', zIndex: 1 }}>
      <div className="add-person-modal" style={{ width: '100%', height: '100%', maxWidth: 'none', maxHeight: 'none', borderRadius: 0, margin: 0, padding: '20px' }}>
        <div className="add-person-header">
          <div className="person-header-left">
            <span className="person-icon">👤</span>
            <input
              type="text"
              placeholder="Full Name"
              value={formData.name || ''}
              onChange={e => handleInputChange('name', e.target.value)}
              className="person-name-input"
              required
            />
          </div>
          <div className="person-header-right">
            <button className="deal-button">
              <span className="deal-plus">+</span>
              <span className="deal-text">Deal</span>
              <span className="deal-separator">|</span>
              <span className="deal-arrow">▼</span>
          </button>
            <button className="close-button" onClick={() => navigate('/')}>×</button>
          </div>
        </div>

        <div className="add-person-content">
          <div className="add-person-left">
            {/* Summary Section */}
          <div className="detail-section">
              <div className="section-header" onClick={() => toggleSection('summary')}>
                <h3>Summary</h3>
                <span className="section-toggle">{expandedSections.summary ? '▲' : '▼'}</span>
              </div>
              {expandedSections.summary && (
                <div className="section-content">
                  <div className="summary-item">
                    <span className="summary-icon">🏷️</span>
                    <span className="summary-action">Add labels</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-icon">📧</span>
                    <span className="summary-action">Add email</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-icon">📞</span>
                    <input
                      type="text"
                      placeholder="Phone"
                      value={formData.phone || ''}
                      onChange={e => handleInputChange('phone', e.target.value)}
                      className="summary-input"
                    />
                  </div>
                  <div className="summary-item">
                    <span className="summary-icon">📷</span>
                    <input
                      type="text"
                      placeholder="Instagram ID"
                      value={formData.instagramId || ''}
                      onChange={e => handleInputChange('instagramId', e.target.value)}
                      className="summary-input"
                    />
                  </div>
                  <div className="summary-item">
                    <span className="summary-icon">🏢</span>
                    {formData.organization ? (
                      <span>{formData.organization}</span>
                    ) : (
                      <span className="summary-action" onClick={() => toggleSection('organization')}>
                        Add organization
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Wedding Details Section */}
            <div className="detail-section">
              <div className="section-header" onClick={() => toggleSection('details')}>
                <span className="section-toggle">{expandedSections.details ? '▲' : '▼'}</span>
                <h3>Wedding Details</h3>
                <div className="section-header-actions" onClick={e => e.stopPropagation()}>
                  <span
                    className="filter-badge"
                    title={showOnlyFilledDetails ? 'Show all fields' : 'Show only filled fields'}
                    onClick={() => setShowOnlyFilledDetails(prev => !prev)}
                  ></span>
                  <span className="section-icon edit-black" title="Edit">✏️</span>
                  <div className="section-menu-container" ref={menuRef}>
                    <span 
                      className="section-icon" 
                      title="More options"
                      onClick={() => setShowDetailsMenu(!showDetailsMenu)}
                    >
                      ⋯
                    </span>
                    {showDetailsMenu && (
                      <div className="section-menu-dropdown">
                        <div className="menu-item" onClick={() => setShowDetailsMenu(false)}>
                          Hide section
                        </div>
                        <div 
                          className="menu-item active"
                          onClick={() => {
                            setShowDetailsMenu(false);
                            setShowCustomizeFields(true);
                          }}
                        >
                          Customize fields
                        </div>
                        <div className="menu-item" onClick={() => setShowDetailsMenu(false)}>
                          Delete section
                        </div>
                        <div className="menu-item" onClick={() => setShowDetailsMenu(false)}>
                          Move up
                        </div>
                        <div className="menu-item" onClick={() => setShowDetailsMenu(false)}>
                          Move down
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {expandedSections.details && (
                <div className="section-content">
                  {(!showOnlyFilledDetails || (formData.name && formData.name.split(' ')[0])) && (
                  <div className="detail-field-row">
                    <label>First name</label>
                    {editingField === 'firstName' ? (
                      <input
                        type="text"
                        value={tempValue}
                        onChange={e => setTempValue(e.target.value)}
                        onBlur={() => handleSaveEdit('name')}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleSaveEdit('name');
                          if (e.key === 'Escape') handleCancelEdit();
                        }}
                        className="detail-value-input"
                        autoFocus
                      />
                    ) : (
                      <div 
                        className="detail-value-container"
                        onClick={() => handleStartEdit('firstName', formData.name?.split(' ')[0] || '')}
                      >
                        <span className="detail-value">
                          {formData.name?.split(' ')[0] || ''}
                        </span>
                      </div>
                    )}
                  </div>
                  )}
                  {(!showOnlyFilledDetails || !!formData.weddingDate) && (
                  <div className="detail-field-row">
                    <label>Wedding Date only</label>
                    {editingField === 'weddingDate' ? (
                      <div className="detail-date-editing">
                        <input
                          type="date"
                          value={tempValue}
                          onChange={e => setTempValue(e.target.value)}
                          onBlur={() => handleSaveEdit('weddingDate')}
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleSaveEdit('weddingDate');
                            if (e.key === 'Escape') handleCancelEdit();
                          }}
                          className="detail-value-input date-input"
                          autoFocus
                        />
                        <span className="edit-icon-inline">✏️</span>
                      </div>
                    ) : (
                      <div 
                        className="detail-value-container"
                        onClick={() => handleStartEdit('weddingDate', formData.weddingDate || '')}
                      >
                        <span className="detail-value date-value">
                          {formData.weddingDate ? formatDateReadable(formData.weddingDate) : ''}
                        </span>
                        <span className="edit-icon-inline">✏️</span>
                      </div>
                    )}
                  </div>
                  )}
                  {(!showOnlyFilledDetails || !!formData.venue) && (
                  <div className="detail-field-row">
                    <label>Wedding Venue</label>
                    {editingField === 'venue' ? (
                      <input
                        type="text"
                        value={tempValue}
                        onChange={e => setTempValue(e.target.value)}
                        onBlur={() => handleSaveEdit('venue')}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleSaveEdit('venue');
                          if (e.key === 'Escape') handleCancelEdit();
                        }}
                        className="detail-value-input"
                        autoFocus
                      />
                    ) : (
                      <div 
                        className="detail-value-container"
                        onClick={() => handleStartEdit('venue', formData.venue || '')}
                      >
                        <span className="detail-value">
                          {formData.venue || ''}
                        </span>
                      </div>
                    )}
                  </div>
                  )}
                  {(!showOnlyFilledDetails || (formData.name && formData.name.split(' ').slice(1).join(' '))) && (
                  <div className="detail-field-row">
                    <label>Last name</label>
                    {editingField === 'lastName' ? (
                      <input
                        type="text"
                        value={tempValue}
                        onChange={e => setTempValue(e.target.value)}
                        onBlur={() => handleSaveEdit('name')}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleSaveEdit('name');
                          if (e.key === 'Escape') handleCancelEdit();
                        }}
                        className="detail-value-input"
                        autoFocus
                      />
                    ) : (
                      <div 
                        className="detail-value-container"
                        onClick={() => handleStartEdit('lastName', formData.name?.split(' ').slice(1).join(' ') || '')}
                      >
                        <span className="detail-value">
                          {formData.name?.split(' ').slice(1).join(' ') || ''}
                        </span>
                      </div>
                    )}
                  </div>
                  )}
                  {(!showOnlyFilledDetails || !!formData.eventType) && (
                  <div className="detail-field-row">
                    <label>Wedding Itinerary</label>
                    {editingField === 'eventType' ? (
                      <input
                        type="text"
                        value={tempValue}
                        onChange={e => setTempValue(e.target.value)}
                        onBlur={() => handleSaveEdit('eventType')}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleSaveEdit('eventType');
                          if (e.key === 'Escape') handleCancelEdit();
                        }}
                        className="detail-value-input"
                        autoFocus
                      />
                    ) : (
                      <div 
                        className="detail-value-container"
                        onClick={() => handleStartEdit('eventType', formData.eventType || '')}
                      >
                        <span className="detail-value">
                          {formData.eventType || ''}
                        </span>
                      </div>
                    )}
                  </div>
                  )}
                  {(!showOnlyFilledDetails || !!formData.instagramId) && (
                  <div className="detail-field-row">
                    <label>Instagram ID</label>
                    {editingField === 'instagramId' ? (
                      <input
                        type="text"
                        value={tempValue}
                        onChange={e => setTempValue(e.target.value)}
                        onBlur={() => handleSaveEdit('instagramId')}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleSaveEdit('instagramId');
                          if (e.key === 'Escape') handleCancelEdit();
                        }}
                        className="detail-value-input"
                        placeholder="@username"
                        autoFocus
                      />
                    ) : (
                      <div 
                        className="detail-value-container"
                        onClick={() => handleStartEdit('instagramId', formData.instagramId || '')}
                      >
                        <span className="detail-value">
                          {formData.instagramId || ''}
                        </span>
                      </div>
                    )}
                  </div>
                  )}
                  {(!showOnlyFilledDetails || !!formData.source) && (
                  <div className="detail-field-row">
                    <label>Person Source</label>
                    {editingField === 'source' ? (
                      <select
                        value={tempValue}
                        onChange={e => setTempValue(e.target.value)}
                        onBlur={() => handleSaveEdit('source')}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleSaveEdit('source');
                          if (e.key === 'Escape') handleCancelEdit();
                        }}
                        className="detail-value-input"
                        autoFocus
                      >
                        <option value="">Select source…</option>
                        <option value="Reference">Reference</option>
                        <option value="TBS">TBS</option>
                        <option value="Instagram">Instagram</option>
                        <option value="Direct">Direct</option>
                        <option value="Divert">Divert</option>
                        <option value="Whatsapp">Whatsapp</option>
                        <option value="Mail">Mail</option>
                        <option value="Website">Website</option>
                      </select>
                    ) : (
                      <div 
                        className="detail-value-container"
                        onClick={() => handleStartEdit('source', formData.source || '')}
                      >
                        <span className="detail-value source-tag">
                          {formData.source || ''}
                        </span>
                      </div>
                    )}
                  </div>
                  )}
                  {(!showOnlyFilledDetails || !!formData.createdDate) && (
                  <div className="detail-field-row">
                    <label>Lead Date</label>
                    {editingField === 'createdDate' ? (
                      <input
                        type="date"
                        value={tempValue}
                        onChange={e => setTempValue(e.target.value)}
                        onBlur={() => handleSaveEdit('createdDate')}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleSaveEdit('createdDate');
                          if (e.key === 'Escape') handleCancelEdit();
                        }}
                        className="detail-value-input"
                        autoFocus
                      />
                    ) : (
                      <div 
                        className="detail-value-container"
                        onClick={() => handleStartEdit('createdDate', formData.createdDate || '')}
                      >
                        <span className="detail-value">
                          {formData.createdDate ? formatDateReadable(formData.createdDate) : ''}
                        </span>
                      </div>
                    )}
                  </div>
                  )}
                </div>
              )}
            </div>

            {/* Organization Section */}
            <div className="detail-section">
              <div className="section-header" onClick={() => toggleSection('organization')}>
                <span className="section-toggle">{expandedSections.organization ? '▲' : '▼'}</span>
                <h3>Organization</h3>
                <div className="section-header-actions" onClick={e => e.stopPropagation()}>
                  <span
                    className="filter-badge"
                    title={showOnlyFilledOrganization ? 'Show all fields' : 'Show only filled fields'}
                    onClick={() => setShowOnlyFilledOrganization(prev => !prev)}
                  ></span>
                  <span className="section-icon edit-black" title="Edit">✏️</span>
                  <span className="section-icon" title="More">⋯</span>
            </div>
          </div>
              {expandedSections.organization && (
                <div className="section-content">
                  {editingField === 'organization' ? (
                    filterMeta ? (
                      <select
                        value={tempValue}
                        onChange={e => setTempValue(e.target.value)}
                        onBlur={() => handleSaveEdit('organization')}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleSaveEdit('organization');
                          if (e.key === 'Escape') handleCancelEdit();
                        }}
                        className="organization-select-input"
                        autoFocus
                      >
                        <option value="">Select organization...</option>
                        {filterMeta.organizations.map(org => (
                          <option key={org} value={org}>{org}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={tempValue}
                        onChange={e => setTempValue(e.target.value)}
                        onBlur={() => handleSaveEdit('organization')}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleSaveEdit('organization');
                          if (e.key === 'Escape') handleCancelEdit();
                        }}
                        className="organization-input-edit"
                        autoFocus
                      />
                    )
                  ) : (
                    <div 
                      className="organization-name-container"
                      onClick={() => handleStartEdit('organization', formData.organization || '')}
                    >
                      <span className="organization-icon">🏢</span>
                      <span className="organization-name">
                        {formData.organization || ''}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Deals Section */}
            <div className="detail-section">
              <div className="section-header" onClick={() => toggleSection('deals')}>
                <h3>Deals</h3>
                <span className="section-toggle">{expandedSections.deals ? '▲' : '▼'}</span>
              </div>
              {expandedSections.deals && (
                <div className="section-content">
                  <p className="deals-info">Open deals (0)</p>
                  <div className="deals-progress">
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: '100%' }}></div>
                    </div>
                    <div className="deals-stats">
                      <span>Won: 0 (0%) ₹0</span>
                      <span>Lost: 0 (0%) ₹0</span>
                    </div>
                  </div>
                  <button className="see-all-deals">See all deals</button>
                </div>
              )}
            </div>
          </div>

          <div className="add-person-right">
            <div className="activity-tabs">
              <button className={`tab ${activeTab === 'activity' ? 'active' : ''}`} onClick={() => setActiveTab('activity')}>Activity</button>
              <button className={`tab ${activeTab === 'notes' ? 'active' : ''}`} onClick={() => setActiveTab('notes')}>Notes</button>
              <button className={`tab ${activeTab === 'meeting' ? 'active' : ''}`} onClick={() => { setActiveTab('meeting'); setShowMeetingModal(true); }}>Meeting scheduler</button>
              <button className={`tab ${activeTab === 'call' ? 'active' : ''}`} onClick={() => { setActiveTab('call'); setShowCallModal(true); }}>Call</button>
              <button className={`tab ${activeTab === 'email' ? 'active' : ''}`} onClick={openGmail}>Email</button>
              <button className={`tab ${activeTab === 'sendQuote' ? 'active' : ''}`} onClick={() => openWhatsApp('quote')}>Send quote</button>
              <button className={`tab ${activeTab === 'contract' ? 'active' : ''}`} onClick={() => openWhatsApp('contract')}>Send Contract</button>
              <button className={`tab ${activeTab === 'worklinks' ? 'active' : ''}`} onClick={() => openWhatsApp('worklinks')}>Share Worklinks</button>
            </div>
            <div className="activity-content">
              <p className="activity-placeholder" onClick={() => setShowActivityModal(true)} style={{ cursor: 'pointer' }}>Click here to add an activity...</p>
            </div>
            <div className="focus-section">
              <div className="focus-header">
                <h3>Focus ✓</h3>
                <label className="toggle-label">
                  <input type="checkbox" />
                  Expand all items
                </label>
            </div>
              {items.filter(i => i.status === 'open').length === 0 ? (
                <p className="focus-placeholder">
                  No focus items yet. Scheduled activities, pinned notes, email drafts and scheduled emails will appear here.
                </p>
              ) : (
                <div className="focus-list">
                  {items.filter(i => i.status === 'open').map(item => (
                    <div key={item.id} className={`focus-item ${isOverdue(item) ? 'overdue' : ''}`}>
                      <span className="focus-item-type">{item.type === 'call' ? 'Call' : item.type === 'meeting' ? 'Meeting' : 'Activity'}</span>
                      <span className="focus-item-subject">{item.subject}</span>
                      <span className="focus-item-when">{item.date}{item.time ? ` ${item.time}` : ''}</span>
                      <button className="mark-done" onClick={() => markDone(item.id)}>Mark done</button>
            </div>
                  ))}
          </div>
              )}
              <button className="schedule-activity" onClick={() => setShowActivityModal(true)}>+ Schedule an activity</button>
            </div>
            <div className="focus-section">
              <div className="focus-header">
                <h3>History</h3>
              </div>
              {items.filter(i => i.status === 'done').length === 0 ? (
                <p className="focus-placeholder">No history yet.</p>
              ) : (
                <div className="focus-list">
                  {items.filter(i => i.status === 'done').map(item => (
                    <div key={item.id} className="focus-item done">
                      <span className="focus-item-type">{item.type === 'call' ? 'Call' : item.type === 'meeting' ? 'Meeting' : 'Activity'}</span>
                      <span className="focus-item-subject">{item.subject}</span>
                      <span className="focus-item-when">{item.date}{item.time ? ` ${item.time}` : ''}</span>
          </div>
                  ))}
            </div>
              )}
          </div>
        </div>
      </div>

        <div className="add-person-footer">
          <button type="button" className="cancel-button" onClick={() => navigate('/')}>Cancel</button>
          <button type="button" className="save-button" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Call Modal */}
      {showCallModal && (
        <div className="customize-fields-overlay" onClick={() => setShowCallModal(false)}>
          <div className="add-person-field-modal" onClick={e => e.stopPropagation()}>
            <div className="add-person-field-header">
              <h2>Log / schedule call</h2>
              <button className="close-button" onClick={() => setShowCallModal(false)}>×</button>
            </div>
            <div className="add-person-field-content" style={{ gap: 16 }}>
              <div style={{ display: 'grid', gap: 12, flex: 1 }}>
                <select
                  className="field-input"
                  value={callData.callType}
                  onChange={e => setCallData(prev => ({ ...prev, callType: e.target.value }))}
                >
                  <option value="">Call type</option>
                  <option value="First call">First call</option>
                  <option value="Follow up call">Follow up call</option>
                  <option value="Final follow up call">Final follow up call</option>
                  <option value="Other">Other</option>
                </select>
                <div style={{ display: 'flex', gap: 12 }}>
                  <input
                    type="date"
                    className="field-input"
                    value={callData.date}
                    onChange={e => setCallData(prev => ({ ...prev, date: e.target.value }))}
                  />
                  <input
                    type="time"
                    className="field-input"
                    value={callData.time}
                    onChange={e => setCallData(prev => ({ ...prev, time: e.target.value }))}
                  />
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <select
                    className="field-input"
                    value={callData.assignedUser}
                    onChange={e => setCallData(prev => ({ ...prev, assignedUser: e.target.value }))}
                  >
                    <option value="">Assigned user</option>
                    {(filterMeta?.managers || []).map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                  <input
                    className="field-input"
                    placeholder="Scheduled by"
                    value={callData.scheduledBy}
                    onChange={e => setCallData(prev => ({ ...prev, scheduledBy: e.target.value }))}
                  />
                </div>
                <textarea
                  className="field-input"
                  rows={5}
                  placeholder="Notes"
                  value={callData.notes}
                  onChange={e => setCallData(prev => ({ ...prev, notes: e.target.value }))}
                />
                <div style={{ display: 'grid', gap: 8 }}>
                  <div><strong>Person</strong>: {formData.name || '-'}</div>
                  <div><strong>Organization</strong>: {formData.organization || '-'}</div>
                </div>
              </div>
            </div>
            <div className="add-person-field-footer">
              <div />
              <div className="footer-right">
                <button className="cancel-button" onClick={() => setShowCallModal(false)}>Cancel</button>
                <button className="save-button" onClick={() => {
                  const item = {
                    id: Date.now(),
                    type: 'call' as const,
                    subject: callData.callType || 'Call',
                    date: callData.date,
                    time: callData.time,
                    assignedUser: callData.assignedUser,
                    status: 'open' as const,
                  };
                  addItem(item);
                  setShowCallModal(false);
                }}>Save</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Meeting scheduler Modal */}
      {showMeetingModal && (
        <div className="customize-fields-overlay" onClick={() => setShowMeetingModal(false)}>
          <div className="add-person-field-modal" onClick={e => e.stopPropagation()}>
            <div className="add-person-field-header">
              <h2>Schedule meeting</h2>
              <button className="close-button" onClick={() => setShowMeetingModal(false)}>×</button>
            </div>
            <div className="add-person-field-content" style={{ gap: 16 }}>
              <div style={{ display: 'grid', gap: 12, flex: 1 }}>
                <input
                  className="field-input"
                  placeholder="Subject"
                  value={meetingData.subject}
                  onChange={e => setMeetingData(prev => ({ ...prev, subject: e.target.value }))}
                />
                <div style={{ display: 'flex', gap: 12 }}>
                  <input
                    type="date"
                    className="field-input"
                    value={meetingData.date}
                    onChange={e => setMeetingData(prev => ({ ...prev, date: e.target.value }))}
                  />
                  <input
                    type="time"
                    className="field-input"
                    value={meetingData.startTime}
                    onChange={e => setMeetingData(prev => ({ ...prev, startTime: e.target.value }))}
                  />
                  <input
                    type="time"
                    className="field-input"
                    value={meetingData.endTime}
                    onChange={e => setMeetingData(prev => ({ ...prev, endTime: e.target.value }))}
                  />
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <select
                    className="field-input"
                    value={meetingData.assignedUser}
                    onChange={e => setMeetingData(prev => ({ ...prev, assignedUser: e.target.value }))}
                  >
                    <option value="">Assigned user</option>
                    {(filterMeta?.managers || []).map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                  <input
                    className="field-input"
                    placeholder="Scheduled by"
                    value={meetingData.scheduledBy}
                    onChange={e => setMeetingData(prev => ({ ...prev, scheduledBy: e.target.value }))}
                  />
                </div>
                <textarea
                  className="field-input"
                  rows={5}
                  placeholder="Notes"
                  value={meetingData.notes}
                  onChange={e => setMeetingData(prev => ({ ...prev, notes: e.target.value }))}
                />
                <div style={{ display: 'grid', gap: 8 }}>
                  <div><strong>Person</strong>: {formData.name || '-'}</div>
                  <div><strong>Organization</strong>: {formData.organization || '-'}</div>
                </div>
              </div>
            </div>
            <div className="add-person-field-footer">
              <div />
              <div className="footer-right">
                <button className="cancel-button" onClick={() => setShowMeetingModal(false)}>Cancel</button>
                <button className="save-button" onClick={() => {
                  const item = {
                    id: Date.now(),
                    type: 'meeting' as const,
                    subject: meetingData.subject || 'Meeting',
                    date: meetingData.date,
                    time: meetingData.startTime,
                    assignedUser: meetingData.assignedUser,
                    status: 'open' as const,
                  };
                  addItem(item);
                  setShowMeetingModal(false);
                }}>Save</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Activity Modal */}
      <ActivityModal
        isOpen={showActivityModal}
        onClose={() => setShowActivityModal(false)}
        managers={filterMeta?.managers}
        onSave={async (values: ActivityFormValues) => {
          if (!formData.id) {
            alert('Person ID is required to create an activity.');
            return;
          }
          
          try {
            let formattedDate = values.date;
            if (!formattedDate) {
              const today = new Date();
              const dd = String(today.getDate()).padStart(2, '0');
              const mm = String(today.getMonth() + 1).padStart(2, '0');
              const yyyy = today.getFullYear();
              formattedDate = `${dd}/${mm}/${yyyy}`;
            }
            
            let deal = formData.name || '';
            if (formData.organization) {
              deal = `${deal} + ${formData.organization}`;
            }
            
            await activitiesApi.create({
              subject: values.subject || 'Follow up',
              date: formattedDate,
              startTime: values.startTime || undefined,
              endTime: values.endTime || undefined,
              priority: values.priority || undefined,
              assignedUser: values.assignedUser || undefined,
              notes: values.notes || undefined,
              personId: formData.id,
              category: 'Activity',
              organization: values.organization || formData.organization || undefined,
              deal: deal || undefined,
            } as any);
            
            const item = {
              id: Date.now(),
              type: 'activity' as const,
              subject: values.subject || 'Activity',
              date: formattedDate,
              time: values.startTime,
              assignedUser: values.assignedUser,
              status: 'open' as const,
            };
            addItem(item);
            setShowActivityModal(false);
          } catch (error: any) {
            console.error('Failed to create activity:', error);
            alert(`Failed to create activity: ${error?.response?.data?.message || error?.message || 'Unknown error'}`);
          }
        }}
      />
    </div>
  );
}
