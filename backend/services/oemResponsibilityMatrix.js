// backend/services/oemResponsibilityMatrix.js
/**
 * Utility service for generating the OEM responsibility matrix for the project lifetime
 */

/**
 * Generate a complete OEM responsibility matrix for the project lifetime
 * 
 * @param {number} projectLife - The project lifetime in years
 * @param {number} numWTGs - Number of wind turbine generators
 * @param {Array} oemContracts - Array of OEM contracts with their scope details
 * @returns {Object} The complete responsibility matrix
 */
const generateResponsibilityMatrix = (projectLife, numWTGs, oemContracts) => {
    // Initialize the result structure
    const result = {
      projectLife,
      numWTGs,
      yearlyResponsibilities: [],
      oemContracts: []
    };
  
    // Create a map of contract coverage by year
    const contractsByYear = {};
    
    // Process all contracts and map them to years
    oemContracts.forEach(contract => {
      // Skip invalid contracts
      if (!contract || !contract.startYear || !contract.endYear) return;
      
      // Add to contract reference list
      result.oemContracts.push({
        id: contract._id.toString(),
        name: contract.name,
        startYear: contract.startYear,
        endYear: contract.endYear,
        fixedFee: contract.fixedFee,
        isPerTurbine: contract.isPerTurbine,
        oemScope: contract.oemScope
      });
      
      // Map contract to each year it covers
      for (let year = contract.startYear; year <= Math.min(contract.endYear, projectLife); year++) {
        contractsByYear[year] = contract;
      }
    });
  
    // Generate yearly responsibilities for each year
    for (let year = 1; year <= projectLife; year++) {
      const contract = contractsByYear[year];
      
      // Create allocation object for this year
      const yearData = {
        year,
        oemContractId: contract ? contract._id.toString() : null,
        oemContractName: contract ? contract.name : null,
        scopeAllocations: generateScopeAllocations(contract),
        fixedFee: contract ? contract.fixedFee : 0,
        isPerTurbine: contract ? contract.isPerTurbine : false
      };
      
      result.yearlyResponsibilities.push(yearData);
    }
  
    return result;
  };
  
  /**
   * Generate scope allocations for a single year based on contract
   * 
   * @param {Object} contract - The OEM contract covering this year, or null
   * @returns {Object} The scope allocations for this year
   */
  const generateScopeAllocations = (contract) => {
    // Default allocations with owner responsible for everything
    const defaultAllocations = {
      preventiveMaintenance: { oem: 0.0, owner: 1.0 },
      bladeInspections: { oem: 0.0, owner: 1.0 },
      remoteMonitoring: { oem: 0.0, owner: 1.0 },
      remoteTechnicalSupport: { oem: 0.0, owner: 1.0 },
      siteManagement: { oem: 0.0, owner: 1.0 },
      technicians: { oem: 0.0, owner: 1.0 },
      correctiveMinor: { oem: 0.0, owner: 1.0 },
      bladeIntegrityManagement: { oem: 0.0, owner: 1.0 },
      craneCoverage: { 
        oem: 0.0, 
        owner: 1.0,
        eventCap: null,
        financialCap: null
      },
      correctiveMajor: {
        oem: 0.0,
        owner: 1.0,
        eventCap: null,
        financialCap: null,
        components: {
          tooling: { oem: 0.0, owner: 1.0 },
          manpower: { oem: 0.0, owner: 1.0 },
          parts: { oem: 0.0, owner: 1.0 }
        }
      }
    };
    
    // If no contract covers this year, return default allocations
    if (!contract || !contract.oemScope) {
      return defaultAllocations;
    }
    
    // Get the scope for this contract
    const scope = contract.oemScope;
    
    // Generate allocations based on contract scope
    const allocations = {
      preventiveMaintenance: getResponsibilitySplit(scope.preventiveMaintenance),
      bladeInspections: getResponsibilitySplit(scope.bladeInspections),
      remoteMonitoring: getResponsibilitySplit(scope.remoteMonitoring),
      remoteTechnicalSupport: getResponsibilitySplit(scope.remoteTechnicalSupport),
      siteManagement: getResponsibilitySplit(scope.siteManagement),
      // Technicians as a percentage
      technicians: getTechnicianSplit(scope),
      correctiveMinor: getResponsibilitySplit(scope.correctiveMinor),
      bladeIntegrityManagement: getResponsibilitySplit(scope.bladeIntegrityManagement),
      // Special handling for crane coverage with caps
      craneCoverage: {
        oem: scope.craneCoverage ? 1.0 : 0.0,
        owner: scope.craneCoverage ? 0.0 : 1.0,
        eventCap: scope.craneCoverage ? scope.craneEventCap || null : null,
        financialCap: scope.craneCoverage ? scope.craneFinancialCap || null : null
      },
      // Special handling for major components with detailed coverage
      correctiveMajor: {
        oem: scope.correctiveMajor ? 1.0 : 0.0,
        owner: scope.correctiveMajor ? 0.0 : 1.0,
        eventCap: scope.correctiveMajor ? scope.majorEventCap || null : null,
        financialCap: scope.correctiveMajor ? scope.majorFinancialCap || null : null,
        components: {
          tooling: getResponsibilitySplit(scope.correctiveMajor && scope.correctiveMajorDetails?.tooling),
          manpower: getResponsibilitySplit(scope.correctiveMajor && scope.correctiveMajorDetails?.manpower),
          parts: getResponsibilitySplit(scope.correctiveMajor && scope.correctiveMajorDetails?.parts)
        }
      }
    };
    
    return allocations;
  };
  
  /**
   * Convert a boolean coverage flag to a responsibility split
   * 
   * @param {boolean} isOemResponsible - Whether the OEM is responsible
   * @returns {Object} The responsibility split object
   */
  const getResponsibilitySplit = (isOemResponsible) => {
    return {
      oem: isOemResponsible ? 1.0 : 0.0,
      owner: isOemResponsible ? 0.0 : 1.0
    };
  };
  
  /**
   * Get the technician responsibility split
   * 
   * @param {Object} scope - The OEM scope object
   * @returns {Object} The technician responsibility split
   */
  const getTechnicianSplit = (scope) => {
    // Check if site management is enabled and technician percentage is set
    if (!scope.siteManagement) {
      return { oem: 0.0, owner: 1.0 };
    }
    
    // Get technician percentage and normalize to 0-1 range
    let oemPercent = 0.0;
    if (scope.technicianPercent !== undefined) {
      oemPercent = scope.technicianPercent / 100; // Convert from percentage to 0-1 scale
    }
    
    return {
      oem: oemPercent,
      owner: 1.0 - oemPercent
    };
  };
  
  module.exports = {
    generateResponsibilityMatrix
  };
  