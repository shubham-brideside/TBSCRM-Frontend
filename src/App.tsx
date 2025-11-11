import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import PersonsList from './pages/PersonsList';
import ActivitiesList from './pages/ActivitiesList';
import PersonDetail from './pages/PersonDetail';
import Pipelines from './pages/Pipelines';
import Teams from './pages/Teams';
import Deals from './pages/Deals';
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

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          element={(
            <RequireAuth>
              <AppLayout />
            </RequireAuth>
          )}
        >
          <Route path="/" element={<PersonsList />} />
          <Route path="/persons/:id" element={<PersonDetail />} />
          <Route path="/activities" element={<ActivitiesList />} />
          <Route path="/pipelines" element={<Pipelines />} />
          <Route path="/teams" element={<Teams />} />
          <Route path="/organizations" element={<Organizations />} />
          <Route path="/deals" element={<Deals />} />
          <Route path="/users" element={<Users />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

