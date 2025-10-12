import {
  mappingExample,
  mappingExample2,
  mappingFormat,
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

export const takeAbsDescription = (
  <div>
    <p>
      When turned off, links with a negative weight value will be discarded. If enabled, the absolute value of the link weights will be taken,
      therefore also displaying negative correlations.
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

export const uploadPathwayMappingDescription = (
  <div>
    Uploading pathway mappings can provide additional context to classify nodes, determining their color. By doing so, nodes −such as peptides− are
    associated with one or more pathways. Nodes belonging to the same pathway will then be colored accordingly.
    <br />
    <br />
    Pathway mappings can be uploaded in CSV or TSV format. These mappings must contain a "UniProt-ID" and a "Pathway Name" column. To better
    understand the required format, you can look at examples or download an example mapping below.
    <div className="pad-bottom-05" />
    <PopupTextField textInside={mappingFormat} />
    <div className="pad-bottom-05" />
    Examples:
    <div className="pad-bottom-025" />
    <PopupTextField textInside={mappingExample} />
    <div className="pad-bottom-025" />
    <PopupTextField textInside={mappingExample2} />
  </div>
);

export const uploadGraphDescription = (
  <div>
    You can upload your graphs in JSON, CSV or TSV format. CSV and TSV files must be either structured as a symmetric matrix or raw table data, while
    JSON contains a list of nodes and links. You can download the example graphs below to take a closer look at the required format. When raw table
    data is uploaded, a correlation matrix will be automatically computed. For this computation all NaN values will be ignored. The node-id format and
    example node-ids are shown below.
    <div className="pad-bottom-05" />
    <PopupTextField textInside={nodeIdFormat} />
    <div className="pad-bottom-05" />
    Examples:
    <div className="pad-bottom-025" />
    <PopupTextField textInside={nodeIdExample1} />
    <div className="pad-bottom-025" />
    <PopupTextField textInside={nodeIdExample2} />
    <div className="pad-bottom-025" />
    <PopupTextField textInside={nodeIdExample3} />
    <div className="pad-bottom-025" />
    <PopupTextField textInside={nodeIdExample4} />
  </div>
);
