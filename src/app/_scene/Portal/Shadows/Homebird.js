import { useGLTF, useAnimations } from "@react-three/drei"
import { useEffect, useState } from "react"
import { LoopOnce, MathUtils } from "three"
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { ASSETS } from "@/app/asset"

export default function StaticBird(){
    const { scene: rawScene, animations } = useGLTF(ASSETS.ASSETS.MODELS.BIRD)
    const [scene] = useState(() => SkeletonUtils.clone(rawScene))
    const { mixer, actions } = useAnimations(animations, scene)

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
         }
     })
     
     return () => {
         if (onAnimationEnd) {
             mixer.removeEventListener("finished", onAnimationEnd)
         }
         mixer.stopAllAction()
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