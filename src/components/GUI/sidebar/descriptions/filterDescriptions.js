import { PopUpTextField } from "../../reusable_components/sidebarComponents.js";

export const linkThresholdDescription = (
  <div>
    <p className="margin-0">
      You can filter the links by adjusting their threshold. Links will only be drawn, if their link weight is larger or equal to the set threshold.
      For example, if the weight of a link is 0.75 and the threshold is set to 0.8, the link will not be drawn. Increasing this value can
      significantly enhance performance by reducing the graph size.
    </p>
  </div>
);

export const mergeProteinsDescription = (
  <div>
    <p>
      Nodes with the same UniprotID and Name will be merged into a single node, along with their respective links. When multiple links to the same
      node are merged, the maximum absolute weight is used as the new link weight. Enabling this setting can significantly enhance performance by
      reducing the graph size.
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

export const minNeighborhoodSizeDescription = (
  <div>
    <p className="margin-0">
      You can filter the graph by setting a minimum neighborhood size. If a given node has less neighbors than the applied threshold, the node will
      not be drawn. Increasing this value can significantly enhance performance by reducing the graph size.
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
      with <PopUpTextField textInside={"or"} /> (e.g., <PopUpTextField textInside={"(A or B)"} /> ) are combined using{" "}
      <PopUpTextField textInside={"and"} />. To address one (or multiple) attributes, parts of the attribute name can be used (e.g.{" "}
      <PopUpTextField textInside={"lean"} /> includes all attributes that contain the word "lean"). If the attribute consists of more than one word,
      quotation marks can be used (e.g. <PopUpTextField textInside={'"lean group"'} /> ). To forbid an attribute from occuring the{" "}
      <PopUpTextField textInside={"not"} /> operator can be applied. To address multiple attributes simultaneously, you can group them as a set, for
      example: <PopUpTextField textInside={"{lean, obese, t2d}"} />. To restrict the number of links, you can use the{" "}
      <PopUpTextField textInside={">"} />, <PopUpTextField textInside={">="} />, <PopUpTextField textInside={"<"} />,{" "}
      <PopUpTextField textInside={"<="} /> or <PopUpTextField textInside={"="} /> operators (e.g., <PopUpTextField textInside={">= 2"} /> filters for
      multilinks of size at least 2).
    </div>
    <div className="pad-top-1" />
    <div>
      For example, with the link attributes <PopUpTextField textInside={"lean group"} />, <PopUpTextField textInside={"obese group"} />, and{" "}
      <PopUpTextField textInside={"t2d group"} />, some valid queries could be:
    </div>
    <div className="pad-top-05" />
    <PopUpTextField textInside={"t2d"} /> <PopUpTextField textInside={"not lean"} /> <PopUpTextField textInside={"> 2"} />{" "}
    <PopUpTextField textInside={"not {lean, obese}"} /> <PopUpTextField textInside={'"t2d group" and lean'} />{" "}
    <PopUpTextField textInside={"(obese or lean) and >= 2"} /> <PopUpTextField textInside={"(obese or lean) and t2d"} />{" "}
    <PopUpTextField textInside={"(not t2d or not obese) and lean"} />
  </div>
);

export const nodeFilterDescription = (
  <div>
    <div className="margin-0">
      You can filter the nodes by formulating a query. These queries must follow the Conjunctive Normal Form (CNF), meaning that conditions grouped
      with <PopUpTextField textInside={"or"} /> (e.g., <PopUpTextField textInside={"(A or B)"} /> ) are combined using{" "}
      <PopUpTextField textInside={"and"} />. To address one (or multiple) attributes, parts of the attribute name can be used (e.g.{" "}
      <PopUpTextField textInside={"signaling"} /> includes all attributes that contain the word "signaling"). If the attribute consists of more than
      one word, quotation marks can be used (e.g. <PopUpTextField textInside={'"mRNA splicing"'} /> ). To forbid an attribute from occuring the{" "}
      <PopUpTextField textInside={"not"} /> operator can be applied. To address multiple attributes simultaneously, you can group them as a set, for
      example: <PopUpTextField textInside={'{mRNA splicing, signaling, "glucose metabolism"}'} />. To restrict the number of attributes of a node, you
      can use the <PopUpTextField textInside={">"} />, <PopUpTextField textInside={">="} />, <PopUpTextField textInside={"<"} />,{" "}
      <PopUpTextField textInside={"<="} /> or <PopUpTextField textInside={"="} /> operators (e.g., <PopUpTextField textInside={">= 2"} /> filters for
      nodes with at least 2 attributes).
    </div>
    <div className="pad-top-1" />
    <div>
      For example, with the link attributes <PopUpTextField textInside={"mRNA splicing"} />, <PopUpTextField textInside={"glucose metabolism"} />,{" "}
      <PopUpTextField textInside={"VEGF signaling"} /> and <PopUpTextField textInside={"MTOR signaling"} />, some valid queries could be:
    </div>
    <div className="pad-top-05" />
    <PopUpTextField textInside={"signaling"} /> <PopUpTextField textInside={"not signaling"} /> <PopUpTextField textInside={"> 2"} />{" "}
    <PopUpTextField textInside={"not {MTOR, VEGF, mRNA}"} /> <PopUpTextField textInside={'signaling and "mRNA splicing"'} />{" "}
    <PopUpTextField textInside={"(metabolism or signaling) and >= 2"} />{" "}
    <PopUpTextField textInside={'("mRNA splicing" or VEGF) and ("glucose metabolism" or MTOR)'} />
    <PopUpTextField textInside={'(not "mRNA splicing" or not VEGF)'} />
  </div>
);
