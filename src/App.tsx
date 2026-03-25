/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback, useMemo, Suspense, Component } from 'react';

// Error Boundary Component
class ErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean, error: any }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 flex items-center justify-center bg-black text-white p-10 text-center z-[9999]">
          <div>
            <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
            <p className="text-sm opacity-60 mb-6">{this.state.error?.message || "An unexpected error occurred."}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-blue-600 rounded-full text-xs font-bold uppercase tracking-widest"
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial, Environment, PerspectiveCamera, Cylinder, Box, Torus, TorusKnot, Octahedron, Text, useTexture, Html } from '@react-three/drei';
import { Moon, Sun } from 'lucide-react';
import * as THREE from 'three';
import Matter from 'matter-js';

const DIALOGUE: Record<string, string[]> = {
  quant: ["Logic is the foundation", "Numbers tell a story", "Precision in every step"],
  psych: ["Understand the mind", "Behavior is a map", "Empathy through insight"],
  soc: ["Connection is life", "Presence is a gift", "We grow together"],
  write: ["Words carry weight", "Narrative is power", "Refine the voice"],
  math: ["Support the structure", "Build the base", "Patterns emerge"]
};

const PILLARS = [
  { id: 'quant', label: 'MATH 117', color: '#e67e22', shape: 'TorusKnot', args: [0.2, 0.06, 64, 8], icon: '🧮', info: "Module 6 (Statistics) online. Current Standing: 90.9% (A)." },
  { id: 'psych', label: 'PSYC 103', color: '#2980b9', shape: 'Octahedron', args: [0.3], icon: '🧠', info: "Week 5 Discussion completed. Brain Assignment graded: 30/30!" },
  { id: 'soc', label: 'HUMS 105', color: '#27ae60', shape: 'Sphere', args: [0.3, 32, 32], icon: '🤝', info: "Standing: 163.5/172.5 (A). Quiz #6 due SUN." },
  { id: 'write', label: 'ENGL 100', color: '#16a085', shape: 'Cylinder', args: [0.2, 0.2, 0.4, 16], icon: '✍️', info: "99/100 Essay 1! Standing: 272/285 (A)." },
  { id: 'math', label: 'MATH 017', color: '#c0392b', shape: 'Torus', args: [0.2, 0.1, 16, 32], icon: '📈', info: "Support modules running. Ahead of schedule in Probability." }
];

const INSET_MODES = [
  { id: 'orbit', color: '#a855f7', label: 'Orbit' },
  { id: 'sandbox', color: '#f59e0b', label: 'Sandbox' },
  { id: 'billiards', color: '#10b981', label: 'Billiards' },
  { id: 'pinball', color: '#ef4444', label: 'Pinball' },
  { id: 'maze', color: '#3b82f6', label: 'Maze' }
];

