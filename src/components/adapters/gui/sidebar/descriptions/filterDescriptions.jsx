import { PopupTextField } from "../../reusable_components/sidebarComponents.jsx";

export const minLinkThresholdDescription = (
  <div>
    <p className="margin-0">
      Filter links by minimum absolute weight. The slider range is based on the smallest and largest absolute link weight in the loaded graph, so
      weights do not need to be limited to 0 to 1. Increasing this value keeps only stronger links.
    </p>
  </div>
);

export const maxLinkThresholdDescription = (
  <div>
    <p className="margin-0">
      Filter links by maximum absolute weight. The slider range is based on the smallest and largest absolute link weight in the loaded graph.
      Decreasing this value removes links above the selected weight.
    </p>
  </div>
);

export const mergeByNameDescription = (
  <div>
    <p>
      Nodes with the same name will be merged into a single node, along with their respective links. When multiple links to the same node are merged,
      the maximum absolute weight is used as the new link weight. Enabling this setting can significantly enhance performance by reducing the graph
      size.
    </p>
  </div>
);

export const omniPathEnrichmentDescription = (
  <div>
    <p className="margin-0">
      Tags existing nodes as kinases and adds phosphorylation links based on enzyme–substrate interactions from <strong>OmniPath</strong> (Türei et
      al., <em>Nat. Methods</em> 2016; omnipathdb.org). OmniPath aggregates data from multiple upstream databases including PhosphoSitePlus, SIGNOR,
      PhosphoELM, and HPRD.
    </p>
    <p className="margin-0 pad-top-05">
      Matching is phosphosite-aware: if a substrate node includes phosphosites, an OmniPath record must match one of those sites. Nodes without
      phosphosite annotations are matched at protein level.
    </p>
    <p className="margin-0 pad-top-05">
      Note: OmniPath phosphorylation links are excluded from structural filters (k-core, component/community size and density).
    </p>
  </div>
);

export const omniPathPhosphataseEnrichmentDescription = (
  <div>
    <p className="margin-0">
      Tags existing nodes as phosphatases and adds dephosphorylation links from OmniPath enzyme-substrate records supported by the DEPOD phosphatase
      resource.
    </p>
    <p className="margin-0 pad-top-05">
      Matching is phosphosite-aware: if a substrate node includes phosphosites, an OmniPath record must match one of those sites. Nodes without
      phosphosite annotations are matched at protein level.
    </p>
    <p className="margin-0 pad-top-05">
      Note: OmniPath dephosphorylation links are excluded from structural filters (k-core, component/community size and density).
    </p>
  </div>
);

export const omniPathCurationEffortDescription = (
  <div>
    <p className="margin-0">
      Keep only OmniPath records with at least this curation effort value. OmniPath defines this as the number of unique resource-reference pairs
      supporting a record.
    </p>
  </div>
);

export const stringDbEnrichmentDescription = (
  <div>
    <p className="margin-0">
      Adds protein–protein interaction links from <strong>STRING</strong> (Szklarczyk et al., <em>Nucleic Acids Res.</em> 2023; string-db.org) for
      nodes with UniProt IDs. STRING integrates evidence from genomic context, co-expression, text mining, and experimental data. Added links use a
      separate attribute with a fixed weight of 1.
    </p>
    <p className="margin-0 pad-top-05">Note: STRING-DB links are excluded from structural filters (k-core, component/community size and density).</p>
  </div>
);

export const stringDbEvidenceDescription = (
  <div>
    <p className="margin-0">
      Adds separate STRING link attributes for evidence channels such as experimental, database, coexpression, and text mining support. These
      attributes are added only for channels above the selected evidence score.
    </p>
  </div>
);

export const stringDbNodeAttributeDescription = (
  <div>
    <p className="margin-0">
      Adds the top overrepresented STRING enrichment terms to existing nodes using STRING's returned enrichment order and categories.
    </p>
    <p className="margin-0 pad-top-05">
      Terms are ranked by false discovery rate and gene coverage. Max terms limits how many enriched terms are kept, and max FDR controls the
      accepted significance threshold.
    </p>
  </div>
);

export const stringDbNodeAttributeCategoryDescription = (
  <div>
    <p className="margin-0">
      Choose whether node attributes use all STRING enrichment sources together or only one source such as Reactome, KEGG, Gene Ontology, or
      WikiPathways.
    </p>
  </div>
);

export const stringDbGroupEnrichmentDescription = (
  <div>
    <p className="margin-0">
      Labels graph communities with their strongest STRING enrichment term. The current community resolution is used; set resolution to 0 to label
      connected components instead.
    </p>
  </div>
);

export const stringDbMinEvidenceDescription = (
  <div>
    <p className="margin-0">Minimum STRING channel score required before an evidence-specific link attribute is added.</p>
  </div>
);

export const stringDbGroupEnrichmentFdrDescription = (
  <div>
    <p className="margin-0">Maximum false discovery rate for accepting a STRING enrichment term as a community label.</p>
  </div>
);

export const stringDbSpeciesDescription = (
  <div>
    <p className="margin-0">Select the species used for STRING-DB lookups. Make sure it matches the proteins in your graph.</p>
  </div>
);

export const stringDbMinConfidenceDescription = (
  <div>
    <p className="margin-0">
      Set the minimum STRING confidence score (0 to 1) for additional interactions. Higher values keep only stronger evidence.
    </p>
  </div>
);

export const minCompSizeDescription = (
  <div>
    <p className="margin-0">
      You can filter the components/clusters by setting a minimum size. If a given component is smaller than the applied threshold, the whole
      component will not be drawn. Increasing this value can significantly enhance performance by reducing the graph size.
    </p>
  </div>
);

