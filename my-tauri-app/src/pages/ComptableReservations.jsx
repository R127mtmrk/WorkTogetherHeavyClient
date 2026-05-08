import { useEffect, useState } from "react";
import { getReservations } from "../services/reservationsApi";

function formatDate(value) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

const STATUS_MAP = {
    active:    { label: "Actif",    cls: "badge-green"  },
    pending:   { label: "En attente", cls: "badge-orange" },
    cancelled: { label: "Annulé",   cls: "badge-red"    },
    expired:   { label: "Expiré",   cls: "badge-grey"   },
};

function StatusBadge({ status }) {
    const s = STATUS_MAP[status] ?? { label: status ?? "—", cls: "badge-grey" };
    return <span className={`badge ${s.cls}`}>{s.label}</span>;
}

function ComptableReservations() {
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading]           = useState(true);
    const [error, setError]               = useState("");
    const [filter, setFilter]             = useState("all");

    const loadReservations = async () => {
        setLoading(true);
        setError("");
        try {
            const payload = await getReservations();
            setReservations(Array.isArray(payload) ? payload : []);
        } catch (loadError) {
            setError(loadError instanceof Error ? loadError.message : "Impossible de charger les réservations.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadReservations(); }, []);

    const filtered = filter === "all"
        ? reservations
        : reservations.filter((r) => r.status === filter);

    // Stats
    const totalRevenue = reservations.reduce((s, r) => s + (r.amount ?? 0), 0);
    const activeCount  = reservations.filter((r) => r.status === "active").length;
    const statuses     = [...new Set(reservations.map((r) => r.status).filter(Boolean))];

    return (
        <>
            {/* ── En-tête ── */}
            <div className="page-header">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                        <h1 className="page-title">Réservations</h1>
                        <p className="page-subtitle">Suivi de toutes les réservations clients</p>
                    </div>
                    <button className="btn-ghost btn-sm" onClick={loadReservations} disabled={loading}>
                        ↻ Actualiser
                    </button>
                </div>
            </div>

            <div className="page-body">

                {/* ── Stats ── */}
                {!loading && reservations.length > 0 && (
                    <div className="stat-grid" style={{ marginBottom: 28 }}>
                        <div className="stat-card">
                            <div className="stat-card-label">Total réservations</div>
                            <div className="stat-card-value">{reservations.length}</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-card-label">Actives</div>
                            <div className="stat-card-value" style={{ color: "var(--success)" }}>{activeCount}</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-card-label">Chiffre d'affaires</div>
                            <div className="stat-card-value">{totalRevenue.toLocaleString("fr-FR")} €</div>
                            <div className="stat-card-sub">cumul des montants</div>
                        </div>
                    </div>
                )}

                {/* ── Erreur ── */}
                {error && (
                    <div className="alert alert-error" style={{ marginBottom: 20 }}>
                        <span>⚠</span><span>{error}</span>
                    </div>
                )}

                {/* ── Barre filtres ── */}
                {!loading && reservations.length > 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                        <span className="section-label" style={{ margin: 0, flexShrink: 0 }}>Filtrer :</span>
                        <button
                            className={filter === "all" ? "btn-primary btn-sm" : "btn-secondary btn-sm"}
                            onClick={() => setFilter("all")}
                        >
                            Tous ({reservations.length})
                        </button>
                        {statuses.map((s) => {
                            const meta = STATUS_MAP[s] ?? { label: s };
                            const count = reservations.filter((r) => r.status === s).length;
                            return (
                                <button
                                    key={s}
                                    className={filter === s ? "btn-primary btn-sm" : "btn-secondary btn-sm"}
                                    onClick={() => setFilter(s)}
                                >
                                    {meta.label} ({count})
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* ── Tableau ── */}
                <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                    {loading && (
                        <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
                            Chargement…
                        </div>
                    )}

                    {!loading && reservations.length === 0 && (
                        <div style={{ padding: "48px 24px", textAlign: "center" }}>
                            <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
                            <div style={{ fontWeight: 600, marginBottom: 6 }}>Aucune réservation</div>
                            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                                Les réservations apparaîtront ici dès qu'elles seront enregistrées.
                            </div>
                        </div>
                    )}

                    {!loading && filtered.length === 0 && reservations.length > 0 && (
                        <div style={{ padding: "32px 24px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
                            Aucune réservation pour ce filtre.
                        </div>
                    )}

                    {!loading && filtered.length > 0 && (
                        <table>
                            <thead>
                                <tr>
                                    <th style={{ paddingLeft: 20 }}>N°</th>
                                    <th>Client</th>
                                    <th>Offre</th>
                                    <th>Montant</th>
                                    <th>Début</th>
                                    <th>Fin</th>
                                    <th>Statut</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((r) => (
                                    <tr key={r.id ?? `${r.client_id}-${r.offer_id}-${r.start_date}`}>
                                        <td style={{ paddingLeft: 20, color: "var(--text-muted)", fontFamily: "monospace", fontSize: 12 }}>
                                            #{r.id ?? "—"}
                                        </td>
                                        <td>
                                            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                                                <div style={{
                                                    width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                                                    background: "linear-gradient(135deg, #4f7cff, #7c5cfc)",
                                                    display: "flex", alignItems: "center", justifyContent: "center",
                                                    fontSize: 11, fontWeight: 700, color: "#fff",
                                                }}>
                                                    {(r.client_name ?? "?")[0]?.toUpperCase()}
                                                </div>
                                                <span style={{ fontWeight: 500 }}>
                                                    {r.client_name ?? r.client_id ?? "—"}
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="badge badge-blue">
                                                {r.offer_name ?? r.offer_id ?? "—"}
                                            </span>
                                        </td>
                                        <td style={{ fontWeight: 600 }}>
                                            {r.amount != null
                                                ? `${r.amount.toLocaleString("fr-FR")} €`
                                                : "—"
                                            }
                                        </td>
                                        <td style={{ color: "var(--text-muted)", fontSize: 13 }}>
                                            {formatDate(r.start_date)}
                                        </td>
                                        <td style={{ color: "var(--text-muted)", fontSize: 13 }}>
                                            {formatDate(r.end_date)}
                                        </td>
                                        <td>
                                            <StatusBadge status={r.status} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* ── Pied de page du tableau ── */}
                {!loading && filtered.length > 0 && (
                    <div style={{ marginTop: 12, fontSize: 12, color: "var(--text-dim)", textAlign: "right" }}>
                        {filtered.length} réservation{filtered.length > 1 ? "s" : ""}
                        {filter !== "all" && ` (filtre : ${STATUS_MAP[filter]?.label ?? filter})`}
                    </div>
                )}
            </div>
        </>
    );
}

export default ComptableReservations;
