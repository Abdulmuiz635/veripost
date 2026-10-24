// Server-only helpers that talk to the Express backend. Keys live here and
// never reach the browser. Imported exclusively by route handlers under app/api,
// which run on the server, so the demo and admin secrets stay off the client.
const BACKEND = process.env.BACKEND_URL || "http://localhost:8080";
const DEMO_KEY = process.env.DEMO_CLIENT_KEY || "";
const ADMIN_TOKEN = process.env.ADMIN_API_TOKEN || "";

async function call(
  path: string,
  init: RequestInit & { role: "client" | "admin" }
): Promise<Response> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string> | undefined),
  };
  if (init.role === "client") headers["X-Client-Key"] = DEMO_KEY;
  if (init.role === "admin") headers["X-Admin-Token"] = ADMIN_TOKEN;

  return fetch(`${BACKEND}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });
}

export const backend = {
  clientPost: (path: string, body: unknown) =>
    call(path, { role: "client", method: "POST", body: JSON.stringify(body) }),
  clientGet: (path: string) => call(path, { role: "client", method: "GET" }),
  adminGet: (path: string) => call(path, { role: "admin", method: "GET" }),
  publicGet: (path: string) =>
    fetch(`${BACKEND}${path}`, { cache: "no-store" }),
};
