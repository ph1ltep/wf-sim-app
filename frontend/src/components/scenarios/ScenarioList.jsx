// src/components/scenarios/ScenarioList.jsx
import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Pagination, Card, Typography, Tag } from 'antd';
import { EditOutlined, DeleteOutlined, EyeOutlined, CopyOutlined } from '@ant-design/icons';
import { useScenario } from '../../contexts/ScenarioContext';
import moment from 'moment';

const { Title } = Typography;

const ScenarioList = () => {
  const { scenarioList, loading, getAllScenarios, getScenario, deleteScenario } = useScenario();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  useEffect(() => {
    fetchScenarios();
  }, []);

  const fetchScenarios = async (page = 1, limit = 10) => {
    const result = await getAllScenarios(page, limit);
    if (result && result.pagination) {
      setPagination({
        current: result.pagination.page,
        pageSize: result.pagination.limit,
        total: result.pagination.total
      });
    }
  };

  const handleTableChange = (pagination) => {
    fetchScenarios(pagination.current, pagination.pageSize);
  };

  const handleView = async (id) => {
    await getScenario(id);
    // Navigate to scenario details or switch tabs as needed
  };

  const handleDelete = async (id) => {
    await deleteScenario(id);
    fetchScenarios(pagination.current, pagination.pageSize);
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div>
          <div>{text}</div>
          <div style={{ fontSize: '12px', color: 'rgba(0, 0, 0, 0.45)' }}>
            {record.settings?.general?.projectName || 'N/A'}
          </div>
        </div>
      )
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true
    },
    {
      title: 'Project Details',
      key: 'project',
      render: (_, record) => {
        const project = record.settings?.project;
        const windFarm = project?.windFarm;
        
        return (
          <div>
            <div>
              {windFarm ? (
                <>
                  <Tag color="blue">{windFarm.numWTGs} WTGs</Tag>
                  <Tag color="green">{windFarm.mwPerWTG} MW/WTG</Tag>
                </>
              ) : (
                <Tag color="default">No details</Tag>
              )}
            </div>
          </div>
        );
      }
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: date => moment(date).format('YYYY-MM-DD')
    },
    {
      title: 'Updated',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: date => moment(date).format('YYYY-MM-DD')
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Button 
            type="primary" 
            icon={<EyeOutlined />}
            onClick={() => handleView(record._id)}
          >
            Open
          </Button>
          <Button 
            danger 
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record._id)}
          >
            Delete
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div>
      <Title level={2}>Scenario Management</Title>
      <Card>
        <Table
          columns={columns}
          dataSource={scenarioList}
          rowKey="_id"
          pagination={pagination}
          loading={loading}
          onChange={handleTableChange}
        />
      </Card>
    </div>
  );
};

export default ScenarioList;