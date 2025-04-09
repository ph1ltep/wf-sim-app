// backend/services/monte-carlo-v2/engine/resultsFormatter.js
/**
 * Formats simulation results into standardized output formats
 */
class ResultsFormatter {
    /**
     * Format Monte Carlo simulation results into a standard API response
     * @param {Object} simulationResults - Raw simulation results
     * @returns {Object} Formatted API response
     */
    static formatAPIResponse(simulationResults) {
        return {
            success: Object.keys(simulationResults.errors).length === 0,
            simulationInfo: {
                distributions: simulationResults.simulationInfo.distributions,
                iterations: simulationResults.simulationInfo.iterations,
                seed: simulationResults.simulationInfo.seed,
                years: simulationResults.simulationInfo.years,
                timeElapsed: simulationResults.simulationInfo.timeElapsed
            },
            results: simulationResults.results,
            errors: simulationResults.errors
        };
    }

    /**
     * Format results for a specific distribution into CSV format
     * @param {Array} distributionResults - Distribution simulation results
     * @param {Object} options - Formatting options
     * @returns {string} CSV formatted results
     */
    static formatDistributionCSV(distributionResults, options = {}) {
        if (!distributionResults || !Array.isArray(distributionResults)) {
            return '';
        }

        // Default options
        const opts = {
            includeHeaders: options.includeHeaders !== false,
            delimiter: options.delimiter || ',',
            ...options
        };

        // Build CSV rows
        const rows = [];

        // Add headers if requested
        if (opts.includeHeaders) {
            const percentiles = distributionResults.map(r => `P${r.percentile.value}`);
            rows.push(['Year', ...percentiles].join(opts.delimiter));
        }

        // Get the number of years from the first result
        if (distributionResults.length === 0 || !distributionResults[0].data) {
            return rows.join('\n');
        }

        const years = distributionResults[0].data.length;

        // Add data rows
        for (let year = 0; year < years; year++) {
            const yearNum = year + 1;
            const values = distributionResults.map(r => r.data[year].value);
            rows.push([yearNum, ...values].join(opts.delimiter));
        }

        return rows.join('\n');
    }

    /**
     * Format simulation results for export to Excel
     * @param {Object} simulationResults - Raw simulation results
     * @returns {Object} Data structured for Excel export
     */
    static formatForExcel(simulationResults) {
        const sheets = {};

        // Create a sheet for each distribution
        for (const [distributionId, results] of Object.entries(simulationResults.results)) {
            // Get distribution info
            const distributionInfo = simulationResults.simulationInfo.distributions[distributionId] || {};

            // Create sheet data
            const sheet = {
                name: `${distributionId} (${distributionInfo.type || 'unknown'})`,
                headers: ['Year'],
                rows: []
            };

            // Add percentile headers
            results.forEach(r => {
                sheet.headers.push(`P${r.percentile.value}`);
            });

            // Add data rows
            if (results.length > 0 && results[0].data) {
                const years = results[0].data.length;

                for (let year = 0; year < years; year++) {
                    const row = [year + 1];
                    results.forEach(r => {
                        row.push(r.data[year].value);
                    });
                    sheet.rows.push(row);
                }
            }

            // Add to sheets
            sheets[distributionId] = sheet;
        }

        // Create a summary sheet
        const summary = {
            name: 'Simulation Summary',
            headers: ['Property', 'Value'],
            rows: [
                ['Total Distributions', Object.keys(simulationResults.results).length],
                ['Monte Carlo Iterations', simulationResults.simulationInfo.iterations],
                ['Random Seed', simulationResults.simulationInfo.seed],
                ['Simulation Years', simulationResults.simulationInfo.years],
                ['Processing Time (ms)', simulationResults.simulationInfo.timeElapsed]
            ]
        };

        // Add error summary if there are any errors
        if (Object.keys(simulationResults.errors).length > 0) {
            summary.rows.push(['Errors', Object.keys(simulationResults.errors).length]);

            // Add individual errors
            for (const [distId, errors] of Object.entries(simulationResults.errors)) {
                errors.forEach(error => {
                    summary.rows.push([`Error in ${distId}`, error]);
                });
            }
        }

        sheets['_summary'] = summary;

        return {
            filename: `monte_carlo_simulation_${Date.now()}.xlsx`,
            sheets
        };
    }

    /**
     * Format distribution results for chart visualization
     * @param {Array} distributionResults - Distribution simulation results
     * @returns {Object} Formatted data for charts
     */
    static formatForCharts(distributionResults) {
        if (!distributionResults || !Array.isArray(distributionResults)) {
            return { series: [], categories: [] };
        }

        // Create series for each percentile
        const series = distributionResults.map(result => {
            return {
                name: `P${result.percentile.value}`,
                data: result.data.map(dp => dp.value)
            };
        });

        // Create year categories
        const categories = distributionResults[0]?.data.map(dp => dp.year) || [];

        return {
            series,
            categories
        };
    }
}

module.exports = ResultsFormatter;