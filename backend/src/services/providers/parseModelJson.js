/**
 * Parses a raw text response from a model that was asked to return
 * { "records": [...] } as JSON, but doesn't have native structured output
 * (Groq, Ollama). Models like this often wrap JSON in markdown code fences
 * or add a stray sentence before/after — this strips that noise before
 * parsing, and always validates the shape we actually need.
 */
function parseModelJson(text) {
  if (typeof text !== "string" || text.trim().length === 0) {
    throw new Error("Model returned an empty response");
  }

  let cleaned = text.trim();

  // Strip ```json ... ``` or ``` ... ``` fences some models wrap responses in.
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) {
    cleaned = fenceMatch[1].trim();
  }

  // Some models prepend/append stray commentary around the JSON object —
  // grab everything between the first '{' and the matching last '}'.
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    throw new Error(`Model response was not valid JSON: ${err.message}`);
  }

  if (!parsed || !Array.isArray(parsed.records)) {
    throw new Error("Model response was missing a 'records' array");
  }

  return parsed.records;
}

module.exports = { parseModelJson };
