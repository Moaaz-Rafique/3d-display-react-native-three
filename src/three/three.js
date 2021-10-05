import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  PanResponder,
  Animated,
} from 'react-native';
import {GLView} from 'expo-gl';
import {Renderer, TextureLoader} from 'expo-three';
import React, {useState, useEffect} from 'react';
import {
  AmbientLight,
  BoxBufferGeometry,
  HemisphereLight,
  Mesh,
  MeshStandardMaterial,
  OrthographicCamera,
  PerspectiveCamera,
  PointLight,
  Scene,
  Vector3,
} from 'three';
import {loadModel} from './utils/3d';
import OrbitControlsView from 'expo-three-orbit-controls';
import ExpoRNCamera from './utils/Camera';
import {useRef} from 'react';
import {
  PinchGestureHandler,
  PanGestureHandler,
  State,
} from 'react-native-gesture-handler';

const modelGLB = {
  icebear: {
    type: 'glb',
    name: 'icebear',
    model: require('../models/icebear/icebear.glb'),
    textures: [
      {
        name: 'polySurface10_lambert1_0',
        image: require('../models/icebear/lambert1_baseColor.xjpg'),
      },
      {
        name: 'axepCube3_lambert4_0',
        image: require('../models/icebear/lambert4_baseColor.xjpg'),
      },
    ],
    scale: {
      x: 1,
      y: 1,
      z: 1,
    },
    position: {
      x: 0,
      y: 0,
      z: -2,
    },
    rotation: {
      x: 0,
      y: 0,
      z: 0,
    },
    animation: {
      rotation: {
        y: 0.01, // to animate horizontally
      },
    },
  },
  box: {
    type: 'glb',
    name: 'box',
    model: require('../models/car/box.glb'),
    scale: {
      x: 1,
      y: 1,
      z: 1,
    },
    position: {
      x: 0,
      y: 0,
      z: -2,
    },
    animation: {
      rotation: {
        x: 0.03, // to animate horizontally
        y: 0.01, // to animate horizontally
      },
    },
  },
};

const modelOBJ = {
  hamburger: {
    type: 'obj',
    name: 'hamburger',
    isometric: false,
    model: require('../models/hamburger/Hamburger.obj'),
    textures: [{image: require('../models/hamburger/burger.png')}],
    scale: {
      x: 0.5,
      y: 0.5,
      z: 0.5,
    },
    position: {
      x: 0,
      y: 0,
      z: 1,
    },
    rotation: {
      x: 0,
      y: 0,
      z: 0,
    },
    animation: {
      rotation: {
        y: 0.01, // to animate horizontally
        x: 0.005, // to animate vertically
      },
    },
  },
};

const modelFBX = {
  shiba: {
    type: 'fbx',
    name: 'shiba',
    isometric: false,
    model: require('../models/shiba/shiba.fbx'),
    textures: [{image: require('../models/shiba/default_Base_Color.xpng')}],
    scale: {
      x: 3,
      y: 3,
      z: 3,
    },
    position: {
      x: 0,
      y: 0,
      z: 0,
    },
    rotation: {
      x: 0,
      y: 0,
      z: 0,
    },
    animation: {
      rotation: {
        y: 0.01, // to animate horizontally
      },
    },
  },
  icebear: {
    type: 'fbx',
    name: 'icebear',
    isometric: false,
    model: require('../models/icebear/source/icebear.fbx'),
    textures: [
      {
        name: 'axepCube3',
        image: require('../models/icebear/textures/TXaxe.xjpg'),
      },
      {
        name: 'polySurface10',
        image: require('../models/icebear/textures/TXpolar.xjpg'),
      },
    ],
    scale: {
      x: 1,
      y: 1,
      z: 1,
    },
    position: {
      x: 0,
      y: 0,
      z: -2,
    },
    rotation: {
      x: 0,
      y: 0,
      z: 0,
    },
    animation: {
      rotation: {
        y: 0.01, // to animate horizontally
      },
    },
  },
};

