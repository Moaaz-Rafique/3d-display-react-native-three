import React from "react";
import RNThree from "./three/three";

import ExpoRNCamera from "./three/utils/Camera";
import PinchableBox from "./three/utils/scaleAndRotate";

function App(){
    // return <ExpoRNCamera/>
    // return <RNThree />
    return <PinchableBox />
}

export default App