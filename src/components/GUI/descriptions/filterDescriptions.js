export const linkThresholdDescription = (
  <div>
    <p className="margin-0">
      You can filter the links by adjusting their threshold. Links will only be drawn, if their link weight is larger or equal to the set threshold.
      For example, if the weight of a link is 0.75 and the threshold is set to 0.8, the link will not be drawn. Increasing this value can
      significantly enhance performance by reducing the graph size.
    </p>
  </div>
);

export const mergeProteinsDescription = (
  <div>
    <p>
      Nodes with the same UniprotID and Name will be merged into a single node, along with their respective links. When multiple links to the same
      node are merged, the maximum absolute weight is used as the new link weight. Enabling this setting can significantly enhance performance by
      reducing the graph size.
    </p>
  </div>
);
