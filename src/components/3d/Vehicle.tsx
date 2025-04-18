'use client';

import { useRef, useMemo } from 'react';
import { Group, Vector3, Color } from 'three';
import { Box, MeshTransmissionMaterial, useFrame } from '@react-three/drei';
import { useAppStore } from '@/store/appStore';

// Különböző járműtípusok támogatása
export type VehicleType = 'car' | 'bus' | 'truck';

// Továbbfejlesztett járművek komponens a 3D városhoz
export function Vehicle({ 
  lane, 
  speed, 
  type = 'car',
  color, 
  performance = 'high'
}: { 
  lane: 'north-south' | 'south-north' | 'east-west' | 'west-east',
  speed: number,
  type?: VehicleType,
  color?: string,
  performance?: 'high' | 'medium' | 'low'
}) {
  const vehicleRef = useRef<Group>(null);
  const { cameraView } = useAppStore();
  
  // Véletlen, de determinisztikus szín generálása, ha nincs megadva
  const vehicleColor = useMemo(() => {
    if (color) return new Color(color);
    
    // Determinisztikus színválasztás a sáv és járműtípus alapján
    const colorSeed = (lane.charCodeAt(0) + lane.charCodeAt(1) + (type === 'car' ? 1 : type === 'bus' ? 2 : 3)) * speed;
    
    // Autók színei
    if (type === 'car') {
      const carColors = [
        '#FF0000', // piros
        '#0000FF', // kék
        '#FFFFFF', // fehér
        '#000000', // fekete
        '#FFFF00', // sárga
        '#00FF00', // zöld
        '#FFA500', // narancssárga
        '#808080', // szürke
        '#800080', // lila
        '#00FFFF', // cián
        '#964B00', // barna
        '#C0C0C0', // ezüst
      ];
      return new Color(carColors[Math.floor(colorSeed) % carColors.length]);
    }
    
    // Buszok színei
    if (type === 'bus') {
      const busColors = [
        '#FFFF00', // sárga
        '#FF0000', // piros
        '#0000FF', // kék
        '#00FF00', // zöld
      ];
      return new Color(busColors[Math.floor(colorSeed) % busColors.length]);
    }
    
    // Teherautók színei
    if (type === 'truck') {
      const truckColors = [
        '#FF0000', // piros
        '#FFFFFF', // fehér
        '#0000FF', // kék
        '#808080', // szürke
      ];
      return new Color(truckColors[Math.floor(colorSeed) % truckColors.length]);
    }
    
    return new Color('#FF0000');
  }, [lane, speed, type, color]);
  
  // Determinisztikus kezdőpozíciók sáv alapján
  const initialPosition = useMemo(() => {
    const laneShift = type === 'car' ? 0 : type === 'bus' ? 0.5 : -0.5;
    
    switch(lane) {
      case 'north-south': return new Vector3(4 + laneShift, 0.5, -150);
      case 'south-north': return new Vector3(-4 - laneShift, 0.5, 150);
      case 'east-west': return new Vector3(-150, 0.5, -4 - laneShift);
      case 'west-east': return new Vector3(150, 0.5, 4 + laneShift);
      default: return new Vector3(0, 0.5, 0);
    }
  }, [lane, type]);
  
  // Jármű dimenzióinak meghatározása típus alapján
  const dimensions = useMemo(() => {
    switch(type) {
      case 'car': return { length: 2, width: 1, height: 0.7 };
      case 'bus': return { length: 4, width: 1.2, height: 1.5 };
      case 'truck': return { length: 3, width: 1.1, height: 1.2 };
      default: return { length: 2, width: 1, height: 0.7 };
    }
  }, [type]);
  
  // Jármű animáció és mozgás
  useFrame((state, delta) => {
    if (!vehicleRef.current) return;
    
    // Alapsebesség + randomizálás (km/h -> egység/s konverzió)
    const adjustedSpeed = speed * (0.05 + Math.sin(state.clock.elapsedTime * 0.1) * 0.01);
    
    // Pozíció mozgatása sáv irányától függően
    switch(lane) {
      case 'north-south':
        vehicleRef.current.position.z += adjustedSpeed;
        if (vehicleRef.current.position.z > 150) {
          vehicleRef.current.position.z = -150;
        }
        break;
      case 'south-north':
        vehicleRef.current.position.z -= adjustedSpeed;
        if (vehicleRef.current.position.z < -150) {
          vehicleRef.current.position.z = 150;
        }
        break;
      case 'east-west':
        vehicleRef.current.position.x += adjustedSpeed;
        if (vehicleRef.current.position.x > 150) {
          vehicleRef.current.position.x = -150;
        }
        break;
      case 'west-east':
        vehicleRef.current.position.x -= adjustedSpeed;
        if (vehicleRef.current.position.x < -150) {
          vehicleRef.current.position.x = 150;
        }
        break;
    }
    
    // Forgás beállítása a sáv alapján
    switch(lane) {
      case 'north-south':
        vehicleRef.current.rotation.y = Math.PI;
        break;
      case 'south-north':
        vehicleRef.current.rotation.y = 0;
        break;
      case 'east-west':
        vehicleRef.current.rotation.y = Math.PI / 2;
        break;
      case 'west-east':
        vehicleRef.current.rotation.y = -Math.PI / 2;
        break;
    }
    
    // Optimalizálás: járművek LOD kezelése a kameranézet alapján
    if (cameraView === 'overhead' && vehicleRef.current) {
      const distanceFromCamera = state.camera.position.distanceTo(vehicleRef.current.position);
      // Ha túl messze van a kamerától, elhalványítjuk (átlátszóság)
      vehicleRef.current.visible = distanceFromCamera < 120;
    }
  });
  
  // Jármű komponens renderelése a típus alapján
  return (
    <group ref={vehicleRef} position={initialPosition} castShadow receiveShadow>
      {type === 'car' && (
        <CarModel color={vehicleColor} dimensions={dimensions} performance={performance} />
      )}
      
      {type === 'bus' && (
        <BusModel color={vehicleColor} dimensions={dimensions} performance={performance} />
      )}
      
      {type === 'truck' && (
        <TruckModel color={vehicleColor} dimensions={dimensions} performance={performance} />
      )}
    </group>
  );
}

