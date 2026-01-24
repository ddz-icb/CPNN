import { PopupTextField } from "../../reusable_components/sidebarComponents.js";

export const linkThresholdDescription = (
  <div>
    <p className="margin-0">
      You can filter the links by adjusting their threshold. Links will only be drawn, if their link weight is larger or equal to the set threshold.
      For example, if the weight of a link is 0.75 and the threshold is set to 0.8, the link will not be drawn. Increasing this value can
      significantly enhance performance by reducing the graph size.
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

export const compDensityDescription = (
  <div>
    <p className="margin-0">
      You can filter the components/clusters based on their density. The density is measured as the average amount of neighbors per node. If a given
      component has a smaller density than the applied threshold, the component will not be drawn. Increasing this value can significantly enhance
      performance by reducing the graph size.
    </p>
  </div>
);

export const linkFilterDescription = (
  <div>
    <div className="margin-0">
      You can filter the links by formulating a query. These queries must follow the Conjunctive Normal Form (CNF), meaning that conditions grouped
      with <PopupTextField textInside={"or"} /> (e.g., <PopupTextField textInside={"(A or B)"} /> ) are combined using{" "}
      <PopupTextField textInside={"and"} />. To address one (or multiple) attributes, parts of the attribute name can be used (e.g.{" "}
      <PopupTextField textInside={"lean"} /> includes all attributes that contain the word "lean"). If the attribute consists of more than one word,
      quotation marks can be used (e.g. <PopupTextField textInside={'"lean group"'} /> ). To forbid an attribute from occuring the{" "}
      <PopupTextField textInside={"not"} /> operator can be applied. To address multiple attributes simultaneously, you can group them as a set, for
      example: <PopupTextField textInside={"{lean, obese, t2d}"} />. To restrict the number of links, you can use the{" "}
      <PopupTextField textInside={">"} />, <PopupTextField textInside={">="} />, <PopupTextField textInside={"<"} />,{" "}
      <PopupTextField textInside={"<="} /> or <PopupTextField textInside={"="} /> operators (e.g., <PopupTextField textInside={">= 2"} /> filters for
      multilinks of size at least 2).
    </div>
    <div className="pad-top-1" />
    <div>
      For example, with the link attributes <PopupTextField textInside={"lean group"} />, <PopupTextField textInside={"obese group"} />, and{" "}
      <PopupTextField textInside={"t2d group"} />, some valid queries could be:
    </div>
    <div className="pad-top-05" />
    <PopupTextField textInside={"t2d"} /> <PopupTextField textInside={"not lean"} /> <PopupTextField textInside={"> 2"} />{" "}
    <PopupTextField textInside={"not {lean, obese}"} /> <PopupTextField textInside={'"t2d group" and lean'} />{" "}
    <PopupTextField textInside={"(obese or lean) and >= 2"} /> <PopupTextField textInside={"(obese or lean) and t2d"} />{" "}
    <PopupTextField textInside={"(not t2d or not obese) and lean"} />
  </div>
);

export const nodeFilterDescription = (
  <div>
    <div className="margin-0">
      You can filter the nodes by formulating a query. These queries must follow the Conjunctive Normal Form (CNF), meaning that conditions grouped
      with <PopupTextField textInside={"or"} /> (e.g., <PopupTextField textInside={"(A or B)"} /> ) are combined using{" "}
      <PopupTextField textInside={"and"} />. To address one (or multiple) attributes, parts of the attribute name can be used (e.g.{" "}
      <PopupTextField textInside={"signaling"} /> includes all attributes that contain the word "signaling"). If the attribute consists of more than
      one word, quotation marks can be used (e.g. <PopupTextField textInside={'"mRNA splicing"'} /> ). To forbid an attribute from occuring the{" "}
      <PopupTextField textInside={"not"} /> operator can be applied. To address multiple attributes simultaneously, you can group them as a set, for
      example: <PopupTextField textInside={'{mRNA splicing, signaling, "glucose metabolism"}'} />. To restrict the number of attributes of a node, you
      can use the <PopupTextField textInside={">"} />, <PopupTextField textInside={">="} />, <PopupTextField textInside={"<"} />,{" "}
      <PopupTextField textInside={"<="} /> or <PopupTextField textInside={"="} /> operators (e.g., <PopupTextField textInside={">= 2"} /> filters for
      nodes with at least 2 attributes).
    </div>
    <div className="pad-top-1" />
    <div>
      For example, with the link attributes <PopupTextField textInside={"mRNA splicing"} />, <PopupTextField textInside={"glucose metabolism"} />,{" "}
      <PopupTextField textInside={"VEGF signaling"} /> and <PopupTextField textInside={"MTOR signaling"} />, some valid queries could be:
    </div>
    <div className="pad-top-05" />
    <PopupTextField textInside={"signaling"} /> <PopupTextField textInside={"not signaling"} /> <PopupTextField textInside={"> 2"} />{" "}
    <PopupTextField textInside={"not {MTOR, VEGF, mRNA}"} /> <PopupTextField textInside={'signaling and "mRNA splicing"'} />{" "}
    <PopupTextField textInside={"(metabolism or signaling) and >= 2"} />{" "}
    <PopupTextField textInside={'("mRNA splicing" or VEGF) and ("glucose metabolism" or MTOR)'} />
    <PopupTextField textInside={'(not "mRNA splicing" or not VEGF)'} />
  </div>
);

export const nodeIdFilterDescription = (
  <div>
    <p className="margin-0">
      Provide one node id substring per line (or separate them by commas) to remove every node whose id contains the substring. For example, entering{" "}
      <PopupTextField textInside={"TTN"} /> hides all nodes containing "TTN" anywhere in their id.
    </p>
  </div>
);

export const lassoDescription = (
  <div>
    <p className="margin-0">
      Click "Draw Lasso" to sketch a freehand shape directly on the graph canvas. Nodes that fall outside the finished shape will be filtered out.
    </p>
    <p className="margin-0 pad-top-05">
      The lasso tool turns off automatically after a selection. Use "Clear Lasso Selection" to remove the lasso filter and return to the full filter
      set.
    </p>
  </div>
);