function MarbleMesh({ orb, body, currentMode, currentStyle, fillLevel, onClick }: { orb: any, body: Matter.Body, currentMode: string, currentStyle: string, fillLevel: number, onClick: () => void }) {
  const groupRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (groupRef.current && body) {
      groupRef.current.position.x = body.position.x;
      groupRef.current.position.y = -body.position.y;
      
      if (currentMode === 'orbit') {
        // Calculate Z depth based on position in orbit to pass in front/behind
        const angle = Math.atan2(-body.position.y, body.position.x);
        groupRef.current.position.z = Math.sin(angle) * 2.2;
        
        // Scale slightly based on depth for perspective
        const s = 1 + (Math.sin(angle) * 0.15);
        groupRef.current.scale.setScalar(s);
      } else {
        groupRef.current.position.z = 0.5;
        groupRef.current.scale.setScalar(1);
      }
      
      if (currentMode !== 'koi') {
        groupRef.current.rotation.z = -body.angle;
      } else {
        groupRef.current.rotation.x += 0.004;
        groupRef.current.rotation.y += 0.004;
      }
      
      if (coreRef.current) {
        coreRef.current.scale.setScalar(0.4 + fillLevel * 0.5);
      }
    }
  });

  const ShapeComponent = (orb.shape === 'TorusKnot' ? TorusKnot : 
                         orb.shape === 'Octahedron' ? Octahedron : 
                         orb.shape === 'Sphere' ? Sphere : 
                         orb.shape === 'Cylinder' ? Cylinder : 
                         orb.shape === 'Torus' ? Torus : Sphere) as any;

  const materialProps = useMemo(() => {
    switch (currentStyle) {
      case 'cats-eye':
        return {
          transmission: 0.8,
          opacity: 1,
          roughness: 0.1,
          metalness: 0.2,
          thickness: 0.5,
          ior: 1.5,
          color: orb.color
        };
      case 'crystal':
        return {
          transmission: 0.95,
          opacity: 1,
          roughness: 0.05,
          metalness: 0.1,
          thickness: 1,
          ior: 2.4,
          color: '#ffffff'
        };
      case 'vanilla':
      default:
        return {
          transmission: 0,
          opacity: 1,
          roughness: 0.4,
          metalness: 0.1,
          color: orb.color
        };
    }
  }, [currentStyle, orb.color]);

  return (
    <group ref={groupRef}>
      {/* Caustic Glow */}
      <mesh position={[0, 0, -0.1]}>
        <circleGeometry args={[0.6, 32]} />
        <meshBasicMaterial color={orb.color} transparent opacity={0.15} />
      </mesh>
      
      {/* Liquid Core */}
      <ShapeComponent ref={coreRef} args={orb.args.map((a: any) => typeof a === 'number' ? a * 0.9 : a)}>
        <meshStandardMaterial color={orb.color} emissive={orb.color} emissiveIntensity={0.5} />
      </ShapeComponent>

      <ShapeComponent 
        args={orb.args} 
        castShadow 
        onClick={(e: any) => {
          e.stopPropagation();
          onClick();
        }}
      >
        <meshPhysicalMaterial {...materialProps} />
      </ShapeComponent>

      {/* Floating Icon */}
      <Text
        position={[0, 0, 0.5]}
        fontSize={0.25}
        color="white"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor={orb.color}
      >
        {orb.icon}
      </Text>
    </group>
  );
}

function AvatarFrame({ onClick, isDarkMode }: { onClick: () => void, isDarkMode: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  
  // Use a more reliable texture or fallback to color if it fails
  // Using a smaller, more common Unsplash ID
  const marbleTexture = useTexture('https://images.unsplash.com/photo-1519750783826-e2420f4d687f?q=80&w=500&auto=format&fit=crop');
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 1.2) * 0.1;
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.3;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]} onClick={(e) => { e.stopPropagation(); onClick(); }}>
      {/* Soft Blue Aura */}
      <mesh>
        <circleGeometry args={[2.8, 64]} />
        <meshBasicMaterial color="#3b82f6" transparent opacity={0.05} />
      </mesh>

      {/* 3D Marble Egg */}
      <Sphere args={[1.8, 64, 32]} scale={[1, 1.4, 1]}>
        <MeshDistortMaterial 
          map={marbleTexture}
          color="#ffffff"
          roughness={0.1}
          metalness={0.2}
          distort={0.2}
          speed={2}
          emissive="#60a5fa"
          emissiveIntensity={0.2}
        />
      </Sphere>

      {/* Blue Vein Detail Layer */}
      <Sphere args={[1.81, 64, 32]} scale={[1, 1.4, 1]}>
        <meshStandardMaterial 
          color="#2563eb"
          transparent
          opacity={0.1}
          wireframe
          roughness={1}
        />
      </Sphere>
    </group>
  );
}

