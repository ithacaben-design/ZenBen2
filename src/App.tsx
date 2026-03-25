/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial, Environment, PerspectiveCamera, Cylinder, Box, Torus, TorusKnot, Octahedron } from '@react-three/drei';
import * as THREE from 'three';
import Matter from 'matter-js';

const DIALOGUE: Record<string, string[]> = {
  sleep: ["Rest restores the mind", "Enter the quiet", "Dream to resolve"],
  sunlight: ["Seek the morning light", "Warmth anchors the clock", "Clarity follows the sun"],
  movement: ["Energy flows with action", "Strengthen the vessel", "Motion is medicine"],
  nutrition: ["Fuel with intent", "Simplicity sustains", "Nourish the core"],
  relationships: ["Connection is life", "Presence is a gift", "We grow together"]
};

const PILLARS = [
  { id: 'sleep', label: 'MATH 117', color: '#e67e22', shape: 'TorusKnot', args: [0.2, 0.06, 64, 8], info: "Module 6 (Statistics) online. Current Standing: 90.9% (A)." },
  { id: 'sunlight', label: 'PSYC 103', color: '#2980b9', shape: 'Octahedron', args: [0.3], info: "Week 5 Discussion completed. Brain Assignment graded: 30/30!" },
  { id: 'movement', label: 'HUMS 105', color: '#27ae60', shape: 'Sphere', args: [0.3, 32, 32], info: "Standing: 163.5/172.5 (A). Quiz #6 due SUN." },
  { id: 'nutrition', label: 'ENGL 100', color: '#16a085', shape: 'Cylinder', args: [0.2, 0.2, 0.4, 16], info: "99/100 Essay 1! Standing: 272/285 (A)." },
  { id: 'relationships', label: 'MATH 017', color: '#c0392b', shape: 'Torus', args: [0.2, 0.1, 16, 32], info: "Support modules running. Ahead of schedule in Probability." }
];

const INSET_MODES = [
  { id: 'orbit', color: '#a855f7', label: 'Orbit' },
  { id: 'sandbox', color: '#777777', label: 'Sandbox' },
  { id: 'billiards', color: '#1a5e20', label: 'Billiards' },
  { id: 'pinball', color: '#22c55e', label: 'Pinball' },
  { id: 'maze', color: '#3b82f6', label: 'Maze' },
  { id: 'koi', color: '#ffffff', label: 'Koi' }
];

function MarbleMesh({ orb, body, currentMode, currentStyle, fillLevel, onClick }: { orb: any, body: Matter.Body, currentMode: string, currentStyle: string, fillLevel: number, onClick: () => void }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (meshRef.current && body) {
      meshRef.current.position.x = body.position.x;
      meshRef.current.position.y = -body.position.y;
      if (currentMode !== 'koi') {
        meshRef.current.rotation.z = -body.angle;
      } else {
        meshRef.current.rotation.x += 0.004;
        meshRef.current.rotation.y += 0.004;
      }
      if (coreRef.current) {
        coreRef.current.position.copy(meshRef.current.position);
        coreRef.current.rotation.copy(meshRef.current.rotation);
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
    <group>
      {/* Caustic Glow */}
      <mesh position={[body.position.x, -body.position.y, -0.1]}>
        <circleGeometry args={[0.6, 32]} />
        <meshBasicMaterial color={orb.color} transparent opacity={0.15} />
      </mesh>
      
      {/* Liquid Core */}
      <ShapeComponent ref={coreRef} args={orb.args.map((a: any) => typeof a === 'number' ? a * 0.9 : a)}>
        <meshStandardMaterial color={orb.color} emissive={orb.color} emissiveIntensity={0.5} />
      </ShapeComponent>

      <ShapeComponent 
        ref={meshRef} 
        args={orb.args} 
        castShadow 
        onClick={(e: any) => {
          e.stopPropagation();
          onClick();
        }}
      >
        <meshPhysicalMaterial {...materialProps} />
      </ShapeComponent>
    </group>
  );
}

function AvatarSphere({ onClick }: { onClick: () => void }) {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.005;
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.05;
    }
  });

  return (
    <group ref={groupRef} onClick={(e) => { e.stopPropagation(); onClick(); }}>
      <Sphere args={[1.4, 64, 64]}>
        <MeshDistortMaterial 
          color="#10b981" 
          attach="material" 
          distort={0.3} 
          speed={2} 
          roughness={0.2} 
          metalness={0.8} 
        />
      </Sphere>
    </group>
  );
}

