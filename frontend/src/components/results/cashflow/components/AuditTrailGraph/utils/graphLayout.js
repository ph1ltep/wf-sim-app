// frontend/src/components/results/cashflow/components/AuditTrailGraph/utils/graphLayout.js
import dagre from 'dagre';

/**
 * Apply hierarchical layout to graph nodes using dagre
 * Output sources at top, cascading down to root sources at bottom
 * @param {Array} nodes - Array of node objects
 * @param {Array} edges - Array of edge objects  
 * @returns {Array} Nodes with calculated positions
 */
export const applyGraphLayout = (nodes, edges) => {
    const dagreGraph = new dagre.graphlib.Graph();

    // Configure layout
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    dagreGraph.setGraph({
        rankdir: 'TB', // Top to bottom
        align: 'UL',
        nodesep: 100,
        ranksep: 80,
        marginx: 20,
        marginy: 20
    });

    // Add nodes with custom ranking
    nodes.forEach(node => {
        let rank = 0;
        switch (node.type) {
            case 'outputSource':
                rank = 0; // Top level
                break;
            case 'registrySource':  // ✅ FIXED: Updated name
                rank = 1; // Middle level
                break;
            case 'realRoot':
                rank = 2; // Bottom level
                break;
            default:
                rank = 1;
        }

        dagreGraph.setNode(node.id, {
            width: getNodeWidth(node.type),
            height: getNodeHeight(node.type),
            rank: rank
        });
    });

    // Add edges
    edges.forEach(edge => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    // Calculate layout
    dagre.layout(dagreGraph);

    // Apply positions
    return nodes.map(node => {
        const nodeWithPosition = dagreGraph.node(node.id);

        return {
            ...node,
            position: {
                x: nodeWithPosition.x - nodeWithPosition.width / 2,
                y: nodeWithPosition.y - nodeWithPosition.height / 2
            }
        };
    });
};

// Update the width/height functions
const getNodeWidth = (nodeType) => {
    switch (nodeType) {
        case 'realRoot': return 120;
        case 'registrySource': return 120;  // ✅ FIXED: Updated name
        case 'outputSource': return 130;
        default: return 120;
    }
};

const getNodeHeight = (nodeType) => {
    switch (nodeType) {
        case 'realRoot': return 70;
        case 'registrySource': return 70;  // ✅ FIXED: Updated name
        case 'outputSource': return 70;
        default: return 60;
    }
};