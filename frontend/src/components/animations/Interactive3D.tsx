'use client';

import { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, useTexture, Environment, MeshDistortMaterial, Sphere } from '@react-three/drei';
import * as THREE from 'three';

// Interactive floating sphere
function InteractiveSphere({ 
  color = '#8b5cf6',
  distort = 0.4,
  speed = 2,
}: { 
  color?: string;
  distort?: number;
  speed?: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.2;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.3;
    }
  });

  return (
    <Float speed={speed} rotationIntensity={0.5} floatIntensity={1}>
      <Sphere
        ref={meshRef}
        args={[1, 64, 64]}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        scale={hovered ? 1.1 : 1}
      >
        <MeshDistortMaterial
          color={color}
          envMapIntensity={1}
          clearcoat={1}
          clearcoatRoughness={0}
          metalness={0.5}
          distort={hovered ? distort * 1.5 : distort}
          speed={speed}
        />
      </Sphere>
    </Float>
  );
}

// Floating torus knot
function FloatingTorusKnot({ color = '#ec4899' }: { color?: string }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.3;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.2;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={1} floatIntensity={0.5}>
      <mesh ref={meshRef}>
        <torusKnotGeometry args={[0.8, 0.2, 128, 32]} />
        <meshStandardMaterial
          color={color}
          metalness={0.8}
          roughness={0.2}
          emissive={color}
          emissiveIntensity={0.2}
        />
      </mesh>
    </Float>
  );
}

// Geometric shapes floating
function GeometricShapes() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.1;
    }
  });

  const shapes = [
    { position: [2, 1, 0] as [number, number, number], geometry: 'box', color: '#8b5cf6' },
    { position: [-2, -1, 1] as [number, number, number], geometry: 'octahedron', color: '#ec4899' },
    { position: [0, 2, -1] as [number, number, number], geometry: 'dodecahedron', color: '#06b6d4' },
    { position: [-1.5, 0.5, 2] as [number, number, number], geometry: 'icosahedron', color: '#10b981' },
    { position: [1.5, -1.5, -0.5] as [number, number, number], geometry: 'tetrahedron', color: '#f59e0b' },
  ];

  return (
    <group ref={groupRef}>
      {shapes.map((shape, i) => (
        <Float key={i} speed={2 + i * 0.5} rotationIntensity={1} floatIntensity={0.5}>
          <mesh position={shape.position} scale={0.3}>
            {shape.geometry === 'box' && <boxGeometry args={[1, 1, 1]} />}
            {shape.geometry === 'octahedron' && <octahedronGeometry args={[1]} />}
            {shape.geometry === 'dodecahedron' && <dodecahedronGeometry args={[1]} />}
            {shape.geometry === 'icosahedron' && <icosahedronGeometry args={[1]} />}
            {shape.geometry === 'tetrahedron' && <tetrahedronGeometry args={[1]} />}
            <meshStandardMaterial
              color={shape.color}
              metalness={0.5}
              roughness={0.3}
              transparent
              opacity={0.8}
            />
          </mesh>
        </Float>
      ))}
    </group>
  );
}

// 3D Text (without external fonts)
function FloatingRing({ color = '#8b5cf6', radius = 1.5 }: { color?: string; radius?: number }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime) * 0.3;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.5;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <mesh ref={meshRef}>
        <torusGeometry args={[radius, 0.05, 16, 100]} />
        <meshStandardMaterial
          color={color}
          metalness={1}
          roughness={0}
          emissive={color}
          emissiveIntensity={0.5}
        />
      </mesh>
    </Float>
  );
}

// Mouse-following light
function MouseLight() {
  const lightRef = useRef<THREE.PointLight>(null);
  const { viewport } = useThree();

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (lightRef.current) {
        const x = (e.clientX / window.innerWidth - 0.5) * viewport.width;
        const y = -(e.clientY / window.innerHeight - 0.5) * viewport.height;
        lightRef.current.position.set(x, y, 2);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [viewport]);

  return <pointLight ref={lightRef} intensity={1} color="#8b5cf6" distance={5} />;
}

// Scene setup
function Scene({ variant }: { variant: string }) {
  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
      <MouseLight />

      {variant === 'sphere' && <InteractiveSphere />}
      {variant === 'torus' && <FloatingTorusKnot />}
      {variant === 'geometric' && <GeometricShapes />}
      {variant === 'ring' && (
        <>
          <FloatingRing color="#8b5cf6" radius={1.5} />
          <FloatingRing color="#ec4899" radius={1.2} />
          <FloatingRing color="#06b6d4" radius={0.9} />
        </>
      )}

      <Environment preset="city" />
    </>
  );
}

// Exported component
export function Interactive3D({
  className = '',
  variant = 'sphere',
  height = 400,
}: {
  className?: string;
  variant?: 'sphere' | 'torus' | 'geometric' | 'ring';
  height?: number;
}) {
  return (
    <div className={className} style={{ height }}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <Scene variant={variant} />
      </Canvas>
    </div>
  );
}

// Floating orbs background
export function FloatingOrbs({
  className = '',
  count = 5,
}: {
  className?: string;
  count?: number;
}) {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {[...Array(count)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full animate-float"
          style={{
            width: 100 + Math.random() * 200,
            height: 100 + Math.random() * 200,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            background: `radial-gradient(circle, ${
              ['rgba(139, 92, 246, 0.3)', 'rgba(236, 72, 153, 0.3)', 'rgba(6, 182, 212, 0.3)'][i % 3]
            } 0%, transparent 70%)`,
            filter: 'blur(40px)',
            animationDelay: `${i * 2}s`,
            animationDuration: `${10 + Math.random() * 10}s`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          25% {
            transform: translate(30px, -30px) scale(1.1);
          }
          50% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          75% {
            transform: translate(20px, 30px) scale(1.05);
          }
        }
        .animate-float {
          animation: float 15s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