function PhysicsLoop({ 
  engineRef, 
  marblesRef, 
  currentMode, 
  currentStyle, 
  handleOrbClick, 
  handleAvatarClick, 
  playAcousticTap,
  isDarkMode,
  orbitRotationRef
}: any) {
  const { camera } = useThree();

  useFrame((state) => {
    if (!engineRef.current) return;

    if (currentMode === 'orbit') {
      orbitRotationRef.current += 0.005;
      marblesRef.current.forEach((m: any, i: number) => {
        const angle = orbitRotationRef.current + (i / PILLARS.length) * (Math.PI * 2);
        const targetX = Math.cos(angle) * 3;
        const targetY = Math.sin(angle) * 3;
        Matter.Body.setPosition(m.body, { x: targetX, y: targetY });
      });
    }

    if (currentMode === 'koi') {
      marblesRef.current.forEach((m: any, i: number) => {
        const time = state.clock.elapsedTime * 0.2;
        const forceX = Math.sin(time + i) * 0.0002;
        const forceY = Math.cos(time * 0.8 + i) * 0.0002;
        Matter.Body.applyForce(m.body, m.body.position, { x: forceX, y: forceY });
      });
    }
  });

  const handleBackgroundClick = (e: any) => {
    if (currentMode === 'orbit' || currentMode === 'koi') return;
    
    const vector = new THREE.Vector3(
      (e.clientX / window.innerWidth) * 2 - 1,
      -(e.clientY / window.innerHeight) * 2 + 1,
      0.5
    );
    vector.unproject(camera);
    const dir = vector.sub(camera.position).normalize();
    const distance = -camera.position.z / dir.z;
    const pos = camera.position.clone().add(dir.multiplyScalar(distance));

    marblesRef.current.forEach((m: any) => {
      const dx = m.body.position.x - pos.x;
      const dy = m.body.position.y - (-pos.y); 
      const dist = Math.sqrt(dx * dx + dy * dy);
      const force = 0.05 / (dist + 0.5);
      Matter.Body.applyForce(m.body, m.body.position, {
        x: (dx / dist) * force,
        y: (dy / dist) * force
      });
    });
    
    playAcousticTap(10);
  };

  return (
    <group onPointerDown={(e) => {
      if (e.intersections.length === 0) handleBackgroundClick(e);
    }}>
      <AvatarFrame onClick={handleAvatarClick} isDarkMode={isDarkMode} />
      
      {currentMode === 'orbit' && (
        <Torus args={[3, 0.01, 16, 100]} rotation={[Math.PI / 2, 0, 0]}>
          <meshBasicMaterial color={isDarkMode ? "#ffffff" : "#000000"} transparent opacity={0.1} />
        </Torus>
      )}

      {marblesRef.current.map((m: any, i: number) => (
        <MarbleMesh 
          key={m.id} 
          orb={PILLARS[i]} 
          body={m.body} 
          currentMode={currentMode} 
          currentStyle={currentStyle}
          fillLevel={m.fillLevel}
          onClick={() => handleOrbClick(PILLARS[i])}
        />
      ))}
      
      {currentMode === 'maze' && (
        <group>
          <Box args={[0.5, 4, 1.5]} position={[-2, 0, 0.75]}>
            <meshStandardMaterial color="#3d2b1f" />
          </Box>
          <Box args={[4, 0.5, 1.5]} position={[2, 2, 0.75]}>
            <meshStandardMaterial color="#3d2b1f" />
          </Box>
          <Box args={[5, 0.5, 1.5]} position={[1, -2, 0.75]}>
            <meshStandardMaterial color="#3d2b1f" />
          </Box>
        </group>
      )}

      {currentMode === 'pinball' && (
        <group>
          <Cylinder args={[0.6, 0.6, 0.5, 32]} position={[0, 2.5, 0.25]} rotation={[Math.PI/2, 0, 0]}>
            <meshStandardMaterial color="#d4af37" metalness={0.9} />
          </Cylinder>
          <Cylinder args={[0.5, 0.5, 0.5, 32]} position={[-1.5, 1, 0.25]} rotation={[Math.PI/2, 0, 0]}>
            <meshStandardMaterial color="#d4af37" metalness={0.9} />
          </Cylinder>
          <Cylinder args={[0.5, 0.5, 0.5, 32]} position={[1.5, 1, 0.25]} rotation={[Math.PI/2, 0, 0]}>
            <meshStandardMaterial color="#d4af37" metalness={0.9} />
          </Cylinder>
        </group>
      )}

      {(currentMode === 'sandbox' || currentMode === 'billiards') && (
        <group>
          <Box args={[10, 14, 0.1]} position={[0, 0, -0.5]}>
            <meshStandardMaterial color="#111" transparent opacity={0.3} />
          </Box>
        </group>
      )}

      {currentMode === 'koi' && (
        <group>
          <Box args={[10, 1.5, 0.8]} position={[0, -3.8, 0.4]}>
            <meshStandardMaterial color="#2a1d15" />
          </Box>
          <Sphere args={[0.5, 32, 16]} position={[-1.2, 2, 0.2]} scale={[0.6, 0.24, 0.42]}>
            <meshStandardMaterial color="#111111" />
          </Sphere>
          <Sphere args={[0.5, 32, 16]} position={[1.8, 2.8, 0.2]} scale={[0.9, 0.36, 0.63]}>
            <meshStandardMaterial color="#111111" />
          </Sphere>
        </group>
      )}
      
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 5, 5]} intensity={0.7} />
      <Environment preset="city" />
    </group>
  );
}

