// src/components/modals/LoadScenarioModal.jsx
import React, { useState, useEffect } from 'react';
import { Modal, Button, Spin, Input, Space, Typography, Tag, Tooltip, Table } from 'antd';
import { SearchOutlined, UploadOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useScenario } from '../../contexts/ScenarioContext';
import moment from 'moment';

const { Text } = Typography;

const LoadScenarioModal = ({ visible, onCancel, onLoad }) => {
    const { getAllScenarios, getScenario, loading } = useScenario();
    const [scenarios, setScenarios] = useState([]);
    const [filteredScenarios, setFilteredScenarios] = useState([]);
    const [loadingScenarios, setLoadingScenarios] = useState(false);
    const [selectedRowKey, setSelectedRowKey] = useState(null);
    const [searchText, setSearchText] = useState('');

    // Fetch scenarios when modal becomes visible
    useEffect(() => {
        if (visible) {
            fetchScenarios();
        }
    }, [visible]);

    // src/components/modals/LoadScenarioModal.jsx (update to fetchScenarios function)
    const fetchScenarios = async () => {
        try {
            setLoadingScenarios(true);
            // This will directly use the API without needing to update a local state
            const result = await getAllScenarios(1, 100); // Fetch up to 100 scenarios

            if (result && result.scenarios) {
                setScenarios(result.scenarios);
                setFilteredScenarios(result.scenarios);
            } else {
                setScenarios([]);
                setFilteredScenarios([]);
            }
        } catch (error) {
            console.error('Error fetching scenarios:', error);
        } finally {
            setLoadingScenarios(false);
        }
    };
    // Handle row selection
    const onSelectRow = (record) => {
        setSelectedRowKey(record._id);
    };

    // Handle loading the selected scenario
    const handleLoadScenario = async () => {
        if (!selectedRowKey) return;

        try {
            await getScenario(selectedRowKey);
            if (onLoad) onLoad();
        } catch (error) {
            console.error('Error loading scenario:', error);
        }
    };

    // Handle search filtering
    const handleSearch = (e) => {
        const value = e.target.value;
        setSearchText(value);

        if (!value) {
            setFilteredScenarios(scenarios);
            return;
        }

        // Create a case-insensitive regex pattern from the search text
        // Handle wildcard * by replacing with .*
        const pattern = value.replace(/\*/g, '.*').toLowerCase();
        const regex = new RegExp(pattern, 'i');

        const filtered = scenarios.filter(scenario => {
            return (
                regex.test(scenario.name) ||
                regex.test(scenario.description) ||
                regex.test(scenario.settings?.general?.projectName)
            );
        });

        setFilteredScenarios(filtered);
    };

    // Table columns
    const columns = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            render: (text, record) => (
                <div>
                    <div>{text}</div>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                        {record.settings?.general?.projectName || 'No project name'}
                    </Text>
                </div>
            ),
        },
        {
            title: 'Description',
            dataIndex: 'description',
            key: 'description',
            ellipsis: true,
        },
        {
            title: 'Project Size',
            key: 'projectSize',
            render: (_, record) => {
                const totalMW = record.settings?.metrics?.totalMW;
                return totalMW ? `${totalMW} MW` : 'N/A';
            },
        },
        {
            title: 'Last Modified',
            dataIndex: 'updatedAt',
            key: 'updatedAt',
            render: (date) => moment(date).format('YYYY-MM-DD HH:mm'),
            sorter: (a, b) => moment(a.updatedAt).unix() - moment(b.updatedAt).unix(),
            defaultSortOrder: 'descend',
        },
    ];

    // Expandable row renderer
    const expandedRowRender = (record) => {
        const projectLife = record.settings?.general?.projectLife || 0;
        const numWTGs = record.settings?.project?.windFarm?.numWTGs || 0;
        const mwPerWTG = record.settings?.project?.windFarm?.mwPerWTG || 0;
        const currency = record.settings?.project?.currency?.local || 'USD';

        return (
            <div style={{ padding: '10px' }}>
                <div style={{ marginBottom: '10px' }}>
                    <Space direction="vertical" size="small">
                        <div>
                            <Text strong>Project Details:</Text> {record.settings?.general?.projectName || 'N/A'}
                            {projectLife > 0 && <Tag color="blue" style={{ marginLeft: 8 }}>{projectLife} years</Tag>}
                        </div>
                        <div>
                            <Text strong>Configuration:</Text> {numWTGs} WTGs × {mwPerWTG} MW = {numWTGs * mwPerWTG} MW total
                        </div>
                        <div>
                            <Text strong>Currency:</Text> {currency}
                        </div>
                        <div>
                            <Text strong>Created:</Text> {moment(record.createdAt).format('YYYY-MM-DD HH:mm')}
                        </div>
                    </Space>
                </div>
            </div>
        );
    };

    return (
        <Modal
            title={
                <Space>
                    <UploadOutlined />
                    Load Scenario
                </Space>
            }
            open={visible}
            onCancel={onCancel}
            width={800}
            footer={[
                <Button key="cancel" onClick={onCancel}>
                    Cancel
                </Button>,
                <Button
                    key="load"
                    type="primary"
                    disabled={!selectedRowKey}
                    onClick={handleLoadScenario}
                    loading={loading}
                >
                    Load Selected
                </Button>
            ]}
        >
            <div style={{ marginBottom: 16 }}>
                <Input
                    placeholder="Search by name, description or project name (use * for wildcard)"
                    prefix={<SearchOutlined />}
                    value={searchText}
                    onChange={handleSearch}
                    style={{ width: '100%' }}
                    allowClear
                />
            </div>

            {loadingScenarios ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                    <Spin size="large" />
                    <div style={{ marginTop: '10px' }}>Loading scenarios...</div>
                </div>
            ) : (
                <Table
                    columns={columns}
                    dataSource={filteredScenarios}
                    rowKey="_id"
                    size="small"
                    expandable={{ expandedRowRender }}
                    pagination={{
                        pageSize: 10,
                        showTotal: (total) => `Total ${total} scenarios`,
                    }}
                    rowSelection={{
                        type: 'radio',
                        selectedRowKeys: selectedRowKey ? [selectedRowKey] : [],
                        onChange: (selectedRowKeys) => setSelectedRowKey(selectedRowKeys[0]),
                    }}
                    onRow={(record) => ({
                        onClick: () => onSelectRow(record),
                        style: { cursor: 'pointer' }
                    })}
                    loading={loadingScenarios}
                    locale={{ emptyText: 'No scenarios found' }}
                />
            )}
        </Modal>
    );
};

export default LoadScenarioModal;