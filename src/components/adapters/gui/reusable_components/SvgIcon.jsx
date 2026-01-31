export function SvgIcon({ svg, className, item, ...rest }) {
  const svgWithClass = className ? svg.replace("<svg", `<svg class="${className}"`) : svg;
  return <span aria-hidden="true" dangerouslySetInnerHTML={{ __html: svgWithClass }} {...rest} />;
}
