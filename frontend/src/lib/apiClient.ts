const explicitBase = process.env.NEXT_PUBLIC_API_BASE_URL;
const explicitBases = process.env.NEXT_PUBLIC_API_BASE_URLS;

const fromList = (explicitBases || "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

const candidateBases = explicitBase
  ? [explicitBase, ""]
  : fromList.length
    ? [...fromList, ""]
    : ["", "http://localhost:8000", "http://localhost:8001"];

export async function apiRequest(path: string, init?: RequestInit): Promise<Response> {
  let lastError: unknown;

  for (const base of candidateBases) {
    try {
      const response = await fetch(`${base}${path}`, init);
      return response;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("All API endpoints are unreachable");
}
