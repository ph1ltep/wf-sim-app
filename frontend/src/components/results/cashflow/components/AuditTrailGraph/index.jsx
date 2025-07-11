// frontend/src/components/results/cashflow/components/AuditTrailGraph/index.jsx
import React, { useCallback, useState, useMemo } from 'react';
import ReactFlow, {
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    ConnectionLineType,
    Panel
} from 'reactflow';
import { Alert, Card, Typography, Space } from 'antd';
import { useDependencyResolver } from './hooks/useDependencyResolver';
import { applyGraphLayout } from './utils/graphLayout';
import { nodeTypes } from './components/CustomNodes';
import StepDetailsPanel from './components/StepDetailsPanel';
import GraphLegend from './components/GraphLegend';
import 'reactflow/dist/style.css';

const { Text } = Typography;

// ✅ FIXED: Define edge types outside component to prevent re-creation
const edgeTypes = {};

const AuditTrailGraph = ({ sourceIds }) => {
    const { nodes: rawNodes, edges: rawEdges, auditData, isLoading, error } = useDependencyResolver(sourceIds);
    const [selectedNode, setSelectedNode] = useState(null);

    // Apply layout to nodes
    const layoutedNodes = useMemo(() => {
        if (rawNodes.length === 0) return [];
        return applyGraphLayout(rawNodes, rawEdges);
    }, [rawNodes, rawEdges]);

    // ✅ FIXED: Apply softer edge styling - memoized
    const styledEdges = useMemo(() => {
        return rawEdges.map(edge => ({
            ...edge,
            type: 'default',
            style: {
                stroke: '#d9d9d9',      // Softer gray
                strokeWidth: 1,         // Thinner line
                opacity: 0.8           // Slightly transparent
            },
            labelStyle: {
                fontSize: '10px',
                fontWeight: 'normal',   // Less bold
                color: '#666'
            }
        }));
    }, [rawEdges]);

    const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(styledEdges);

    // Update nodes when layout changes
    React.useEffect(() => {
        setNodes(layoutedNodes);
    }, [layoutedNodes, setNodes]);

    // Update edges when styled edges change
    React.useEffect(() => {
        setEdges(styledEdges);
    }, [styledEdges, setEdges]);

    const onNodeClick = useCallback((event, node) => {
        console.log('Node selected:', node.id);
        setSelectedNode(node);

        // Highlight selected node
        setNodes(nodes =>
            nodes.map(n => ({
                ...n,
                selected: n.id === node.id
            }))
        );
    }, [setNodes]);

    const onPaneClick = useCallback(() => {
        // Deselect when clicking empty space
        setSelectedNode(null);
        setNodes(nodes =>
            nodes.map(n => ({
                ...n,
                selected: false
            }))
        );
    }, [setNodes]);

    if (error) {
        return (
            <Alert
                message="Graph Construction Failed"
                description={error.message}
                type="error"
                showIcon
            />
        );
    }

    if (nodes.length === 0) {
        return (
            <Alert
                message="No Dependencies Found"
                description="The selected sources don't have any audit trail dependencies to visualize."
                type="info"
                showIcon
            />
        );
    }

    // Calculate main graph width based on whether panel is open
    const graphWidth = selectedNode ? 'calc(100% - 340px)' : '100%';

    // Calculate node type counts for summary
    const nodeCounts = nodes.reduce((acc, node) => {
        acc[node.type] = (acc[node.type] || 0) + 1;
        return acc;
    }, {});

    return (
        <div style={{
            display: 'flex',
            height: '100%',
            width: '100%'
        }}>
            {/* Main Graph Area */}
            <div style={{
                width: graphWidth,
                height: '100%',
                transition: 'width 0.3s ease'
            }}>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    nodeTypes={nodeTypes}
                    edgeTypes={edgeTypes}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onNodeClick={onNodeClick}
                    onPaneClick={onPaneClick}
                    connectionLineType={ConnectionLineType.SmoothStep}
                    fitView
                    attributionPosition="bottom-left"
                    proOptions={{ hideAttribution: true }}
                >
                    <Controls />
                    <Background color="#f8f8f8" gap={20} />

                    <Panel position="top-left">
                        <Space direction="vertical" size="small">
                            {/* Summary Card */}
                            <Card size="small" style={{ minWidth: '180px' }}>
                                <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                                    <Text strong>{nodes.length}</Text> sources • <Text strong>{edges.length}</Text> dependencies
                                </div>
                                <div style={{ fontSize: '10px', color: '#666' }}>
                                    {nodeCounts.outputSource && <div>🟣 {nodeCounts.outputSource} output sources</div>}
                                    {nodeCounts.intermediarySource && <div>🟠 {nodeCounts.intermediarySource} intermediary sources</div>}
                                    {nodeCounts.rootSource && <div>🟢 {nodeCounts.rootSource} root sources</div>}
                                </div>
                                <div style={{ fontSize: '10px', color: '#999', marginTop: '6px', textAlign: 'center' }}>
                                    Click a node to view steps
                                </div>
                            </Card>

                            {/* Legend */}
                            <GraphLegend />
                        </Space>
                    </Panel>
                </ReactFlow>
            </div>

            {/* Step Details Side Panel */}
            {selectedNode && (
                <StepDetailsPanel
                    node={selectedNode}
                    auditData={auditData}
                    onClose={() => setSelectedNode(null)}
                />
            )}
        </div>
    );
};

export default AuditTrailGraph;