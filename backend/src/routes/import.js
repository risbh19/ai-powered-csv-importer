const express = require("express");
const multer = require("multer");
const { parseCsv, chunk } = require("../services/csvParser");
const { extractBatches } = require("../services/aiExtractor");
const { normalizeRecord } = require("../utils/validators");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB, matches the frontend's stated limit
  fileFilter: (_req, file, cb) => {
    const isCsv =
      file.mimetype === "text/csv" ||
      file.mimetype === "application/vnd.ms-excel" ||
      file.originalname.toLowerCase().endsWith(".csv");
    cb(isCsv ? null : new Error("Only .csv files are supported"), isCsv);
  },
});

const BATCH_SIZE = Number(process.env.BATCH_SIZE || 25);

router.post("/import", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No CSV file was uploaded (field name: 'file')." });
  }

  let rows, headers;
  try {
    ({ rows, headers } = parseCsv(req.file.buffer));
  } catch (err) {
    return res.status(400).json({ error: `Could not parse CSV: ${err.message}` });
  }

  if (rows.length === 0) {
    return res.status(400).json({ error: "The CSV file has no data rows." });
  }

  const batches = chunk(rows, BATCH_SIZE);

  let extraction;
  try {
    extraction = await extractBatches(headers, batches);
  } catch (err) {
    return res.status(502).json({
      error: `AI extraction failed: ${err.message}`,
    });
  }

  const imported = [];
  const skipped = [];

  for (const raw of extraction.records) {
    const normalized = normalizeRecord(raw);
    if (normalized.skipped) {
      skipped.push(normalized);
    } else {
      imported.push(normalized);
    }
  }

  res.json({
    totalRows: rows.length,
    totalImported: imported.length,
    totalSkipped: skipped.length,
    records: imported,
    skippedRecords: skipped,
    failedBatches: extraction.failedBatches, // rows the AI couldn't process after retries
  });
});

module.exports = router;
