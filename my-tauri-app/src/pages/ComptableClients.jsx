import { useEffect, useState } from "react";
import { getClients } from "../services/clientsApi";

function initials(name) {
    if (!name) return "?";
    const parts = String(name).trim().split(/\s+/);
    return parts.length >= 2
        ? (parts[0][0] + parts[1][0]).toUpperCase()
        : String(name)[0].toUpperCase();
}

function ComptableClients() {
    const [clients, setClients]   = useState([]);
    const [loading, setLoading]   = useState(true);
    const [error, setError]       = useState("");
    const [search, setSearch]     = useState("");

    const loadClients = async () => {
        setLoading(true);
        setError("");
        try {
            const payload = await getClients();
            setClients(Array.isArray(payload) ? payload : []);
        } catch (loadError) {
            setError(loadError instanceof Error ? loadError.message : "Impossible de charger les clients.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadClients(); }, []);

    const filtered = search.trim()
        ? clients.filter((c) => {
            const q = search.toLowerCase();
            return (
                (c.name    ?? "").toLowerCase().includes(q) ||
                (c.email   ?? "").toLowerCase().includes(q) ||
                (c.company ?? "").toLowerCase().includes(q)
            );
        })
        : clients;

    return (
        <>
            {/* ── En-tête ── */}
            <div className="page-header">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                        <h1 className="page-title">Clients</h1>
                        <p className="page-subtitle">Répertoire des clients et contacts associés</p>
                    </div>
                    <button className="btn-ghost btn-sm" onClick={loadClients} disabled={loading}>
                        ↻ Actualiser
                    </button>
                </div>
            </div>

            <div className="page-body">

                {/* ── Stats ── */}
                {!loading && clients.length > 0 && (
                    <div className="stat-grid" style={{ marginBottom: 28 }}>
                        <div className="stat-card">
                            <div className="stat-card-label">Clients enregistrés</div>
                            <div className="stat-card-value">{clients.length}</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-card-label">Sociétés distinctes</div>
                            <div className="stat-card-value">
                                {new Set(clients.map((c) => c.company).filter(Boolean)).size}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Erreur ── */}
                {error && (
                    <div className="alert alert-error" style={{ marginBottom: 20 }}>
                        <span>⚠</span><span>{error}</span>
                    </div>
                )}

                {/* ── Barre de recherche ── */}
                {!loading && clients.length > 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                        <div style={{ position: "relative", maxWidth: 300, flex: 1 }}>
                            <span style={{
                                position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)",
                                color: "var(--text-muted)", fontSize: 13, pointerEvents: "none",
                            }}>
                                🔍
                            </span>
                            <input
                                type="text"
                                placeholder="Rechercher nom, email, société…"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                style={{ paddingLeft: 32 }}
                            />
                        </div>
                        {search && (
                            <button className="btn-ghost btn-sm" onClick={() => setSearch("")}>
                                ✕ Effacer
                            </button>
                        )}
                    </div>
                )}

                {/* ── Tableau ── */}
                <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                    {loading && (
                        <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
                            Chargement…
                        </div>
                    )}

                    {!loading && clients.length === 0 && (
                        <div style={{ padding: "48px 24px", textAlign: "center" }}>
                            <div style={{ fontSize: 36, marginBottom: 12 }}>🏢</div>
                            <div style={{ fontWeight: 600, marginBottom: 6 }}>Aucun client</div>
                            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                                Les clients apparaîtront ici dès qu'ils seront enregistrés.
                            </div>
                        </div>
                    )}

                    {!loading && filtered.length === 0 && clients.length > 0 && (
                        <div style={{ padding: "32px 24px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
                            Aucun résultat pour "<strong>{search}</strong>".
                        </div>
                    )}

                    {!loading && filtered.length > 0 && (
                        <table>
                            <thead>
                                <tr>
                                    <th style={{ paddingLeft: 20 }}>Client</th>
                                    <th>Email</th>
                                    <th>Société</th>
                                    <th style={{ paddingRight: 20, textAlign: "right", color: "var(--text-dim)", fontFamily: "monospace", textTransform: "none", letterSpacing: 0 }}>
                                        ID
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((client) => (
                                    <tr key={client.id ?? client.email}>
                                        <td style={{ paddingLeft: 20 }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                <div style={{
                                                    width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                                                    background: "linear-gradient(135deg, #4f7cff, #7c5cfc)",
                                                    display: "flex", alignItems: "center", justifyContent: "center",
                                                    fontSize: 11, fontWeight: 700, color: "#fff",
                                                    letterSpacing: "-.02em",
                                                }}>
                                                    {initials(client.name ?? client.username)}
                                                </div>
                                                <span style={{ fontWeight: 500 }}>
                                                    {client.name ?? client.username ?? "—"}
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            <a
                                                href={`mailto:${client.email}`}
                                                style={{ color: "var(--accent)", fontSize: 13 }}
                                            >
                                                {client.email ?? "—"}
                                            </a>
                                        </td>
                                        <td>
                                            {client.company || client.societe
                                                ? <span className="badge badge-blue">{client.company ?? client.societe}</span>
                                                : <span style={{ color: "var(--text-dim)", fontStyle: "italic", fontSize: 12 }}>—</span>
                                            }
                                        </td>
                                        <td style={{ paddingRight: 20, textAlign: "right", color: "var(--text-muted)", fontFamily: "monospace", fontSize: 12 }}>
                                            #{client.id ?? "—"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* ── Compteur ── */}
                {!loading && filtered.length > 0 && (
                    <div style={{ marginTop: 12, fontSize: 12, color: "var(--text-dim)", textAlign: "right" }}>
                        {filtered.length} client{filtered.length > 1 ? "s" : ""}
                        {search && ` sur ${clients.length}`}
                    </div>
                )}
            </div>
        </>
    );
}

export default ComptableClients;
