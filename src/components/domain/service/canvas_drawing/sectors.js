export function describeSector(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);
  const largeArcFlag = endAngle - startAngle <= Math.PI ? 0 : 1;
  return ["M", cx, cy, "L", start.x, start.y, "A", r, r, 0, largeArcFlag, 1, end.x, end.y, "Z"].join(" ");
}

function polarToCartesian(cx, cy, r, angle) {
  return {
    x: cx + r * Math.cos(angle),
    y: cy + r * Math.sin(angle),
  };
}

