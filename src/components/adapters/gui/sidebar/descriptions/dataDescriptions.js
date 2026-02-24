import {
  nodeMappingExample,
  nodeMappingExample2,
  nodeMappingFormat,
  nodeIdExample0,
  nodeIdExample1,
  nodeIdExample2,
  nodeIdExample3,
  nodeIdExample4,
  nodeIdFormat,
} from "../../../../../assets/format_examples.js";
import { PopupTextField } from "../../reusable_components/sidebarComponents.js";

export const minLinkCorrDescription = (
  <div>
    <p>
      "Minimum (absolute) correlation value or link weight required for display as a link. Increasing this value can significantly improve
      performance."
    </p>
  </div>
);

export const containsSitesDescription = (
  <div>
    <p>Allows to include phosphosite details for the nodes, which must be incorporated into the node ID as shown below.</p>
  </div>
);

export const ignoreNegativesDescription = (
  <div>
    <p>
      When enabled, links with a negative weight value will be discarded. When disabled, negative correlations are kept and the threshold is applied
      to the absolute value.
    </p>
  </div>
);

export const spearmanCoefficientDescription = (
  <div>
    <p>
      This option applies exclusively when tabular data is uploaded. If enabled, the tabular data will be converted to a correlation matrix using the
      spearman correlation coefficient. By default the pearson correlation coefficient will be applied.
    </p>
  </div>
);

export const minCompSizeDescriptionUpload = (
  <div>
    <p>
      Based on the specified minimum link correlation above, set the minimum component/cluster size required for a node to be included in the graph.
      Increasing this value can significantly improve performance.
    </p>
  </div>
);
export const maxCompSizeDescriptionUpload = (
  <div>
    <p>
      "Based on the specified minimum link correlation above, set the maximum component/cluster size required for a node to be included in the graph.
      Decreasing this value can significantly improve performance."{" "}
    </p>
  </div>
);

export const generatedLinkAttribDescription = (
  <div>
    <p>
      Used for CSV/TSV graph uploads (correlation matrices and tabular data). All generated links will receive this attribute label. JSON uploads keep
      their existing link attributes.
    </p>
  </div>
);

export const uploadNodeMappingDescription = (
  <div>
    Uploading node mappings can provide additional context to classify nodes, determining their color. By doing so, nodes −such as peptides− are
    associated with one or more attributes. Nodes belonging to the same attribute will then be colored accordingly.
    <br />
    Node mappings can be uploaded as TSV (preferred) or CSV files. The file must contain two columns:{" "}
    <PopupTextField inline={true} textInside={"id"} /> and <PopupTextField inline={true} textInside={"attribs"} />. In the{" "}
    <PopupTextField inline={true} textInside={"attribs"} /> column, separate multiple attributes with{" "}
    <PopupTextField inline={true} textInside={";"} /> (semicolon). A mapping row is applied to all nodes whose ID contains the mapping{" "}
    <PopupTextField inline={true} textInside={"id"} /> value as a substring. To better understand the required format, you can look at examples or
    download an example mapping below.
    <div className="pad-bottom-05" />
    <PopupTextField textInside={nodeMappingFormat} />
    <div className="pad-bottom-05" />
    Examples:
    <div className="pad-bottom-025" />
    <PopupTextField textInside={nodeMappingExample} />
    <div className="pad-bottom-025" />
    <PopupTextField textInside={nodeMappingExample2} />
  </div>
);

export const uploadGraphDescription = (
  <div>
    <p className="margin-0">
      You can upload graphs as JSON, TSV (preferred), or CSV. TSV/CSV files must be either a symmetric correlation matrix or tabular data, while JSON
      contains a list of nodes and links. For matrix/tabular uploads, use <PopupTextField inline={true} textInside={"id"} /> as the first column
      header.
      <br />
      Tabular data is converted to a correlation matrix using Pearson (default) or Spearman. NaN values are ignored.
      <br />
      For TSV/CSV uploads, set the generated link attribute in the popup. JSON uploads keep their existing link attributes.
      <br />
      Pre-filtering can reduce memory usage and improve performance.
    </p>
    <div className="pad-bottom-05" />
    <p className="margin-0">
      <strong>Node IDs:</strong> they can be as simple as <PopupTextField inline={true} textInside={"ID_Name"} /> (or{" "}
      <PopupTextField inline={true} textInside={"ID1_Name1; ID2_Name2"} />
      ). Optional site information can be appended (for example <PopupTextField inline={true} textInside={"P08590_MYL3_T165"} />
      ). Using UniProt IDs adds more information via API references.
    </p>
    <div className="pad-bottom-05" />
    Node-id format:
    <div className="pad-bottom-05" />
    <PopupTextField textInside={nodeIdFormat} />
    <div className="pad-bottom-05" />
    Node-id examples:
    <div className="pad-bottom-05" />
    <div style={{ display: "flex", gap: "0.5rem", rowGap: "0.75rem", flexWrap: "wrap" }}>
      <PopupTextField textInside={nodeIdExample0} />
      <PopupTextField textInside={nodeIdExample1} />
      <PopupTextField textInside={nodeIdExample2} />
      <PopupTextField textInside={nodeIdExample3} />
      <PopupTextField textInside={nodeIdExample4} />
    </div>
    <div className="pad-bottom-1" />
  </div>
);
