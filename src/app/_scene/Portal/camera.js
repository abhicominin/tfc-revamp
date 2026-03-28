import { forwardRef, useLayoutEffect, useEffect, useRef } from "react";
import { OrthographicCamera } from "@react-three/drei";
import { useThree, useFrame } from "@react-three/fiber";
import { useSpring } from "@react-spring/three";
import { usePathname } from "next/navigation";

import useSceneStore from "../scenestore";

const FRUSTUM = 3.5;
const PROJECT_PATH = '/Project';
const HOVER_ZOOM_OFFSET = 0.27;
const DEFAULT_POSITION = [5, 5, 5];

const CAMERA_CONFIG = {
    '/':         { zoom: 2.9, lookAt: [-0.1, 0, 0], position: DEFAULT_POSITION },
    '/About':    { zoom: 2.9, lookAt: [-0.1, 0, 0], position: DEFAULT_POSITION },
    '/Project':  { zoom: 5.0, lookAt: [-0.1, 0.258, 0], position: [4.35, 4.7, 4.35] },
    '/Contacts': { zoom: 3.4, lookAt: [-0.1, 0.15, 0], position: [4.8, 5.05, 4.8] },
    '/Service':  { zoom: 11, lookAt: [0.85, -3.0, 0.6], position: [0.85, 2.0, 1.0] },
};

const DEFAULT_CONFIG = CAMERA_CONFIG['/'];

const SPRING_CONFIG = { mass: 1, tension: 120, friction: 30 };

function getCameraConfig(pathname) {
    return CAMERA_CONFIG[pathname] ?? DEFAULT_CONFIG;
}

function toSpringTarget(config) {
    const position = config.position ?? DEFAULT_POSITION;
    return {
        zoom: config.zoom,
        lx: config.lookAt[0],
        ly: config.lookAt[1],
        lz: config.lookAt[2],
        px: position[0],
        py: position[1],
        pz: position[2],
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
                px:   spring.px.get(),
                py:   spring.py.get(),
                pz:   spring.pz.get(),
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
        let baseX;
        let baseY;
        let baseZ;
        let lookX;
        let lookY;
        let lookZ;

        if (pathname === PROJECT_PATH && hasProjectTransition) {
            // Lerp camera in lockstep with the portal shader transition
            const p = Math.min(Math.max(transitionSpring.progress.get(), 0), 1);
            const { zoom: fz, lx: flx, ly: fly, lz: flz, px: fpx, py: fpy, pz: fpz } = transitionFromRef.current;
            const tc = getCameraConfig(PROJECT_PATH);
            baseZoom = fz + (tc.zoom - fz) * p;
            baseX = fpx + (tc.position[0] - fpx) * p;
            baseY = fpy + (tc.position[1] - fpy) * p;
            baseZ = fpz + (tc.position[2] - fpz) * p;
            lookX = flx + (tc.lookAt[0] - flx) * p;
            lookY = fly + (tc.lookAt[1] - fly) * p;
            lookZ = flz + (tc.lookAt[2] - flz) * p;
        } else {
            baseZoom = spring.zoom.get();
            baseX = spring.px.get();
            baseY = spring.py.get();
            baseZ = spring.pz.get();
            lookX = spring.lx.get();
            lookY = spring.ly.get();
            lookZ = spring.lz.get();
        }

        ref.current.position.set(baseX, baseY, baseZ);
        ref.current.lookAt(lookX, lookY, lookZ);
        ref.current.zoom = baseZoom + hoverSpring.hoverOffset.get();

        ref.current.updateProjectionMatrix();
    });

    return (
        <OrthographicCamera
            ref={ref}
            makeDefault
            position={DEFAULT_POSITION}
            near={0.1}
            far={1000}
        />
    );
});

Camera.displayName = 'Camera';

export default Camera;