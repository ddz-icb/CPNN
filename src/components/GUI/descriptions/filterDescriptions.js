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

export const minCompSizeDescription = (
  <div>
    <p className="margin-0">
      You can filter the components/clusters by setting a minimum size. If a given component is smaller than the applied threshold, the whole
      component will not be drawn. Increasing this value can significantly enhance performance by reducing the graph size.
    </p>
  </div>
);

export const maxCompSizeDescription = (
  <div>
    <p className="margin-0">
      You can filter the components/clusters by setting a maximum size. If a given component is greater than the applied threshold, the whole
      component will not be drawn. Decreasing this value can significantly enhance performance by reducing the graph size.
    </p>
  </div>
);

export const minNeighborhoodSizeDescription = (
  <div>
    <p className="margin-0">
      You can filter the graph by setting a minimum neighborhood size. If a given node has less neighbors than the applied threshold, the node will
      not be drawn. Increasing this value can significantly enhance performance by reducing the graph size.
    </p>
  </div>
);

export const compDensityDescription = (
  <div>
    <p className="margin-0">
      You can filter the components/clusters based on their density. The density is measured as the average amount of neighbors per node. If a given
      component has a smaller density than the applied threshold, the component will not be drawn. Increasing this value can significantly enhance
      performance by reducing the graph size.
    </p>
  </div>
);
