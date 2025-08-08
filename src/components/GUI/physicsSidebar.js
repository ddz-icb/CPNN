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
  gravityDescription,
} from "./descriptions/physicsDescriptions.js";

export function PhysicsSidebar({}) {
  const { physics, setPhysics, setAllPhysics } = usePhysics();

  const handleCheckBorder = () => {
    setPhysics("checkBorder", !physics.checkBorder);
  };

  const handleLinkForce = () => {
    setPhysics("linkForce", !physics.linkForce);
  };

  const handleNodeCollision = () => {
    setPhysics("nodeCollision", !physics.nodeCollision);
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
        infoDescription={gravityDescription}
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
