import { useEffect, useState } from "react";
import {
  SidebarButtonRect,
  SidebarFieldBlock,
  SidebarSliderBlock,
  SidebarSwitchBlock,
} from "./sidebar";
import {
  borderHeightInit,
  borderWidthInit,
  centroidThresholdInit,
  chargeStrengthInit,
  componentStrengthInit,
  linkLengthInit,
  xStrengthInit,
  yStrengthInit,
} from "../GraphStuff/graphInitValues";

export function PhysicsSidebar({
  linkLength,
  checkBorder,
  borderHeight,
  borderWidth,
  setLinkLength,
  setCheckBorder,
  setBorderHeight,
  setBorderWidth,
  xStrength,
  setXStrength,
  yStrength,
  setYStrength,
  componentStrength,
  setComponentStrength,
  centroidThreshold,
  setCentroidThreshold,
  linkForce,
  setLinkForce,
  chargeStrength,
  setChargeStrength,
  circleLayout,
  setCircleLayout,
  resetPhysics,
}) {
  const [linkLengthText, setLinkLengthText] = useState(linkLength);
  const [borderHeightText, setBorderHeightText] = useState(borderHeight);
  const [borderWidthText, setBorderWidthText] = useState(borderWidth);
  const [xStrengthText, setXStrengthText] = useState(xStrength);
  const [yStrengthText, setYStrengthText] = useState(yStrength);
  const [componentStrengthText, setComponentStrengthText] =
    useState(componentStrength);
  const [centroidThresholdText, setCentroidThresholdText] =
    useState(centroidThreshold);
  const [chargeStrengthText, setChargeStrengthText] = useState(chargeStrength);

  const [gravityAdvanced, setGravityAdvanced] = useState(false);

  const handleResetPhysics = () => {
    resetPhysics();

    setLinkLengthText(linkLengthInit);
    setBorderHeightText(borderHeightInit);
    setBorderWidthText(borderWidthInit);
    setXStrengthText(xStrengthInit);
    setYStrengthText(yStrengthInit);
    setComponentStrengthText(componentStrengthInit);
    setCentroidThresholdText(centroidThresholdInit);
    setChargeStrengthText(chargeStrengthInit);
    setGravityAdvanced(false);
  };

  const handleLinkLengthSlider = (event) => {
    const value = event.target.value;
    setLinkLength(value);
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
      setLinkLength(0);
      setLinkLengthText(0);
    } else if (!isNaN(intValue) && intValue <= 1000) {
      setLinkLength(value);
      setLinkLengthText(value);
    }
  };

  const handleBorderHeightSlider = (event) => {
    const value = event.target.value;
    setBorderHeight(value);
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
      setBorderHeight(value);
      setBorderHeightText(value);
    }
  };

  const handleBorderWidthFieldSlider = (event) => {
    const value = event.target.value;
    setBorderWidth(value);
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
      setBorderWidth(value);
      setBorderWidthText(value);
    }
  };

  const handleCheckBorder = () => {
    setCheckBorder(!checkBorder);
  };

  const handleXStrengthSlider = (event) => {
    const value = event.target.value;
    setXStrength(value);
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
      setXStrength(0);
      setXStrengthText(0);
    } else if (value >= -1 && value <= 1) {
      setXStrength(value);
      setXStrengthText(value);
    }
  };

  const handleYStrengthSlider = (event) => {
    const value = event.target.value;
    setYStrength(value);
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
      setYStrength(0);
      setYStrengthText(0);
    } else if (value >= -1 && value <= 1) {
      setYStrength(value);
      setYStrengthText(value);
    }
  };

  const handleComponentStrengthSlider = (event) => {
    const value = event.target.value;
    setComponentStrength(value);
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
      setComponentStrength(0);
      setComponentStrengthText(0);
    } else if (value >= -1 && value <= 1) {
      setComponentStrength(value);
      setComponentStrengthText(value);
    }
  };

  const handleGravityAdvanced = () => {
    setGravityAdvanced(!gravityAdvanced);
  };

  const handleGravitySlider = (event) => {
    const value = event.target.value;
    setXStrength(value);
    setYStrength(value);

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
      setXStrength(0);
      setYStrength(0);

      setXStrengthText(0);
      setYStrengthText(0);
    } else if (value >= -1 && value <= 1) {
      setXStrength(value);
      setYStrength(value);

      setXStrengthText(value);
      setYStrengthText(value);
    }
  };

  const handleCentroidThresholdChange = (event) => {
    const value = event.target.value;
    const intValue = parseInt(value, 10);

    if (value === "") {
      setCentroidThresholdText("");
    } else if (!isNaN(intValue)) {
      setCentroidThresholdText(intValue);
    }
  };

  const handleCentroidThresholdBlur = (event) => {
    const value = event.target.value;
    const intValue = parseInt(value, 10);

    if (value === "") {
      event.target.innerText = 1;
      setCentroidThreshold(1);
      setCentroidThresholdText(1);
    } else if (!isNaN(intValue) && intValue >= 0) {
      event.target.innerText = intValue;
      setCentroidThreshold(intValue);
      setCentroidThresholdText(intValue);
    }
  };

  const handleLinkForce = () => {
    setLinkForce(!linkForce);
  };

  const handleChargeStrengthSlider = (event) => {
    const value = event.target.value;
    setChargeStrength(value);
    setChargeStrengthText(value);
  };

  const handleChargeStrengthField = (event) => {
    const value = event.target.value;
    const intValue = parseInt(value);

    if (value === "" || !isNaN(intValue)) {
      setChargeStrengthText(value);
    }
  };

  const handleChargeStrengthFieldBlur = (event) => {
    let value = event.target.value;
    const intValue = parseInt(value);

    if (value === "") {
      setChargeStrength(0);
      setChargeStrengthText(0);
    } else if (!isNaN(intValue)) {
      setChargeStrength(value);
      setChargeStrengthText(value);
    }
  };

  const handleCircleLayout = () => {
    setCircleLayout(!circleLayout);
  };

  return (
    <>
      <div className="inline pad-top-05 pad-bottom-05">
        <SidebarButtonRect
          text={"Set Phyiscs to Default"}
          onClick={handleResetPhysics}
        />
      </div>
      <SidebarSwitchBlock
        text={"Enable Circular Layout"}
        value={circleLayout}
        onChange={handleCircleLayout}
      />
      {!gravityAdvanced && (
        <>
          <SidebarSliderBlock
            text={"Set Gravity"}
            min={0}
            max={1}
            stepSlider={0.05}
            stepField={0.01}
            value={xStrength}
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
            value={xStrength}
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
            value={yStrength}
            valueText={yStrengthText}
            onChangeSlider={handleYStrengthSlider}
            onChangeField={handleYStrengthField}
            onChangeBlur={handleYStrengthFieldBlur}
          />
        </>
      )}
      <SidebarSwitchBlock
        text={"Advanced Gravity Settings"}
        value={gravityAdvanced}
        onChange={handleGravityAdvanced}
      />
      <SidebarSliderBlock
        text={"Set Component Strength"}
        min={0}
        max={10}
        stepSlider={0.1}
        stepField={0.05}
        value={componentStrength}
        valueText={componentStrengthText}
        onChangeSlider={handleComponentStrengthSlider}
        onChangeField={handleComponentStrengthField}
        onChangeBlur={handleComponentStrengthFieldBlur}
      />
      <>
        <SidebarFieldBlock
          text={"Minimum Component Size for Component Strength"}
          min={1}
          step={1}
          value={centroidThresholdText}
          onChange={handleCentroidThresholdChange}
          onBlur={handleCentroidThresholdBlur}
        />
      </>
      <SidebarSliderBlock
        text={"Set Node Repulsion Strength"}
        min={0}
        max={10}
        stepSlider={1}
        stepField={0.5}
        value={chargeStrength}
        valueText={chargeStrengthText}
        onChangeSlider={handleChargeStrengthSlider}
        onChangeField={handleChargeStrengthField}
        onChangeBlur={handleChargeStrengthFieldBlur}
      />
      <SidebarSwitchBlock
        text={"Enable Link Force"}
        value={linkForce}
        onChange={handleLinkForce}
      />
      {linkForce && (
        <SidebarSliderBlock
          text={"Set Link Length"}
          min={0}
          max={300}
          stepSlider={10}
          stepField={5}
          value={linkLength}
          valueText={linkLengthText}
          onChangeSlider={handleLinkLengthSlider}
          onChangeField={handleLinkLengthField}
          onChangeBlur={handleLinkLengthFieldBlur}
        />
      )}
      <SidebarSwitchBlock
        text={"Enable Border"}
        value={checkBorder}
        onChange={handleCheckBorder}
      />
      {checkBorder && (
        <>
          <SidebarSliderBlock
            text={"Set Border Height"}
            min={25}
            max={999}
            stepSlider={10}
            stepField={5}
            value={borderHeight}
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
            value={borderWidth}
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
