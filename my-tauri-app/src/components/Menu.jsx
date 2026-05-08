// src/components/Menu.jsx
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

function SidebarSection({ label, children }) {
    return (
        <div className="sidebar-section">
            {label && <div className="sidebar-section-label">{label}</div>}
            {children}
        </div>
    );
}

function SLink({ to, icon, label }) {
    return (
        <NavLink
            to={to}
            end
            className={({ isActive }) => "sidebar-link" + (isActive ? " active" : "")}
        >
            <span className="icon">{icon}</span>
            {label}
        </NavLink>
    );
}

function Menu() {
    const navigate = useNavigate();
    const { isAuthenticated, hasRole, logout, user } = useAuth();

    const handleLogout = async () => {
        await logout();
        navigate("/", { replace: true });
    };

    if (!isAuthenticated) return null;

    const name = user?.displayName ?? user?.username ?? user?.email ?? "Utilisateur";
    const initials = name.slice(0, 2).toUpperCase();
    const mainRole = user?.roles?.[0]?.replace("ROLE_", "") ?? "USER";

    return (
        <aside className="sidebar">
            {/* Logo */}
            <div className="sidebar-logo">
                <div className="sidebar-logo-icon">W</div>
                <div>
                    <div className="sidebar-logo-text">WorkTogether</div>
                    <div className="sidebar-logo-sub">Data Solutions</div>
                </div>
            </div>

            {/* Navigation */}
            <SidebarSection label="Général">
                <SLink to="/dashboard" icon="🏠" label="Dashboard" />
                <SLink to="/offers"    icon="📦" label="Offres" />
            </SidebarSection>

            {hasRole(["ROLE_ADMIN", "ROLE_TECHNICIEN"]) && (
                <SidebarSection label="Support">
                    <SLink to="/tickets" icon="🎫" label="Tickets" />
                </SidebarSection>
            )}

            {hasRole(["ROLE_ADMIN", "ROLE_COMPTABLE"]) && (
                <SidebarSection label="Comptabilité">
                    <SLink to="/comptable"              icon="📊" label="Tableau de bord" />
                    <SLink to="/comptable/clients"      icon="👥" label="Clients" />
                    <SLink to="/comptable/reservations" icon="📋" label="Réservations" />
                </SidebarSection>
            )}

            {hasRole("ROLE_ADMIN") && (
                <SidebarSection label="Administration">
                    <SLink to="/admin/baies"        icon="🖥️"  label="Baies" />
                    <SLink to="/admin/offres"        icon="🛒"  label="Gestion Offres" />
                    <SLink to="/admin/utilisateurs"  icon="👤"  label="Utilisateurs" />
                    <SLink to="/admin/logs"          icon="📄"  label="Journaux" />
                </SidebarSection>
            )}

            {/* Footer utilisateur */}
            <div className="sidebar-footer">
                <div className="sidebar-user">
                    <div className="sidebar-avatar">{initials}</div>
                    <div>
                        <div className="sidebar-user-name">{name}</div>
                        <div className="sidebar-user-role">{mainRole}</div>
                    </div>
                </div>
                <button className="btn-logout" onClick={handleLogout}>
                    🚪 Déconnexion
                </button>
            </div>
        </aside>
    );
}

export default Menu;