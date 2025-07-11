// frontend/src/utils/audit/dependencyResolver.js - Add missing export
/**
 * Recursive dependency resolution for audit trail graph visualization
 * Builds complete dependency tree from source audit trails
 */

/**
 * Recursively resolve all dependencies for given source IDs
 * @param {string[]} sourceIds - Initial source IDs to resolve
 * @param {Function} getAuditTrail - Function to get audit trail data
 * @param {Object} options - Resolution options
 * @param {number} options.maxDepth - Maximum recursion depth (default: 10)
 * @param {Set} options.visited - Internal: visited sources to prevent infinite loops
 * @returns {Object} Complete audit data with all dependencies resolved
 */
export const resolveDependencies = (sourceIds, getAuditTrail, options = {}) => {
    // ... existing function implementation stays the same
    const { maxDepth = 20, visited = new Set() } = options;

    console.log(`🔍 Resolving dependencies for: ${sourceIds.join(', ')}`);

    // Get audit data for initial sources
    const auditData = getAuditTrail(sourceIds);
    const resolvedAuditData = { ...auditData };
    const allDependencies = new Set();

    // Collect all unique dependencies from audit trails
    Object.entries(auditData).forEach(([sourceId, audit]) => {
        // Mark this source as visited
        visited.add(sourceId);

        if (audit?.trail) {
            audit.trail.forEach(step => {
                if (step.dependencies && Array.isArray(step.dependencies)) {
                    step.dependencies.forEach(depId => {
                        // Only add dependencies we haven't visited yet
                        if (!visited.has(depId)) {
                            allDependencies.add(depId);
                        }
                    });
                }
            });
        }
    });

    // If we have dependencies and haven't exceeded max depth, recurse
    if (allDependencies.size > 0 && maxDepth > 0) {
        console.log(`📋 Found ${allDependencies.size} dependencies to resolve: ${Array.from(allDependencies).join(', ')}`);

        try {
            // Recursively resolve dependencies
            const dependencyAuditData = resolveDependencies(
                Array.from(allDependencies),
                getAuditTrail,
                { maxDepth: maxDepth - 1, visited: new Set(visited) }
            );

            // Merge dependency data with current data
            Object.assign(resolvedAuditData, dependencyAuditData);

        } catch (error) {
            console.warn(`⚠️ Failed to resolve some dependencies:`, error.message);
            // Continue with partial resolution rather than failing completely
        }
    }

    console.log(`✅ Dependency resolution complete. Total sources: ${Object.keys(resolvedAuditData).length}`);
    return resolvedAuditData;
};
/**
 * Create artificial root nodes for the actual data sources
 * @param {Object} nodeAuditData - Processed audit data
 * @param {Object} sourceRegistry - Source registry
 * @returns {Object} Object with new root nodes and updated audit data
 */
const createRealRootNodes = (nodeAuditData, sourceRegistry) => {
    const realRootNodes = new Map();
    const updatedAuditData = { ...nodeAuditData };

    // Find sources that should have real root nodes
    Object.entries(nodeAuditData).forEach(([sourceId, audit]) => {
        const registrySource = sourceRegistry?.sources?.find(s => s.id === sourceId);

        if (registrySource?.path) {
            // Create a unique root node ID for this path
            const pathKey = registrySource.path.join('.');
            const rootNodeId = `root_${pathKey.replace(/\./g, '_')}`;

            // Determine root node type
            let rootType = 'scalar'; // default
            if (registrySource.transformer) {
                rootType = 'complex';
            } else if (registrySource.hasPercentiles) {
                rootType = 'distribution';
            }

            // Create the real root node if it doesn't exist
            if (!realRootNodes.has(rootNodeId)) {
                realRootNodes.set(rootNodeId, {
                    id: rootNodeId,
                    type: 'realRoot',
                    rootType: rootType,
                    path: registrySource.path,
                    pathKey: pathKey,
                    hasPercentiles: registrySource.hasPercentiles,
                    transformer: registrySource.transformer,
                    dependents: new Set([sourceId]),
                    sourceData: audit.sourceData || null
                });
            } else {
                // Add this source as a dependent
                realRootNodes.get(rootNodeId).dependents.add(sourceId);
            }

            // Update the registry source's audit to show dependency on real root
            if (updatedAuditData[sourceId]?.trail) {
                // Add artificial step showing dependency on real root node
                const rootDependencyStep = {
                    timestamp: Date.now() - 2000, // Before other steps
                    step: 'root_data_access',
                    type: 'none',
                    typeOperation: null,
                    details: `Accessed ${rootType} data from path: ${pathKey}`,
                    dependencies: [rootNodeId],
                    dataSample: {
                        percentile: 'source',
                        data: audit.sourceData || null
                    },
                    duration: 0
                };

                updatedAuditData[sourceId] = {
                    ...updatedAuditData[sourceId],
                    trail: [rootDependencyStep, ...updatedAuditData[sourceId].trail]
                };
            }
        }
    });

    return {
        realRootNodes: Array.from(realRootNodes.values()),
        updatedAuditData
    };
};

