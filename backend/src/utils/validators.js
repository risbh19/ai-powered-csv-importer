const { CRM_FIELDS, CRM_STATUS_VALUES, DATA_SOURCE_VALUES } = require("./crmSchema");

function isNonEmpty(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function sanitizeText(value) {
  if (!isNonEmpty(value)) return "";
  // Records must stay single CSV rows downstream — escape stray newlines.
  return value.replace(/\r\n|\r|\n/g, "\\n").trim();
}

function isValidDate(value) {
  if (!isNonEmpty(value)) return false;
  const d = new Date(value);
  return !Number.isNaN(d.getTime());
}

/**
 * Re-validates one AI-produced record against the CRM schema rules. This is
 * a safety net on top of the Gemini response schema — it never trusts the
 * model's "skipped" flag blindly, and it hard-enforces the enum + date rules
 * the assignment requires, even if the model output drifts.
 */
function normalizeRecord(raw) {
  const hasEmail = isNonEmpty(raw.email);
  const hasMobile = isNonEmpty(raw.mobile_without_country_code);

  if (!hasEmail && !hasMobile) {
    return {
      skipped: true,
      skip_reason: raw.skip_reason || "no email or mobile number found",
      source_row_index: raw.source_row_index,
    };
  }

  const record = { source_row_index: raw.source_row_index, skipped: false };

  for (const field of CRM_FIELDS) {
    record[field] = sanitizeText(raw[field]);
  }

  if (!CRM_STATUS_VALUES.includes(record.crm_status)) {
    record.crm_status = "";
  }
  if (!DATA_SOURCE_VALUES.includes(record.data_source)) {
    record.data_source = "";
  }
  if (record.created_at && !isValidDate(record.created_at)) {
    // Unparseable date — keep the raw text in the note instead of silently
    // passing something `new Date()` would choke on downstream.
    record.crm_note = [record.crm_note, `Unparseable created_at: ${record.created_at}`]
      .filter(Boolean)
      .join(" | ");
    record.created_at = "";
  }

  return record;
}

module.exports = { normalizeRecord, isNonEmpty, isValidDate };
