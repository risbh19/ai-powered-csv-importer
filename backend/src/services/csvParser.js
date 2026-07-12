const { parse } = require("csv-parse/sync");

/**
 * Parses a raw CSV buffer/string into an array of plain row objects.
 * Makes no assumption about column names — whatever headers the file has
 * become the object keys, in their original casing/order.
 *
 * @param {Buffer|string} csvContent
 * @returns {{rows: Record<string,string>[], headers: string[]}}
 */
function parseCsv(csvContent) {
  const content = Buffer.isBuffer(csvContent)
    ? csvContent.toString("utf-8")
    : csvContent;

  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
    bom: true,
  });

  const headers = records.length > 0 ? Object.keys(records[0]) : [];

  return { rows: records, headers };
}

/**
 * Splits an array into fixed-size chunks, preserving original order.
 * Used to send CSV rows to the AI model in batches instead of one giant call.
 */
function chunk(array, size) {
  const out = [];
  for (let i = 0; i < array.length; i += size) {
    out.push(array.slice(i, i + size));
  }
  return out;
}

module.exports = { parseCsv, chunk };
