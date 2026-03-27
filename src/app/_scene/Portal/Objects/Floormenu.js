import { Text } from "@react-three/drei"
import { useRef } from "react"
import { useFrame } from "@react-three/fiber"
import { Color } from "three"

const rubic_config = {
    cube_size: 0.25,
    cube_gap: 0.001,
    cube_radius: 0.01
} 

const MENU_TEXTS = ['ABOUT', 'SERVICES', 'CONTACTS', 'PROJECTS']
const DEFAULT_TEXT_COLOR = new Color('black')
const HOVER_TEXT_COLOR = new Color('red')

export default function FloorMenu() {

    const groupRef = useRef()
    const materialsRef = useRef([])  

    const handlePointerEnter = (event) => {
        const material = event.object.material
        material.userData.targetColor = HOVER_TEXT_COLOR
    }

    const handlePointerLeave = (event) => {
        const material = event.object.material
        material.userData.targetColor = DEFAULT_TEXT_COLOR
    }

    useFrame(() => {
        materialsRef.current.forEach((material) => {
            if (!material) return

            if (!material.userData.targetColor) {
                material.userData.targetColor = DEFAULT_TEXT_COLOR
            }

            material.color.lerp(material.userData.targetColor, 0.12)
        })
    })

    return(
        <>
          <group
            ref={groupRef}
            position={[rubic_config.cube_size * 2.79, 0.01, rubic_config.cube_size * 2.79]}
            rotation-x={-Math.PI / 2}
        >
            {MENU_TEXTS.map((text, index) => (
                <Text
                    key={text}
                    position={[0, index * -0.1, 0]}
                    font='/Fonts/FuturaCyrillicMedium.ttf'
                    fontSize={0.08}
                    anchorX='left'
                    anchorY='top'
                    onPointerEnter={handlePointerEnter}
                    onPointerLeave={handlePointerLeave}
                >
                    {text}
                    <meshBasicMaterial
                        ref={el => materialsRef.current[index] = el}
                        color={'black'}
                        transparent
                        toneMapped={false}
                    />
                </Text>
            ))}
        </group>
        </>
    )

}