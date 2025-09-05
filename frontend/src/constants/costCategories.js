// frontend/src/constants/costCategories.js

/**
 * Single source of truth for cost categories in the wind finance simulator.
 * These categories are used for:
 * - Market factor assignments
 * - Repair cost allocation
 * - Financial modeling and escalation
 */

export const COST_CATEGORIES = [
  {
    key: 'material',
    label: 'Material',
    description: 'Component and spare parts costs',
    icon: 'BuildOutlined'
  },
  {
    key: 'labor',
    label: 'Labor', 
    description: 'Technician and specialist costs',
    icon: 'TeamOutlined'
  },
  {
    key: 'tooling',
    label: 'Tooling',
    description: 'Equipment and tool rental',
    icon: 'ToolOutlined'
  },
  {
    key: 'crane',
    label: 'Crane',
    description: 'Crane mobilization and operation',
    icon: 'DeploymentUnitOutlined'
  },
  {
    key: 'contractsLocal',
    label: 'Contracts (Local)',
    description: 'Local contracting and service costs',
    icon: 'HomeOutlined'
  },
  {
    key: 'contractsForeign',
    label: 'Contracts (Foreign)', 
    description: 'International contracting and logistics',
    icon: 'GlobalOutlined'
  },
  {
    key: 'other',
    label: 'Other',
    description: 'Additional and contingency costs',
    icon: 'EllipsisOutlined'
  }
];

/**
 * Core cost categories used in repair package schemas (legacy 5-category model)
 */
export const CORE_COST_CATEGORIES = COST_CATEGORIES.slice(0, 4).concat(COST_CATEGORIES.slice(-1));

/**
 * Cost category keys only (for validation and mapping)
 */
export const COST_CATEGORY_KEYS = COST_CATEGORIES.map(category => category.key);

/**
 * Core cost category keys only (for schema validation)
 */
export const CORE_COST_CATEGORY_KEYS = CORE_COST_CATEGORIES.map(category => category.key);

/**
 * Cost category lookup by key
 */
export const COST_CATEGORY_MAP = COST_CATEGORIES.reduce((map, category) => {
  map[category.key] = category;
  return map;
}, {});

/**
 * Default market factor mapping for cost categories
 */
export const DEFAULT_COST_CATEGORY_FACTOR_MAPPING = COST_CATEGORY_KEYS.reduce((mapping, key) => {
  mapping[key] = 'baseEscalationRate';
  return mapping;
}, {});