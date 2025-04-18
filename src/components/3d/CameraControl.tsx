'use client';

import { useRef, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';

type CameraViewType = 'overhead' | 'isometric' | 'first-person';
type PerformanceLevel = 'high' | 'medium' | 'low';

interface CameraControlProps {
  cameraView: CameraViewType;
  performance: PerformanceLevel;
}

export function CameraControl({ cameraView, performance }: CameraControlProps) {
  const { camera } = useThree();
  const controlsRef = useRef(null);

  // Configure camera position based on view type
  useEffect(() => {
    if (!camera) return;

    switch (cameraView) {
      case 'overhead':
        camera.position.set(0, 100, 0);
        camera.lookAt(0, 0, 0);
        break;
      case 'isometric':
        camera.position.set(80, 80, 80);
        camera.lookAt(0, 0, 0);
        break;
      case 'first-person':
        camera.position.set(5, 2, 5);
        camera.lookAt(10, 2, 10);
        break;
    }
  }, [camera, cameraView]);

  return (
    <>
      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.1}
        rotateSpeed={0.5}
        maxPolarAngle={Math.PI / 2 - 0.1} // Prevent going below ground
        minDistance={5}
        maxDistance={200}
        enableZoom={true}
        enablePan={true}
        target={[0, 0, 0]}
      />
    </>
  );
} 