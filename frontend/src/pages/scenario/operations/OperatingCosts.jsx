// frontend/src/pages/scenario/operations/OperatingCosts.jsx
import React from 'react';
import { Typography, Alert, Tabs } from 'antd';
import {
    WarningOutlined,
    ScheduleOutlined,
    DollarOutlined,
    BugOutlined
} from '@ant-design/icons';
import { useScenario } from 'contexts/ScenarioContext';

// Import context field components
import {
    TextField,
    NumberField,
    CurrencyField,
    PercentageField,
    FormSection,
    FormRow,
    FormCol,
    EditableTable
} from 'components/contextFields';

const { Title } = Typography;

const OperatingCosts = () => {
    // Get scenario data directly from context
    const { scenarioData, getValueByPath } = useScenario();

    // Define base path for cost module
    const basePath = ['settings', 'modules', 'cost'];

    // Get values from context for conditional rendering
    const projectLife = scenarioData?.settings?.general?.projectLife || 20;

    // Get the currency from scenario
    const currency = scenarioData?.settings?.project?.currency?.local || 'USD';

    // Check if we have an active scenario
    if (!scenarioData) {
        return (
            <div>
                <Title level={2}>Operating Costs</Title>
                <Alert
                    message="No Active Scenario"
                    description="Please create or load a scenario first."
                    type="warning"
                />
            </div>
        );
    }

    // Annual adjustment form fields for EditableTable
    const annualAdjustmentFields = [
        <NumberField
            key="year"
            label="Year"
            path="year"
            min={1}
            max={projectLife}
            required
        />,
        <CurrencyField
            key="additionalOM"
            label="Additional O&M Cost"
            path="additionalOM"
            currencyOverride={currency}
        />,
        <TextField
            key="description"
            label="Description"
            path="description"
            placeholder="Reason for adjustment"
        />
    ];

    // Annual adjustment table columns
    const annualAdjustmentColumns = [
        {
            title: 'Year',
            dataIndex: 'year',
            key: 'year',
            sorter: (a, b) => a.year - b.year
        },
        {
            title: 'Additional Cost',
            dataIndex: 'additionalOM',
            key: 'additionalOM',
            render: value => `${currency} ${(value || 0).toLocaleString()}`
        },
        {
            title: 'Description',
            dataIndex: 'description',
            key: 'description'
        }
    ];

    // Major repair events table fields
    const majorRepairFields = [
        <NumberField
            key="year"
            label="Year"
            path="year"
            min={1}
            max={projectLife}
            required
        />,
        <CurrencyField
            key="cost"
            label="Cost"
            path="cost"
            currencyOverride={currency}
            required
        />,
        <PercentageField
            key="probability"
            label="Probability"
            path="probability"
            min={0}
            max={100}
            step={1}
        />
    ];

    // Major repair table columns
    const majorRepairColumns = [
        {
            title: 'Year',
            dataIndex: 'year',
            key: 'year',
            sorter: (a, b) => a.year - b.year
        },
        {
            title: 'Cost',
            dataIndex: 'cost',
            key: 'cost',
            render: value => `${currency} ${(value || 0).toLocaleString()}`
        },
        {
            title: 'Probability',
            dataIndex: 'probability',
            key: 'probability',
            render: value => `${value}%`
        }
    ];

    const tabItems = [
        {
            key: "costEvents",
            label: (
                <span>
                    <WarningOutlined /> Cost Events
                </span>
            ),
            children: (
                <>
                    <FormSection title="Failure Events" style={{ marginBottom: 24 }}>
                        <FormRow>
                            <FormCol>
                                <PercentageField
                                    path={[...basePath, 'failureEventProbability']}
                                    label="Failure Event Probability"
                                    tooltip="Annual probability of a failure event occurring"
                                    min={0}
                                    max={100}
                                    step={0.1}
                                />
                            </FormCol>
                            <FormCol>
                                <CurrencyField
                                    path={[...basePath, 'failureEventCost']}
                                    label="Average Failure Event Cost"
                                    tooltip="Average cost per failure event"
                                    min={0}
                                    step={10000}
                                    currencyOverride={currency}
                                />
                            </FormCol>
                        </FormRow>
                    </FormSection>

                    <FormSection title="Major Repair Events" style={{ marginBottom: 24 }}>
                        <p>Schedule major repair or replacement events at specific years of the project lifetime.</p>
                        <EditableTable
                            path={[...basePath, 'majorRepairEvents']}
                            columns={majorRepairColumns}
                            formFields={majorRepairFields}
                            keyField="year"
                            itemName="Major Repair Event"
                        />
                    </FormSection>

                    <FormSection title="Annual Cost Adjustments" style={{ marginBottom: 24 }}>
                        <p>Add specific cost adjustments for individual years (e.g., midlife overhauls, equipment upgrades).</p>
                        <EditableTable
                            path={[...basePath, 'adjustments']}
                            columns={annualAdjustmentColumns}
                            formFields={annualAdjustmentFields}
                            keyField="year"
                            itemName="Annual Adjustment"
                        />
                    </FormSection>
                </>
            )
        },
        {
            key: "failureModeling",
            label: (
                <span>
                    <BugOutlined /> Failure Modeling
                </span>
            ),
            children: (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                    <BugOutlined style={{ fontSize: '48px', marginBottom: '16px', color: '#d9d9d9' }} />
                    <Title level={4} style={{ color: '#999', margin: '0 0 8px 0' }}>
                        Failure Rate Modeling - Coming Soon
                    </Title>
                    <p style={{ color: '#999', margin: 0 }}>
                        Advanced failure rate modeling capabilities will be available here, including:
                    </p>
                    <ul style={{ color: '#999', textAlign: 'left', maxWidth: '400px', margin: '16px auto' }}>
                        <li>Component-specific failure rates</li>
                        <li>Bathtub curve modeling</li>
                        <li>Preventive vs corrective maintenance</li>
                        <li>Reliability-based maintenance scheduling</li>
                    </ul>
                </div>
            )
        }
    ];

    return (
        <div>
            <Title level={2}>Operating Costs</Title>
            <p>Configure operational costs, failure events, and maintenance schedules for your wind farm project.</p>

            <Tabs defaultActiveKey="costEvents" items={tabItems} type="card" />
        </div>
    );
};

export default OperatingCosts;