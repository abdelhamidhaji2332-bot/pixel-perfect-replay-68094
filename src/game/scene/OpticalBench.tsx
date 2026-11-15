import { Canvas, useFrame } from "@react-three/fiber";
import { Billboard, Line, OrbitControls, Text } from "@react-three/drei";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { MAX_DISTANCE_CM } from "../sim/physics";

export type CameraView = "iso" | "top" | "focus";

type OpticalBenchProps = {
  distance: number;
  onDistanceChange: (distance: number) => void;
  running: boolean;
  cameraView: CameraView;
  ready?: () => void;
};

const SENSOR_X = -5.35;
const pointToDistance = (x: number) => Math.max(0, Math.min(MAX_DISTANCE_CM, (x - SENSOR_X) * 10));

function BenchModel({ distance, onDistanceChange, running, cameraView }: OpticalBenchProps) {
  const target = useRef<THREE.Group>(null);
  const orbit = useRef<any>(null);
  const isDragging = useRef(false);
  const hitPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.67), []);
  const hitPoint = useMemo(() => new THREE.Vector3(), []);
  const start = useRef(0);
  const range = useMemo(() => Array.from({ length: 121 }, (_, index) => index), []);

  useEffect(() => {
    if (!orbit.current) return;
    const presets: Record<CameraView, { position: THREE.Vector3; target: THREE.Vector3 }> = {
      iso: { position: new THREE.Vector3(0, 8.8, 13.6), target: new THREE.Vector3(0.1, 0.35, 0) },
      top: { position: new THREE.Vector3(0, 17, 0.15), target: new THREE.Vector3(0, 0, 0) },
      focus: { position: new THREE.Vector3(-2.1, 5.5, 7.2), target: new THREE.Vector3(-3.7, 0.5, 0) },
    };
    const preset = presets[cameraView];
    orbit.current.object.position.copy(preset.position);
    orbit.current.target.copy(preset.target);
    orbit.current.update();
  }, [cameraView]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    if (target.current) {
      const desiredX = SENSOR_X + distance / 10;
      target.current.position.x += (desiredX - target.current.position.x) * (1 - Math.exp(-12 * dt));
    }
    if (isDragging.current && target.current && orbit.current) {
      state.raycaster.ray.intersectPlane(hitPlane, hitPoint);
      const x = THREE.MathUtils.clamp(hitPoint.x, SENSOR_X + 0.2, SENSOR_X + 12);
      onDistanceChange(pointToDistance(x));
      target.current.position.x = x;
    }
    start.current += dt * (running ? 1 : 0);
  });

  const beginDrag = (event: any) => {
    event.stopPropagation();
    isDragging.current = true;
    if (orbit.current) orbit.current.enabled = false;
    event.target.setPointerCapture?.(event.pointerId);
  };
  const endDrag = () => {
    isDragging.current = false;
    if (orbit.current) orbit.current.enabled = true;
  };

  return (
    <>
      <color attach="background" args={["#0a1018"]} />
      <fog attach="fog" args={["#0a1018", 18, 38]} />
      <ambientLight intensity={1.1} />
      <hemisphereLight args={["#e7f5ff", "#40545b", 1.35]} />
      <directionalLight position={[1, 9, 5]} intensity={3.2} color="#d8edf3" />
      <pointLight position={[-5.2, 1.1, 1.1]} intensity={8} distance={7} color="#38bdf8" />
      <pointLight position={[4, 4, -3]} intensity={5} distance={10} color="#69d6aa" />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.9, 0]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#0a1118" roughness={0.92} />
      </mesh>
      <gridHelper args={[36, 72, "#293a40", "#18272e"]} position={[0, -0.88, 0]} />

      <mesh position={[0.65, -0.08, 0]} castShadow receiveShadow>
        <boxGeometry args={[12.6, 0.42, 2.15]} />
        <meshStandardMaterial color="#27323a" metalness={0.78} roughness={0.32} />
      </mesh>
      <mesh position={[0.65, 0.15, 0]}>
        <boxGeometry args={[12.4, 0.08, 1.92]} />
        <meshStandardMaterial color="#62747a" metalness={0.76} roughness={0.28} />
      </mesh>
      <mesh position={[-1.65, 0.205, 0]}>
        <boxGeometry args={[5.3, 0.025, 1.58]} />
        <meshBasicMaterial color="#25a7a5" transparent opacity={0.24} />
      </mesh>
      <mesh position={[5.12, 0.205, 0]}>
        <boxGeometry args={[2.2, 0.025, 1.58]} />
        <meshBasicMaterial color="#dd7563" transparent opacity={0.28} />
      </mesh>
      <mesh position={[-5.08, 0.21, 0]}>
        <boxGeometry args={[0.52, 0.025, 1.6]} />
        <meshBasicMaterial color="#e26c69" transparent opacity={0.48} />
      </mesh>

      {range.map((cm) => {
        const x = SENSOR_X + cm / 10;
        const major = cm % 10 === 0;
        const medium = cm % 5 === 0;
        const height = major ? 0.3 : medium ? 0.19 : 0.1;
        return (
          <group key={cm} position={[x, 0.22, 0.79]}>
            <mesh position={[0, height / 2, 0]}>
              <boxGeometry args={[major ? 0.019 : 0.011, height, 0.025]} />
              <meshBasicMaterial color={major ? "#d9e4df" : "#97aaa6"} />
            </mesh>
            {major && <Text position={[0, 0.39, 0.02]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.16} color="#d9e4df" anchorX="center">{cm}</Text>}
          </group>
        );
      })}
      <Text position={[0.5, 0.45, 1.05]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.17} color="#a7b7b2" anchorX="center">DISTANCE · cm</Text>
      <Text position={[-2.75, 0.34, -0.78]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.15} color="#76d8c2" anchorX="center">PLAGE LINÉAIRE</Text>
      <Text position={[-5.05, 0.35, -0.78]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.12} color="#f29a89" anchorX="center">ZONE MORTE</Text>
      <Text position={[5.15, 0.35, -0.78]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.12} color="#e6b270" anchorX="center">SATURATION</Text>

      <group position={[SENSOR_X - 0.65, 0.85, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.92, 1.15, 1.08]} />
          <meshStandardMaterial color="#303e46" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[0.49, 0.1, -0.25]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.2, 0.2, 0.42, 32]} />
          <meshStandardMaterial color="#9eb1ad" metalness={0.88} roughness={0.2} />
        </mesh>
        <mesh position={[0.49, 0.1, 0.25]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.2, 0.2, 0.42, 32]} />
          <meshStandardMaterial color="#809795" metalness={0.86} roughness={0.24} />
        </mesh>
        <mesh position={[0.74, 0.12, -0.25]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.13, 0.13, 0.025, 32]} />
          <meshStandardMaterial color="#43c8d3" emissive="#38bdf8" emissiveIntensity={2.4} />
        </mesh>
        <mesh position={[0.74, 0.12, 0.25]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.13, 0.13, 0.025, 32]} />
          <meshStandardMaterial color="#9de6ba" emissive="#34bd8a" emissiveIntensity={1.4} />
        </mesh>
        <mesh position={[0, 0.59, 0.43]}>
          <sphereGeometry args={[0.075, 16, 16]} />
          <meshStandardMaterial color="#83edba" emissive="#63e9aa" emissiveIntensity={4} />
        </mesh>
        <Text position={[0, 0.82, 0.6]} fontSize={0.16} color="#d7e1df" anchorX="center">ÉMETTEUR</Text>
      </group>

      <group ref={target} position={[SENSOR_X + distance / 10, 0.74, 0]} onPointerDown={beginDrag} onPointerMove={(event) => { if (isDragging.current) event.stopPropagation(); }} onPointerUp={endDrag} onPointerCancel={endDrag} onLostPointerCapture={endDrag} onPointerOut={endDrag}>
        <mesh castShadow>
          <boxGeometry args={[0.18, 1.05, 1.52]} />
          <meshStandardMaterial color="#d0d5d0" metalness={0.82} roughness={0.27} />
        </mesh>
        <mesh position={[-0.12, 0, 0]}>
          <boxGeometry args={[0.05, 0.84, 1.22]} />
          <meshStandardMaterial color="#859493" metalness={0.82} roughness={0.22} />
        </mesh>
        <mesh position={[0, -0.58, 0]}>
          <boxGeometry args={[0.65, 0.18, 1.84]} />
          <meshStandardMaterial color="#44545b" metalness={0.82} roughness={0.31} />
        </mesh>
        <mesh position={[0, 0.59, 0]}>
          <boxGeometry args={[0.16, 0.13, 1.67]} />
          <meshStandardMaterial color="#f1c274" metalness={0.68} roughness={0.24} emissive="#bb7139" emissiveIntensity={0.28} />
        </mesh>
        <Billboard position={[0, 1.08, 0]}>
          <Text fontSize={0.19} color="#f4f2e8" anchorX="center">CIBLE · {distance.toFixed(1)} cm</Text>
        </Billboard>
      </group>

      {running && <WavePackets distance={distance} />}
      <OrbitControls ref={orbit} enableDamping dampingFactor={0.08} minDistance={6} maxDistance={24} maxPolarAngle={Math.PI / 2.02} target={[0, 0.35, 0]} />
      <EffectComposer multisampling={0}><Bloom luminanceThreshold={1.5} intensity={0.32} mipmapBlur /></EffectComposer>
    </>
  );
}

