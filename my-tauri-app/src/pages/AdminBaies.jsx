import { useEffect, useState } from "react";
import { ask } from "@tauri-apps/plugin-dialog";
import BaieCard from "../components/BaieCard";
import { invokeCommand } from "../services/tauri";
import { logger } from "../services/logger";

const AdminBaies = () => {
    const [baies, setBaies] = useState([]);
    const [name, setName] = useState("");
    const [unitsTotal, setUnitsTotal] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const deleteBaie = async (id, name) => {
        const confirmed = await ask(`Supprimer la baie "${name}" ? Cette action est irréversible.`, { title: "Confirmer la suppression", kind: "warning" });
        if (!confirmed) return;
        try {
            await invokeCommand("delete_baie", { id });
            logger.action("Suppression baie", { id, name });
            await loadBaies();
        } catch (e) {
            setError(typeof e === "string" ? e : e instanceof Error ? e.message : "Impossible de supprimer la baie.");
        }
    };

    const loadBaies = async () => {
        setError("");
        setLoading(true);
        try {
            const data = await invokeCommand("get_baies");
            setBaies(Array.isArray(data) ? data : []);
        } catch (e) {
            setError(typeof e === "string" ? e : e instanceof Error ? e.message : "Impossible de charger les baies.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadBaies(); }, []);

    const addBaie = async (e) => {
        e.preventDefault();
        if (!name.trim()) { setError("Le nom de la baie est obligatoire."); return; }
        setSaving(true);
        setError("");
        setSuccess("");
        try {
            await invokeCommand("add_baie", { name: name.trim(), unitsTotal: Number(unitsTotal) });
            logger.action("Ajout baie", { name: name.trim(), unitsTotal: Number(unitsTotal) });
            setSuccess(`Baie "${name.trim()}" ajoutée avec succès.`);
            setName("");
            setUnitsTotal(1);
            await loadBaies();
        } catch (e) {
            setError(e instanceof Error ? e.message : "Impossible d'ajouter la baie.");
        } finally {
            setSaving(false);
        }
    };

    // Stats globales
    const totalUnits = baies.reduce((s, b) => s + b.units_total, 0);
    const freeUnits  = baies.reduce((s, b) => s + b.units_free, 0);
    const usedUnits  = totalUnits - freeUnits;
    const globalPct  = totalUnits > 0 ? Math.round((usedUnits / totalUnits) * 100) : 0;

    return (
        <>
            <div className="page-header">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                        <h1 className="page-title">🖥️ Gestion des baies</h1>
                        <p className="page-subtitle">Administration des baies serveur et suivi de l'occupation</p>
                    </div>
                    <button
                        onClick={loadBaies}
                        disabled={loading}
                        className="btn-primary"
                        style={{ marginTop: 4 }}
                    >
                        {loading ? "⏳ Chargement…" : "🔄 Actualiser"}
                    </button>
                </div>
            </div>

            <div className="page-body">

                {/* Stats globales */}
                {!loading && baies.length > 0 && (
                    <div className="stat-grid" style={{ marginBottom: 28 }}>
                        <div className="stat-card">
                            <div className="stat-card-label">Baies totales</div>
                            <div className="stat-card-value">{baies.length}</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-card-label">Unités totales</div>
                            <div className="stat-card-value">{totalUnits}</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-card-label">Unités libres</div>
                            <div className="stat-card-value" style={{ color: "var(--success)" }}>{freeUnits}</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-card-label">Taux d'occupation</div>
                            <div className="stat-card-value" style={{ color: globalPct >= 90 ? "var(--danger)" : globalPct >= 60 ? "var(--warning)" : "var(--success)" }}>
                                {globalPct}%
                            </div>
                        </div>
                    </div>
                )}

                <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24, alignItems: "start" }}>

                    {/* Liste des baies */}
                    <section>
                        <h2 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 14 }}>
                            Baies ({baies.length})
                        </h2>

                        {loading && (
                            <div className="card" style={{ color: "var(--text-muted)", textAlign: "center", padding: 40 }}>
                                Chargement…
                            </div>
                        )}
                        {!loading && baies.length === 0 && (
                            <div className="card" style={{ color: "var(--text-muted)", textAlign: "center", padding: 40 }}>
                                <div style={{ fontSize: 32, marginBottom: 8 }}>🖥️</div>
                                Aucune baie pour le moment.<br />
                                <span style={{ fontSize: 12 }}>Utilisez le formulaire pour en ajouter une.</span>
                            </div>
                        )}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
                            {!loading && baies.map((baie) => (
                                <BaieCard key={baie.id} baie={baie} onDelete={deleteBaie} />
                            ))}
                        </div>
                    </section>

                    {/* Formulaire d'ajout */}
                    <section>
                        <h2 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 14 }}>
                            Ajouter une baie
                        </h2>
                        <div className="card">
                            <form onSubmit={addBaie} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                                <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".06em" }}>
                                        Nom *
                                    </span>
                                    <input
                                        type="text"
                                        placeholder="ex: B#01"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        style={{ width: "100%" }}
                                    />
                                </label>
                                <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".06em" }}>
                                        Unités totales *
                                    </span>
                                    <input
                                        type="number"
                                        min="1"
                                        placeholder="ex: 42"
                                        value={unitsTotal}
                                        onChange={(e) => setUnitsTotal(e.target.value)}
                                        style={{ width: "100%" }}
                                    />
                                </label>

                                {error && (
                                    <div style={{ background: "#3d1111", border: "1px solid #7a2020", color: "#f08080", padding: "10px 12px", borderRadius: 6, fontSize: 13 }}>
                                        ⚠️ {error}
                                    </div>
                                )}
                                {success && (
                                    <div style={{ background: "#0d3325", border: "1px solid #1a6644", color: "#43c97e", padding: "10px 12px", borderRadius: 6, fontSize: 13 }}>
                                        ✅ {success}
                                    </div>
                                )}

                                <button type="submit" disabled={saving} className="btn-primary" style={{ width: "100%" }}>
                                    {saving ? "Ajout…" : "➕ Ajouter la baie"}
                                </button>
                            </form>
                        </div>
                    </section>
                </div>
            </div>
        </>
    );
};

export default AdminBaies;
