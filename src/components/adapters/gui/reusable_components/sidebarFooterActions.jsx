import { Button } from "./sidebarComponents.jsx";

export function SidebarFooterActions({ children, className = "" }) {
  return <div className={["sidebar-footer-actions", className].filter(Boolean).join(" ")}>{children}</div>;
}

export function SidebarFooterButton({ className = "", ...props }) {
  return <Button className={["sidebar-footer-action", className].filter(Boolean).join(" ")} {...props} />;
}
