import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

import Manager  from './pages/ManagerDashboard';
import Menu     from './pages/CustomerMenu';
import Kitchen  from './pages/KitchenDisplay';
import Waiter   from './pages/WaiterDashboard';
import Home     from './pages/Home';

function App() {
  return (
    <Router>
      <Routes>
        {/* Default root → customer menu */}
        <Route path="/"        element={<Home />} />
        <Route path="/menu"    element={<Menu />} />
        <Route path="/kitchen" element={<Kitchen />} />
        <Route path="/waiter"  element={<Waiter />} />
        <Route path="/manager" element={<Manager />} />
      </Routes>
    </Router>
  );
}

export default App;
