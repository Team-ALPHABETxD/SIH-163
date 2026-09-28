import React, { useCallback } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

interface AttackGraphCanvasProps {
  initialNodes: Node[];
  initialEdges: Edge[];
}

export const AttackGraphCanvas: React.FC<AttackGraphCanvasProps> = ({ initialNodes, initialEdges }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  return (
    <div style={{ width: '100%', height: '100%', minHeight: '500px' }} className="bg-[#0b1120] border border-slate-800 rounded-lg overflow-hidden relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
        colorMode="dark"
      >
        <Controls />
        <MiniMap nodeStrokeWidth={3} maskColor="rgba(11, 17, 32, 0.8)" style={{ backgroundColor: '#060913' }} />
        <Background gap={16} size={1} color="#312e81" />
      </ReactFlow>
    </div>
  );
};
