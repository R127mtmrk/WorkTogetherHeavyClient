function isTauriRuntime() {
    return typeof window !== "undefined" && Boolean(window.__TAURI_INTERNALS__);
}

export async function invokeCommand(command, args) {
    if (!isTauriRuntime()) {
        throw new Error("Cette fonctionnalité nécessite l'application Tauri. Lancez-la avec `npm run tauri dev` pour utiliser les commandes natives.");
    }

    const { invoke } = await import("@tauri-apps/api/core");
    return invoke(command, args);
}

export { isTauriRuntime };

