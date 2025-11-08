import './Users.css';

export default function Users() {
  return (
    <div className="users-page">
      <header className="users-header">
        <h1>Users</h1>
        <p>Manage CRM members, roles, and invitations.</p>
      </header>

      <div className="users-empty">
        <div className="users-empty-card">
          <h2>User management coming soon</h2>
          <p>
            This section will surface team management tools as soon as the backend endpoints are
            integrated. Stay tuned!
          </p>
        </div>
      </div>
    </div>
  );
}


