export const gravityDescription = (
  <div>
    <p className="margin-0">
      With an active gravitational force, nodes are pulled towards the center of the network. The strength of this force can be adjusted.
    </p>
  </div>
);

export const elevationForceDescription = (
  <div>
    <p className="margin-0">
      Adds height above the graph's base plane based on link count. Highly connected nodes rise higher; nodes with fewer links stay closer to the
      plane. The view opens from the front; drag down to look from above. Other forces leave the height axis alone.
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
      The community force helps to separate distinct communities from one another. A community is defined as a group of densely connected nodes,
      meaning that even nodes within the same connected component can be pulled apart if they belong to different communities. As the force increases,
      the separation between communities becomes more pronounced. The communities are built using the Louvain method for community detection.
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

export const borderDepthDescription = (
  <div>
    <p className="margin-0">Sets the depth of the 3D border, keeping nodes within a front/back range.</p>
  </div>
);

export const checkBorderDescription = (
  <div>
    <p className="margin-0">The border force can be used to contain the graph within an adjustable rectangle.</p>
  </div>
);

export const circleForceDescription = (
  <div>
    <p className="margin-0">
      Components/Clusters can be arranged in a circular layout, with the nodes arranged clockwise in descending order based on the number of adjacent
      nodes. In 3D, the nodes are distributed on a sphere around the component centroid. <br />
      Activating this force automatically disables Link Force. It can be used with Elevation Force, which adds height to the circle.
    </p>
  </div>
);

export const linkForceDescription = (
  <div>
    <p className="margin-0">
      The link force treats links as a rubber band. If a link stretches past its length, it tries to contract. It can be used with Elevation Force.
      Enabling it turns off Circular Force.
    </p>
  </div>
);
