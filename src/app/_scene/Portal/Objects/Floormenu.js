import { Text } from "@react-three/drei"
import { useRouter, usePathname } from "next/navigation"
import { useRef, useEffect } from "react"
import { useFrame } from "@react-three/fiber"
import { Color } from "three"

import useSceneStore from "../../scenestore"

const links = [
    { label: "ABOUT", href: "/About", name: "About" },
    { label: "SERVICES", href: "/Service", name: "Service" },
    { label: "CONTACTS", href: "/Contacts", name: "Contact" },
    { label: "PROJECTS", href: "/Project", name: "Project" },
]

const rubic_config = {
    cube_size: 0.25,
    cube_gap: 0.001,
    cube_radius: 0.01
} 

const DEFAULT_TEXT_COLOR = new Color('black')
const HOVER_TEXT_COLOR = new Color('red')
const VISIBLE_OPACITY = 1
const HIDDEN_OPACITY = 0
const INTERACTION_OPACITY_THRESHOLD = 0.35

const PATH_VISIBILITY = {
    '/': 'all',
    '/Project': 'none',
    '/Contacts': 'none',
    '/About': 'none',
    '/Service': 'only-service',
}

function getTargetOpacity(pathname, linkHref) {
    const rule = PATH_VISIBILITY[pathname] ?? 'all'

    if (rule === 'all') return VISIBLE_OPACITY
    if (rule === 'none') return HIDDEN_OPACITY
    if (rule === 'only-service') return linkHref === '/Service' ? VISIBLE_OPACITY : HIDDEN_OPACITY

    return VISIBLE_OPACITY
}

function isInteractive(material) {
    return material && material.opacity > INTERACTION_OPACITY_THRESHOLD
}

export default function FloorMenu() {

    const groupRef = useRef()
    const materialsRef = useRef([])
    const textRefs = useRef([])
    const whooshRef = useRef(null)
    const router = useRouter();
    const pathname = usePathname()
    const setTextHovered = useSceneStore((state) => state.setTextHovered)
    const setGroupHovered = useSceneStore((state) => state.setGroupHovered)
    const setMenutextClicked = useSceneStore((state) => state.setMenutextClicked)
    const servicePageScrollOffset = useSceneStore((state) => state.servicePageScrollOffset)

    const handlePointerEnter = (event, link) => {
        const material = event.object.material
        if (!isInteractive(material)) return
        material.userData.targetColor = HOVER_TEXT_COLOR
        setTextHovered(link.href)
    }

    const handlePointerLeave = (event) => {
        const material = event.object.material
        if (!material) return
        material.userData.targetColor = DEFAULT_TEXT_COLOR
        setTextHovered(null)
    }

    const handleClick = (event, link) => {
        const material = event.object.material
        if (!isInteractive(material)) return
        router.push(link.href)
        setMenutextClicked(link.href)
    }

    useEffect(() => {
        return () => {
            if (whooshRef.current) {
                whooshRef.current.pause()
                whooshRef.current.src = ''
                whooshRef.current = null
            }
        }
    }, [])

    useFrame(() => {
        materialsRef.current.forEach((material, index) => {
            if (!material) return

            const link = links[index]
            if (!link) return

            if (!material.userData.targetColor) {
                material.userData.targetColor = DEFAULT_TEXT_COLOR
            }
            if (material.userData.targetOpacity == null) {
                material.userData.targetOpacity = getTargetOpacity(pathname, link.href)
                material.opacity = material.userData.targetOpacity
            }

            material.userData.targetOpacity = getTargetOpacity(pathname, link.href)
            // On /Service, fade out as user scrolls into footer
            if (pathname === '/Service' && link.href === '/Service') {
                material.userData.targetOpacity = Math.max(0, 1 - servicePageScrollOffset)
            }
            material.color.lerp(material.userData.targetColor, 0.12)
            material.opacity += (material.userData.targetOpacity - material.opacity) * 0.12
        })

        const targetScale = pathname === '/Service' ? 1.8 - 0.8 * servicePageScrollOffset : 1.0
        textRefs.current.forEach((mesh) => {
            if (!mesh) return
            mesh.scale.x += (targetScale - mesh.scale.x) * 0.1
            mesh.scale.y += (targetScale - mesh.scale.y) * 0.1
        })
    })

    return(
        <>
          <group
            ref={groupRef}
            position={[rubic_config.cube_size * 2.79, 0.01, rubic_config.cube_size * 2.79]}
            rotation-x={-Math.PI / 2}
            onPointerEnter={(event) => {
                if (materialsRef.current.some(m => m && m.opacity > INTERACTION_OPACITY_THRESHOLD)) {
                    setGroupHovered(true)
                    if (!whooshRef.current) whooshRef.current = new Audio('/Audio/whoosh.mp3')
                    whooshRef.current.volume = 0.04    
                    whooshRef.current.currentTime = 0
                    whooshRef.current.play().catch(() => {})
                    event.stopPropagation()
                }
            }}
            onPointerLeave={() => setGroupHovered(false)}
        >
            {links.map((link, index) => (
                <Text
                    key={link.label}
                    ref={el => textRefs.current[index] = el}
                    position={[0, index * -0.1, 0]}
                    font='/Fonts/FuturaCyrillicMedium.ttf'
                    fontSize={0.08}
                    anchorX='left'
                    anchorY='top'
                    onPointerEnter={(e) => handlePointerEnter(e, link)}
                    onPointerLeave={handlePointerLeave}
                    onClick={(event) => handleClick(event, link)}
                >
                    {link.label}
                    <meshBasicMaterial
                        ref={el => materialsRef.current[index] = el}
                        color={'black'}
                        transparent
                        opacity={1}
                        toneMapped={false}
                    />
                </Text>
            ))}
        </group>
        </>
    )

}