/**
 * Classify nodes with the new real root concept
 * @param {Object} nodeAuditData - Audit data for source nodes
 * @param {string[]} originalSourceIds - Original input source IDs
 * @param {Set} allReferenceIds - Reference IDs to exclude
 * @param {Array} realRootNodes - Real root node data
 * @returns {Object} Node classifications
 */
export const classifyNodesWithRealRoots = (nodeAuditData, originalSourceIds, allReferenceIds, realRootNodes) => {
    const classifications = {};
    const allSourceIds = Object.keys(nodeAuditData);
    const dependencyMap = new Map();
    const dependentMap = new Map();

    // Get all real root node IDs
    const realRootNodeIds = new Set(realRootNodes.map(node => node.id));

    console.log(`🌳 Classifying nodes with ${realRootNodes.length} real root nodes:`, Array.from(realRootNodeIds));

    // Build dependency maps
    allSourceIds.forEach(sourceId => {
        const audit = nodeAuditData[sourceId];
        const dataDependencies = new Set();
        const referenceDependencies = new Set();

        if (audit?.trail) {
            audit.trail.forEach(step => {
                if (step.dependencies && Array.isArray(step.dependencies)) {
                    step.dependencies.forEach(depId => {
                        const isReference = audit?.references && audit.references.hasOwnProperty(depId);
                        const isReferenceId = allReferenceIds.has(depId);
                        const isRealRootNode = realRootNodeIds.has(depId);

                        if (isReference || isReferenceId) {
                            referenceDependencies.add(depId);
                        } else if (isRealRootNode) {
                            // Don't count real root nodes as data dependencies for classification
                            // They're infrastructure, not peer dependencies
                        } else if (nodeAuditData.hasOwnProperty(depId)) {
                            dataDependencies.add(depId);

                            if (!dependentMap.has(depId)) {
                                dependentMap.set(depId, new Set());
                            }
                            dependentMap.get(depId).add(sourceId);
                        }
                    });
                }
            });
        }

        dependencyMap.set(sourceId, {
            data: dataDependencies,
            references: referenceDependencies
        });
    });

    // Classify source nodes
    allSourceIds.forEach(sourceId => {
        const dependencies = dependencyMap.get(sourceId);
        const dependents = dependentMap.get(sourceId);
        const audit = nodeAuditData[sourceId];

        let nodeType;

        // Classification logic with real roots
        if (originalSourceIds.includes(sourceId)) {
            nodeType = 'outputSource';
        } else {
            // ✅ FIXED: All non-output sources are registry sources
            nodeType = 'registrySource';
        }

        classifications[sourceId] = {
            type: nodeType,
            dataDependencyCount: dependencies.data.size,
            referenceDependencyCount: dependencies.references.size,
            dependentCount: dependents ? dependents.size : 0,
            dataDependencies: Array.from(dependencies.data),
            referenceDependencies: Array.from(dependencies.references),
            dependents: dependents ? Array.from(dependents) : [],
            references: audit?.references || {}
        };
    });

    // Classify real root nodes
    realRootNodes.forEach(rootNode => {
        classifications[rootNode.id] = {
            type: 'realRoot',
            rootType: rootNode.rootType,
            dataDependencyCount: 0,
            referenceDependencyCount: 0,
            dependentCount: rootNode.dependents.size,
            dataDependencies: [],
            referenceDependencies: [],
            dependents: Array.from(rootNode.dependents),
            references: {},
            path: rootNode.path,
            pathKey: rootNode.pathKey
        };
    });

    return classifications;
};

