import { getGraphMetadataEntries } from "../../../domain/service/graph_calculations/graphMetadata.js";

function SourceLink({ url, children }) {
  // Uploaded graph metadata is untrusted; never render executable URL schemes.
  let safeUrl;
  try {
    const parsed = new URL(url);
    if (["https:", "http:"].includes(parsed.protocol)) safeUrl = parsed.href;
  } catch { /* Render a plain label for absent or malformed URLs. */ }
  return safeUrl ? <a href={safeUrl} target="_blank" rel="noopener noreferrer">{children}</a> : <span>{children}</span>;
}

export function GraphReferences({ metadata, label = "References" }) {
  const entries = [...new Map(getGraphMetadataEntries(metadata)
    .filter((entry) => entry.references?.length || typeof entry.attribution === "string")
    .map((entry) => [JSON.stringify(entry), entry])).values()];
  if (!entries.length) return null;
  return (
    <details className="graph-references">
      <summary>{label}</summary>
      {entries.map((entry, index) => {
        const reference = Array.isArray(entry.references) ? entry.references[0] : null;
        const license = Array.isArray(entry.licenses) ? entry.licenses[0] : null;
        return <p key={index}>
          {typeof (entry.shortTitle ?? entry.title) === "string" && <><strong>{entry.shortTitle ?? entry.title}</strong> · </>}
          {reference && <SourceLink url={reference.url}>{reference.shortCitation ?? reference.title}</SourceLink>}
          {!reference && typeof entry.attribution === "string" && entry.attribution}
          {license && <> · <SourceLink url={license.url}>{license.shortName ?? license.name}</SourceLink></>}
          {entry.modifications?.length > 0 && <> · adapted</>}
        </p>;
      })}
    </details>
  );
}
