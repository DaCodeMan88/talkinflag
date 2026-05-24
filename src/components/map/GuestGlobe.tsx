"use client";
import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Sphere, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

interface GlobePin {
  lat: number;
  lng: number;
  label: string;
  isPrimary?: boolean;
}

function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

// Country pins — covers hosts, podcast guests, and seeded player countries.
// Coordinates are approximate geographic centers.
const GLOBE_PINS: GlobePin[] = [
  // Hosts
  { lat: 41.9,  lng: 12.5,   label: "Italy (Hosts)",      isPrimary: true },

  // Podcast guest countries & player countries
  { lat: 37.1,  lng: -95.7,  label: "USA" },
  { lat: 23.6,  lng: -102.5, label: "Mexico" },
  { lat: 7.9,   lng: 80.7,   label: "Sri Lanka" },
  { lat: 18.2,  lng: -66.6,  label: "Puerto Rico" },
  { lat: 13.0,  lng: 101.5,  label: "Southeast Asia" },
  { lat: -14.2, lng: -51.9,  label: "Brazil" },
  { lat: 4.6,   lng: -74.1,  label: "Colombia" },
  { lat: 46.2,  lng: 2.2,    label: "France" },
  { lat: 51.2,  lng: 10.5,   label: "Germany" },
  { lat: 36.2,  lng: 138.3,  label: "Japan" },
  { lat: -25.3, lng: 133.8,  label: "Australia" },
  { lat: 9.1,   lng: 8.7,    label: "Nigeria" },
  { lat: 56.1,  lng: -106.3, label: "Canada" },
  { lat: 52.1,  lng: 5.3,    label: "Netherlands" },
  { lat: -38.4, lng: -63.6,  label: "Argentina" },
  { lat: 40.5,  lng: -3.7,   label: "Spain" },
  { lat: 55.4,  lng: -3.4,   label: "UK" },
  { lat: 31.0,  lng: 35.2,   label: "Israel" },
  { lat: 35.9,  lng: 14.4,   label: "Malta" },
];

function GlobeMesh({ pins }: { pins: GlobePin[] }) {
  return (
    <group>
      {/* Base sphere */}
      <Sphere args={[2, 64, 64]}>
        <meshStandardMaterial
          color="#001a0d"
          emissive="#004d1a"
          emissiveIntensity={0.1}
          roughness={0.8}
        />
      </Sphere>
      {/* Wireframe overlay */}
      <Sphere args={[2.01, 32, 32]}>
        <meshBasicMaterial color="#FDDD58" wireframe opacity={0.05} transparent />
      </Sphere>
      {/* Country pins */}
      {pins.map((pin) => {
        const pos = latLngToVector3(pin.lat, pin.lng, 2.1);
        return (
          <mesh key={pin.label} position={pos}>
            <sphereGeometry args={[pin.isPrimary ? 0.09 : 0.05, 8, 8]} />
            <meshBasicMaterial color="#FDDD58" />
          </mesh>
        );
      })}
    </group>
  );
}

export function GuestGlobe() {
  return (
    <div
      className="w-full h-[400px]"
      role="img"
      aria-label={`Interactive globe showing ${GLOBE_PINS.length} countries represented on Talkin Flag`}
    >
      <Canvas camera={{ position: [0, 0, 5] }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <Suspense fallback={null}>
          <GlobeMesh pins={GLOBE_PINS} />
        </Suspense>
        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />
      </Canvas>
    </div>
  );
}
