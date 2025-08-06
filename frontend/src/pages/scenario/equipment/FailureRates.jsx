// frontend/src/pages/scenario/equipment/FailureRates.jsx
import React from 'react';
import { Typography, Alert, Card } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';

const { Title } = Typography;

const FailureRates = () => {
    return (
        <div>
            <Title level={2}>Equipment Failure Rates</Title>
            <p>Configure failure rate models and reliability parameters for wind turbine components.</p>

            <Card>
                <Alert
                    message="Coming Soon"
                    description="This section will allow you to configure failure rate distributions for major wind turbine components including gearboxes, generators, blades, and other critical systems."
                    type="info"
                    icon={<ExclamationCircleOutlined />}
                    showIcon
                />
            </Card>
        </div>
    );
};

export default FailureRates;