'use client'
import PageWrap from "../_helpers/pagewrapper";
import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import Panel from "./_Panel/page";
import Footer from "./_Footer/page";
import useSceneStore from "../_scene/scenestore";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export default function Service() {

  const containerRef = useRef(null);
  const footerSectionRef = useRef(null);
  const setServicePageScrollOffset = useSceneStore((state) => state.setServicePageScrollOffset);

  useGSAP(() => {

    const sections = Array.from(containerRef.current?.querySelectorAll("section") ?? []);
    if (!sections.length) return;

    // Skip first section — it's already in view at page load
    sections.slice(1).forEach((section) => {
      gsap.fromTo(section,
        { opacity: 0, filter: "blur(10px)" },
        {
          opacity: 1,
          filter: "blur(0px)",
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top 90%",
            end: "top 40%",
            scrub: 0.6,
          },
        }
      );
    });

    // Drive the camera reverse-animation as user scrolls through the footer section
    if (footerSectionRef.current) {
      ScrollTrigger.create({
        trigger: footerSectionRef.current,
        start: "top bottom",
        end: "bottom bottom",
        onUpdate: (self) => setServicePageScrollOffset(self.progress),
        onLeaveBack: () => setServicePageScrollOffset(0),
        onLeave: () => setServicePageScrollOffset(1),
      });
    }

    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
      setServicePageScrollOffset(0);
    };

  }, { scope: containerRef });


  return (
    <>
      <PageWrap>
        <main ref={containerRef} className="w-full flex flex-col items-center pointer-events-auto">
          <section className="w-full h-[100vh] flex flex-col justify-center items-center gap-8">

          </section>
          <section className="w-full h-[100vh] flex flex-col justify-center items-center gap-8">
          </section>
          <section className="w-full h-[100vh] flex flex-col justify-center items-center gap-8">
          </section>
          <section className="w-full h-[100vh] flex flex-col justify-center items-center gap-8">
            <Panel />
          </section>
          <section className="w-full h-[100vh] flex flex-col justify-center items-center gap-8">
          </section>
          <section ref={footerSectionRef} className="w-full h-[100vh] flex flex-col justify-center items-center gap-8">
            <Footer />
          </section>
         </main>
       </PageWrap>
    </>
  );}