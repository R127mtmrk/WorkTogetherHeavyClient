const PRIORITY_MAP = {
    critical: { label: "Critique",  cls: "badge-red",    dot: "#e05060" },
    high:     { label: "Haute",     cls: "badge-orange",  dot: "#f0a030" },
    medium:   { label: "Moyenne",   cls: "badge-blue",    dot: "#4f7cff" },
    low:      { label: "Basse",     cls: "badge-grey",    dot: "#5c6a8a" },
};

const STATUS_MAP = {
    open:        { label: "Ouvert",      cls: "badge-orange" },
    in_progress: { label: "En cours",    cls: "badge-blue"   },
    closed:      { label: "Clôturé",     cls: "badge-grey"   },
};

function PriorityDot({ priority }) {
    const p = PRIORITY_MAP[priority];
    if (!p) return null;
    return (
        <span style={{
            display: "inline-block",
            width: 7, height: 7,
            borderRadius: "50%",
            background: p.dot,
            flexShrink: 0,
            boxShadow: `0 0 5px ${p.dot}80`,
        }} />
    );
}

const TicketCard = ({ ticket, onClose, closing }) => {
    const priority = PRIORITY_MAP[ticket.priority] ?? { label: ticket.priority ?? "—", cls: "badge-grey" };
    const status   = STATUS_MAP[ticket.status]     ?? { label: ticket.status   ?? "—", cls: "badge-grey" };
    const isClosed = ticket.status === "closed";

    return (
        <div className="card" style={{
            display: "flex", flexDirection: "column", gap: 12,
            opacity: isClosed ? .55 : 1,
            transition: "opacity .2s",
        }}>
            {/* En-tête */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                    <PriorityDot priority={ticket.priority} />
                    <span style={{ fontWeight: 600, fontSize: 14, color: "var(--text)", lineHeight: 1.3 }}>
                        {ticket.title}
                    </span>
                </div>
                <div style={{ display: "flex", gap: 6, flexShrink: 0, alignItems: "center" }}>
                    <span className={`badge ${priority.cls}`}>{priority.label}</span>
                    <span className={`badge ${status.cls}`}>{status.label}</span>
                </div>
            </div>

            {/* Description */}
            {ticket.description && (
                <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.55, margin: 0 }}>
                    {ticket.description}
                </p>
            )}

            {/* Méta + action */}
            <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                paddingTop: 10, borderTop: "1px solid var(--border)",
            }}>
                <div style={{ display: "flex", gap: 16, fontSize: 12, color: "var(--text-muted)" }}>
                    <span>
                        <span style={{ color: "var(--text-dim)" }}>Ticket </span>
                        <span style={{ fontFamily: "monospace" }}>#{ticket.id}</span>
                    </span>
                    <span>
                        <span style={{ color: "var(--text-dim)" }}>Client </span>
                        <span style={{ fontFamily: "monospace" }}>#{ticket.client_id}</span>
                    </span>
                    {ticket.assigned_to && (
                        <span>
                            <span style={{ color: "var(--text-dim)" }}>Assigné </span>
                            <span style={{ fontFamily: "monospace" }}>#{ticket.assigned_to}</span>
                        </span>
                    )}
                </div>

                {!isClosed && (
                    <button
                        className="btn-ghost btn-sm"
                        onClick={() => onClose(ticket.id)}
                        disabled={closing}
                        style={{ color: "var(--success)", borderColor: "rgba(52,208,122,.25)" }}
                    >
                        ✓ Clôturer
                    </button>
                )}
            </div>
        </div>
    );
};

export default TicketCard;
