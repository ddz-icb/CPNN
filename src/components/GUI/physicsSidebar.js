import { SidebarButtonRect, SidebarSliderBlock, SidebarSwitchBlock } from "./sidebar.js";

import { useSettings } from "../../states.js";

export function PhysicsSidebar({ resetPhysics }) {
  const { settings, setSettings } = useSettings();

  const handleLinkLengthSlider = (event) => {
    const value = event.target.value;

    setSettings("physics.linkLength", value);
    setSettings("physics.linkLengthText", value);
  };

  const handleLinkLengthField = (event) => {
    const value = event.target.value;
    const intValue = parseInt(value);

    if (value === "" || (!isNaN(intValue) && intValue <= 1000)) {
      setSettings("physics.linkLengthText", value);
    }
  };

  const handleLinkLengthFieldBlur = (event) => {
    let value = event.target.value;
    const intValue = parseInt(value);

    if (value === "") {
      setSettings("physics.linkLength", 0);
      setSettings("physics.linkLengthText", 0);
    } else if (!isNaN(intValue) && intValue <= 1000) {
      setSettings("physics.linkLength", value);
      setSettings("physics.linkLengthText", value);
    }
  };

  const handleBorderHeightSlider = (event) => {
    const value = event.target.value;
    setSettings("physics.borderHeight", value);
    setSettings("physics.borderHeightText", value);
  };

  const handleBorderHeightField = (event) => {
    const value = event.target.value;
    setSettings("physics.borderHeightText", value);
  };

  const handleBorderHeightFieldBlur = (event) => {
    let value = event.target.value;
    const intValue = parseInt(value);

    if (value === "" || !isNaN(intValue)) {
      if (value < 250) {
        value = 250;
      }
      setSettings("physics.borderHeight", value);
      setSettings("physics.borderHeightText", value);
    }
  };

  const handleBorderWidthFieldSlider = (event) => {
    const value = event.target.value;
    setSettings("physics.borderWidth", value);
    setSettings("physics.borderWidthText", value);
  };

  const handleBorderWidthField = (event) => {
    const value = event.target.value;
    setSettings("physics.borderWidthText", value);
  };

  const handleBorderWidthFieldBlur = (event) => {
    let value = event.target.value;
    const intValue = parseInt(value);

    if (value === "" || !isNaN(intValue)) {
      if (value < 250) {
        value = 250;
      }
      setSettings("physics.borderWidth", value);
      setSettings("physics.borderWidthText", value);
    }
  };

  const handleCheckBorder = () => {
    setSettings("physics.checkBorder", !settings.physics.checkBorder);
  };

  const handleXStrengthSlider = (event) => {
    const value = event.target.value;
    setSettings("physics.xStrength", value);
    setSettings("physics.xStrengthText", value);
  };

  const handleXStrengthField = (event) => {
    const value = event.target.value;

    if (value === "" || (value >= -1 && value <= 1)) {
      setSettings("physics.xStrengthText", value);
    }
  };

  const handleXStrengthFieldBlur = (event) => {
    let value = event.target.value;

    if (value === "") {
      setSettings("physics.xStrength", 0);
      setSettings("physics.xStrengthText", 0);
    } else if (value >= -1 && value <= 1) {
      setSettings("physics.xStrength", value);
      setSettings("physics.xStrengthText", value);
    }
  };

  const handleYStrengthSlider = (event) => {
    const value = event.target.value;
    setSettings("physics.yStrength", value);
    setSettings("physics.yStrengthText", value);
  };

  const handleYStrengthField = (event) => {
    const value = event.target.value;

    if (value === "" || (value >= -1 && value <= 1)) {
      setSettings("physics.yStrengthText", value);
    }
  };

  const handleYStrengthFieldBlur = (event) => {
    let value = event.target.value;

    if (value === "") {
      setSettings("physics.yStrength", 0);
      setSettings("physics.yStrengthText", 0);
    } else if (value >= -1 && value <= 1) {
      setSettings("physics.yStrength", value);
      setSettings("physics.yStrengthText", value);
    }
  };

  const handleComponentStrengthSlider = (event) => {
    const value = event.target.value;
    setSettings("physics.componentStrength", value);
    setSettings("physics.componentStrengthText", value);
  };

  const handleComponentStrengthField = (event) => {
    const value = event.target.value;

    if (value === "" || (value >= -1 && value <= 1)) {
      setSettings("physics.componentStrengthText", value);
    }
  };

  const handleComponentStrengthFieldBlur = (event) => {
    let value = event.target.value;

    if (value === "") {
      setSettings("physics.componentStrength", 0);
      setSettings("physics.componentStrengthText", 0);
    } else if (value >= -1 && value <= 1) {
      setSettings("physics.componentStrength", value);
      setSettings("physics.componentStrengthText", value);
    }
  };

  const handleGravityAdvanced = () => {
    setSettings("physics.gravityAdvanced", !settings.physics.gravityAdvanced);
  };

  const handleGravitySlider = (event) => {
    const value = event.target.value;
    setSettings("physics.xStrength", value);
    setSettings("physics.yStrength", value);

    setSettings("physics.xStrengthText", value);
    setSettings("physics.yStrengthText", value);
  };

  const handleGravityField = (event) => {
    const value = event.target.value;

    if (value === "" || (value >= -1 && value <= 1)) {
      setSettings("physics.xStrengthText", value);
      setSettings("physics.yStrengthText", value);
    }
  };

  const handleGravityFieldBlur = (event) => {
    let value = event.target.value;

    if (value === "") {
      setSettings("physics.xStrength", 0);
      setSettings("physics.yStrength", 0);

      setSettings("physics.xStrengthText", 0);
      setSettings("physics.yStrengthText", 0);
    } else if (value >= -1 && value <= 1) {
      setSettings("physics.xStrength", value);
      setSettings("physics.yStrength", value);

      setSettings("physics.xStrengthText", value);
      setSettings("physics.yStrengthText", value);
    }
  };

  const handleLinkForce = () => {
    setSettings("physics.linkForce", !settings.physics.linkForce);
  };

  const handleNodeRepulsionStrengthSlider = (event) => {
    const value = event.target.value;
    setSettings("physics.nodeRepulsionStrength", value);
    setSettings("physics.nodeRepulsionStrengthText", value);
  };

  const handleNodeRepulsionStrengthField = (event) => {
    const value = event.target.value;
    const intValue = parseInt(value);

    if (value === "" || !isNaN(intValue)) {
      setSettings("physics.nodeRepulsionStrengthText", value);
    }
  };

  const handleNodeRepulsionStrengthFieldBlur = (event) => {
    let value = event.target.value;
    const intValue = parseInt(value);

    if (value === "") {
      setSettings("physics.nodeRepulsionStrength", 0);
      setSettings("physics.nodeRepulsionStrengthText", 0);
    } else if (!isNaN(intValue)) {
      setSettings("physics.deRepulsionStrength", value);
      setSettings("physics.nodeRepulsionStrengthText", value);
    }
  };

  const handleCircleLayout = () => {
    setSettings("physics.circleLayout", !settings.physics.circleLayout);
  };

  return (
    <>
      <div className="inline pad-top-05 pad-bottom-05">
        <SidebarButtonRect text={"Set Phyiscs to Default"} onClick={resetPhysics} />
      </div>
      <SidebarSwitchBlock text={"Enable Circular Layout"} value={settings.physics.circleLayout} onChange={handleCircleLayout} />
      <SidebarSwitchBlock text={"Advanced Gravity Settings"} value={settings.physics.gravityAdvanced} onChange={handleGravityAdvanced} />
      {!settings.physics.gravityAdvanced && (
        <>
          <SidebarSliderBlock
            text={"Set Gravity"}
            min={0}
            max={1}
            stepSlider={0.05}
            stepField={0.01}
            value={settings.physics.xStrength}
            valueText={settings.physics.xStrengthText}
            onChangeSlider={handleGravitySlider}
            onChangeField={handleGravityField}
            onChangeBlur={handleGravityFieldBlur}
          />
        </>
      )}
      {settings.physics.gravityAdvanced && (
        <>
          <SidebarSliderBlock
            text={"Set Horizontal Gravity"}
            min={0}
            max={1}
            stepSlider={0.05}
            stepField={0.01}
            value={settings.physics.xStrength}
            valueText={settings.physics.xStrengthText}
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
            value={settings.physics.yStrength}
            valueText={settings.physics.yStrengthText}
            onChangeSlider={handleYStrengthSlider}
            onChangeField={handleYStrengthField}
            onChangeBlur={handleYStrengthFieldBlur}
          />
        </>
      )}
      <SidebarSliderBlock
        text={"Set Component Strength"}
        min={0}
        max={10}
        stepSlider={0.1}
        stepField={0.05}
        value={settings.physics.componentStrength}
        valueText={settings.physics.componentStrengthText}
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
        value={settings.physics.nodeRepulsionStrength}
        valueText={settings.physics.nodeRepulsionStrengthText}
        onChangeSlider={handleNodeRepulsionStrengthSlider}
        onChangeField={handleNodeRepulsionStrengthField}
        onChangeBlur={handleNodeRepulsionStrengthFieldBlur}
      />
      <SidebarSwitchBlock text={"Enable Link Force"} value={settings.physics.linkForce} onChange={handleLinkForce} />
      {settings.physics.linkForce && (
        <SidebarSliderBlock
          text={"Set Link Length"}
          min={0}
          max={300}
          stepSlider={10}
          stepField={5}
          value={settings.physics.linkLength}
          valueText={settings.physics.linkLengthText}
          onChangeSlider={handleLinkLengthSlider}
          onChangeField={handleLinkLengthField}
          onChangeBlur={handleLinkLengthFieldBlur}
        />
      )}
      <SidebarSwitchBlock text={"Enable Border"} value={settings.physics.checkBorder} onChange={handleCheckBorder} />
      {settings.physics.checkBorder && (
        <>
          <SidebarSliderBlock
            text={"Set Border Height"}
            min={25}
            max={999}
            stepSlider={10}
            stepField={5}
            value={settings.physics.borderHeight}
            valueText={settings.physics.borderHeightText}
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
            value={settings.physics.borderWidth}
            valueText={settings.physics.borderWidthText}
            onChangeSlider={handleBorderWidthFieldSlider}
            onChangeField={handleBorderWidthField}
            onChangeBlur={handleBorderWidthFieldBlur}
          />
        </>
      )}
    </>
  );
}
