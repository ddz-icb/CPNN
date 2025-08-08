export const minCorrForEdgeDescription = (
  <div>
    <p>
      "Minimum (absolute) correlation value or link weight required for display as a link. Increasing this value can significantly improve
      performance."
    </p>
  </div>
);

export const containsSitesDescription = (
  <div>
    <p>Allows to include phosphosite details for the nodes, which must be incorporated into the node ID as shown below.</p>
  </div>
);

export const takeAbsDescription = (
  <div>
    <p>
      When turned off, links with a negative weight value will be discarded. If enabled, the absolute value of the link weights will be taken,
      therefore also displaying negative correlations.
    </p>
  </div>
);

export const spearmanCoefficientDescription = (
  <div>
    <p>
      This option applies exclusively when raw table data is uploaded. If enabled, the raw table data will be converted to a correlation matrix using
      the spearman correlation coefficient. By default the pearson correlation coefficient will be applied.
    </p>
  </div>
);
