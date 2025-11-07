import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import PersonsList from './pages/PersonsList';
import ActivitiesList from './pages/ActivitiesList';
import PersonDetail from './pages/PersonDetail';
import Login from './pages/Login';
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
          path="/"
          element={(
            <RequireAuth>
              <PersonsList />
            </RequireAuth>
          )}
        />
        <Route
          path="/persons/:id"
          element={(
            <RequireAuth>
              <PersonDetail />
            </RequireAuth>
          )}
        />
        <Route
          path="/activities"
          element={(
            <RequireAuth>
              <ActivitiesList />
            </RequireAuth>
          )}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

