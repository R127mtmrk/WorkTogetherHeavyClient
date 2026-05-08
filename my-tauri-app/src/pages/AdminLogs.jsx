import { useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { ask } from "@tauri-apps/plugin-dialog";

const LEVELS = ["ALL", "INFO", "WARN", "ERROR"];

const LEVEL_STYLES = {
    INFO:  { color: "#6db3f2", bg: "rgba(79,124,255,.12)",  label: "INFO"  },
    WARN:  { color: "#f0a040", bg: "rgba(240,160,64,.12)",  label: "WARN"  },
    ERROR: { color: "#e05555", bg: "rgba(224,85,85,.12)",   label: "ERROR" },
    DEBUG: { color: "#9b8fd4", bg: "rgba(155,143,212,.12)", label: "DEBUG" },
    TRACE: { color: "#6b7280", bg: "rgba(107,114,128,.10)", label: "TRACE" },
};

// Traduit les requêtes SQL brutes en descriptions lisibles
const SQL_RULES = [
    [/SELECT \* FROM ticket WHERE status='open'/i,          "Lecture des tickets ouverts"],
    [/UPDATE ticket SET status = 'closed'/i,                "Fermeture d'un ticket"],
    [/INSERT INTO ticket/i,                                 "Création d'un ticket"],
    [/SELECT \* FROM ticket/i,                              "Lecture des tickets"],
    [/INSERT INTO app_user/i,                               "Création d'un compte utilisateur"],
    [/DELETE FROM app_user WHERE id/i,                      "Suppression d'un compte utilisateur"],
    [/SELECT.*FROM app_user WHERE email/i,                  "Recherche d'un utilisateur par email"],
    [/SELECT COUNT\(\*\) FROM app_user/i,                   "Comptage des utilisateurs"],
    [/SELECT.*FROM app_user ORDER BY id/i,                  "Liste de tous les utilisateurs"],
    [/INSERT INTO bay/i,                                    "Création d'une baie serveur"],
    [/DELETE FROM bay WHERE id/i,                           "Suppression d'une baie serveur"],
    [/SELECT.*FROM bay.*LEFT JOIN unit/i,                   "Lecture des baies avec occupation"],
    [/INSERT INTO user/i,                                   "Création d'un utilisateur Symfony"],
    [/SELECT \* FROM user WHERE email/i,                    "Recherche d'un utilisateur Symfony"],
    [/SELECT COUNT\(\*\) FROM bay/i,                        "Comptage des baies"],
    [/SELECT COUNT\(\*\) FROM offer/i,                      "Comptage des offres"],
    [/SELECT COUNT\(\*\) FROM `order`/i,                    "Comptage des commandes"],
    [/SELECT.*AVG\(taux\).*FROM/i,                          "Calcul du taux d'occupation moyen"],
    [/CREATE TABLE IF NOT EXISTS.*app_user/i,               "Migration : création de la table utilisateurs"],
    [/ALTER TABLE bay ADD COLUMN units_total/i,             "Migration : ajout colonne capacité totale (baie)"],
    [/ALTER TABLE bay ADD COLUMN units_free/i,              "Migration : ajout colonne unités libres (baie)"],
];

function humanizeSql(line) {
    for (const [pattern, label] of SQL_RULES) {
        if (pattern.test(line)) {
            // Remplace la portion SQL par le label, conserve le reste (timestamp, niveau…)
            return line.replace(pattern, `« ${label} »`);
        }
    }
    return line;
}

function parseLevel(line) {
    const up = line.toUpperCase();
    if (up.includes(" ERROR") || up.includes("[ERROR]")) return "ERROR";
    if (up.includes(" WARN")  || up.includes("[WARN]"))  return "WARN";
    if (up.includes(" DEBUG") || up.includes("[DEBUG]")) return "DEBUG";
    if (up.includes(" TRACE") || up.includes("[TRACE]")) return "TRACE";
    return "INFO";
}

function LogLine({ line, index }) {
    if (!line.trim()) return null;
    const level = parseLevel(line);
    const style = LEVEL_STYLES[level] ?? LEVEL_STYLES.INFO;
    const display = humanizeSql(line);

    return (
        <div style={{
            display: "grid",
            gridTemplateColumns: "28px 52px 1fr",
            gap: 10,
            padding: "4px 14px",
            borderBottom: "1px solid rgba(255,255,255,.03)",
            background: index % 2 === 0 ? "transparent" : "rgba(255,255,255,.015)",
            fontFamily: "monospace",
            fontSize: 12,
            alignItems: "baseline",
        }}>
            <span style={{ color: "var(--text-dim)", fontSize: 11 }}>
                {index + 1}
            </span>
            <span style={{
                color: style.color,
                background: style.bg,
                borderRadius: 3,
                padding: "1px 5px",
                fontWeight: 700,
                fontSize: 10,
                textAlign: "center",
            }}>
                {style.label}
            </span>
            <span style={{ color: "var(--text)", wordBreak: "break-all", lineHeight: 1.6 }}>
                {display}
            </span>
        </div>
    );
}

function AdminLogs() {
    const [files, setFiles]       = useState([]);
    const [selected, setSelected] = useState(null);
    const [rawLines, setRawLines] = useState([]);
    const [filter, setFilter]     = useState("ALL");
    const [search, setSearch]     = useState("");
    const [loading, setLoading]   = useState(false);
    const [error, setError]       = useState("");
    const [autoScroll, setAutoScroll] = useState(true);
    const bottomRef = useRef(null);

    const loadFiles = async () => {
        try {
            const list = await invoke("list_log_files");
            setFiles(list);
            if (list.length > 0 && !selected) {
                setSelected(list[0].name);
            }
        } catch (e) {
            setError(typeof e === "string" ? e : "Impossible de lister les fichiers de logs.");
        }
    };

    const loadLog = async (filename) => {
        if (!filename) return;
        setLoading(true);
        setError("");
        try {
            const content = await invoke("read_log_file", { filename });
            setRawLines(content.split("\n"));
        } catch (e) {
            setError(typeof e === "string" ? e : "Impossible de lire le fichier.");
            setRawLines([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!selected) return;
        const confirmed = await ask(
            `Supprimer définitivement le fichier "${selected}" ?\n\nCette action est irréversible.`,
            { title: "Supprimer le fichier de log", kind: "warning" }
        );
        if (!confirmed) return;
        try {
            await invoke("delete_log_file", { filename: selected });
            setRawLines([]);
            setSelected(null);
            await loadFiles();
        } catch (e) {
            setError(typeof e === "string" ? e : "Impossible de supprimer le fichier.");
        }
    };

    useEffect(() => { loadFiles(); }, []);

    useEffect(() => {
        if (selected) loadLog(selected);
    }, [selected]);

    useEffect(() => {
        if (autoScroll && bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [rawLines, autoScroll]);

    const visibleLines = rawLines.filter(line => {
        if (!line.trim()) return false;
        if (filter !== "ALL" && parseLevel(line) !== filter) return false;
        if (search && !line.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });

    const counts = { INFO: 0, WARN: 0, ERROR: 0 };
    rawLines.forEach(l => {
        const lv = parseLevel(l);
        if (lv in counts) counts[lv]++;
    });

    return (
        <>
            <div className="page-header">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                        <h1 className="page-title">Journaux d'activité</h1>
                        <p className="page-subtitle">Fichiers .log de l'application — suppression automatique après 30 jours</p>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                        <button className="btn-ghost btn-sm" onClick={() => { loadFiles(); if (selected) loadLog(selected); }}>
                            ↻ Actualiser
                        </button>
                        <button
                            className="btn-danger btn-sm"
                            onClick={handleDelete}
                            disabled={!selected}
                            title="Supprimer ce fichier de log"
                        >
                            🗑 Supprimer
                        </button>
                    </div>
                </div>
            </div>

            <div className="page-body">

                {/* ── Sélecteur de fichier + stats ── */}
                <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
                    <select
                        value={selected ?? ""}
                        onChange={e => setSelected(e.target.value)}
                        style={{ minWidth: 240 }}
                    >
                        {files.length === 0 && <option value="">Aucun fichier</option>}
                        {files.map(f => (
                            <option key={f.name} value={f.name}>
                                {f.name} — {(f.size / 1024).toFixed(1)} Ko — {f.modified}
                            </option>
                        ))}
                    </select>

                    <div style={{ display: "flex", gap: 6 }}>
                        {Object.entries(counts).map(([lv, n]) => (
                            <span key={lv} style={{
                                background: LEVEL_STYLES[lv].bg,
                                color: LEVEL_STYLES[lv].color,
                                border: `1px solid ${LEVEL_STYLES[lv].color}44`,
                                borderRadius: 4, padding: "2px 8px",
                                fontSize: 11, fontWeight: 700,
                            }}>
                                {lv} {n}
                            </span>
                        ))}
                    </div>
                </div>

                {/* ── Filtres ── */}
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
                    <div style={{ display: "flex", gap: 4 }}>
                        {LEVELS.map(lv => (
                            <button
                                key={lv}
                                onClick={() => setFilter(lv)}
                                className={filter === lv ? "btn-primary btn-xs" : "btn-ghost btn-xs"}
                            >
                                {lv}
                            </button>
                        ))}
                    </div>
                    <input
                        type="text"
                        placeholder="Rechercher…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{ flex: 1, minWidth: 180, maxWidth: 320 }}
                    />
                    <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-muted)", cursor: "pointer" }}>
                        <input
                            type="checkbox"
                            checked={autoScroll}
                            onChange={e => setAutoScroll(e.target.checked)}
                        />
                        Scroll auto
                    </label>
                    <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--text-dim)" }}>
                        {visibleLines.length} ligne{visibleLines.length !== 1 ? "s" : ""}
                        {rawLines.length > 0 && ` / ${rawLines.filter(l => l.trim()).length}`}
                    </span>
                </div>

                {/* ── Viewer ── */}
                <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                    {error && (
                        <div className="alert alert-error" style={{ margin: 16 }}>
                            <span>⚠</span><span>{error}</span>
                        </div>
                    )}
                    {loading && (
                        <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
                            Chargement…
                        </div>
                    )}
                    {!loading && !error && files.length === 0 && (
                        <div style={{ padding: "48px 24px", textAlign: "center" }}>
                            <div style={{ fontSize: 36, marginBottom: 12 }}>📄</div>
                            <div style={{ fontWeight: 600, marginBottom: 6 }}>Aucun fichier de log</div>
                            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                                Les logs apparaîtront ici après le premier lancement de l'application.
                            </div>
                        </div>
                    )}
                    {!loading && files.length > 0 && (
                        <div style={{ maxHeight: "calc(100vh - 340px)", overflowY: "auto" }}>
                            {visibleLines.length === 0 ? (
                                <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
                                    Aucune ligne ne correspond aux filtres.
                                </div>
                            ) : (
                                visibleLines.map((line, i) => (
                                    <LogLine key={i} line={line} index={i} />
                                ))
                            )}
                            <div ref={bottomRef} />
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

export default AdminLogs;
