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
      can use any finite numeric weights. Unweighted links are retained. Increasing this value can significantly improve performance.
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
    Add attributes to nodes to group and color them.
    <br />
    Node mappings can be uploaded as TSV (preferred) or CSV files. The file must contain two columns:{" "}
    <PopupTextField inline={true} textInside={"id"} /> and <PopupTextField inline={true} textInside={"attribs"} />. In the{" "}
    <PopupTextField inline={true} textInside={"attribs"} /> column, separate multiple attributes with{" "}
    <PopupTextField inline={true} textInside={";"} /> (semicolon), or repeat an ID across multiple rows. Attributes from repeated IDs are combined
    without duplicates and added to the existing node attributes.
    <br />
    Use the full node ID, just the protein ID, name or site, or neighboring parts together. For example when matching{" "}
    <PopupTextField inline={true} textInside={"P31749_AKT1_S473"} />, you could use <PopupTextField inline={true} textInside={"AKT1"} />,{" "}
    <PopupTextField inline={true} textInside={"P31749"} />, <PopupTextField inline={true} textInside={"S473"} />,
    <PopupTextField inline={true} textInside={"AKT1_S473"} /> or <PopupTextField inline={true} textInside={"P31749_AKT1_S473"} />. Use complete names
    and numbers: AKT1 will not match AKT10.
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
        <strong>Node IDs:</strong> Start with an ID and a name, separated by an underscore. Add phosphosites if needed. UniProt-style IDs allow CPNN
        to fetch more biological context from external services.
      </p>
      <div className="pad-bottom-05" />
      Format:
      <div className="pad-bottom-05" />
      <PopupTextField textInside={nodeIdFormat} />
      <p className="margin-0 pad-top-05">Brackets mark the optional part; do not include the brackets in your file.</p>
      <ul>
        <li><code>_</code> separates the ID, name, and optional phosphosites.</li>
        <li><code>,</code> separates phosphosites within an entry.</li>
        <li><code>;</code> groups multiple entries into a single node.</li>
        <li>An isoform suffix belongs to the ID, for example <code>Q8WZ42-12</code>.</li>
      </ul>
      <div className="pad-bottom-05" />
      Examples:
      <div className="pad-bottom-05" />
      <div style={{ display: "grid", gap: "0.25rem" }}>
        {[
          ["Basic node", "ID_Name"],
          ["Protein", nodeIdExample1],
          ["One phosphosite", nodeIdExample2],
          ["Multiple phosphosites", nodeIdExample3],
          ["Grouped entries", nodeIdExample0],
          ["With isoform", nodeIdExample4],
        ].map(([label, example]) => (
          <div key={label}>
            {label}: <PopupTextField inline={true} textInside={example} />
          </div>
        ))}
      </div>
      <p className="margin-0 pad-top-05">
        TSV avoids conflicts with commas in phosphosite lists. In CSV files, quote any field containing commas, for example
        {" "}<code>{'"Q8WZ42_TTN_T719,S721"'}</code>.
      </p>
    </div>
    <p className="margin-0">
      <strong>JSON:</strong> The file contains a <PopupTextField inline={true} textInside={"nodes"} /> list and a{" "}
      <PopupTextField inline={true} textInside={"links"} /> list. Each node needs an <PopupTextField inline={true} textInside={"id"} />. Node{" "}
      <PopupTextField inline={true} textInside={"attribs"} /> is optional and can be one attribute or a list. Each link needs{" "}
      <PopupTextField inline={true} textInside={"source"} />, <PopupTextField inline={true} textInside={"target"} />, and{" "}
      <PopupTextField inline={true} textInside={"attrib"} />. <PopupTextField inline={true} textInside={"weight"} /> is optional; omit it for an
      unweighted relationship. If supplied, it must be a finite number. Unweighted links are retained by weight filters. Add{" "}
      <PopupTextField inline={true} textInside={"directed: true"} /> only for directed links.
    </p>
    <div className="pad-bottom-1" />
    <p className="margin-0">
      <strong>Correlation Matrix (TSV/CSV):</strong> the file is a square correlation matrix. The first column header must be{" "}
      <PopupTextField inline={true} textInside={"id"} />, and the row IDs must match the column IDs. Missing values such as{" "}
      <PopupTextField inline={true} textInside={"NA"} /> are excluded rather than creating links. Numeric zero remains a valid weight. Created links
      use the uploaded file name as their attribute.
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
