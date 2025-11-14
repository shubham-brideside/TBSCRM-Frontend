import { useState, useEffect, useMemo, useRef, useCallback, type ChangeEvent, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './Deals.css';
import { dealsApi } from '../services/deals';
import type { Deal, DealStatus } from '../types/deal';
import { organizationsApi } from '../services/organizations';
import type { Organization } from '../types/organization';
import { pipelinesApi } from '../services/pipelines';
import type { Pipeline, Stage } from '../types/pipeline';
import { personsApi } from '../services/api';
import type { Person, PersonOwner } from '../types/person';

type DealFilterStatus = 'all' | DealStatus;

interface DealFormState {
  name: string;
  value: string;
  status: DealStatus;
  personName: string; // Changed from personId to personName for input field
  personId: string; // Keep for internal use when person is found
  pipelineId: string;
  stageId: string;
  organizationId: string;
  categoryId: string;
  eventType: string;
  venue: string;
  phoneNumber: string;
  eventDate: string;
  commissionAmount: string;
}

const initialFormState: DealFormState = {
  name: '',
  value: '',
  status: 'IN_PROGRESS',
  personName: '',
  personId: '',
  pipelineId: '',
  stageId: '',
  organizationId: '',
  categoryId: '',
  eventType: '',
  venue: '',
  phoneNumber: '',
  eventDate: '',
  commissionAmount: '',
};

const statusColors: Record<DealStatus, string> = {
  WON: '#10b981',
  LOST: '#ef4444',
  IN_PROGRESS: '#8b5cf6',
};

const Deals = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [persons, setPersons] = useState<Person[]>([]);
  const [managers, setManagers] = useState<PersonOwner[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<DealFilterStatus>('all');
  const [filterOrganization, setFilterOrganization] = useState<number | null>(null);
  const [filterCategory, setFilterCategory] = useState<number | null>(null);
  const [filterManager, setFilterManager] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'grid' | 'sheet'>('grid');
  const [isViewDropdownOpen, setIsViewDropdownOpen] = useState<boolean>(false);
  const viewDropdownRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState<DealFormState>(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [actionInFlight, setActionInFlight] = useState<{ dealId: number; type: 'status' | 'stage' } | null>(null);

  const loadDeals = useCallback(async (preserveDealId?: number | null) => {
    setLoading(true);
    try {
      // Always load all deals for kanban board view
      const data = await dealsApi.list();
      setDeals(data);
      if (preserveDealId) {
        const match = data.find((deal) => deal.id === preserveDealId) ?? null;
        setSelectedDeal(match);
      } else if (!preserveDealId) {
        setSelectedDeal((prev) => {
          if (!prev) {
            return null;
          }
          const match = data.find((deal) => deal.id === prev.id) ?? null;
          return match;
        });
      }
      setError(null);
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Failed to load deals.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadDeals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-open modal if coming from Person page
  useEffect(() => {
    const personNameFromState = (location.state as any)?.personName;
    const shouldOpenModal = (location.state as any)?.openModal;
    
    if (shouldOpenModal && personNameFromState) {
      const initialData = { ...initialFormState, personName: personNameFromState };
      setFormData(initialData);
      setIsModalOpen(true);
      // Clear the state after using it
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    const fetchReferenceData = async () => {
      try {
        const [orgs, pipelineData] = await Promise.all([
          organizationsApi.list(),
          pipelinesApi.list({ includeStages: true }),
        ]);
        setOrganizations(orgs);
        setPipelines(pipelineData);
      } catch (err) {
        console.error('Failed to load organizations or pipelines', err);
      }

      try {
        const personsPage = await personsApi.list({ page: 0, size: 200, sort: 'name,asc' });
        setPersons(personsPage.content ?? []);
      } catch (err) {
        console.error('Failed to load persons', err);
      }

      try {
        const managersData = await personsApi.listOwners();
        setManagers(managersData);
      } catch (err) {
        console.error('Failed to load managers', err);
      }
    };

    fetchReferenceData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (viewDropdownRef.current && !viewDropdownRef.current.contains(event.target as Node)) {
        setIsViewDropdownOpen(false);
      }
    };
    if (isViewDropdownOpen) {
      setTimeout(() => {
        document.addEventListener('click', handleClickOutside);
      }, 0);
      return () => {
        document.removeEventListener('click', handleClickOutside);
      };
    }
    return undefined;
  }, [isViewDropdownOpen]);

  const formatCurrency = useCallback((value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value || 0);
  }, []);

  const formatDate = useCallback((dateString?: string | null) => {
    if (!dateString) {
      return '—';
    }
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {
      return dateString;
    }
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }, []);

  const organizationsById = useMemo(() => {
    const map = new Map<number, Organization>();
    organizations.forEach((org) => map.set(org.id, org));
    // Add TBS as a static organization option
    // Using a high ID (999999) to avoid conflicts with real organization IDs
    map.set(999999, { id: 999999, name: 'TBS' } as Organization);
    return map;
  }, [organizations]);

  // Combined organizations list including TBS
  const allOrganizations = useMemo(() => {
    const tbsOrg: Organization = { id: 999999, name: 'TBS' } as Organization;
    return [tbsOrg, ...organizations];
  }, [organizations]);

  const personsById = useMemo(() => {
    const map = new Map<number, Person>();
    persons.forEach((person) => map.set(person.id, person));
    return map;
  }, [persons]);

  const pipelinesById = useMemo(() => {
    const map = new Map<number, Pipeline>();
    pipelines.forEach((pipeline) => map.set(pipeline.id, pipeline));
    // Add TBS as a static pipeline option
    // Using a high ID (999999) to avoid conflicts with real pipeline IDs
    map.set(999999, { id: 999999, name: 'TBS', stages: [] } as Pipeline);
    return map;
  }, [pipelines]);

  // Combined pipelines list including TBS
  const allPipelines = useMemo(() => {
    const tbsPipeline: Pipeline = { id: 999999, name: 'TBS', stages: [] } as Pipeline;
    return [tbsPipeline, ...pipelines];
  }, [pipelines]);

  // Static category options
  const categoryOptions = useMemo(() => {
    return [
      { id: 1, name: 'Photography' },
      { id: 2, name: 'Makeup' },
      { id: 3, name: 'Planning & Decor' },
    ];
  }, []);

  const filteredDeals = useMemo(() => {
    return deals.filter((deal) => {
      const organizationMatch = filterOrganization === null || deal.organizationId === filterOrganization;
      const categoryMatch = filterCategory === null || deal.categoryId === filterCategory;
      
      // Filter by manager: check if the deal's person has the selected manager (ownerId)
      const managerMatch = filterManager === null || (() => {
        if (!deal.personId) return false;
        const person = persons.find(p => p.id === deal.personId);
        return person?.ownerId === filterManager;
      })();
      
      const query = searchQuery.trim().toLowerCase();
      const searchMatch =
        query.length === 0 ||
        (deal.name && deal.name.toLowerCase().includes(query)) ||
        (deal.venue && deal.venue.toLowerCase().includes(query));
      return organizationMatch && categoryMatch && managerMatch && searchMatch;
    });
  }, [deals, filterOrganization, filterCategory, filterManager, searchQuery, persons]);

  // Group deals by status for kanban view
  const dealsByStatus = useMemo(() => {
    const grouped: Record<string, Deal[]> = {
      all: filteredDeals,
      IN_PROGRESS: filteredDeals.filter((deal) => deal.status === 'IN_PROGRESS'),
      WON: filteredDeals.filter((deal) => deal.status === 'WON'),
      LOST: filteredDeals.filter((deal) => deal.status === 'LOST'),
    };
    return grouped;
  }, [filteredDeals]);

  // Calculate totals for each status column
  const statusTotals = useMemo(() => {
    return {
      all: {
        total: dealsByStatus.all.reduce((sum, deal) => sum + (deal.value || 0), 0),
        count: dealsByStatus.all.length,
      },
      IN_PROGRESS: {
        total: dealsByStatus.IN_PROGRESS.reduce((sum, deal) => sum + (deal.value || 0), 0),
        count: dealsByStatus.IN_PROGRESS.length,
      },
      WON: {
        total: dealsByStatus.WON.reduce((sum, deal) => sum + (deal.value || 0), 0),
        count: dealsByStatus.WON.length,
      },
      LOST: {
        total: dealsByStatus.LOST.reduce((sum, deal) => sum + (deal.value || 0), 0),
        count: dealsByStatus.LOST.length,
      },
    };
  }, [dealsByStatus]);

  // Get all stages from all pipelines (8 stages total)
  const allStages = useMemo(() => {
    const stagesMap = new Map<number, Stage>();
    pipelines.forEach((pipeline) => {
      pipeline.stages?.forEach((stage) => {
        if (!stagesMap.has(stage.id)) {
          stagesMap.set(stage.id, stage);
        }
      });
    });
    // Sort stages by order if available, otherwise by name
    return Array.from(stagesMap.values()).sort((a, b) => {
      if (a.order !== undefined && b.order !== undefined) {
        return a.order - b.order;
      }
      return (a.name || '').localeCompare(b.name || '');
    });
  }, [pipelines]);

  const stageOptionsForForm = useMemo(() => {
    // Return all stages instead of just stages from selected pipeline
    return allStages;
  }, [allStages]);

  const handleOpenModal = () => {
    // Check if person name was passed from Person page
    const personNameFromState = (location.state as any)?.personName;
    const initialData = personNameFromState 
      ? { ...initialFormState, personName: personNameFromState }
      : initialFormState;
    
    setFormData(initialData);
    setModalError(null);
    setIsModalOpen(true);
    
    // Clear the state after using it
    if (personNameFromState) {
      window.history.replaceState({}, document.title);
    }
  };

  const handleCloseModal = () => {
    if (isSubmitting) {
      return;
    }
    setIsModalOpen(false);
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => {
      // Don't clear stageId when pipeline changes since stages are now independent
      return {
        ...prev,
        [name]: value,
      };
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formData.name.trim()) {
      setModalError('Deal name is required.');
      return;
    }

    // Try to find person by name if personName is provided
    let personId: number | undefined = undefined;
    if (formData.personName.trim()) {
      const foundPerson = persons.find(
        (p) => p.name.toLowerCase().trim() === formData.personName.toLowerCase().trim()
      );
      if (foundPerson) {
        personId = foundPerson.id;
      }
      // If person not found, we can still create the deal without personId
      // or show an error - for now, we'll allow it to be null
    }

    const payload = {
      name: formData.name.trim(),
      status: formData.status,
      value: formData.value ? Number(formData.value) : undefined,
      personId: personId,
      pipelineId: formData.pipelineId ? Number(formData.pipelineId) : undefined,
      stageId: formData.stageId ? Number(formData.stageId) : undefined,
      organizationId: formData.organizationId ? Number(formData.organizationId) : undefined,
      categoryId: formData.categoryId ? Number(formData.categoryId) : undefined,
      eventType: formData.eventType ? formData.eventType : undefined,
      commissionAmount: formData.commissionAmount ? Number(formData.commissionAmount) : undefined,
      venue: formData.venue ? formData.venue : undefined,
      phoneNumber: formData.phoneNumber ? formData.phoneNumber : undefined,
      eventDate: formData.eventDate ? formData.eventDate : undefined,
    };

    setIsSubmitting(true);
    setModalError(null);
    try {
      const createdDeal = await dealsApi.create(payload);
      await loadDeals(createdDeal.id);
      setIsModalOpen(false);
      setFormData(initialFormState);
      setSelectedDeal(createdDeal);
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Failed to create deal.';
      setModalError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusUpdate = async (dealId: number, nextStatus: DealStatus) => {
    setActionInFlight({ dealId, type: 'status' });
    try {
      const updatedDeal = await dealsApi.updateStatus(dealId, { status: nextStatus });
      setDeals((prev) => prev.map((deal) => (deal.id === dealId ? updatedDeal : deal)));
      setSelectedDeal((prev) => (prev && prev.id === dealId ? updatedDeal : prev));
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Failed to update status.';
      setError(message);
    } finally {
      setActionInFlight(null);
    }
  };

  const handleStageUpdate = async (dealId: number, stageId: number) => {
    setActionInFlight({ dealId, type: 'stage' });
    try {
      const updatedDeal = await dealsApi.moveToStage(dealId, { stageId });
      setDeals((prev) => prev.map((deal) => (deal.id === dealId ? updatedDeal : deal)));
      setSelectedDeal((prev) => (prev && prev.id === dealId ? updatedDeal : prev));
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Failed to update stage.';
      setError(message);
    } finally {
      setActionInFlight(null);
    }
  };

  const isLoadingAction = (dealId: number, type: 'status' | 'stage') =>
    actionInFlight?.dealId === dealId && actionInFlight?.type === type;

  const selectedDealPipeline = selectedDeal?.pipelineId
    ? pipelinesById.get(selectedDeal.pipelineId) ?? null
    : null;
  const selectedDealStages: Stage[] = selectedDealPipeline?.stages ?? [];

  if (loading) {
    return (
      <div className="deals-page">
        <div className="deals-loading">Loading deals...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="deals-page">
        <div className="deals-error">{error}</div>
      </div>
    );
  }

  return (
    <div className="deals-page">
      <h1 className="deals-page-title">Deals</h1>
      <div className="deals-header">
        <div className="deals-header-top">
          <div className="deals-header-left">
            <div className="deals-search-container">
              <input
                type="text"
                className="deals-search-input"
                placeholder="Search deals by name or venue..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
              <span className="deals-search-icon">🔍</span>
            </div>
          </div>
          <div className="deals-header-right">
            <div className="view-dropdown" ref={viewDropdownRef}>
              <button
                className="icon-btn-tree"
                onClick={(event) => {
                  event.stopPropagation();
                  setIsViewDropdownOpen(!isViewDropdownOpen);
                }}
              >
                {viewMode === 'grid' ? 'Grid' : 'Sheet'} <span>▾</span>
              </button>
              {isViewDropdownOpen && (
                <div className="view-menu">
                  <button
                    className={`view-menu-item ${viewMode === 'grid' ? 'active' : ''}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      setViewMode('grid');
                      setIsViewDropdownOpen(false);
                    }}
                  >
                    Grid
                  </button>
                  <button
                    className={`view-menu-item ${viewMode === 'sheet' ? 'active' : ''}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      setViewMode('sheet');
                      setIsViewDropdownOpen(false);
                    }}
                  >
                    Sheet
                  </button>
                </div>
              )}
            </div>
            <button className="deals-add-btn" onClick={handleOpenModal}>
              + New Deal
            </button>
          </div>
        </div>
        <div className="deals-header-bottom">
          <div className="deals-filters">
            <button
              className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
              onClick={() => setFilterStatus('all')}
            >
              All
            </button>
            <button
              className={`filter-btn ${filterStatus === 'WON' ? 'active' : ''}`}
              onClick={() => setFilterStatus('WON')}
            >
              Won
            </button>
            <button
              className={`filter-btn ${filterStatus === 'LOST' ? 'active' : ''}`}
              onClick={() => setFilterStatus('LOST')}
            >
              Lost
            </button>
            <button
              className={`filter-btn ${filterStatus === 'IN_PROGRESS' ? 'active' : ''}`}
              onClick={() => setFilterStatus('IN_PROGRESS')}
            >
              In Progress
            </button>
          </div>
          <select
            className="filter-select"
            value={filterOrganization ?? ''}
            onChange={(event) => setFilterOrganization(event.target.value === '' ? null : Number(event.target.value))}
          >
            <option value="">All Organizations</option>
            {allOrganizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>
          <select
            className="filter-select"
            value={filterCategory ?? ''}
            onChange={(event) => setFilterCategory(event.target.value === '' ? null : Number(event.target.value))}
          >
            <option value="">All Categories</option>
            {categoryOptions.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          <select
            className="filter-select"
            value={filterManager ?? ''}
            onChange={(event) => setFilterManager(event.target.value === '' ? null : Number(event.target.value))}
          >
            <option value="">All Manager</option>
            {managers.map((manager) => (
              <option key={manager.id} value={manager.id}>
                {manager.displayName || manager.email}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="deals-content">
        {viewMode === 'grid' ? (
          <div className="deals-kanban-board">
            {/* All Column */}
            <div className={`kanban-column ${filterStatus === 'all' ? 'highlighted' : ''}`}>
              <div className="kanban-column-header">
                <h3 className="kanban-column-title">All</h3>
                <div className="kanban-column-summary">
                  {formatCurrency(statusTotals.all.total)} - {statusTotals.all.count} deals
                </div>
              </div>
              <div className="kanban-column-content">
                {dealsByStatus.all.length === 0 ? (
                  <div className="kanban-empty">No deals</div>
                ) : (
                  dealsByStatus.all.map((deal) => {
                    const personName = deal.personId
                      ? personsById.get(deal.personId)?.name ?? `Person ${deal.personId}`
                      : null;
                    return (
                      <div
                        key={deal.id}
                        className={`kanban-card ${selectedDeal?.id === deal.id ? 'selected' : ''}`}
                        onClick={() => navigate(`/deals/${deal.id}`)}
                      >
                        <div className="kanban-card-name">{deal.name || `Deal #${deal.id}`}</div>
                        {personName && <div className="kanban-card-rsp">RSP: {personName}</div>}
                        {deal.createdAt && (
                          <div className="kanban-card-date">{formatDate(deal.createdAt)}</div>
                        )}
                        <div className="kanban-card-value">{formatCurrency(deal.value)}</div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* In Progress Column */}
            <div className={`kanban-column ${filterStatus === 'IN_PROGRESS' ? 'highlighted' : ''}`}>
              <div className="kanban-column-header">
                <h3 className="kanban-column-title">In Progress</h3>
                <div className="kanban-column-summary">
                  {formatCurrency(statusTotals.IN_PROGRESS.total)} - {statusTotals.IN_PROGRESS.count} deals
                </div>
              </div>
              <div className="kanban-column-content">
                {dealsByStatus.IN_PROGRESS.length === 0 ? (
                  <div className="kanban-empty">No deals</div>
                ) : (
                  dealsByStatus.IN_PROGRESS.map((deal) => {
                    const personName = deal.personId
                      ? personsById.get(deal.personId)?.name ?? `Person ${deal.personId}`
                      : null;
                    return (
                      <div
                        key={deal.id}
                        className={`kanban-card ${selectedDeal?.id === deal.id ? 'selected' : ''}`}
                        onClick={() => navigate(`/deals/${deal.id}`)}
                      >
                        <div className="kanban-card-name">{deal.name || `Deal #${deal.id}`}</div>
                        {personName && <div className="kanban-card-rsp">RSP: {personName}</div>}
                        {deal.createdAt && (
                          <div className="kanban-card-date">{formatDate(deal.createdAt)}</div>
                        )}
                        <div className="kanban-card-value">{formatCurrency(deal.value)}</div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Won Column */}
            <div className={`kanban-column ${filterStatus === 'WON' ? 'highlighted' : ''}`}>
              <div className="kanban-column-header">
                <h3 className="kanban-column-title">Won</h3>
                <div className="kanban-column-summary">
                  {formatCurrency(statusTotals.WON.total)} - {statusTotals.WON.count} deals
                </div>
              </div>
              <div className="kanban-column-content">
                {dealsByStatus.WON.length === 0 ? (
                  <div className="kanban-empty">No deals</div>
                ) : (
                  dealsByStatus.WON.map((deal) => {
                    const personName = deal.personId
                      ? personsById.get(deal.personId)?.name ?? `Person ${deal.personId}`
                      : null;
                    return (
                      <div
                        key={deal.id}
                        className={`kanban-card ${selectedDeal?.id === deal.id ? 'selected' : ''}`}
                        onClick={() => navigate(`/deals/${deal.id}`)}
                      >
                        <div className="kanban-card-name">{deal.name || `Deal #${deal.id}`}</div>
                        {personName && <div className="kanban-card-rsp">RSP: {personName}</div>}
                        {deal.createdAt && (
                          <div className="kanban-card-date">{formatDate(deal.createdAt)}</div>
                        )}
                        <div className="kanban-card-value">{formatCurrency(deal.value)}</div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Lost Column */}
            <div className={`kanban-column ${filterStatus === 'LOST' ? 'highlighted' : ''}`}>
              <div className="kanban-column-header">
                <h3 className="kanban-column-title">Lost</h3>
                <div className="kanban-column-summary">
                  {formatCurrency(statusTotals.LOST.total)} - {statusTotals.LOST.count} deals
                </div>
              </div>
              <div className="kanban-column-content">
                {dealsByStatus.LOST.length === 0 ? (
                  <div className="kanban-empty">No deals</div>
                ) : (
                  dealsByStatus.LOST.map((deal) => {
                    const personName = deal.personId
                      ? personsById.get(deal.personId)?.name ?? `Person ${deal.personId}`
                      : null;
                    return (
                      <div
                        key={deal.id}
                        className={`kanban-card ${selectedDeal?.id === deal.id ? 'selected' : ''}`}
                        onClick={() => navigate(`/deals/${deal.id}`)}
                      >
                        <div className="kanban-card-name">{deal.name || `Deal #${deal.id}`}</div>
                        {personName && <div className="kanban-card-rsp">RSP: {personName}</div>}
                        {deal.createdAt && (
                          <div className="kanban-card-date">{formatDate(deal.createdAt)}</div>
                        )}
                        <div className="kanban-card-value">{formatCurrency(deal.value)}</div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="sheet-view">
            <table className="deals-sheet-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Value</th>
                  <th>Status</th>
                  <th>Client</th>
                  <th>Organization</th>
                  <th>Category</th>
                  <th>Venue</th>
                  <th>Event Date</th>
                  <th>Event Type</th>
                  <th>Phone</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {filteredDeals.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="deals-empty-cell">
                      No deals found
                    </td>
                  </tr>
                ) : (
                  filteredDeals.map((deal) => {
                    const orgName = deal.organizationId
                      ? organizationsById.get(deal.organizationId)?.name ?? `Organization ${deal.organizationId}`
                      : '—';
                    const personName = deal.personId
                      ? personsById.get(deal.personId)?.name ?? `Person ${deal.personId}`
                      : '—';
                    const categoryLabel =
                      deal.categoryId != null
                        ? categoryOptions.find((category) => category.id === deal.categoryId)?.name ??
                          `Category ${deal.categoryId}`
                        : '—';
                    return (
                      <tr key={deal.id}>
                        <td>{deal.name || `Deal #${deal.id}`}</td>
                        <td>{formatCurrency(deal.value)}</td>
                        <td>{deal.status}</td>
                        <td>{personName}</td>
                        <td>{orgName}</td>
                        <td>{categoryLabel}</td>
                        <td>{deal.venue || '—'}</td>
                        <td>{formatDate(deal.eventDate)}</td>
                        <td>{deal.eventType || '—'}</td>
                        <td>{deal.phoneNumber || '—'}</td>
                        <td>{formatDate(deal.createdAt)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {selectedDeal && viewMode === 'grid' && (
          <div className="deal-detail-panel">
            <div className="deal-detail-header">
              <h3 className="deal-detail-title">Deal Details</h3>
              <button className="deal-detail-close" onClick={() => setSelectedDeal(null)}>
                ×
              </button>
            </div>

            <div className="deal-detail-content">
              <div className="deal-detail-section">
                <div className="deal-detail-row">
                  <span className="deal-detail-label">Name:</span>
                  <span className="deal-detail-value">{selectedDeal.name || `Deal #${selectedDeal.id}`}</span>
                </div>
                <div className="deal-detail-row">
                  <span className="deal-detail-label">Value:</span>
                  <span className="deal-detail-value">{formatCurrency(selectedDeal.value)}</span>
                </div>
                <div className="deal-detail-row">
                  <span className="deal-detail-label">Status:</span>
                  <select
                    className="deal-detail-select"
                    value={selectedDeal.status}
                    onChange={(event) => handleStatusUpdate(selectedDeal.id, event.target.value as DealStatus)}
                    disabled={isLoadingAction(selectedDeal.id, 'status')}
                  >
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="WON">Won</option>
                    <option value="LOST">Lost</option>
                  </select>
                </div>
              </div>

              <div className="deal-detail-section">
                <h4 className="deal-detail-section-title">Associations</h4>
                <div className="deal-detail-row">
                  <span className="deal-detail-label">Client:</span>
                  <span className="deal-detail-value">
                    {selectedDeal.personId
                      ? personsById.get(selectedDeal.personId)?.name ?? `Person ${selectedDeal.personId}`
                      : '—'}
                  </span>
                </div>
                <div className="deal-detail-row">
                  <span className="deal-detail-label">Organization:</span>
                  <span className="deal-detail-value">
                    {selectedDeal.organizationId
                      ? organizationsById.get(selectedDeal.organizationId)?.name ??
                        `Organization ${selectedDeal.organizationId}`
                      : '—'}
                  </span>
                </div>
                <div className="deal-detail-row">
                  <span className="deal-detail-label">Pipeline:</span>
                  <span className="deal-detail-value">
                    {selectedDealPipeline ? selectedDealPipeline.name : '—'}
                  </span>
                </div>
                <div className="deal-detail-row">
                  <span className="deal-detail-label">Stage:</span>
                  {selectedDealPipeline ? (
                    <select
                      className="deal-detail-select"
                      value={selectedDeal.stageId ?? ''}
                      onChange={(event) =>
                        handleStageUpdate(selectedDeal.id, Number(event.target.value))
                      }
                      disabled={isLoadingAction(selectedDeal.id, 'stage')}
                    >
                      <option value="" disabled>
                        Select stage
                      </option>
                      {selectedDealStages.map((stage) => (
                        <option key={stage.id} value={stage.id}>
                          {stage.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="deal-detail-value">—</span>
                  )}
                </div>
              </div>

              <div className="deal-detail-section">
                <h4 className="deal-detail-section-title">Event Information</h4>
                <div className="deal-detail-row">
                  <span className="deal-detail-label">Venue:</span>
                  <span className="deal-detail-value">{selectedDeal.venue || '—'}</span>
                </div>
                <div className="deal-detail-row">
                  <span className="deal-detail-label">Event Date:</span>
                  <span className="deal-detail-value">{formatDate(selectedDeal.eventDate)}</span>
                </div>
                <div className="deal-detail-row">
                  <span className="deal-detail-label">Event Type:</span>
                  <span className="deal-detail-value">{selectedDeal.eventType || '—'}</span>
                </div>
              </div>

              <div className="deal-detail-section">
                <h4 className="deal-detail-section-title">Additional Information</h4>
                <div className="deal-detail-row">
                  <span className="deal-detail-label">Phone:</span>
                  <span className="deal-detail-value">{selectedDeal.phoneNumber || '—'}</span>
                </div>
                <div className="deal-detail-row">
                  <span className="deal-detail-label">Commission:</span>
                  <span className="deal-detail-value">
                    {selectedDeal.commissionAmount != null
                      ? formatCurrency(selectedDeal.commissionAmount)
                      : '—'}
                  </span>
                </div>
                <div className="deal-detail-row">
                  <span className="deal-detail-label">Created:</span>
                  <span className="deal-detail-value">{formatDate(selectedDeal.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Create New Deal</h3>
              <button className="modal-close" onClick={handleCloseModal} disabled={isSubmitting}>
                ×
              </button>
            </div>
            <form className="modal-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Deal Name *</label>
                <input
                  type="text"
                  name="name"
                  className="form-input"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Value *</label>
                  <input
                    type="number"
                    name="value"
                    className="form-input"
                    value={formData.value}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Status *</label>
                  <select
                    name="status"
                    className="form-input"
                    value={formData.status}
                    onChange={handleInputChange}
                    required
                    disabled={isSubmitting}
                  >
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="WON">Won</option>
                    <option value="LOST">Lost</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Client (Person)</label>
                  <input
                    type="text"
                    name="personName"
                    className="form-input"
                    value={formData.personName}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                    placeholder="Enter client name"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Organization</label>
                  <select
                    name="organizationId"
                    className="form-input"
                    value={formData.organizationId}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                  >
                    <option value="">Select Organization</option>
                    {allOrganizations.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Pipeline</label>
                  <select
                    name="pipelineId"
                    className="form-input"
                    value={formData.pipelineId}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                  >
                    <option value="">Select Pipeline</option>
                    {allPipelines.map((pipeline) => (
                      <option key={pipeline.id} value={pipeline.id}>
                        {pipeline.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Stage</label>
                  <select
                    name="stageId"
                    className="form-input"
                    value={formData.stageId}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                  >
                    <option value="">Select Stage</option>
                    {stageOptionsForForm.map((stage) => (
                      <option key={stage.id} value={stage.id}>
                        {stage.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    name="categoryId"
                    className="form-input"
                    value={formData.categoryId}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                  >
                    <option value="">Select Category</option>
                    {categoryOptions.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Commission Override</label>
                  <input
                    type="number"
                    name="commissionAmount"
                    className="form-input"
                    value={formData.commissionAmount}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Venue</label>
                <input
                  type="text"
                  name="venue"
                  className="form-input"
                  value={formData.venue}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Event Date</label>
                  <input
                    type="date"
                    name="eventDate"
                    className="form-input"
                    value={formData.eventDate}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Event Type</label>
                  <input
                    type="text"
                    name="eventType"
                    className="form-input"
                    value={formData.eventType}
                    onChange={handleInputChange}
                    placeholder="e.g., Wedding, Conference"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  type="tel"
                  name="phoneNumber"
                  className="form-input"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                />
              </div>

              {modalError && <div className="modal-error">{modalError}</div>}

              <div className="modal-actions">
                <button type="button" className="modal-btn-cancel" onClick={handleCloseModal} disabled={isSubmitting}>
                  Cancel
                </button>
                <button type="submit" className="modal-btn-submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating…' : 'Create Deal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Deals;
