import './Deals.css';

export default function Deals() {
  return (
    <div className="deals-page">
      <header className="deals-header">
        <h1>Deals</h1>
        <p>Track sales opportunities across your pipelines.</p>
      </header>

      <div className="deals-empty">
        <div className="deals-empty-card">
          <h2>Deals dashboard coming soon</h2>
          <p>
            Use the Pipelines section to configure stages. Deal management UI will appear here once
            backend endpoints are connected.
          </p>
        </div>
      </div>
    </div>
  );
}


