'use client'
import dynamic from "next/dynamic";

const Scene = dynamic(() => import("../_scene/page"), {
  ssr: false,
  loading: () => <div className="w-full h-screen flex items-center justify-center text-white text-[120px] font-montserrat-medium">Scene is loading...</div>,
});

export default function DynamicScene() {
  return <Scene />;
}