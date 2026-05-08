import { useEffect, useState } from "react";
import { ask } from "@tauri-apps/plugin-dialog";
import { listAppUsers, createAppUser, deleteAppUser } from "../services/authApi";

const ROLES = [
    { value: "ROLE_ADMIN",       label: "Administrateur",  badge: "badge-red"    },
    { value: "ROLE_COMPTABLE",   label: "Comptable",       badge: "badge-blue"   },
    { value: "ROLE_TECHNICIEN",  label: "Technicien",      badge: "badge-orange" },
];

function roleBadgeClass(role) {
    return ROLES.find(r => r.value === role)?.badge ?? "badge-grey";
}
function roleLabel(role) {
    return ROLES.find(r => r.value === role)?.label ?? role;
}

function FieldLabel({ children, required }) {
    return (
        <span style={{
            fontSize: 11, fontWeight: 700, color: "var(--text-muted)",
            textTransform: "uppercase", letterSpacing: ".09em",
            display: "block", marginBottom: 7,
        }}>
            {children}{required && <span style={{ color: "var(--danger)", marginLeft: 3 }}>*</span>}
        </span>
    );
}

function emptyForm() {
    return { email: "", username: "", password: "", role: "" };
}

function AdminUsers() {
    const [users, setUsers]     = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving]   = useState(false);
    const [error, setError]     = useState("");
    const [success, setSuccess] = useState("");
    const [form, setForm]       = useState(emptyForm());
    const [showPwd, setShowPwd] = useState(false);

    const loadUsers = async () => {
        setLoading(true);
        setError("");
        try {
            const list = await listAppUsers();
            setUsers(Array.isArray(list) ? list : []);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Impossible de charger les utilisateurs.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadUsers(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (form.password.length < 6) {
            setError("Le mot de passe doit contenir au moins 6 caractères.");
            return;
        }
        if (!form.role) {
            setError("Veuillez sélectionner un rôle.");
            return;
        }
        if (form.role === "ROLE_ADMIN") {
            const confirmed = await ask(
                `Vous êtes sur le point de créer un compte administrateur pour "${form.email.trim()}".\n\nUn administrateur a accès à toutes les fonctionnalités, y compris la gestion des utilisateurs.\n\nConfirmer la création ?`,
                { title: "Créer un compte administrateur", kind: "warning" }
            );
            if (!confirmed) return;
        }
        setSaving(true);
        setError("");
        setSuccess("");
        try {
            await createAppUser({
                email:    form.email.trim(),
                username: form.username.trim() || null,
                password: form.password,
                roles:   [form.role],
            });
            setSuccess(`Compte "${form.email.trim()}" créé avec succès.`);
            setForm(emptyForm());
            await loadUsers();
        } catch (e) {
            setError(e instanceof Error ? e.message : "Impossible de créer l'utilisateur.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (user) => {
        const isAdmin = (user.roles ?? []).includes("ROLE_ADMIN");
        const confirmed = await ask(
            `Supprimer le compte "${user.email}" ?${isAdmin ? "\n\n⚠ Ce compte a le rôle Administrateur." : ""}\n\nCette action est irréversible.`,
            { title: "Confirmer la suppression", kind: "warning" }
        );
        if (!confirmed) return;
        setError("");
        setSuccess("");
        try {
            await deleteAppUser(user.id);
            setSuccess(`Compte "${user.email}" supprimé.`);
            await loadUsers();
        } catch (e) {
            setError(e instanceof Error ? e.message : "Impossible de supprimer le compte.");
        }
    };

    const f = (k) => (e) => setForm(prev => ({ ...prev, [k]: e.target.value }));

    return (
        <>
            {/* ── En-tête ── */}
            <div className="page-header">
                <h1 className="page-title">👤 Gestion des utilisateurs </h1>
                <p className="page-subtitle">
                    Comptes propres à l'application Tauri · table <code style={{ fontSize: 12, background: "var(--bg-card2)", padding: "1px 6px", borderRadius: 4 }}>app_user</code>
                    <text style={{ color: "darkred" }}>( Accessible uniquement en tant qu'administrateur du logiciel )</text>
                </p>
            </div>

            <div className="page-body">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 24, alignItems: "start" }}>

                    {/* ── Tableau des comptes ── */}
                    <section>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                            <span className="section-label" style={{ margin: 0 }}>
                                Comptes existants
                                <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 600,
                                    background: "var(--bg-card2)", color: "var(--text-muted)",
                                    borderRadius: 20, padding: "1px 9px", letterSpacing: 0,
                                    textTransform: "none" }}>
                                    {users.length}
                                </span>
                            </span>
                            <button className="btn-ghost btn-sm" onClick={loadUsers} disabled={loading}>
                                ↻ Actualiser
                            </button>
                        </div>

                        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                            {loading && (
                                <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
                                    Chargement…
                                </div>
                            )}

                            {!loading && users.length === 0 && (
                                <div style={{ padding: "48px 24px", textAlign: "center" }}>
                                    <div style={{ fontSize: 36, marginBottom: 12 }}>👤</div>
                                    <div style={{ fontWeight: 600, marginBottom: 6 }}>Aucun compte</div>
                                    <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                                        Utilisez le formulaire pour créer le premier compte administrateur.
                                    </div>
                                </div>
                            )}

                            {!loading && users.length > 0 && (
                                <table>
                                    <thead>
                                        <tr>
                                            <th style={{ paddingLeft: 20 }}>ID</th>
                                            <th>Email</th>
                                            <th>Username</th>
                                            <th>Rôles</th>
                                            <th>Statut</th>
                                            <th style={{ textAlign: "right", paddingRight: 20 }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map((u) => (
                                            <tr key={u.id}>
                                                <td style={{ paddingLeft: 20, color: "var(--text-muted)", fontFamily: "monospace", fontSize: 12 }}>
                                                    #{u.id}
                                                </td>
                                                <td>
                                                    <div style={{ fontWeight: 500 }}>{u.email}</div>
                                                </td>
                                                <td style={{ color: u.username ? "var(--text)" : "var(--text-dim)", fontStyle: u.username ? "normal" : "italic", fontSize: 13 }}>
                                                    {u.username || "—"}
                                                </td>
                                                <td>
                                                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                                                        {(u.roles ?? []).map(r => (
                                                            <span key={r} className={`badge ${roleBadgeClass(r)}`}>
                                                                {roleLabel(r)}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td>
                                                    {u.is_active
                                                        ? <span className="badge badge-green">Actif</span>
                                                        : <span className="badge badge-red">Inactif</span>
                                                    }
                                                </td>
                                                <td style={{ textAlign: "right", paddingRight: 20 }}>
                                                    <button
                                                        className="btn-danger btn-xs"
                                                        onClick={() => handleDelete(u)}
                                                        title="Supprimer ce compte"
                                                    >
                                                        ✕
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </section>

                    {/* ── Formulaire ── */}
                    <section>
                        <span className="section-label" style={{ display: "block", marginBottom: 14 }}>
                            Nouveau compte
                        </span>
                        <div className="card">
                            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                                {/* Email */}
                                <div>
                                    <FieldLabel required>Adresse email</FieldLabel>
                                    <input
                                        type="email"
                                        placeholder="admin@exemple.com"
                                        value={form.email}
                                        onChange={f("email")}
                                        required
                                        autoComplete="off"
                                    />
                                </div>

                                {/* Username */}
                                <div>
                                    <FieldLabel>Nom d'utilisateur</FieldLabel>
                                    <input
                                        type="text"
                                        placeholder="admin (optionnel)"
                                        value={form.username}
                                        onChange={f("username")}
                                        autoComplete="off"
                                    />
                                </div>

                                {/* Mot de passe */}
                                <div>
                                    <FieldLabel required>Mot de passe</FieldLabel>
                                    <div style={{ position: "relative" }}>
                                        <input
                                            type={showPwd ? "text" : "password"}
                                            placeholder="Min. 6 caractères"
                                            value={form.password}
                                            onChange={f("password")}
                                            required
                                            minLength={6}
                                            autoComplete="new-password"
                                            style={{ paddingRight: 42 }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPwd(v => !v)}
                                            style={{
                                                position: "absolute", right: 10, top: "50%",
                                                transform: "translateY(-50%)",
                                                background: "none", border: "none",
                                                color: "var(--text-muted)", cursor: "pointer",
                                                fontSize: 15, padding: 2,
                                            }}
                                            title={showPwd ? "Masquer" : "Afficher"}
                                        >
                                            {showPwd ? "🙈" : "👁"}
                                        </button>
                                    </div>
                                    {form.password && form.password.length < 6 && (
                                        <div style={{ fontSize: 11, color: "var(--warning)", marginTop: 5 }}>
                                            ⚠ Minimum 6 caractères ({form.password.length}/6)
                                        </div>
                                    )}
                                </div>

                                {/* Rôle */}
                                <div>
                                    <FieldLabel>Rôle</FieldLabel>
                                    <select value={form.role} onChange={f("role")}>
                                        <option value="" disabled>— Sélectionner un rôle —</option>
                                        {ROLES.map(r => (
                                            <option key={r.value} value={r.value}>{r.label} ({r.value})</option>
                                        ))}
                                    </select>
                                    {form.role && (
                                        <div style={{ marginTop: 8 }}>
                                            <span className={`badge ${roleBadgeClass(form.role)}`}>
                                                {roleLabel(form.role)}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Séparateur */}
                                <div style={{ borderTop: "1px solid var(--border)", marginTop: 2 }} />

                                {/* Feedback */}
                                {error && (
                                    <div className="alert alert-error">
                                        <span>⚠</span><span>{error}</span>
                                    </div>
                                )}
                                {success && (
                                    <div className="alert alert-success">
                                        <span>✓</span><span>{success}</span>
                                    </div>
                                )}

                                {/* Boutons */}
                                <div style={{ display: "flex", gap: 8 }}>
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="btn-primary"
                                        style={{ flex: 1, justifyContent: "center", padding: "10px" }}
                                    >
                                        {saving ? "Création…" : "Créer le compte"}
                                    </button>
                                    <button
                                        type="button"
                                        className="btn-secondary btn-sm"
                                        onClick={() => { setForm(emptyForm()); setError(""); setSuccess(""); }}
                                        disabled={saving}
                                        title="Réinitialiser"
                                    >
                                        ✕
                                    </button>
                                </div>
                            </form>
                        </div>
                    </section>
                </div>
            </div>
        </>
    );
}

export default AdminUsers;