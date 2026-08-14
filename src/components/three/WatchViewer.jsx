import { Component, Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, useGLTF } from '@react-three/drei';

function WatchModel({ accent = '#D4AF37' }) {
  const group = useRef();
  const hourHand = useRef();
  const minuteHand = useRef();
  const secondHand = useRef();

  useFrame((_, delta) => {
    if (group.current) group.current.rotation.y += delta * 0.15;

    const now = new Date();
    const seconds = now.getSeconds() + now.getMilliseconds() / 1000;
    const minutes = now.getMinutes() + seconds / 60;
    const hours = (now.getHours() % 12) + minutes / 60;

    if (secondHand.current) secondHand.current.rotation.y = (seconds / 60) * Math.PI * 2;
    if (minuteHand.current) minuteHand.current.rotation.y = (minutes / 60) * Math.PI * 2;
    if (hourHand.current) hourHand.current.rotation.y = (hours / 12) * Math.PI * 2;
  });

  const strapSegments = [...Array(5)];

  return (
    <group ref={group}>
      {}
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[1.1, 1.1, 0.32, 64]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.9} roughness={0.22} envMapIntensity={1.4} />
      </mesh>
      {}
      <mesh position={[0, 0.17, 0]}>
        <cylinderGeometry args={[1.12, 1.12, 0.04, 64]} />
        <meshStandardMaterial color={accent} metalness={1} roughness={0.12} envMapIntensity={1.6} />
      </mesh>
      {}
      <mesh position={[0, 0.16, 0]}>
        <cylinderGeometry args={[0.95, 0.95, 0.02, 64]} />
        <meshStandardMaterial color="#050505" metalness={0.4} roughness={0.45} />
      </mesh>

      {}
      {[...Array(12)].map((_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        return (
          <mesh
            key={i}
            position={[Math.sin(angle) * 0.78, 0.18, Math.cos(angle) * 0.78]}
            rotation={[0, -angle, 0]}
          >
            <boxGeometry args={[0.03, 0.02, 0.12]} />
            <meshStandardMaterial color={accent} metalness={1} roughness={0.2} />
          </mesh>
        );
      })}

      {}
      <mesh position={[0.55, 0.185, 0]}>
        <boxGeometry args={[0.14, 0.01, 0.1]} />
        <meshStandardMaterial color="#f5f2ea" roughness={0.6} />
      </mesh>

      {}
      <group ref={hourHand} position={[0, 0.19, 0]}>
        <mesh position={[0, 0, 0.22]}>
          <boxGeometry args={[0.035, 0.012, 0.44]} />
          <meshStandardMaterial color={accent} metalness={0.9} roughness={0.2} />
        </mesh>
      </group>
      <group ref={minuteHand} position={[0, 0.2, 0]}>
        <mesh position={[0, 0, 0.32]}>
          <boxGeometry args={[0.028, 0.012, 0.64]} />
          <meshStandardMaterial color="#e8e8e8" metalness={0.7} roughness={0.25} />
        </mesh>
      </group>
      <group ref={secondHand} position={[0, 0.21, 0]}>
        <mesh position={[0, 0, 0.28]}>
          <boxGeometry args={[0.01, 0.012, 0.68]} />
          <meshStandardMaterial color="#c0392b" metalness={0.5} roughness={0.3} />
        </mesh>
      </group>
      {}
      <mesh position={[0, 0.21, 0]}>
        <cylinderGeometry args={[0.035, 0.035, 0.04, 16]} />
        <meshStandardMaterial color={accent} metalness={1} roughness={0.15} />
      </mesh>

      {}
      <mesh position={[1.16, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.08, 0.08, 0.12, 16]} />
        <meshStandardMaterial color={accent} metalness={1} roughness={0.18} />
      </mesh>

      {}
      {[1, -1].map((side) => (
        <group key={side}>
          <mesh position={[-0.35, 0, side * 1.08]} rotation={[0, 0, 0.5 * side]}>
            <boxGeometry args={[0.3, 0.12, 0.14]} />
            <meshStandardMaterial color="#1a1a1a" metalness={0.85} roughness={0.3} />
          </mesh>
          <mesh position={[0.35, 0, side * 1.08]} rotation={[0, 0, -0.5 * side]}>
            <boxGeometry args={[0.3, 0.12, 0.14]} />
            <meshStandardMaterial color="#1a1a1a" metalness={0.85} roughness={0.3} />
          </mesh>
        </group>
      ))}

      {}
      {[1, -1].map((side) => (
        <group key={side}>
          {strapSegments.map((_, i) => {
            const t = i / (strapSegments.length - 1);
            const curve = Math.sin(t * Math.PI * 0.55) * 0.9;
            return (
              <mesh
                key={i}
                position={[0, -curve * 0.5, side * (1.25 + t * 1.3)]}
                rotation={[curve * 0.9, 0, 0]}
              >
                <boxGeometry args={[0.62, 0.09, 0.42]} />
                <meshStandardMaterial color="#2b1c14" metalness={0.05} roughness={0.85} />
              </mesh>
            );
          })}
        </group>
      ))}
    </group>
  );
}

function ScannedWatchModel({ modelUrl }) {
  const { scene } = useGLTF(modelUrl);
  const group = useRef();
  useFrame((_, delta) => { if (group.current) group.current.rotation.y += delta * 0.15; });
  return <primitive ref={group} object={scene} />;
}

class ModelFallbackBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export default function WatchViewer({ accent = '#D4AF37', className = '', modelUrl = null }) {
  return (
    <div className={`watch-viewer ${className}`}>
      <Canvas shadows camera={{ position: [2.6, 1.6, 2.6], fov: 40 }} dpr={[1, 1.5]}>
        <Suspense fallback={null}>
          <ambientLight intensity={0.4} />
          <directionalLight position={[3, 5, 2]} intensity={1.2} castShadow />
          {modelUrl ? (
            <ModelFallbackBoundary fallback={<WatchModel accent={accent} />}>
              <ScannedWatchModel modelUrl={modelUrl} />
            </ModelFallbackBoundary>
          ) : (
            <WatchModel accent={accent} />
          )}
          <ContactShadows position={[0, -0.55, 0]} opacity={0.5} blur={2.5} scale={7} />
          <Environment preset="city" />
          <OrbitControls
            enablePan={false}
            minDistance={2.2}
            maxDistance={4.5}
            maxPolarAngle={Math.PI / 2.1}
          />
        </Suspense>
      </Canvas>
      <p className="watch-viewer__hint">
        Drag to rotate · Scroll to zoom{!modelUrl && ' · Hands show the real time'}
      </p>
    </div>
  );
}
