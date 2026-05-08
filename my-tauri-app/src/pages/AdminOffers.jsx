import { useEffect, useState } from "react";
import { ask } from "@tauri-apps/plugin-dialog";
import { getOffers, createOffer, updateOffer, deleteOffer } from "../services/offersApi";
import { getReservations } from "../services/reservationsApi";
import { logger } from "../services/logger";

function emptyOffer() {
    return { label: "", units: 1, monthly: 0, monthlyDiscount: 0 };
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

function AdminOffers() {
    const [offers, setOffers]           = useState([]);
    const [usedOfferIds, setUsedOfferIds] = useState(new Set());
    const [loading, setLoading]         = useState(true);
    const [saving, setSaving]           = useState(false);
    const [error, setError]             = useState("");
    const [success, setSuccess]         = useState("");
    const [form, setForm]               = useState(emptyOffer());
    const [isEditing, setIsEditing]     = useState(false);
    const [editId, setEditId]           = useState(null);

    const loadOffers = async () => {
        setLoading(true);
        setError("");
        try {
            const [data, reservations] = await Promise.all([getOffers(), getReservations()]);
            setOffers(Array.isArray(data) ? data : []);
            const ids = new Set(
                (Array.isArray(reservations) ? reservations : [])
                    .map((r) => r.offer_id)
                    .filter(Boolean)
            );
            setUsedOfferIds(ids);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Erreur de chargement des offres.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadOffers(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError("");
        setSuccess("");
        try {
            if (isEditing && editId) {
                await updateOffer(editId, form);
                logger.action("Modification offre", { id: editId, label: form.label });
                setSuccess(`Offre "${form.label}" mise à jour.`);
            } else {
                await createOffer(form);
                logger.action("Création offre", { label: form.label, monthly: form.monthly });
                setSuccess(`Offre "${form.label}" créée.`);
            }
            setForm(emptyOffer());
            setIsEditing(false);
            setEditId(null);
            await loadOffers();
        } catch (e) {
            setError(e instanceof Error ? e.message : "Erreur lors de l'enregistrement.");
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (offer) => {
        setForm({ label: offer.label, units: offer.units, monthly: offer.monthly, monthlyDiscount: offer.monthlyDiscount ?? 0 });
        setIsEditing(true);
        setEditId(offer.id);
        setError("");
        setSuccess("");
    };

    const handleDelete = async (offer) => {
        const confirmed = await ask(`Supprimer l'offre "${offer.label}" ?`, { title: "Confirmer la suppression", kind: "warning" });
        if (!confirmed) return;
        setSaving(true);
        setError("");
        setSuccess("");
        try {
            await deleteOffer(offer.id);
            logger.action("Suppression offre", { id: offer.id, label: offer.label });
            setSuccess(`Offre "${offer.label}" supprimée.`);
            await loadOffers();
        } catch (e) {
            setError(e instanceof Error ? e.message : "Erreur lors de la suppression.");
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setForm(emptyOffer());
        setIsEditing(false);
        setEditId(null);
        setError("");
        setSuccess("");
    };

    const f = (k) => (e) => setForm(prev => ({ ...prev, [k]: e.target.value }));
    const fNum = (k) => (e) => setForm(prev => ({ ...prev, [k]: Number(e.target.value) }));

    // Stats
    const avgPrice = offers.length
        ? Math.round(offers.reduce((s, o) => s + o.monthly, 0) / offers.length)
        : 0;
    const activeOffers = usedOfferIds.size;

    return (
        <>
            {/* ── En-tête ── */}
            <div className="page-header">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                        <h1 className="page-title">Offres commerciales</h1>
                        <p className="page-subtitle">Gestion du catalogue d'offres et tarification</p>
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
                            <div className="stat-card-label">Offres au catalogue</div>
                            <div className="stat-card-value">{offers.length}</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-card-label">Offres actives</div>
                            <div className="stat-card-value" style={{ color: "var(--success)" }}>{activeOffers}</div>
                            <div className="stat-card-sub">avec réservations en cours</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-card-label">Prix moyen</div>
                            <div className="stat-card-value">{avgPrice} €</div>
                            <div className="stat-card-sub">par mois</div>
                        </div>
                    </div>
                )}

                <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24, alignItems: "start" }}>

                    {/* ── Tableau ── */}
                    <section>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                            <span className="section-label" style={{ margin: 0 }}>
                                Catalogue
                                <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 600,
                                    background: "var(--bg-card2)", color: "var(--text-muted)",
                                    borderRadius: 20, padding: "1px 9px", letterSpacing: 0,
                                    textTransform: "none" }}>
                                    {offers.length}
                                </span>
                            </span>
                        </div>

                        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                            {loading && (
                                <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
                                    Chargement…
                                </div>
                            )}
                            {!loading && offers.length === 0 && (
                                <div style={{ padding: "48px 24px", textAlign: "center" }}>
                                    <div style={{ fontSize: 36, marginBottom: 12 }}>📦</div>
                                    <div style={{ fontWeight: 600, marginBottom: 6 }}>Aucune offre</div>
                                    <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                                        Utilisez le formulaire pour créer votre première offre.
                                    </div>
                                </div>
                            )}
                            {!loading && offers.length > 0 && (
                                <table>
                                    <thead>
                                        <tr>
                                            <th style={{ paddingLeft: 20 }}>Nom</th>
                                            <th>Unités</th>
                                            <th>Prix / mois</th>
                                            <th>Remise</th>
                                            <th>Statut</th>
                                            <th style={{ textAlign: "right", paddingRight: 20 }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {offers.map((offer) => {
                                            const isUsed    = usedOfferIds.has(offer.id);
                                            const isActive  = editId === offer.id;
                                            return (
                                                <tr key={offer.id} style={isActive ? { background: "var(--accent-muted)" } : {}}>
                                                    <td style={{ paddingLeft: 20 }}>
                                                        <span style={{ fontWeight: 600 }}>{offer.label}</span>
                                                    </td>
                                                    <td style={{ color: "var(--text-muted)" }}>
                                                        {offer.units} u.
                                                    </td>
                                                    <td style={{ fontWeight: 600 }}>
                                                        {offer.monthly.toLocaleString("fr-FR")} €
                                                    </td>
                                                    <td>
                                                        {offer.monthlyDiscount > 0
                                                            ? <span className="badge badge-orange">−{offer.monthlyDiscount} %</span>
                                                            : <span style={{ color: "var(--text-dim)", fontSize: 12 }}>—</span>
                                                        }
                                                    </td>
                                                    <td>
                                                        {isUsed
                                                            ? <span className="badge badge-green">Actif</span>
                                                            : <span className="badge badge-grey">Libre</span>
                                                        }
                                                    </td>
                                                    <td style={{ textAlign: "right", paddingRight: 20 }}>
                                                        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                                                            <button
                                                                className="btn-ghost btn-xs"
                                                                onClick={() => handleEdit(offer)}
                                                                title="Modifier"
                                                            >
                                                                ✎ Éditer
                                                            </button>
                                                            <button
                                                                className="btn-danger btn-xs"
                                                                onClick={() => handleDelete(offer)}
                                                                disabled={isUsed || saving}
                                                                title={isUsed ? "Offre utilisée par une réservation" : "Supprimer"}
                                                                style={isUsed ? { opacity: .3, cursor: "not-allowed" } : {}}
                                                            >
                                                                ✕
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </section>

                    {/* ── Formulaire ── */}
                    <section>
                        <span className="section-label" style={{ display: "block", marginBottom: 14 }}>
                            {isEditing ? "Modifier l'offre" : "Nouvelle offre"}
                        </span>
                        <div className="card">
                            {isEditing && (
                                <div style={{
                                    display: "flex", alignItems: "center", gap: 8,
                                    background: "var(--accent-muted)", border: "1px solid rgba(79,124,255,.2)",
                                    borderRadius: "var(--radius-sm)", padding: "8px 12px",
                                    marginBottom: 16, fontSize: 12, color: "var(--accent)",
                                }}>
                                    <span>✎</span>
                                    <span>Mode édition — <strong>{form.label || "…"}</strong></span>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>

                                <div>
                                    <FieldLabel required>Nom de l'offre</FieldLabel>
                                    <input
                                        type="text"
                                        placeholder="ex: Start-up"
                                        value={form.label}
                                        onChange={f("label")}
                                        required
                                        autoComplete="off"
                                    />
                                </div>

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                                    <div>
                                        <FieldLabel required>Unités</FieldLabel>
                                        <input
                                            type="number"
                                            min={1}
                                            value={form.units}
                                            onChange={fNum("units")}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <FieldLabel required>Prix / mois (€)</FieldLabel>
                                        <input
                                            type="number"
                                            min={0}
                                            value={form.monthly}
                                            onChange={fNum("monthly")}
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <FieldLabel>Remise mensuelle (%)</FieldLabel>
                                    <input
                                        type="number"
                                        min={0}
                                        max={100}
                                        value={form.monthlyDiscount}
                                        onChange={fNum("monthlyDiscount")}
                                        placeholder="0"
                                    />
                                    {form.monthlyDiscount > 0 && form.monthly > 0 && (
                                        <div style={{ fontSize: 11, color: "var(--warning)", marginTop: 5 }}>
                                            Prix après remise : {Math.round(form.monthly * (1 - form.monthlyDiscount / 100)).toLocaleString("fr-FR")} €
                                        </div>
                                    )}
                                </div>

                                <div style={{ borderTop: "1px solid var(--border)", marginTop: 2 }} />

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

                                <div style={{ display: "flex", gap: 8 }}>
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="btn-primary"
                                        style={{ flex: 1, justifyContent: "center", padding: "10px" }}
                                    >
                                        {saving
                                            ? (isEditing ? "Enregistrement…" : "Création…")
                                            : (isEditing ? "Enregistrer" : "Créer l'offre")
                                        }
                                    </button>
                                    {isEditing && (
                                        <button
                                            type="button"
                                            className="btn-secondary btn-sm"
                                            onClick={handleCancel}
                                            disabled={saving}
                                            title="Annuler"
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>
                    </section>
                </div>
            </div>
        </>
    );
}

export default AdminOffers;
