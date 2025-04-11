// src/components/modals/LoadScenarioModal.jsx
import React, { useState, useEffect } from 'react';
import { Modal, Table, Input, Button, Space, Typography, Tooltip } from 'antd';
import { SearchOutlined, DeleteOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useScenario } from '../../contexts/ScenarioContext';
import ConfirmationModal from './ConfirmationModal';

const { Text } = Typography;
const { Search } = Input;

export const LoadScenarioModal = ({ visible, onCancel, onLoad }) => {
    const [scenarios, setScenarios] = useState([]);
    const [filteredScenarios, setFilteredScenarios] = useState([]);
    const [selectedScenarioId, setSelectedScenarioId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [scenarioToDelete, setScenarioToDelete] = useState(null);

    const { getScenario, deleteScenario, getAllScenarios } = useScenario();

    // Load scenarios when modal becomes visible
    useEffect(() => {
        if (visible) {
            loadScenarios();
        }
    }, [visible]);

    const loadScenarios = async () => {
        setLoading(true);
        try {
            const data = await getAllScenarios();
            setScenarios(data);
            setFilteredScenarios(data);
        } catch (error) {
            console.error('Failed to load scenarios:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (value) => {
        setSearchText(value);
        const searchTextLower = value.toLowerCase();

        const filtered = scenarios.filter((scenario) => {
            return (
                scenario.name.toLowerCase().includes(searchTextLower) ||
                (scenario.description && scenario.description.toLowerCase().includes(searchTextLower))
            );
        });

        setFilteredScenarios(filtered);
    };

    const handleLoadScenario = async () => {
        if (!selectedScenarioId) return;

        setLoading(true);
        try {
            const loadedScenario = await getScenario(selectedScenarioId);
            if (loadedScenario) {
                onLoad();
            }
        } catch (error) {
            console.error('Failed to load selected scenario:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteScenario = (scenario) => {
        setScenarioToDelete(scenario);
        setDeleteModalVisible(true);
    };

    const confirmDeleteScenario = async () => {
        if (!scenarioToDelete) return;

        setLoading(true);
        try {
            const success = await deleteScenario(scenarioToDelete._id);
            if (success) {
                if (selectedScenarioId === scenarioToDelete._id) {
                    setSelectedScenarioId(null);
                }
                await loadScenarios();
            }
        } catch (error) {
            console.error('Failed to delete scenario:', error);
        } finally {
            setDeleteModalVisible(false);
            setScenarioToDelete(null);
            setLoading(false);
        }
    };

    // Define table columns
    const columns = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            sorter: (a, b) => a.name.localeCompare(b.name),
        },
        {
            title: 'Description',
            dataIndex: 'description',
            key: 'description',
            ellipsis: true,
        },
        {
            title: 'Wind Farm Size',
            dataIndex: ['metrics', 'windFarmSize'],
            key: 'windFarmSize',
            render: (value) => `${value || 0} WTGs`,
            sorter: (a, b) => (a.metrics?.windFarmSize || 0) - (b.metrics?.windFarmSize || 0),
        },
        {
            title: 'Project Life',
            dataIndex: ['metrics', 'projectLife'],
            key: 'projectLife',
            render: (value) => `${value || 0} years`,
            sorter: (a, b) => (a.metrics?.projectLife || 0) - (b.metrics?.projectLife || 0),
        },
        {
            title: 'Last Updated',
            dataIndex: 'updatedAt',
            key: 'updatedAt',
            render: (date) => new Date(date).toLocaleString(),
            sorter: (a, b) => new Date(a.updatedAt) - new Date(b.updatedAt),
            defaultSortOrder: 'descend',
        },
        {
            title: 'Actions',
            key: 'actions',
            align: 'center',
            render: (_, record) => (
                <Space size="small">
                    <Tooltip title="Delete Scenario">
                        <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteScenario(record);
                            }}
                        />
                    </Tooltip>
                    <Tooltip title="View Details">
                        <Button
                            type="text"
                            icon={<InfoCircleOutlined />}
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedScenarioId(record._id);
                            }}
                        />
                    </Tooltip>
                </Space>
            ),
        },
    ];

    return (
        <>
            <Modal
                title="Load Scenario"
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
                        disabled={!selectedScenarioId}
                        onClick={handleLoadScenario}
                        loading={loading}
                    >
                        Load Selected
                    </Button>,
                ]}
            >
                <Space direction="vertical" style={{ width: '100%', marginBottom: 16 }}>
                    <Search
                        placeholder="Search scenarios by name or description"
                        allowClear
                        enterButton={<SearchOutlined />}
                        size="middle"
                        onSearch={handleSearch}
                        onChange={(e) => handleSearch(e.target.value)}
                        style={{ width: '100%' }}
                    />
                    <Table
                        dataSource={filteredScenarios}
                        columns={columns}
                        rowKey="_id"
                        loading={loading}
                        pagination={{ pageSize: 10 }}
                        rowSelection={{
                            type: 'radio',
                            selectedRowKeys: selectedScenarioId ? [selectedScenarioId] : [],
                            onChange: (selectedRowKeys) => {
                                setSelectedScenarioId(selectedRowKeys[0]);
                            },
                        }}
                        onRow={(record) => ({
                            onClick: () => {
                                setSelectedScenarioId(record._id);
                            },
                            style: { cursor: 'pointer' }
                        })}
                    />
                </Space>
            </Modal>

            <ConfirmationModal
                open={deleteModalVisible}
                onConfirm={confirmDeleteScenario}
                onCancel={() => setDeleteModalVisible(false)}
                title="Delete Scenario"
                content={`Are you sure you want to delete the scenario "${scenarioToDelete?.name}"? This action cannot be undone.`}
                confirmText="Delete"
                loading={loading}
                type="danger"
            />
        </>
    );
};

export default LoadScenarioModal;