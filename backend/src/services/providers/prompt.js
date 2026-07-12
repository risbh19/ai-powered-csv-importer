const { CRM_FIELDS, CRM_STATUS_VALUES, DATA_SOURCE_VALUES } = require("../../utils/crmSchema");

/**
 * Builds the field-mapping prompt sent to whichever AI provider is active.
 * Kept provider-agnostic: Gemini gets this alongside a native structured
 * output schema, while Groq/Ollama rely on the explicit JSON-only
 * instruction below plus parseModelJson.js as a safety net.
 */
function buildPrompt(headers, batch, batchStartIndex) {
  return `You are a data-mapping engine for a real-estate CRM called GrowEasy.

You will receive a batch of raw CSV lead rows. The CSV can come from Facebook Lead Ads,
Google Ads exports, real-estate CRM exports, or hand-made spreadsheets, so column names,
order, and quality vary a lot. Your job is to map each raw row onto this FIXED CRM schema:

${CRM_FIELDS.map((f) => `- ${f}`).join("\n")}

Field-by-field rules (follow exactly, do not deviate):
1. "crm_status" must be one of exactly: ${CRM_STATUS_VALUES.join(", ")}. If nothing in the
   row confidently maps to one of these, leave it null. Never invent a value outside this list.
2. "data_source" must be one of exactly: ${DATA_SOURCE_VALUES.join(", ")}. If no confident
   match exists, leave it null. Never invent a value outside this list.
3. "created_at" must be a string that JavaScript's \`new Date(created_at)\` can parse
   successfully (e.g. "2026-05-13 14:20:48" or ISO 8601). If the raw value is ambiguous or
   unparseable, do your best reasonable interpretation; if truly impossible, leave it null.
4. "crm_note" is a catch-all for: remarks, follow-up notes, extra comments, extra phone
   numbers, extra emails, and any other useful raw-row information that doesn't fit the
   other fields. Combine multiple such details into one readable string.
5. If a row has MULTIPLE email addresses: put the first one in "email", and append every
   remaining email into "crm_note". Same rule for mobile numbers — first one goes into
   "mobile_without_country_code" (digits only, no country code), the rest go into "crm_note".
6. "mobile_without_country_code" must never include a leading country code — put that in
   "country_code" instead (e.g. "+91").
7. Never let any field value contain a raw newline character — collapse or escape it, since
   each record must round-trip as a single CSV row later.
8. SKIP RULE: if a row has neither a usable email NOR a usable mobile number anywhere in it,
   set "skipped": true and give a short "skip_reason" (e.g. "no email or phone found"). Do
   NOT populate the CRM fields for skipped rows — leave them null. Every row must still
   appear in your output (either mapped or skipped), matching "source_row_index" below.
9. Leave any field null if you cannot find a confident value for it — never fabricate data.

The raw CSV headers in this file are: ${headers.join(", ")}

Here are the rows for this batch, as JSON, each tagged with its original row index
(source_row_index) so you can echo it back:

${JSON.stringify(
  batch.map((row, i) => ({ source_row_index: batchStartIndex + i, ...row })),
  null,
  2
)}

Return one entry in "records" for every row above, in the same order, each carrying its
correct "source_row_index".

Respond with ONLY a single JSON object of the exact shape { "records": [...] } — no
markdown code fences, no commentary, no text before or after the JSON.`;
}

module.exports = { buildPrompt };
