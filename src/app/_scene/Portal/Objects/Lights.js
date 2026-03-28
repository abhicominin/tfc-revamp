import {
    DoubleSide,
    MathUtils,
    RepeatWrapping,
    RGBAFormat,
    ShaderMaterial,
    Vector3,
    WebGLRenderTarget,
} from "three"
import { Environment, SpotLight } from "@react-three/drei"
import { useRef, useEffect, useLayoutEffect, useMemo } from "react"
import { useFrame } from "@react-three/fiber"
import { FullScreenQuad } from "three-stdlib"
import { usePathname } from "next/navigation"
import { ASSETS } from "@/app/asset"

import Curtain from "../Shadows/Homecurtain"
import Plant from "../Shadows/Homebranch"
import StaticBird from "../Shadows/Homebird"

function SpotLightShadowWithUniform({
    spotlightRef,
    debug = false,
    scale = 1,
    distance = 0.4,
    alphaTest = 0.5,
    map,
    shader,
    width = 512,
    height = 512,
    defaultFragColorValue = 1.0,
    transitionSpeed = 0.001,
}) {
    const meshRef = useRef()
    const shadowDirection = useMemo(() => new Vector3(), [])
    const shadowPosition = useMemo(() => new Vector3(), [])

    const uniformsRef = useRef({
        uShadowMap: { value: map },
        uTime: { value: 0 },
        uDefaultFragColorValue: { value: defaultFragColorValue },
    })

    const renderTarget = useMemo(
        () =>
            new WebGLRenderTarget(width, height, {
                format: RGBAFormat,
                stencilBuffer: false,
            }),
        [width, height]
    )

    const fsQuad = useMemo(
        () =>
            new FullScreenQuad(
                new ShaderMaterial({
                    uniforms: uniformsRef.current,
                    vertexShader: /* glsl */ `
                    varying vec2 vUv;

                    void main() {
                        vUv = uv;
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                    `,
                    fragmentShader: shader,
                })
            ),
        [shader]
    )

    useLayoutEffect(() => {
        if (!spotlightRef?.current) return

        spotlightRef.current.shadow.mapSize.set(width, height)
        spotlightRef.current.shadow.needsUpdate = true
    }, [spotlightRef, width, height])

    useEffect(() => {
        uniformsRef.current.uShadowMap.value = map
    }, [map])

    useEffect(() => {
        // Keep initial sync when route changes before first frame tick.
        uniformsRef.current.uDefaultFragColorValue.value = defaultFragColorValue
    }, [defaultFragColorValue])

    useEffect(() => {
        return () => {
            fsQuad.material.dispose()
            fsQuad.dispose()
        }
    }, [fsQuad])

    useEffect(() => {
        return () => {
            renderTarget.dispose()
        }
    }, [renderTarget])

    useFrame((_, dt) => {
        uniformsRef.current.uTime.value += dt

        const currentValue = uniformsRef.current.uDefaultFragColorValue.value
        const lerpFactor = 1 - Math.exp(-transitionSpeed * dt)
        uniformsRef.current.uDefaultFragColorValue.value = MathUtils.lerp(
            currentValue,
            defaultFragColorValue,
            lerpFactor
        )

        if (!spotlightRef?.current || !meshRef.current) return

        const lightPosition = spotlightRef.current.position
        const targetPosition = spotlightRef.current.target.position

        shadowDirection.copy(targetPosition).sub(lightPosition)
        const targetDistance = shadowDirection.length()
        shadowDirection.normalize().multiplyScalar(targetDistance * distance)
        shadowPosition.copy(lightPosition).add(shadowDirection)

        meshRef.current.position.copy(shadowPosition)
        meshRef.current.lookAt(targetPosition)
    })

    useFrame(({ gl }) => {
        gl.setRenderTarget(renderTarget)
        fsQuad.render(gl)
        gl.setRenderTarget(null)
    })

    return (
        <mesh ref={meshRef} scale={scale} castShadow>
            <planeGeometry />
            <meshBasicMaterial
                transparent
                side={DoubleSide}
                alphaTest={alphaTest}
                alphaMap={renderTarget.texture}
                alphaMap-wrapS={RepeatWrapping}
                alphaMap-wrapT={RepeatWrapping}
                opacity={debug ? 1 : 0}
            />
        </mesh>
    )
}

