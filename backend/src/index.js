require("dotenv").config();
const express = require("express");
const cors = require("cors");
const importRouter = require("./routes/import");

const app = express();
const PORT = process.env.PORT || 4000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";

app.use(cors({ origin: CORS_ORIGIN.split(",").map((s) => s.trim()) }));
app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.use("/api", importRouter);

// Central error handler — catches multer errors (bad file type, size limit)
// and anything else that throws, so the API never returns a raw stack trace.
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`GrowEasy CSV importer backend listening on port ${PORT}`);
});
