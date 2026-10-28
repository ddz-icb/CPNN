import { SliderBlock } from "../reusable_components/sidebarComponents.jsx";
import { communityForceStrengthInit, usePhysics } from "../../state/physicsState.js";
import { communityForceStrengthDescription } from "./descriptions/physicsDescriptions.jsx";

export function CommunityForceControl() {
  const { physics, setPhysics } = usePhysics();

  return (
    <SliderBlock
      value={physics.communityForceStrength}
      valueText={physics.communityForceStrengthText}
      setValue={(value) => setPhysics("communityForceStrength", value)}
      setValueText={(value) => setPhysics("communityForceStrengthText", value)}
      fallbackValue={communityForceStrengthInit}
      min={0}
      max={10}
      step={0.1}
      text="Community Force"
      infoHeading="Adjusting the Community Force Strength"
      infoDescription={communityForceStrengthDescription}
    />
  );
}
