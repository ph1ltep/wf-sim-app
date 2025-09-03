// src/components/tables/TimeSeriesTable.jsx - Updated with minimum points display
import React, { useMemo, useState } from 'react';
import { Typography, Space, Tooltip, Table, Input, InputNumber, Form, Button, Popconfirm } from 'antd';
import { LineChartOutlined, EditOutlined, SaveOutlined, CloseOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { useScenario } from '../../contexts/ScenarioContext';
import { formatNumber } from '../../utils/formatUtils';

const { Text } = Typography;
const EditableContext = React.createContext(null);

// EditableRow component with Form context
const EditableRow = ({ index, ...props }) => {
    const [form] = Form.useForm();
    return (
        <Form form={form} component={false}>
            <EditableContext.Provider value={form}>
                <tr {...props} />
            </EditableContext.Provider>
        </Form>
    );
};

// EditableCell component
const EditableCell = ({
    title,
    editable,
    children,
    dataIndex,
    record,
    handleSave,
    inputType,
    inputProps,
    ...restProps
}) => {
    const [editing, setEditing] = useState(false);
    const form = React.useContext(EditableContext);

    // Toggle edit state
    const toggleEdit = () => {
        setEditing(!editing);
        // Set the raw value without formatting
        form.setFieldsValue({ [dataIndex]: record[dataIndex] });
    };

    // Save cell value
    const save = async () => {
        try {
            const values = await form.validateFields();
            toggleEdit();
            // Make sure we convert to number for the value field
            if (dataIndex === 'value' && values.value !== undefined) {
                values.value = parseFloat(values.value);
            } else if (dataIndex === 'year' && values.year !== undefined) {
                values.year = parseInt(values.year, 10);
            }
            handleSave({ ...record, ...values });
        } catch (errInfo) {
            console.error('Save failed:', errInfo);
        }
    };

    // Handle key press for keyboard navigation
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            save();
        } else if (e.key === 'Escape') {
            toggleEdit();
        }
    };

    // Render cell content
    let childNode = children;

    if (editable) {
        childNode = editing ? (
            <Form.Item
                style={{ margin: 0 }}
                name={dataIndex}
                rules={[
                    {
                        required: true,
                        message: `${title} is required.`,
                    },
                ]}
            >
                {inputType === 'number' ? (
                    <InputNumber
                        {...inputProps}
                        onPressEnter={save}
                        onBlur={save}
                        onKeyDown={handleKeyPress}
                        autoFocus
                    />
                ) : (
                    <Input
                        onPressEnter={save}
                        onBlur={save}
                        onKeyDown={handleKeyPress}
                        autoFocus
                    />
                )}
            </Form.Item>
        ) : (
            <div
                className="editable-cell-value-wrap"
                style={{ paddingRight: 24, cursor: 'pointer' }}
                onClick={toggleEdit}
            >
                {children}
            </div>
        );
    }

    return <td {...restProps}>{childNode}</td>;
};

/**
 * Enhanced Time Series Table component with inline editing and form mode support
 * 
 * @param {string[]} path Path to the data array in context
 * @param {string} valueLabel Label for the value column
 * @param {string} valueType Type of value (number, percentage, currency)
 * @param {number} precision Decimal precision for values
 * @param {string} addonAfter Unit to display after values
 * @param {number} minYear Minimum allowed year
 * @param {number} maxYear Maximum allowed year
 * @param {boolean} disableEditing Whether to disable editing functionality
 * @param {number} minRequiredPoints Minimum points required for distribution fitting
 * @param {boolean} showDataCount Whether to show the data point count
 * @param {boolean} formMode Whether to render in form mode
 * @param {string} name Field name for form mode
 * @param {Function} getValueOverride Value getter override for form mode
 * @param {Function} updateValueOverride Value updater override for form mode
 */
