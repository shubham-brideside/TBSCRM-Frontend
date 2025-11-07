import './ColumnMenu.css';

interface ColumnMenuProps {
  isOpen: boolean;
  columnName: string;
  currentSort?: { field: string; direction: 'asc' | 'desc' };
  position: { top: number; left: number };
  onClose: () => void;
  onSortAscending: () => void;
  onSortDescending: () => void;
  onHideColumn: () => void;
  onInsertRight: () => void;
  onInsertLeft: () => void;
}

export default function ColumnMenu({
  isOpen,
  columnName,
  currentSort,
  position,
  onClose,
  onSortAscending,
  onSortDescending,
  onHideColumn,
  onInsertRight,
  onInsertLeft,
}: ColumnMenuProps) {
  if (!isOpen) return null;

  const isSortedAsc = currentSort?.field === columnName && currentSort?.direction === 'asc';
  const isSortedDesc = currentSort?.field === columnName && currentSort?.direction === 'desc';

  return (
    <>
      <div className="column-menu-overlay" onClick={onClose} />
      <div
        className="column-menu"
        style={{ top: `${position.top}px`, left: `${position.left}px` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`column-menu-item ${isSortedAsc ? 'active' : ''}`}
          onClick={onSortAscending}
        >
          <span className="menu-icon">↑</span>
          <span>Sort ascending</span>
          {isSortedAsc && <span className="checkmark">✓</span>}
        </div>
        <div
          className={`column-menu-item ${isSortedDesc ? 'active' : ''}`}
          onClick={onSortDescending}
        >
          <span className="menu-icon">↓</span>
          <span>Sort descending</span>
          {isSortedDesc && <span className="checkmark">✓</span>}
        </div>
        <div className="column-menu-divider"></div>
        <div className="column-menu-item" onClick={onHideColumn}>
          <span className="menu-icon">👁️</span>
          <span>Hide column</span>
        </div>
        <div className="column-menu-item" onClick={onInsertRight}>
          <span className="menu-icon">→</span>
          <span>Insert columns to right</span>
        </div>
        <div className="column-menu-item" onClick={onInsertLeft}>
          <span className="menu-icon">←</span>
          <span>Insert columns to left</span>
        </div>
      </div>
    </>
  );
}

