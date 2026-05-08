import { trace, debug, info, warn, error } from "@tauri-apps/plugin-log";

function fmt(message, context) {
    if (!context) return message;
    const parts = Object.entries(context).map(([k, v]) => `${k}=${JSON.stringify(v)}`).join(" ");
    return `${message} | ${parts}`;
}

export const logger = {
    trace: (msg, ctx) => trace(fmt(msg, ctx)),
    debug: (msg, ctx) => debug(fmt(msg, ctx)),
    info:  (msg, ctx) => info(fmt(msg, ctx)),
    warn:  (msg, ctx) => warn(fmt(msg, ctx)),
    error: (msg, ctx) => error(fmt(msg, ctx)),

    // Actions utilisateur
    action: (action, ctx) => info(fmt(`[ACTION] ${action}`, ctx)),
    auth:   (action, ctx) => info(fmt(`[AUTH] ${action}`, ctx)),
};
