// frontend/src/hooks/useCubeSources.js
import { useMemo, useCallback } from 'react';
import { useCube } from '../contexts/CubeContext';
import { SOURCES_REGISTRY } from '../utils/cube/sources/registry';


/**
 * Hook for cube sources operations with SourcesTable integration
 */
export const useCubeSources = () => {
    const { getData, sourceData, getCubeStatus, getPercentileData } = useCube();
    const cubeStatus = getCubeStatus();
    const percentileInfo = getPercentileData();


    return {
        getData,
        cubeStatus,
        percentileInfo,
        // Convenience flags
        isLoading: cubeStatus.isLoading,
        hasError: !!cubeStatus.error,
        isReady: !cubeStatus.isLoading && !cubeStatus.error && cubeStatus.sourceDataCount > 0
    };
};