import {
  nodeMappingExample,
  nodeMappingExample2,
  nodeMappingFormat,
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
      This option applies exclusively when raw table data is uploaded. If enabled, the raw table data will be converted to a correlation matrix using
      the spearman correlation coefficient. By default the pearson correlation coefficient will be applied.
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
    <br />
    Node mappings can be uploaded in CSV or TSV format. These mappings must contain an "id" and an "attrib" column. To better understand the required
    format, you can look at examples or download an example mapping below.
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
    You can upload your graphs in JSON, CSV or TSV format. CSV and TSV files must be either structured as a symmetric matrix or raw table data, while
    JSON contains a list of nodes and links. You can download the example graphs below to take a closer look at the required format.<br></br>
    When raw table data is uploaded, a correlation matrix will be computed with either pearson or spearman correlation. For this computation all NaN
    values will be ignored.<br></br>
    Pre-filtering the graph reduces memory consumption and increases performance significantly.<br></br>
    The node-id format and example node-ids are shown below.
    <div className="pad-bottom-05" />
    <PopupTextField textInside={nodeIdFormat} />
    <div className="pad-bottom-05" />
    Examples:
    <div className="pad-bottom-05" />
    <div style={{ display: "flex", gap: "0.5rem", rowGap: "0.75rem", flexWrap: "wrap" }}>
      <PopupTextField textInside={nodeIdExample1} />
      <PopupTextField textInside={nodeIdExample2} />
      <PopupTextField textInside={nodeIdExample3} />
      <PopupTextField textInside={nodeIdExample4} />
    </div>
    <div className="pad-bottom-1" />
  </div>
);
