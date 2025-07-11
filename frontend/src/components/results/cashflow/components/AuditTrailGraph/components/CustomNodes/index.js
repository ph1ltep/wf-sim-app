// frontend/src/components/results/cashflow/components/AuditTrailGraph/components/CustomNodes/index.js
import RootSourceNode from './RootSourceNode';
import IntermediarySourceNode from './IntermediarySourceNode';
import OutputSourceNode from './OutputSourceNode';

export const nodeTypes = {
    rootSource: RootSourceNode,
    intermediarySource: IntermediarySourceNode,
    outputSource: OutputSourceNode
};

export {
    RootSourceNode,
    IntermediarySourceNode,
    OutputSourceNode
};