
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";

import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import Producers from "./pages/Producers";
import Stock from "./pages/Stock";
import Login from "./pages/Login";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/clients" element={<Clients />} />
        <Route path="/producers" element={<Producers />} />
        <Route path="/stock" element={<Stock />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
