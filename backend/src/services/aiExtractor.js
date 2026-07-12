const { getProvider } = require("./providers");

const MAX_RETRIES = Number(process.env.MAX_RETRIES || 3);

async function callWithRetry(provider, headers, batch, batchStartIndex) {
  let lastError;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const records = await provider.generate(headers, batch, batchStartIndex);
      if (!Array.isArray(records)) {
        throw new Error(`${provider.name} provider did not return a records array`);
      }
      return records;
    } catch (err) {
      lastError = err;
      // Exponential-ish backoff before retrying a failed batch.
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, attempt * 500));
      }
    }
  }
  throw lastError;
}

/**
 * Sends CSV row batches to the configured AI provider (Gemini, Groq, or
 * Ollama — see AI_PROVIDER in .env) for field extraction/mapping, and
 * returns the combined, schema-conformant results plus any batches that
 * failed every retry (so the caller can report a partial failure instead
 * of crashing the whole import).
 *
 * @param {string[]} headers
 * @param {Record<string,string>[][]} batches
 * @param {(done: number, total: number) => void} [onProgress]
 */
async function extractBatches(headers, batches, onProgress) {
  const provider = getProvider();

  const allRecords = [];
  const failedBatches = [];
  let rowsSeen = 0;

  for (let b = 0; b < batches.length; b++) {
    const batch = batches[b];
    const batchStartIndex = rowsSeen;
    rowsSeen += batch.length;

    try {
      const records = await callWithRetry(provider, headers, batch, batchStartIndex);
      allRecords.push(...records);
    } catch (err) {
      failedBatches.push({
        batchIndex: b,
        startRow: batchStartIndex,
        endRow: batchStartIndex + batch.length - 1,
        error: err.message,
      });
    }

    if (onProgress) onProgress(b + 1, batches.length);
  }

  return { records: allRecords, failedBatches };
}

module.exports = { extractBatches };
