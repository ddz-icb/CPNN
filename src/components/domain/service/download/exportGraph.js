import { jsPDF } from "jspdf";

function getNodeVisual(node, nodeMapEntry, threeD) {
  const circle = nodeMapEntry?.circle;
  const nodeLabel = nodeMapEntry?.nodeLabel;

  if (!circle) return null;

  if (threeD && circle && circle.visible === false) {
    return null;
  }

  const scale = circle?.scale?.x ?? 1;
  const depth = circle?.zIndex != null ? -circle.zIndex : 0;
  const x = circle?.x ?? node.x ?? 0;
  const y = circle?.y ?? node.y ?? 0;

  return {
    ...node,
    x,
    y,
    scale,
    depth,
    labelVisible: nodeLabel?.visible ?? false,
    labelX: nodeLabel?.x ?? x,
    labelY: nodeLabel?.y ?? y,
    labelText: nodeLabel?.text ?? node.id,
  };
}

export function buildExportGraphData(graphData, nodeMap, { threeD } = {}) {
  if (!graphData?.nodes || !graphData?.links) return null;

  const nodes = [];
  const nodeLookup = new Map();

  for (const node of graphData.nodes) {
    const visual = getNodeVisual(node, nodeMap?.[node.id], threeD);
    if (!visual) continue;
    nodes.push(visual);
    nodeLookup.set(node.id, visual);
  }

  const links = graphData.links
    .map((link) => {
      const sourceId = typeof link.source === "object" ? link.source.id : link.source;
      const targetId = typeof link.target === "object" ? link.target.id : link.target;

      const source = nodeLookup.get(sourceId);
      const target = nodeLookup.get(targetId);
      if (!source || !target) return null;

      const depth = Math.max(source.depth ?? 0, target.depth ?? 0);

      return {
        ...link,
        depth,
        source: { x: source.x, y: source.y, scale: source.scale, depth: source.depth },
        target: { x: target.x, y: target.y, scale: target.scale, depth: target.depth },
      };
    })
    .filter(Boolean);

  return { nodes, links };
}

const round2 = (v) => Math.round(v * 100) / 100;

export function cleanNodes(nodes) {
  return nodes.map((node) => {
    const { vx, vy, vz, fx, fy, fz, index, ...rest } = node;

    const result = { ...rest };

    if (typeof node.x === "number") result.x = round2(node.x);
    if (typeof node.y === "number") result.y = round2(node.y);
    if (typeof node.z === "number") result.z = round2(node.z);

    return result;
  });
}

export function cleanNodesNoCoords(nodes) {
  return nodes.map((node) => {
    const { x, y, z, vx, vy, vz, fx, fy, fz, index, ...rest } = node;

    const result = { ...rest };

    return result;
  });
}

export function cleanLinks(links) {
  return links.map((link) => {
    const sourceId = typeof link.source === "object" ? link.source.id : link.source;
    const targetId = typeof link.target === "object" ? link.target.id : link.target;

    const { source, target, index, ...rest } = link;

    return {
      ...rest,
      source: sourceId,
      target: targetId,
    };
  });
}

