const { parseCsv, chunk } = require("../src/services/csvParser");

describe("parseCsv", () => {
  it("parses arbitrary headers into row objects, preserving original casing", () => {
    const csv = "Full_Name,e-Mail,Ph#\nJohn Doe,john@example.com,9876543210\n";
    const { headers, rows } = parseCsv(csv);

    expect(headers).toEqual(["Full_Name", "e-Mail", "Ph#"]);
    expect(rows).toEqual([
      { Full_Name: "John Doe", "e-Mail": "john@example.com", "Ph#": "9876543210" },
    ]);
  });

  it("returns an empty rows array and empty headers for a header-only CSV", () => {
    const { headers, rows } = parseCsv("name,email\n");
    expect(rows).toEqual([]);
    expect(headers).toEqual([]);
  });

  it("trims whitespace from cell values", () => {
    const csv = "name,email\n  John  ,  john@example.com  \n";
    const { rows } = parseCsv(csv);
    expect(rows[0].name).toBe("John");
    expect(rows[0].email).toBe("john@example.com");
  });

  it("tolerates rows with a different column count than the header (relax_column_count)", () => {
    const csv = "a,b,c\n1,2\n4,5,6,7\n";
    expect(() => parseCsv(csv)).not.toThrow();
  });

  it("strips a leading UTF-8 BOM", () => {
    const csv = "\uFEFFname,email\nJohn,john@example.com\n";
    const { headers } = parseCsv(csv);
    expect(headers[0]).toBe("name");
  });

  it("accepts a Buffer as well as a string", () => {
    const csv = Buffer.from("name,email\nJohn,john@example.com\n", "utf-8");
    const { rows } = parseCsv(csv);
    expect(rows).toEqual([{ name: "John", email: "john@example.com" }]);
  });
});

describe("chunk", () => {
  it("splits an array into fixed-size chunks, preserving order", () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it("returns a single chunk when size exceeds array length", () => {
    expect(chunk([1, 2], 10)).toEqual([[1, 2]]);
  });

  it("returns an empty array for an empty input", () => {
    expect(chunk([], 5)).toEqual([]);
  });
});
