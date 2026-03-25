'use client'
import dynamic from "next/dynamic";

const Scene = dynamic(() => import("../_scene/page"), {
  ssr: false,
  loading: () => null, // Don't render anything while loading the scene
});

export default function DynamicScene() {
  return <Scene />;
}