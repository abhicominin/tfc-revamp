import { useFrame, useThree, createPortal } from "@react-three/fiber";
import { useFBO } from "@react-three/drei";
import { useRef, Suspense, useMemo } from "react";
import * as THREE from "three";
import { useControls } from "leva";

import vertexShader from "../Shaders/vertex.glsl";
import fragmentShader from "../Shaders/fragment.glsl";

import Camera from "./camera";
import Environments from "./Objects/Lights";
import Rubic from "./Objects/Rubic";
import Floor from "./Objects/Floor";

const PortalSetup = () => {
  const mesh = useRef();
  const cameraRef = useRef();
  const { viewport } = useThree();

  // Leva controls for debugging
  const { initialTransitionProgress } = useControls({
    initialTransitionProgress: { value: 0.5, min: 0, max: 1, step: 0.01 },
  });

  const sceneOne = useMemo(() => new THREE.Scene(), [])

  const renderTargetOne = useFBO({
      samples: 1,
      width: window.innerWidth,
      height: window.innerHeight,
      colorSpace: THREE.SRGBColorSpace,
  })

  const uniforms = useMemo(() => ({
    uTime: new THREE.Uniform(0.0),
    uResolution: new THREE.Uniform(new THREE.Vector2()),
    uSceneOneTexture: new THREE.Uniform(null),
    uInitialTransition: new THREE.Uniform(initialTransitionProgress),
  }), []);

  useFrame((state) => {
    const { clock, gl } = state;
    mesh.current.material.uniforms.uTime.value = clock.getElapsedTime();
    mesh.current.material.uniforms.uResolution.value = new THREE.Vector2(
      window.innerWidth,
      window.innerHeight
    );
    mesh.current.material.uniforms.uInitialTransition.value = initialTransitionProgress;

    gl.setPixelRatio(1); // Ensure consistent pixel ratio for render targets

    // Render the first scene to its render target
    gl.setRenderTarget(renderTargetOne);
    gl.render(sceneOne, cameraRef.current);
    mesh.current.material.uniforms.uSceneOneTexture.value = renderTargetOne.texture;

    // Reset to default framebuffer
    gl.setRenderTarget(null);
    
  });

  return (
    <>
      <mesh ref={mesh} scale={[viewport.width, viewport.height, 1]}>
        <planeGeometry args={[1, 1]} />
        <shaderMaterial
          fragmentShader={fragmentShader}
          vertexShader={vertexShader}
          uniforms={uniforms}
          transparent={true}
        />
      </mesh>

      <Camera ref={cameraRef} />
  
      {createPortal(
        <>
         <Environments />
         <Rubic />
         <Floor />
         <color attach="background" args={["#ffffff"]} />
        </>
         ,
         sceneOne,
         { events: { compute: (_, s, p) => { s.pointer.copy(p.pointer); s.raycaster.setFromCamera(s.pointer, cameraRef.current) } } }
      )}
    </>
  );
};

const Main = () => {
  return (
      <Suspense fallback={null}>
        <PortalSetup />
      </Suspense>
  )
}


export default Main;
