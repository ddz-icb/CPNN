import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { parseNodeIdFilters } from "../../../../../src/components/domain/service/parsing/nodeIdFilterParsing.js";

describe("parseNodeIdFilters", () => {
  test("returns an empty list for empty filters", () => {
    assert.deepEqual(parseNodeIdFilters(""), []);
    assert.deepEqual(parseNodeIdFilters("   "), []);
    assert.deepEqual(parseNodeIdFilters(null), []);
  });

  test("parses comma and line separated node id filters", () => {
    const parsedFilters = parseNodeIdFilters("AKT1, MTOR\nPTPN1");

    assert.deepEqual(parsedFilters, [
      { value: "AKT1", normalizedValue: "akt1" },
      { value: "MTOR", normalizedValue: "mtor" },
      { value: "PTPN1", normalizedValue: "ptpn1" },
    ]);
  });

  test("deduplicates filters case-insensitively", () => {
    const parsedFilters = parseNodeIdFilters("AKT1\nakt1, Akt1");

    assert.deepEqual(parsedFilters, [{ value: "AKT1", normalizedValue: "akt1" }]);
  });
});
