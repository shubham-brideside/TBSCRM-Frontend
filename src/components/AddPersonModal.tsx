import { useState, useEffect, useRef } from 'react';
import { personsApi } from '../services/api';
import { activitiesApi } from '../services/activities';
import type { Person } from '../types/person';
import ActivityModal, { type ActivityFormValues } from './ActivityModal';
import './AddPersonModal.css';

interface AddPersonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  mode?: 'create' | 'edit';
  person?: Person | null;
  filterMeta?: {
    categories: string[];
    organizations: string[];
    managers: string[];
    venues: string[];
  };
}

export default function AddPersonModal({
  isOpen,
  onClose,
  onSuccess,
  mode = 'create',
  person,
  filterMeta,
}: AddPersonModalProps) {
  const [formData, setFormData] = useState<Partial<Person>>({
    id: person?.id,
    name: person?.name || '',
    instagramId: person?.instagramId || '',
    email: person?.email || '',
    phone: person?.phone || '',
    weddingDate: person?.weddingDate || '',
    venue: person?.venue || '',
    organization: person?.organization || '',
    manager: person?.manager || '',
    category: person?.category || '',
    source: person?.source || '',
    eventType: person?.eventType || '',
    createdDate: person?.createdDate || '',
  });
  const [expandedSections, setExpandedSections] = useState({
    summary: true,
    details: true,
    organization: true,
    deals: false,
  });
  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState<string>('');
  const [loading, setLoading] = useState(false);
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
    date: string; // yyyy-mm-dd
    time?: string; // HH:mm
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

  // Update formData when person prop changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        id: person?.id,
        name: person?.name || '',
        instagramId: person?.instagramId || '',
        email: person?.email || '',
        phone: person?.phone || '',
        weddingDate: person?.weddingDate || '',
        venue: person?.venue || '',
        organization: person?.organization || '',
        manager: person?.manager || '',
        category: person?.category || '',
        source: person?.source || '',
        eventType: person?.eventType || '',
        createdDate: person?.createdDate || '',
      });
    }
  }, [person, isOpen]);

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

  if (!isOpen) return null;

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

  // Open WhatsApp with a prefilled message for quick actions
  const openWhatsApp = (action: 'quote' | 'contract' | 'worklinks') => {
    const rawPhone = (formData.phone || '').replace(/[^0-9]/g, '');
    const base = rawPhone ? `https://wa.me/${rawPhone}` : 'https://wa.me/';
    const personName = formData.name ? ` ${formData.name}` : '';
    const actionLabel = action === 'quote' ? 'a quote' : action === 'contract' ? 'the contract' : 'work links';
    const text = encodeURIComponent(`Hi${personName}, I'll share ${actionLabel} here.`);
    const url = `${base}?text=${text}`;
    window.open(url, '_blank');
  };

  // Open Gmail compose in a new tab
  const openGmail = () => {
    const to = (formData as any).email || '';
    const subject = '';
    const body = '';
    const url = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(url, '_blank');
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
      // For dates, store in yyyy-MM-dd format for date input
      setTempValue(formatDateForInput(currentValue) || '');
    } else {
      setTempValue(currentValue || '');
    }
  };

  const handleSaveEdit = (field: keyof Person) => {
    if (field === 'weddingDate' || field === 'createdDate') {
      // Convert from yyyy-MM-dd (date input) to dd/MM/yyyy
      if (tempValue) {
        handleInputChange(field, formatDateFromInput(tempValue));
      }
    } else if (field === 'name') {
      // Handle first name or last name separately
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

  const formatDateTime = (iso?: string | null): string => {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleString();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate that at least name is provided
    if (!formData.name || !formData.name.trim()) {
      alert('Please enter a name for the person.');
      return;
    }
    
    setLoading(true);
    try {
      // Set createdDate to today if not provided
      const personData = { ...formData };
      if (!personData.createdDate) {
        const today = new Date();
        const dd = String(today.getDate()).padStart(2, '0');
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const yyyy = today.getFullYear();
        personData.createdDate = `${dd}/${mm}/${yyyy}`;
      }
      
      let response: Person;
      if (mode === 'edit' && formData.id != null) {
        console.log('Updating person with data:', personData);
        response = await personsApi.update(formData.id, personData);
      } else {
      console.log('Creating person with data:', personData);
        response = await personsApi.create(personData);
      }
      console.log('Person saved successfully:', response);
      
      // Reset form
      setFormData({
        id: undefined,
        name: '',
        instagramId: '',
        phone: '',
        weddingDate: '',
        venue: '',
        organization: '',
        manager: '',
        category: '',
        source: '',
        eventType: '',
        createdDate: '',
      });
      
      // Close modal first
      onClose();
      
      // Then trigger success callback to refresh list
      console.log('Calling onSuccess callback...');
      onSuccess();
    } catch (error: any) {
      console.error('Failed to create person:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to create person. Please try again.';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-person-overlay" onClick={onClose}>
      <div className="add-person-modal" onClick={e => e.stopPropagation()}>
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
            <button className="close-button" onClick={onClose}>×</button>
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
                        <div className="menu-item" onClick={() => {
                          setShowDetailsMenu(false);
                          // Handle hide section
                        }}>
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
                        <div className="menu-item" onClick={() => {
                          setShowDetailsMenu(false);
                          // Handle delete section
                        }}>
                          Delete section
                        </div>
                        <div className="menu-item" onClick={() => {
                          setShowDetailsMenu(false);
                          // Handle move up
                        }}>
                          Move up
                        </div>
                        <div className="menu-item" onClick={() => {
                          setShowDetailsMenu(false);
                          // Handle move down
                        }}>
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
                  {/* Organization Name with Icon */}
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
                  
                  {/* Address Field */}
                  {(!showOnlyFilledOrganization || (formData as any).address) && (
                  <div className="detail-field-row">
                    <label>Address</label>
                    {editingField === 'address' ? (
                      <input
                        type="text"
                        value={tempValue}
                        onChange={e => setTempValue(e.target.value)}
                        onBlur={() => (handleSaveEdit as any)('address')}
                        onKeyDown={e => {
                          if (e.key === 'Enter') (handleSaveEdit as any)('address');
                          if (e.key === 'Escape') handleCancelEdit();
                        }}
                        className="detail-value-input"
                        autoFocus
                      />
                    ) : (
                      <div 
                        className="detail-value-container"
                        onClick={() => handleStartEdit('address' as any, (formData as any).address || '')}
                      >
                        <span className="detail-value">
                          {(formData as any).address || ''}
                        </span>
                      </div>
                    )}
                  </div>
                  )}
                  
                  {/* Labels Field */}
                  {(!showOnlyFilledOrganization || (formData as any).labels) && (
                  <div className="detail-field-row">
                    <label>Labels</label>
                    {editingField === 'labels' ? (
                      <input
                        type="text"
                        value={tempValue}
                        onChange={e => setTempValue(e.target.value)}
                        onBlur={() => (handleSaveEdit as any)('labels')}
                        onKeyDown={e => {
                          if (e.key === 'Enter') (handleSaveEdit as any)('labels');
                          if (e.key === 'Escape') handleCancelEdit();
                        }}
                        className="detail-value-input"
                        autoFocus
                      />
                    ) : (
                      <div 
                        className="detail-value-container"
                        onClick={() => handleStartEdit('labels' as any, (formData as any).labels || '')}
                      >
                        <span className="detail-value">
                          {(formData as any).labels || ''}
                        </span>
                      </div>
                    )}
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

            {/* Overview Section */}
            <div className="detail-section">
              <div className="section-header">
                <h3>Overview</h3>
              </div>
              <div className="section-content">
                {(() => {
                  // Aggregate activity stats from items (activity, call, meeting)
                  const typeCounts: Record<string, number> = {};
                  const userCounts: Record<string, number> = {};
                  items.forEach(i => {
                    const key = i.type === 'call' ? 'Call' : i.type === 'meeting' ? 'Meeting' : 'Follow up';
                    typeCounts[key] = (typeCounts[key] || 0) + 1;
                    const user = i.assignedUser || 'Unassigned';
                    userCounts[user] = (userCounts[user] || 0) + 1;
                  });
                  const topType = Object.entries(typeCounts).sort((a,b)=>b[1]-a[1])[0];
                  const totalType = Object.values(typeCounts).reduce((a,b)=>a+b,0) || 0;
                  const totalUsers = Object.values(userCounts).reduce((a,b)=>a+b,0) || 0;
                  const topUsers = Object.entries(userCounts).sort((a,b)=>b[1]-a[1]).slice(0,3);
                  return (
                    <div style={{ display: 'grid', gap: 16 }}>
                      <div>
                        <div className="overview-title">Top activities</div>
                        <div className="overview-bar">
                          <div className="overview-fill" style={{ width: `${totalType ? Math.round(((topType?.[1]||0)/totalType)*100) : 0}%` }} />
                        </div>
                        <div className="overview-row">
                          <span>{topType?.[0] || '—'}</span>
                          <span>{topType?.[1] || 0}</span>
                          <span>{totalType ? Math.round(((topType?.[1]||0)/totalType)*100) : 0}%</span>
                        </div>
                      </div>
                      <div>
                        <div className="overview-title">Most active users</div>
                        <div className="overview-bar" />
                        <div style={{ display: 'grid', gap: 6 }}>
                          {topUsers.length === 0 ? (
                            <div className="overview-row"><span>—</span><span>0</span><span>0%</span></div>
                          ) : (
                            topUsers.map(([user, count], idx) => (
                              <div key={idx} className="overview-row">
                                <span>{user}</span>
                                <span>{count}</span>
                                <span>{totalUsers ? Math.round((count/totalUsers)*100) : 0}%</span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* System Section */}
            <div className="detail-section">
              <div className="section-header">
                <h3>System</h3>
              </div>
              <div className="section-content">
                <div className="detail-field-row">
                  <label>Person created</label>
                  <div className="detail-value-container">
                    <span className="detail-value">
                      {formatDateTime(person?.createdAt) || (formData.createdDate ? `${formatDateReadable(formData.createdDate)} ${new Date().toLocaleTimeString()}` : '')}
                    </span>
                  </div>
                </div>
                <div className="detail-field-row">
                  <label>Person updated</label>
                  <div className="detail-value-container">
                    <span className="detail-value">
                      {formatDateTime((person as any)?.updatedAt) || ''}
                    </span>
                  </div>
                </div>
              </div>
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
          <button type="button" className="cancel-button" onClick={onClose}>Cancel</button>
          <button type="submit" className="save-button" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Customize Fields Modal */}
      {showCustomizeFields && (
        <div className="customize-fields-overlay" onClick={() => setShowCustomizeFields(false)}>
          <div className="customize-fields-modal" onClick={e => e.stopPropagation()}>
            <div className="customize-fields-header">
              <h2>Customize fields</h2>
              <button className="close-button" onClick={() => setShowCustomizeFields(false)}>×</button>
            </div>
            <p className="customize-fields-description">
              Changes made to persons' custom fields will apply across your account.
            </p>
            <div className="customize-fields-list">
              <div className="field-item">
                <span className="field-icon">T</span>
                <span className="field-name">Name</span>
              </div>
              <div className="field-item">
                <span className="field-icon">T</span>
                <span className="field-name">First name</span>
              </div>
              <div className="field-item">
                <span className="field-icon">📅</span>
                <span className="field-name">Wedding Date only</span>
                <div className="field-actions">
                  <span className="field-action-icon" title="Edit">✏️</span>
                  <span className="field-action-icon" title="Delete">🗑️</span>
                </div>
              </div>
              <div className="field-item">
                <span className="field-icon">T</span>
                <span className="field-name">Wedding Venue</span>
                <div className="field-actions">
                  <span className="field-action-icon" title="Edit">✏️</span>
                  <span className="field-action-icon" title="Delete">🗑️</span>
                </div>
              </div>
              <div className="field-item">
                <span className="field-icon">T</span>
                <span className="field-name">Last name</span>
              </div>
              <div className="field-item">
                <span className="field-icon">T</span>
                <span className="field-name">Instagram ID</span>
                <div className="field-actions">
                  <span className="field-action-icon" title="Edit">✏️</span>
                  <span className="field-action-icon" title="Delete">🗑️</span>
                </div>
              </div>
              <div className="field-item">
                <span className="field-icon">📝</span>
                <span className="field-name">Wedding Itinerary</span>
                <div className="field-actions">
                  <span className="field-action-icon" title="Edit">✏️</span>
                  <span className="field-action-icon" title="Delete">🗑️</span>
                </div>
              </div>
              <div className="field-item">
                <span className="field-icon">☑️</span>
                <span className="field-name">Person Source</span>
                <div className="field-actions">
                  <span className="field-action-icon" title="Edit">✏️</span>
                  <span className="field-action-icon" title="Delete">🗑️</span>
                </div>
              </div>
              <div className="field-item">
                <span className="field-icon">📅</span>
                <span className="field-name">Lead Date</span>
                <div className="field-actions">
                  <span className="field-action-icon" title="Edit">✏️</span>
                  <span className="field-action-icon" title="Delete">🗑️</span>
                </div>
              </div>
              <div className="field-item">
                <span className="field-icon">📅</span>
                <span className="field-name">Party makeup Date(For Makeup Vendors)</span>
                <div className="field-actions">
                  <span className="field-action-icon" title="Edit">✏️</span>
                  <span className="field-action-icon" title="Delete">🗑️</span>
                </div>
              </div>
            </div>
            <div className="customize-fields-footer">
              <button 
                className="add-custom-field-button"
                onClick={() => {
                  setShowCustomizeFields(false);
                  setShowAddCustomField(true);
                }}
              >
                <span className="add-field-plus">+</span>
                Custom field
              </button>
              <button 
                className="done-button"
                onClick={() => setShowCustomizeFields(false)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

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
            alert('Please save the person first before creating an activity.');
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

      {/* Add Person Field Modal */}
      {showAddCustomField && (
        <div className="customize-fields-overlay" onClick={() => setShowAddCustomField(false)}>
          <div className="add-person-field-modal" onClick={e => e.stopPropagation()}>
            <div className="add-person-field-header">
              <h2>Add person field</h2>
              <button className="close-button" onClick={() => setShowAddCustomField(false)}>×</button>
            </div>
            
            <div className="add-person-field-content">
              <div className="add-person-field-left">
                <div className="field-form-group">
                  <label htmlFor="fieldName">
                    Field name <span className="required">(required)</span>
                  </label>
                  <input
                    type="text"
                    id="fieldName"
                    className="field-input"
                    placeholder="Enter field name"
                    value={newFieldData.name}
                    onChange={e => setNewFieldData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div className="field-form-group">
                  <label htmlFor="fieldType">
                    Field type <span className="required">(required)</span>
                  </label>
                  <select
                    id="fieldType"
                    className="field-input"
                    value={newFieldData.fieldType}
                    onChange={e => setNewFieldData(prev => ({ ...prev, fieldType: e.target.value }))}
                  >
                    <option value="">Select type</option>
                    <option value="text">Text</option>
                    <option value="large-text">Large text</option>
                    <option value="single-option">Single option</option>
                    <option value="multiple-options">Multiple options</option>
                    <option value="autocomplete">Autocomplete</option>
                    <option value="numerical">Numerical</option>
                    <option value="monetary">Monetary</option>
                    <option value="user">User</option>
                    <option value="organization">Organization</option>
                    <option value="person">Person</option>
                    <option value="phone">Phone</option>
                    <option value="time">Time</option>
                    <option value="time-range">Time range</option>
                    <option value="date">Date</option>
                    <option value="date-range">Date range</option>
                    <option value="address">Address</option>
                  </select>
                </div>
              </div>

              <div className="add-person-field-right">
                <div className="field-spec-section">
                  <h3>User specifications</h3>
                  <div className="spec-box">
                    <span className="spec-icon">✏️</span>
                    <span>Editing</span>
                    <span className="spec-info">
                      All users <span className="info-icon">ⓘ</span>
                    </span>
                  </div>
                </div>

                <div className="field-spec-section">
                  <h3>Places where shown</h3>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={newFieldData.personAddView}
                      onChange={e => setNewFieldData(prev => ({ ...prev, personAddView: e.target.checked }))}
                    />
                    <span>Person add view <span className="info-icon">ⓘ</span></span>
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={newFieldData.leadDealAddView}
                      onChange={e => setNewFieldData(prev => ({ ...prev, leadDealAddView: e.target.checked }))}
                    />
                    <span>Lead/deal add view <span className="info-icon">ⓘ</span></span>
                  </label>
                </div>

                <div className="field-spec-section">
                  <h3>Quality rules</h3>
                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      checked={newFieldData.markAsRequired}
                      onChange={e => setNewFieldData(prev => ({ ...prev, markAsRequired: e.target.checked }))}
                    />
                    <span>Mark as required <span className="info-icon">ⓘ</span></span>
                  </label>
                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      checked={newFieldData.markAsImportant}
                      onChange={e => setNewFieldData(prev => ({ ...prev, markAsImportant: e.target.checked }))}
                    />
                    <span>Mark as important <span className="info-icon">ⓘ</span></span>
                  </label>
                </div>
              </div>
            </div>

            <div className="add-person-field-footer">
              <div className="footer-left">
                <span className="crown-icon">👑</span>
                <span className="usage-text">18/30 <span className="info-icon">ⓘ</span></span>
              </div>
              <div className="footer-right">
                <button 
                  className="cancel-button"
                  onClick={() => setShowAddCustomField(false)}
                >
                  Cancel
                </button>
                <button 
                  className="save-button"
                  onClick={() => {
                    // Handle save logic here
                    setShowAddCustomField(false);
                    setShowCustomizeFields(true);
                  }}
                  disabled={!newFieldData.name || !newFieldData.fieldType}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

