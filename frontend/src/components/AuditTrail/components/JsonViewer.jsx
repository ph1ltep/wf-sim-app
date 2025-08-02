// frontend/src/components/AuditTrail/components/JsonViewer.jsx
import React, { useState } from 'react';
import { Modal, Button, Typography, Tag, Space, Tooltip } from 'antd';
import {
    FileTextOutlined,
    CopyOutlined,
    ExpandAltOutlined,
    CloseOutlined,
    CheckOutlined,
    CompressOutlined
} from '@ant-design/icons';

const { Text } = Typography;

// Expandable JSON Tag for inline display
export const JsonTag = ({ label, value, size = "small", maxPreviewLength = 50 }) => {
    const [expanded, setExpanded] = useState(false);
    const [showModal, setShowModal] = useState(false);

    const isJsonObject = typeof value === 'object' && value !== null;

    if (!isJsonObject) {
        const stringValue = String(value);
        const truncated = stringValue.length > maxPreviewLength
            ? stringValue.substring(0, maxPreviewLength) + '...'
            : stringValue;

        return (
            <Tooltip title={stringValue.length > maxPreviewLength ? stringValue : null}>
                <Tag color="blue" size={size}>
                    {label}: {truncated}
                </Tag>
            </Tooltip>
        );
    }

    const preview = Array.isArray(value)
        ? `[${value.length} items]`
        : `{${Object.keys(value).length} props}`;

    return (
        <>
            <Tag
                color="blue"
                size={size}
                style={{ cursor: 'pointer', marginBottom: '2px' }}
                onClick={() => setExpanded(!expanded)}
            >
                {label}: {preview} {expanded ? '▼' : '▶'}
            </Tag>

            {expanded && (
                <div style={{
                    marginTop: '4px',
                    marginBottom: '8px',
                    marginLeft: '8px',
                    position: 'relative',
                    maxHeight: '200px', // ✅ FIXED: Limit height
                    overflow: 'hidden'  // ✅ FIXED: Prevent expansion
                }}>
                    <JsonViewer
                        data={value}
                        compact={true}
                        maxHeight="200px"
                        onExpand={() => setShowModal(true)}
                    />
                </div>
            )}

            <JsonModal
                title={`${label} Details`}
                data={value}
                visible={showModal}
                onClose={() => setShowModal(false)}
            />
        </>
    );
};

// Compact JSON viewer for inline display
export const JsonViewer = ({ data, compact = false, onExpand = null, maxHeight = '120px' }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    return (
        <div style={{
            backgroundColor: '#f5f5f5',
            border: '1px solid #d9d9d9',
            borderRadius: '4px',
            position: 'relative',
            maxHeight: maxHeight,        // ✅ FIXED: Respect maxHeight
            display: 'flex',             // ✅ FIXED: Use flex layout
            flexDirection: 'column',     // ✅ FIXED: Stack header and content
            overflow: 'hidden'           // ✅ FIXED: Prevent overflow
        }}>
            {/* Header with actions */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '4px 8px',
                borderBottom: '1px solid #d9d9d9',
                backgroundColor: '#fafafa',
                flexShrink: 0               // ✅ FIXED: Don't shrink header
            }}>
                <Text style={{ fontSize: '10px', color: '#666' }}>
                    {Array.isArray(data) ? `Array[${data.length}]` : `Object{${Object.keys(data).length}}`}
                </Text>
                <Space size={4}>
                    <Button
                        type="text"
                        size="small"
                        icon={copied ? <CheckOutlined /> : <CopyOutlined />}
                        onClick={handleCopy}
                        style={{ fontSize: '10px', padding: '0 4px', height: '20px' }}
                    />
                    {onExpand && (
                        <Button
                            type="text"
                            size="small"
                            icon={<ExpandAltOutlined />}
                            onClick={onExpand}
                            style={{ fontSize: '10px', padding: '0 4px', height: '20px' }}
                        />
                    )}
                </Space>
            </div>

            {/* JSON content - ✅ FIXED: Proper scrolling */}
            <div style={{
                padding: '8px',
                fontSize: compact ? '10px' : '11px',
                fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
                overflowY: 'auto',          // ✅ FIXED: Only vertical scroll
                overflowX: 'hidden',        // ✅ FIXED: Hide horizontal scroll
                lineHeight: '1.4',
                flex: 1,                    // ✅ FIXED: Take remaining space
                minHeight: 0                // ✅ FIXED: Allow flexbox to work properly
            }}>
                <pre style={{
                    margin: 0,
                    whiteSpace: 'pre-wrap',     // ✅ FIXED: Wrap long lines
                    wordBreak: 'break-word'     // ✅ FIXED: Break long words
                }}>
                    {JSON.stringify(data, null, 2)}
                </pre>
            </div>
        </div>
    );
};

// Full-screen JSON modal - ✅ FIXED: Better modal sizing
export const JsonModal = ({ title, data, visible, onClose }) => {
    if (!visible) return null;

    return (
        <Modal
            title={
                <Space>
                    <FileTextOutlined />
                    <Text strong>{title}</Text>
                </Space>
            }
            open={visible}
            onCancel={onClose}
            width="80vw"                     // ✅ FIXED: Wider modal
            styles={{
                body: {
                    height: '70vh',          // ✅ FIXED: Larger height
                    padding: '0',
                    overflow: 'hidden'       // ✅ FIXED: Let JsonViewer handle scrolling
                }
            }}
            footer={
                <Button onClick={onClose}>
                    Close
                </Button>
            }
        >
            <JsonViewer
                data={data}
                compact={false}
                maxHeight="100%"
            />
        </Modal>
    );
};

// Quick JSON button for step headers
export const JsonButton = ({ data, tooltip = "View JSON data" }) => {
    const [showModal, setShowModal] = useState(false);

    if (!data) return null;

    return (
        <>
            <Tooltip title={tooltip}>
                <Button
                    type="text"
                    size="small"
                    icon={<FileTextOutlined />}
                    style={{
                        fontSize: '10px',
                        padding: '0 4px',
                        height: '20px',
                        color: '#1890ff'
                    }}
                    onClick={() => setShowModal(true)}
                />
            </Tooltip>

            <JsonModal
                title="Data Details"
                data={data}
                visible={showModal}
                onClose={() => setShowModal(false)}
            />
        </>
    );
};