import { useRef } from "react";
import { motion } from "@/lib/motion";
import DottedMap from "dotted-map";

interface MapProps {
  dots?: Array<{
    start: { lat: number; lng: number; label?: string };
    end: { lat: number; lng: number; label?: string };
  }>;
  lineColor?: string;
  className?: string;
  highlightedCountries?: Array<{
    name: string;
    coordinates: Array<[number, number]>;
    flag?: string;
  }>;
}

export default function WorldMap({
  dots = [],
  lineColor = "orange",
  className = "",
  highlightedCountries = [
    {
      name: "USA",
      coordinates: [
        [20.730610, -78.935242], // Center point
      ],
      flag: "🇺🇸"
    },
    {
      name: "India",
      coordinates: [
        [7.02579 , 72.58727], // Center point
      ],
      flag: "🇮🇳"
    }
  ]
}: MapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const map = new DottedMap({ height: 120, grid: "diagonal" });

  const svgMap = map.getSVG({
    radius: 0.22,
    color: "#898989",
    shape: "circle",
    backgroundColor: "transparent",
  });

  const projectPoint = (lat: number, lng: number) => {
    const x = (lng + 180) * (800 / 360);
    const y = (90 - lat) * (400 / 180);
    return { x, y };
  };

  const createCurvedPath = (
    start: { x: number; y: number },
    end: { x: number; y: number }
  ) => {
    const midX = (start.x + end.x) / 2;
    const midY = Math.min(start.y, end.y) - 50;
    return `M ${start.x} ${start.y} Q ${midX} ${midY} ${end.x} ${end.y}`;
  };

  return (
    <div className={`w-full aspect-[2/1] relative font-sans perspective-1000 ${className}`}>
      <div className="absolute inset-0 transform-style-preserve-3d rotate-x-12 hover:rotate-x-0 transition-transform duration-1000">
      <img
        src={`data:image/svg+xml;utf8,${encodeURIComponent(svgMap)}`}
        className="h-full w-full [mask-image:linear-gradient(to_bottom,transparent,white_20%,white_80%,transparent)] pointer-events-none select-none opacity-50 transform-style-preserve-3d"
        alt="world map"
        height="495"
        width="1056"
        draggable={false}
      />
      <svg
        ref={svgRef}
        viewBox="0 0 800 400"
        className="w-full h-full absolute inset-0 pointer-events-none select-none transform-style-preserve-3d"
      >
        {dots.map((dot, i) => {
          const startPoint = projectPoint(dot.start.lat, dot.start.lng);
          const endPoint = projectPoint(dot.end.lat, dot.end.lng);
          return (
            <g key={`path-group-${i}`}>
              <motion.path
                d={createCurvedPath(startPoint, endPoint)}
                fill="none"
                stroke="url(#path-gradient)"
                strokeWidth="1"
                initial={{
                  pathLength: 0,
                }}
                animate={{
                  pathLength: 1,
                }}
                transition={{
                  duration: 1,
                  delay: 0.5 * i,
                  ease: "easeOut",
                }}
                key={`start-upper-${i}`}
              ></motion.path>
            </g>
          );
        })}

        <defs>
          <linearGradient id="path-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="white" stopOpacity="0" />
            <stop offset="5%" stopColor={lineColor} stopOpacity="1" />
            <stop offset="95%" stopColor={lineColor} stopOpacity="1" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
        </defs>

        {dots.map((dot, i) => (
          <g key={`points-group-${i}`}>
            <g key={`start-${i}`}>
              <circle
                cx={projectPoint(dot.start.lat, dot.start.lng).x}
                cy={projectPoint(dot.start.lat, dot.start.lng).y}
                r="2"
                fill={lineColor}
              />
              <circle
                cx={projectPoint(dot.start.lat, dot.start.lng).x}
                cy={projectPoint(dot.start.lat, dot.start.lng).y}
                r="2"
                fill={lineColor}
                opacity="0.5"
              >
                <animate
                  attributeName="r"
                  from="2"
                  to="8"
                  dur="1.5s"
                  begin="0s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  from="0.5"
                  to="0"
                  dur="1.5s"
                  begin="0s"
                  repeatCount="indefinite"
                />
              </circle>
            </g>
            <g key={`end-${i}`}>
              <circle
                cx={projectPoint(dot.end.lat, dot.end.lng).x}
                cy={projectPoint(dot.end.lat, dot.end.lng).y}
                r="2"
                fill={lineColor}
              />
              <circle
                cx={projectPoint(dot.end.lat, dot.end.lng).x}
                cy={projectPoint(dot.end.lat, dot.end.lng).y}
                r="2"
                fill={lineColor}
                opacity="0.5"
              >
                <animate
                  attributeName="r"
                  from="2"
                  to="8"
                  dur="1.5s"
                  begin="0s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  from="0.5"
                  to="0"
                  dur="1.5s"
                  begin="0s"
                  repeatCount="indefinite"
                />
              </circle>
            </g>
          </g>
        ))}

        {/* Add highlighted countries */}
        {highlightedCountries.map((country, i) => (
          <g key={`country-${i}`}>
            {country.coordinates.map((coord, j) => (
              <g key={`country-marker-${j}`}>
                {/* Pulsing circle */}
                <circle
                  cx={projectPoint(coord[0], coord[1]).x}
                  cy={projectPoint(coord[0], coord[1]).y}
                  r="15"
                  fill={lineColor}
                  opacity="0.15"
                >
                  <animate
                    attributeName="r"
                    values="15;20;15"
                    dur="3s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.15;0.25;0.15"
                    dur="3s"
                    repeatCount="indefinite"
                  />
                </circle>

                {/* Location marker */}
                <path
                  d={`M ${projectPoint(coord[0], coord[1]).x} ${projectPoint(coord[0], coord[1]).y - 20}
                     l -6 -12 a 6 6 0 1 1 12 0 z`}
                  fill={lineColor}
                  opacity="0.9"
                >
                  <animate
                    attributeName="opacity"
                    values="0.9;1;0.9"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                </path>

                {/* Flag and label */}
                <foreignObject
                  x={projectPoint(coord[0], coord[1]).x - 20}
                  y={projectPoint(coord[0], coord[1]).y - 45}
                  width="40"
                  height="20"
                >
                  <div className="flex items-center justify-center text-lg">
                    {country.flag}
                  </div>
                </foreignObject>
                <text
                  x={projectPoint(coord[0], coord[1]).x}
                  y={projectPoint(coord[0], coord[1]).y + 20}
                  textAnchor="middle"
                  fill="white"
                  fontSize="12"
                  fontWeight="bold"
                >
                  {country.name}
                </text>
              </g>
            ))}
          </g>
        ))}
      </svg>
      </div>
    </div>
  );
}

