import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminSignIn from './pages/AdminSignIn';
import SignIn from './pages/SignIn';
import AdminView from './pages/AdminView';
import EmployeeView from './pages/EmployeeView';
import ManagerView from './pages/ManagerView';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/signin" replace />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/admin-signin" element={<AdminSignIn />} />
        <Route path="/admin" element={<AdminView />} />
        <Route path="/employee" element={<EmployeeView />} />
        <Route path="/manager" element={<ManagerView />} />
        <Route path="/approval/:id" element={<AdminView />} />
        <Route path="*" element={<Navigate to="/signin" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
