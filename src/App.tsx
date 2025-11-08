import { BrowserRouter, Routes, Route } from 'react-router-dom';
import PersonsList from './pages/PersonsList';
import ActivitiesList from './pages/ActivitiesList';
import PersonDetail from './pages/PersonDetail';
import Login from './pages/Login';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/persons" element={<PersonsList />} />
        <Route path="/persons/:id" element={<PersonDetail />} />
        <Route path="/activities" element={<ActivitiesList />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

