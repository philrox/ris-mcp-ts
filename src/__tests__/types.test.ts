import { describe, it, expect } from "vitest";
import { limitToDokumenteProSeite, JudikaturGerichtSchema } from "../types.js";

describe("limitToDokumenteProSeite", () => {
  it("returns 'Ten' for limit 10", () => {
    expect(limitToDokumenteProSeite(10)).toBe("Ten");
  });

  it("returns 'Twenty' for limit 20", () => {
    expect(limitToDokumenteProSeite(20)).toBe("Twenty");
  });

  it("returns 'Fifty' for limit 50", () => {
    expect(limitToDokumenteProSeite(50)).toBe("Fifty");
  });

  it("returns 'OneHundred' for limit 100", () => {
    expect(limitToDokumenteProSeite(100)).toBe("OneHundred");
  });

  it("returns 'Twenty' (default) for unknown value like 25", () => {
    expect(limitToDokumenteProSeite(25)).toBe("Twenty");
  });

  it("returns 'Twenty' (default) for invalid value 0", () => {
    expect(limitToDokumenteProSeite(0)).toBe("Twenty");
  });

  it("returns 'Twenty' (default) for invalid value -1", () => {
    expect(limitToDokumenteProSeite(-1)).toBe("Twenty");
  });

  it("returns 'Twenty' (default) for undefined", () => {
    expect(limitToDokumenteProSeite(undefined as unknown as number)).toBe("Twenty");
  });
});

describe("JudikaturGerichtSchema", () => {
  const expectedGerichte = [
    "Justiz",
    "Vfgh",
    "Vwgh",
    "Bvwg",
    "Lvwg",
    "Dsk",
    "AsylGH",
    "Normenliste",
    "Pvak",
    "Gbk",
    "Dok",
  ];

  it("should accept all 11 court types", () => {
    const schemaValues = JudikaturGerichtSchema.options;
    expect(schemaValues).toHaveLength(11);
  });

  it.each(expectedGerichte)("should validate '%s' as a valid court type", (gericht) => {
    const result = JudikaturGerichtSchema.safeParse(gericht);
    expect(result.success).toBe(true);
  });

  it("should reject invalid court types", () => {
    const result = JudikaturGerichtSchema.safeParse("InvalidCourt");
    expect(result.success).toBe(false);
  });

  it("should include all Phase 2 courts (AsylGH, Normenliste, Pvak, Gbk, Dok)", () => {
    const phase2Courts = ["AsylGH", "Normenliste", "Pvak", "Gbk", "Dok"];
    const schemaValues = JudikaturGerichtSchema.options;

    for (const court of phase2Courts) {
      expect(schemaValues).toContain(court);
    }
  });
});