// Személyautó modell
function CarModel({ 
  color, 
  dimensions, 
  performance 
}: { 
  color: Color, 
  dimensions: { length: number, width: number, height: number },
  performance: 'high' | 'medium' | 'low'
}) {
  return (
    <group>
      {/* Kocsi alsó része (karosszéria) */}
      <Box
        args={[dimensions.length, dimensions.height * 0.6, dimensions.width]}
        position={[0, dimensions.height * 0.3, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          color={color}
          roughness={0.3}
          metalness={0.8}
        />
      </Box>
      
      {/* Kocsi felső része (utastér) */}
      <Box
        args={[dimensions.length * 0.6, dimensions.height * 0.4, dimensions.width * 0.9]}
        position={[0, dimensions.height * 0.8, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          color={color}
          roughness={0.3}
          metalness={0.8}
        />
      </Box>
      
      {/* Ablakok - csak közepes és magas teljesítménynél */}
      {performance !== 'low' && (
        <>
          {/* Szélvédő */}
          <Box
            args={[dimensions.length * 0.2, dimensions.height * 0.35, dimensions.width * 0.85]}
            position={[dimensions.length * 0.2, dimensions.height * 0.78, 0]}
            castShadow
          >
            <MeshTransmissionMaterial
              samples={3}
              resolution={256}
              thickness={0.3}
              roughness={0}
              clearcoat={1}
              clearcoatRoughness={0}
              transmission={1}
              ior={1.5}
              chromaticAberration={0.06}
              color="#88CCFF"
              attenuationColor="#FFFFFF"
              attenuationDistance={0}
            />
          </Box>
          
          {/* Hátsó szélvédő */}
          <Box
            args={[dimensions.length * 0.2, dimensions.height * 0.35, dimensions.width * 0.85]}
            position={[-dimensions.length * 0.2, dimensions.height * 0.78, 0]}
            castShadow
          >
            <MeshTransmissionMaterial
              samples={3}
              resolution={256}
              thickness={0.3}
              roughness={0}
              clearcoat={1}
              clearcoatRoughness={0}
              transmission={1}
              ior={1.5}
              chromaticAberration={0.06}
              color="#88CCFF"
              attenuationColor="#FFFFFF"
              attenuationDistance={0}
            />
          </Box>
        </>
      )}
      
      {/* Kerekek */}
      {[
        [dimensions.length * 0.35, dimensions.height * 0.3, dimensions.width * 0.5],
        [dimensions.length * 0.35, dimensions.height * 0.3, -dimensions.width * 0.5],
        [-dimensions.length * 0.35, dimensions.height * 0.3, dimensions.width * 0.5],
        [-dimensions.length * 0.35, dimensions.height * 0.3, -dimensions.width * 0.5]
      ].map((position, index) => (
        <Box
          key={index}
          args={[dimensions.length * 0.1, dimensions.height * 0.3, dimensions.width * 0.1]}
          position={position as [number, number, number]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial
            color="#111111"
            roughness={0.7}
            metalness={0.1}
          />
        </Box>
      ))}
      
      {/* Fényszórók - csak közepes és magas teljesítménynél */}
      {performance !== 'low' && (
        <>
          {/* Első fényszórók */}
          {[
            [dimensions.length * 0.48, dimensions.height * 0.4, dimensions.width * 0.35],
            [dimensions.length * 0.48, dimensions.height * 0.4, -dimensions.width * 0.35]
          ].map((position, index) => (
            <Box
              key={`front-light-${index}`}
              args={[dimensions.length * 0.05, dimensions.height * 0.1, dimensions.width * 0.2]}
              position={position as [number, number, number]}
            >
              <meshStandardMaterial
                color="#FFFF99"
                emissive="#FFFF99"
                emissiveIntensity={0.5}
              />
            </Box>
          ))}
          
          {/* Hátsó lámpák */}
          {[
            [-dimensions.length * 0.48, dimensions.height * 0.4, dimensions.width * 0.35],
            [-dimensions.length * 0.48, dimensions.height * 0.4, -dimensions.width * 0.35]
          ].map((position, index) => (
            <Box
              key={`rear-light-${index}`}
              args={[dimensions.length * 0.05, dimensions.height * 0.1, dimensions.width * 0.2]}
              position={position as [number, number, number]}
            >
              <meshStandardMaterial
                color="#FF0000"
                emissive="#FF0000"
                emissiveIntensity={0.5}
              />
            </Box>
          ))}
        </>
      )}
    </group>
  );
}

// Busz modell
function BusModel({ 
  color, 
  dimensions, 
  performance 
}: { 
  color: Color, 
  dimensions: { length: number, width: number, height: number },
  performance: 'high' | 'medium' | 'low'
}) {
  return (
    <group>
      {/* Busz karosszéria */}
      <Box
        args={[dimensions.length, dimensions.height * 0.9, dimensions.width]}
        position={[0, dimensions.height * 0.45, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          color={color}
          roughness={0.4}
          metalness={0.6}
        />
      </Box>
      
      {/* Ablakok - csak közepes és magas teljesítménynél */}
      {performance !== 'low' && (
        <>
          {/* Oldalablakok */}
          <Box
            args={[dimensions.length * 0.95, dimensions.height * 0.3, dimensions.width * 1.01]}
            position={[0, dimensions.height * 0.7, 0]}
          >
            <MeshTransmissionMaterial
              samples={3}
              resolution={256}
              thickness={0.2}
              roughness={0}
              clearcoat={1}
              clearcoatRoughness={0}
              transmission={1}
              ior={1.5}
              chromaticAberration={0.04}
              color="#88CCFF"
              attenuationColor="#FFFFFF"
              attenuationDistance={0}
            />
          </Box>
          
          {/* Első szélvédő */}
          <Box
            args={[dimensions.length * 0.05, dimensions.height * 0.6, dimensions.width * 0.9]}
            position={[dimensions.length * 0.48, dimensions.height * 0.6, 0]}
          >
            <MeshTransmissionMaterial
              samples={3}
              resolution={256}
              thickness={0.3}
              roughness={0}
              clearcoat={1}
              clearcoatRoughness={0}
              transmission={1}
              ior={1.5}
              chromaticAberration={0.06}
              color="#88CCFF"
              attenuationColor="#FFFFFF"
              attenuationDistance={0}
            />
          </Box>
        </>
      )}
      
      {/* Kerekek */}
      {[
        [dimensions.length * 0.4, dimensions.height * 0.3, dimensions.width * 0.5],
        [dimensions.length * 0.4, dimensions.height * 0.3, -dimensions.width * 0.5],
        [-dimensions.length * 0.4, dimensions.height * 0.3, dimensions.width * 0.5],
        [-dimensions.length * 0.4, dimensions.height * 0.3, -dimensions.width * 0.5]
      ].map((position, index) => (
        <Box
          key={index}
          args={[dimensions.length * 0.1, dimensions.height * 0.3, dimensions.width * 0.1]}
          position={position as [number, number, number]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial
            color="#111111"
            roughness={0.7}
            metalness={0.1}
          />
        </Box>
      ))}
      
      {/* Fényszórók - csak közepes és magas teljesítménynél */}
      {performance !== 'low' && (
        <>
          {/* Első fényszórók */}
          {[
            [dimensions.length * 0.48, dimensions.height * 0.4, dimensions.width * 0.35],
            [dimensions.length * 0.48, dimensions.height * 0.4, -dimensions.width * 0.35]
          ].map((position, index) => (
            <Box
              key={`front-light-${index}`}
              args={[dimensions.length * 0.05, dimensions.height * 0.1, dimensions.width * 0.15]}
              position={position as [number, number, number]}
            >
              <meshStandardMaterial
                color="#FFFF99"
                emissive="#FFFF99"
                emissiveIntensity={0.5}
              />
            </Box>
          ))}
          
          {/* Hátsó lámpák */}
          {[
            [-dimensions.length * 0.48, dimensions.height * 0.4, dimensions.width * 0.35],
            [-dimensions.length * 0.48, dimensions.height * 0.4, -dimensions.width * 0.35]
          ].map((position, index) => (
            <Box
              key={`rear-light-${index}`}
              args={[dimensions.length * 0.05, dimensions.height * 0.1, dimensions.width * 0.15]}
              position={position as [number, number, number]}
            >
              <meshStandardMaterial
                color="#FF0000"
                emissive="#FF0000"
                emissiveIntensity={0.5}
              />
            </Box>
          ))}
        </>
      )}
    </group>
  );
}

// Teherautó modell
function TruckModel({ 
  color, 
  dimensions, 
  performance 
}: { 
  color: Color, 
  dimensions: { length: number, width: number, height: number },
  performance: 'high' | 'medium' | 'low'
}) {
  return (
    <group>
      {/* Vezetőfülke */}
      <Box
        args={[dimensions.length * 0.3, dimensions.height, dimensions.width]}
        position={[dimensions.length * 0.35, dimensions.height * 0.5, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          color={color}
          roughness={0.4}
          metalness={0.7}
        />
      </Box>
      
      {/* Plató/rakomány */}
      <Box
        args={[dimensions.length * 0.7, dimensions.height * 0.8, dimensions.width]}
        position={[-dimensions.length * 0.15, dimensions.height * 0.4, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          color="#555555"
          roughness={0.6}
          metalness={0.3}
        />
      </Box>
      
      {/* Ablakok - csak közepes és magas teljesítménynél */}
      {performance !== 'low' && (
        <>
          {/* Első szélvédő */}
          <Box
            args={[dimensions.length * 0.05, dimensions.height * 0.4, dimensions.width * 0.85]}
            position={[dimensions.length * 0.48, dimensions.height * 0.7, 0]}
          >
            <MeshTransmissionMaterial
              samples={3}
              resolution={256}
              thickness={0.3}
              roughness={0}
              clearcoat={1}
              clearcoatRoughness={0}
              transmission={1}
              ior={1.5}
              chromaticAberration={0.06}
              color="#88CCFF"
              attenuationColor="#FFFFFF"
              attenuationDistance={0}
            />
          </Box>
        </>
      )}
      
      {/* Kerekek */}
      {[
        [dimensions.length * 0.35, dimensions.height * 0.3, dimensions.width * 0.5],
        [dimensions.length * 0.35, dimensions.height * 0.3, -dimensions.width * 0.5],
        [-dimensions.length * 0.15, dimensions.height * 0.3, dimensions.width * 0.5],
        [-dimensions.length * 0.15, dimensions.height * 0.3, -dimensions.width * 0.5],
        [-dimensions.length * 0.4, dimensions.height * 0.3, dimensions.width * 0.5],
        [-dimensions.length * 0.4, dimensions.height * 0.3, -dimensions.width * 0.5]
      ].map((position, index) => (
        <Box
          key={index}
          args={[dimensions.length * 0.08, dimensions.height * 0.3, dimensions.width * 0.1]}
          position={position as [number, number, number]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial
            color="#111111"
            roughness={0.7}
            metalness={0.1}
          />
        </Box>
      ))}
      
      {/* Fényszórók - csak közepes és magas teljesítménynél */}
      {performance !== 'low' && (
        <>
          {/* Első fényszórók */}
          {[
            [dimensions.length * 0.48, dimensions.height * 0.4, dimensions.width * 0.3],
            [dimensions.length * 0.48, dimensions.height * 0.4, -dimensions.width * 0.3]
          ].map((position, index) => (
            <Box
              key={`front-light-${index}`}
              args={[dimensions.length * 0.05, dimensions.height * 0.1, dimensions.width * 0.15]}
              position={position as [number, number, number]}
            >
              <meshStandardMaterial
                color="#FFFF99"
                emissive="#FFFF99"
                emissiveIntensity={0.5}
              />
            </Box>
          ))}
          
          {/* Hátsó lámpák */}
          {[
            [-dimensions.length * 0.48, dimensions.height * 0.3, dimensions.width * 0.3],
            [-dimensions.length * 0.48, dimensions.height * 0.3, -dimensions.width * 0.3]
          ].map((position, index) => (
            <Box
              key={`rear-light-${index}`}
              args={[dimensions.length * 0.05, dimensions.height * 0.1, dimensions.width * 0.15]}
              position={position as [number, number, number]}
            >
              <meshStandardMaterial
                color="#FF0000"
                emissive="#FF0000"
                emissiveIntensity={0.5}
              />
            </Box>
          ))}
        </>
      )}
    </group>
  );
} 