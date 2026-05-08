import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function RequireRole({ roles = [], children }) {
    const { user, loadingAuth, hasRole } = useAuth();

    if (loadingAuth) {
        return <p>Chargement de la session...</p>;
    }

    if (!user) {
        return <Navigate to="/" replace />;
    }

    if (!hasRole(roles)) {
        return <p>Acces refuse</p>;
    }

    return children;
}