export const maxCompSizeDescription = (
  <div>
    <p className="margin-0">
      You can filter the components/clusters by setting a maximum size. If a given component is greater than the applied threshold, the whole
      component will not be drawn. Decreasing this value can significantly enhance performance by reducing the graph size.
    </p>
  </div>
);

export const minKCoreSizeDescription = (
  <div>
    <p className="margin-0">
      You can filter the graph by removing nodes with too few connections. The threshold defines the minimum number of neighbors a node must have to
      stay in the graph. Nodes below this value are removed step by step until only well-connected nodes remain. Increasing this value can
      significantly enhance performance by reducing the graph size.
    </p>
  </div>
);

export const communityDensityDescription = (
  <div>
    <p className="margin-0">
      You can filter communities based on their density. The density is measured as the average amount of neighbors per node. If a given community has
      a smaller density than the applied threshold, the community will not be drawn. This is applied before community computation, so it can change
      the resulting communities. Increasing this value can significantly enhance performance by reducing the graph size.
    </p>
  </div>
);

export const componentDensityDescription = (
  <div>
    <p className="margin-0">
      You can filter components based on their density. The density is measured as the average amount of neighbors per node. If a given component has
      a smaller density than the applied threshold, the component will not be drawn. Increasing this value can significantly enhance performance by
      reducing the graph size.
    </p>
  </div>
);

export const communityFilterSizeDescription = (
  <div>
    <p className="margin-0">
      Filter out communities outside the given range. Set the minimum to 0 and leave the maximum empty to disable this filter.
    </p>
  </div>
);

export const linkFilterDescription = (
  <div>
    <div className="margin-0">
      Type a word to keep links whose ID, name, attribute, source, or target contains that word. Use a field prefix when you want to search one part of
      the link only.
    </div>
    <div className="pad-top-1" />
    <div>
      Link fields are <PopupTextField textInside={"name:"} /> for link ID or name, <PopupTextField textInside={"attr:"} /> for link attribute,{" "}
      <PopupTextField textInside={"source:"} />, and <PopupTextField textInside={"target:"} />. For undirected links, either endpoint can match source
      or target. Use <PopupTextField textInside={"attrs:"} /> to filter by the number of attributes, for example{" "}
      <PopupTextField textInside={"attrs:>=1"} />.
    </div>
    <div className="pad-top-1" />
    <div>
      Combine filters with <PopupTextField textInside={"and"} />. Put alternatives in parentheses with <PopupTextField textInside={"or"} />. Exclude a
      term with <PopupTextField textInside={"not"} />. Use quotes when a value contains spaces.
    </div>
    <div className="pad-top-05" />
    <div>Examples:</div>
    <PopupTextField textInside={"AKT"} /> <PopupTextField textInside={"attr:phosphorylation"} />{" "}
    <PopupTextField textInside={"source:AKT1 and target:MTOR"} /> <PopupTextField textInside={'attr:"t2d group" and not attr:predicted'} />{" "}
    <PopupTextField textInside={"(attr:activation or attr:inhibition) and attrs:>=1"} />
  </div>
);

export const nodeFilterDescription = (
  <div>
    <div className="margin-0">
      Type a word to keep nodes whose ID, name, label, or attributes contain that word. Use a field prefix when you want to search one part of the node
      only.
    </div>
    <div className="pad-top-1" />
    <div>
      Node fields are <PopupTextField textInside={"name:"} /> for node ID or name and <PopupTextField textInside={"attr:"} /> for attributes. Use{" "}
      <PopupTextField textInside={"attrs:"} /> for the number of attributes and <PopupTextField textInside={"neighbors:"} /> for distinct adjacent
      nodes, for example <PopupTextField textInside={"neighbors:>3"} />. Parallel links to the same node count as one neighbor.
    </div>
    <div className="pad-top-1" />
    <div>
      Combine filters with <PopupTextField textInside={"and"} />. Put alternatives in parentheses with <PopupTextField textInside={"or"} />. Exclude a
      term with <PopupTextField textInside={"not"} />. Use quotes when a value contains spaces.
    </div>
    <div className="pad-top-05" />
    <div>Examples:</div>
    <PopupTextField textInside={"AKT"} /> <PopupTextField textInside={"name:AKT1"} />{" "}
    <PopupTextField textInside={'name:AKT1 and not attr:"phosphorylation"'} />{" "}
    <PopupTextField textInside={"attr:signaling and neighbors:>3"} />{" "}
    <PopupTextField textInside={"(attr:kinase or attr:phosphatase) and not attr:predicted"} /> <PopupTextField textInside={"attrs:>=2"} />
  </div>
);

export const nodeIdFilterDescription = (
  <div>
    <p className="margin-0">
      Provide one substring per line (or separate them by commas) to remove every node whose id contains one of these substrings. For example,
      entering <PopupTextField textInside={"TTN, NEB"} /> hides all nodes containing "TTN" or "NEB" anywhere in their id. Using this setting to filter
      the graph can significantly enhance performance.
    </p>
  </div>
);

export const lassoDescription = (
  <div>
    <p className="margin-0">
      Click "Draw Lasso" to sketch a freehand shape directly on the graph canvas. Nodes that fall outside the finished shape will be filtered out.
      Using this setting to filter the graph can significantly enhance performance.
    </p>
    <p className="margin-0 pad-top-05">
      The lasso tool turns off automatically after a selection. Use "Clear Lasso Selection" to remove the lasso filter and return to the full filter
      set.
    </p>
  </div>
);
