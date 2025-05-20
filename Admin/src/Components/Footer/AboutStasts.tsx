import React from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
 

gsap.registerPlugin(ScrollTrigger);

export interface StatProps {
  number: number | string;
  label: string;
  sign?: string;
}

export const Stat: React.FC<StatProps> = ({ number, label, sign }) => (
  <div className=" flex flex-col justify-center items-center text-left">
    <div className="flex items-center justify-center">
      {typeof number === "number" ? (
         <></>
      ) : (
        <div className="text-2xl md:text-4xl font-bold text-primary-blue mb-2">
          {number}
        </div>
      )}
      <div className="text-2xl md:text-4xl font-bold text-primary-blue mb-2">
        {sign}
      </div>
    </div>

    <div
      className={`text-gray-600 self-center text-center flex items-center justify-center  ${
        label.length > 20 ? "w-[80%]" : "w-full"
      }`}
    >
      {label}
    </div>
  </div>
);

export const AboutStats = () => {
  const containerRef = React.useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const stats = containerRef.current?.querySelectorAll(".stat-item");

      stats?.forEach((stat) => {
        gsap.from(stat, {
          scrollTrigger: {
            trigger: stat,
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
          y: 50,
          opacity: 0,
          duration: 1,
          ease: "power3.out",
        });
      });
    },
    { scope: containerRef }
  );

  return (
    <div
      ref={containerRef}
      className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto mt-16"
    >
      <div className="stat-item">
        <Stat number={280} sign={"+"} label="Clients Served" />
      </div>
      <div className="stat-item">
        <Stat number={95} sign="%" label="Client Retention" />
      </div>
      <div className="stat-item">
        <Stat number={18} sign="+" label="Years Experience" />
      </div>
      <div className="stat-item">
        <Stat number={50} sign="+" label="Expert Consultants" />
      </div>
    </div>
  );
};
