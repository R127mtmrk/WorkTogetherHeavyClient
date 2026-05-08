import { useEffect, useState } from "react";
import TicketCard from "../components/TicketCard";
import { invokeCommand } from "../services/tauri";

const PRIORITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };

const Tickets = () => {
    const [tickets, setTickets]   = useState([]);
    const [loading, setLoading]   = useState(true);
    const [closing, setClosing]   = useState(false);
    const [error, setError]       = useState("");
    const [filter, setFilter]     = useState("open");

    const loadTickets = async () => {
        setError("");
        setLoading(true);
        try {
            const data = await invokeCommand("get_tickets");
            setTickets(Array.isArray(data) ? data : []);
        } catch (loadError) {
            setError(loadError instanceof Error ? loadError.message : "Fonctionnalité disponible prochainement !");
        } finally {
            setLoading(false);
        }
    };

    const closeTicket = async (id) => {
        setClosing(true);
        setError("");
        try {
            await invokeCommand("close_ticket", { id });
            await loadTickets();
        } catch (closeError) {
            setError(closeError instanceof Error ? closeError.message : "Impossible de clôturer le ticket.");
        } finally {
            setClosing(false);
        }
    };

    useEffect(() => { loadTickets(); }, []);

    // Stats
    const openCount     = tickets.filter((t) => t.status !== "closed").length;
    const closedCount   = tickets.filter((t) => t.status === "closed").length;
    const criticalCount = tickets.filter((t) => t.priority === "critical" && t.status !== "closed").length;

    // Filtre + tri par priorité
    const filtered = tickets
        .filter((t) => filter === "all" ? true : filter === "open" ? t.status !== "closed" : t.status === "closed")
        .sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9));

    return (
        <>
            {/* ── En-tête ── */}
            <div className="page-header">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                        <h1 className="page-title">Tickets clients</h1>
                        <p className="page-subtitle">Suivi et traitement des demandes d'assistance</p>
                    </div>
                    <button className="btn-ghost btn-sm" onClick={loadTickets} disabled={loading}>
                        ↻ Actualiser
                    </button>
                </div>
            </div>

            <div className="page-body">

                {/* ── Stats ── */}
                {!loading && tickets.length > 0 && (
                    <div className="stat-grid" style={{ marginBottom: 28 }}>
                        <div className="stat-card">
                            <div className="stat-card-label">Tickets ouverts</div>
                            <div className="stat-card-value" style={{ color: openCount > 0 ? "var(--warning)" : "var(--success)" }}>
                                {openCount}
                            </div>
                        </div>
                        {criticalCount > 0 && (
                            <div className="stat-card">
                                <div className="stat-card-label">Critiques</div>
                                <div className="stat-card-value" style={{ color: "var(--danger)" }}>{criticalCount}</div>
                                <div className="stat-card-sub">à traiter en priorité</div>
                            </div>
                        )}
                        <div className="stat-card">
                            <div className="stat-card-label">Clôturés</div>
                            <div className="stat-card-value" style={{ color: "var(--text-muted)" }}>{closedCount}</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-card-label">Total</div>
                            <div className="stat-card-value">{tickets.length}</div>
                        </div>
                    </div>
                )}

                {/* ── Erreur ── */}
                {error && (
                    <div className="alert alert-error" style={{ marginBottom: 20 }}>
                        <span>⚠</span><span>{error}</span>
                    </div>
                )}

                {/* ── Filtres ── */}
                {!loading && tickets.length > 0 && (
                    <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                        {[
                            { key: "open",   label: `Ouverts (${openCount})`   },
                            { key: "closed", label: `Clôturés (${closedCount})` },
                            { key: "all",    label: `Tous (${tickets.length})`  },
                        ].map(({ key, label }) => (
                            <button
                                key={key}
                                className={filter === key ? "btn-primary btn-sm" : "btn-secondary btn-sm"}
                                onClick={() => setFilter(key)}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                )}

                {/* ── Contenu ── */}
                {loading && (
                    <div className="card" style={{ padding: 40, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
                        Chargement…
                    </div>
                )}

                {!loading && tickets.length === 0 && !error && (
                    <div className="card" style={{ padding: "48px 24px", textAlign: "center" }}>
                        <div style={{ fontSize: 36, marginBottom: 12 }}>🎉</div>
                        <div style={{ fontWeight: 600, marginBottom: 6 }}>Aucun ticket ouvert</div>
                        <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                            Tout est en ordre — aucune demande en attente.
                        </div>
                    </div>
                )}

                {!loading && filtered.length === 0 && tickets.length > 0 && (
                    <div style={{ padding: "24px 0", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
                        Aucun ticket dans cette catégorie.
                    </div>
                )}

                {!loading && filtered.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {filtered.map((ticket) => (
                            <TicketCard
                                key={ticket.id}
                                ticket={ticket}
                                onClose={closeTicket}
                                closing={closing}
                            />
                        ))}
                    </div>
                )}

                {/* ── Compteur ── */}
                {!loading && filtered.length > 0 && (
                    <div style={{ marginTop: 16, fontSize: 12, color: "var(--text-dim)", textAlign: "right" }}>
                        {filtered.length} ticket{filtered.length > 1 ? "s" : ""}
                    </div>
                )}
            </div>
        </>
    );
};

export default Tickets;
