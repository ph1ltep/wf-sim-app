// frontend/src/components/results/cashflow/components/AuditTrailGraph/components/CustomNodes/index.js
import RegistrySourceNode from './RegistrySourceNode';
import OutputSourceNode from './OutputSourceNode';
import RealRootNode from './RealRootNode';

export const nodeTypes = {
    registrySource: RegistrySourceNode,  // ✅ FIXED: Renamed
    outputSource: OutputSourceNode,
    realRoot: RealRootNode
};

export {
    RegistrySourceNode,
    OutputSourceNode,
    RealRootNode
};