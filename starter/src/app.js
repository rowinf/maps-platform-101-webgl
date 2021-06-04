// Copyright 2021 Google LLC

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     https://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { Loader } from "@googlemaps/js-api-loader";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

const apiOptions = {
  apiKey: process.env.GoogleMapsAPIKey,
  version: "beta",
  map_ids: [process.env.GoogleMapsMapId],
};
const rotationIsOn = false;

const mapOptions = {
  tilt: 0,
  heading: 0,
  zoom: 18,
  center: { lat: -36.920534, lng: 174.787329 },
  mapId: process.env.GoogleMapsMapId,
};

async function initMap() {
  const mapDiv = document.getElementById("map");
  const apiLoader = new Loader(apiOptions);
  await apiLoader.load();

  const map = new google.maps.Map(mapDiv, mapOptions);

  google.maps.event.addListener(map, "zoom_changed", (e) => {
    let zoomLevel = map.getZoom();
    if (zoomLevel > 4 && zoomLevel < 20) {
      mapOptions.zoom = zoomLevel;
    }
  });
  return map;
}

function initWebglOverlayView(map) {
  let scene, renderer, camera, loader;
  // WebGLOverlayView code goes here
  const webglOverlayView = new google.maps.WebglOverlayView();

  webglOverlayView.onAdd = () => {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera();
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffafaf, 0.25);
    directionalLight.position.set(0.5, -1, 0.5);
    scene.add(directionalLight);

    // load the model
    loader = new GLTFLoader();
    const shader = "shader.gltf";
    loader.load(shader, (gltf) => {
      gltf.scene.scale.set(5, 5, 5);
      gltf.scene.rotation.x = (270 * Math.PI) / 270;
      const s2 = gltf.scene.clone();
      gltf.scene.position.set(20, 0, -100);
      s2.position.set(-20, 0, -100);
      scene.add(s2);
      scene.add(gltf.scene);
    });
    const particle = "particle.gltf";
    loader.load(particle, (gltf) => {
      gltf.scene.rotation.x = 0.5 * Math.PI;
      // gltf.scene.rotation.y = (90 * Math.PI) / 90;
      // gltf.scene.rotation.z = (45 * Math.PI) / 45;
      gltf.scene.position.set(0, 0, -151);
      gltf.scene.scale.set(3, 3, 3);
      scene.add(gltf.scene);
    });
    const source = "wooden-crate.glb";
    loader.load(source, (gltf) => {
      gltf.scene.position.set(0, 0, -100);
      gltf.scene.scale.set(12, 12, 12);
      gltf.scene.rotation.x = (180 * Math.PI) / 180;
      scene.add(gltf.scene);
    });
  };

  webglOverlayView.onContextRestored = (gl) => {
    // create the three.js renderer, using the
    // maps's WebGL rendering context.
    renderer = new THREE.WebGLRenderer({
      canvas: gl.canvas,
      context: gl,
      ...gl.getContextAttributes(),
    });
    renderer.autoClear = false;
    loader.manager.onLoad = () => {
      renderer.setAnimationLoop(() => {
        map.moveCamera({
          tilt: mapOptions.tilt,
          heading: mapOptions.heading,
          zoom: mapOptions.zoom,
        });
        if (mapOptions.tilt < 67.5) {
          mapOptions.tilt += 0.5;
        } else if (rotationIsOn && mapOptions.heading <= 360) {
          mapOptions.heading += 0.2;
        } else if (rotationIsOn) {
          renderer.setAnimationLoop(null);
        }
      });
    };
  };
  webglOverlayView.onDraw = (gl, coordinateTransformer) => {
    webglOverlayView.requestRedraw();
    renderer.render(scene, camera);
    renderer.resetState();
    const matrix = coordinateTransformer.fromLatLngAltitude(
      mapOptions.center,
      120
    );
    camera.projectionMatrix = new THREE.Matrix4().fromArray(matrix);
  };
  webglOverlayView.setMap(map);
}

(async () => {
  const map = await initMap();
  initWebglOverlayView(map);
})();
