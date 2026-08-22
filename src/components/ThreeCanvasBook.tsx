import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, ContactShadows, Text, RoundedBox, Html } from '@react-three/drei';
import * as THREE from 'three';

interface BookMeshProps {
  currentPage: number;
  totalPages: number;
  theme?: 'hh-goa' | 'rose-white';
}

const BookMesh: React.FC<BookMeshProps> = ({ currentPage, totalPages, theme = 'hh-goa' }) => {
  const leftCoverRef = useRef<THREE.Group | null>(null);
  const rightCoverRef = useRef<THREE.Group | null>(null);
  const turningPageRef = useRef<THREE.Group | null>(null);
  const bookGroupRef = useRef<THREE.Group | null>(null);

  const isHHGoa = theme === 'hh-goa';
  const coverColor = isHHGoa ? '#005d37' : '#ec4899';
  const accentColor = isHHGoa ? '#ffe600' : '#ffffff';
  const pageColor = '#faf7f2';

  // Smooth 3D Hover & Gentle Floating Breathing
  useFrame((state) => {
    if (bookGroupRef.current) {
      const mouseX = state.mouse.x * 0.15;
      const mouseY = state.mouse.y * 0.1;
      bookGroupRef.current.rotation.y = THREE.MathUtils.lerp(bookGroupRef.current.rotation.y, mouseX, 0.08);
      bookGroupRef.current.rotation.x = THREE.MathUtils.lerp(bookGroupRef.current.rotation.x, 0.15 - mouseY, 0.08);
    }
  });

  return (
    <group ref={bookGroupRef} position={[0, -0.1, 0]}>
      {/* ── 3D LEATHER / HARDCOVER SPINE ── */}
      <mesh position={[0, 0, -0.05]} castShadow receiveShadow>
        <cylinderGeometry args={[0.22, 0.22, 3.4, 32, 1, false, Math.PI / 2, Math.PI]} />
        <meshStandardMaterial color={coverColor} roughness={0.3} metalness={0.2} />
      </mesh>

      {/* ── LEFT HARDCOVER BASE ── */}
      <group position={[-1.25, 0, -0.04]} rotation={[0, 0.08, 0]}>
        <RoundedBox args={[2.4, 3.4, 0.08]} radius={0.03} smoothness={4} castShadow receiveShadow>
          <meshStandardMaterial color={coverColor} roughness={0.3} metalness={0.15} />
        </RoundedBox>

        {/* Left Stacked Paper Block */}
        <mesh position={[0.08, 0, 0.08]} castShadow receiveShadow>
          <boxGeometry args={[2.2, 3.2, 0.1]} />
          <meshStandardMaterial color={pageColor} roughness={0.8} />
        </mesh>
      </group>

      {/* ── RIGHT HARDCOVER BASE ── */}
      <group position={[1.25, 0, -0.04]} rotation={[0, -0.08, 0]}>
        <RoundedBox args={[2.4, 3.4, 0.08]} radius={0.03} smoothness={4} castShadow receiveShadow>
          <meshStandardMaterial color={coverColor} roughness={0.3} metalness={0.15} />
        </RoundedBox>

        {/* Right Stacked Paper Block */}
        <mesh position={[-0.08, 0, 0.08]} castShadow receiveShadow>
          <boxGeometry args={[2.2, 3.2, 0.1]} />
          <meshStandardMaterial color={pageColor} roughness={0.8} />
        </mesh>
      </group>

      {/* ── 3D GOLDEN BOOKMARK RIBBON ── */}
      <mesh position={[0, -0.4, 0.16]} rotation={[0.2, 0, 0.1]}>
        <planeGeometry args={[0.18, 2.6]} />
        <meshStandardMaterial color={accentColor} roughness={0.2} metalness={0.6} side={THREE.DoubleSide} />
      </mesh>

      {/* ── 3D EMBOSSED COVER TITLE TEXT ── */}
      <Text
        position={[0, 1.45, 0.22]}
        fontSize={0.12}
        color={accentColor}
        anchorX="center"
        anchorY="middle"
        font="https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff"
      >
        JULIE // 3D DOSSIER
      </Text>
    </group>
  );
};

interface ThreeCanvasBookProps {
  currentPage: number;
  totalPages: number;
  theme?: 'hh-goa' | 'rose-white';
}

export const ThreeCanvasBook: React.FC<ThreeCanvasBookProps> = ({
  currentPage,
  totalPages,
  theme = 'hh-goa',
}) => {
  return (
    <div className="w-full h-44 sm:h-52 relative overflow-hidden rounded-2xl">
      <Canvas
        shadows
        camera={{ position: [0, 1.2, 5.2], fov: 42 }}
        className="w-full h-full"
      >
        <ambientLight intensity={0.85} />
        <directionalLight position={[3, 5, 4]} intensity={1.5} castShadow shadow-mapSize={[1024, 1024]} />
        <pointLight position={[-3, 2, 2]} intensity={0.8} color="#ffffff" />

        <Float speed={1.8} rotationIntensity={0.2} floatIntensity={0.3}>
          <BookMesh currentPage={currentPage} totalPages={totalPages} theme={theme} />
        </Float>

        <ContactShadows position={[0, -1.6, 0]} opacity={0.4} scale={9} blur={2.2} far={4} />
      </Canvas>
    </div>
  );
};
