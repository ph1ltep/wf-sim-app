// src/components/modals/LoadScenarioModal.jsx
import React, { useState, useEffect } from 'react';
import { Modal, Button, Spin, Input, Space, Typography, Tag, Tooltip, Table, Popconfirm } from 'antd';
import { SearchOutlined, UploadOutlined, InfoCircleOutlined, DeleteOutlined } from '@ant-design/icons';
import { useScenario } from '../../contexts/ScenarioContext';
import { ConfirmationModal } from './';
import moment from 'moment';

const { Text } = Typography;

const LoadScenarioModal = ({ visible, onCancel, onLoad }) => {
    const { getAllScenarios, getScenario, deleteScenario, loading } = useScenario();
    const [scenarios, setScenarios] = useState([]);
    const [filteredScenarios, setFilteredScenarios] = useState([]);
    const [loadingScenarios, setLoadingScenarios] = useState(false);
    const [selectedRowKey, setSelectedRowKey] = useState(null);
    const [searchText, setSearchText] = useState('');
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [scenarioToDelete, setScenarioToDelete] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [pagination, setPagination] = useState({ page: 1, limit: 100, total: 0 });

    // Fetch scenarios when modal becomes visible
    useEffect(() => {
        if (visible) {
            fetchScenarios();
        }
    }, [visible]);

    const fetchScenarios = async () => {
        try {
            setLoadingScenarios(true);
            // Get scenarios using the pagination parameters
            const result = await getAllScenarios(pagination.page, pagination.limit, searchText);

            if (result && result.success) {
                // The API now returns a ListResponseSchema with items in data.items
                setScenarios(result.data.items || []);
                setFilteredScenarios(result.data.items || []);

                // Update pagination from the response
                if (result.data.pagination) {
                    setPagination({
                        page: result.data.pagination.page || 1,
                        limit: result.data.pagination.limit || 100,
                        total: result.data.pagination.total || 0
                    });
                }
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

    // Handle delete confirmation
    const showDeleteConfirm = (scenario, e) => {
        // Stop event propagation to prevent row selection
        e.stopPropagation();
        setScenarioToDelete(scenario);
        setDeleteModalVisible(true);
    };

    // Handle actual deletion
    const handleDeleteScenario = async () => {
        if (!scenarioToDelete) return;

        try {
            setDeleteLoading(true);
            await deleteScenario(scenarioToDelete._id);
            // Refresh the scenario list
            fetchScenarios();
            // Reset selection if the deleted scenario was selected
            if (selectedRowKey === scenarioToDelete._id) {
                setSelectedRowKey(null);
            }
        } catch (error) {
            console.error('Error deleting scenario:', error);
        } finally {
            setDeleteLoading(false);
            setDeleteModalVisible(false);
        }
    };

    // Handle search filtering - locally filter pre-fetched scenarios
    // Note: For larger datasets, we might want to use the server's search instead
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
                const totalMW = record.metrics?.totalMW;
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
        {
            title: '',
            key: 'actions',
            width: 50,
            render: (_, record) => (
                <Tooltip title="Delete scenario">
                    <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={(e) => showDeleteConfirm(record, e)}
                    />
                </Tooltip>
            ),
        }
    ];

    // Expandable row renderer - More concise with additional info
    const expandedRowRender = (record) => {
        const projectLife = record.settings?.general?.projectLife || 0;
        const numWTGs = record.settings?.project?.windFarm?.numWTGs || 0;
        const mwPerWTG = record.settings?.project?.windFarm?.mwPerWTG || 0;
        const capacityFactor = record.settings?.project?.windFarm?.capacityFactor || 0;
        const currency = record.settings?.project?.currency?.local || 'USD';
        const startDate = record.settings?.general?.startDate;
        const netAEP = record.metrics?.netAEP || 0;

        return (
            <div style={{ padding: '8px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div>
                        <Space direction="vertical" size="small">
                            <div>
                                <Text strong>Configuration:</Text> {numWTGs} WTGs × {mwPerWTG} MW = {(numWTGs * mwPerWTG).toFixed(1)} MW total
                            </div>
                            <div>
                                <Text strong>Capacity Factor:</Text> {capacityFactor}%
                            </div>
                            <div>
                                <Text strong>Net AEP:</Text> {(netAEP / 1000).toFixed(2)} GWh/year
                            </div>
                        </Space>
                    </div>
                    <div>
                        <Space direction="vertical" size="small">
                            <div>
                                <Text strong>Project Life:</Text> {projectLife} years
                            </div>
                            <div>
                                <Text strong>Start Date:</Text> {startDate ? moment(startDate).format('YYYY-MM-DD') : 'N/A'}
                            </div>
                            <div>
                                <Text strong>Currency:</Text> {currency}
                            </div>
                            <div>
                                <Text strong>Created:</Text> {moment(record.createdAt).format('YYYY-MM-DD')}
                            </div>
                        </Space>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <>
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
                            pageSize: pagination.limit,
                            total: pagination.total,
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

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                open={deleteModalVisible}
                onConfirm={handleDeleteScenario}
                onCancel={() => setDeleteModalVisible(false)}
                title="Delete Scenario"
                content={`Are you sure you want to delete the scenario "${scenarioToDelete?.name}"? This action cannot be undone.`}
                confirmText="Delete"
                loading={deleteLoading}
                type="error"
            />
        </>
    );
};

export default LoadScenarioModal;