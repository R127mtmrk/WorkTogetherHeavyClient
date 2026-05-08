import React from 'react';

function BaieCard({ baie, onDelete }) {
    const used = baie.units_total - baie.units_free;
    const pct = baie.units_total > 0 ? Math.round((used / baie.units_total) * 100) : 0;
    const barColor = pct >= 90 ? "var(--danger)" : pct >= 60 ? "var(--warning)" : "var(--success)";

    return (
        <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 20 }}>🖥️</span>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>{baie.name_bay}</div>
                        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>ID #{baie.id}</div>
                    </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span className={`badge ${pct >= 90 ? "badge-red" : pct >= 60 ? "badge-orange" : "badge-green"}`}>
                        {pct}% occupé
                    </span>
                    {onDelete && (
                        <button
                            onClick={() => onDelete(baie.id, baie.name_bay)}
                            title="Supprimer la baie"
                            style={{
                                background: "none",
                                border: "1px solid var(--danger)",
                                color: "var(--danger)",
                                borderRadius: 4,
                                padding: "2px 7px",
                                cursor: "pointer",
                                fontSize: 13,
                                lineHeight: 1.4,
                            }}
                        >
                            🗑
                        </button>
                    )}
                </div>
            </div>

            {/* Barre de progression */}
            <div style={{ background: "var(--bg-card2)", borderRadius: 4, height: 6, marginBottom: 10, overflow: "hidden" }}>
                <div style={{ width: `${pct}%`, height: "100%", background: barColor, borderRadius: 4, transition: "width .4s" }} />
            </div>

            <div style={{ display: "flex", gap: 24 }}>
                <div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".05em" }}>Total</div>
                    <div style={{ fontWeight: 700 }}>{baie.units_total}</div>
                </div>
                <div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".05em" }}>Utilisées</div>
                    <div style={{ fontWeight: 700, color: barColor }}>{used}</div>
                </div>
                <div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".05em" }}>Libres</div>
                    <div style={{ fontWeight: 700, color: "var(--success)" }}>{baie.units_free}</div>
                </div>
            </div>
        </div>
    );
}

export default BaieCard;
