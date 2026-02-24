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
    <div className="pad-bottom-1" />
  </div>
);

export const uploadGraphDescription = (
  <div>
    <p className="margin-0">
      Select your preferred data format. You can read more about the different data formats by clicking the small info icon next to the selection.
    </p>
    <p className="margin-0">You can also enable prefilters for the graph to reduce it's base size, significantly enhancing it's performance.</p>
    <br></br>
  </div>
);

export const uploadGraphDataFormat = (
  <div>
    <p className="margin-0">
      <strong>Listed Data (JSON):</strong> Upload a JSON file that already contains nodes and links. JSON uploads keep their existing link attributes.
    </p>
    <br></br>
    <p className="margin-0">
      <strong>Correlation Matrix (TSV/CSV):</strong> Upload a symmetric matrix table. Use <PopupTextField inline={true} textInside={"id"} /> as the
      first column header. Links are created directly from the matrix and use the uploaded file name as link attribute.
    </p>
    <br></br>
    <p className="margin-0">
      <strong>Tabular Data (TSV/CSV):</strong> Upload tabular measurements (also with <PopupTextField inline={true} textInside={"id"} /> as the first
      column header). The table is converted to a correlation graph using Pearson (default) or Spearman. NaN values are ignored, and generated links
      use the uploaded file name as link attribute.
    </p>
    <br></br>
    <p className="margin-0">
      <strong>Node IDs:</strong> they can be as simple as <PopupTextField inline={true} textInside={"ID_Name"} /> (or{" "}
      <PopupTextField inline={true} textInside={"ID1_Name1; ID2_Name2"} />
      ). Optional site information can be appended (for example <PopupTextField inline={true} textInside={"P08590_MYL3_T165"} />
      ). Using UniProt IDs adds more information via API references.
    </p>
    <div className="pad-bottom-05" />
    Format:
    <div className="pad-bottom-05" />
    <PopupTextField textInside={nodeIdFormat} />
    <div className="pad-bottom-05" />
    Examples:
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
