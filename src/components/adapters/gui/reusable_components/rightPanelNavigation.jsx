import { SvgIcon } from "./SvgIcon.jsx";
import eyeSvg from "../../../../assets/icons/eye.svg?raw";
import piechartSvg from "../../../../assets/icons/piechart.svg?raw";
import infoCircleSvg from "../../../../assets/icons/infoCircle.svg?raw";

const rightPanelViews = [
  { id: "mapping", label: "Mapping", shortcut: "M", icon: eyeSvg },
  { id: "statistics", label: "Statistics", shortcut: "I", icon: piechartSvg },
  { id: "node", label: "Node info", shortcut: "N", icon: infoCircleSvg },
];

export function RightPanelNavigation({ activeView, nodeAvailable, onSelect }) {
  return (
    <nav className="right-panel-tabs" aria-label="Information views">
      {rightPanelViews.map(({ id, label, shortcut, icon }) => {
        const isActive = activeView === id;
        const isDisabled = id === "node" && !nodeAvailable;
        const title = isDisabled ? "Select a node to view its information" : `Show ${label.toLowerCase()} (${shortcut})`;

        return (
          <button
            key={id}
            type="button"
            className={`right-panel-tab${isActive ? " right-panel-tab--active" : ""}`}
            onClick={() => onSelect(id)}
            aria-label={label}
            aria-current={isActive ? "page" : undefined}
            aria-disabled={isDisabled || undefined}
            aria-keyshortcuts={shortcut}
            disabled={isDisabled}
            title={title}
          >
            <span className="right-panel-tab-icon"><SvgIcon svg={icon} /></span>
            <span className="right-panel-tab-label">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
