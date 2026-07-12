const { GoogleGenAI } = require("@google/genai");
const { CRM_STATUS_VALUES, DATA_SOURCE_VALUES } = require("../../utils/crmSchema");
const { buildPrompt } = require("./prompt");

// NOTE: the legacy "@google/generative-ai" SDK and Gemini 1.0/1.5 models are
// fully shut down (404 on every request) as of mid-2026. This adapter uses
// the current "@google/genai" SDK and a GA Gemini model by default.
const MODEL_NAME = process.env.GEMINI_MODEL || "gemini-2.5-flash";

let client = null;
function getClient() {
  if (!client) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error(
        "GEMINI_API_KEY is not set. Add it to backend/.env (see .env.example), or switch AI_PROVIDER."
      );
    }
    client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return client;
}

// Structured output schema — forces Gemini to return exactly the shape we
// need, rather than hoping it follows the prompt's instructions about JSON.
const responseSchema = {
  type: "object",
  properties: {
    records: {
      type: "array",
      items: {
        type: "object",
        properties: {
          source_row_index: { type: "integer" },
          skipped: { type: "boolean" },
          skip_reason: { type: "string", nullable: true },
          created_at: { type: "string", nullable: true },
          name: { type: "string", nullable: true },
          email: { type: "string", nullable: true },
          country_code: { type: "string", nullable: true },
          mobile_without_country_code: { type: "string", nullable: true },
          company: { type: "string", nullable: true },
          city: { type: "string", nullable: true },
          state: { type: "string", nullable: true },
          country: { type: "string", nullable: true },
          lead_owner: { type: "string", nullable: true },
          crm_status: { type: "string", nullable: true, enum: [...CRM_STATUS_VALUES, ""] },
          crm_note: { type: "string", nullable: true },
          data_source: { type: "string", nullable: true, enum: [...DATA_SOURCE_VALUES, ""] },
          possession_time: { type: "string", nullable: true },
          description: { type: "string", nullable: true },
        },
        required: ["source_row_index", "skipped"],
      },
    },
  },
  required: ["records"],
};

async function generate(headers, batch, batchStartIndex) {
  const prompt = buildPrompt(headers, batch, batchStartIndex);
  const response = await getClient().models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema,
      temperature: 0.1,
    },
  });

  const text = response.text;
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    throw new Error(`Gemini response was not valid JSON: ${err.message}`);
  }
  if (!parsed || !Array.isArray(parsed.records)) {
    throw new Error("Gemini response was missing a 'records' array");
  }
  return parsed.records;
}

module.exports = { generate, name: "gemini" };
