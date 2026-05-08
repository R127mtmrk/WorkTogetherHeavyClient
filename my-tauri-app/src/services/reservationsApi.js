const API_BASE_URL = import.meta.env.VITE_BACKOFFICE_API_BASE_URL ?? "http://127.0.0.1:3000";

function buildUrl(path) {
    const cleanBase = API_BASE_URL.replace(/\/$/, "");
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return `${cleanBase}${cleanPath}`;
}

async function fetchJson(path, options = {}) {
    const response = await fetch(buildUrl(path), {
        method: options.method ?? "GET",
        headers: {
            Accept: "application/json",
            ...(options.body ? { "Content-Type": "application/json" } : {}),
            ...(options.headers ?? {}),
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
    });
    const contentType = response.headers.get("content-type") ?? "";
    const payload = contentType.includes("application/json") ? await response.json() : null;
    if (!response.ok || payload?.error) {
        throw new Error(payload?.error ?? `Erreur API (${response.status})`);
    }
    return payload;
}

export async function getReservations() {
    return fetchJson("/api/reservations");
}

