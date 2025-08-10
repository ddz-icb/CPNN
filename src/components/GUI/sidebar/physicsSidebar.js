import { SidebarSliderBlock, SidebarSwitchBlock, SidebarButtonRect } from "../reusable_components/sidebarComponents.js";

import { usePhysics } from "../../../states.js";
import { communityForceStrengthInit, componentStrengthInit, physicsInit, xStrengthInit } from "../../config/physicsInitValues.js";
import {
  borderHeightDescription,
  borderWidthDescription,
  communityForceStrengthDescription,
  componentStrengthDescription,
  linkLengthDescription,
  nodeRepulsionStrengthDescription,
  gravityDescription,
  checkBorderDescription,
  circleLayoutDescription,
  nodeCollisionDescription,
  linkForceDescription,
} from "./descriptions/physicsDescriptions.js";

export function PhysicsSidebar({}) {
  const { physics, setPhysics, setAllPhysics } = usePhysics();

  return (
    <>
      <div className="inline pad-top-05 pad-bottom-05">
        <SidebarButtonRect text={"Set Phyiscs to Default"} onClick={() => setAllPhysics(physicsInit)} />
      </div>
      <SidebarSwitchBlock
        value={physics.circleLayout}
        setValue={() => setPhysics("circleLayout", !physics.circleLayout)}
        text={"Circular Layout"}
        infoHeading={"Enabling Circular layout"}
        infoDescription={circleLayoutDescription}
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
        value={physics.nodeCollision}
        setValue={() => setPhysics("nodeCollision", !physics.nodeCollision)}
        text={"Node Collision"}
        infoHeading={"Enabling the Node Collision Force"}
        infoDescription={nodeCollisionDescription}
      />
      <SidebarSwitchBlock
        value={physics.linkForce}
        setValue={() => setPhysics("linkForce", !physics.linkForce)}
        text={"Link Force"}
        infoHeading={"Enabling the Link Force"}
        infoDescription={linkForceDescription}
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
        value={physics.checkBorder}
        setValue={() => setPhysics("checkBorder", !physics.checkBorder)}
        text={"Border Force"}
        infoHeading={"Enabling the Border Force"}
        infoDescription={checkBorderDescription}
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
