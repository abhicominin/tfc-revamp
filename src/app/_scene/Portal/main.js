import { useFrame, useThree, createPortal } from "@react-three/fiber";
import { useFBO, useProgress, SoftShadows, useTexture, Sparkles } from "@react-three/drei";
import { useRef, Suspense, useMemo, useEffect } from "react";
import * as THREE from "three";
import { useControls } from "leva";
import { usePathname } from "next/navigation";

import vertexShader from "../Shaders/vertex.glsl";
import fragmentShader from "../Shaders/fragment.glsl";

import Camera from "./camera";
import PerspectiveCameraComponent from "./perspectivecamera";
import Environments from "./Objects/Lights";
import Rubic from "./Objects/Rubic";
import Floor from "./Objects/Floor";
import FloorMenu from "./Objects/Floormenu";

import useSceneStore from "../scenestore";

// Noise texture
const NOISE_TEXTURE_URL = "/Images/noise2.png";

const PortalSetup = () => {
  const mesh = useRef();
  const cameraRef = useRef();
  const { viewport, size } = useThree();
  const pathname = usePathname();

  const groupHovered = useSceneStore((state) => state.groupHovered);

  const { active, progress } = useProgress();
  const transitionValue = useRef(0);
  const revealStarted = useRef(false);

  const rawNoiseTexture = useTexture(NOISE_TEXTURE_URL);
  const noisetexture = useMemo(() => {
    rawNoiseTexture.wrapS = THREE.RepeatWrapping;
    rawNoiseTexture.wrapT = THREE.RepeatWrapping;
    rawNoiseTexture.minFilter = THREE.NearestMipmapLinearFilter;
    rawNoiseTexture.magFilter = THREE.NearestMipmapLinearFilter;
    rawNoiseTexture.needsUpdate = true;
    return rawNoiseTexture;
  }, [rawNoiseTexture]);

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

  const { fogColor, fogNear, fogFar } = useControls("Fog", {
    fogColor: "#000000",
    fogNear: { value: 0.01, min: 0, max: 20, step: 0.01 },
    fogFar:  { value: 3,    min: 0, max: 50, step: 0.1  },
  });

  const { blurProgress, blurMaskWidth, blurMaskHeight, blurMaskRoundness, blurMaskSmoothness, blurMaskStrength } = useControls("Blur", {
    blurProgress: { value: 1.0, min: 0, max: 1, step: 0.01 },
    blurMaskWidth: { value: 0.42, min: 0, max: 1, step: 0.01 },
    blurMaskHeight: { value: 0.37, min: 0, max: 1, step: 0.01 },
    blurMaskRoundness: { value: 1.00, min: 0, max: 1, step: 0.01 },
    blurMaskSmoothness: { value: 0.09, min: 0, max: 1, step: 0.01 },
    blurMaskStrength: { value: 1.24, min: 0, max: 5, step: 0.01 },
  });

  const { bgColor } = useControls("Background", {
    bgColor: "#000000",
  });

  const sceneOne = useMemo(() => new THREE.Scene(), [])

    const renderTargetOne = useFBO({
      samples: 2,
      width: size.width,
      height: size.height,
    })

  const uniforms = useMemo(() => ({
    uTime: new THREE.Uniform(0.0),
    uResolution: new THREE.Uniform(new THREE.Vector2()),
    uSceneOneTexture: new THREE.Uniform(null),
    uInitialTransition: new THREE.Uniform(0.0),
    uNoiseTexture: new THREE.Uniform(null),
    uChromaticAberration: new THREE.Uniform(0.0),
    uGrayScale: new THREE.Uniform(0.0),
    uBrighness: new THREE.Uniform(1.1),
    uContrast: new THREE.Uniform(1.0),
    uSaturation: new THREE.Uniform(1.0),
    uBlurMaskSize: new THREE.Uniform(new THREE.Vector2(0.43, 0.43)),
    uBlurProgress: new THREE.Uniform(0.0),
    uBlurMaskRoundness: new THREE.Uniform(0.77),
    uBlurMaskSmoothness: new THREE.Uniform(0.31),
    uBlurMaskStrength: new THREE.Uniform(0.0),
    uVignetteSize: new THREE.Uniform(new THREE.Vector2(0.43, 0.43)),
    uVignetteRoundness: new THREE.Uniform(0.77),
    uVignetteSmoothness: new THREE.Uniform(0.31),
    uBlurNoiseSampleTexture: new THREE.Uniform(noisetexture),
  }), []);

  useFrame((state, delta) => {
    if (!mesh.current || !cameraRef.current) return;

    const { clock, gl } = state;
    mesh.current.material.uniforms.uTime.value = clock.getElapsedTime();
    // Reuse the existing Vector2 — avoid heap allocation every frame
    mesh.current.material.uniforms.uResolution.value.set(
      size.width,
      size.height
    );
    mesh.current.material.uniforms.uBlurMaskStrength.value = blurMaskStrength;
    mesh.current.material.uniforms.uBlurNoiseSampleTexture.value = noisetexture;
    // Animate iris reveal after loading screen exits (~4s duration at speed 0.25)
    if (revealStarted.current && transitionValue.current < 1) {
      transitionValue.current = Math.min(transitionValue.current + delta * 0.21, 1);
      mesh.current.material.uniforms.uInitialTransition.value = transitionValue.current;
    }

    // Animate effect when hovering over menu text
    const isService = pathname === "/Service";

    // Lerp blur mask shape — route overrides take precedence over Leva baseline
    const targetWidth      = isService ? 0.33 : blurMaskWidth;
    const targetHeight     = isService ? 0.43 : blurMaskHeight;
    const targetSmoothness = isService ? 0.25 : blurMaskSmoothness;
    const blurSize = mesh.current.material.uniforms.uBlurMaskSize.value;
    blurSize.set(
      THREE.MathUtils.lerp(blurSize.x, targetWidth,  0.1),
      THREE.MathUtils.lerp(blurSize.y, targetHeight, 0.1)
    );
    mesh.current.material.uniforms.uBlurMaskSmoothness.value = THREE.MathUtils.lerp(
      mesh.current.material.uniforms.uBlurMaskSmoothness.value,
      targetSmoothness,
      0.1
    );
    mesh.current.material.uniforms.uBlurMaskRoundness.value = blurMaskRoundness;
    mesh.current.material.uniforms.uChromaticAberration.value = THREE.MathUtils.lerp(
      mesh.current.material.uniforms.uChromaticAberration.value,
      isService ? 0.1 : groupHovered ? 0.3 : 0.0,
      0.1
    );
    mesh.current.material.uniforms.uContrast.value = THREE.MathUtils.lerp(
      mesh.current.material.uniforms.uContrast.value,
      groupHovered ? 1.1 : 1.0,
      0.1
    );
    mesh.current.material.uniforms.uBrighness.value = THREE.MathUtils.lerp(
      mesh.current.material.uniforms.uBrighness.value,
      groupHovered ? 0.85 : 1.0,
      0.1
    );
    const targetBlur = (groupHovered || pathname === "/Contacts") ? 1.5 : isService ? 1.0 : blurProgress;
    mesh.current.material.uniforms.uBlurProgress.value = THREE.MathUtils.lerp(
      mesh.current.material.uniforms.uBlurProgress.value,
      targetBlur,
      0.1
    );


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
         {/* <PerspectiveCameraComponent ref={cameraRef} /> */}
         {/* <fog attach="fog" args={[fogColor, fogNear, fogFar]} /> */}
         <Sparkles
           count={150}
           scale={5}
           size={ groupHovered ? 1.5 : 1.2 }
           noise={50}
           speed={ groupHovered ? 0.1 : 0.5 }
           opacity={ pathname === '/Service' ? 0 : 1 }
         />
         <Environments />
         <Rubic />
         <Floor />
         <FloorMenu />
         <color attach="background" args={[bgColor]} />
        </>
         ,
         sceneOne,
         {
           events: {
             compute: (_, s, p) => {
               s.pointer.copy(p.pointer);
               s.raycaster.setFromCamera(s.pointer, s.camera);
             }
           }
         }
      )}
    </>
  );
};

const Main = () => {
  return (
      <>
        <SoftShadows size={25} focus={0.8} samples={10} />
        <Suspense fallback={null}>
          <PortalSetup />
        </Suspense>
      </>
  )
}


export default Main;
