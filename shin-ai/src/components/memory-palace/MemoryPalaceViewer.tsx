'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Box, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

interface Room {
  id: string;
  name: string;
  position: { x: number; y: number; z: number };
  dimensions: { width: number; height: number; depth: number };
  color?: string;
  imageUrl?: string;
}

interface MemoryPalaceViewerProps {
  rooms: Room[];
  onRoomClick?: (roomId: string) => void;
  className?: string;
}

function RoomMesh({ room, onClick }: { room: Room; onClick?: (roomId: string) => void }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      // Subtle animation for visual appeal
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });

  const handleClick = () => {
    if (onClick) {
      onClick(room.id);
    }
  };

  return (
    <group position={[room.position.x, room.position.y, room.position.z]}>
      <Box
        ref={meshRef}
        args={[room.dimensions.width, room.dimensions.height, room.dimensions.depth]}
        onClick={handleClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto';
        }}
      >
        <meshStandardMaterial
          color={room.color || '#8B5CF6'}
          transparent
          opacity={0.8}
        />
      </Box>
      <Text
        position={[0, room.dimensions.height / 2 + 1, 0]}
        fontSize={0.5}
        color="white"
        anchorX="center"
        anchorY="middle"
        onClick={handleClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto';
        }}
      >
        {room.name}
      </Text>
    </group>
  );
}

export default function MemoryPalaceViewer({
  rooms,
  onRoomClick,
  className = ''
}: MemoryPalaceViewerProps) {
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);

  const handleRoomClick = (roomId: string) => {
    setSelectedRoom(roomId);
    if (onRoomClick) {
      onRoomClick(roomId);
    }
  };

  if (rooms.length === 0) {
    return (
      <div className={`flex items-center justify-center h-96 bg-gray-100 rounded-lg ${className}`}>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            No Rooms Available
          </h3>
          <p className="text-gray-500">
            Add rooms to visualize your memory palace
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <Canvas
        camera={{ position: [10, 10, 10], fov: 60 }}
        style={{ height: '500px', width: '100%' }}
      >
        <PerspectiveCamera makeDefault position={[10, 10, 10]} />

        {/* Lighting */}
        <ambientLight intensity={0.6} />
        <directionalLight
          position={[10, 10, 5]}
          intensity={1}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />

        {/* Grid helper for reference */}
        <gridHelper args={[20, 20]} />

        {/* Render rooms */}
        {rooms.map((room) => (
          <RoomMesh
            key={room.id}
            room={room}
            onClick={handleRoomClick}
          />
        ))}

        {/* Controls */}
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={5}
          maxDistance={50}
        />
      </Canvas>

      {/* Room Information Panel */}
      {selectedRoom && (
        <div className="absolute top-4 right-4 bg-white p-4 rounded-lg shadow-lg border max-w-xs">
          <h3 className="font-semibold text-gray-900 mb-2">Selected Room</h3>
          {(() => {
            const room = rooms.find(r => r.id === selectedRoom);
            return room ? (
              <div className="space-y-1 text-sm text-gray-600">
                <p><strong>Name:</strong> {room.name}</p>
                <p><strong>Position:</strong> ({room.position.x.toFixed(1)}, {room.position.y.toFixed(1)}, {room.position.z.toFixed(1)})</p>
                <p><strong>Size:</strong> {room.dimensions.width.toFixed(1)} × {room.dimensions.height.toFixed(1)} × {room.dimensions.depth.toFixed(1)}</p>
              </div>
            ) : null;
          })()}
        </div>
      )}

      {/* Controls Help */}
      <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-lg border text-sm text-gray-600">
        <p className="font-semibold mb-1">Controls:</p>
        <p>• Left click + drag: Rotate</p>
        <p>• Right click + drag: Pan</p>
        <p>• Scroll: Zoom</p>
        <p>• Click rooms: Select</p>
      </div>
    </div>
  );
}