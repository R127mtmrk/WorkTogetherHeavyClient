import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

function FieldLabel({ children }) {
    return (
        <span style={{
            fontSize: 11, fontWeight: 700,
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: ".09em",
            display: "block",
            marginBottom: 7,
        }}>
            {children}
        </span>
    );
}

function Login() {
    const navigate = useNavigate();
    const { isAuthenticated, loadingAuth, login, setAuthError } = useAuth();
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword]     = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError]   = useState("");

    useEffect(() => {
        if (isAuthenticated) navigate("/dashboard", { replace: true });
    }, [isAuthenticated, navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setFormError("");
        setAuthError("");
        if (!identifier.trim() || !password) {
            setFormError("Veuillez renseigner votre email et mot de passe.");
            return;
        }
        setIsSubmitting(true);
        try {
            await login({ identifier: identifier.trim(), password });
            navigate("/dashboard", { replace: true });
        } catch (err) {
            const msg = err instanceof Error ? err.message
                : typeof err === "string" ? err
                : "Connexion impossible.";
            setFormError(msg);
            setAuthError(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loadingAuth) {
        return (
            <div className="login-wrapper">
                <p style={{ color: "var(--text-muted)", fontSize: 13 }}>Vérification de la session…</p>
            </div>
        );
    }

    return (
        <div className="login-wrapper">
            <div style={{ width: "100%", maxWidth: 400 }}>

                {/* ── Logo ── */}
                <div style={{ textAlign: "center", marginBottom: 44 }}>
                    <div style={{
                        width: 58, height: 58,
                        background: "linear-gradient(135deg, #4f7cff 0%, #7c5cfc 100%)",
                        borderRadius: 16,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 26, fontWeight: 800, color: "#fff",
                        marginBottom: 16,
                        boxShadow: "0 6px 28px rgba(79,124,255,.4)",
                        letterSpacing: "-.02em",
                    }}>W</div>
                    <div style={{
                        fontSize: 21, fontWeight: 800,
                        color: "var(--text)",
                        letterSpacing: "-.03em",
                        lineHeight: 1.2,
                    }}>WorkTogether</div>
                    <div style={{
                        fontSize: 12.5,
                        color: "var(--text-muted)",
                        marginTop: 6,
                        letterSpacing: ".02em",
                    }}>
                        Data Solutions &mdash; Espace backoffice
                    </div>
                </div>

                {/* ── Card formulaire ── */}
                <div style={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                    borderRadius: 14,
                    padding: "32px 34px 28px",
                    boxShadow: "var(--shadow-lg)",
                }}>
                    <div style={{ marginBottom: 26 }}>
                        <h2 style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-.02em" }}>
                            Connexion
                        </h2>
                        <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 5 }}>
                            Accès sécurisé via la base de données.
                        </p>
                    </div>

                    <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 18 }}>

                        {/* Email */}
                        <div>
                            <FieldLabel>Adresse email</FieldLabel>
                            <input
                                type="text"
                                placeholder="admin@exemple.com"
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                autoComplete="username"
                                autoFocus
                            />
                        </div>

                        {/* Mot de passe */}
                        <div>
                            <FieldLabel>Mot de passe</FieldLabel>
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="current-password"
                            />
                        </div>

                        {/* Erreur */}
                        {formError && (
                            <div className="alert alert-error">
                                <span>⚠</span>
                                <span>{formError}</span>
                            </div>
                        )}

                        {/* Bouton */}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="btn-primary btn-block"
                            style={{ marginTop: 4, letterSpacing: ".01em" }}
                        >
                            {isSubmitting ? (
                                <>
                                    <span style={{ opacity: .7 }}>⏳</span>
                                    Connexion en cours…
                                </>
                            ) : (
                                <>Se connecter</>
                            )}
                        </button>
                    </form>
                </div>

                {/* ── Pied ── */}
                <p style={{
                    textAlign: "center",
                    marginTop: 24,
                    fontSize: 11.5,
                    color: "var(--text-dim)",
                    letterSpacing: ".02em",
                }}>
                    WorkTogether © 2026 &nbsp;·&nbsp; Application desktop Tauri
                </p>
            </div>
        </div>
    );
}

export default Login;