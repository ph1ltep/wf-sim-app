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
 * Classify nodes based on their role in the dependency graph
 * @param {Object} nodeAuditData - Audit data for actual source nodes (references excluded)
 * @param {string[]} originalSourceIds - The original input source IDs (these are output sources)
 * @param {Set} allReferenceIds - Set of all reference IDs
 * @returns {Object} Node classifications by sourceId
 */
export const classifyNodes = (nodeAuditData, originalSourceIds, allReferenceIds) => {
    const classifications = {};
    const allSourceIds = Object.keys(nodeAuditData);
    const dependencyMap = new Map();
    const dependentMap = new Map();

    console.log(`🔍 Classifying ${allSourceIds.length} source nodes`);
    console.log(`📋 Original input sourceIds:`, originalSourceIds);

    // Build dependency and dependent maps (excluding references)
    allSourceIds.forEach(sourceId => {
        const audit = nodeAuditData[sourceId];
        const dataDependencies = new Set();
        const referenceDependencies = new Set();

        if (audit?.trail) {
            audit.trail.forEach(step => {
                if (step.dependencies && Array.isArray(step.dependencies)) {
                    step.dependencies.forEach(depId => {
                        // Check if dependency is a reference
                        const isReference = audit?.references && audit.references.hasOwnProperty(depId);
                        const isReferenceId = allReferenceIds.has(depId);

                        if (isReference || isReferenceId) {
                            referenceDependencies.add(depId);
                        } else {
                            // Only count as data dependency if it exists in our node audit data
                            if (nodeAuditData.hasOwnProperty(depId)) {
                                dataDependencies.add(depId);

                                // Track what depends on this data dependency
                                if (!dependentMap.has(depId)) {
                                    dependentMap.set(depId, new Set());
                                }
                                dependentMap.get(depId).add(sourceId);
                            }
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

    // Classify each node - FIXED LOGIC
    allSourceIds.forEach(sourceId => {
        const dependencies = dependencyMap.get(sourceId);
        const dependents = dependentMap.get(sourceId);
        const audit = nodeAuditData[sourceId];

        let nodeType;

        // ✅ FIXED: Classification priority
        // 1. If in original sourceIds -> always outputSource (regardless of dependencies)
        if (originalSourceIds.includes(sourceId)) {
            nodeType = 'outputSource';
        }
        // 2. If has no data dependencies -> rootSource  
        else if (dependencies.data.size === 0) {
            nodeType = 'rootSource';
        }
        // 3. Everything else -> intermediarySource
        else {
            nodeType = 'intermediarySource';
        }

        classifications[sourceId] = {
            type: nodeType,
            dataDependencyCount: dependencies.data.size,
            referenceDependencyCount: dependencies.references.size,
            dependentCount: dependents ? dependents.size : 0,
            dataDependencies: Array.from(dependencies.data),
            referenceDependencies: Array.from(dependencies.references),
            dependents: dependents ? Array.from(dependents) : [],
            references: audit?.references || {},
            isOriginalInput: originalSourceIds.includes(sourceId)
        };

        console.log(`📊 ${sourceId}: ${nodeType} (deps: ${dependencies.data.size}, refs: ${dependencies.references.size}, original: ${originalSourceIds.includes(sourceId)})`);
    });

    return classifications;
};

/**
 * Extract edges (data flow relationships) from audit data
 * Only includes data dependencies, excludes references
 * @param {Object} auditData - Complete audit data
 * @param {Set} allReferenceIds - Set of all reference IDs to exclude
 * @returns {Array} Array of edge objects for graph visualization
 */
export const extractEdges = (auditData, allReferenceIds) => {
    const edges = [];
    const edgeSet = new Set(); // Prevent duplicate edges

    Object.entries(auditData).forEach(([sourceId, audit]) => {
        // Skip if this source is actually a reference
        if (allReferenceIds.has(sourceId)) {
            return;
        }

        if (audit?.trail) {
            // Find primary data dependencies (not references)
            const dataDependencies = new Set();

            audit.trail.forEach(step => {
                if (step.dependencies && Array.isArray(step.dependencies)) {
                    step.dependencies.forEach(depId => {
                        // ✅ FIXED: Include ALL data dependencies that exist in auditData
                        // (even if they're also in originalSourceIds)
                        const isReference = audit?.references && audit.references.hasOwnProperty(depId);
                        const existsInAuditData = auditData.hasOwnProperty(depId);
                        const isReferenceId = allReferenceIds.has(depId);

                        if (!isReference && existsInAuditData && !isReferenceId) {
                            dataDependencies.add(depId);
                        }
                    });
                }
            });

            // Create edges for data dependencies
            dataDependencies.forEach(depId => {
                const edgeId = `${depId}-${sourceId}`;

                if (!edgeSet.has(edgeId)) {
                    edgeSet.add(edgeId);

                    // Count transformation steps between these sources
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
 * Main function to build complete graph data structure
 * @param {string[]} sourceIds - Initial source IDs
 * @param {Function} getAuditTrail - Audit trail data function
 * @param {Object} sourceRegistry - Source registry for root source classification
 * @returns {Object} Complete graph data with nodes and edges
 */
export const buildDependencyGraph = (sourceIds, getAuditTrail, sourceRegistry = null) => {
    console.log(`🎯 Building dependency graph for: ${sourceIds.join(', ')}`);

    try {
        // Step 1: Resolve all dependencies recursively
        const auditData = resolveDependencies(sourceIds, getAuditTrail);

        // Step 1.5: Collect all reference IDs across all sources
        const allReferenceIds = new Set();
        Object.values(auditData).forEach(audit => {
            if (audit?.references) {
                Object.keys(audit.references).forEach(refId => {
                    allReferenceIds.add(refId);
                });
            }
        });

        console.log(`📋 Found ${allReferenceIds.size} reference IDs to exclude from nodes:`, Array.from(allReferenceIds));

        // Step 2: Filter out reference items and enhance root sources
        const nodeAuditData = {};
        Object.entries(auditData).forEach(([sourceId, audit]) => {
            // ✅ FIXED: Only include sources that are NOT references
            if (!allReferenceIds.has(sourceId)) {
                let enhancedAudit = audit;

                // Check if this source has data dependencies (excluding references)
                const dataDependencies = new Set();
                if (audit?.trail) {
                    audit.trail.forEach(step => {
                        if (step.dependencies && Array.isArray(step.dependencies)) {
                            step.dependencies.forEach(depId => {
                                const isReference = audit?.references && audit.references.hasOwnProperty(depId);
                                const isReferenceId = allReferenceIds.has(depId);
                                if (!isReference && !isReferenceId && auditData.hasOwnProperty(depId)) {
                                    dataDependencies.add(depId);
                                }
                            });
                        }
                    });
                }

                // ✅ FIXED: If this is a root source (no data dependencies) AND not in original sourceIds, enhance it
                const isRootSource = dataDependencies.size === 0 && !sourceIds.includes(sourceId);
                if (isRootSource) {
                    const rootType = classifyRootSourceType(audit, sourceRegistry, sourceId);
                    enhancedAudit = addArtificialSourceStep(audit, sourceId, rootType);
                    enhancedAudit.rootSourceType = rootType;
                    console.log(`🌱 Enhanced root source ${sourceId} as ${rootType}`);
                }

                nodeAuditData[sourceId] = enhancedAudit;
            }
        });

        console.log(`📊 Filtered audit data: ${Object.keys(auditData).length} total sources → ${Object.keys(nodeAuditData).length} actual source nodes`);

        // Step 3: Classify nodes (pass original sourceIds for correct classification)
        const nodeClassifications = classifyNodes(nodeAuditData, sourceIds, allReferenceIds);

        // Step 4: Extract edges (data flow only, excluding references)
        const edges = extractEdges(auditData, allReferenceIds);

        // Step 5: Build node objects (only for non-reference sources)
        const nodes = Object.entries(nodeAuditData).map(([sourceId, audit]) => {
            const classification = nodeClassifications[sourceId];
            const trailLength = audit?.trail?.length || 0;
            const totalDuration = audit?.trail?.reduce((sum, step) => sum + (step.duration || 0), 0) || 0;

            return {
                id: sourceId,
                type: classification.type,
                data: {
                    label: sourceId,
                    steps: trailLength,
                    duration: totalDuration,
                    dataDependencyCount: classification.dataDependencyCount,
                    referenceDependencyCount: classification.referenceDependencyCount,
                    dependentCount: classification.dependentCount,
                    references: classification.references,
                    rootSourceType: audit.rootSourceType || null,
                    audit
                },
                position: { x: 0, y: 0 } // Will be calculated by layout algorithm
            };
        });

        console.log(`✅ Graph built: ${nodes.length} nodes, ${edges.length} edges`);
        console.log(`📊 Node types:`, nodes.reduce((acc, node) => {
            acc[node.type] = (acc[node.type] || 0) + 1;
            return acc;
        }, {}));

        return {
            nodes,
            edges,
            auditData, // Keep full audit data for step details
            nodeClassifications
        };

    } catch (error) {
        console.error('❌ Failed to build dependency graph:', error);
        throw new Error(`Dependency graph construction failed: ${error.message}`);
    }
};

/**
 * Classify root source types based on transformer and path
 * @param {Object} audit - Audit data for the source
 * @param {Object} sourceRegistry - The source registry to check for transformer
 * @param {string} sourceId - Source ID
 * @returns {string} Root source type: 'complex', 'distribution', or 'scalar'
 */
const classifyRootSourceType = (audit, sourceRegistry, sourceId) => {
    // Find the source in registry to check for transformer
    const registrySource = sourceRegistry?.sources?.find(s => s.id === sourceId);

    if (registrySource?.transformer) {
        return 'complex';
    }

    if (registrySource?.hasPercentiles) {
        return 'distribution';
    }

    console.log(`📝 Classified ${sourceId} as scalar`);
    return 'scalar';
};

/**
 * Add artificial source step to show the original path data
 * @param {Object} audit - Audit data
 * @param {string} sourceId - Source ID
 * @param {string} rootType - Root source type
 * @returns {Object} Updated audit with artificial step
 */
const addArtificialSourceStep = (audit, sourceId, rootType) => {
    if (!audit?.trail) return audit;

    // Create artificial step showing the source path data
    const artificialStep = {
        timestamp: Date.now() - 1000, // Before other steps
        step: 'source_data_extraction',
        type: 'none',
        typeOperation: null,
        details: `Extracted ${rootType} source data from path`,
        dependencies: [],
        dataSample: {
            percentile: 'source',
            data: audit.sourceData || null
        },
        duration: 0
    };

    return {
        ...audit,
        trail: [artificialStep, ...audit.trail]
    };
};