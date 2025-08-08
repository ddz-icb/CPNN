import { SidebarSliderBlock, SidebarButtonRect, SidebarSwitchBlock } from "./reusableComponents/sidebarComponents.js";

import { usePhysics } from "../../states.js";
import { communityForceStrengthInit, componentStrengthInit, physicsInit, xStrengthInit } from "../initValues/physicsInitValues.js";
import {
  borderHeightDescription,
  borderWidthDescription,
  communityForceStrengthDescription,
  componentStrengthDescription,
  linkLengthDescription,
  nodeRepulsionStrengthDescription,
  xStrengthDescription,
} from "./descriptions/appearanceDescriptions.js";

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
        value={physics.xStrength}
        valueText={physics.xStrengthText}
        setValue={(value) => {
          setPhysics("xStrength", value);
          setPhysics("yStrength", value);
        }}
        setValueText={(value) => {
          setPhysics("xStrengthText", value);
          setPhysics("yStrengthText", value);
        }}
        fallbackValue={xStrengthInit}
        min={0}
        max={1}
        step={0.05}
        text={"Gravitational Force"}
        infoHeading={"Adjusting the Gravity"}
        infoDescription={xStrengthDescription}
      />
      <SidebarSliderBlock
        value={physics.componentStrength}
        valueText={physics.componentStrengthText}
        setValue={(value) => setPhysics("componentStrength", value)}
        setValueText={(value) => setPhysics("componentStrengthText", value)}
        fallbackValue={componentStrengthInit}
        min={0}
        max={10}
        step={0.1}
        text={"Component Force"}
        infoHeading={"Adjusting the Component Force Strength"}
        infoDescription={componentStrengthDescription}
      />
      <SidebarSliderBlock
        value={physics.communityForceStrength}
        valueText={physics.communityForceStrengthText}
        setValue={(value) => setPhysics("communityForceStrength", value)}
        setValueText={(value) => setPhysics("communityForceStrengthText", value)}
        fallbackValue={communityForceStrengthInit}
        min={0}
        max={10}
        step={0.1}
        text={"Community Force"}
        infoHeading={"Adjusting the Community Force Strength"}
        infoDescription={communityForceStrengthDescription}
      />
      <SidebarSliderBlock
        value={physics.nodeRepulsionStrength}
        valueText={physics.nodeRepulsionStrengthText}
        setValue={(value) => setPhysics("nodeRepulsionStrength", value)}
        setValueText={(value) => setPhysics("nodeRepulsionStrengthText", value)}
        fallbackValue={communityForceStrengthInit}
        min={0}
        max={10}
        step={1}
        text={"Node Repulsion Force"}
        infoHeading={"Adjusting the Node Repulsion Strength"}
        infoDescription={nodeRepulsionStrengthDescription}
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
          value={physics.linkLength}
          valueText={physics.linkLengthText}
          setValue={(value) => setPhysics("linkLength", value)}
          setValueText={(value) => setPhysics("linkLengthText", value)}
          fallbackValue={communityForceStrengthInit}
          min={0}
          max={300}
          step={10}
          text={"Link Length"}
          infoHeading={"Adjusting the Link Length"}
          infoDescription={linkLengthDescription}
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
            value={physics.borderHeight}
            valueText={physics.borderHeightText}
            setValue={(value) => setPhysics("borderHeight", value)}
            setValueText={(value) => setPhysics("borderHeightText", value)}
            fallbackValue={communityForceStrengthInit}
            min={25}
            max={5000}
            step={5}
            text={"Border Height"}
            infoHeading={"Adjusting the Border Height"}
            infoDescription={borderHeightDescription}
          />
          <SidebarSliderBlock
            value={physics.borderWidth}
            valueText={physics.borderWidthText}
            setValue={(value) => setPhysics("borderWidth", value)}
            setValueText={(value) => setPhysics("borderWidthText", value)}
            fallbackValue={communityForceStrengthInit}
            min={25}
            max={5000}
            step={5}
            text={"Border Width"}
            infoHeading={"Adjusting the Border Width"}
            infoDescription={borderWidthDescription}
          />
        </>
      )}
    </>
  );
}
