import { SidebarButtonRect, SidebarSliderBlock, SidebarSwitchBlock } from "./sidebar.js";

import { useSettings } from "../../states.js";

export function PhysicsSidebar({ resetPhysics }) {
  const { settings, setSettings } = useSettings();

  const handleLinkLengthSlider = (event) => {
    const value = event.target.value;

    setSettings("physicsSettings.linkLength", value);
    setSettings("physicsSettings.linkLengthText", value);
  };

  const handleLinkLengthField = (event) => {
    const value = event.target.value;
    const intValue = parseInt(value);

    if (value === "" || (!isNaN(intValue) && intValue <= 1000)) {
      setSettings("physicsSettings.linkLengthText", value);
    }
  };

  const handleLinkLengthFieldBlur = (event) => {
    let value = event.target.value;
    const intValue = parseInt(value);

    if (value === "") {
      setSettings("physicsSettings.linkLength", 0);
      setSettings("physicsSettings.linkLengthText", 0);
    } else if (!isNaN(intValue) && intValue <= 1000) {
      setSettings("physicsSettings.linkLength", value);
      setSettings("physicsSettings.linkLengthText", value);
    }
  };

  const handleBorderHeightSlider = (event) => {
    const value = event.target.value;
    setSettings("physicsSettings.borderHeight", value);
    setSettings("physicsSettings.borderHeightText", value);
  };

  const handleBorderHeightField = (event) => {
    const value = event.target.value;
    setSettings("physicsSettings.borderHeightText", value);
  };

  const handleBorderHeightFieldBlur = (event) => {
    let value = event.target.value;
    const intValue = parseInt(value);

    if (value === "" || !isNaN(intValue)) {
      if (value < 250) {
        value = 250;
      }
      setSettings("physicsSettings.borderHeight", value);
      setSettings("physicsSettings.borderHeightText", value);
    }
  };

  const handleBorderWidthFieldSlider = (event) => {
    const value = event.target.value;
    setSettings("physicsSettings.borderWidth", value);
    setSettings("physicsSettings.borderWidthText", value);
  };

  const handleBorderWidthField = (event) => {
    const value = event.target.value;
    setSettings("physicsSettings.borderWidthText", value);
  };

  const handleBorderWidthFieldBlur = (event) => {
    let value = event.target.value;
    const intValue = parseInt(value);

    if (value === "" || !isNaN(intValue)) {
      if (value < 250) {
        value = 250;
      }
      setSettings("physicsSettings.borderWidth", value);
      setSettings("physicsSettings.borderWidthText", value);
    }
  };

  const handleCheckBorder = () => {
    setSettings("physicsSettings.checkBorder", !settings.physicsSettings.checkBorder);
  };

  const handleXStrengthSlider = (event) => {
    const value = event.target.value;
    setSettings("physicsSettings.xStrength", value);
    setSettings("physicsSettings.xStrengthText", value);
  };

  const handleXStrengthField = (event) => {
    const value = event.target.value;

    if (value === "" || (value >= -1 && value <= 1)) {
      setSettings("physicsSettings.xStrengthText", value);
    }
  };

  const handleXStrengthFieldBlur = (event) => {
    let value = event.target.value;

    if (value === "") {
      setSettings("physicsSettings.xStrength", 0);
      setSettings("physicsSettings.xStrengthText", 0);
    } else if (value >= -1 && value <= 1) {
      setSettings("physicsSettings.xStrength", value);
      setSettings("physicsSettings.xStrengthText", value);
    }
  };

  const handleYStrengthSlider = (event) => {
    const value = event.target.value;
    setSettings("physicsSettings.yStrength", value);
    setSettings("physicsSettings.yStrengthText", value);
  };

  const handleYStrengthField = (event) => {
    const value = event.target.value;

    if (value === "" || (value >= -1 && value <= 1)) {
      setSettings("physicsSettings.yStrengthText", value);
    }
  };

  const handleYStrengthFieldBlur = (event) => {
    let value = event.target.value;

    if (value === "") {
      setSettings("physicsSettings.yStrength", 0);
      setSettings("physicsSettings.yStrengthText", 0);
    } else if (value >= -1 && value <= 1) {
      setSettings("physicsSettings.yStrength", value);
      setSettings("physicsSettings.yStrengthText", value);
    }
  };

  const handleComponentStrengthSlider = (event) => {
    const value = event.target.value;
    setSettings("physicsSettings.componentStrength", value);
    setSettings("physicsSettings.componentStrengthText", value);
  };

  const handleComponentStrengthField = (event) => {
    const value = event.target.value;

    if (value === "" || (value >= -1 && value <= 1)) {
      setSettings("physicsSettings.componentStrengthText", value);
    }
  };

  const handleComponentStrengthFieldBlur = (event) => {
    let value = event.target.value;

    if (value === "") {
      setSettings("physicsSettings.componentStrength", 0);
      setSettings("physicsSettings.componentStrengthText", 0);
    } else if (value >= -1 && value <= 1) {
      setSettings("physicsSettings.componentStrength", value);
      setSettings("physicsSettings.componentStrengthText", value);
    }
  };

  const handleGravityAdvanced = () => {
    setSettings("physicsSettings.gravityAdvanced", !settings.physicsSettings.gravityAdvanced);
  };

  const handleGravitySlider = (event) => {
    const value = event.target.value;
    setSettings("physicsSettings.xStrength", value);
    setSettings("physicsSettings.yStrength", value);

    setSettings("physicsSettings.xStrengthText", value);
    setSettings("physicsSettings.yStrengthText", value);
  };

  const handleGravityField = (event) => {
    const value = event.target.value;

    if (value === "" || (value >= -1 && value <= 1)) {
      setSettings("physicsSettings.xStrengthText", value);
      setSettings("physicsSettings.yStrengthText", value);
    }
  };

  const handleGravityFieldBlur = (event) => {
    let value = event.target.value;

    if (value === "") {
      setSettings("physicsSettings.xStrength", 0);
      setSettings("physicsSettings.yStrength", 0);

      setSettings("physicsSettings.xStrengthText", 0);
      setSettings("physicsSettings.yStrengthText", 0);
    } else if (value >= -1 && value <= 1) {
      setSettings("physicsSettings.xStrength", value);
      setSettings("physicsSettings.yStrength", value);

      setSettings("physicsSettings.xStrengthText", value);
      setSettings("physicsSettings.yStrengthText", value);
    }
  };

  const handleLinkForce = () => {
    setSettings("physicsSettings.linkForce", !settings.physicsSettings.linkForce);
  };

  const handleNodeRepulsionStrengthSlider = (event) => {
    const value = event.target.value;
    setSettings("physicsSettings.nodeRepulsionStrength", value);
    setSettings("physicsSettings.nodeRepulsionStrengthText", value);
  };

  const handleNodeRepulsionStrengthField = (event) => {
    const value = event.target.value;
    const intValue = parseInt(value);

    if (value === "" || !isNaN(intValue)) {
      setSettings("physicsSettings.nodeRepulsionStrengthText", value);
    }
  };

  const handleNodeRepulsionStrengthFieldBlur = (event) => {
    let value = event.target.value;
    const intValue = parseInt(value);

    if (value === "") {
      setSettings("physicsSettings.nodeRepulsionStrength", 0);
      setSettings("physicsSettings.nodeRepulsionStrengthText", 0);
    } else if (!isNaN(intValue)) {
      setSettings("physicsSettings.deRepulsionStrength", value);
      setSettings("physicsSettings.nodeRepulsionStrengthText", value);
    }
  };

  const handleCircleLayout = () => {
    setSettings("physicsSettings.circleLayout", !settings.physicsSettings.circleLayout);
  };

  return (
    <>
      <div className="inline pad-top-05 pad-bottom-05">
        <SidebarButtonRect text={"Set Phyiscs to Default"} onClick={resetPhysics} />
      </div>
      <SidebarSwitchBlock text={"Enable Circular Layout"} value={settings.physicsSettings.circleLayout} onChange={handleCircleLayout} />
      {!settings.physicsSettings.gravityAdvanced && (
        <>
          <SidebarSliderBlock
            text={"Set Gravity"}
            min={0}
            max={1}
            stepSlider={0.05}
            stepField={0.01}
            value={settings.physicsSettings.xStrength}
            valueText={settings.physicsSettings.xStrengthText}
            onChangeSlider={handleGravitySlider}
            onChangeField={handleGravityField}
            onChangeBlur={handleGravityFieldBlur}
          />
        </>
      )}
      {settings.physicsSettings.gravityAdvanced && (
        <>
          <SidebarSliderBlock
            text={"Set Horizontal Gravity"}
            min={0}
            max={1}
            stepSlider={0.05}
            stepField={0.01}
            value={settings.physicsSettings.xStrength}
            valueText={settings.physicsSettings.xStrengthText}
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
            value={settings.physicsSettings.yStrength}
            valueText={settings.physicsSettings.yStrengthText}
            onChangeSlider={handleYStrengthSlider}
            onChangeField={handleYStrengthField}
            onChangeBlur={handleYStrengthFieldBlur}
          />
        </>
      )}
      <SidebarSwitchBlock text={"Advanced Gravity Settings"} value={settings.physicsSettings.gravityAdvanced} onChange={handleGravityAdvanced} />
      <SidebarSliderBlock
        text={"Set Component Strength"}
        min={0}
        max={10}
        stepSlider={0.1}
        stepField={0.05}
        value={settings.physicsSettings.componentStrength}
        valueText={settings.physicsSettings.componentStrengthText}
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
        value={settings.physicsSettings.nodeRepulsionStrength}
        valueText={settings.physicsSettings.nodeRepulsionStrengthText}
        onChangeSlider={handleNodeRepulsionStrengthSlider}
        onChangeField={handleNodeRepulsionStrengthField}
        onChangeBlur={handleNodeRepulsionStrengthFieldBlur}
      />
      <SidebarSwitchBlock text={"Enable Link Force"} value={settings.physicsSettings.linkForce} onChange={handleLinkForce} />
      {settings.physicsSettings.linkForce && (
        <SidebarSliderBlock
          text={"Set Link Length"}
          min={0}
          max={300}
          stepSlider={10}
          stepField={5}
          value={settings.physicsSettings.linkLength}
          valueText={settings.physicsSettings.linkLengthText}
          onChangeSlider={handleLinkLengthSlider}
          onChangeField={handleLinkLengthField}
          onChangeBlur={handleLinkLengthFieldBlur}
        />
      )}
      <SidebarSwitchBlock text={"Enable Border"} value={settings.physicsSettings.checkBorder} onChange={handleCheckBorder} />
      {settings.physicsSettings.checkBorder && (
        <>
          <SidebarSliderBlock
            text={"Set Border Height"}
            min={25}
            max={999}
            stepSlider={10}
            stepField={5}
            value={settings.physicsSettings.borderHeight}
            valueText={settings.physicsSettings.borderHeightText}
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
            value={settings.physicsSettings.borderWidth}
            valueText={settings.physicsSettings.borderWidthText}
            onChangeSlider={handleBorderWidthFieldSlider}
            onChangeField={handleBorderWidthField}
            onChangeBlur={handleBorderWidthFieldBlur}
          />
        </>
      )}
    </>
  );
}