export default function App() {
  const [isWoken, setIsWoken] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('zen_egg_theme');
    return saved ? saved === 'dark' : true; // Default to dark as per current aesthetic
  });
  const [currentMode, setCurrentMode] = useState('orbit');
  const [currentStyle, setCurrentStyle] = useState('cats-eye');
  const [modalInfo, setModalInfo] = useState<{ title: string, text: string, icon: string, color: string } | null>(null);
  const [dialogue, setDialogue] = useState<string | null>(null);
  const [daysRemaining, setDaysRemaining] = useState('--');
  const [currentDate, setCurrentDate] = useState('--');
  const [progressWidth, setProgressWidth] = useState('0%');
  const [unlockedModes, setUnlockedModes] = useState<string[]>(['orbit']);

  const engineRef = useRef<Matter.Engine | null>(null);
  const marblesRef = useRef<any[]>([]);
  const avatarBodyRef = useRef<Matter.Body | null>(null);
  const staticBodiesRef = useRef<Matter.Body[]>([]);
  const orbitRotationRef = useRef(0);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    localStorage.setItem('zen_egg_theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  // Initialize Physics Engine
  useEffect(() => {
    const engine = Matter.Engine.create();
    engine.gravity.y = 0;
    engineRef.current = engine;

    const runner = Matter.Runner.create();
    Matter.Runner.run(runner, engine);

    // Create Avatar Body (Static)
    const avatarBody = Matter.Bodies.circle(0, 0, 1.4, { isStatic: true, restitution: 0.8 });
    avatarBodyRef.current = avatarBody;
    Matter.Composite.add(engine.world, avatarBody);

    // Create marbles
    const marbles = PILLARS.map((pillar, i) => {
      const angle = (i / PILLARS.length) * (Math.PI * 2);
      const x = Math.cos(angle) * 3;
      const y = Math.sin(angle) * 3;
      const body = Matter.Bodies.circle(x, y, 0.3, { 
        restitution: 0.8, 
        friction: 0.001, 
        frictionAir: 0.02,
        density: 0.05, 
        isSensor: true 
      });
      Matter.Composite.add(engine.world, body);
      return { id: pillar.id, body, fillLevel: 0, logs: 0, info: pillar.info };
    });
    marblesRef.current = marbles;

    // Load state
    const saved = localStorage.getItem('marbles_master_save_v7');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.marbles) {
          data.marbles.forEach((s: any) => {
            const m = marbles.find(item => item.id === s.id);
            if (m) { m.fillLevel = s.fill; m.logs = s.logs; }
          });
        }
        checkUnlocks(marbles);
      } catch (e) {}
    }

    // Fetch Intel from Google Apps Script
    const fetchIntel = async () => {
      const url = import.meta.env.VITE_GAS_URL;
      if (!url) return;
      
      try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.orbs) {
          data.orbs.forEach((scriptOrb: any) => {
            const m = marblesRef.current.find(item => item.id === scriptOrb.id);
            if (m) {
              m.info = scriptOrb.info;
              // Update fillLevel if it's higher than current (to reflect grade/progress)
              const scriptFill = scriptOrb.level / 100;
              if (scriptFill > m.fillLevel) {
                m.fillLevel = scriptFill;
              }
            }
          });
          checkUnlocks(marblesRef.current);
        }
      } catch (e) {
        console.error("Failed to fetch intel", e);
      }
    };
    fetchIntel();

    return () => {
      Matter.Engine.clear(engine);
      Matter.Runner.stop(runner);
    };
  }, []);

  // Mode-specific Physics Setup
  useEffect(() => {
    if (!engineRef.current) return;
    const world = engineRef.current.world;

    // Clear old static bodies
    staticBodiesRef.current.forEach(body => Matter.Composite.remove(world, body));
    staticBodiesRef.current = [];

    const newStatics: Matter.Body[] = [];

    // Boundaries (for non-orbit modes)
    if (currentMode !== 'orbit' && currentMode !== 'koi') {
      const wallThickness = 1;
      const width = 10;
      const height = 14;
      newStatics.push(
        Matter.Bodies.rectangle(0, -height/2, width, wallThickness, { isStatic: true }), // Top
        Matter.Bodies.rectangle(0, height/2, width, wallThickness, { isStatic: true }),  // Bottom
        Matter.Bodies.rectangle(-width/2, 0, wallThickness, height, { isStatic: true }), // Left
        Matter.Bodies.rectangle(width/2, 0, wallThickness, height, { isStatic: true })   // Right
      );
    }

    if (currentMode === 'maze') {
      newStatics.push(
        Matter.Bodies.rectangle(-2, 0, 0.5, 4, { isStatic: true }),
        Matter.Bodies.rectangle(2, -2, 4, 0.5, { isStatic: true }), // Adjusted to match visual
        Matter.Bodies.rectangle(1, 2, 5, 0.5, { isStatic: true })   // Adjusted to match visual
      );
    }

    if (currentMode === 'pinball') {
      newStatics.push(
        Matter.Bodies.circle(0, -2.5, 0.6, { isStatic: true, restitution: 1.5 }),
        Matter.Bodies.circle(-1.5, -1, 0.5, { isStatic: true, restitution: 1.5 }),
        Matter.Bodies.circle(1.5, -1, 0.5, { isStatic: true, restitution: 1.5 })
      );
    }

    Matter.Composite.add(world, newStatics);
    staticBodiesRef.current = newStatics;

    // Gravity and Sensor Settings
    if (currentMode === 'pinball') {
      engineRef.current.gravity.y = 1.5;
    } else if (currentMode === 'sandbox' || currentMode === 'maze') {
      engineRef.current.gravity.y = 1.0;
    } else {
      engineRef.current.gravity.y = 0;
    }

    marblesRef.current.forEach(m => {
      m.body.isSensor = (currentMode === 'orbit' || currentMode === 'koi');
      if (currentMode === 'billiards') {
        m.body.frictionAir = 0.005;
      } else {
        m.body.frictionAir = 0.02;
      }
    });

  }, [currentMode]);

  const checkUnlocks = useCallback((marbles: any[]) => {
    const isSandboxUnlocked = marbles.some(m => m.fillLevel > 0);
    const totalFillCount = marbles.reduce((sum, m) => sum + (m.fillLevel > 0 ? 1 : 0), 0);
    const isBilliardsUnlocked = totalFillCount >= 2 || marbles.some(m => m.fillLevel >= 0.2);
    const isPinballUnlocked = marbles.some(m => m.fillLevel >= 0.3);
    const isMazeUnlocked = marbles.some(m => m.fillLevel >= 0.45);
    const isKoiUnlocked = marbles.every(m => m.fillLevel >= 0.9);

    const newUnlocked = ['orbit'];
    if (isSandboxUnlocked) newUnlocked.push('sandbox');
    if (isBilliardsUnlocked) newUnlocked.push('billiards');
    if (isPinballUnlocked) newUnlocked.push('pinball');
    if (isMazeUnlocked) newUnlocked.push('maze');
    if (isKoiUnlocked) newUnlocked.push('koi');
    setUnlockedModes(newUnlocked);
  }, []);

  const saveState = useCallback(() => {
    const data = { 
      marbles: marblesRef.current.map(m => ({ id: m.id, fill: m.fillLevel, logs: m.logs })),
      mode: currentMode 
    };
    localStorage.setItem('marbles_master_save_v7', JSON.stringify(data));
  }, [currentMode]);

  useEffect(() => {
    const today = new Date();
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'short', day: 'numeric' };
    setCurrentDate(today.toLocaleDateString('en-US', options));

    const startOfSemester = new Date('2026-01-21');
    const endOfSemester = new Date('2026-05-15');
    
    const diffTime = Math.max(0, endOfSemester.getTime() - today.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    setDaysRemaining(diffDays.toString());
    
    const totalDuration = endOfSemester.getTime() - startOfSemester.getTime();
    const elapsed = today.getTime() - startOfSemester.getTime();
    const progress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
    
    setTimeout(() => {
      setProgressWidth(`${progress.toFixed(1)}%`);
    }, 500);
  }, []);

  const playAcousticTap = useCallback((relS: number) => {
    if (!audioCtxRef.current) return;
    const vol = Math.max(0.04, Math.min(0.5, relS * 0.045));
    const osc = audioCtxRef.current.createOscillator();
    const gain = audioCtxRef.current.createGain();
    osc.connect(gain);
    gain.connect(audioCtxRef.current.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, audioCtxRef.current.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, audioCtxRef.current.currentTime + 0.05);
    gain.gain.setValueAtTime(vol, audioCtxRef.current.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtxRef.current.currentTime + 0.05);
    osc.start();
    osc.stop(audioCtxRef.current.currentTime + 0.05);
    if (navigator.vibrate && vol > 0.15) {
      navigator.vibrate(Math.min(12, relS * 1.8));
    }
  }, []);

  const logHabit = useCallback((id: string) => {
    const marble = marblesRef.current.find(m => m.id === id);
    if (!marble || marble.fillLevel >= 0.9) return;

    const prompts = DIALOGUE[id];
    const promptText = prompts[marble.logs % prompts.length];
    setDialogue(promptText);
    setTimeout(() => setDialogue(null), 3500);

    marble.logs++;
    marble.fillLevel = Math.round((marble.fillLevel + 0.10) * 10) / 10;
    marble.fillLevel = Math.min(marble.fillLevel, 0.9);
    
    checkUnlocks(marblesRef.current);
    saveState();
  }, [checkUnlocks, saveState]);

  const resetMarbles = () => {
    if (!engineRef.current) return;
    marblesRef.current.forEach((m, i) => {
      const angle = (i / PILLARS.length) * (Math.PI * 2);
      const x = Math.cos(angle) * 3;
      const y = Math.sin(angle) * 3;
      Matter.Body.setPosition(m.body, { x, y });
      Matter.Body.setVelocity(m.body, { x: 0, y: 0 });
      Matter.Body.setAngle(m.body, 0);
      Matter.Body.setAngularVelocity(m.body, 0);
    });
    playAcousticTap(20);
  };

  const handleWake = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    setIsWoken(true);
  };

  const handleOrbClick = (orb: any) => {
    logHabit(orb.id);
    const marble = marblesRef.current.find(m => m.id === orb.id);
    setModalInfo({
      title: orb.label,
      text: marble?.info || orb.info,
      icon: orb.icon,
      color: orb.color
    });
  };

  const handleAvatarClick = () => {
    setModalInfo({
      title: "Scholar Prime",
      text: "Flow State Active. The gallery environment is optimized for deep focus and steady practice. Emerald standing maintained.",
      icon: '🌿',
      color: "#10b981"
    });
  };

  // Physics Loop Component
  // Moved outside to prevent re-definitions causing white screens

  // Handle Tilt for mobile
  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (!engineRef.current) return;
      if (currentMode === 'sandbox' || currentMode === 'maze') {
        let x = Math.max(-90, Math.min(90, e.gamma || 0));
        let y = Math.max(-90, Math.min(90, e.beta || 0));
        engineRef.current.gravity.x = (x / 90) * 2;
        engineRef.current.gravity.y = (y / 90) * 2;
      }
    };

    window.addEventListener('deviceorientation', handleOrientation);
    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, [currentMode]);

  return (
    <ErrorBoundary>
      <div className={`w-full h-full relative overflow-hidden transition-colors duration-500 ${isDarkMode ? 'dark bg-[#050505]' : 'bg-[#f8fafc]'}`}>
        {!isWoken && (
          <div id="wake-screen" onClick={handleWake}>
            <div id="wake-sphere"></div>
          </div>
        )}

        <div id="texture-overlay"></div>
        <div id="dialogue-overlay" className={dialogue ? 'visible' : ''}>
          {dialogue}
        </div>

        {/* STYLE MENU */}
        <div id="style-menu" className="z-[500] flex items-center gap-3 bg-white/10 backdrop-blur-3xl p-2 rounded-full border border-white/10 shadow-2xl">
          <button 
            onClick={toggleDarkMode} 
            className="p-2 rounded-full hover:bg-white/10 transition-colors text-white/60 hover:text-white"
          >
            {isDarkMode ? <Sun size={12} /> : <Moon size={12} />}
          </button>
          <div className="w-px h-3 bg-white/10"></div>
          <button 
            onClick={() => setCurrentStyle('cats-eye')} 
            className={`w-3 h-3 rounded-full bg-blue-400 transition-all ${currentStyle === 'cats-eye' ? 'scale-125 ring-2 ring-white' : 'opacity-40 hover:opacity-100'}`}
          />
          <button 
            onClick={() => setCurrentStyle('vanilla')} 
            className={`w-3 h-3 rounded-full bg-white transition-all ${currentStyle === 'vanilla' ? 'scale-125 ring-2 ring-white' : 'opacity-40 hover:opacity-100'}`}
          />
          <button 
            onClick={() => setCurrentStyle('crystal')} 
            className={`w-3 h-3 rounded-full bg-cyan-200 transition-all ${currentStyle === 'crystal' ? 'scale-125 ring-2 ring-white' : 'opacity-40 hover:opacity-100'}`}
          />
        </div>

        {/* MODE MENU */}
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 flex gap-5 z-[500] bg-white/10 dark:bg-black/20 backdrop-blur-3xl p-4 rounded-full border border-white/10 items-center shadow-2xl transition-all duration-500">
          {INSET_MODES.map(mode => (
            <button
              key={mode.id}
              onClick={() => unlockedModes.includes(mode.id) && setCurrentMode(mode.id)}
              className={`w-3 h-3 rounded-full transition-all duration-500 relative ${
                unlockedModes.includes(mode.id) ? 'cursor-pointer' : 'opacity-10 cursor-not-allowed'
              } ${currentMode === mode.id ? 'scale-150 ring-4 ring-white/20' : 'hover:scale-125 opacity-60 hover:opacity-100'}`}
              style={{ backgroundColor: mode.color }}
            />
          ))}
          <div className="w-px h-4 bg-white/10 mx-1"></div>
          <button 
            onClick={resetMarbles}
            className={`w-3 h-3 rounded-full bg-white transition-all duration-500 hover:scale-125 opacity-60 hover:opacity-100 shadow-[0_0_10px_rgba(255,255,255,0.3)]`}
          />
        </div>

        {/* MAIN 3D DASHBOARD */}
        <div id="perspective-root">
          <div id="marble-floor"></div>

          <div id="dashboard-ui" className="w-full h-full relative flex flex-col items-center justify-center z-10">
            
            {/* Header */}
            <div className="absolute top-4 md:top-8 w-full max-w-2xl px-4 md:px-6 z-50">
              <div className="flex justify-between text-[8px] md:text-[10px] tracking-[0.2em] md:tracking-[0.5em] opacity-60 mb-3 font-black uppercase text-gray-600 dark:text-gray-400">
                <span>JAN 21</span>
                <span className="text-blue-600 dark:text-blue-300 opacity-100 flex items-center gap-2 bg-blue-100/50 dark:bg-blue-900/30 px-3 md:px-4 py-1.5 rounded-full border border-blue-200 dark:border-blue-500/30 shadow-sm whitespace-nowrap">
                  <span>{daysRemaining}</span> Days To Summit
                </span>
                <span>MAY 15</span>
              </div>
              <div className="w-full h-1 bg-black/5 dark:bg-white/10 rounded-full relative mt-4 overflow-hidden">
                <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-800 via-blue-500 to-teal-400 transition-all duration-1000" style={{ width: progressWidth }}></div>
              </div>
            </div>

            {/* Centerpiece */}
            <div className="relative w-full h-full flex items-center justify-center">
              <div className="avatar-shadow"></div>
              
              {/* Unified 3D Layer */}
              <div className="absolute inset-0">
                <Canvas camera={{ position: [0, 0, 10], fov: 45 }}>
                  <Suspense fallback={
                    <Html center>
                      <div className="text-blue-500 font-black text-[10px] uppercase tracking-widest animate-pulse">Loading Zen State...</div>
                    </Html>
                  }>
                    <PhysicsLoop 
                      engineRef={engineRef}
                      marblesRef={marblesRef}
                      currentMode={currentMode}
                      currentStyle={currentStyle}
                      handleOrbClick={handleOrbClick}
                      handleAvatarClick={handleAvatarClick}
                      playAcousticTap={playAcousticTap}
                      isDarkMode={isDarkMode}
                      orbitRotationRef={orbitRotationRef}
                    />
                  </Suspense>
                </Canvas>
              </div>

              {/* Avatar Labels */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-28 text-center pointer-events-none z-20">
                <h1 className="text-2xl md:text-4xl font-black tracking-[0.4em] text-blue-900 dark:text-blue-100 uppercase transition-colors duration-500">Zen Egg</h1>
                <p className="text-[8px] md:text-[10px] font-black tracking-[0.3em] text-blue-600 dark:text-blue-400 uppercase mt-2 transition-colors duration-500">Flow State</p>
              </div>

              {/* Labels (Overlay) */}
              {currentMode === 'orbit' && PILLARS.map((orb, i) => {
                const angle = orbitRotationRef.current + (i / PILLARS.length) * (Math.PI * 2);
                const x = Math.cos(angle) * 3;
                const y = Math.sin(angle) * 3;
                return (
                  <div 
                    key={orb.id}
                    className="absolute pointer-events-none text-[8px] md:text-[10px] font-black tracking-[0.2em] text-center opacity-70 uppercase font-mono select-none text-white"
                    style={{ 
                      left: `calc(50% + ${x * 50}px)`, 
                      top: `calc(50% - ${y * 50}px)`,
                      transform: 'translate(-50%, 20px)'
                    }}
                  >
                    {orb.label}
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="absolute bottom-6 md:bottom-10 text-[8px] md:text-[10px] opacity-40 uppercase tracking-[0.5em] md:tracking-[1em] font-black flex gap-6 md:gap-10 items-center select-none text-blue-800 dark:text-blue-300 justify-center w-full transition-colors duration-500">
              <span>Zen Egg Scholar</span>
              <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-blue-500 rounded-full animate-pulse"></span>
              <span>{currentDate}</span>
            </div>
          </div>
        </div>

        {/* Modals */}
        {modalInfo && (
          <>
            <div 
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-[600] cursor-pointer" 
              onClick={() => setModalInfo(null)}
            ></div>
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[92%] max-w-sm bg-[#0d0d10]/95 border border-white/10 backdrop-blur-3xl p-6 md:p-10 rounded-[2.5rem] z-[700] shadow-[0_40px_100px_rgba(0,0,0,0.8)] modal-enter text-gray-100">
              <div className="flex justify-between items-start mb-6 text-left">
                <div className="flex items-center gap-4">
                  <div 
                    className="w-14 h-14 md:w-20 md:h-20 rounded-[1.5rem] flex items-center justify-center bg-white/5 border border-white/10 shadow-inner overflow-hidden flex-shrink-0 text-3xl md:text-5xl"
                    style={{ color: modalInfo.color }}
                  >
                    {modalInfo.icon}
                  </div>
                  <div>
                    <h3 className="font-black text-lg md:text-3xl tracking-tight uppercase leading-none text-white">
                      {modalInfo.title}
                    </h3>
                  </div>
                </div>
                <button 
                  onClick={() => setModalInfo(null)} 
                  className="p-2 md:p-4 -mt-2 -mr-2 md:-mr-4 opacity-30 hover:opacity-100 transition-all hover:rotate-90 text-2xl md:text-4xl leading-none text-white"
                >
                  ✕
                </button>
              </div>
              <div className="bg-white/5 p-5 md:p-8 rounded-[1.5rem] border border-white/5 shadow-inner text-left">
                <p className="text-xs md:text-sm leading-relaxed text-gray-300 font-medium tracking-tight">
                  {modalInfo.text}
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </ErrorBoundary>
  );
}