/**
 * Extract edges including real root node connections
 */
export const extractEdgesWithRealRoots = (auditData, allReferenceIds, realRootNodeIds) => {
    const edges = [];
    const edgeSet = new Set();

    Object.entries(auditData).forEach(([sourceId, audit]) => {
        if (allReferenceIds.has(sourceId)) return;

        if (audit?.trail) {
            const dataDependencies = new Set();

            audit.trail.forEach(step => {
                if (step.dependencies && Array.isArray(step.dependencies)) {
                    step.dependencies.forEach(depId => {
                        const isReference = audit?.references && audit.references.hasOwnProperty(depId);
                        const isReferenceId = allReferenceIds.has(depId);
                        const isRealRootNode = realRootNodeIds.has(depId);

                        if (!isReference && !isReferenceId &&
                            (auditData.hasOwnProperty(depId) || isRealRootNode)) {
                            dataDependencies.add(depId);
                        }
                    });
                }
            });

            dataDependencies.forEach(depId => {
                const edgeId = `${depId}-${sourceId}`;

                if (!edgeSet.has(edgeId)) {
                    edgeSet.add(edgeId);

                    const stepCount = audit.trail.filter(step =>
                        step.dependencies && step.dependencies.includes(depId)
                    ).length;

                    edges.push({
                        id: edgeId,
                        source: depId,
                        target: sourceId,
                        type: 'dataFlow',
                        label: stepCount > 1 ? `${stepCount} steps` : '1 step',
                        data: {
                            stepCount,
                            transformationType: 'data_flow'
                        }
                    });
                }
            });
        }
    });

    return edges;
};

/**
 * Main function with real root nodes
 */
