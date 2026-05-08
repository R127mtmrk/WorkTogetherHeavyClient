import { invokeCommand, isTauriRuntime } from "./tauri";
import { logger } from "./logger";

const SESSION_STORAGE_KEY = "desktop_auth_user";

function normaliseRole(role) {
    return String(role ?? "")
        .trim()
        .toUpperCase()
        .replace(/\s+/g, "_");
}

function extractRoles(source) {
    if (Array.isArray(source?.roles)) {
        return source.roles.map(normaliseRole).filter(Boolean);
    }

    if (source?.role) {
        return [normaliseRole(source.role)].filter(Boolean);
    }

    return [];
}

function extractUser(payload, fallbackIdentifier = "") {
    const roles = extractRoles(payload);
    const username = payload?.username ?? payload?.email ?? fallbackIdentifier;

    if (!username && roles.length === 0 && !payload?.id) {
        return null;
    }

    return {
        id: payload?.id ?? username,
        email: payload?.email ?? username,
        username,
        displayName: payload?.displayName ?? username,
        roles,
    };
}

function getStoredUser() {
    if (typeof window === "undefined") {
        return null;
    }

    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) {
        return null;
    }

    try {
        return extractUser(JSON.parse(raw));
    } catch {
        window.localStorage.removeItem(SESSION_STORAGE_KEY);
        return null;
    }
}

function storeUser(user) {
    if (typeof window === "undefined") {
        return;
    }

    if (!user) {
        window.localStorage.removeItem(SESSION_STORAGE_KEY);
        return;
    }

    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
}

function toErrorMessage(error, fallback = "Connexion impossible.") {
    if (error instanceof Error && error.message) {
        return error.message;
    }

    if (typeof error === "string" && error.trim()) {
        return error;
    }

    if (error && typeof error === "object") {
        const candidate = error.message ?? error.error ?? error.reason;
        if (typeof candidate === "string" && candidate.trim()) {
            return candidate;
        }
    }

    return fallback;
}

export async function loginWithDatabase({ identifier, password }) {
    const safeIdentifier = String(identifier ?? "").trim();
    const safePassword = String(password ?? "");

    if (!safeIdentifier || !safePassword) {
        throw new Error("Veuillez renseigner l'identifiant et le mot de passe.");
    }

    if (!isTauriRuntime()) {
        throw new Error("La connexion directe a la BDD est disponible uniquement dans l'application desktop Tauri.");
    }

    let payload;
    try {
        payload = await invokeCommand("login_db", {
            identifier: safeIdentifier,
            password: safePassword,
        });
    } catch (error) {
        throw new Error(toErrorMessage(error, "Connexion impossible (commande Tauri)."));
    }

    const user = extractUser(payload, safeIdentifier);

    if (!user) {
        throw new Error("Connexion reussie, mais profil utilisateur introuvable.");
    }

    logger.auth("Connexion réussie", { email: safeIdentifier, roles: user.roles });
    storeUser(user);
    return { user };
}

export async function fetchCurrentUser() {
    return getStoredUser();
}

export async function logoutFromDatabase() {
    const user = getStoredUser();
    if (user) logger.auth("Déconnexion", { email: user.email });
    storeUser(null);
}

export function clearStoredAuth() {
    storeUser(null);
}

export async function verifyAnyRequiredRole(user, expectedRoles = []) {
    return hasAnyRole(user, expectedRoles);
}

export function hasAnyRole(user, expectedRoles = []) {
    if (!user) {
        return false;
    }

    if (!Array.isArray(expectedRoles) || expectedRoles.length === 0) {
        return true;
    }

    const userRoles = extractRoles(user);
    const normalisedExpectedRoles = expectedRoles.map(normaliseRole);

    return normalisedExpectedRoles.some((role) => userRoles.includes(role));
}

export function getAuthApiConfig() {
    return {
        mode: "tauri-db-direct",
    };
}

export async function listAppUsers() {
    return invokeCommand("list_app_users", {});
}

export async function createAppUser({ email, username, password, roles }) {
    const result = await invokeCommand("create_app_user", {
        payload: { email, username: username || null, password, roles: roles ?? ["ROLE_USER"] },
    });
    logger.action("Création utilisateur", { email, roles });
    return result;
}

export async function deleteAppUser(id) {
    const result = await invokeCommand("delete_app_user", { id });
    logger.action("Suppression utilisateur", { id });
    return result;
}

