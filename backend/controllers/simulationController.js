// backend/controllers/simulationController.js
const { 
    runSimulation,
    createSimulationEngine
  } = require('../services/monte-carlo');
  
  const CostModule = require('../services/modules/costModule');
  const RevenueModule = require('../services/modules/revenueModule');
  const FinancingModule = require('../services/modules/financingModule');
  const RiskModule = require('../services/modules/riskModule');
  
  // Run a full simulation
  const runFullSimulation = async (req, res, next) => {
    try {
      const parameters = req.body;
      
      // Validate required parameters
      if (!parameters.general || !parameters.financing || !parameters.cost || !parameters.revenue) {
        return res.status(400).json({ 
          success: false, 
          error: 'Missing required parameters' 
        });
      }
      
      // Run the simulation
      const results = runSimulation(parameters);
      
      res.json(results);
    } catch (error) {
      next(error);
    }
  };
  
  // Run just the cost module
  const runCostModule = async (req, res, next) => {
    try {
      const parameters = req.body;
      
      // Validate parameters
      if (!parameters.cost || !parameters.general) {
        return res.status(400).json({ 
          success: false, 
          error: 'Missing required cost parameters' 
        });
      }
      
      // Create cost module and run
      const costModule = new CostModule();
      const results = costModule.runStandalone(parameters);
      
      res.json(results);
    } catch (error) {
      next(error);
    }
  };
  
  // Run just the revenue module
  const runRevenueModule = async (req, res, next) => {
    try {
      const parameters = req.body;
      
      // Validate parameters
      if (!parameters.revenue || !parameters.general) {
        return res.status(400).json({ 
          success: false, 
          error: 'Missing required revenue parameters' 
        });
      }
      
      // Create revenue module and run
      const revenueModule = new RevenueModule();
      const results = revenueModule.runStandalone(parameters);
      
      res.json(results);
    } catch (error) {
      next(error);
    }
  };
  
  // Run just the financing module
  const runFinancingModule = async (req, res, next) => {
    try {
      const parameters = req.body;
      
      // Validate parameters
      if (!parameters.financing || !parameters.general) {
        return res.status(400).json({ 
          success: false, 
          error: 'Missing required financing parameters' 
        });
      }
      
      // Create financing module and run
      const financingModule = new FinancingModule();
      const results = financingModule.runStandalone(parameters);
      
      res.json(results);
    } catch (error) {
      next(error);
    }
  };
  
  // Run just the risk mitigation module
  const runRiskModule = async (req, res, next) => {
    try {
      const parameters = req.body;
      
      // Validate parameters
      if (!parameters.riskMitigation || !parameters.general || !parameters.cost) {
        return res.status(400).json({ 
          success: false, 
          error: 'Missing required risk mitigation parameters' 
        });
      }
      
      // Create risk module and run
      const riskModule = new RiskModule();
      const results = riskModule.runStandalone(parameters);
      
      res.json(results);
    } catch (error) {
      next(error);
    }
  };
  
  // Get default parameter values
  const getDefaultParameters = async (req, res) => {
    const defaults = {
      general: {
        projectLife: 20,
        loanDuration: 15
      },
      financing: {
        capex: 50000000,
        devex: 10000000,
        model: 'Balance-Sheet',
        debtToEquityRatio: 1.5,
        debtToCapexRatio: 0.7,
        loanInterestRateBS: 5,
        loanInterestRatePF: 6,
        minimumDSCR: 1.3
      },
      cost: {
        annualBaseOM: 5000000,
        escalationRate: 2,
        escalationDistribution: 'Normal',
        oemTerm: 5,
        fixedOMFee: 4000000,
        failureEventProbability: 5,
        failureEventCost: 200000
      },
      revenue: {
        energyProduction: {
          distribution: 'Normal',
          mean: 1000,
          std: 100
        },
        electricityPrice: {
          type: 'fixed',
          value: 50
        },
        revenueDegradationRate: 0.5,
        downtimePerEvent: {
          distribution: 'Weibull',
          scale: 24,
          shape: 1.5
        },
        windVariabilityMethod: 'Default',
        turbulenceIntensity: 10,
        surfaceRoughness: 0.03,
        kaimalScale: 8.1
      },
      riskMitigation: {
        insuranceEnabled: false,
        insurancePremium: 50000,
        insuranceDeductible: 10000,
        reserveFunds: 0
      },
      simulation: {
        iterations: 10000,
        seed: 42
      },
      annualAdjustments: Array(20).fill().map((_, i) => ({
        year: i + 1,
        additionalOM: 0,
        additionalRevenue: 0
      }))
    };
    
    res.json({ success: true, defaults });
  };
  
  module.exports = {
    runFullSimulation,
    runCostModule,
    runRevenueModule,
    runFinancingModule,
    runRiskModule,
    getDefaultParameters
  };