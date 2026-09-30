import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
const graph = JSON.parse(readFileSync(new URL('../../../../../src/assets/TokyoRailwaySystem.json', import.meta.url), 'utf8'));
function hasConnection(a, b, line) {
  const ids = (name) => new Set(graph.nodes.filter((node) => node.name_ja === name).map((node) => node.id));
  const first = ids(a), second = ids(b);
  return graph.links.some((link) => link.attrib.endsWith(` - ${line}`) &&
    ((first.has(link.source) && second.has(link.target)) || (first.has(link.target) && second.has(link.source))));
}
test('Tokyo retains short links through Koya on the Nippori-Toneri Liner', () => {
  assert.ok(hasConnection('扇大橋', '高野', '日暮里・舎人ライナー'));
  assert.ok(hasConnection('高野', '江北', '日暮里・舎人ライナー'));
  assert.equal(graph.filter.minLinkThreshold, 0);
  assert.ok(graph.links.some((link) => link.weight < 0.7));
  assert.equal(graph.links.filter((link) => link.attrib.endsWith(' - 日暮里・舎人ライナー')).length, 12);
});
test('Tokyo closes loops and connects branches without false shortcuts', () => {
  assert.ok(hasConnection('品川', '大崎', 'JR山手線'));
  assert.ok(hasConnection('中野坂上', '中野新橋', '東京メトロ丸ノ内線'));
  assert.ok(!hasConnection('荻窪', '中野新橋', '東京メトロ丸ノ内線'));
  assert.ok(hasConnection('都庁前', '西新宿五丁目', '都営大江戸線'));
  assert.ok(hasConnection('都庁前', '新宿', '都営大江戸線'));
  assert.ok(!hasConnection('新宿', '西新宿五丁目', '都営大江戸線'));
});
test('Tokyo preserves Takanawa Gateway connections despite the older source table', () => {
  assert.ok(hasConnection('田町', '高輪ゲートウェイ', 'JR京浜東北線'));
  assert.ok(hasConnection('高輪ゲートウェイ', '品川', 'JR京浜東北線'));
  assert.ok(!hasConnection('田町', '品川', 'JR京浜東北線'));
});
test('Tokyo edges have valid endpoints and no duplicate line connections', () => {
  const ids = new Set(graph.nodes.map((node) => node.id));
  assert.equal(ids.size, graph.nodes.length);
  const keys = new Set();
  for (const link of graph.links) {
    assert.ok(ids.has(link.source) && ids.has(link.target));
    assert.notEqual(link.source, link.target);
    assert.ok(Number.isFinite(link.weight) && link.weight >= 0);
    const key = JSON.stringify([...([link.source, link.target].sort()), link.attrib]);
    assert.ok(!keys.has(key)); keys.add(key);
  }
});
