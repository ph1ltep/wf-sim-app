// frontend/src/pages/risk/Warranties.jsx
import React from 'react';
import { Typography, Alert, Card } from 'antd';
import { SafetyCertificateOutlined } from '@ant-design/icons';

const { Title } = Typography;

const Warranties = () => {
    return (
        <div>
            <Title level={2}>Warranties</Title>
            <p>Configure warranty terms, coverage periods, and warranty-related risk transfers.</p>

            <Card>
                <Alert
                    message="Coming Soon"
                    description="This section will allow you to configure warranty terms including comprehensive warranties, component-specific warranties, availability guarantees, and performance warranties."
                    type="info"
                    icon={<SafetyCertificateOutlined />}
                    showIcon
                />
            </Card>
        </div>
    );
};

export default Warranties;