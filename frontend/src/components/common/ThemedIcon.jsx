// frontend/src/components/common/ThemedIcon.jsx
import React from 'react';
import {
    ArrowUpOutlined,
    ArrowDownOutlined,
    BarChartOutlined,
    LineChartOutlined,
    CalendarOutlined,
    DotChartOutlined,
    SettingOutlined,
    InfoCircleOutlined
} from '@ant-design/icons';

// Icon registry with default tooltips and colors
// Can be expanded to include other app icon categories
const ICON_REGISTRY = [
    // Distribution-related icons
    {
        key: 'percentileDirection.ascending',
        icon: ArrowUpOutlined,
        tooltip: 'P90 > P10 (Ascending)',
        defaultColor: '#1890ff'
    },
    {
        key: 'percentileDirection.descending',
        icon: ArrowDownOutlined,
        tooltip: 'P90 < P10 (Descending)',
        defaultColor: '#1890ff'
    },
    {
        key: 'viewMode.pdf',
        icon: BarChartOutlined,
        tooltip: 'PDF View',
        defaultColor: '#52c41a'
    },
    {
        key: 'viewMode.cdf',
        icon: LineChartOutlined,
        tooltip: 'CDF View',
        defaultColor: '#52c41a'
    },
    {
        key: 'dataMode.timeSeries',
        icon: CalendarOutlined,
        tooltip: 'Time Series Mode',
        defaultColor: '#722ed1'
    },
    {
        key: 'dataMode.singleValue',
        icon: DotChartOutlined,
        tooltip: 'Single Value Mode',
        defaultColor: '#722ed1'
    },
    {
        key: 'infoBox.shown',
        icon: InfoCircleOutlined,
        tooltip: 'Info Box Shown',
        defaultColor: '#faad14'
    },
    {
        key: 'settings',
        icon: SettingOutlined,
        tooltip: 'Settings',
        defaultColor: '#8c8c8c'
    }
    // Future categories can be added here:
    // Financial icons, status icons, action icons, etc.
];

/**
 * Themed icon component with registry lookup and styling
 * @param {Object} props - Component props
 * @param {string} props.iconKey - Key to lookup in icon registry
 * @param {string} [props.title] - Override tooltip (uses registry default if not provided)
 * @param {boolean} [props.showEnabled=true] - Whether icon should appear enabled (grays out when false)
 * @param {Object} [props.style] - Additional style overrides
 * @param {...Object} props - Additional props passed through to icon component
 */
const ThemedIcon = ({ iconKey, title, showEnabled = true, style = {}, ...props }) => {
    // Find the icon definition in registry
    const iconDef = ICON_REGISTRY.find(item => item.key === iconKey);

    if (!iconDef) {
        console.warn(`Icon key '${iconKey}' not found in registry, using settings icon as fallback`);
        const fallback = ICON_REGISTRY.find(item => item.key === 'settings');
        const FallbackIcon = fallback.icon;

        const fallbackStyle = {
            color: showEnabled ? (fallback.defaultColor || '#8c8c8c') : '#d9d9d9',
            cursor: 'default',
            fontSize: '14px',
            ...style
        };

        return <FallbackIcon title={title || 'Unknown'} style={fallbackStyle} {...props} />;
    }

    const IconComponent = iconDef.icon;
    const tooltipText = title || iconDef.tooltip;

    // Build final style with defaults and enabled state
    const finalStyle = {
        color: showEnabled ? iconDef.defaultColor : '#d9d9d9',
        cursor: 'default',
        fontSize: '14px',
        ...style
    };

    return <IconComponent title={tooltipText} style={finalStyle} {...props} />;
};

export default ThemedIcon;