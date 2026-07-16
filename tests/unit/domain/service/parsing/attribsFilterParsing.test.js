import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { parseAttribsFilter } from "../../../../../src/components/domain/service/parsing/attribsFilterParsing.js";

describe("parseAttribsFilter", () => {
  test("rejects type as an unsupported field", () => {
    assert.throws(() => parseAttribsFilter("type:kinase"), /Unknown field 'type'/);
  });
});
