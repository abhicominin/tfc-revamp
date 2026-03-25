import { useFrame, useThree, createPortal } from "@react-three/fiber";
import { useFBO, useProgress, SoftShadows } from "@react-three/drei";
import { useRef, Suspense, useMemo, useEffect } from "react";
import * as THREE from "three";

import vertexShader from "../Shaders/vertex.glsl";
import fragmentShader from "../Shaders/fragment.glsl";

import Camera from "./camera";
import Environments from "./Objects/Lights";
import Rubic from "./Objects/Rubic";
import Floor from "./Objects/Floor";

const PortalSetup = () => {
  const mesh = useRef();
  const cameraRef = useRef();
  const { viewport, gl } = useThree();

  // One-time GL setup — never call setPixelRatio or autoClear inside useFrame
  useEffect(() => {
    gl.autoClear = false;
    gl.setPixelRatio(Math.min(window.devicePixelRatio, 1.0));
  }, [gl]);

  const { active, progress } = useProgress();
  const transitionValue = useRef(0);
  const revealStarted = useRef(false);

  // Start the iris reveal after the loading screen's 0.9s exit animation finishes
  useEffect(() => {
    if (!active && progress === 100) {
      // loading screen: 1.5s exit + 500ms showing 100% = 2000ms + 100ms buffer
      const timer = setTimeout(() => {
        revealStarted.current = true;
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [active, progress]);

  const sceneOne = useMemo(() => new THREE.Scene(), [])

  const renderTargetOne = useFBO({
      samples: 1,
      width: window.innerWidth,
      height: window.innerHeight,
  })

  const uniforms = useMemo(() => ({
    uTime: new THREE.Uniform(0.0),
    uResolution: new THREE.Uniform(new THREE.Vector2()),
    uSceneOneTexture: new THREE.Uniform(null),
    uInitialTransition: new THREE.Uniform(0.0),
    uNoiseTexture: new THREE.Uniform(null),
    uChromaticAberration: new THREE.Uniform(0.0),
    uGrayScale: new THREE.Uniform(0.0),
    uBrighness: new THREE.Uniform(1.0),
    uContrast: new THREE.Uniform(1.0),
    uSaturation: new THREE.Uniform(1.0),
    uVignetteSize: new THREE.Uniform(new THREE.Vector2(0.43, 0.43)),
    uVignetteRoundness: new THREE.Uniform(0.77),
    uVignetteSmoothness: new THREE.Uniform(0.31),
  }), []);

  useFrame((state, delta) => {
    const { clock, gl } = state;
    mesh.current.material.uniforms.uTime.value = clock.getElapsedTime();
    // Reuse the existing Vector2 — avoid heap allocation every frame
    mesh.current.material.uniforms.uResolution.value.set(
      window.innerWidth,
      window.innerHeight
    );
    // Animate iris reveal after loading screen exits (~4s duration at speed 0.25)
    if (revealStarted.current && transitionValue.current < 1) {
      transitionValue.current = Math.min(transitionValue.current + delta * 0.21, 1);
      mesh.current.material.uniforms.uInitialTransition.value = transitionValue.current;
    }

    // Render the first scene to its render target
    gl.setRenderTarget(renderTargetOne);
    gl.render(sceneOne, cameraRef.current);
    mesh.current.material.uniforms.uSceneOneTexture.value = renderTargetOne.texture;
    mesh.current.material.uniforms.uNoiseTexture.value = renderTargetOne.texture;

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

      
  
      {createPortal(
        <>
         <Camera ref={cameraRef} />
         <Environments />
         <Rubic />
         <Floor />
         <SoftShadows size={35} samples={10} focus={0.9}/>
         <color attach="background" args={["#000000"]} />
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
