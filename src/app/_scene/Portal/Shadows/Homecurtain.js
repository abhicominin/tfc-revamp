import { useFrame } from "@react-three/fiber";
import * as THREE from 'three'
import { useMemo, useRef } from "react";

export default function Curtain(){
  const clothSize = 4
  const nX = 16
  const nY = 16

  const uTime = useRef({ value: 0 })

  const [material, depthMaterial] = useMemo(() => {
    const mat = new THREE.MeshBasicMaterial({
      opacity: 0.00001,
      transparent: true,
      side: THREE.DoubleSide,
    })

    const depth = new THREE.MeshDepthMaterial({
      depthPacking: THREE.RGBADepthPacking,
      side: THREE.DoubleSide,
    })

    depth.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = uTime.current
      shader.uniforms.uShadowOpacity = { value: 0.50 }

      // --- vertex: displacement ---
      shader.vertexShader = `uniform float uTime;\n` + shader.vertexShader.replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        float factor = 1.0 - uv.y;
        float wave = sin(uTime * 0.5 + position.x * 2.0) * sin(uTime * 0.7 + position.y * 1.5);
        transformed.z += wave * factor * 0.5;
        transformed.x += wave * factor * 0.02;`
      )

      // --- fragment: bayer-dithered opacity (replicates ShadowAlpha) ---
      shader.fragmentShader = shader.fragmentShader.replace(
        'void main() {',
        `uniform float uShadowOpacity;
        float bayerDither2x2(vec2 v){ return mod(3.0*v.y + 2.0*v.x, 4.0); }
        float bayerDither4x4(vec2 v){
          vec2 P1 = mod(v, 2.0);
          vec2 P2 = mod(floor(0.5*v), 2.0);
          return 4.0*bayerDither2x2(P1) + bayerDither2x2(P2);
        }
        void main() {
          if(bayerDither4x4(floor(mod(gl_FragCoord.xy, 4.0))) / 16.0 >= uShadowOpacity) discard;`
      )
    }

    return [mat, depth]
  }, [])

  useFrame(({ clock }) => {
    uTime.current.value = clock.elapsedTime
  })

  return(
      <>
      <mesh castShadow customDepthMaterial={depthMaterial} position={[-2.44, 1.2, 0]} scale-y={2}>
        <planeGeometry args={[clothSize, clothSize, nX, nY]} />
        <primitive object={material} attach="material" />
      </mesh>
      </>
  )
}