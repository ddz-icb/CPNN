import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  parseAttribsFilter,
  QUERY_FIELD_PREFIX,
} from "../../../../../src/components/domain/service/parsing/attribsFilterParsing.js";

function field(name, value) {
  return `${QUERY_FIELD_PREFIX}${name}:${value}`;
}

function allOf(...terms) {
  return { allOf: terms };
}

function toPlainFilter(filterRequest) {
  if (filterRequest instanceof Set) return allOf(...Array.from(filterRequest));
  if (Array.isArray(filterRequest)) return filterRequest.map(toPlainFilter);
  if (filterRequest && typeof filterRequest === "object") return { ...filterRequest };
  return filterRequest;
}

function assertParses(query, expected) {
  assert.deepEqual(toPlainFilter(parseAttribsFilter(query)), expected);
}

describe("parseAttribsFilter", () => {
  test("returns true for empty filters", () => {
    assert.equal(parseAttribsFilter(""), true);
    assert.equal(parseAttribsFilter("   "), true);
    assert.equal(parseAttribsFilter(null), true);
  });

  test("parses field values and quoted multi-word values", () => {
    assertParses('name:"Alpha kinase" and attr:"T2D group"', [
      [field("name", "Alpha kinase")],
      [field("attr", "T2D group")],
    ]);
  });

  test("normalizes spacing around field separators", () => {
    assertParses('source : AKT1 and target : "MTOR complex"', [
      [field("source", "AKT1")],
      [field("target", "MTOR complex")],
    ]);
  });

  test("normalizes smart quotes", () => {
    assertParses("attr:\u201ct2d group\u201d", [[field("attr", "t2d group")]]);
  });

  test("parses set clauses that require all terms to match", () => {
    assertParses('{attr:kinase, attr:"t2d group"}', [
      [allOf(field("attr", "kinase"), field("attr", "t2d group"))],
    ]);
  });

  test("parses combined and, or, and not clauses", () => {
    assertParses("(attr:kinase or attr:phosphatase) and not attr:predicted", [
      [field("attr", "kinase"), field("attr", "phosphatase")],
      ["not", field("attr", "predicted")],
    ]);
  });

  test("parses not with set clauses", () => {
    assertParses('not {attr:predicted, name:"obsolete node"}', [
      ["not", allOf(field("attr", "predicted"), field("name", "obsolete node"))],
    ]);
  });

  test("parses attribute and neighbor count comparators", () => {
    assertParses("attrs:>=2 and neighbors:>1", [
      [">=", "2"],
      [{ metric: "neighbors", comparator: ">", value: 1 }],
    ]);
  });

  test("rejects type as an unsupported field", () => {
    assert.throws(() => parseAttribsFilter("type:kinase"), /Unknown field 'type'/);
  });

  test("rejects fields without values", () => {
    assert.throws(() => parseAttribsFilter("attr:"), /Expected a value after 'attr:'/);
  });

  test("rejects metric fields without comparators", () => {
    assert.throws(() => parseAttribsFilter("neighbors:3"), /Expected a comparator and number after 'neighbors:'/);
  });

  test("rejects unclosed quotes", () => {
    assert.throws(() => parseAttribsFilter('attr:"t2d group'), /Expected a closing quote/);
  });

  test("rejects symbolic boolean operators", () => {
    assert.throws(() => parseAttribsFilter("kinase || phosphatase"), /Use and, or, not/);
  });
});
