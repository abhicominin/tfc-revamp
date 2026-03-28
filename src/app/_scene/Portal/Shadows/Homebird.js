import { useGLTF, useAnimations } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import { useEffect, useRef, useState } from "react"
import { LoopOnce, MathUtils } from "three"
import { usePathname } from "next/navigation"
import * as THREE from "three"
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { ASSETS } from "@/app/asset"

const DEFAULT_SHADOW_OPACITY = 1

export default function StaticBird(){
    const { scene: rawScene, animations } = useGLTF(ASSETS.ASSETS.MODELS.BIRD)
    const pathname = usePathname()
    const [scene] = useState(() => SkeletonUtils.clone(rawScene))
    const { mixer, actions } = useAnimations(animations, scene)
    const visibleMaterialsRef = useRef([])
    const depthMaterialsRef = useRef([])

    useFrame(() => {
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
    })

    useEffect(() => {
     if (!mixer || !actions) return

     const anims = [
         actions["Bird|Bird|idle_A1"],
         actions["Bird|Bird|idle_A2"]
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
             }
         })
     }
    }, [actions, mixer, scene])

    return(
      <>
        <primitive
         position={[0.38, 0.105, -5.0]}
         rotation={[0, MathUtils.degToRad(80), 0]}
         scale={0.55}
         object={scene}
        />
      </>
    )
}