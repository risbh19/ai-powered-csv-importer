const gemini = require("./gemini");
const groq = require("./groq");
const ollama = require("./ollama");

const PROVIDERS = { gemini, groq, ollama };

/**
 * Returns the active provider adapter based on AI_PROVIDER (default: gemini).
 * Each adapter exposes generate(headers, batch, batchStartIndex) -> records[].
 */
function getProvider() {
  const key = (process.env.AI_PROVIDER || "gemini").toLowerCase().trim();
  const provider = PROVIDERS[key];
  if (!provider) {
    throw new Error(
      `Unknown AI_PROVIDER "${key}". Supported values: ${Object.keys(PROVIDERS).join(", ")}.`
    );
  }
  return provider;
}

module.exports = { getProvider, PROVIDERS };
