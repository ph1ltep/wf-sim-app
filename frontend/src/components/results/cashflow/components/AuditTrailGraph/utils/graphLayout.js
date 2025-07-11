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

    // Configure layout - TB (top-bottom) with output sources at top
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    dagreGraph.setGraph({
        rankdir: 'TB', // Top to bottom
        align: 'UL',   // Upper left alignment
        nodesep: 80,  // Horizontal spacing between nodes
        ranksep: 80,   // Vertical spacing between ranks
        marginx: 20,
        marginy: 20
    });

    // Add nodes to dagre graph with custom ranking
    nodes.forEach(node => {
        // Set custom rank to control vertical position
        let rank = 0;
        switch (node.type) {
            case 'outputSource':
                rank = 0; // Top level
                break;
            case 'intermediarySource':
                rank = 1; // Middle level
                break;
            case 'rootSource':
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

    // Add edges to dagre graph
    edges.forEach(edge => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    // Calculate layout
    dagre.layout(dagreGraph);

    // Apply calculated positions to nodes
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

/**
 * Get node width based on type
 * @param {string} nodeType - Node type (rootSource, intermediarySource, etc.)
 * @returns {number} Width in pixels
 */
const getNodeWidth = (nodeType) => {
    switch (nodeType) {
        case 'rootSource': return 120;
        case 'intermediarySource': return 140;
        case 'outputSource': return 130;
        default: return 120;
    }
};

/**
 * Get node height based on type  
 * @param {string} nodeType - Node type
 * @returns {number} Height in pixels
 */
const getNodeHeight = (nodeType) => {
    switch (nodeType) {
        case 'rootSource': return 60;
        case 'intermediarySource': return 70;
        case 'outputSource': return 70;
        default: return 60;
    }
};