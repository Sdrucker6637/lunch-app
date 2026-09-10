import { isUsefulDescription } from "./enrichment";

const geminiCache: Record<string, unknown> = {};

function isCacheableResult(value: unknown): boolean {
  if (!value || Array.isArray(value)) return false;
  const single = value as { description?: unknown };
  return isUsefulDescription(single.description);
}

export async function callGemini(
  prompt: string,
  spotId: string | null,
  forceRefresh: boolean,
): Promise<unknown> {
  const key = spotId || prompt;
  if (!forceRefresh && geminiCache[key]) return geminiCache[key];
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  let response: Response | undefined;
  try {
    response = await fetch("/api/gemini", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, spotId, forceRefresh: !!forceRefresh }),
      signal: controller.signal,
    });
  } catch (e) {
    clearTimeout(timeoutId);
    console.error("[gemini] request failed", e);
    return null;
  }
  clearTimeout(timeoutId);
  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    console.error(`[gemini] ${response.status} for spotId=${spotId || "(none)"}`, errText);
    return null;
  }
  let data: { result?: unknown } | null = null;
  try {
    data = await response.json();
  } catch (e) {
    console.error("[gemini] response was not valid JSON", e);
    return null;
  }
  if (data?.result && isCacheableResult(data.result)) {
    geminiCache[key] = data.result;
  }
  return data?.result || null;
}
