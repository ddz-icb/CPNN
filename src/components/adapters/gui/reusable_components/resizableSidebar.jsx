import { useResizableSidebar } from "../hooks/useResizableSidebar.js";

export function ResizableSidebar({
  as: Component = "aside",
  side,
  storageKey,
  cssVariable,
  defaultWidth,
  minWidth,
  maxWidth,
  collapseWidth,
  allowGrowth,
  onCollapse,
  className = "",
  style,
  children,
  ...props
}) {
  const resize = useResizableSidebar({
    side,
    storageKey,
    cssVariable,
    defaultWidth,
    minWidth,
    maxWidth,
    collapseWidth,
    allowGrowth,
    onCollapse,
  });

  return (
    <Component
      ref={resize.panelRef}
      className={["resizable-sidebar", `resizable-sidebar--${side}`, className].filter(Boolean).join(" ")}
      style={resize.panelStyle ? { ...style, ...resize.panelStyle } : style}
      {...props}
    >
      <div className={`sidebar-resize-handle sidebar-resize-handle--${side}`} {...resize.handleProps} />
      {children}
    </Component>
  );
}
