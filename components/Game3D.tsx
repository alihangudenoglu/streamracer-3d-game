import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text, PerspectiveCamera, Stars, Environment, Trail, Float } from '@react-three/drei';
import * as THREE from 'three';
import { Player, GameState } from '../types';
import { trackCurve, getTrackStateAtDistance } from '../utils/trackUtils';
import { TRACK_WIDTH, TUBE_SEGMENTS, RAIL_HEIGHT } from '../constants';

// Augment React's JSX namespace
declare global {
  namespace JSX {
    interface IntrinsicElements {
      group: any;
      mesh: any;
      sphereGeometry: any;
      meshStandardMaterial: any;
      planeGeometry: any;
      meshBasicMaterial: any;
      ambientLight: any;
      directionalLight: any;
      pointLight: any;
      tubeGeometry: any;
      torusGeometry: any;
      extrudeGeometry: any;
      fog: any;
      instancedMesh: any;
      dodecahedronGeometry: any;
      color: any;
    }
  }

  // Also augment React.JSX for newer TypeScript/React versions where JSX is namespaced under React
  namespace React {
    namespace JSX {
      interface IntrinsicElements {
        group: any;
        mesh: any;
        sphereGeometry: any;
        meshStandardMaterial: any;
        planeGeometry: any;
        meshBasicMaterial: any;
        ambientLight: any;
        directionalLight: any;
        pointLight: any;
        tubeGeometry: any;
        torusGeometry: any;
        extrudeGeometry: any;
        fog: any;
        instancedMesh: any;
        dodecahedronGeometry: any;
        color: any;
      }
    }
  }
}

interface Game3DProps {
  players: Player[];
  gameState: GameState;
  cameraTargetId: string | null;
}

interface MarbleProps {
  player: Player;
}

const Marble: React.FC<MarbleProps> = ({ player }) => {
  const meshRef = useRef<THREE.Group>(null);
  const ballRef = useRef<THREE.Mesh>(null);
  
  useFrame(() => {
    if (meshRef.current) {
      const { position, tangent } = getTrackStateAtDistance(player.distance);
      
      const worldUp = new THREE.Vector3(0, 1, 0);
      const right = new THREE.Vector3().crossVectors(tangent, worldUp).normalize();
      if (right.lengthSq() < 0.01) right.set(1, 0, 0);
      
      const normal = new THREE.Vector3().crossVectors(right, tangent).normalize();

      // Position Logic:
      // 1. Start at curve spine
      // 2. Move Left/Right (Lane Offset)
      // 3. Move UP (Road Thickness + Ball Radius)
      const roadThickness = 1; // From Extrude Settings
      const ballRadius = 0.8;
      const surfaceHeight = roadThickness + ballRadius;

      // Clamping lane offset to keep inside rails
      const maxLane = TRACK_WIDTH - 1.5; 
      const clampedOffset = Math.max(-maxLane, Math.min(maxLane, player.laneOffset));

      const finalPos = position.clone()
        .add(right.multiplyScalar(clampedOffset))
        .add(normal.multiplyScalar(surfaceHeight));

      meshRef.current.position.lerp(finalPos, 0.2);
      
      const lookTarget = finalPos.clone().add(tangent);
      meshRef.current.lookAt(lookTarget);
      
      // Ball Rotation visual
      if (ballRef.current) {
         ballRef.current.rotation.x -= player.velocity * 2;
      }
    }
  });

  return (
    <group ref={meshRef}>
      {/* Name Tag */}
      <Text
        position={[0, 3, 0]}
        fontSize={1}
        color="white"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.05}
        outlineColor="black"
        billboard
      >
        {player.name}
      </Text>
      
      {/* The Ball with Trail */}
      <group position={[0, 0, 0]}>
        <Trail
          width={1.5} // Width of the trail
          length={8} // Length of the trail
          color={new THREE.Color(player.color).multiplyScalar(1.5)} // Boosted color
          attenuation={(t) => t * t}
        >
          <mesh ref={ballRef} castShadow receiveShadow>
            <sphereGeometry args={[0.8, 32, 32]} />
            <meshStandardMaterial 
              color={player.color} 
              emissive={player.color}
              emissiveIntensity={0.5}
              metalness={0.8} 
              roughness={0.1} 
            />
          </mesh>
        </Trail>
      </group>
    </group>
  );
};

const Track = () => {
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    const w = TRACK_WIDTH;
    const h = 0.5; // Road bed thickness
    const r = RAIL_HEIGHT; 

    // Draw Road Profile (Cross-section)
    shape.moveTo(-w, h); // Top Left
    shape.lineTo(-w, h + r); // Rail Up
    shape.lineTo(-w - 0.5, h + r); // Rail Out
    shape.lineTo(-w - 0.5, -h); // Bottom Left
    shape.lineTo(w + 0.5, -h); // Bottom Right
    shape.lineTo(w + 0.5, h + r); // Rail Out Right
    shape.lineTo(w, h + r); // Rail Up Right
    shape.lineTo(w, h); // Top Right
    shape.lineTo(-w, h); // Close loop

    const extrudeSettings = {
      steps: TUBE_SEGMENTS,
      bevelEnabled: false,
      extrudePath: trackCurve,
    };

    return new THREE.ExtrudeGeometry(shape, extrudeSettings);
  }, []);

  return (
    <group>
      <mesh geometry={geometry} receiveShadow castShadow>
        <meshStandardMaterial 
          color="#1e1e24" 
          roughness={0.6} 
          metalness={0.8} 
        />
      </mesh>
      
      {/* Center Line Strip using Tube for simplicity/performance */}
      <mesh position={[0, 0.6, 0]}>
        <tubeGeometry args={[trackCurve, TUBE_SEGMENTS, 0.1, 8, false]} />
        <meshBasicMaterial color="#00aaff" />
      </mesh>
    </group>
  );
};

