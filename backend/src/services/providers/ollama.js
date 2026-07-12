const { buildPrompt } = require("./prompt");
const { parseModelJson } = require("./parseModelJson");

const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.1";
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";

async function generate(headers, batch, batchStartIndex) {
  const prompt = buildPrompt(headers, batch, batchStartIndex);

  let res;
  try {
    res = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt,
        format: "json",
        stream: false,
        options: { temperature: 0.1 },
      }),
    });
  } catch (err) {
    // Most common case in local dev: Ollama isn't running, or the model
    // hasn't been pulled yet — point directly at the fix instead of just
    // surfacing a raw "fetch failed".
    throw new Error(
      `Could not reach Ollama at ${OLLAMA_BASE_URL}. Make sure 'ollama serve' is running ` +
        `and that '${OLLAMA_MODEL}' has been pulled ('ollama pull ${OLLAMA_MODEL}'). (${err.message})`
    );
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Ollama API error (${res.status}): ${body.slice(0, 300)}`);
  }

  const data = await res.json();
  if (!data.response) {
    throw new Error("Ollama response did not contain a 'response' field");
  }

  return parseModelJson(data.response);
}

module.exports = { generate, name: "ollama" };
