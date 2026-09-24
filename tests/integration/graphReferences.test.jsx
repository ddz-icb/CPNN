import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, test } from "vitest";
import { GraphReferences } from "../../src/components/adapters/gui/sidebar/graphReferences.jsx";
import { graphService } from "../../src/components/application/services/graphService.js";
import { buildGraphJsonData } from "../../src/components/domain/service/download/graphJsonDownload.js";
import { parseGraphFile } from "../../src/components/domain/service/parsing/graphParsing.js";

let root, host;
afterEach(async () => {
  if (root) await act(async () => root.unmount());
  host?.remove();
  root = null;
});
async function render(element) {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  host = document.createElement("div"); document.body.appendChild(host);
  root = createRoot(host);
  await act(async () => root.render(element));
}

test("built-in graph references load, display, combine, export and reimport", async () => {
  const graph = await graphService.getJoinedGraph(["GloBISpeciesInteractions", "TokyoRailwaySystem"]);
  await render(<GraphReferences metadata={graph.data.metadata} label="References" />);
  expect(host.querySelector("summary").textContent).toBe("References");
  expect(host.textContent).toContain("Poelen et al. (2014)");
  expect(host.textContent.length).toBeLessThan(120);
  expect(host.textContent).not.toContain("Reuse status");
  expect(host.querySelector('a[href="https://creativecommons.org/licenses/by/4.0/"]')).not.toBeNull();
  expect(host.textContent).not.toContain("Value and Vision");
  expect(host.textContent).not.toContain("Ekidata");
  expect(host.querySelector('a[href="https://doi.org/10.1016/j.ecoinf.2014.08.005"]')).not.toBeNull();
  expect(host.querySelector('a[href="https://www.ekidata.jp/agreement.php"]')).toBeNull();
  const exported = buildGraphJsonData(graph);
  const file = new File([JSON.stringify(exported)], "references-roundtrip.json", { type: "application/json" });
  const imported = await parseGraphFile(file, { dataFormat: "json" });
  expect(imported.data.metadata).toEqual(exported.metadata);
});

test("source links reject executable URLs and render citation text safely", async () => {
  await render(<GraphReferences metadata={{ references: [
    { title: "<script>bad()</script>", url: "javascript:alert(1)" },
  ], licenses: [{ name: "Valid license", url: "https://example.org/license" }] }} />);
  expect(host.querySelectorAll("a").length).toBe(1);
  expect(host.querySelector("a").rel).toBe("noopener noreferrer");
  expect(host.querySelector("script")).toBeNull();
  expect(host.textContent).toContain("<script>bad()</script>");
});

test("ordinary graph without source metadata gets no empty disclosure", async () => {
  await render(<GraphReferences />);
  expect(host.innerHTML).toBe("");
});
