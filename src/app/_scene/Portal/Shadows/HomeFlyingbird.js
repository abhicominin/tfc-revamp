import { useGLTF, useAnimations } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import { useEffect, useRef, useState, useMemo } from "react"
import { LoopOnce, MathUtils } from "three"
import { usePathname } from "next/navigation"
import * as THREE from "three"
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { ASSETS } from "@/app/asset"

const DEFAULT_SHADOW_OPACITY = 1

// Scratch objects reused every frame — avoids per-frame GC allocations
const _scratchMatrix = new THREE.Matrix4()
const _scratchQuat = new THREE.Quaternion()

// Constant correction quaternions — pre-computed once at module load
const _correctionQuat = new THREE.Quaternion().setFromEuler(
    new THREE.Euler(
        MathUtils.degToRad(100) + MathUtils.degToRad(-50),
        Math.PI / 2              + MathUtils.degToRad(-10),
        -MathUtils.degToRad(90)  + MathUtils.degToRad(50)
    )
)
const _reverseCorrectionQuat = new THREE.Quaternion().setFromEuler(
    new THREE.Euler(0, Math.PI, 0)
)

function createFlightCurveService() {
    const curve = new THREE.Curve()
    const radius = 0.2
    const height = 1.0
    const matrix = new THREE.Matrix4()
    const euler = new THREE.Euler(
        MathUtils.degToRad(250),
        MathUtils.degToRad(0),
        MathUtils.degToRad(70)
    )
    
    matrix.makeRotationFromEuler(euler)
    matrix.setPosition(new THREE.Vector3(0.85, -0.25, 0.0))
    matrix.scale(new THREE.Vector3(0.5, 0.5, -5))
    
    curve.getPoint = (t, target = new THREE.Vector3()) => {
        const angle = t * Math.PI * 0.5
        const x = radius * Math.cos(angle)
        const y = height * Math.sin(angle)
        const z = radius * Math.sin(angle)
        return target.set(x, y, z).applyMatrix4(matrix)
    }
    
    const path = new THREE.CurvePath()
    path.add(curve)
    path.frames = path.computeFrenetFrames(200, true)
    return path
}

function createFlightCurve() {
    const curve = new THREE.Curve()
    const radius = 1.0
    const height = 1.0
    const matrix = new THREE.Matrix4()
    const euler = new THREE.Euler(
        MathUtils.degToRad(180),
        MathUtils.degToRad(0),
        MathUtils.degToRad(100)
    )
    
    matrix.makeRotationFromEuler(euler)
    matrix.setPosition(new THREE.Vector3(1.45, 1.35, 0.0))
    matrix.scale(new THREE.Vector3(2.5, 2.5, -2.0))
    
    curve.getPoint = (t, target = new THREE.Vector3()) => {
        const angle = t * Math.PI * 0.5
        const x = radius * Math.cos(angle)
        const y = height * Math.sin(angle)
        const z = radius * Math.sin(angle)
        return target.set(x, y, z).applyMatrix4(matrix)
    }
    
    const path = new THREE.CurvePath()
    path.add(curve)
    path.frames = path.computeFrenetFrames(200, true)
    return path
}

function FlightPath({ curve }) {
    const line = useMemo(() => {
        const points = []
        const divisions = 300
        
        for (let i = 0; i <= divisions; i++) {
            points.push(curve.getPoint(i / divisions))
        }
        
        const geometry = new THREE.BufferGeometry().setFromPoints(points)
        const material = new THREE.LineBasicMaterial({ color: 0xffffff })
        const line = new THREE.Line(geometry, material)
        line.visible = true
        return line
    }, [curve])

    useEffect(() => {
        return () => {
            line.geometry.dispose()
            line.material.dispose()
        }
    }, [line])
    
    return <primitive object={line}/>
}



