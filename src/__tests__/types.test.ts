import { describe, it, expect } from "vitest";
import { limitToDokumenteProSeite } from "../types.js";

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
