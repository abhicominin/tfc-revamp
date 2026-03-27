import { forwardRef, useLayoutEffect, useEffect, useRef } from "react";
import { OrthographicCamera } from "@react-three/drei";
import { useThree, useFrame } from "@react-three/fiber";
import { useSpring } from "@react-spring/three";
import { usePathname } from "next/navigation";

import useSceneStore from "../scenestore";

const FRUSTUM = 3.5;
const PROJECT_PATH = '/Project';
const HOVER_ZOOM_OFFSET = 0.27;

const CAMERA_CONFIG = {
    '/':         { zoom: 2.9, lookAt: [-0.1, 0, 0] },
    '/About':    { zoom: 2.9, lookAt: [-0.1, 0, 0] },
    '/Project':  { zoom: 5.0, lookAt: [-0.1, 0.258, 0] },
    '/Contacts': { zoom: 3.4, lookAt: [-0.1, 0.15, 0] },
    '/Service':  { zoom: 11, lookAt: [2.0, 0, 2.0] },
};

const DEFAULT_CONFIG = CAMERA_CONFIG['/'];

const SPRING_CONFIG = { mass: 1, tension: 120, friction: 30 };

function getCameraConfig(pathname) {
    return CAMERA_CONFIG[pathname] ?? DEFAULT_CONFIG;
}

function toSpringTarget(config) {
    return {
        zoom: config.zoom,
        lx: config.lookAt[0],
        ly: config.lookAt[1],
        lz: config.lookAt[2],
    };
}

const Camera = forwardRef(({ transitionSpring }, ref) => {
    const { size } = useThree();
    const pathname = usePathname();
    const prevPathnameRef = useRef(pathname);
    const hasProjectTransition = Boolean(transitionSpring?.progress);
    const groupHovered = useSceneStore((state) => state.groupHovered);

    // Snapshot of camera state when a /Project transition begins — used as lerp "from"
    const transitionFromRef = useRef(toSpringTarget(DEFAULT_CONFIG));

    const [spring, api] = useSpring(() => {
        const cfg = getCameraConfig(pathname);
        return {
            ...toSpringTarget(cfg),
            config: SPRING_CONFIG,
        };
    });

    const [hoverSpring, hoverApi] = useSpring(() => ({
        hoverOffset: 0,
        config: { tension: 90, friction: 22 },
    }));

    useEffect(() => {
        const prev = prevPathnameRef.current;
        prevPathnameRef.current = pathname;
        const cfg = getCameraConfig(pathname);
        const enteringProject = pathname === PROJECT_PATH;
        const leavingProject = prev === PROJECT_PATH;

        if (enteringProject && hasProjectTransition) {
            // Freeze spring here; transitionSpring drives zoom in useFrame
            transitionFromRef.current = {
                zoom: spring.zoom.get(),
                lx:   spring.lx.get(),
                ly:   spring.ly.get(),
                lz:   spring.lz.get(),
            };
            return;
        }

        if (leavingProject && hasProjectTransition) {
            // Warp spring to where the camera actually was so departure animates from the right place
            api.set(toSpringTarget(getCameraConfig(PROJECT_PATH)));
        }

        api.start(toSpringTarget(cfg));
    }, [pathname, api, spring, hasProjectTransition]);

    useEffect(() => {
        hoverApi.start({ hoverOffset: groupHovered ? HOVER_ZOOM_OFFSET : 0 });
    }, [groupHovered, hoverApi]);

    // Rebuild frustum planes on viewport resize
    useLayoutEffect(() => {
        if (!ref.current) return;
        const aspect = size.width / size.height;
        ref.current.left   = -FRUSTUM * aspect;
        ref.current.right  =  FRUSTUM * aspect;
        ref.current.top    =  FRUSTUM;
        ref.current.bottom = -FRUSTUM;
        ref.current.updateProjectionMatrix();
    }, [ref, size]);

    useFrame(() => {
        if (!ref.current) return;

        let baseZoom;

        if (pathname === PROJECT_PATH && hasProjectTransition) {
            // Lerp camera in lockstep with the portal shader transition
            const p = Math.min(Math.max(transitionSpring.progress.get(), 0), 1);
            const { zoom: fz, lx: flx, ly: fly, lz: flz } = transitionFromRef.current;
            const tc = getCameraConfig(PROJECT_PATH);
            baseZoom = fz + (tc.zoom - fz) * p;
            ref.current.lookAt(
                flx + (tc.lookAt[0] - flx) * p,
                fly + (tc.lookAt[1] - fly) * p,
                flz + (tc.lookAt[2] - flz) * p,
            );
        } else {
            baseZoom = spring.zoom.get();
            ref.current.lookAt(spring.lx.get(), spring.ly.get(), spring.lz.get());
        }

        ref.current.zoom = baseZoom + hoverSpring.hoverOffset.get();

        ref.current.updateProjectionMatrix();
    });

    return (
        <OrthographicCamera
            ref={ref}
            makeDefault
            position={[5, 5, 5]}
            near={0.1}
            far={1000}
        />
    );
});

Camera.displayName = 'Camera';

export default Camera;