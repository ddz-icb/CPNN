import { ParsedFilterBlock } from "../reusable_components/parsedFilterBlock.jsx";
import { useFilter } from "../../state/filterState.js";
import { parseAttribsFilter } from "../../../domain/service/parsing/attribsFilterParsing.js";
import { linkFilterDescription, nodeFilterDescription } from "./descriptions/filterDescriptions.jsx";

export function LinkAttribFilterBlock() {
  return (
    <AttribFilterBlock
      text={"Filter Links by Attributes"}
      infoHeading={"Filtering Links by Attributes"}
      infoDescription={linkFilterDescription}
      filterKey={"linkFilter"}
      filterTextKey={"linkFilterText"}
    />
  );
}

export function NodeAttribFilterBlock() {
  return (
    <AttribFilterBlock
      text={"Filter Nodes by Attributes"}
      infoHeading={"Filter Nodes by Attributes"}
      infoDescription={nodeFilterDescription}
      filterKey={"nodeFilter"}
      filterTextKey={"nodeFilterText"}
    />
  );
}

function AttribFilterBlock({ text, infoHeading, infoDescription, filterKey, filterTextKey }) {
  const { filter, setFilter } = useFilter();

  return (
    <ParsedFilterBlock
      text={text}
      infoHeading={infoHeading}
      infoDescription={infoDescription}
      valueText={filter[filterTextKey] ?? ""}
      setValueText={(value) => setFilter(filterTextKey, value)}
      setValue={(value) => setFilter(filterKey, value)}
      parse={parseAttribsFilter}
    />
  );
}
