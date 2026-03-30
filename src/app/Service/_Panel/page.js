import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export default function Panel() {

  const containerRef = useRef(null);

  useGSAP(() => {

    const sections = Array.from(containerRef.current?.querySelectorAll("section") ?? []);
    if (!sections.length) return;

    // All columns share the same Y position — animate from the container
    // using a stagger so each column reveals in sequence
    gsap.fromTo(sections,
      { y: 50 },
      {
        y: 0,
        ease: "none",
        stagger: 0.15,
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 80%",
          end: "bottom bottom",
          scrub: true,
        },
      }
    );

  }, { scope: containerRef });


  return (
    <>
        <main ref={containerRef} className="w-full h-full flex flex-col items-stretch pointer-events-auto">
            <div className="basis-1/6 w-full justify-center items-end flex text-[24px] font-montserrat-medium">
               <span>Choose the situation that best describes you.</span>
            </div>
            <div className="flex flex-row basis-5/6 w-full items-center">
             <section className="column-one basis-1/3 h-1/2">
 
             </section>
             <section className="column-two basis-1/3 h-1/2">
 
             </section>
             <section className="column-three basis-1/3 h-1/2">
 
             </section>
            </div>
        </main>
    </>
  );
}