const NeonRings = () => {
  const rings = useMemo(() => {
    const count = 40; // Number of rings along the track
    const items = [];
    const points = trackCurve.getSpacedPoints(count);
    
    for (let i = 1; i < count - 1; i++) {
      const point = points[i];
      const tangent = trackCurve.getTangentAt(i / count);
      const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent);
      
      // Random neon colors
      const colors = ['#ff00ff', '#00ffff', '#ffff00', '#00ff00'];
      const color = colors[i % colors.length];

      items.push(
        <group key={i} position={point} quaternion={quaternion}>
          <mesh>
            <torusGeometry args={[TRACK_WIDTH + 2, 0.3, 16, 32]} />
            <meshStandardMaterial 
              color={color} 
              emissive={color} 
              emissiveIntensity={2} 
              toneMapped={false}
            />
          </mesh>
        </group>
      );
    }
    return items;
  }, []);

  return <group>{rings}</group>;
};

const Particles = () => {
  const count = 200;
  const mesh = useRef<THREE.InstancedMesh>(null);

  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const t = Math.random();
      const pos = trackCurve.getPointAt(t);
      // Offset randomly around the track
      pos.x += (Math.random() - 0.5) * 100;
      pos.y += (Math.random() - 0.5) * 50;
      pos.z += (Math.random() - 0.5) * 100;
      temp.push({ pos, scale: Math.random() * 2 });
    }
    return temp;
  }, []);

  useFrame((state) => {
    if (!mesh.current) return;
    const time = state.clock.getElapsedTime();
    const dummy = new THREE.Object3D();

    particles.forEach((particle, i) => {
      dummy.position.copy(particle.pos);
      dummy.position.y += Math.sin(time * 0.5 + i) * 5; // Floating
      dummy.rotation.x = time * 0.2 + i;
      dummy.rotation.y = time * 0.1 + i;
      dummy.scale.setScalar(particle.scale);
      dummy.updateMatrix();
      mesh.current!.setMatrixAt(i, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
      <dodecahedronGeometry args={[0.5, 0]} />
      <meshBasicMaterial color="#00ffff" transparent opacity={0.6} />
    </instancedMesh>
  );
};

const SceneContent = ({ players, gameState, cameraTargetId }: { players: Player[], gameState: GameState, cameraTargetId: string | null }) => {
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  
  useFrame((state) => {
    if (cameraRef.current && players.length > 0) {
      let targetDistance = 0;
      if (cameraTargetId) {
        const p = players.find(pl => pl.id === cameraTargetId);
        targetDistance = p ? p.distance : 0;
      } else {
        const leader = players.reduce((prev, current) => (prev.distance > current.distance) ? prev : current);
        targetDistance = leader.distance;
      }

      const { position, tangent } = getTrackStateAtDistance(targetDistance);

      // Camera Logic
      const worldUp = new THREE.Vector3(0, 1, 0);
      const right = new THREE.Vector3().crossVectors(tangent, worldUp).normalize();
      if (right.lengthSq() < 0.01) right.set(1, 0, 0);
      const normal = new THREE.Vector3().crossVectors(right, tangent).normalize();

      const camDist = 30; 
      const camHeight = 12; 

      // Look slightly ahead on the track
      const lookAheadDist = 60;
      const { position: lookAtPos } = getTrackStateAtDistance(targetDistance + lookAheadDist);

      const camTargetPos = position.clone()
        .add(normal.clone().multiplyScalar(camHeight))
        .add(tangent.clone().multiplyScalar(-camDist));

      cameraRef.current.position.lerp(camTargetPos, 0.08);
      cameraRef.current.lookAt(lookAtPos);
    }
  });

  return (
    <>
      <PerspectiveCamera makeDefault ref={cameraRef as any} position={[0, 20, 50]} fov={70} near={0.1} far={4000} />
      
      {/* Lighting & Atmosphere */}
      <color attach="background" args={['#050505']} />
      <fog attach="fog" args={['#050505', 50, 900]} /> {/* Deep fog */}
      
      <ambientLight intensity={0.2} />
      <directionalLight position={[100, 200, 100]} intensity={0.5} castShadow />
      
      {/* Neon Glow Lighting */}
      <pointLight position={[0, 500, 0]} intensity={1} color="#ff00aa" distance={1000} />
      
      <Stars radius={300} depth={100} count={5000} factor={4} saturation={1} fade speed={1} />
      <Environment preset="city" />

      <Track />
      <NeonRings />
      <Particles />
      
      {players.map((player) => (
        <Marble key={player.id} player={player} />
      ))}
    </>
  );
};

const Game3D: React.FC<Game3DProps> = ({ players, gameState, cameraTargetId }) => {
  return (
    <div className="w-full h-full absolute top-0 left-0 z-0 bg-gray-900">
      <Canvas shadows dpr={[1, 1.5]} gl={{ antialias: false, toneMapping: THREE.ReinhardToneMapping, toneMappingExposure: 1.5 }}>
        <SceneContent players={players} gameState={gameState} cameraTargetId={cameraTargetId} />
      </Canvas>
    </div>
  );
};

export default Game3D;