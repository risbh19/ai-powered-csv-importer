const { normalizeRecord, isNonEmpty, isValidDate } = require("../src/utils/validators");

describe("normalizeRecord", () => {
  it("skips a record with neither email nor mobile", () => {
    const result = normalizeRecord({ source_row_index: 0, name: "John" });
    expect(result.skipped).toBe(true);
    expect(result.skip_reason).toBe("no email or mobile number found");
    expect(result.source_row_index).toBe(0);
  });

  it("preserves a model-provided skip_reason when skipping", () => {
    const result = normalizeRecord({ source_row_index: 2, skip_reason: "blank row" });
    expect(result.skipped).toBe(true);
    expect(result.skip_reason).toBe("blank row");
  });

  it("keeps a record that has only an email", () => {
    const result = normalizeRecord({ source_row_index: 1, email: "a@b.com" });
    expect(result.skipped).toBe(false);
    expect(result.email).toBe("a@b.com");
  });

  it("keeps a record that has only a mobile number", () => {
    const result = normalizeRecord({
      source_row_index: 1,
      mobile_without_country_code: "9876543210",
    });
    expect(result.skipped).toBe(false);
    expect(result.mobile_without_country_code).toBe("9876543210");
  });

  it("blanks out a crm_status value outside the fixed enum", () => {
    const result = normalizeRecord({
      source_row_index: 3,
      email: "a@b.com",
      crm_status: "NOT_A_REAL_STATUS",
    });
    expect(result.crm_status).toBe("");
  });

  it("keeps a crm_status value that is in the fixed enum", () => {
    const result = normalizeRecord({
      source_row_index: 3,
      email: "a@b.com",
      crm_status: "GOOD_LEAD_FOLLOW_UP",
    });
    expect(result.crm_status).toBe("GOOD_LEAD_FOLLOW_UP");
  });

  it("blanks out a data_source value outside the fixed enum", () => {
    const result = normalizeRecord({
      source_row_index: 4,
      email: "a@b.com",
      data_source: "some_random_source",
    });
    expect(result.data_source).toBe("");
  });

  it("blanks an unparseable created_at and records it in crm_note instead of dropping it", () => {
    const result = normalizeRecord({
      source_row_index: 5,
      email: "a@b.com",
      created_at: "not-a-real-date",
    });
    expect(result.created_at).toBe("");
    expect(result.crm_note).toContain("not-a-real-date");
  });

  it("keeps a parseable created_at value untouched", () => {
    const result = normalizeRecord({
      source_row_index: 6,
      email: "a@b.com",
      created_at: "2026-05-13 14:20:48",
    });
    expect(result.created_at).toBe("2026-05-13 14:20:48");
  });

  it("escapes embedded newlines in text fields", () => {
    const result = normalizeRecord({
      source_row_index: 7,
      email: "a@b.com",
      crm_note: "line one\nline two",
    });
    expect(result.crm_note).toBe("line one\\nline two");
  });
});

describe("isNonEmpty", () => {
  it("is false for null, undefined, and whitespace-only strings", () => {
    expect(isNonEmpty(null)).toBe(false);
    expect(isNonEmpty(undefined)).toBe(false);
    expect(isNonEmpty("   ")).toBe(false);
  });

  it("is true for a non-empty string", () => {
    expect(isNonEmpty("hello")).toBe(true);
  });
});

describe("isValidDate", () => {
  it("is true for a parseable date string", () => {
    expect(isValidDate("2026-05-13")).toBe(true);
  });

  it("is false for garbage input", () => {
    expect(isValidDate("not-a-date")).toBe(false);
  });

  it("is false for an empty string", () => {
    expect(isValidDate("")).toBe(false);
  });
});
