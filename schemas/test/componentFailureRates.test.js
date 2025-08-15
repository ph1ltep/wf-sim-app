/**
 * Component Failure Rates Schema Tests
 * Tests for Yup schema validation and default values
 */

const { 
    ComponentFailureRateSchema, 
    ComponentFailureModelingSchema, 
    DEFAULT_COMPONENTS,
    COMPONENT_METADATA 
} = require('../yup/componentFailureRates');

describe('ComponentFailureRateSchema', () => {
    test('should validate with default values', async () => {
        const defaultComponent = ComponentFailureRateSchema.getDefault();
        
        expect(defaultComponent.enabled).toBe(false);
        expect(defaultComponent.failureRate.type).toBe('exponential');
        expect(defaultComponent.failureRate.parameters.lambda).toBe(0.025);
        expect(defaultComponent.costs).toBeDefined();
    });

    test('should validate failure rate distributions', async () => {
        const validDistributions = ['exponential', 'weibull', 'lognormal', 'normal', 'fixed'];
        
        for (const distribution of validDistributions) {
            const component = {
                enabled: true,
                failureRate: {
                    type: distribution,
                    parameters: { value: 0.02, lambda: 0.02 },
                    timeSeriesMode: false,
                    metadata: { percentileDirection: 'ascending' }
                }
            };
            
            await expect(ComponentFailureRateSchema.validate(component)).resolves.toBeTruthy();
        }
    });

    test('should validate cost components', async () => {
        const component = {
            enabled: true,
            costs: {
                componentReplacement: {
                    type: 'lognormal',
                    parameters: { mu: 13.1, sigma: 0.4, value: 500000 }
                },
                craneMobilization: {
                    type: 'triangular', 
                    parameters: { min: 80000, mode: 120000, max: 200000, value: 120000 }
                }
            }
        };

        await expect(ComponentFailureRateSchema.validate(component)).resolves.toBeTruthy();
    });
});

describe('ComponentFailureModelingSchema', () => {
    test('should validate with all 8 default components', async () => {
        const defaultConfig = ComponentFailureModelingSchema.getDefault();
        
        expect(defaultConfig.enabled).toBe(false);
        expect(defaultConfig.components).toBeDefined();
        
        const componentKeys = ['gearbox', 'generator', 'mainBearing', 'powerElectronics', 
                              'bladeBearings', 'yawSystem', 'controlSystem', 'transformer'];
        
        componentKeys.forEach(key => {
            expect(defaultConfig.components[key]).toBeDefined();
            expect(defaultConfig.components[key].enabled).toBe(false);
            expect(defaultConfig.components[key].failureRate).toBeDefined();
        });
    });

    test('should validate enabled configuration', async () => {
        const config = {
            enabled: true,
            components: {
                gearbox: {
                    enabled: true,
                    failureRate: {
                        type: 'exponential',
                        parameters: { lambda: 0.025, value: 0.025 }
                    }
                }
            }
        };

        await expect(ComponentFailureModelingSchema.validate(config)).resolves.toBeTruthy();
    });
});

describe('DEFAULT_COMPONENTS', () => {
    test('should have 8 components with proper default failure rates', () => {
        const expectedComponents = ['gearbox', 'generator', 'mainBearing', 'powerElectronics', 
                                   'bladeBearings', 'yawSystem', 'controlSystem', 'transformer'];
        
        expect(Object.keys(DEFAULT_COMPONENTS)).toEqual(expectedComponents);
        
        // Check specific default failure rates
        expect(DEFAULT_COMPONENTS.gearbox.failureRate.parameters.lambda).toBe(0.025); // 2.5%
        expect(DEFAULT_COMPONENTS.generator.failureRate.parameters.lambda).toBe(0.020); // 2.0%
        expect(DEFAULT_COMPONENTS.mainBearing.failureRate.parameters.lambda).toBe(0.018); // 1.8%
        expect(DEFAULT_COMPONENTS.controlSystem.failureRate.parameters.lambda).toBe(0.008); // 0.8%
    });
});

describe('COMPONENT_METADATA', () => {
    test('should have metadata for all components', () => {
        const componentKeys = Object.keys(DEFAULT_COMPONENTS);
        
        componentKeys.forEach(key => {
            expect(COMPONENT_METADATA[key]).toBeDefined();
            expect(COMPONENT_METADATA[key].name).toBeDefined();
            expect(COMPONENT_METADATA[key].description).toBeDefined();
            expect(COMPONENT_METADATA[key].icon).toBeDefined();
            expect(COMPONENT_METADATA[key].category).toBeDefined();
        });
    });
});

// Export for potential integration tests
module.exports = {
    ComponentFailureRateSchema,
    ComponentFailureModelingSchema,
    DEFAULT_COMPONENTS,
    COMPONENT_METADATA
};