import { hexToRgb } from './plotUtils';


/**
 * Helper function for organizing percentiles
 */
function organizePercentiles(percentileResults, primaryPercentileValue) {
    if (!percentileResults || percentileResults.length === 0) {
        return {
            primary: null,
            percentilePairs: [],
            singles: []
        };
    }

    // Sort percentiles by value (ascending)
    const sorted = [...percentileResults].sort((a, b) => a.percentile.value - b.percentile.value);

    // Find the primary percentile
    const primaryIndex = sorted.findIndex(p => p.percentile.value === primaryPercentileValue);
    const primary = primaryIndex >= 0 ? sorted[primaryIndex] : sorted[Math.floor(sorted.length / 2)];

    // Determine the percentile pairs for visualization
    let percentilePairs = [];
    let singles = [];

    if (sorted.length <= 1) {
        if (sorted.length === 1) {
            singles = [sorted[0]];
        }
    } else if (sorted.length === 2) {
        if (sorted[0].percentile.value === primaryPercentileValue ||
            sorted[1].percentile.value === primaryPercentileValue) {
            percentilePairs = [{
                lower: primaryPercentileValue === sorted[0].percentile.value ? null : sorted[0],
                upper: primaryPercentileValue === sorted[1].percentile.value ? null : sorted[1],
                opacity: 0.3,
                name: `P${sorted[0].percentile.value}-P${sorted[1].percentile.value}`
            }];
        } else {
            singles = sorted;
        }
    } else {
        const withoutPrimary = sorted.filter(p => p.percentile.value !== primary.percentile.value);
        const below = withoutPrimary.filter(p => p.percentile.value < primary.percentile.value);
        const above = withoutPrimary.filter(p => p.percentile.value > primary.percentile.value);
        const maxPairs = Math.min(below.length, above.length);

        for (let i = 0; i < maxPairs; i++) {
            const lowerIndex = below.length - 1 - i;
            const upperIndex = i;
            percentilePairs.push({
                lower: below[lowerIndex],
                upper: above[upperIndex],
                opacity: 0.3 - (i * 0.1),
                name: `P${below[lowerIndex].percentile.value}-P${above[upperIndex].percentile.value}`
            });
        }

        if (below.length > maxPairs) {
            singles = singles.concat(below.slice(0, below.length - maxPairs));
        }
        if (above.length > maxPairs) {
            singles = singles.concat(above.slice(maxPairs));
        }
    }

    return {
        primary,
        percentilePairs,
        singles
    };
}

// Export utilities
export const PlotTableUtils = {
    organizePercentiles
};