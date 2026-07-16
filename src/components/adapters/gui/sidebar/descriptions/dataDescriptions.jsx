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
import { PopupTextField } from "../../reusable_components/sidebarComponents.jsx";

export const minLinkCorrDescription = (
  <div>
    <p>
      Minimum absolute correlation value or link weight required for display as a link. Correlation-derived data uses values from 0 to 1; JSON graphs
      can use any finite numeric weights, and links without a weight use 1. Increasing this value can significantly improve performance.
    </p>
  </div>
);

export const maxLinkCorrDescription = (
  <div>
    <p>
      Maximum absolute correlation value or link weight allowed when creating links. Leave empty to keep the full upper range. Decreasing this value
      removes stronger links before the graph is saved.
    </p>
  </div>
);

export const containsSitesDescription = (
  <div>
    <p>Allows optional phosphosite suffixes in node IDs.</p>
  </div>
);

export const ignoreNegativesDescription = (
  <div>
    <p>
      When enabled, links with a negative weight value will be discarded. When disabled, negative weights are kept and the threshold is applied to the
      absolute value.
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
      Based on the specified link weight filters above, set the minimum component/cluster size required for a node to be included in the graph.
      Increasing this value can significantly improve performance.
    </p>
  </div>
);
export const maxCompSizeDescriptionUpload = (
  <div>
    <p>
      Based on the specified link weight filters above, set the maximum component/cluster size required for a node to be included in the graph.
      Decreasing this value can significantly improve performance.
    </p>
  </div>
);

export const uploadNodeMappingDescription = (
  <div>
    Uploading node mappings can provide additional context to classify nodes, determining their color. Nodes can be associated with one or more
    attributes. Nodes belonging to the same attribute will then be colored accordingly.
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
      Choose the upload format that matches your file: JSON for files with nodes and links, correlation matrix for square correlation tables, or
      tabular data for measurement tables.
    </p>
    <p className="margin-0 pad-top-05">
      Prefilters are optional. They reduce the graph during upload, which is useful for very large files, but removed nodes and links will not be
      saved in the uploaded graph.
    </p>
    <br></br>
  </div>
);

export const uploadGraphDataFormat = (
  <div>
    <div className="pad-bottom-2">
      <p className="margin-0">
        <strong>Node IDs:</strong> Simple IDs like <PopupTextField inline={true} textInside={"ID_Name"} /> work. You can group several IDs in one node
        with semicolons, for example <PopupTextField inline={true} textInside={"ID1_Name1; ID2_Name2"} />. Optional phosphosite information can be
        appended, for example <PopupTextField inline={true} textInside={"P08590_MYL3_T165"} />. UniProt-style IDs allow CPNN to fetch more biological
        context from external services.
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
    </div>
    <p className="margin-0">
      <strong>JSON:</strong> The file contains a <PopupTextField inline={true} textInside={"nodes"} /> list and a{" "}
      <PopupTextField inline={true} textInside={"links"} /> list. Each node needs an <PopupTextField inline={true} textInside={"id"} />. Node{" "}
      <PopupTextField inline={true} textInside={"attribs"} /> is optional and can be one attribute or a list. Each link needs{" "}
      <PopupTextField inline={true} textInside={"source"} />, <PopupTextField inline={true} textInside={"target"} />, and{" "}
      <PopupTextField inline={true} textInside={"attrib"} />. <PopupTextField inline={true} textInside={"weight"} /> is optional and defaults to{" "}
      <PopupTextField inline={true} textInside={"1"} />. Add <PopupTextField inline={true} textInside={"directed: true"} /> only for directed links.
    </p>
    <div className="pad-bottom-1" />
    <p className="margin-0">
      <strong>Correlation Matrix (TSV/CSV):</strong> the file is a square correlation matrix. The first column header must be{" "}
      <PopupTextField inline={true} textInside={"id"} />, and the row IDs must match the column IDs. Missing values such as{" "}
      <PopupTextField inline={true} textInside={"NA"} /> are treated as zero-weight links. Created links use the uploaded file name as their
      attribute.
    </p>
    <div className="pad-bottom-1" />
    <p className="margin-0">
      <strong>Tabular Data (TSV/CSV):</strong> rows are IDs and columns are measurements or samples. The first column header must be{" "}
      <PopupTextField inline={true} textInside={"id"} />. CPNN computes correlations between rows using Pearson by default, or Spearman if enabled.
      Generated links use the uploaded file name as their attribute.
    </p>
    <div className="pad-bottom-1" />
  </div>
);
