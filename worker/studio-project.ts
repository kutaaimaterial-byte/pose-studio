type StoredObject = { body: ReadableStream; httpEtag: string };
export type ProjectBucket = {
  get(key: string): Promise<StoredObject | null>;
  put(key: string, value: string, options?: { onlyIf?: { etagMatches?: string; etagDoesNotMatch?: string }; httpMetadata?: { contentType: string } }): Promise<{ httpEtag: string } | null>;
};
const MAX_BYTES = 24 * 1024 * 1024;

/** A private project document. The 256-bit bearer capability never appears in URLs or stored keys. */
export async function handleStudioProject(request: Request, bucket?: ProjectBucket) {
  const headers = { "Cache-Control": "no-store", "Content-Type": "application/json", "X-Content-Type-Options": "nosniff" };
  const response = (status: number, error: string) => Response.json({ error }, { status, headers });
  if (!bucket) return response(503, "云端存储暂不可用，请导出 JSON 备份");
  if (!["GET", "PUT"].includes(request.method)) return response(405, "Method not allowed");
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return response(403, "Origin rejected");
  const token = request.headers.get("authorization")?.match(/^Bearer ([a-f0-9]{64})$/)?.[1];
  if (!token) return response(401, "缺少项目访问钥匙");
  const hash = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token))), (b) => b.toString(16).padStart(2, "0")).join("");
  const key = `studio-projects/${hash}.json`;
  try {
    if (request.method === "GET") {
      const object = await bucket.get(key);
      return object ? new Response(object.body, { headers: { ...headers, ETag: object.httpEtag } }) : response(404, "此浏览器尚无云端项目");
    }
    if (!request.headers.get("content-type")?.includes("application/json")) return response(415, "Expected JSON");
    if (!request.body) return response(400, "Empty project");
    const reader = request.body.getReader();
    let size = 0, body = ""; const decoder = new TextDecoder();
    while (true) { const { value, done } = await reader.read(); if (done) break; size += value.byteLength; if (size > MAX_BYTES) { await reader.cancel(); return response(413, "项目超过 24 MB，请减少图片或导出 JSON"); } body += decoder.decode(value, { stream: true }); }
    body += decoder.decode();
    let parsed;
    try { parsed = JSON.parse(body); } catch { return response(400, "Invalid JSON"); }
    if (parsed?.studioVersion !== "1.0" || !parsed.currentScene?.editor || !Array.isArray(parsed.stageRecords) || !Array.isArray(parsed.studioGraph?.nodes)) return response(400, "Invalid project");
    const etag = request.headers.get("if-match");
    const object = await bucket.put(key, body, { httpMetadata: { contentType: "application/json" }, onlyIf: etag ? { etagMatches: etag } : { etagDoesNotMatch: "*" } });
    if (!object) return response(409, "云端项目已更新，请先恢复云端版本，避免覆盖其他窗口的修改");
    return Response.json({ saved: true }, { headers: { ...headers, ETag: object.httpEtag } });
  } catch (error) { console.error("Studio project storage unavailable", error instanceof Error ? error.name : "StorageError"); return response(503, "云端保存失败，当前编辑仍保留，请导出 JSON 备份后重试"); }
}
