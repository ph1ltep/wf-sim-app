// src/components/contextFields/layouts/index.js - Complete layout system
import React from 'react';
import { Typography, Divider, Row, Col, Space, Card, Flex } from 'antd';

const { Title } = Typography;

// Form Section with title and optional extra content
export const FormSection = ({
  title,
  level = 4,
  extra,
  children,
  style,
  bordered = false,
  size = 'default',
  ...rest
}) => {
  const debugBorders = process.env.REACT_APP_DEBUG_FORM_BORDERS === 'true';
  const debugStyle = debugBorders ? {
    border: '1px dashed green',
    padding: '8px',
    margin: '4px'
  } : {};

  const content = (
    <>
      {title && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16
        }}>
          <Title level={level} style={{ margin: 0 }}>
            {title}
          </Title>
          {extra && <div>{extra}</div>}
        </div>
      )}
      {children}
    </>
  );

  if (bordered) {
    return (
      <Card
        size={size}
        style={{ ...debugStyle, ...style }}
        {...rest}
      >
        {content}
      </Card>
    );
  }

  return (
    <div style={{ ...debugStyle, ...style }} {...rest}>
      {content}
    </div>
  );
};

// Form Row - wraps Ant Design Row with responsive defaults
export const FormRow = ({
  gutter = [16, 16], // Default responsive gutter
  children,
  style,
  align = 'top',
  justify = 'start',
  wrap = true,
  ...rest
}) => {
  const debugBorders = process.env.REACT_APP_DEBUG_FORM_BORDERS === 'true';
  const debugStyle = debugBorders ? {
    border: '1px dashed orange',
    margin: '2px'
  } : {};

  return (
    <Row
      gutter={gutter}
      align={align}
      justify={justify}
      wrap={wrap}
      style={{ ...debugStyle, ...style }}
      {...rest}
    >
      {children}
    </Row>
  );
};

// Form Col - wraps Ant Design Col with responsive defaults
export const FormCol = ({
  span = 24,
  xs,
  sm,
  md,
  lg,
  xl,
  xxl,
  children,
  style,
  flex,
  offset,
  order,
  pull,
  push,
  ...rest
}) => {
  const debugBorders = process.env.REACT_APP_DEBUG_FORM_BORDERS === 'true';
  const debugStyle = debugBorders ? {
    border: '1px dashed purple',
    margin: '1px'
  } : {};

  return (
    <Col
      span={span}
      xs={xs}
      sm={sm}
      md={md}
      lg={lg}
      xl={xl}
      xxl={xxl}
      flex={flex}
      offset={offset}
      order={order}
      pull={pull}
      push={push}
      style={{ ...debugStyle, ...style }}
      {...rest}
    >
      {children}
    </Col>
  );
};

// Form Divider with consistent margins
export const FormDivider = ({
  margin = '24px 0',
  orientation = 'left',
  orientationMargin,
  dashed = false,
  plain = false,
  ...rest
}) => (
  <Divider
    style={{ margin }}
    orientation={orientation}
    orientationMargin={orientationMargin}
    dashed={dashed}
    plain={plain}
    {...rest}
  />
);

// Compact Field Group - Uses Space.Compact for tight layouts
export const CompactFieldGroup = ({
  children,
  direction = 'horizontal',
  size = 'small',
  style,
  ...rest
}) => {
  const debugBorders = process.env.REACT_APP_DEBUG_FORM_BORDERS === 'true';
  const debugStyle = debugBorders ? {
    border: '1px dashed cyan',
    padding: '4px',
    margin: '2px'
  } : {};

  return (
    <Space.Compact
      direction={direction}
      size={size}
      style={{ ...debugStyle, ...style }}
      {...rest}
    >
      {children}
    </Space.Compact>
  );
};

// Field Group - For grouping related fields with spacing
export const FieldGroup = ({
  children,
  direction = 'vertical',
  size = 'middle',
  align,
  wrap = true,
  split,
  style,
  ...rest
}) => {
  const debugBorders = process.env.REACT_APP_DEBUG_FORM_BORDERS === 'true';
  const debugStyle = debugBorders ? {
    border: '1px dashed teal',
    padding: '4px',
    margin: '2px'
  } : {};

  return (
    <Space
      direction={direction}
      size={size}
      align={align}
      wrap={wrap}
      split={split}
      style={{ ...debugStyle, ...style }}
      {...rest}
    >
      {children}
    </Space>
  );
};

// Responsive Field Row - Preset responsive layouts for common form patterns
export const ResponsiveFieldRow = ({
  children,
  layout = 'twoColumn', // 'oneColumn', 'twoColumn', 'threeColumn', 'fourColumn', 'auto'
  gutter = [16, 16],
  style,
  ...rest
}) => {
  const debugBorders = process.env.REACT_APP_DEBUG_FORM_BORDERS === 'true';
  const debugStyle = debugBorders ? {
    border: '1px dashed lime',
    margin: '2px'
  } : {};

  // Predefined responsive layouts
  const layouts = {
    oneColumn: { xs: 24, sm: 24, md: 24, lg: 24, xl: 24, xxl: 24 },
    twoColumn: { xs: 24, sm: 24, md: 12, lg: 12, xl: 12, xxl: 12 },
    threeColumn: { xs: 24, sm: 24, md: 12, lg: 8, xl: 8, xxl: 8 },
    fourColumn: { xs: 24, sm: 12, md: 12, lg: 6, xl: 6, xxl: 6 },
    auto: { xs: 24, sm: 'auto', md: 'auto', lg: 'auto', xl: 'auto', xxl: 'auto' }
  };

  const colProps = layouts[layout] || layouts.twoColumn;

  return (
    <Row
      gutter={gutter}
      style={{ ...debugStyle, ...style }}
      {...rest}
    >
      {React.Children.map(children, (child, index) => (
        <Col key={index} {...colProps}>
          {child}
        </Col>
      ))}
    </Row>
  );
};

// Inline Field Group - For compact inline layouts
export const InlineFieldGroup = ({
  children,
  size = 'small',
  align = 'center',
  style,
  ...rest
}) => {
  const debugBorders = process.env.REACT_APP_DEBUG_FORM_BORDERS === 'true';
  const debugStyle = debugBorders ? {
    border: '1px dashed coral',
    padding: '4px',
    margin: '2px'
  } : {};

  return (
    <Flex
      gap={size}
      align={align}
      wrap="wrap"
      style={{ ...debugStyle, ...style }}
      {...rest}
    >
      {children}
    </Flex>
  );
};

// Field Card - For grouping fields in a card layout
export const FieldCard = ({
  title,
  extra,
  children,
  size = 'default',
  bordered = true,
  style,
  ...rest
}) => {
  const debugBorders = process.env.REACT_APP_DEBUG_FORM_BORDERS === 'true';
  const debugStyle = debugBorders ? {
    border: '2px dashed gold',
    margin: '4px'
  } : {};

  return (
    <Card
      title={title}
      extra={extra}
      size={size}
      bordered={bordered}
      style={{ ...debugStyle, ...style }}
      {...rest}
    >
      {children}
    </Card>
  );
};