import React, {useState, useEffect, useCallback, useRef} from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  ImageBackground,
} from 'react-native';
import {Camera} from 'expo-camera';
import RNThree from '../three';
import PinchableBox from './scaleAndRotate';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import ViewShot, {captureRef, captureScreen} from 'react-native-view-shot';

export default function ExpoRNCamera() {
  const cameraRef = useRef();
  const [hasPermission, setHasPermission] = useState(null);
  const [type, setType] = useState(Camera.Constants.Type.front);
  const [source, setSource] = useState(null);
  const [viewCam, setViewCam] = useState(true);
  const [camera, setCamera] = useState(null);
  const [pictureTaken, setPictureTaken] = useState(true);
  // const onCapture = useCallback(uri => setSource({uri}), []);

  const [previewSource, setPreviewSource] = useState({
    uri: 'https://i.imgur.com/5EOyTDQ.jpg',
  });
  const [config, setConfig] = useState({
    format: 'png',
    quality: 0.9,
    result: 'tmpfile',
    snapshotContentContainer: false,
  });

  const [result, setResult] = useState({error: null, res: null});

  useEffect(() => {
    (async () => {
      const {status} = await Camera.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const onCaptureFailure = useCallback(error => {
    console.warn(error);
    setPreviewSource(null);
    setResult({
      error,
      res: null,
    });
  }, []);
  const onCapture = useCallback(
    res => {
      if (config.result === 'base64') {
        const b = Buffer.from(res, 'base64');
        console.log('buffer of length ' + b.length);
      }
      setPreviewSource({
        uri:
          config.result === 'base64'
            ? 'data:image/' + config.format + ';base64,' + res
            : res,
      });
      setResult({
        error: null,
        res,
      });
    },
    [config],
  );

  const capture = useCallback(
    ref => {
      (ref ? captureRef(ref, config) : captureScreen(config))
        .then(res =>
          config.result !== 'tmpfile'
            ? res
            : new Promise((success, failure) =>
                // just a test to ensure res can be used in Image.getSize
                Image.getSize(res, (width, height) => success(res), failure),
              ),
        )
        .then(onCapture, onCaptureFailure);
    },
    [config, onCapture, onCaptureFailure],
  );

  if (hasPermission === null) {
    return <View />;
  }
  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

  return (
    <GestureHandlerRootView style={{flex: 1}}>
      {/* <View> */}
      <View style={{flex: 1}} collapsable={false}>
        <ViewShot
          ref={cameraRef}
          onCapture={capture}
          captureMode="mount"
          style={styles.container}>
          {viewCam ? (
            <Camera
              style={styles.camera}
              type={type}
              ref={ref => {
                setCamera(ref);
              }}>
              <View style={styles.buttonContainer}>
                <ImageBackground
                  source={{uri: source && source.uri}}
                  style={{
                    flex: 1,
                  }}>
                  <PinchableBox />
                </ImageBackground>
                {/* <RNThree /> */}
              </View>
            </Camera>
          ) : (
            <View style={{flex: 1}}>
              <Image
                style={{flex: 1, resizeMode: 'contain'}}
                source={previewSource}
              />
              {/* <Image style={{flex: 1, resizeMode: 'contain'}} source={source && source} /> */}
            </View>
          )}
        </ViewShot>
      </View>
      {/* </View> */}

      <View style={{flex: 0.1}}>
        <TouchableOpacity
          style={styles.button}
          onPress={async () => {
            // setType(
            //   type === Camera.Constants.Type.back
            //     ? Camera.Constants.Type.front
            //     : Camera.Constants.Type.back,
            // );

            // console.log(photo);
            if (viewCam) {
              if (camera && !source) {
                const photo = await camera.takePictureAsync();
                console.log('My Photo', photo);
                // alert('capture');
                setSource({uri: photo?.uri});
              } else if (source) {
                setViewCam(false);
                capture(cameraRef);
                setSource(null);
                console.log('finalized');
              } else {
                console.log('no camera');
              }
            } else {
              setSource(null);
              setViewCam(true);
            }
          }}>
          <Text style={styles.text}>
            {' '}
            {viewCam && source
              ? 'Finalize'
              : viewCam
              ? 'Capture'
              : 'Retake'}{' '}
          </Text>
        </TouchableOpacity>
      </View>
    </GestureHandlerRootView>
  );
}

/* @hide const styles = StyleSheet.create({ ... }); */
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    // margin: 20,
  },
  button: {
    flex: 1,
    alignSelf: 'flex-end',
    alignItems: 'center',
  },
  text: {
    fontSize: 18,
    color: 'blue',
  },
});
