import "./App.css";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";

import Login from "./auth/Login.jsx";
import RequireRole from "./auth/RequireRole.jsx";
import Menu from "./components/Menu.jsx";
import { useAuth } from "./auth/AuthContext.jsx";
import AdminBaies from "./pages/AdminBaies.jsx";
import AdminOffers from "./pages/AdminOffers.jsx";
import AdminLogs from "./pages/AdminLogs.jsx";
import AdminUsers from "./pages/AdminUsers.jsx";
import ComptableClients from "./pages/ComptableClients.jsx";
import ComptableDashboard from "./pages/ComptableDashboard.jsx";
import ComptableReservations from "./pages/ComptableReservations.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Offers from "./pages/Offers.jsx";
import Tickets from "./pages/Tickets.jsx";

function App() {
    const { isAuthenticated } = useAuth();
    const location = useLocation();
    const isLogin = location.pathname === "/";

    if (isLogin || !isAuthenticated) {
        return (
            <Routes>
                <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        );
    }

    return (
        <div className="layout">
            <Menu />
            <div className="main-content">
                <Routes>
                    <Route path="/dashboard" element={<RequireRole><Dashboard /></RequireRole>} />
                    <Route path="/offers"    element={<RequireRole><Offers /></RequireRole>} />
                    <Route path="/tickets"   element={<RequireRole roles={["ROLE_ADMIN","ROLE_TECHNICIEN"]}><Tickets /></RequireRole>} />
                    <Route path="/admin/baies"       element={<RequireRole roles={["ROLE_ADMIN"]}><AdminBaies /></RequireRole>} />
                    <Route path="/admin/offres"      element={<RequireRole roles={["ROLE_ADMIN"]}><AdminOffers /></RequireRole>} />
                    <Route path="/admin/utilisateurs" element={<RequireRole roles={["ROLE_ADMIN"]}><AdminUsers /></RequireRole>} />
                    <Route path="/admin/logs"        element={<RequireRole roles={["ROLE_ADMIN"]}><AdminLogs /></RequireRole>} />
                    <Route path="/comptable"             element={<RequireRole roles={["ROLE_ADMIN","ROLE_COMPTABLE"]}><ComptableDashboard /></RequireRole>} />
                    <Route path="/comptable/clients"     element={<RequireRole roles={["ROLE_COMPTABLE","ROLE_ADMIN"]}><ComptableClients /></RequireRole>} />
                    <Route path="/comptable/reservations" element={<RequireRole roles={["ROLE_COMPTABLE","ROLE_ADMIN"]}><ComptableReservations /></RequireRole>} />
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
            </div>
        </div>
    );
}

export default App;
