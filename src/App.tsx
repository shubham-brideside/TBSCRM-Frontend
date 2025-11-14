import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import PersonsList from './pages/PersonsList';
import ActivitiesList from './pages/ActivitiesList';
import PersonDetail from './pages/PersonDetail';
import Pipelines from './pages/Pipelines';
import Teams from './pages/Teams';
import Deals from './pages/Deals';
import DealDetail from './pages/DealDetail';
import Organizations from './pages/Organizations';
import Users from './pages/Users';
import Login from './pages/Login';
import AppLayout from './components/AppLayout';
import { getStoredToken } from './utils/authToken';
import './App.css';

function RequireAuth({ children }: { children: JSX.Element }) {
  const location = useLocation();
  const token = getStoredToken();
  
  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return children;
}

function RequireGuest({ children }: { children: JSX.Element }) {
  const token = getStoredToken();
  if (token) {
    return <Navigate to="/persons" replace />;
  }
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Login page - only accessible when not logged in */}
        <Route
          path="/login"
          element={(
            <RequireGuest>
              <Login />
            </RequireGuest>
          )}
        />
        
        {/* Protected routes - require authentication */}
        <Route
          element={(
            <RequireAuth>
              <AppLayout />
            </RequireAuth>
          )}
        >
          {/* Root redirect */}
          <Route path="/" element={<Navigate to="/persons" replace />} />
          
          {/* Individual page routes */}
          <Route path="/persons" element={<PersonsList />} />
          <Route path="/persons/:id" element={<PersonDetail />} />
          <Route path="/activities" element={<ActivitiesList />} />
          <Route path="/pipelines" element={<Pipelines />} />
          <Route path="/teams" element={<Teams />} />
          <Route path="/organizations" element={<Organizations />} />
          <Route path="/deals" element={<Deals />} />
          <Route path="/deals/:id" element={<DealDetail />} />
          <Route path="/users" element={<Users />} />
          
          {/* Catch all for protected routes - redirect to persons if route not found */}
          <Route path="*" element={<Navigate to="/persons" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

