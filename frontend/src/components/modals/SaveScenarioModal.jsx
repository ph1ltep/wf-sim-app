// src/components/modals/SaveScenarioModal.jsx
import React from 'react';
import { Modal, Form, Input, Space, Button } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { useScenario } from '../../contexts/ScenarioContext';

const SaveScenarioModal = ({ visible, onCancel }) => {
    const [form] = Form.useForm();
    const { scenarioData, saveScenario, updateScenario, loading, isNewScenario } = useScenario();

    // Handle saving as a new scenario
    const handleSaveAsNew = async () => {
        try {
            const values = await form.validateFields();
            await saveScenario(values);
            form.resetFields();
            onCancel();
        } catch (error) {
            console.error('Form validation or save error:', error);
        }
    };

    // Handle updating existing scenario
    const handleUpdate = async () => {
        try {
            const values = await form.validateFields();
            await updateScenario(values);
            form.resetFields();
            onCancel();
        } catch (error) {
            console.error('Form validation or update error:', error);
        }
    };

    // Reset form when modal opens
    React.useEffect(() => {
        if (visible) {
            form.setFieldsValue({
                name: scenarioData?.name || 'New Scenario',
                description: scenarioData?.description || ''
            });
        }
    }, [visible, form, scenarioData]);

    return (
        <Modal
            title={
                <Space>
                    <SaveOutlined />
                    Save Scenario
                </Space>
            }
            open={visible}
            onCancel={onCancel}
            footer={null}
        >
            <Form form={form} layout="vertical">
                <Form.Item
                    name="name"
                    label="Scenario Name"
                    rules={[{ required: true, message: 'Please enter a scenario name' }]}
                >
                    <Input placeholder="e.g., Base Case 2025" />
                </Form.Item>

                <Form.Item
                    name="description"
                    label="Description"
                >
                    <Input.TextArea
                        rows={4}
                        placeholder="Brief description of this scenario..."
                    />
                </Form.Item>

                <div style={{ marginTop: 24, textAlign: 'right' }}>
                    <Space>
                        <Button onClick={onCancel}>
                            Cancel
                        </Button>
                        {!isNewScenario() && (
                            <Button
                                type="primary"
                                onClick={handleUpdate}
                                loading={loading}
                            >
                                Save
                            </Button>
                        )}
                        <Button
                            type="primary"
                            onClick={handleSaveAsNew}
                            loading={loading}
                        >
                            Save as New
                        </Button>
                    </Space>
                </div>
            </Form>
        </Modal>
    );
};

export default SaveScenarioModal;