import { useEffect, useState } from "react";

import { SidebarButtonRect, SidebarFieldBlock, SidebarSliderBlock, SidebarSwitchBlock } from "./sidebar.js";

import {
  borderHeightInit,
  borderWidthInit,
  nodeRepulsionStrengthInit,
  componentStrengthInit,
  linkLengthInit,
  xStrengthInit,
  yStrengthInit,
} from "../GraphStuff/graphInitValues.js";

export function PhysicsSidebar({ physicsSettings, setPhysicsSettings, resetPhysics }) {
  const [linkLengthText, setLinkLengthText] = useState(physicsSettings.linkLength);
  const [borderHeightText, setBorderHeightText] = useState(physicsSettings.borderHeight);
  const [borderWidthText, setBorderWidthText] = useState(physicsSettings.borderWidth);
  const [xStrengthText, setXStrengthText] = useState(physicsSettings.xStrength);
  const [yStrengthText, setYStrengthText] = useState(physicsSettings.yStrength);
  const [componentStrengthText, setComponentStrengthText] = useState(physicsSettings.componentStrength);
  const [nodeRepulsionStrengthText, setNodeRepulsionStrengthText] = useState(physicsSettings.nodeRepulsionStrength);

  const [gravityAdvanced, setGravityAdvanced] = useState(false);

  const handleResetPhysics = () => {
    resetPhysics();

    setLinkLengthText(linkLengthInit);
    setBorderHeightText(borderHeightInit);
    setBorderWidthText(borderWidthInit);
    setXStrengthText(xStrengthInit);
    setYStrengthText(yStrengthInit);
    setComponentStrengthText(componentStrengthInit);
    setNodeRepulsionStrengthText(nodeRepulsionStrengthInit);
    setGravityAdvanced(false);
  };

  const handleLinkLengthSlider = (event) => {
    const value = event.target.value;

    setPhysicsSettings((prev) => ({ ...prev, linkLength: value }));
    setLinkLengthText(value);
  };

  const handleLinkLengthField = (event) => {
    const value = event.target.value;
    const intValue = parseInt(value);

    if (value === "" || (!isNaN(intValue) && intValue <= 1000)) {
      setLinkLengthText(value);
    }
  };

  const handleLinkLengthFieldBlur = (event) => {
    let value = event.target.value;
    const intValue = parseInt(value);

    if (value === "") {
      setPhysicsSettings((prev) => ({ ...prev, linkLength: 0 }));
      setLinkLengthText(0);
    } else if (!isNaN(intValue) && intValue <= 1000) {
      setPhysicsSettings((prev) => ({ ...prev, linkLength: value }));
      setLinkLengthText(value);
    }
  };

  const handleBorderHeightSlider = (event) => {
    const value = event.target.value;
    setPhysicsSettings((prev) => ({ ...prev, borderHeight: value }));
    setBorderHeightText(value);
  };

  const handleBorderHeightField = (event) => {
    const value = event.target.value;
    setBorderHeightText(value);
  };

  const handleBorderHeightFieldBlur = (event) => {
    let value = event.target.value;
    const intValue = parseInt(value);

    if (value === "" || !isNaN(intValue)) {
      if (value < 250) {
        value = 250;
      }
      setPhysicsSettings((prev) => ({ ...prev, borderHeight: value }));
      setBorderHeightText(value);
    }
  };

  const handleBorderWidthFieldSlider = (event) => {
    const value = event.target.value;
    setPhysicsSettings((prev) => ({ ...prev, borderWidth: value }));
    setBorderWidthText(value);
  };

  const handleBorderWidthField = (event) => {
    const value = event.target.value;
    setBorderWidthText(value);
  };

  const handleBorderWidthFieldBlur = (event) => {
    let value = event.target.value;
    const intValue = parseInt(value);

    if (value === "" || !isNaN(intValue)) {
      if (value < 250) {
        value = 250;
      }
      setPhysicsSettings((prev) => ({ ...prev, borderWidth: value }));
      setBorderWidthText(value);
    }
  };

  const handleCheckBorder = () => {
    setPhysicsSettings((prev) => ({ ...prev, checkBorder: !physicsSettings.checkBorder }));
  };

  const handleXStrengthSlider = (event) => {
    const value = event.target.value;
    setPhysicsSettings((prev) => ({ ...prev, xStrength: value }));
    setXStrengthText(value);
  };

  const handleXStrengthField = (event) => {
    const value = event.target.value;

    if (value === "" || (value >= -1 && value <= 1)) {
      setXStrengthText(value);
    }
  };

  const handleXStrengthFieldBlur = (event) => {
    let value = event.target.value;

    if (value === "") {
      setPhysicsSettings((prev) => ({ ...prev, xStrength: 0 }));
      setXStrengthText(0);
    } else if (value >= -1 && value <= 1) {
      setPhysicsSettings((prev) => ({ ...prev, xStrength: value }));
      setXStrengthText(value);
    }
  };

  const handleYStrengthSlider = (event) => {
    const value = event.target.value;
    setPhysicsSettings((prev) => ({ ...prev, yStrength: value }));
    setYStrengthText(value);
  };

  const handleYStrengthField = (event) => {
    const value = event.target.value;

    if (value === "" || (value >= -1 && value <= 1)) {
      setYStrengthText(value);
    }
  };

  const handleYStrengthFieldBlur = (event) => {
    let value = event.target.value;

    if (value === "") {
      setPhysicsSettings((prev) => ({ ...prev, yStrength: 0 }));
      setYStrengthText(0);
    } else if (value >= -1 && value <= 1) {
      setPhysicsSettings((prev) => ({ ...prev, yStrength: value }));
      setYStrengthText(value);
    }
  };

  const handleComponentStrengthSlider = (event) => {
    const value = event.target.value;
    setPhysicsSettings((prev) => ({ ...prev, componentStrength: value }));
    setComponentStrengthText(value);
  };

  const handleComponentStrengthField = (event) => {
    const value = event.target.value;

    if (value === "" || (value >= -1 && value <= 1)) {
      setComponentStrengthText(value);
    }
  };

  const handleComponentStrengthFieldBlur = (event) => {
    let value = event.target.value;

    if (value === "") {
      setPhysicsSettings((prev) => ({ ...prev, componentStrength: 0 }));
      setComponentStrengthText(0);
    } else if (value >= -1 && value <= 1) {
      setPhysicsSettings((prev) => ({ ...prev, componentStrength: value }));
      setComponentStrengthText(value);
    }
  };

  const handleGravityAdvanced = () => {
    setGravityAdvanced(!gravityAdvanced);
  };

  const handleGravitySlider = (event) => {
    const value = event.target.value;
    setPhysicsSettings((prev) => ({ ...prev, xStrength: value }));
    setPhysicsSettings((prev) => ({ ...prev, yStrength: value }));

    setXStrengthText(value);
    setYStrengthText(value);
  };

  const handleGravityField = (event) => {
    const value = event.target.value;

    if (value === "" || (value >= -1 && value <= 1)) {
      setXStrengthText(value);
      setYStrengthText(value);
    }
  };

  const handleGravityFieldBlur = (event) => {
    let value = event.target.value;

    if (value === "") {
      setPhysicsSettings((prev) => ({ ...prev, xStrength: 0 }));
      setPhysicsSettings((prev) => ({ ...prev, yStrength: 0 }));

      setXStrengthText(0);
      setYStrengthText(0);
    } else if (value >= -1 && value <= 1) {
      setPhysicsSettings((prev) => ({ ...prev, xStrength: value }));
      setPhysicsSettings((prev) => ({ ...prev, yStrength: value }));

      setXStrengthText(value);
      setYStrengthText(value);
    }
  };

  const handleLinkForce = () => {
    setPhysicsSettings((prev) => ({ ...prev, linkForce: !physicsSettings.linkForce }));
  };

  const handleNodeRepulsionStrengthSlider = (event) => {
    const value = event.target.value;
    setPhysicsSettings((prev) => ({ ...prev, nodeRepulsionStrength: value }));
    setNodeRepulsionStrengthText(value);
  };

  const handleNodeRepulsionStrengthField = (event) => {
    const value = event.target.value;
    const intValue = parseInt(value);

    if (value === "" || !isNaN(intValue)) {
      setNodeRepulsionStrengthText(value);
    }
  };

  const handleNodeRepulsionStrengthFieldBlur = (event) => {
    let value = event.target.value;
    const intValue = parseInt(value);

    if (value === "") {
      setPhysicsSettings((prev) => ({ ...prev, nodeRepulsionStrength: 0 }));
      setNodeRepulsionStrengthText(0);
    } else if (!isNaN(intValue)) {
      setPhysicsSettings((prev) => ({ ...prev, nodeRepulsionStrength: value }));
      setNodeRepulsionStrengthText(value);
    }
  };

  const handleCircleLayout = () => {
    setPhysicsSettings((prev) => ({ ...prev, circleLayout: !physicsSettings.circleLayout }));
  };

  return (
    <>
      <div className="inline pad-top-05 pad-bottom-05">
        <SidebarButtonRect text={"Set Phyiscs to Default"} onClick={handleResetPhysics} />
      </div>
      <SidebarSwitchBlock text={"Enable Circular Layout"} value={physicsSettings.circleLayout} onChange={handleCircleLayout} />
      {!gravityAdvanced && (
        <>
          <SidebarSliderBlock
            text={"Set Gravity"}
            min={0}
            max={1}
            stepSlider={0.05}
            stepField={0.01}
            value={physicsSettings.xStrength}
            valueText={xStrengthText}
            onChangeSlider={handleGravitySlider}
            onChangeField={handleGravityField}
            onChangeBlur={handleGravityFieldBlur}
          />
        </>
      )}
      {gravityAdvanced && (
        <>
          <SidebarSliderBlock
            text={"Set Horizontal Gravity"}
            min={0}
            max={1}
            stepSlider={0.05}
            stepField={0.01}
            value={physicsSettings.xStrength}
            valueText={xStrengthText}
            onChangeSlider={handleXStrengthSlider}
            onChangeField={handleXStrengthField}
            onChangeBlur={handleXStrengthFieldBlur}
          />
          <SidebarSliderBlock
            text={"Set Vertical Gravity"}
            min={0}
            max={1}
            stepSlider={0.05}
            stepField={0.01}
            value={physicsSettings.yStrength}
            valueText={yStrengthText}
            onChangeSlider={handleYStrengthSlider}
            onChangeField={handleYStrengthField}
            onChangeBlur={handleYStrengthFieldBlur}
          />
        </>
      )}
      <SidebarSwitchBlock text={"Advanced Gravity Settings"} value={gravityAdvanced} onChange={handleGravityAdvanced} />
      <SidebarSliderBlock
        text={"Set Component Strength"}
        min={0}
        max={10}
        stepSlider={0.1}
        stepField={0.05}
        value={physicsSettings.componentStrength}
        valueText={componentStrengthText}
        onChangeSlider={handleComponentStrengthSlider}
        onChangeField={handleComponentStrengthField}
        onChangeBlur={handleComponentStrengthFieldBlur}
      />
      <SidebarSliderBlock
        text={"Set Node Repulsion Strength"}
        min={0}
        max={10}
        stepSlider={1}
        stepField={0.5}
        value={physicsSettings.nodeRepulsionStrength}
        valueText={nodeRepulsionStrengthText}
        onChangeSlider={handleNodeRepulsionStrengthSlider}
        onChangeField={handleNodeRepulsionStrengthField}
        onChangeBlur={handleNodeRepulsionStrengthFieldBlur}
      />
      <SidebarSwitchBlock text={"Enable Link Force"} value={physicsSettings.linkForce} onChange={handleLinkForce} />
      {physicsSettings.linkForce && (
        <SidebarSliderBlock
          text={"Set Link Length"}
          min={0}
          max={300}
          stepSlider={10}
          stepField={5}
          value={physicsSettings.linkLength}
          valueText={linkLengthText}
          onChangeSlider={handleLinkLengthSlider}
          onChangeField={handleLinkLengthField}
          onChangeBlur={handleLinkLengthFieldBlur}
        />
      )}
      <SidebarSwitchBlock text={"Enable Border"} value={physicsSettings.checkBorder} onChange={handleCheckBorder} />
      {physicsSettings.checkBorder && (
        <>
          <SidebarSliderBlock
            text={"Set Border Height"}
            min={25}
            max={999}
            stepSlider={10}
            stepField={5}
            value={physicsSettings.borderHeight}
            valueText={borderHeightText}
            onChangeSlider={handleBorderHeightSlider}
            onChangeField={handleBorderHeightField}
            onChangeBlur={handleBorderHeightFieldBlur}
          />
          <SidebarSliderBlock
            text={"Set Border Width"}
            min={25}
            max={999}
            stepSlider={5}
            stepField={5}
            value={physicsSettings.borderWidth}
            valueText={borderWidthText}
            onChangeSlider={handleBorderWidthFieldSlider}
            onChangeField={handleBorderWidthField}
            onChangeBlur={handleBorderWidthFieldBlur}
          />
        </>
      )}
    </>
  );
}
