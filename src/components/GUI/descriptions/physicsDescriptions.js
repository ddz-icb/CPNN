export const gravityDescription = (
  <div>
    <p className="margin-0">
      With an active gravitational force, nodes are pulled towards the center of the network. The strength of this force can be adjusted.
    </p>
  </div>
);

export const componentStrengthDescription = (
  <div>
    <p className="margin-0">
      The component force can be used to separate components from one another. The components separate further with an increasing force.
    </p>
  </div>
);

export const communityForceStrengthDescription = (
  <div>
    <p className="margin-0">
      The community force helps to separate distinct communities from one another. A community is defined as a dense cluster of nodes, meaning that
      even nodes within the same connected component can be pulled apart if they belong to different communities. As the force increases, the
      separation between communities becomes more pronounced. The communities are built using the Louvain method for community detection.
    </p>
  </div>
);

export const nodeRepulsionStrengthDescription = (
  <div>
    <p className="margin-0">
      The node repulsion force is used to maintain a certain distance between nodes. The distance increases with a higher node repulsion force.
    </p>
  </div>
);

export const linkLengthDescription = (
  <div>
    <p className="margin-0">This setting can be used to set the default length of the links.</p>
  </div>
);

export const borderHeightDescription = (
  <div>
    <p className="margin-0">The border height determines the vertical size of the border rectangle.</p>
  </div>
);

export const borderWidthDescription = (
  <div>
    <p className="margin-0">The border height determines the horizontal size of the border rectangle.</p>
  </div>
);
