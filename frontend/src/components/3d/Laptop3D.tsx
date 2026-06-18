'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, RoundedBox, Environment } from '@react-three/drei';
import * as THREE from 'three';

// Laptop base and screen
function Laptop() {
  const laptopRef = useRef<THREE.Group>(null);
  const screenRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (laptopRef.current) {
      laptopRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
      laptopRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
    }
    // Animate screen glow
    if (screenRef.current) {
      const material = screenRef.current.material as THREE.MeshStandardMaterial;
      material.emissiveIntensity = 0.3 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
      <group ref={laptopRef} rotation={[0.1, -0.3, 0]}>
        {/* Screen */}
        <group position={[0, 0.65, -0.4]} rotation={[-0.2, 0, 0]}>
          {/* Screen frame */}
          <RoundedBox args={[1.8, 1.1, 0.05]} radius={0.02}>
            <meshStandardMaterial color="#1a1a2e" metalness={0.8} roughness={0.2} />
          </RoundedBox>
          {/* Screen display with animated gradient */}
          <mesh ref={screenRef} position={[0, 0, 0.03]}>
            <planeGeometry args={[1.6, 0.95]} />
            <meshStandardMaterial 
              color="#1a1025" 
              emissive="#8b5cf6" 
              emissiveIntensity={0.3}
            />
          </mesh>
          {/* Code lines visualization (simple rectangles) */}
          <group position={[-0.5, 0.25, 0.04]}>
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <mesh key={i} position={[Math.random() * 0.2, -i * 0.1, 0]}>
                <planeGeometry args={[0.3 + Math.random() * 0.5, 0.04]} />
                <meshBasicMaterial 
                  color={i === 0 ? '#a78bfa' : i === 3 ? '#34d399' : '#64748b'} 
                  transparent 
                  opacity={0.8} 
                />
              </mesh>
            ))}
          </group>
          {/* Screen glow */}
          <pointLight position={[0, 0, 0.5]} intensity={0.5} color="#8b5cf6" distance={2} />
        </group>

        {/* Keyboard base */}
        <RoundedBox args={[1.9, 0.08, 1.2]} radius={0.02} position={[0, 0, 0]}>
          <meshStandardMaterial color="#1a1a2e" metalness={0.9} roughness={0.1} />
        </RoundedBox>

        {/* Keyboard keys area */}
        <mesh position={[0, 0.045, 0.1]}>
          <planeGeometry args={[1.5, 0.8]} />
          <meshStandardMaterial color="#252540" metalness={0.5} roughness={0.5} />
        </mesh>

        {/* Trackpad */}
        <RoundedBox args={[0.5, 0.01, 0.35]} radius={0.01} position={[0, 0.045, 0.55]}>
          <meshStandardMaterial color="#2a2a4a" metalness={0.7} roughness={0.3} />
        </RoundedBox>
      </group>
    </Float>
  );
}

// Floating particles
function Particles({ count = 100 }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const position = new THREE.Vector3(
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10
      );
      const scale = Math.random() * 0.02 + 0.01;
      temp.push({ position, scale });
    }
    return temp;
  }, [count]);

  useFrame((state) => {
    if (mesh.current) {
      particles.forEach((particle, i) => {
        const matrix = new THREE.Matrix4();
        const newY = particle.position.y + Math.sin(state.clock.elapsedTime + i) * 0.002;
        matrix.setPosition(particle.position.x, newY, particle.position.z);
        matrix.scale(new THREE.Vector3(particle.scale, particle.scale, particle.scale));
        mesh.current!.setMatrixAt(i, matrix);
      });
      mesh.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial color="#8b5cf6" transparent opacity={0.6} />
    </instancedMesh>
  );
}

// Main 3D Scene
function Scene() {
  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 5, 5]} intensity={1} color="#ffffff" />
      <pointLight position={[-5, 5, -5]} intensity={0.5} color="#8b5cf6" />
      <pointLight position={[5, -5, 5]} intensity={0.3} color="#ec4899" />
      
      <Laptop />
      <Particles count={50} />
      
      <Environment preset="city" />
    </>
  );
}

// Exported component
export default function Laptop3D() {
  return (
    <div className="w-full h-[500px] lg:h-[600px]">
      <Canvas
        camera={{ position: [0, 0.5, 3], fov: 50 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <Scene />
      </Canvas>
    </div>
  );
}
