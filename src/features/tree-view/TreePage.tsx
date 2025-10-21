import { useState, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import 'reactflow/dist/style.css';
import PersonNode from './components/PersonNode';

// 1. Impor React Flow
import ReactFlow, {
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  ConnectionLineType,
  MiniMap,
  BackgroundVariant,
} from 'reactflow';

import type { 
  Node, 
  Edge, 
  NodeChange, 
  EdgeChange 
} from 'reactflow';

// Kita definisikan posisi (x, y) secara manual untuk contoh ini
const initialNodes: Node[] = [
  // Generasi 1: Kakek-Nenek
  {
    id: '1',
    type: 'personNode',
    data: { label: 'Kakek (dari Ayah)' },
    position: { x: 0, y: 0 },
  },
  {
    id: '2',
    type: 'personNode',
    data: { label: 'Nenek (dari Ayah)' },
    position: { x: 170, y: 0 }, // Lebar node 160px + gap 10px
  },
  {
    id: '3',
    type: 'personNode',
    data: { label: 'Kakek (dari Ibu)' },
    position: { x: 340, y: 0 },
  },
  {
    id: '4',
    type: 'personNode',
    data: { label: 'Nenek (dari Ibu)' },
    position: { x: 510, y: 0 },
  },
  
  // Generasi 2: Orang Tua
  {
    id: '5',
    type: 'personNode',
    data: { label: 'Ayah' },
    position: { x: 85, y: 120 }, // Di tengah Kakek/Nenek (Ayah)
  },
  {
    id: '6',
    type: 'personNode',
    data: { label: 'Ibu' },
    position: { x: 425, y: 120 }, // Di tengah Kakek/Nenek (Ibu)
  },

  // Generasi 3: Kamu
  {
    id: '7',
    type: 'personNode',
    data: { label: 'Kamu' },
    position: { x: 255, y: 240 }, // Di tengah Ayah/Ibu
  },
];

const initialEdges: Edge[] = [
  // --- Hubungan Pasangan (Generasi 1) ---
  { 
    id: 'e1-2', 
    source: '1', // Kakek (Ayah)
    target: '2', // Nenek (Ayah)
    sourceHandle: 'right', // Keluar dari sisi kanan Kakek
    targetHandle: 'left',  // Masuk ke sisi kiri Nenek
    label: 'pasangan', 
    type: 'smoothstep' 
  },
  { 
    id: 'e3-4', 
    source: '3', // Kakek (Ibu)
    target: '4', // Nenek (Ibu)
    sourceHandle: 'right',
    targetHandle: 'left',
    label: 'pasangan', 
    type: 'smoothstep' 
  },

  // --- Hubungan Pasangan (Generasi 2) ---
  { 
    id: 'e5-6', 
    source: '5', // Ayah
    target: '6', // Ibu
    sourceHandle: 'right',
    targetHandle: 'left',
    label: 'pasangan', 
    type: 'smoothstep' 
  },

  // --- Hubungan Anak (dari Gen 1 ke Gen 2) ---
  { 
    id: 'e1-5', 
    source: '1', // Kakek (Ayah)
    target: '5', // Ayah
    sourceHandle: 'bottom', // Keluar dari bawah Kakek
    targetHandle: 'top',   // Masuk ke atas Ayah
    label: 'anak', 
    type: 'smoothstep' 
  },
  { 
    id: 'e2-5', 
    source: '2', // Nenek (Ayah)
    target: '5', // Ayah
    sourceHandle: 'bottom',
    targetHandle: 'top',
    label: 'anak', 
    type: 'smoothstep' 
  },
  { 
    id: 'e3-6', 
    source: '3', // Kakek (Ibu)
    target: '6', // Ibu
    sourceHandle: 'bottom',
    targetHandle: 'top',
    label: 'anak', 
    type: 'smoothstep' 
  },
  { 
    id: 'e4-6', 
    source: '4', // Nenek (Ibu)
    target: '6', // Ibu
    sourceHandle: 'bottom',
    targetHandle: 'top',
    label: 'anak', 
    type: 'smoothstep' 
  },
  
  // --- Hubungan Anak (dari Gen 2 ke Gen 3) ---
  { 
    id: 'e5-7', 
    source: '5', // Ayah
    target: '7', // Kamu
    sourceHandle: 'bottom',
    targetHandle: 'top',
    label: 'anak', 
    type: 'smoothstep' 
  },
  { 
    id: 'e6-7', 
    source: '6', // Ibu
    target: '7', // Kamu
    sourceHandle: 'bottom',
    targetHandle: 'top',
    label: 'anak', 
    type: 'smoothstep' 
  },
];


export function TreePage() {
  const { personId } = useParams(); // Ambil ID dari URL (jika perlu fetch data)
  
  // 4. Daftarkan tipe node kustom Anda
  // Gunakan useMemo agar tidak dibuat ulang setiap render
  const nodeTypes = useMemo(() => ({
    personNode: PersonNode,
  }), []);

  // 5. State untuk menyimpan nodes dan edges
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);

  // 6. Fungsi-fungsi bawaan React Flow untuk mengelola state
  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [setNodes]
  );
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [setEdges]
  );
  
  // TODO: Nanti di sini Anda pakai useEffect untuk fetch data
  // berdasarkan personId dan memanggil setNodes/setEdges

  return (
    <>
      <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-brand-700">
            Family Tree
            </h1>
            {/* Tampilkan root ID jika ada */}
            {personId && <span className="text-sm text-gray-500">Root ID: {personId}</span>}
        </div>
        
        {/* 7. Tentukan ukuran kanvas (WAJIB) */}
        <div 
            style={{ height: '70vh' }} // vh = viewport height (70% tinggi layar)
            className="bg-white rounded-xl shadow-md border border-gray-200"
        >
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                nodeTypes={nodeTypes} // Beri tahu React Flow soal node kustom
                fitView // Otomatis zoom agar semua node terlihat
                fitViewOptions={{ padding: 0.8 }}
                connectionLineType={ConnectionLineType.SmoothStep} // Jenis garis
                className="rounded-xl" // Pastikan pas dengan container
            >
            {/* Kontrol UI (Zoom, FitView) */}
            <Controls />
            
            {/* Peta Mini (Minimap) */}
            <MiniMap nodeColor="#6AA86A" nodeStrokeWidth={3} zoomable pannable />
            
            {/* Latar Belakang (Grid/Dots) */}
            <Background color="#ccc" variant={BackgroundVariant.Dots} gap={12} size={1} />
            </ReactFlow>
        </div>
      </>
  );
}