export function drawLegendOnPdf(
  pdf,
  offsetX,
  offsetY,
  nodeColorscheme,
  nodeAttribsToColorIndices,
  linkColorscheme,
  linkAttribsToColorIndices,
  mapping,
  section = "both"
) {
  const padding = 20;
  const rectSize = 12;
  const rectSpacing = 8;
  const labelFontSize = 11;
  const headerFontSize = 13;
  const headerBottomSpacing = 10;
  const rowSpacing = 6;
  const groupSpacing = 16;

  const sectionsConfig = [
    {
      key: "nodes",
      attribs: nodeAttribsToColorIndices ?? {},
      colorscheme: nodeColorscheme ?? {},
    },
    {
      key: "links",
      attribs: linkAttribsToColorIndices ?? {},
      colorscheme: linkColorscheme ?? {},
    },
  ];

  const normalizedSection = typeof section === "string" ? section.toLowerCase() : "both";
  let sections = normalizedSection === "both" ? sectionsConfig : sectionsConfig.filter(({ key }) => key === normalizedSection);

  sections = sections.map((sectionConfig) => {
    const { attribs, colorscheme } = sectionConfig;
    const validKeys = Object.keys(attribs).filter((key) => {
      if (!Object.hasOwnProperty.call(attribs, key)) return false;
      const colorIndex = attribs[key];
      return Boolean(colorscheme[colorIndex]);
    });
    return { ...sectionConfig, validKeys };
  });

  if (!sections.length) return { legendWidth: 0, legendHeight: 0 };

  const tempPdf = new jsPDF({ unit: "pt" });
  tempPdf.setFontSize(labelFontSize);
  let maxTextWidth = tempPdf.getTextWidth("No Value Available");

  sections.forEach(({ validKeys }) => {
    validKeys.forEach((key) => {
      maxTextWidth = Math.max(maxTextWidth, tempPdf.getTextWidth(key));
    });
  });

  const legendWidth = padding * 2 + rectSize + rectSpacing + maxTextWidth;

  tempPdf.setFontSize(headerFontSize);
  const headerMetricsSample = typeof tempPdf.getTextDimensions === "function" ? tempPdf.getTextDimensions("Ag") : null;
  const headerSampleHeight = headerMetricsSample?.h ?? headerFontSize;
  const headerSampleBaseline = headerMetricsSample?.baseline ?? headerSampleHeight * 0.8;
  const headerBlockHeight = headerSampleBaseline + headerBottomSpacing;

  const sectionHeights = sections.map(({ validKeys }) => {
    const rowCount = validKeys.length + 1;
    const rowsHeight = rowCount * rectSize + rowSpacing * Math.max(rowCount - 1, 0);
    return headerBlockHeight + rowsHeight;
  });
  const legendHeight =
    padding * 2 + sectionHeights.reduce((height, sectionHeight) => height + sectionHeight, 0) + groupSpacing * Math.max(sections.length - 1, 0);

  pdf.setFillColor(255, 255, 255);
  pdf.rect(offsetX, offsetY, legendWidth, legendHeight, "F");
  pdf.setDrawColor(220, 220, 220);
  pdf.rect(offsetX, offsetY, legendWidth, legendHeight);

  let yPos = offsetY + padding;
  pdf.setTextColor(60, 60, 60);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(labelFontSize);

  const metricsSample = typeof pdf.getTextDimensions === "function" ? pdf.getTextDimensions("Ag") : null;
  const sampleHeight = metricsSample?.h ?? labelFontSize;
  const sampleBaseline = metricsSample?.baseline ?? sampleHeight * 0.8;
  const labelBaselineOffset = rectSize / 2 + sampleBaseline - sampleHeight / 2;

  const headerBaselineOffset = headerSampleBaseline;

  const drawRow = (label, color, isLastRow) => {
    const fillColor = color ?? "#f3f3f3";
    pdf.setFillColor(fillColor);
    pdf.rect(offsetX + padding, yPos, rectSize, rectSize, "F");
    pdf.setDrawColor(230, 230, 230);
    pdf.rect(offsetX + padding, yPos, rectSize, rectSize);
    pdf.setDrawColor(0, 0, 0);

    const baseline = yPos + labelBaselineOffset;
    pdf.text(label, offsetX + padding + rectSize + rectSpacing, baseline);

    yPos += rectSize;
    if (!isLastRow) {
      yPos += rowSpacing;
    }
  };

  sections.forEach(({ key, validKeys, attribs, colorscheme }, sectionIndex) => {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(headerFontSize);
    const headerLabel = key === "nodes" ? "Nodes" : "Links";
    pdf.text(headerLabel, offsetX + padding, yPos + headerBaselineOffset);
    yPos += headerBlockHeight;

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(labelFontSize);
    const rows = validKeys
      .map((key) => ({
        label: key,
        color: colorscheme[attribs[key]],
      }))
      .concat({ label: "No Value Available", color: "#f3f3f3" });

    rows.forEach((row, rowIndex) => {
      const isLastRow = rowIndex === rows.length - 1;
      drawRow(row.label, row.color, isLastRow);
    });

    if (sectionIndex < sections.length - 1) {
      yPos += groupSpacing;
    }
  });

  return { legendWidth, legendHeight };
}