export default function App() {
  const [isWoken, setIsWoken] = useState(false);
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
  const orbitRotationRef = useRef(0);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Initialize Physics Engine
  useEffect(() => {
    const engine = Matter.Engine.create();
    engine.gravity.y = 0;
    engineRef.current = engine;

    const runner = Matter.Runner.create();
    Matter.Runner.run(runner, engine);

    // Create marbles
    const marbles = PILLARS.map((pillar, i) => {
      const angle = (i / PILLARS.length) * (Math.PI * 2);
      const x = Math.cos(angle) * 3;
      const y = Math.sin(angle) * 3;
      const body = Matter.Bodies.circle(x, y, 0.3, { 
        restitution: 0.6, 
        friction: 0.001, 
        density: 0.05, 
        isSensor: true 
      });
      Matter.Composite.add(engine.world, body);
      return { id: pillar.id, body, fillLevel: 0, logs: 0 };
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

    return () => {
      Matter.Engine.clear(engine);
      Matter.Runner.stop(runner);
    };
  }, []);

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

    const endOfSemester = new Date('2026-05-15');
    const diffTime = Math.abs(endOfSemester.getTime() - today.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    setDaysRemaining(diffDays.toString());
    
    setTimeout(() => {
      setProgressWidth('59.5%');
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
    setModalInfo({
      title: orb.label,
      text: orb.info,
      icon: '🔮',
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
  function PhysicsLoop() {
    useFrame((state) => {
      if (!engineRef.current) return;

      if (currentMode === 'orbit') {
        orbitRotationRef.current += 0.005;
        marblesRef.current.forEach((m, i) => {
          const angle = orbitRotationRef.current + (i / PILLARS.length) * (Math.PI * 2);
          const targetX = Math.cos(angle) * 3;
          const targetY = Math.sin(angle) * 3;
          Matter.Body.setPosition(m.body, { x: targetX, y: targetY });
        });
      }
    });

    useEffect(() => {
      if (!engineRef.current) return;
      
      if (currentMode === 'pinball') {
        engineRef.current.gravity.y = 1.2;
      } else if (currentMode === 'sandbox' || currentMode === 'maze') {
        engineRef.current.gravity.y = 1.0;
      } else {
        engineRef.current.gravity.y = 0;
      }

      marblesRef.current.forEach(m => {
        m.body.isSensor = (currentMode === 'orbit' || currentMode === 'koi');
      });
    }, [currentMode]);

    return (
      <group>
        <AvatarSphere onClick={handleAvatarClick} />
        
        {marblesRef.current.map((m, i) => (
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
    <div className="w-full h-full relative overflow-hidden bg-[#050505]">
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
      <div id="style-menu" className="z-[500]">
        <button onClick={() => setCurrentStyle('cats-eye')} className={`style-btn ${currentStyle === 'cats-eye' ? 'active' : ''}`}>Cat's Eye</button>
        <button onClick={() => setCurrentStyle('vanilla')} className={`style-btn ${currentStyle === 'vanilla' ? 'active' : ''}`}>Vanilla</button>
        <button onClick={() => setCurrentStyle('crystal')} className={`style-btn ${currentStyle === 'crystal' ? 'active' : ''}`}>Crystal</button>
      </div>

      {/* MODE MENU */}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 flex gap-2 z-[500] bg-black/40 backdrop-blur-lg p-2 rounded-full border border-white/10 overflow-x-auto max-w-[90vw] no-scrollbar">
        {INSET_MODES.map(mode => (
          <button
            key={mode.id}
            onClick={() => unlockedModes.includes(mode.id) && setCurrentMode(mode.id)}
            className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${
              currentMode === mode.id 
                ? 'bg-white/20 text-white shadow-lg' 
                : unlockedModes.includes(mode.id) 
                  ? 'text-white/40 hover:text-white/60' 
                  : 'text-white/10 cursor-not-allowed'
            }`}
          >
            {mode.label}
          </button>
        ))}
      </div>

      {/* MAIN 3D DASHBOARD */}
      <div id="perspective-root">
        <div id="marble-floor"></div>

        <div id="dashboard-ui" className="w-full h-full relative flex flex-col items-center justify-center z-10">
          
          {/* Header */}
          <div className="absolute top-4 md:top-8 w-full max-w-2xl px-4 md:px-6 z-50">
            <div className="flex justify-between text-[8px] md:text-[10px] tracking-[0.2em] md:tracking-[0.5em] opacity-60 mb-3 font-black uppercase text-gray-400">
              <span>JAN 21</span>
              <span className="text-emerald-300 opacity-100 flex items-center gap-2 bg-emerald-900/30 px-3 md:px-4 py-1.5 rounded-full border border-emerald-500/30 shadow-sm whitespace-nowrap">
                <span>{daysRemaining}</span> Days To Summit
              </span>
              <span>MAY 15</span>
            </div>
            <div className="w-full h-1 bg-white/10 rounded-full relative mt-4 overflow-hidden">
              <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-800 via-emerald-500 to-teal-400 transition-all duration-1000" style={{ width: progressWidth }}></div>
            </div>
          </div>

          {/* Centerpiece */}
          <div className="relative w-full h-full flex items-center justify-center">
            <div id="orbit-guide"></div>
            <div className="avatar-shadow"></div>
            
            {/* Unified 3D Layer */}
            <div className="absolute inset-0">
              <Canvas camera={{ position: [0, 0, 10], fov: 45 }}>
                <PhysicsLoop />
              </Canvas>
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
          <div className="absolute bottom-6 md:bottom-10 text-[8px] md:text-[10px] opacity-40 uppercase tracking-[0.5em] md:tracking-[1em] font-black flex gap-6 md:gap-10 items-center select-none text-emerald-500 justify-center w-full">
            <span>Zen Bear Scholar</span>
            <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-emerald-500 rounded-full animate-pulse"></span>
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
  );
}
