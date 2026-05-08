import { useEffect, useState } from "react";
import { getOffers } from "../services/offersApi";

function formatEur(amount) {
    return new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 0,
    }).format(amount);
}

function Offers() {
    const [offers, setOffers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError]   = useState("");

    const loadOffers = async () => {
        setLoading(true);
        setError("");
        try {
            const data = await getOffers();
            setOffers(Array.isArray(data) ? data : []);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Impossible de charger les offres.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadOffers(); }, []);

    const minPrice = offers.length ? Math.min(...offers.map((o) => o.monthly)) : 0;
    const maxPrice = offers.length ? Math.max(...offers.map((o) => o.monthly)) : 0;

    return (
        <>
            {/* ── En-tête ── */}
            <div className="page-header">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                        <h1 className="page-title">Offres commerciales</h1>
                        <p className="page-subtitle">Catalogue des offres disponibles à la souscription</p>
                    </div>
                    <button className="btn-ghost btn-sm" onClick={loadOffers} disabled={loading}>
                        ↻ Actualiser
                    </button>
                </div>
            </div>

            <div className="page-body">

                {/* ── Stats ── */}
                {!loading && offers.length > 0 && (
                    <div className="stat-grid" style={{ marginBottom: 28 }}>
                        <div className="stat-card">
                            <div className="stat-card-label">Offres disponibles</div>
                            <div className="stat-card-value">{offers.length}</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-card-label">À partir de</div>
                            <div className="stat-card-value">{formatEur(minPrice)}</div>
                            <div className="stat-card-sub">par mois</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-card-label">Jusqu'à</div>
                            <div className="stat-card-value">{formatEur(maxPrice)}</div>
                            <div className="stat-card-sub">par mois</div>
                        </div>
                    </div>
                )}

                {/* ── Erreur ── */}
                {error && (
                    <div className="alert alert-error" style={{ marginBottom: 20 }}>
                        <span>⚠</span><span>{error}</span>
                    </div>
                )}

                {/* ── Tableau ── */}
                <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                    {loading && (
                        <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
                            Chargement…
                        </div>
                    )}

                    {!loading && offers.length === 0 && (
                        <div style={{ padding: "48px 24px", textAlign: "center" }}>
                            <div style={{ fontSize: 36, marginBottom: 12 }}>📦</div>
                            <div style={{ fontWeight: 600, marginBottom: 6 }}>Aucune offre disponible</div>
                            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                                Le catalogue est vide pour le moment.
                            </div>
                        </div>
                    )}

                    {!loading && offers.length > 0 && (
                        <table>
                            <thead>
                                <tr>
                                    <th style={{ paddingLeft: 20 }}>Offre</th>
                                    <th>Unités</th>
                                    <th>Prix mensuel</th>
                                    <th>Remise</th>
                                    <th>Prix annuel <span style={{ fontWeight: 400, textTransform: "none", opacity: .7 }}>(−10 %)</span></th>
                                </tr>
                            </thead>
                            <tbody>
                                {offers.map((offer) => {
                                    const annual  = offer.monthly * 12 * 0.9;
                                    const hasDisc = offer.monthlyDiscount > 0;
                                    return (
                                        <tr key={offer.id}>
                                            <td style={{ paddingLeft: 20 }}>
                                                <span style={{ fontWeight: 600 }}>{offer.label}</span>
                                            </td>
                                            <td style={{ color: "var(--text-muted)" }}>
                                                {offer.units} u.
                                            </td>
                                            <td style={{ fontWeight: 600 }}>
                                                {formatEur(offer.monthly)}
                                            </td>
                                            <td>
                                                {hasDisc
                                                    ? <span className="badge badge-orange">−{offer.monthlyDiscount} %</span>
                                                    : <span style={{ color: "var(--text-dim)", fontSize: 12 }}>—</span>
                                                }
                                            </td>
                                            <td style={{ color: "var(--text-muted)" }}>
                                                {formatEur(annual)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </>
    );
}

export default Offers;
