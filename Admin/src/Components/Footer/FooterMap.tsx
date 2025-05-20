import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { gsap } from 'gsap';

const offices = [
  {
    name: 'New York Office',
    coordinates: [40.7128, -74.0060],
    address: '123 Tech Avenue, NY 10001'
  },
  {
    name: 'India Office',
    coordinates: [28.6139, 77.2090],
    address: '456 Tech Park, Delhi 110001'
  }
];

export const OfficeMap = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Initialize map
    const map = L.map(mapRef.current, {
      center: [20, 0],
      zoom: 2,
      scrollWheelZoom: false
    });

    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Custom marker icon
    const icon = L.divIcon({
      className: 'custom-marker',
      html: '<div class="marker-pulse"></div>',
      iconSize: [20, 20]
    });

    // Add markers for each office
    offices.forEach(office => {
      const marker = L.marker(office.coordinates as [number, number], { icon })
        .addTo(map)
        .bindPopup(`
          <div class="p-2">
            <h3 class="font-bold">${office.name}</h3>
            <p>${office.address}</p>
          </div>
        `);

      markersRef.current.push(marker);
    });

    // Animate markers
    const pulseMarkers = () => {
      gsap.to('.marker-pulse', {
        scale: 1.5,
        opacity: 0,
        duration: 1.5,
        repeat: -1,
        ease: 'power2.out'
      });
    };

    pulseMarkers();

    // Draw connection line between offices
    const lineCoordinates = offices.map(office => office.coordinates);
    const connectionLine = L.polyline(lineCoordinates as [number, number][], {
      color: '#1E3A8A',
      weight: 2,
      opacity: 0.6,
      dashArray: '5, 10'
    }).addTo(map);

    // Animate connection line
    gsap.from(connectionLine.getElement(), {
      strokeDashoffset: 1000,
      duration: 2,
      ease: 'power2.out'
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div ref={mapRef} className="h-[300px] rounded-xl overflow-hidden" />
  );
};
