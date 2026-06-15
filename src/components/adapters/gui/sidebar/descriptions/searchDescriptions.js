import { PopupTextField } from "../../reusable_components/sidebarComponents.js";

export const nodeSearchDescription = (
  <div>
    <div className="margin-0">
      Available fields: <PopupTextField textInside={"name:"} /> full node ID or name, <PopupTextField textInside={"attr:"} /> attribute,{" "}
      <PopupTextField textInside={"attrs:"} /> number of attributes, <PopupTextField textInside={"type:"} />, and{" "}
      <PopupTextField textInside={"neighbors:"} /> distinct adjacent nodes.
    </div>
    <div className="pad-top-1" />
    <div>
      Text fields use substring matching, so the query does not need to match the entire field value. Combine conditions with{" "}
      <PopupTextField textInside={"and"} />, alternatives with <PopupTextField textInside={"or"} /> inside parentheses, and exclusions with{" "}
      <PopupTextField textInside={"not"} />. Use quotes for values containing spaces. Numeric fields support{" "}
      <PopupTextField textInside={"="} />, <PopupTextField textInside={"!="} />, <PopupTextField textInside={">"} />,{" "}
      <PopupTextField textInside={">="} />, <PopupTextField textInside={"<"} />, and <PopupTextField textInside={"<="} />.
    </div>
    <div className="pad-top-05" />
    <div>Examples:</div>
    <PopupTextField textInside={"name:AKT1"} /> <PopupTextField textInside={'name:AKT1 and not attr:"phosphorylation"'} />{" "}
    <PopupTextField textInside={"attr:signaling and neighbors:>3"} />{" "}
    <PopupTextField textInside={"(type:kinase or type:phosphatase) and not attr:predicted"} /> <PopupTextField textInside={"attrs:>=2"} />
  </div>
);

export const linkSearchDescription = (
  <div>
    <div className="margin-0">
      Available fields: <PopupTextField textInside={"name:"} /> link ID or name, <PopupTextField textInside={"attr:"} /> attribute,{" "}
      <PopupTextField textInside={"attrs:"} /> number of attributes, <PopupTextField textInside={"type:"} />,{" "}
      <PopupTextField textInside={"source:"} />, and <PopupTextField textInside={"target:"} />. For bidirectional links, either endpoint matches both
      {" "}<PopupTextField textInside={"source:"} /> and <PopupTextField textInside={"target:"} />.
    </div>
    <div className="pad-top-1" />
    <div>
      Text fields use substring matching, so the query does not need to match the entire field value. Combine conditions with{" "}
      <PopupTextField textInside={"and"} />, alternatives with <PopupTextField textInside={"or"} /> inside parentheses, and exclusions with{" "}
      <PopupTextField textInside={"not"} />. Use quotes for values containing spaces. Numeric fields support{" "}
      <PopupTextField textInside={"="} />, <PopupTextField textInside={"!="} />, <PopupTextField textInside={">"} />,{" "}
      <PopupTextField textInside={">="} />, <PopupTextField textInside={"<"} />, and <PopupTextField textInside={"<="} />.
    </div>
    <div className="pad-top-05" />
    <div>Examples:</div>
    <PopupTextField textInside={"name:T2D"} />{" "}
    <PopupTextField textInside={"source:AKT1 and target:MTOR"} /> <PopupTextField textInside={'attr:"t2d group" and not attr:predicted'} />{" "}
    <PopupTextField textInside={"(type:activation or type:inhibition) and attrs:>=2"} />
  </div>
);
