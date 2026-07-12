export const CRM_FIELDS = [
  "created_at",
  "name",
  "email",
  "country_code",
  "mobile_without_country_code",
  "company",
  "city",
  "state",
  "country",
  "lead_owner",
  "crm_status",
  "crm_note",
  "data_source",
  "possession_time",
  "description",
] as const;

export type CrmField = (typeof CRM_FIELDS)[number];

export type CrmRecord = {
  source_row_index: number;
  skipped: false;
} & Record<CrmField, string>;

export type SkippedRecord = {
  source_row_index: number;
  skipped: true;
  skip_reason?: string;
};

export type FailedBatch = {
  batchIndex: number;
  startRow: number;
  endRow: number;
  error: string;
};

export type ImportResponse = {
  totalRows: number;
  totalImported: number;
  totalSkipped: number;
  records: CrmRecord[];
  skippedRecords: SkippedRecord[];
  failedBatches: FailedBatch[];
};

export type ParsedCsv = {
  headers: string[];
  rows: Record<string, string>[];
};

export type Step = "upload" | "preview" | "results";
