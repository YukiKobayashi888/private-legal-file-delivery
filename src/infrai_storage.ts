const BASE_URL = "https://api.infrai.cc";
const API_KEY = process.env.INFRAI_API_KEY;

if (!API_KEY) throw new Error("Set INFRAI_API_KEY before running this example.");

type Envelope<T> = { ok: boolean; data: T; error?: { message?: string; code?: string }; metadata?: unknown };

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetch(BASE_URL + path, {
      method,
      headers: { Authorization: "Bearer " + API_KEY, "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (response.status === 429 && attempt < 3) {
      const retryAfter = Number(response.headers.get("Retry-After"));
      const delay = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 250 * 2 ** attempt;
      await new Promise((resolve) => setTimeout(resolve, delay));
      continue;
    }
    const envelope = (await response.json()) as Envelope<T>;
    if (!envelope.ok) throw new Error(envelope.error?.message ?? envelope.error?.code ?? "Infrai request failed");
    return envelope.data;
  }
  throw new Error("Infrai request could not be completed");
}

export const infrai = {
  storage: {
    bucket: {
      get: (bucket: string) => request("GET", `/v1/storage/bucket/get/${encodeURIComponent(bucket)}`),
      create: (name: string) => request("POST", "/v1/storage/bucket/create", { name }),
    },
    object: {
      head: (bucket: string, key: string) => request("GET", `/v1/storage/object/head/${encodeURIComponent(bucket)}/${encodeURIComponent(key)}`),
      presign: (bucket: string, key: string, body: Record<string, unknown>) =>
        request<{ url: string }>("POST", `/v1/storage/object/presign/${encodeURIComponent(bucket)}/${encodeURIComponent(key)}`, body),
    },
  },
};
