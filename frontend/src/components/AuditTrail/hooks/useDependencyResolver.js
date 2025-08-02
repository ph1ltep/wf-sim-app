// frontend/src/components/AuditTrail/hooks/useDependencyResolver.js
import { useMemo } from 'react';
import { useCube } from '../../../contexts/CubeContext';
import { buildDependencyGraph } from '../../../utils/audit/dependencyResolver';
import { CASHFLOW_SOURCE_REGISTRY } from '../../../utils/cube/sources/registry'; // Import registry

export const useDependencyResolver = (sourceIds) => {
    const { getAuditTrail } = useCube();

    const graphData = useMemo(() => {
        if (!sourceIds || !Array.isArray(sourceIds) || sourceIds.length === 0) {
            return { nodes: [], edges: [], auditData: {}, nodeClassifications: {} };
        }

        if (!getAuditTrail) {
            console.warn('⚠️ getAuditTrail function not available');
            return { nodes: [], edges: [], auditData: {}, nodeClassifications: {} };
        }

        try {
            console.log(`🔄 useDependencyResolver: Building graph for ${sourceIds.length} sources`);
            return buildDependencyGraph(sourceIds, getAuditTrail, CASHFLOW_SOURCE_REGISTRY);
        } catch (error) {
            console.error('❌ useDependencyResolver: Graph construction failed:', error);
            return { nodes: [], edges: [], auditData: {}, nodeClassifications: {} };
        }
    }, [sourceIds, getAuditTrail]);

    return {
        ...graphData,
        isLoading: false,
        error: null
    };
};