import { SidebarButtonRect, SidebarSliderBlock, SidebarSwitchBlock } from "./reusableComponents/sidebarComponents.js";

import { usePhysics } from "../../states.js";
import { physicsInit } from "../initValues/physicsInitValues.js";

export function PhysicsSidebar({}) {
  const { physics, setPhysics, setAllPhysics } = usePhysics();

  const handleLinkLengthSlider = (event) => {
    const value = event.target.value;

    setPhysics("linkLength", value);
    setPhysics("linkLengthText", value);
  };

  const handleLinkLengthField = (event) => {
    const value = event.target.value;
    const intValue = parseInt(value);

    if (value === "" || (!isNaN(intValue) && intValue <= 1000)) {
      setPhysics("linkLengthText", value);
    }
  };

  const handleLinkLengthFieldBlur = (event) => {
    let value = event.target.value;
    const intValue = parseInt(value);

    if (value === "") {
      setPhysics("linkLength", 0);
      setPhysics("linkLengthText", 0);
    } else if (!isNaN(intValue) && intValue <= 1000) {
      setPhysics("linkLength", value);
      setPhysics("linkLengthText", value);
    }
  };

  const handleBorderHeightSlider = (event) => {
    const value = event.target.value;
    setPhysics("borderHeight", value);
    setPhysics("borderHeightText", value);
  };

  const handleBorderHeightField = (event) => {
    const value = event.target.value;
    setPhysics("borderHeightText", value);
  };

  const handleBorderHeightFieldBlur = (event) => {
    let value = event.target.value;
    const intValue = parseInt(value);

    if (value === "" || !isNaN(intValue)) {
      if (value < 250) {
        value = 250;
      }
      setPhysics("borderHeight", value);
      setPhysics("borderHeightText", value);
    }
  };

  const handleBorderWidthFieldSlider = (event) => {
    const value = event.target.value;
    setPhysics("borderWidth", value);
    setPhysics("borderWidthText", value);
  };

  const handleBorderWidthField = (event) => {
    const value = event.target.value;
    setPhysics("borderWidthText", value);
  };

  const handleBorderWidthFieldBlur = (event) => {
    let value = event.target.value;
    const intValue = parseInt(value);

    if (value === "" || !isNaN(intValue)) {
      if (value < 250) {
        value = 250;
      }
      setPhysics("borderWidth", value);
      setPhysics("borderWidthText", value);
    }
  };

  const handleCheckBorder = () => {
    setPhysics("checkBorder", !physics.checkBorder);
  };

  const handleComponentStrengthSlider = (event) => {
    const value = event.target.value;
    setPhysics("componentStrength", value);
    setPhysics("componentStrengthText", value);
  };

  const handleComponentStrengthField = (event) => {
    const value = event.target.value;

    if (value === "" || value >= 0) {
      setPhysics("componentStrengthText", value);
    }
  };

  const handleComponentStrengthFieldBlur = (event) => {
    let value = event.target.value;

    if (value === "") {
      setPhysics("componentStrength", 0);
      setPhysics("componentStrengthText", 0);
    } else if (value >= 0) {
      setPhysics("componentStrength", value);
      setPhysics("componentStrengthText", value);
    }
  };

  const handleCommunityForceSlider = (event) => {
    const value = event.target.value;
    setPhysics("communityForceStrength", value);
    setPhysics("communityForceStrengthText", value);
  };

  const handleCommunityForceField = (event) => {
    const value = event.target.value;

    if (value === "" || value >= 0) {
      setPhysics("communityForceStrengthText", value);
    }
  };

  const handleCommunityForceFieldBlur = (event) => {
    let value = event.target.value;

    if (value === "") {
      setPhysics("communityForceStrength", 0);
      setPhysics("communityForceStrengthText", 0);
    } else if (value >= 0) {
      setPhysics("communityForceStrength", value);
      setPhysics("communityForceStrengthText", value);
    }
  };

  const handleGravitySlider = (event) => {
    const value = event.target.value;
    setPhysics("xStrength", value);
    setPhysics("yStrength", value);

    setPhysics("xStrengthText", value);
    setPhysics("yStrengthText", value);
  };

  const handleGravityField = (event) => {
    const value = event.target.value;

    if (value === "" || value >= 0) {
      setPhysics("xStrengthText", value);
      setPhysics("yStrengthText", value);
    }
  };

  const handleGravityFieldBlur = (event) => {
    let value = event.target.value;

    if (value === "") {
      setPhysics("xStrength", 0);
      setPhysics("yStrength", 0);

      setPhysics("xStrengthText", 0);
      setPhysics("yStrengthText", 0);
    } else if (value >= 0) {
      setPhysics("xStrength", value);
      setPhysics("yStrength", value);

      setPhysics("xStrengthText", value);
      setPhysics("yStrengthText", value);
    }
  };

  const handleLinkForce = () => {
    setPhysics("linkForce", !physics.linkForce);
  };

  const handleNodeCollision = () => {
    setPhysics("nodeCollision", !physics.nodeCollision);
  };

  const handleNodeRepulsionStrengthSlider = (event) => {
    const value = event.target.value;
    setPhysics("nodeRepulsionStrength", value);
    setPhysics("nodeRepulsionStrengthText", value);
  };

  const handleNodeRepulsionStrengthField = (event) => {
    const value = event.target.value;
    const intValue = parseInt(value);

    if (value === "" || !isNaN(intValue)) {
      setPhysics("nodeRepulsionStrengthText", value);
    }
  };

  const handleNodeRepulsionStrengthFieldBlur = (event) => {
    let value = event.target.value;
    const intValue = parseInt(value);

    if (value === "") {
      setPhysics("nodeRepulsionStrength", 0);
      setPhysics("nodeRepulsionStrengthText", 0);
    } else if (!isNaN(intValue)) {
      setPhysics("deRepulsionStrength", value);
      setPhysics("nodeRepulsionStrengthText", value);
    }
  };

  const handleCircleLayout = () => {
    setPhysics("circleLayout", !physics.circleLayout);
  };

  return (
    <>
      <div className="inline pad-top-05 pad-bottom-05">
        <SidebarButtonRect text={"Set Phyiscs to Default"} onClick={() => setAllPhysics(physicsInit)} />
      </div>
      <SidebarSwitchBlock
        text={"Circular Layout"}
        value={physics.circleLayout}
        onChange={handleCircleLayout}
        infoHeading={"Enabling Circular layout"}
        infoDescription={
          <div>
            <p className="margin-0">
              Components/Clusters can be displayed in a circular layout, with the nodes arranged clockwise in descending order based on the number of
              adjacent nodes. <br />
              Activating this force automatically disables the link force, as they're incompatible.
            </p>
          </div>
        }
      />
      <SidebarSliderBlock
        text={"Gravitational Force"}
        min={0}
        max={1}
        stepSlider={0.05}
        stepField={0.01}
        value={physics.xStrength}
        valueText={physics.xStrengthText}
        onChangeSlider={handleGravitySlider}
        onChangeField={handleGravityField}
        onChangeBlur={handleGravityFieldBlur}
        infoHeading={"Adjusting the Gravity"}
        infoDescription={
          <div>
            <p className="margin-0">
              With an active gravitational force, nodes are pulled towards the center of the network. The strength of this force can be adjusted.
            </p>
          </div>
        }
      />
      <SidebarSliderBlock
        text={"Component Force"}
        min={0}
        max={10}
        stepSlider={0.1}
        stepField={0.05}
        value={physics.componentStrength}
        valueText={physics.componentStrengthText}
        onChangeSlider={handleComponentStrengthSlider}
        onChangeField={handleComponentStrengthField}
        onChangeBlur={handleComponentStrengthFieldBlur}
        infoHeading={"Adjusting the Component Force Strength"}
        infoDescription={
          <div>
            <p className="margin-0">
              The component force can be used to separate components from one another. The components separate further with an increasing force.
            </p>
          </div>
        }
      />
      <SidebarSliderBlock
        text={"Community Force"}
        min={0}
        max={10}
        stepSlider={0.1}
        stepField={0.05}
        value={physics.communityForceStrength}
        valueText={physics.communityForceStrengthText}
        onChangeSlider={handleCommunityForceSlider}
        onChangeField={handleCommunityForceField}
        onChangeBlur={handleCommunityForceFieldBlur}
        infoHeading={"Adjusting the Community Force Strength"}
        infoDescription={
          <div>
            <p className="margin-0">
              The community force helps to separate distinct communities from one another. A community is defined as a dense cluster of nodes, meaning
              that even nodes within the same connected component can be pulled apart if they belong to different communities. As the force increases,
              the separation between communities becomes more pronounced. The communities are built using the Louvain method for community detection.
            </p>
          </div>
        }
      />
      <SidebarSliderBlock
        text={"Node Repulsion Force"}
        min={0}
        max={10}
        stepSlider={1}
        stepField={0.5}
        value={physics.nodeRepulsionStrength}
        valueText={physics.nodeRepulsionStrengthText}
        onChangeSlider={handleNodeRepulsionStrengthSlider}
        onChangeField={handleNodeRepulsionStrengthField}
        onChangeBlur={handleNodeRepulsionStrengthFieldBlur}
        infoHeading={"Adjusting the Node Repulsion Strength"}
        infoDescription={
          <div>
            <p className="margin-0">
              The node repulsion force is used to maintain a certain distance between nodes. The distance increases with a higher node repulsion
              force.
            </p>
          </div>
        }
      />
      <SidebarSwitchBlock
        text={"Node Collision"}
        value={physics.nodeCollision}
        onChange={handleNodeCollision}
        infoHeading={"Enabling the Node Collision Force"}
        infoDescription={
          <div>
            <p className="margin-0">The node collision force kicks nodes apart from each other upon impact.</p>
          </div>
        }
      />
      <SidebarSwitchBlock
        text={"Link Force"}
        value={physics.linkForce}
        onChange={handleLinkForce}
        infoHeading={"Enabling the Link Force"}
        infoDescription={
          <div>
            <p className="margin-0">
              The link force treats links as a rubber band. If the link is stretched past it's length, the link will try to contract itself.
            </p>
          </div>
        }
      />
      {physics.linkForce && (
        <SidebarSliderBlock
          text={"Link Length"}
          min={0}
          max={300}
          stepSlider={10}
          stepField={5}
          value={physics.linkLength}
          valueText={physics.linkLengthText}
          onChangeSlider={handleLinkLengthSlider}
          onChangeField={handleLinkLengthField}
          onChangeBlur={handleLinkLengthFieldBlur}
          infoHeading={"Adjusting the Link Length"}
          infoDescription={
            <div>
              <p className="margin-0">This setting can be used to set the default length of the links.</p>
            </div>
          }
        />
      )}
      <SidebarSwitchBlock
        text={"Border Force"}
        value={physics.checkBorder}
        onChange={handleCheckBorder}
        infoHeading={"Enabling the Border Force"}
        infoDescription={
          <div>
            <p className="margin-0">The border force can be used to contain the graph within an adjustable rectangle.</p>
          </div>
        }
      />
      {physics.checkBorder && (
        <>
          <SidebarSliderBlock
            text={"Border Height"}
            min={25}
            max={5000}
            stepSlider={5}
            stepField={5}
            value={physics.borderHeight}
            valueText={physics.borderHeightText}
            onChangeSlider={handleBorderHeightSlider}
            onChangeField={handleBorderHeightField}
            onChangeBlur={handleBorderHeightFieldBlur}
            infoHeading={"Adjusting the Border Height"}
            infoDescription={
              <div>
                <p className="margin-0">The border height determines the vertical size of the border rectangle.</p>
              </div>
            }
          />
          <SidebarSliderBlock
            text={"Border Width"}
            min={25}
            max={5000}
            stepSlider={5}
            stepField={5}
            value={physics.borderWidth}
            valueText={physics.borderWidthText}
            onChangeSlider={handleBorderWidthFieldSlider}
            onChangeField={handleBorderWidthField}
            onChangeBlur={handleBorderWidthFieldBlur}
            infoHeading={"Adjusting the Border Width"}
            infoDescription={
              <div>
                <p className="margin-0">The border height determines the horizontal size of the border rectangle.</p>
              </div>
            }
          />
        </>
      )}
    </>
  );
}
