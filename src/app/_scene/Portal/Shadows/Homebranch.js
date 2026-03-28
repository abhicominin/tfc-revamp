import * as THREE from 'three'
import { useTexture } from "@react-three/drei"
import { useEffect, useLayoutEffect, useMemo, useCallback, useRef } from 'react';
import { useFrame } from "@react-three/fiber";
import { usePathname } from "next/navigation";
import { ASSETS } from '@/app/asset'

// Displacement chunks shared between the visible material and the depth (shadow) material
// so they always move in lockstep and the shadow never detaches from the mesh.
const VERT_UNIFORMS = `
  #include <common>
  uniform float uTime;
`;

const VERT_DISPLACEMENT = `
  #include <begin_vertex>

  float strength = smoothstep(0.9, 0.7, uv.y);
  transformed.x += sin(uTime * 0.4 + position.y * 0.6) * 0.004 * strength;
  transformed.z += sin(uTime * 0.3 + position.x * 0.5) * 0.2 * strength;
`;

const DEFAULT_POSITION = new THREE.Vector3(0.32, 0.58, 0.0);
const SERVICE_POSITION = new THREE.Vector3(0.20, 0.3, 0.0);
const DEFAULT_ROTATION_Z = THREE.MathUtils.degToRad(-75);
const SERVICE_ROTATION_Z = THREE.MathUtils.degToRad(-80);

export default function Plant() {
  const pathname = usePathname();
  const sourceMap = useTexture(ASSETS.ASSETS.TEXTURES.BRANCH);

  const map = useMemo(() => {
    const tex = sourceMap.clone();
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.needsUpdate = true;
    return tex;
  }, [sourceMap]);

  useEffect(() => {
    return () => map.dispose();
  }, [map]);

  const visibleShaderRef = useRef(null);
  const depthShaderRef = useRef(null);
  const meshRef = useRef();
  const targetPositionRef = useRef(DEFAULT_POSITION.clone());
  const targetRotationZRef = useRef(DEFAULT_ROTATION_Z);

  useEffect(() => {
    targetPositionRef.current.copy(pathname === '/Service' ? SERVICE_POSITION : DEFAULT_POSITION);
    targetRotationZRef.current = pathname === '/Service' ? SERVICE_ROTATION_Z : DEFAULT_ROTATION_Z;
  }, [pathname]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;

    if (meshRef.current) {
      meshRef.current.position.lerp(targetPositionRef.current, 0.08);
      meshRef.current.rotation.z = THREE.MathUtils.lerp(
        meshRef.current.rotation.z,
        targetRotationZRef.current,
        0.08
      );
    }

    if (visibleShaderRef.current) {
      visibleShaderRef.current.uniforms.uTime.value = t;
    }
    if (depthShaderRef.current) {
      depthShaderRef.current.uniforms.uTime.value = t;
    }
  });

  // Visible material — just needs to show the alpha-clipped silhouette
  const onBeforeCompile = useCallback((shader) => {
    shader.uniforms.uTime = { value: 0 };
    visibleShaderRef.current = shader;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>',      VERT_UNIFORMS)
      .replace('#include <begin_vertex>', VERT_DISPLACEMENT);
  }, []);

  // Depth (shadow) material — must replicate the exact same displacement
  const customDepthMaterial = useMemo(() => {
    const mat = new THREE.MeshDepthMaterial({
      depthPacking: THREE.RGBADepthPacking,
      alphaTest: 0.6,
      alphaMap: map,
    });
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = { value: 0 };
      depthShaderRef.current = shader;
      shader.uniforms.uShadowOpacity = { value: 0.65 };
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>',      VERT_UNIFORMS)
        .replace('#include <begin_vertex>', VERT_DISPLACEMENT);
      // Bayer 4x4 ordered dither — discard N% of shadow pixels to make shadow lighter.
      // Only affects this mesh's shadow. Shape unchanged. Tune threshold: 0=full, 1=none.
      shader.fragmentShader = shader.fragmentShader
        .replace('void main() {', `
          uniform float uShadowOpacity;
          float _b2(vec2 v) { return mod(3.0*v.y + 2.0*v.x, 4.0); }
          float _b4(vec2 v) {
            vec2 p1 = mod(v, 2.0); vec2 p2 = mod(floor(0.5*v), 2.0);
            return (4.0*_b2(p1) + _b2(p2)) / 16.0;
          }
          void main() {`)
        .replace('#include <alphatest_fragment>', `
          #include <alphatest_fragment>
          if (_b4(floor(mod(gl_FragCoord.xy, 4.0))) >= uShadowOpacity) discard;
        `);
    };
    return mat;
  }, [map]);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    mesh.customDepthMaterial = customDepthMaterial;

    return () => {
      mesh.customDepthMaterial = null;
      customDepthMaterial.dispose();
      depthShaderRef.current = null;
      visibleShaderRef.current = null;
    };
  }, [customDepthMaterial]);

  return (
    <>
      <mesh
        ref={meshRef}
        castShadow
        position={[DEFAULT_POSITION.x, DEFAULT_POSITION.y, DEFAULT_POSITION.z]}
        scale={1.9}
        rotation-z={DEFAULT_ROTATION_Z}
      >
        <planeGeometry args={[1, 1]} />
        <meshStandardMaterial
          onBeforeCompile={onBeforeCompile}
          alphaMap={map}
          alphaTest={0.5}
          side={THREE.DoubleSide}
          transparent={false}
        />
      </mesh>
    </>
  );
}