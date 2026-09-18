import { STRING_DB_ENRICHMENT_CATEGORIES } from "../../../domain/service/enrichment/stringDbConfig.js";
import "../../../../styles/attribute_label.css";

const sources = STRING_DB_ENRICHMENT_CATEGORIES.map((category) => category.attributeLabel ?? category.label);

export function AttributeLabel({ value }) {
  const text = String(value ?? "");
  const source = sources.find((source) => text.endsWith(` [${source}]`));
  const term = source ? text.slice(0, -(source.length + 3)) : text;

  return (
    <span className={`attribute-label${source ? " attribute-label--with-source" : ""}`} title={text}>
      <span className="attribute-label-term">{term}</span>
      {source && <span className="attribute-label-source"> [{source}]</span>}
    </span>
  );
}

export function AttributeList({ values = [] }) {
  if (!values?.length) return "None";
  return <span className="attribute-list">{values.map((value, index) => <AttributeLabel key={index} value={value} />)}</span>;
}