export const buildDependencyGraph = (sourceIds, getAuditTrail, sourceRegistry = null) => {
    console.log(`🎯 Building dependency graph with real roots for: ${sourceIds.join(', ')}`);

    try {
        // Step 1: Resolve all dependencies
        const auditData = resolveDependencies(sourceIds, getAuditTrail);

        // Step 2: Collect reference IDs
        const allReferenceIds = new Set();
        Object.values(auditData).forEach(audit => {
            if (audit?.references) {
                Object.keys(audit.references).forEach(refId => {
                    allReferenceIds.add(refId);
                });
            }
        });

        // Step 3: Filter out references
        const nodeAuditData = {};
        Object.entries(auditData).forEach(([sourceId, audit]) => {
            if (!allReferenceIds.has(sourceId)) {
                nodeAuditData[sourceId] = audit;
            }
        });

        // Step 4: Create real root nodes and update audit data
        const { realRootNodes, updatedAuditData } = createRealRootNodes(nodeAuditData, sourceRegistry);
        const realRootNodeIds = new Set(realRootNodes.map(node => node.id));

        console.log(`🌱 Created ${realRootNodes.length} real root nodes:`, realRootNodes.map(n => `${n.id}(${n.rootType})`));

        // Step 5: Classify all nodes
        const nodeClassifications = classifyNodesWithRealRoots(
            updatedAuditData,
            sourceIds,
            allReferenceIds,
            realRootNodes
        );

        // Step 6: Extract edges
        const edges = extractEdgesWithRealRoots(updatedAuditData, allReferenceIds, realRootNodeIds);

        // Step 7: Build all nodes (sources + real roots)
        const sourceNodes = Object.entries(updatedAuditData).map(([sourceId, audit]) => {
            const classification = nodeClassifications[sourceId];
            const trailLength = audit?.trail?.length || 0;
            const totalDuration = audit?.trail?.reduce((sum, step) => sum + (step.duration || 0), 0) || 0;

            // ✅ FIXED: Get registry type from source registry
            const registrySource = sourceRegistry?.sources?.find(s => s.id === sourceId);
            const registryType = registrySource?.metadata?.type || 'direct';

            return {
                id: sourceId,
                type: classification.type === 'intermediarySource' ? 'registrySource' : classification.type,
                data: {
                    label: sourceId,
                    steps: trailLength,
                    duration: totalDuration,
                    dataDependencyCount: classification.dataDependencyCount,
                    referenceDependencyCount: classification.referenceDependencyCount,
                    dependentCount: classification.dependentCount,
                    references: classification.references,
                    registryType: registryType, // ✅ FIXED: Add registry type
                    audit
                },
                position: { x: 0, y: 0 }
            };
        });

        const rootNodes = realRootNodes.map(rootNode => {
            const classification = nodeClassifications[rootNode.id];

            return {
                id: rootNode.id,
                type: 'realRoot',
                data: {
                    label: rootNode.pathKey,
                    rootType: rootNode.rootType,
                    path: rootNode.path,
                    dependentCount: classification.dependentCount,
                    hasPercentiles: rootNode.hasPercentiles,
                    sourceData: rootNode.sourceData,
                    steps: 1, // Artificial step count
                    referenceDependencyCount: 0,
                    audit: {
                        trail: [{
                            timestamp: Date.now(),
                            step: 'data_source',
                            type: 'none',
                            details: `Root data source: ${rootNode.pathKey}`,
                            dependencies: [],
                            dataSample: {
                                percentile: 'source',
                                data: rootNode.sourceData
                            },
                            duration: 0
                        }],
                        references: {}
                    }
                },
                position: { x: 0, y: 0 }
            };
        });

        const allNodes = [...rootNodes, ...sourceNodes];

        // ✅ FIXED: Calculate summary statistics
        const summaryStats = calculateSummaryStats(allNodes, updatedAuditData);

        console.log(`✅ Graph built: ${allNodes.length} total nodes (${rootNodes.length} real roots + ${sourceNodes.length} sources), ${edges.length} edges`);
        console.log(`📊 Summary:`, summaryStats);

        return {
            nodes: allNodes,
            edges,
            auditData: { ...updatedAuditData, ...Object.fromEntries(realRootNodes.map(n => [n.id, { trail: [], references: {} }])) },
            nodeClassifications,
            summaryStats // ✅ FIXED: Include summary stats
        };

    } catch (error) {
        console.error('❌ Failed to build dependency graph:', error);
        throw new Error(`Dependency graph construction failed: ${error.message}`);
    }
};

/**
 * Calculate total compute time from all audit trails
 * @param {Object} auditData - All audit data
 * @returns {number} Total compute time in milliseconds
 */
const calculateTotalComputeTime = (auditData) => {
    let minTimestamp = Infinity;
    let maxTimestamp = -Infinity;
    let totalSteps = 0;

    Object.values(auditData).forEach(audit => {
        if (audit?.trail && Array.isArray(audit.trail)) {
            audit.trail.forEach(step => {
                if (step.timestamp) {
                    minTimestamp = Math.min(minTimestamp, step.timestamp);
                    maxTimestamp = Math.max(maxTimestamp, step.timestamp);
                    totalSteps++;
                }
            });
        }
    });

    const computeTime = totalSteps > 0 ? maxTimestamp - minTimestamp : 0;
    console.log(`⏱️ Total compute time: ${computeTime}ms (${totalSteps} steps, ${minTimestamp} → ${maxTimestamp})`);

    return computeTime;
};

/**
 * Calculate summary statistics for the graph
 * @param {Array} nodes - All nodes
 * @param {Object} auditData - All audit data
 * @returns {Object} Summary statistics
 */
const calculateSummaryStats = (nodes, auditData) => {
    const stats = {
        totalNodes: nodes.length,
        nodeTypes: {},
        totalReferences: 0,
        totalSteps: 0,
        totalComputeTime: calculateTotalComputeTime(auditData)
    };

    // Count node types
    nodes.forEach(node => {
        const type = node.type;
        stats.nodeTypes[type] = (stats.nodeTypes[type] || 0) + 1;

        // Count references and steps
        if (node.data.referenceDependencyCount) {
            stats.totalReferences += node.data.referenceDependencyCount;
        }
        if (node.data.steps) {
            stats.totalSteps += node.data.steps;
        }
    });

    return stats;
};