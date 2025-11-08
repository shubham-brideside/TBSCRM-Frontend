import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { activitiesApi, type Activity, type PageResponse } from '../services/activities';
import { clearAuthSession } from '../utils/authToken';

export default function ActivitiesList() {
  const [data, setData] = useState<PageResponse<Activity> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    activitiesApi
      .list({ page: 0, size: 25 })
      .then(setData)
      .catch((e) => {
        if (e?.response?.status === 401) {
          clearAuthSession();
          navigate('/login', { replace: true });
        }
        setError(e?.message ?? 'Failed to load');
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  if (loading) return <div style={{ padding: 16 }}>Loading activities…</div>;
  if (error) return <div style={{ padding: 16, color: 'red' }}>{error}</div>;

  return (
    <div style={{ padding: 16 }}>
      <h2>Activities</h2>
      <div style={{ marginBottom: 12 }}>
        <Link to="/">Persons</Link> | <strong>Activities</strong> | <Link to="/pipelines">Pipelines</Link>
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Category</th>
            <th>Subject/Call type</th>
            <th>Deal</th>
            <th>Instagram</th>
            <th>Phone</th>
            <th>Organization</th>
            <th>Date</th>
            <th>Time</th>
            <th>Assigned</th>
            <th>Status</th>
            <th>Done</th>
          </tr>
        </thead>
        <tbody>
          {data?.content?.map((a) => (
            <tr key={a.id}>
              <td>{a.id}</td>
              <td>{a.category}</td>
              <td>{a.category === 'Call' ? a.callType : a.subject}</td>
              <td>{a.dealName}</td>
              <td>{a.instagramId}</td>
              <td>{a.phone}</td>
              <td>{a.organization}</td>
              <td>{a.date ?? a.dueDate}</td>
              <td>{a.startTime}</td>
              <td>{a.assignedUser}</td>
              <td>{a.status}</td>
              <td>{a.done ? 'Yes' : 'No'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


