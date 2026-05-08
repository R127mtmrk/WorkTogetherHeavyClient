/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
    clearStoredAuth,
    fetchCurrentUser,
    hasAnyRole,
    loginWithDatabase,
    logoutFromDatabase,
} from "../services/authApi";
import { isTauriRuntime } from "../services/tauri";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loadingAuth, setLoadingAuth] = useState(true);
    const [authError, setAuthError] = useState("");

    // ── Restauration de session ──────────────────────────────
    useEffect(() => {
        let cancelled = false;

        const restoreSession = async () => {
            try {
                const currentUser = await fetchCurrentUser();
                if (!cancelled) setUser(currentUser);
            } catch {
                clearStoredAuth();
                if (!cancelled) setUser(null);
            } finally {
                if (!cancelled) setLoadingAuth(false);
            }
        };

        restoreSession();
        return () => { cancelled = true; };
    }, []);

    // ── Déconnexion automatique à la fermeture ───────────────
    useEffect(() => {
        // 1) Navigateur standard (rechargement, fermeture onglet)
        const handleBeforeUnload = () => {
            // synchrone — on vide le localStorage directement
            clearStoredAuth();
        };
        window.addEventListener("beforeunload", handleBeforeUnload);

        // 2) Événement natif Tauri "close-requested" (clic sur la croix)
        let unlistenTauri = null;
        if (isTauriRuntime()) {
            import("@tauri-apps/api/window").then(({ getCurrentWindow }) => {
                const win = getCurrentWindow();
                win.listen("tauri://close-requested", async () => {
                    clearStoredAuth();
                    await win.destroy();
                }).then(unlisten => {
                    unlistenTauri = unlisten;
                });
            }).catch(() => {
                // fallback silencieux si l'API n'est pas disponible
            });
        }

        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
            if (unlistenTauri) unlistenTauri();
        };
    }, []);

    // ── Actions auth ─────────────────────────────────────────
    const login = async (credentials) => {
        setAuthError("");
        const session = await loginWithDatabase(credentials);
        setUser(session.user);
        return session.user;
    };

    const logout = async () => {
        try {
            await logoutFromDatabase();
        } finally {
            setUser(null);
            setAuthError("");
        }
    };

    const value = useMemo(
        () => ({
            user,
            loadingAuth,
            authError,
            isAuthenticated: Boolean(user),
            login,
            logout,
            setAuthError,
            hasRole: (roles) => hasAnyRole(user, Array.isArray(roles) ? roles : [roles]),
        }),
        [user, loadingAuth, authError],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
