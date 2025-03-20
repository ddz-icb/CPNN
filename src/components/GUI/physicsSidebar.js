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
      <SidebarSwitchBlock
        text={"Circular Layout"}
        value={settings.physics.circleLayout}
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
        value={settings.physics.xStrength}
        valueText={settings.physics.xStrengthText}
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
        value={settings.physics.componentStrength}
        valueText={settings.physics.componentStrengthText}
        onChangeSlider={handleComponentStrengthSlider}
        onChangeField={handleComponentStrengthField}
        onChangeBlur={handleComponentStrengthFieldBlur}
        infoHeading={"Adjusting the Component Strength"}
        infoDescription={
          <div>
            <p className="margin-0">
              The component force can be used to separate components/clusters from one another. The components separate further with an increasing
              force.
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
        value={settings.physics.nodeRepulsionStrength}
        valueText={settings.physics.nodeRepulsionStrengthText}
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
        text={"Link Force"}
        value={settings.physics.linkForce}
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
      {settings.physics.linkForce && (
        <SidebarSliderBlock
          text={"Link Length"}
          min={0}
          max={300}
          stepSlider={10}
          stepField={5}
          value={settings.physics.linkLength}
          valueText={settings.physics.linkLengthText}
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
        value={settings.physics.checkBorder}
        onChange={handleCheckBorder}
        infoHeading={"Enabling the Border Force"}
        infoDescription={
          <div>
            <p className="margin-0">The border force can be used to contain the graph within an adjustable rectangle.</p>
          </div>
        }
      />
      {settings.physics.checkBorder && (
        <>
          <SidebarSliderBlock
            text={"Border Height"}
            min={25}
            max={999}
            stepSlider={10}
            stepField={5}
            value={settings.physics.borderHeight}
            valueText={settings.physics.borderHeightText}
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
            max={999}
            stepSlider={5}
            stepField={5}
            value={settings.physics.borderWidth}
            valueText={settings.physics.borderWidthText}
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