const TimeSeriesTable = ({
    path,
    valueLabel = 'Value',
    valueType = 'number',
    precision = 2,
    addonAfter = '',
    minYear = 0,
    maxYear = 100,
    disableEditing = false,
    showDataCount = true,
    minRequiredPoints = 3,
    // Form mode props
    formMode = false,
    name = null,
    getValueOverride = null,
    updateValueOverride = null,
}) => {
    // Get scenario context
    const { getValueByPath, updateByPath } = useScenario();
    const [editingKey, setEditingKey] = useState('');

    // Get data based on mode (form mode vs context mode)
    const timeSeriesData = useMemo(() => {
        if (formMode && getValueOverride) {
            const data = getValueOverride(path, []);
            return Array.isArray(data) ? data : [];
        }
        
        const data = getValueByPath(path, []);
        return Array.isArray(data) ? data : [];
    }, [formMode, getValueOverride, getValueByPath, path]);

    // Calculate data count
    const dataCount = timeSeriesData.length;

    // Format value based on type without adding unit in the value
    const formatValue = (value) => {
        if (value === undefined || value === null) return '-';

        let formattedValue;
        if (valueType === 'percentage') {
            formattedValue = `${formatNumber(value, precision)}%`;
        } else if (valueType === 'currency') {
            formattedValue = `${formatNumber(value, precision)}`;
        } else {
            formattedValue = formatNumber(value, precision);
        }
        return formattedValue;
    };

    // Handle row save based on mode
    const handleSave = (row) => {
        const newData = [...timeSeriesData];
        const index = newData.findIndex(item => item.year === row.year);

        if (index > -1) {
            const item = newData[index];
            newData.splice(index, 1, { ...item, ...row });
        } else {
            newData.push(row);
        }

        // Use form mode updater if in form mode, otherwise use context
        if (formMode && updateValueOverride) {
            updateValueOverride(path, newData);
        } else {
            updateByPath(path, newData);
        }
    };

    // Handle delete row based on mode
    const handleDelete = (year) => {
        const newData = timeSeriesData.filter(item => item.year !== year);
        
        // Use form mode updater if in form mode, otherwise use context
        if (formMode && updateValueOverride) {
            updateValueOverride(path, newData);
        } else {
            updateByPath(path, newData);
        }
    };

    // Handle add row
    const handleAdd = () => {
        // Find available year (starting from 0)
        const usedYears = new Set(timeSeriesData.map(item => item.year));
        let newYear = 0;
        while (usedYears.has(newYear)) {
            newYear++;
        }

        // Get default value (average of existing values or 0)
        let defaultValue = 0;
        if (timeSeriesData.length > 0) {
            const sum = timeSeriesData.reduce((acc, item) => acc + (item.value || 0), 0);
            defaultValue = sum / timeSeriesData.length;
        }

        // Add new row based on mode
        const newData = [...timeSeriesData, { year: newYear, value: defaultValue }];
        
        // Use form mode updater if in form mode, otherwise use context
        if (formMode && updateValueOverride) {
            updateValueOverride(path, newData);
        } else {
            updateByPath(path, newData);
        }
    };

    // Define columns
    const columns = [
        {
            title: 'Year',
            dataIndex: 'year',
            key: 'year',
            width: 100,
            fixed: 'left',
            sorter: (a, b) => a.year - b.year,
            editable: !disableEditing,
            inputType: 'number',
            inputProps: {
                min: minYear,
                max: maxYear,
                precision: 0,
                style: { width: 80 }
            }
        },
        {
            title: addonAfter ? `${valueLabel} (${addonAfter})` : valueLabel,
            dataIndex: 'value',
            key: 'value',
            editable: !disableEditing,
            inputType: 'number',
            inputProps: {
                step: valueType === 'percentage' ? 0.1 : 1,
                precision: precision,
                style: { width: 120 }
            },
            render: value => {
                if (value === undefined || value === null) return '-';

                // For display only, not for edit mode
                let formattedValue;
                if (valueType === 'percentage') {
                    formattedValue = `${formatNumber(value, precision)}%`;
                } else if (valueType === 'currency') {
                    formattedValue = `${formatNumber(value, precision)}`;
                } else {
                    formattedValue = formatNumber(value, precision);
                }

                return formattedValue;
            }
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 100,
            fixed: 'right',
            render: (_, record) =>
                !disableEditing && (
                    <Space size="small">
                        <Popconfirm
                            title="Delete this data point?"
                            onConfirm={() => handleDelete(record.year)}
                            okText="Yes"
                            cancelText="No"
                        >
                            <Button type="text" danger icon={<DeleteOutlined />} />
                        </Popconfirm>
                    </Space>
                )
        }
    ];

    // Map columns to include editable property
    const mergedColumns = columns.map(col => {
        if (!col.editable) {
            return col;
        }
        return {
            ...col,
            onCell: record => ({
                record,
                dataIndex: col.dataIndex,
                title: col.title,
                editable: col.editable,
                handleSave,
                inputType: col.inputType,
                inputProps: col.inputProps
            }),
        };
    });

    // Create components for editable table
    const components = {
        body: {
            row: EditableRow,
            cell: EditableCell,
        },
    };

    // Calculate summary data
    const calculateSummary = () => {
        if (!timeSeriesData || timeSeriesData.length === 0) {
            return null;
        }

        const values = timeSeriesData.map(item => item.value);
        const years = timeSeriesData.map(item => item.year);

        const sum = values.reduce((acc, val) => acc + parseFloat(val || 0), 0);
        const avg = sum / values.length;
        const min = Math.min(...values);
        const max = Math.max(...values);
        const minYear = Math.min(...years);
        const maxYear = Math.max(...years);

        return {
            count: values.length,
            avg,
            min,
            max,
            minYear,
            maxYear
        };
    };

    // Summary function
    const summary = (pageData) => {
        const summaryData = calculateSummary();
        if (!summaryData) return null;

        // Calculate timespan information
        let timeSpanText = `${summaryData.count} Years`;
        if (summaryData.count > 1) {
            const span = summaryData.maxYear - summaryData.minYear;
            timeSpanText = `${summaryData.count} of ${span + 1}`;
        }

        // Style for all summary cells
        const summaryStyle = {
            backgroundColor: '#f5f5f5',
            fontWeight: 'bold',
            borderTop: '1px solid #d9d9d9'
        };

        return (
            <Table.Summary.Row>
                <Table.Summary.Cell index={0} style={summaryStyle}>
                    <Tooltip title={`${summaryData.count} data points spanning years ${summaryData.minYear}-${summaryData.maxYear}`}>
                        <Text strong>{timeSpanText}</Text>
                    </Tooltip>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1} style={summaryStyle}>
                    <Tooltip title="Min / Avg / Max">
                        <Text strong>
                            {`${formatValue(summaryData.min)} / ${formatValue(summaryData.avg)} / ${formatValue(summaryData.max)}`}
                        </Text>
                    </Tooltip>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={2} style={summaryStyle} />
            </Table.Summary.Row>
        );
    };

    // Determine if we have enough data points for fitting
    const hasEnoughData = dataCount >= minRequiredPoints;

    return (
        <div className="time-series-table">
            <Space direction="vertical" style={{ width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Space>
                        <LineChartOutlined />
                        <Text strong>Time Series Data</Text>
                        {showDataCount && (
                            <Tooltip title={`Need at least ${minRequiredPoints} data points for this distribution type`}>
                                <Text type={hasEnoughData ? "success" : "warning"}>
                                    ({dataCount}/{minRequiredPoints} points {hasEnoughData ? "✓" : "needed"})
                                </Text>
                            </Tooltip>
                        )}
                    </Space>

                    {!disableEditing && (
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={handleAdd}
                            size="small"
                        >
                            Add Year
                        </Button>
                    )}
                </div>

                <Table
                    components={components}
                    rowClassName={() => 'editable-row'}
                    dataSource={timeSeriesData}
                    columns={mergedColumns}
                    rowKey="year"
                    pagination={false}
                    size="small"
                    summary={summary}
                    scroll={{
                        x: 'max-content',
                        y: 200  // Add max height of 300px with vertical scroll
                    }}
                    style={{
                        // Make rows more compact
                        '& .ant-table-tbody > tr > td': {
                            padding: '6px 8px'  // Reduce from default padding
                        }
                    }}
                />
            </Space>
        </div>
    );
};

export default TimeSeriesTable;