import * as THREE from 'three';

// Create a complex, long, winding 3D track
const createTrackCurve = () => {
  const points: THREE.Vector3[] = [];
  
  // 1. The Launch Pad (Straight & Up)
  points.push(new THREE.Vector3(0, 50, 0));
  points.push(new THREE.Vector3(0, 50, 100));
  points.push(new THREE.Vector3(0, 80, 200));
  
  // 2. The First Spiral Drop
  for (let i = 0; i < 12; i++) {
    const angle = i * 0.6;
    const radius = 60;
    const x = Math.sin(angle) * radius;
    const z = 200 + i * 25 + Math.cos(angle) * 30;
    const y = 80 - i * 5; // Drop down
    points.push(new THREE.Vector3(x, y, z));
  }

  // 3. The Canyon Run (Winding Low)
  let currentZ = 600;
  for (let i = 0; i < 10; i++) {
    points.push(new THREE.Vector3(
      Math.sin(i) * 80,
      20 + Math.sin(i * 2) * 10, // Wavy height
      currentZ + i * 80
    ));
  }
  currentZ += 800;

  // 4. The "Space Jump" (Huge Climb then Drop)
  points.push(new THREE.Vector3(100, 100, currentZ));
  points.push(new THREE.Vector3(0, 250, currentZ + 300)); // Peak
  points.push(new THREE.Vector3(-100, 100, currentZ + 600)); // Bottom of drop

  currentZ += 600;

  // 5. The Hyper Loop (Wide High Speed Turn)
  for (let i = 0; i < 15; i++) {
    const angle = i * 0.4;
    const radius = 150;
    points.push(new THREE.Vector3(
      Math.cos(angle) * radius - 100,
      100 - i * 2,
      currentZ + Math.sin(angle) * radius
    ));
  }
  
  currentZ += 500; // Estimated from loop

  // 6. The Final Straight (Dash to finish)
  points.push(new THREE.Vector3(0, 20, currentZ + 200));
  points.push(new THREE.Vector3(0, 0, currentZ + 800)); // Finish at Y=0
  points.push(new THREE.Vector3(0, 0, currentZ + 1000)); // Runoff area

  return new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.1); // 0.1 tension for smoother curves
};

export const trackCurve = createTrackCurve();
export const TOTAL_TRACK_LENGTH = trackCurve.getLength();

// Helper to get position and tangent for physics
export const getTrackStateAtDistance = (distance: number) => {
  const t = Math.min(Math.max(distance / TOTAL_TRACK_LENGTH, 0), 1);
  const position = trackCurve.getPointAt(t);
  const tangent = trackCurve.getTangentAt(t).normalize();
  
  return { position, tangent, t };
};
