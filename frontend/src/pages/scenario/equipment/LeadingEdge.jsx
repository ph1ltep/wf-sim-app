// frontend/src/pages/scenario/equipment/LeadingEdge.jsx
import React from 'react';
import { Typography, Alert } from 'antd';
import { useScenario } from 'contexts/ScenarioContext';
import LEPComponent from 'components/common/LEPSim';

const { Title } = Typography;

const LeadingEdge = () => {
    // Get scenario data directly from context
    const { scenarioData } = useScenario();

    // Check if we have an active scenario
    if (!scenarioData) {
        return (
            <div>
                <Title level={2}>Leading Edge Protection</Title>
                <Alert
                    message="No Active Scenario"
                    description="Please create or load a scenario first."
                    type="warning"
                />
            </div>
        );
    }

    return (
        <div>
            <Title level={2}>Leading Edge Protection</Title>
            <p>Analyze blade leading edge protection strategies and their impact on AEP loss over the project lifetime.</p>

            {/* LEP Analysis Component */}
            <LEPComponent />
        </div>
    );
};

export default LeadingEdge;