export default function Environments()
{
    const pathname = usePathname()
    const spotLightRef = useRef()
    const shadowGroupRef = useRef()

    const defaultFragColorValue = pathname === "/Contacts" ? 0.0 : 1.0;

    useEffect(() => {
      if (!spotLightRef.current || !shadowGroupRef.current) return

      // Get world position of the spotlight
      const worldPosition = new Vector3()
      spotLightRef.current.getWorldPosition(worldPosition)

      spotLightRef.current.getWorldPosition(shadowGroupRef.current.position)
      shadowGroupRef.current.position.multiplyScalar(0.3)
      shadowGroupRef.current.lookAt(0, 0, 0)
    }, [])

    return(
        <>
         <Environment
            files={ASSETS.ASSETS.TEXTURES.ENV}
            environmentIntensity={0.8}
         />

         <ambientLight intensity={0.4} color="#bdedff"/>

         <group ref={shadowGroupRef}>
            <Curtain/>
            <Plant/>
            <StaticBird/>
         </group>

         <SpotLight
           ref={spotLightRef}
           position={[5,15,0]}
           intensity={3600}
           penumbra={1.2}
           angle={MathUtils.degToRad(8)}
           color={"#ffffff"}
           attenuation={17}
           distance={21}
           debug={false}
           volumetric={false}
           opacity={1}
          >
            <SpotLightShadowWithUniform
              spotlightRef={spotLightRef}
              debug={false}
              scale={3.4}
              distance={0.65}
              width={2048}
              height={2048}
              defaultFragColorValue={defaultFragColorValue}
              transitionSpeed={0.001}
              shader={
              /* glsl */ `
               varying vec2 vUv;
   
               uniform float uTime;
               uniform float uDefaultFragColorValue;
   
               float bayerDither2x2( vec2 v ) {
                   return mod( 3.0 * v.y + 2.0 * v.x, 4.0 );
               }
           
               float bayerDither4x4( vec2 v ) {
                   vec2 P1 = mod( v, 2.0 );
                   vec2 P2 = mod( floor( 0.5  * v ), 2.0 );
                   return 4.0 * bayerDither2x2( P1 ) + bayerDither2x2( P2 );
               }
   
               float sdfRect(vec2 p, vec2 size) {
                   vec2 d = abs(p) - size;
                   return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
               }
   
               vec2 rotateVec2(vec2 v, vec2 origin, float angle) {
                   float s = sin(angle);
                   float c = cos(angle);
                   vec2 translated = v - origin;
                   vec2 rotated = vec2(translated.x * c - translated.y * s, translated.x * s + translated.y * c);
                   return rotated + origin;
               }
               
               void main() {
                   vec2 uv = vUv * 2.0 - 1.0;
   
                   float box1 = sdfRect(uv, vec2(0.5, 0.60));
                   box1 = smoothstep(0.0, 0.0, box1);
   
                   float box2 = sdfRect(uv + vec2(-0.1, 0.0), vec2(0.03, 0.8));
                   box2 = smoothstep(0.0, 0.0, box2);
   
                   float box3 = sdfRect(uv + vec2(0.0, -0.0), vec2(1.3, 0.02));
                   box3 = smoothstep(0.0, 0.0, box3);
   
                   float box4 = sdfRect(uv + vec2(0.4, 0.0), vec2(0.04, 0.6));
                   box4 = smoothstep(0.0, 0.01, box4);
   
                   float glass = sdfRect(uv + vec2(0.0, 0.5), vec2(0.5, 0.6));
                   glass = smoothstep(0.0, 0.01, glass) * 0.5;
   
                   float box5 = sdfRect(uv + vec2(-0.4, -0.2), vec2(0.01, 0.4));
                   box5 = smoothstep(0.0, 0.01, box5);
   
                   float shadow = (1.0 - ((box3 * box2) - box1));
   
                   if( ( bayerDither4x4( floor( mod( gl_FragCoord.xy, 4.0 ) ) ) ) / 16.0 >= shadow ) discard;
                   gl_FragColor = vec4(vec3(uDefaultFragColorValue), 1.0);
               }
               `
               }
            />

         </SpotLight>


        </>
    )
}