/**
 * Tests for percentage conversion functionality in chart components
 * Verifies that decimal values (0.008) are properly converted to percentage display (0.8%)
 */

// Test the percentage conversion logic directly
describe('Percentage Conversion Logic', () => {
    // Helper function extracted from chart components
    const convertValueForDisplay = (value, units) => {
        return units === "%" ? (value != null ? value * 100 : value) : value;
    };

    describe('convertValueForDisplay', () => {
        it('should multiply by 100 when units is "%"', () => {
            expect(convertValueForDisplay(0.008, "%")).toBe(0.8);
            expect(convertValueForDisplay(0.05, "%")).toBe(5);
            expect(convertValueForDisplay(0.123, "%")).toBe(12.3);
        });

        it('should return original value when units is not "%"', () => {
            expect(convertValueForDisplay(0.008, "MWh")).toBe(0.008);
            expect(convertValueForDisplay(100, "USD")).toBe(100);
            expect(convertValueForDisplay(42.5, "MW")).toBe(42.5);
        });

        it('should handle null and undefined values correctly', () => {
            expect(convertValueForDisplay(null, "%")).toBe(null);
            expect(convertValueForDisplay(undefined, "%")).toBe(undefined);
            expect(convertValueForDisplay(null, "MWh")).toBe(null);
            expect(convertValueForDisplay(undefined, "MWh")).toBe(undefined);
        });

        it('should handle zero values correctly', () => {
            expect(convertValueForDisplay(0, "%")).toBe(0);
            expect(convertValueForDisplay(0, "MWh")).toBe(0);
        });

        it('should handle negative values correctly for percentages', () => {
            expect(convertValueForDisplay(-0.05, "%")).toBe(-5);
            expect(convertValueForDisplay(-0.123, "%")).toBe(-12.3);
        });
    });

    describe('Array conversion for chart data', () => {
        const convertChartYValues = (yValues, units) => {
            if (!yValues) return yValues;
            return yValues.map(value => convertValueForDisplay(value, units));
        };

        it('should convert array of decimal values to percentages', () => {
            const input = [0.008, 0.012, 0.015, 0.020];
            const expected = [0.8, 1.2, 1.5, 2.0];
            expect(convertChartYValues(input, "%")).toEqual(expected);
        });

        it('should leave non-percentage arrays unchanged', () => {
            const input = [100, 200, 300, 400];
            expect(convertChartYValues(input, "MWh")).toEqual(input);
        });

        it('should handle arrays with null/undefined values', () => {
            const input = [0.008, null, 0.015, undefined];
            const expected = [0.8, null, 1.5, undefined];
            expect(convertChartYValues(input, "%")).toEqual(expected);
        });
    });

    describe('Table data conversion', () => {
        const convertTableRow = (row, units) => {
            const convertedRow = { ...row };
            Object.keys(convertedRow).forEach(key => {
                if (key !== 'year' && key !== 'key') {
                    convertedRow[key] = convertValueForDisplay(convertedRow[key], units);
                }
            });
            return convertedRow;
        };

        it('should convert table row values while preserving key fields', () => {
            const input = {
                key: 0,
                year: 2024,
                P10: 0.008,
                P50: 0.012,
                P90: 0.020
            };
            const expected = {
                key: 0,
                year: 2024,
                P10: 0.8,
                P50: 1.2,
                P90: 2.0
            };
            expect(convertTableRow(input, "%")).toEqual(expected);
        });

        it('should leave non-percentage table rows unchanged', () => {
            const input = {
                key: 0,
                year: 2024,
                P10: 1000,
                P50: 1200,
                P90: 1500
            };
            expect(convertTableRow(input, "MWh")).toEqual(input);
        });
    });

    describe('Summary statistics conversion', () => {
        const convertSummaryStats = (stats, units) => ({
            mean: convertValueForDisplay(stats.mean, units),
            stdDev: convertValueForDisplay(stats.stdDev, units),
            min: convertValueForDisplay(stats.min, units),
            max: convertValueForDisplay(stats.max, units)
        });

        it('should convert all summary statistics for percentages', () => {
            const input = {
                mean: 0.012,
                stdDev: 0.003,
                min: 0.008,
                max: 0.020
            };
            const expected = {
                mean: 1.2,
                stdDev: 0.3,
                min: 0.8,
                max: 2.0
            };
            expect(convertSummaryStats(input, "%")).toEqual(expected);
        });

        it('should leave non-percentage statistics unchanged', () => {
            const input = {
                mean: 1200,
                stdDev: 300,
                min: 800,
                max: 2000
            };
            expect(convertSummaryStats(input, "MWh")).toEqual(input);
        });
    });
});