export default function FlyingBird(){
    const { scene: rawScene, animations } = useGLTF(ASSETS.ASSETS.MODELS.BIRD)
    const pathname = usePathname()
    const [scene] = useState(() => SkeletonUtils.clone(rawScene))
    const { mixer, actions } = useAnimations(animations, scene)
    const visibleMaterialsRef = useRef([])
    const depthMaterialsRef = useRef([])

    const flightCurve = useMemo(() => {
        if (pathname === '/Service') {
            return createFlightCurveService()
        }
        return createFlightCurve()
    }, [pathname])
    const birdRef = useRef(null)
    const sRef = useRef({ progress: 0, returning: false, waitTimer: 0 })
    const positionRef = useRef(new THREE.Vector3())

    // Reset flight state whenever the curve switches (pathname change)
    useEffect(() => {
        sRef.current.progress = 0
        sRef.current.returning = false
        sRef.current.waitTimer = 0
    }, [flightCurve])

    useFrame((state, delta) => {
        const targetOpacity = pathname === '/Contacts' ? 0 : 1

        visibleMaterialsRef.current.forEach(({ material, defaultOpacity }) => {
            material.opacity = THREE.MathUtils.lerp(material.opacity, targetOpacity * defaultOpacity, 0.08)
        })

        depthMaterialsRef.current.forEach((depthMaterial) => {
            const shader = depthMaterial.userData.shader
            if (!shader) return
            const targetShadowOpacity = pathname === '/Contacts' ? 0 : DEFAULT_SHADOW_OPACITY
            shader.uniforms.uShadowOpacity.value = THREE.MathUtils.lerp(
                shader.uniforms.uShadowOpacity.value,
                targetShadowOpacity,
                0.08
            )
        })

        // Bird flight along curve
        const s = sRef.current
        const speed = 0.002
        const pauseDuration = 3
        // Clamp delta to prevent large jumps after tab blur/focus
        const dt = Math.min(delta, 0.1)

        if (s.waitTimer > 0) {
            s.waitTimer -= dt
        } else if (!s.returning) {
            s.progress += speed
            if (s.progress >= 1) { s.progress = 1; s.returning = true; s.waitTimer = pauseDuration }
        } else {
            s.progress -= speed
            if (s.progress <= 0) { s.progress = 0; s.returning = false; s.waitTimer = pauseDuration }
        }

        if (birdRef.current) {
            const t = Math.max(0, Math.min(1, s.progress))
            flightCurve.getPoint(t, positionRef.current)
            birdRef.current.position.copy(positionRef.current)

            const frameCount = flightCurve.frames.tangents.length
            const idx = Math.min(Math.floor(t * (frameCount - 1)), frameCount - 1)
            const tangent = flightCurve.frames.tangents[idx]
            const normal = flightCurve.frames.normals[idx]
            const binormal = flightCurve.frames.binormals[idx]

            // Reuse scratch objects — no per-frame allocation
            _scratchMatrix.makeBasis(tangent, normal, binormal)
            _scratchQuat.setFromRotationMatrix(_scratchMatrix)
            _scratchQuat.multiply(_correctionQuat)

            if (s.returning) {
                _scratchQuat.multiply(_reverseCorrectionQuat)
            }

            birdRef.current.quaternion.slerp(_scratchQuat, 0.4)
        }
    })

    useEffect(() => {
     if (!mixer || !actions) return

     const anims = [
         actions["Bird|Bird|fly_A1"],
         actions["Bird|Bird|fly_A2"]
     ]

     const currentAnim = anims[0]
     let previousAnim = currentAnim
     let onAnimationEnd
     
     if(currentAnim) {
         onAnimationEnd = () => {
             const nextAnim = anims[(anims.indexOf(previousAnim) + 1) % anims.length]
             if(nextAnim) {
                 previousAnim.stop()
                 previousAnim = nextAnim
                 nextAnim.setLoop(LoopOnce, 0)
                 nextAnim.clampWhenFinished = true
                 nextAnim.reset()
                 nextAnim.play()
             }
         }
         
         mixer.addEventListener("finished", onAnimationEnd)
         currentAnim.setLoop(LoopOnce, 0)
         currentAnim.clampWhenFinished = true
         currentAnim.play()
     }
     
     scene.traverse((child) => {
         if(child.isMesh) {
             child.castShadow = true

             const materials = Array.isArray(child.material) ? child.material : [child.material]
             const clonedMaterials = materials.map((material) => {
                 const cloned = material.clone()
                 cloned.transparent = true
                 visibleMaterialsRef.current.push({
                     material: cloned,
                     defaultOpacity: cloned.opacity ?? 1,
                 })
                 return cloned
             })

             child.material = Array.isArray(child.material) ? clonedMaterials : clonedMaterials[0]

             const depthMaterial = new THREE.MeshDepthMaterial({
                 depthPacking: THREE.RGBADepthPacking,
             })

             depthMaterial.onBeforeCompile = (shader) => {
                 shader.uniforms.uShadowOpacity = { value: DEFAULT_SHADOW_OPACITY }
                depthMaterial.userData.shader = shader
                 shader.fragmentShader = shader.fragmentShader
                     .replace(
                         'void main() {',
                         `uniform float uShadowOpacity;
                          float bayerDither2x2(vec2 v){ return mod(3.0*v.y + 2.0*v.x, 4.0); }
                          float bayerDither8x8(vec2 v){
                            vec2 P1 = mod(v, 2.0);
                            vec2 P2 = mod(floor(0.5*v), 2.0);
                            vec2 P3 = mod(floor(0.25*v), 2.0);
                            return (16.0*bayerDither2x2(P1) + 4.0*bayerDither2x2(P2) + bayerDither2x2(P3)) / 64.0;
                          }
                          void main() {`
                     )
                     .replace(
                         '#include <alphatest_fragment>',
                         `#include <alphatest_fragment>
                          if (bayerDither8x8(floor(mod(gl_FragCoord.xy, 8.0))) >= uShadowOpacity) discard;`
                     )

             }

             depthMaterialsRef.current.push(depthMaterial)
             child.customDepthMaterial = depthMaterial
         }
     })
     
     return () => {
         if (onAnimationEnd) {
             mixer.removeEventListener("finished", onAnimationEnd)
         }
         mixer.stopAllAction()

         visibleMaterialsRef.current.forEach(({ material }) => material.dispose())
         visibleMaterialsRef.current = []

         depthMaterialsRef.current.forEach((material) => {
             material.userData.shader = null
             material.dispose()
         })
         depthMaterialsRef.current = []

         scene.traverse((child) => {
             if (child.isMesh) {
                 child.customDepthMaterial = null
                 child.geometry?.dispose()
             }
         })
     }
    }, [actions, mixer, scene])

    return(
      <>
        <primitive
         ref={birdRef}
         scale={pathname === '/Service' ? 0.2 : 0.55}
         object={scene}
        />

        <FlightPath curve={flightCurve} />
      </>
    )
}