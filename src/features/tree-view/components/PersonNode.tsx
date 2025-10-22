import { memo } from 'react';
import { Handle, Position } from 'reactflow';

type PersonNodeData = {
  label: string;
};

function PersonNode({ data }: { data: PersonNodeData }) {
  return (
    <>
      {/* 1. Handle ATAS (Masuk) - Untuk Orang Tua */}
      <Handle 
        type="target"
        position={Position.Top} 
        id="top"
        className="w-2 h-2 !bg-gray-400"
      />
      
      {/* 2. Handle KIRI (Masuk) - Untuk Pasangan */}
      <Handle 
        type="target" 
        position={Position.Left}
        id="left"
        className="w-2 h-2 !bg-gray-400"
      />

      {/* Tampilan Node Anda */}
      <div className="px-4 py-2 shadow-md rounded-lg bg-white border-2 border-primary-500 w-40">
        <div className="text-sm font-bold text-brand-700 text-center">
          {data.label}
        </div>
      </div>

      {/* 3. Handle KANAN (Keluar) - Untuk Pasangan */}
      <Handle 
        type="source"
        position={Position.Right}
        id="right"
        className="w-2 h-2 !bg-gray-400"
      />

      {/* 4. Handle BAWAH (Keluar) - Untuk Anak */}
      <Handle 
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="w-2 h-2 !bg-gray-400"
      />
    </>
  );
}

export default memo(PersonNode);