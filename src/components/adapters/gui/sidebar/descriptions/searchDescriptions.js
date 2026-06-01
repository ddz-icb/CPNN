import { PopupTextField } from "../../reusable_components/sidebarComponents.js";

export const nodeSearchDescription = (
  <div>
    <div className="margin-0">
      You can search graph nodes by formulating a query. Simple text queries are matched against node IDs and node attributes. Attribute expressions
      use the same syntax as attribute filters: combine groups with <PopupTextField textInside={"and"} />, allow alternatives inside parentheses with{" "}
      <PopupTextField textInside={"or"} />, quote attributes with more than one word, and use <PopupTextField textInside={"not"} /> to exclude
      attributes. You can also group several attributes as a set, for example{" "}
      <PopupTextField textInside={'{mRNA splicing, signaling, "glucose metabolism"}'} />, or restrict the number of attributes with{" "}
      <PopupTextField textInside={">"} />, <PopupTextField textInside={">="} />, <PopupTextField textInside={"<"} />,{" "}
      <PopupTextField textInside={"<="} /> or <PopupTextField textInside={"="} />.
    </div>
    <div className="pad-top-1" />
    <div>
      For example, with node attributes such as <PopupTextField textInside={"mRNA splicing"} />, <PopupTextField textInside={"glucose metabolism"} />,{" "}
      <PopupTextField textInside={"VEGF signaling"} /> and <PopupTextField textInside={"MTOR signaling"} />, some valid searches could be:
    </div>
    <div className="pad-top-05" />
    <PopupTextField textInside={"AKT1"} /> <PopupTextField textInside={"signaling"} /> <PopupTextField textInside={"not signaling"} />{" "}
    <PopupTextField textInside={">= 2"} /> <PopupTextField textInside={"not {MTOR, VEGF, mRNA}"} />{" "}
    <PopupTextField textInside={'signaling and "mRNA splicing"'} /> <PopupTextField textInside={"(metabolism or signaling) and >= 2"} />{" "}
    <PopupTextField textInside={'("mRNA splicing" or VEGF) and ("glucose metabolism" or MTOR)'} />
  </div>
);

export const linkSearchDescription = (
  <div>
    <div className="margin-0">
      You can search graph links by formulating a query. Simple text queries are matched against link IDs, link endpoints, link attributes and link
      weights. Attribute expressions use the same syntax as attribute filters: combine groups with <PopupTextField textInside={"and"} />, allow
      alternatives inside parentheses with <PopupTextField textInside={"or"} />, quote attributes with more than one word, and use{" "}
      <PopupTextField textInside={"not"} /> to exclude attributes. You can also group several attributes as a set, for example{" "}
      <PopupTextField textInside={"{lean, obese, t2d}"} />, or restrict the number of link attributes with <PopupTextField textInside={">"} />,{" "}
      <PopupTextField textInside={">="} />, <PopupTextField textInside={"<"} />, <PopupTextField textInside={"<="} /> or{" "}
      <PopupTextField textInside={"="} />.
    </div>
    <div className="pad-top-1" />
    <div>
      For example, with link attributes such as <PopupTextField textInside={"lean group"} />, <PopupTextField textInside={"obese group"} /> and{" "}
      <PopupTextField textInside={"t2d group"} />, some valid searches could be:
    </div>
    <div className="pad-top-05" />
    <PopupTextField textInside={"AKT1"} /> <PopupTextField textInside={"t2d"} /> <PopupTextField textInside={"not lean"} />{" "}
    <PopupTextField textInside={">= 2"} /> <PopupTextField textInside={"not {lean, obese}"} /> <PopupTextField textInside={'"t2d group" and lean'} />{" "}
    <PopupTextField textInside={"(obese or lean) and >= 2"} /> <PopupTextField textInside={"(obese or lean) and t2d"} />
  </div>
);
