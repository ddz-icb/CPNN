import { SvgIcon } from "./SvgIcon.jsx";
import chevronSvg from "../../../../assets/icons/chevron.svg?raw";

export function SidebarEdgeTab({ side, label, description, onClick, controls }) {
  return (
    <button
      className={`sidebar-edge-tab sidebar-edge-tab--${side}`}
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-controls={controls}
      aria-expanded="false"
      title={label}
    >
      <span className="sidebar-edge-tab-arrow" aria-hidden="true">
        <SvgIcon svg={chevronSvg} />
      </span>
      <span className="sidebar-edge-tab-label" aria-hidden="true">
        {description}
      </span>
    </button>
  );
}