function WavePackets({ distance }: { distance: number }) {
  const packets = useRef<THREE.Group>(null);
  const outbound = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const period = 2.4;
    const phase = (clock.elapsedTime % period) / period;
    const targetX = SENSOR_X + distance / 10;
    const outboundProgress = phase < 0.52 ? phase / 0.52 : 1;
    const returnProgress = phase >= 0.52 ? (phase - 0.52) / 0.48 : 0;
    if (outbound.current) {
      outbound.current.position.x = SENSOR_X + 0.55 + outboundProgress * Math.max(0.12, targetX - SENSOR_X - 0.8);
      outbound.current.visible = phase < 0.52;
    }
    if (packets.current) {
      packets.current.position.x = phase >= 0.52 ? targetX - 0.35 - returnProgress * Math.max(0.12, targetX - SENSOR_X - 0.8) : targetX - 0.35;
      packets.current.visible = phase >= 0.52;
    }
  });
  return (
    <>
      <group ref={outbound}>
        <mesh rotation={[0, Math.PI / 2, 0]}><torusGeometry args={[0.3, 0.025, 8, 36]} /><meshBasicMaterial color="#54daf4" toneMapped={false} /></mesh>
        <mesh rotation={[0, Math.PI / 2, 0]}><torusGeometry args={[0.48, 0.012, 8, 36]} /><meshBasicMaterial color="#38bdf8" transparent opacity={0.48} toneMapped={false} /></mesh>
      </group>
      <group ref={packets}>
        <mesh rotation={[0, Math.PI / 2, 0]}><torusGeometry args={[0.31, 0.025, 8, 36]} /><meshBasicMaterial color="#7be6b5" toneMapped={false} /></mesh>
        <mesh rotation={[0, Math.PI / 2, 0]}><torusGeometry args={[0.47, 0.012, 8, 36]} /><meshBasicMaterial color="#46cd96" transparent opacity={0.48} toneMapped={false} /></mesh>
      </group>
      <Line points={[[SENSOR_X + 0.55, 0.97, -0.15], [SENSOR_X + distance / 10 - 0.35, 0.97, -0.15]]} color="#37c5dc" transparent opacity={0.15} lineWidth={1} />
    </>
  );
}

export function OpticalBench({ distance, onDistanceChange, running, cameraView, ready }: OpticalBenchProps) {
  return (
    <div className="bench-canvas" data-scene-ready="1">
      <Canvas shadows camera={{ position: [0, 8.8, 13.6], fov: 39 }} dpr={[1, 1.5]} onCreated={() => ready?.()}>
        <BenchModel distance={distance} onDistanceChange={onDistanceChange} running={running} cameraView={cameraView} />
      </Canvas>
      <div className="canvas-caption"><span className="caption-live"><i /> ONDES ACOUSTIQUES</span><span>c(T) = 331,3 + 0,606 T · m/s</span></div>
    </div>
  );
}