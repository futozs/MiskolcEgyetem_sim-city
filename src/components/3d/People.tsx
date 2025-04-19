'use client';

import { useRef, useMemo } from 'react';
import { Vector3, Color } from 'three';
import { Box, Sphere, useFrame } from '@react-three/drei';

// Különböző ember típusok
export type PersonType = 'adult' | 'child' | 'elder';

// Ember komponens a 3D városhoz
export function Person({ 
  position, 
  type = 'adult',
  walkPath,
  walkSpeed = 0.5,
  color,
  performance = 'high'
}: { 
  position: [number, number, number],
  type?: PersonType,
  walkPath?: Array<[number, number, number]>,
  walkSpeed?: number,
  color?: string,
  performance?: 'high' | 'medium' | 'low'
}) {
  const personRef = useRef<any>();
  const timeRef = useRef(Math.random() * 1000); // Random kezdőpont az animációhoz
  
  // Determinisztikus személyi tulajdonságok
  const personProps = useMemo(() => {
    // Determinisztikus seed a pozíció alapján
    const seed = Math.abs(Math.floor(position[0] * 100) + Math.floor(position[2] * 100));
    
    // Alapértelmezett szín választása, ha nincs megadva
    let personColor: Color;
    if (color) {
      personColor = new Color(color);
    } else {
      // Ruha színek közel valóságos eloszlásban
      const clothesColors = [
        '#2255AA', // kék
        '#225522', // zöld
        '#772222', // bordó
        '#222222', // fekete
        '#555555', // szürke
        '#774422', // barna
        '#AA5522', // okkersárga
        '#FFFFFF', // fehér
      ];
      personColor = new Color(clothesColors[seed % clothesColors.length]);
    }
    
    // Bőrszín
    const skinTones = [
      '#FEE3C8', // világos
      '#F1C888', // közép-világos
      '#D39D6C', // közepes
      '#AA6339', // közép-sötét
      '#6A4A37', // sötét
    ];
    const skinColor = new Color(skinTones[(seed % 17) % skinTones.length]);
    
    // Fizikai tulajdonságok korcsoporttól függően
    let height, width;
    
    if (type === 'child') {
      height = 0.8 + (seed % 10) / 40; // 0.8-1.05 magasság
      width = 0.3 + (seed % 8) / 40;   // 0.3-0.5 szélesség
    } else if (type === 'elder') {
      height = 1.0 + (seed % 12) / 30; // 1.0-1.4 magasság
      width = 0.4 + (seed % 10) / 30;  // 0.4-0.73 szélesség
    } else { // felnőtt
      height = 1.2 + (seed % 15) / 30; // 1.2-1.7 magasság
      width = 0.4 + (seed % 12) / 40;  // 0.4-0.7 szélesség
    }
    
    // Animációs paraméterek
    const walkCycleSpeed = 0.8 + (seed % 10) / 15; // Egyedi sétálási sebesség
    const idleMovement = (seed % 100) / 2000; // Kis véletlenszerű mozgás álló helyzetben
    
    return {
      personColor,
      skinColor,
      height,
      width,
      walkCycleSpeed,
      idleMovement,
      pathIndex: 0,   // Sétáló út aktuális indexe
      pathProgress: 0 // Két pont közötti haladás (0-1)
    };
  }, [position, color, type]);
  
  // Séta animáció és mozgás
  useFrame((state, delta) => {
    if (!personRef.current) return;
    
    // Időreferencia frissítése
    timeRef.current += delta;
    
    // Sétáló út logika
    if (walkPath && walkPath.length > 1) {
      // Haladjunk a következő pont felé
      const currentPoint = walkPath[personProps.pathIndex];
      const nextPoint = walkPath[(personProps.pathIndex + 1) % walkPath.length];
      
      // Irány vektor számítása
      const direction = new Vector3(
        nextPoint[0] - currentPoint[0],
        nextPoint[1] - currentPoint[1],
        nextPoint[2] - currentPoint[2]
      );
      
      // Távolság számítása
      const distance = direction.length();
      direction.normalize();
      
      // Haladás frissítése
      personProps.pathProgress += (walkSpeed * delta) / distance;
      
      // Ha elértük a következő pontot
      if (personProps.pathProgress >= 1) {
        personProps.pathIndex = (personProps.pathIndex + 1) % walkPath.length;
        personProps.pathProgress = 0;
      }
      
      // Pozíció interpolálása
      const newPosition = new Vector3(
        currentPoint[0] + direction.x * distance * personProps.pathProgress,
        currentPoint[1] + direction.y * distance * personProps.pathProgress,
        currentPoint[2] + direction.z * distance * personProps.pathProgress
      );
      
      // Pozíció frissítése
      personRef.current.position.copy(newPosition);
      
      // Forgás beállítása a haladási irány felé
      if (distance > 0.01) {
        personRef.current.rotation.y = Math.atan2(direction.x, direction.z);
      }
      
      // Séta animáció
      const legAngle = Math.sin(timeRef.current * personProps.walkCycleSpeed * 5) * 0.2;
      if (personRef.current.children[1]) {
        personRef.current.children[1].rotation.x = legAngle;
      }
      if (personRef.current.children[2]) {
        personRef.current.children[2].rotation.x = -legAngle;
      }
    } else {
      // Álló helyzet esetén kis idle animáció
      const swayAngle = Math.sin(timeRef.current * 0.5) * personProps.idleMovement;
      
      personRef.current.rotation.y += Math.sin(timeRef.current * 0.2) * 0.01; // Kis forgás
      
      // A test kis dőlése
      if (personRef.current.children[0]) {
        personRef.current.children[0].rotation.z = swayAngle;
      }
    }
  });
  
  // Alacsonyrészletességű személyek (távoli nézet)
  if (performance === 'low') {
    return (
      <group ref={personRef} position={position}>
        {/* Egyszerű kocka test */}
        <Box 
          args={[personProps.width * 0.8, personProps.height, personProps.width * 0.5]} 
          position={[0, personProps.height / 2, 0]}
          castShadow
        >
          <meshStandardMaterial color={personProps.personColor} />
        </Box>
        
        {/* Fej */}
        <Sphere
          args={[personProps.width * 0.3, 4, 4]}
          position={[0, personProps.height + personProps.width * 0.15, 0]}
          castShadow
        >
          <meshStandardMaterial color={personProps.skinColor} />
        </Sphere>
      </group>
    );
  }
  
  return (
    <group ref={personRef} position={position}>
      {/* Test */}
      <Box 
        args={[personProps.width * 0.8, personProps.height * 0.6, personProps.width * 0.5]} 
        position={[0, personProps.height * 0.3 + 0.1, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial 
          color={personProps.personColor}
          roughness={0.8}
          metalness={0.1}
        />
      </Box>
      
      {/* Bal láb */}
      <Box
        args={[personProps.width * 0.25, personProps.height * 0.4, personProps.width * 0.25]}
        position={[personProps.width * 0.2, personProps.height * 0.2, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          color={new Color(personProps.personColor).multiplyScalar(0.7)}
          roughness={0.8}
          metalness={0.1}
        />
      </Box>
      
      {/* Jobb láb */}
      <Box
        args={[personProps.width * 0.25, personProps.height * 0.4, personProps.width * 0.25]}
        position={[-personProps.width * 0.2, personProps.height * 0.2, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          color={new Color(personProps.personColor).multiplyScalar(0.7)}
          roughness={0.8}
          metalness={0.1}
        />
      </Box>
      
      {/* Fej */}
      <Sphere
        args={[personProps.width * 0.3, 8, 8]}
        position={[0, personProps.height * 0.6 + personProps.width * 0.3, 0]}
        castShadow
      >
        <meshStandardMaterial
          color={personProps.skinColor}
          roughness={0.7}
          metalness={0.1}
        />
      </Sphere>
      
      {/* Karok - csak közepes és magas teljesítménynél */}
      {performance !== 'low' && (
        <>
          {/* Bal kar */}
          <Box
            args={[personProps.width * 0.2, personProps.height * 0.45, personProps.width * 0.2]}
            position={[personProps.width * 0.5, personProps.height * 0.35, 0]}
            rotation={[0, 0, Math.sin(timeRef.current * personProps.walkCycleSpeed * 5) * 0.15]}
            castShadow
            receiveShadow
          >
            <meshStandardMaterial
              color={personProps.personColor}
              roughness={0.8}
              metalness={0.1}
            />
          </Box>
          
          {/* Jobb kar */}
          <Box
            args={[personProps.width * 0.2, personProps.height * 0.45, personProps.width * 0.2]}
            position={[-personProps.width * 0.5, personProps.height * 0.35, 0]}
            rotation={[0, 0, -Math.sin(timeRef.current * personProps.walkCycleSpeed * 5) * 0.15]}
            castShadow
            receiveShadow
          >
            <meshStandardMaterial
              color={personProps.personColor}
              roughness={0.8}
              metalness={0.1}
            />
          </Box>
        </>
      )}
    </group>
  );
}

// Emberek csoportja komponens
export function PeopleGroup({ 
  centerPosition = [0, 0, 0], 
  radius = 10,
  count = 10,
  performance = 'high'
}: { 
  centerPosition?: [number, number, number],
  radius?: number,
  count?: number,
  performance?: 'high' | 'medium' | 'low'
}) {
  // Optimalizáljuk az emberek számát teljesítmény alapján
  const actualCount = performance === 'low' ? Math.floor(count * 0.3) : 
                     performance === 'medium' ? Math.floor(count * 0.6) : 
                     count;
  
  // Generáljunk determinisztikus pozíciókat
  const people = useMemo(() => {
    const result = [];
    
    for (let i = 0; i < actualCount; i++) {
      // Használjunk egy determinisztikus seed-et
      const seed = i * 1000 + Math.floor(centerPosition[0] * 10) + Math.floor(centerPosition[2] * 10);
      
      // Determinisztikus random pozíció a körön belül
      const angle = (seed % 360) * Math.PI / 180;
      const distance = Math.sqrt((seed % 1000) / 1000) * radius; // Gyökvonás a jobb eloszláshoz
      
      const x = centerPosition[0] + Math.cos(angle) * distance;
      const z = centerPosition[2] + Math.sin(angle) * distance;
      
      // Különböző korcsoportok elosztása: 70% felnőtt, 15% gyerek, 15% idős
      let type: PersonType = 'adult';
      const typeRandom = (seed % 100);
      if (typeRandom < 15) {
        type = 'child';
      } else if (typeRandom < 30) {
        type = 'elder';
      }
      
      // Ha sétáló útvonalat akarunk adni (25% esély rá)
      let walkPath = undefined;
      if ((seed % 100) < 25) {
        // Egyszerű körsétány
        const pathRadius = 2 + (seed % 5);
        const pathSteps = 4 + (seed % 4);
        walkPath = [];
        
        for (let j = 0; j < pathSteps; j++) {
          const pathAngle = (j / pathSteps) * Math.PI * 2;
          walkPath.push([
            x + Math.cos(pathAngle) * pathRadius,
            0,
            z + Math.sin(pathAngle) * pathRadius
          ]);
        }
      }
      
      result.push({
        position: [x, 0, z] as [number, number, number],
        type,
        walkPath,
        walkSpeed: 0.3 + (seed % 100) / 200 // 0.3-0.8 sebesség
      });
    }
    
    return result;
  }, [centerPosition, radius, actualCount]);
  
  return (
    <group>
      {people.map((person, index) => (
        <Person
          key={index}
          position={person.position}
          type={person.type}
          walkPath={person.walkPath}
          walkSpeed={person.walkSpeed}
          performance={performance}
        />
      ))}
    </group>
  );
} 