const RNThree = props => {
  // const pan = useRef();
  // const panResponder = useRef().current;
  // const pinch = useRef(new Animated.Value(0)).current;
  // const onPinchGestureEvent = Animated.event([{nativeEvent: {scale: pinch}}], {
  //   useNativeDriver: true,
  // });
  // const onPinchHandlerStateChange = event => {
  //   console.log(event);
  //   if (event.nativeEvent.oldState === State.ACTIVE) {
  //     console.log(event.nativeEvent.scale);
  //     // baseScale.setValue();
  //     // pinchScale.setValue(1);
  //   }
  // };
  const {scale, rotateStr, tiltStr} = props;

  const onContextCreate = async (gl, data) => {
    // const {setRenderer, setCamera, setScene} = data;
    const {selected, setSceneCamera} = data;
    const {drawingBufferWidth: width, drawingBufferHeight: height} = gl;
    const sceneColor = 0x000000;
    // Create a WebGLRenderer without a DOM element
    const renderer = new Renderer({gl, alpha: true});
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    renderer.setClearAlpha(0);

    const isModelArray = selected?.models && Array.isArray(selected.models);

    let camera;
    if (selected.isometric) {
      // use this if wan isometric view
      var aspect = width / height;
      var d = 10;
      camera = new OrthographicCamera(
        -d * aspect,
        d * aspect,
        d,
        -d,
        -10,
        1000,
      );
    } else {
      // use this if wan normal view
      camera = new PerspectiveCamera(75, width / height, 0.1, 1000);
      camera.position.set(0, 0, 10);
    }

    const scene = new Scene();
    setSceneCamera(camera);

    // HemisphereLight - color feels nicer
    const hemisphereLight = new HemisphereLight(0xffffff, 0x080820, 1);
    scene.add(hemisphereLight);
    // AmbientLight - add more brightness?
    const ambientLight = new AmbientLight(0x404040); // soft white light
    scene.add(ambientLight);

    let models = [];

    if (isModelArray) {
      for (let i = 0; i < selected.models.length; i++) {
        const model = selected.models[i];
        if (model) {
          scene.add(model);
          models.push(model);
        }
      }
    } else {
      const model = await loadModel(selected);
      if (model) {
        scene.add(model);
        models.push(model);
      }
    }

    function update() {
      if (models[0]) {
        models[0].rotation.z = -rotateStr?._parent?._offset;
        models[0].scale.x = scale?._a?._value;
        models[0].scale.y = scale?._a?._value;
      }
    }
    const render = () => {
      requestAnimationFrame(render);
      update();
      renderer.render(scene, camera);
      gl.endFrameEXP();
    };

    render();
  };
  const models = [
    modelOBJ.hamburger,
    modelFBX.icebear,
    modelFBX.shiba,
    modelGLB.icebear,
    modelGLB.box,
  ];
  const [selected, setSelected] = useState(models[0]);
  const [gl, setGL] = useState(null);
  const [sceneCamera, setSceneCamera] = useState(null);
  useEffect(() => {
    const thisModel = selected;
    if (thisModel) {
      console.log('sad life=======', thisModel);
      try {
        thisModel.rotation.z = -rotateStr?._parent?._offset || 0;
        thisModel.scale.x = scale?._a?._value || 1;
        thisModel[0].scale.y = scale?._a?._value || 1;
        setSelected(thisModel);
      } catch (err) {
        console.log(err);
      }
    }
  }, [scale, rotateStr]);
  return (
    <View style={styles.container}>
      <SafeAreaView />

      <View style={{flex: 1}}>
        {selected ? (
          <GLView
            style={{
              flex: 1,
              minHeight: 500,
              minWidth: 500,
              backgroundColor: '#0f07',
            }}
            onContextCreate={gl => {
              setGL(gl);
              onContextCreate(gl, {selected, setSceneCamera});
            }}
          />
        ) : (
          <View
            style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
            <Text>Loading...</Text>
          </View>
        )}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{
            flexDirection: 'row',
            position: 'absolute',
            top: 10,
            left: 10,
            right: 0,
          }}>
          {models?.map(x => (
            <View key={`${x?.name}-${x?.type}`}>
              <TouchableOpacity
                style={{
                  borderRadius: 5,
                  borderWidth: 1,
                  borderColor: '#3389c5',
                  backgroundColor: selected === x ? '#3389c5' : 'transparent',
                  padding: 10,
                  marginRight: 10,
                }}
                onPress={() => {
                  setSelected(null);
                  setTimeout(() => {
                    setSelected(x);
                  }, 200);
                }}>
                <Text style={{color: '#f00'}}>
                  {x?.name} ({x?.type})
                </Text>
              </TouchableOpacity>
            </View>
          ))}
          <View>
            <TouchableOpacity
              style={{
                borderRadius: 5,
                borderWidth: 1,
                borderColor: '#3389c5',
                backgroundColor: '#3389c5',
                padding: 10,
                marginRight: 10,
              }}
              onPress={() => {
                console.log('this is pan from button -------', {
                  scale: scale?._a?._value,
                  rotateStr,
                  tiltStr,
                });
              }}>
              <Text style={{color: '#f00'}}>whatever</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

export default RNThree;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
});
