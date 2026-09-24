function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function getGraphMetadataEntries(metadata) {
  if (!isObject(metadata)) return [];
  if (Array.isArray(metadata.sourceGraphs)) {
    return metadata.sourceGraphs.flatMap(getGraphMetadataEntries);
  }
  return [metadata];
}

// Keep each source's terms together rather than assigning one graph's license
// to a combined graph. Graphs without metadata keep their existing shape.
export function mergeGraphMetadata(first, second) {
  const entries = [...getGraphMetadataEntries(first), ...getGraphMetadataEntries(second)];
  const unique = [...new Map(entries.map((entry) => [JSON.stringify(entry), entry])).values()];
  if (unique.length === 0) return undefined;
  if (unique.length === 1) return unique[0];
  return { title: "Combined graph sources", sourceGraphs: unique };
}
