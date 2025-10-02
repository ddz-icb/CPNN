import { Button, SliderBlock, SwitchBlock } from "../reusable_components/sidebarComponents.js";

import { communityForceStrengthInit, componentStrengthInit, gravityStrengthInit, physicsInit } from "../../adapters/state/physicsState.js";
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
import { usePhysics } from "../../adapters/state/physicsState.js";

export function PhysicsSidebar({}) {
  const { physics, setPhysics, setAllPhysics } = usePhysics();

  return (
    <>
      <div className="block-section">
        <Button text={"Set Phyiscs to Default"} onClick={() => setAllPhysics(physicsInit)} />
      </div>
      <SwitchBlock
        value={physics.circleLayout}
        setValue={() => setPhysics("circleLayout", !physics.circleLayout)}
        text={"Circular Layout"}
        infoHeading={"Enabling Circular layout"}
        infoDescription={circleLayoutDescription}
      />
      <SliderBlock
        value={physics.gravityStrength}
        valueText={physics.gravityStrengthText}
        setValue={(value) => {
          setPhysics("gravityStrength", value);
        }}
        setValueText={(value) => {
          setPhysics("gravityStrengthText", value);
        }}
        fallbackValue={gravityStrengthInit}
        min={0}
        max={1}
        step={0.05}
        text={"Gravitational Force"}
        infoHeading={"Adjusting the Gravity"}
        infoDescription={gravityDescription}
      />
      <SliderBlock
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
      <SliderBlock
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
      <SliderBlock
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
      <SwitchBlock
        value={physics.nodeCollision}
        setValue={() => setPhysics("nodeCollision", !physics.nodeCollision)}
        text={"Node Collision"}
        infoHeading={"Enabling the Node Collision Force"}
        infoDescription={nodeCollisionDescription}
      />
      <SwitchBlock
        value={physics.linkForce}
        setValue={() => setPhysics("linkForce", !physics.linkForce)}
        text={"Link Force"}
        infoHeading={"Enabling the Link Force"}
        infoDescription={linkForceDescription}
      />
      {physics.linkForce && (
        <SliderBlock
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
      <SwitchBlock
        value={physics.checkBorder}
        setValue={() => setPhysics("checkBorder", !physics.checkBorder)}
        text={"Border Force"}
        infoHeading={"Enabling the Border Force"}
        infoDescription={checkBorderDescription}
      />
      {physics.checkBorder && (
        <>
          <SliderBlock
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
          <SliderBlock
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
