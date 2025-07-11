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
import RealRootDetailsPanel from './components/RealRootDetailsPanel';

const { Text } = Typography;

// ✅ FIXED: Define edge types outside component to prevent re-creation
const edgeTypes = {};

const AuditTrailGraph = ({ sourceIds }) => {
    const { nodes: rawNodes, edges: rawEdges, auditData, summaryStats, isLoading, error } = useDependencyResolver(sourceIds);
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

    // Format compute time for display
    const formatComputeTime = (timeMs) => {
        if (timeMs < 1000) return `${timeMs.toFixed(0)}ms`;
        if (timeMs < 60000) return `${(timeMs / 1000).toFixed(1)}s`;
        return `${(timeMs / 60000).toFixed(1)}min`;
    };

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
                            {/* Enhanced Summary Card */}
                            <Card
                                size="small"
                                style={{
                                    minWidth: '200px',
                                    backgroundColor: 'rgba(255, 255, 255, 0.85)',
                                    backdropFilter: 'blur(4px)'
                                }}
                            >
                                <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                                    <Text strong style={{ fontSize: '12px' }}>
                                        Audit Trail Summary
                                    </Text>
                                </div>

                                {/* Node counts */}
                                <div style={{ fontSize: '10px', color: '#666', marginBottom: '8px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Total Nodes:</span>
                                        <Text strong>{summaryStats?.totalNodes || nodes.length}</Text>
                                    </div>
                                    {summaryStats?.nodeTypes?.realRoot && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span>🏗️ Real Roots:</span>
                                            <Text strong>{summaryStats.nodeTypes.realRoot}</Text>
                                        </div>
                                    )}
                                    {summaryStats?.nodeTypes?.registrySource && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span>📋 Registry Sources:</span>
                                            <Text strong>{summaryStats.nodeTypes.registrySource}</Text>
                                        </div>
                                    )}
                                    {summaryStats?.nodeTypes?.outputSource && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span>🎯 Output Sources:</span>
                                            <Text strong>{summaryStats.nodeTypes.outputSource}</Text>
                                        </div>
                                    )}
                                </div>

                                {/* Dependencies and processing info */}
                                <div style={{ fontSize: '10px', color: '#666', borderTop: '1px solid #f0f0f0', paddingTop: '6px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Dependencies:</span>
                                        <Text strong>{edges.length}</Text>
                                    </div>
                                    {summaryStats?.totalReferences > 0 && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span>🔵 References:</span>
                                            <Text strong>{summaryStats.totalReferences}</Text>
                                        </div>
                                    )}
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Total Steps:</span>
                                        <Text strong>{summaryStats?.totalSteps || 0}</Text>
                                    </div>
                                    {summaryStats?.totalComputeTime > 0 && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span>⏱️ Compute Time:</span>
                                            <Text strong>{formatComputeTime(summaryStats.totalComputeTime)}</Text>
                                        </div>
                                    )}
                                </div>

                                <div style={{ fontSize: '9px', color: '#999', marginTop: '6px', textAlign: 'center', borderTop: '1px solid #f0f0f0', paddingTop: '4px' }}>
                                    Click nodes to explore details
                                </div>
                            </Card>

                            {/* Legend */}
                            <GraphLegend />
                        </Space>
                    </Panel>
                </ReactFlow>
            </div>

            {/* Step Details Side Panel */}
            {selectedNode && selectedNode.type === 'realRoot' ? (
                <RealRootDetailsPanel
                    node={selectedNode}
                    onClose={() => setSelectedNode(null)}
                />
            ) : selectedNode ? (
                <StepDetailsPanel
                    node={selectedNode}
                    auditData={auditData}
                    onClose={() => setSelectedNode(null)}
                />
            ) : null}
        </div>
    );
};

export default AuditTrailGraph;