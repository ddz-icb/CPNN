export const toolPaper = {
  authors: "",
  year: "",
  title: "Co-Phosphorylation Network Navigator (CPNN): Web Application for Interactive Visualization of Co-phosphorylation Networks",
  journal: "",
  volume: "",
  issue: "",
  pages: "",
  doi: "",
  url: "",
};

// Keep the visible imprint concise. Add register, tax, regulatory, or
// professional details here only if they apply to the actual provider.
export const imprintFields = [
  { label: "Provider / legal entity", value: "" },
  { label: "Authorized representative (legal entities)", value: "" },
  { label: "Service address", value: "" },
  { label: "Email", value: "" },
];

function normalizeDoi(doi = "") {
  return doi.replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, "").trim();
}

export function formatToolPaperCitation(paper = toolPaper) {
  const publicationDetails = [
    paper.volume,
    paper.issue ? `(${paper.issue})` : "",
    paper.pages,
  ].filter(Boolean).join(" ");
  const doi = normalizeDoi(paper.doi);

  return [
    paper.authors,
    paper.year ? `(${paper.year}).` : "",
    paper.title ? `${paper.title}.` : "",
    paper.journal ? `${paper.journal}${publicationDetails ? `, ${publicationDetails}` : ""}.` : "",
    doi ? `https://doi.org/${doi}` : paper.url,
  ].filter(Boolean).join(" ");
}
