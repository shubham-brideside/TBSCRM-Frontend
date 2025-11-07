import './PersonDropdown.css';

interface PersonDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onImportData: () => void;
  onSyncContacts: () => void;
}

export default function PersonDropdown({
  isOpen,
  onClose,
  onImportData,
  onSyncContacts,
}: PersonDropdownProps) {
  if (!isOpen) return null;

  return (
    <>
      <div className="person-dropdown-overlay" onClick={onClose} />
      <div className="person-dropdown">
        <div className="person-dropdown-item" onClick={onImportData}>
          <span className="dropdown-icon">⬇️</span>
          <span>Import data</span>
        </div>
        <div className="person-dropdown-item" onClick={onSyncContacts}>
          <span className="dropdown-icon">🔄</span>
          <span>Sync contacts</span>
        </div>
      </div>
    </>
  );
}

