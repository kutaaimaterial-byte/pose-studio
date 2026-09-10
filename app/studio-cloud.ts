type StorageScope = Pick<Storage, "getItem" | "setItem">;
export function studioAccessKey(storage: StorageScope = localStorage) {
  let key = storage.getItem("poseboard.studio.access-key");
  if (!key || !/^[a-f0-9]{64}$/.test(key)) {
    key = Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) => b.toString(16).padStart(2, "0")).join("");
    storage.setItem("poseboard.studio.access-key", key);
  }
  return key;
}
export async function studioCloudRequest(method: "GET" | "PUT", project?: unknown, storage: StorageScope = localStorage) {
  const headers: Record<string, string> = { Authorization: `Bearer ${studioAccessKey(storage)}` };
  if (method === "PUT") {
    headers["Content-Type"] = "application/json";
    const etag = storage.getItem("poseboard.studio.etag");
    if (etag) headers["If-Match"] = etag;
  }
  const response = await fetch("/api/studio-project", { method, headers, body: project ? JSON.stringify(project) : undefined, signal: AbortSignal.timeout(30000) });
  const value = await response.json();
  if (!response.ok) throw new Error(value.error || "云端存储暂不可用");
  // GET is committed only after the user confirms restoring the returned document.
  if (method === "PUT" && response.headers.get("etag")) storage.setItem("poseboard.studio.etag", response.headers.get("etag")!);
  return { value, etag: response.headers.get("etag") };
}
