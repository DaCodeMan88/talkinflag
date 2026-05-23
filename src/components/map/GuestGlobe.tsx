"use client";
import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Sphere, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

interface GlobePin {
  lat: number;
  lng: number;
  label: string;
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

const GUEST_PINS: GlobePin[] = [
  { lat: 41.9, lng: 12.5, label: "Italy (Hosts)" },
  { lat: 7.9, lng: 80.7, label: "Sri Lanka" },
  { lat: 18.2, lng: -66.6, label: "Puerto Rico" },
  { lat: 13.0, lng: 101.5, label: "Southeast Asia" },
  { lat: 37.9, lng: -95.7, label: "USA" },
  { lat: 23.6, lng: -102.5, label: "Mexico" },
];

function GlobeMesh({ pins }: { pins: GlobePin[] }) {
  return (
    <group>
      <Sphere args={[2, 64, 64]}>
        <meshStandardMaterial
          color="#001a0d"
          emissive="#004d1a"
          emissiveIntensity={0.1}
          roughness={0.8}
        />
      </Sphere>
      <Sphere args={[2.01, 32, 32]}>
        <meshBasicMaterial color="#FDDD58" wireframe opacity={0.05} transparent />
      </Sphere>
      {pins.map((pin) => {
        const pos = latLngToVector3(pin.lat, pin.lng, 2.1);
        return (
          <mesh key={pin.label} position={pos}>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshBasicMaterial color="#FDDD58" />
          </mesh>
        );
      })}
    </group>
  );
}

export function GuestGlobe() {
  return (
    <div className="w-full h-[400px]" role="img" aria-label="Interactive globe showing countries represented on Talkin Flag">
      <Canvas camera={{ position: [0, 0, 5] }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <Suspense fallback={null}>
          <GlobeMesh pins={GUEST_PINS} />
        </Suspense>
        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />
      </Canvas>
    </div>
  );
}
