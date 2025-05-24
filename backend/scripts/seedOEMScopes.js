// backend/scripts/seedOEMScopes.js
require('dotenv').config();
const mongoose = require('mongoose');
const OEMScope = require('../../schemas/mongoose/oemScope');
const { connectDB } = require('../config/db');

// Default OEM service scope data
const defaultOEMScopes = [
    // Vestas
    {
        name: "Vestas AOM 3000",
        isDefault: true,
        preventiveMaintenance: true,
        bladeInspections: true,
        blade: false,
        bladeLEP: false,
        remoteMonitoring: true,
        remoteTechnicalSupport: true,
        sitePersonnel: "partial",
        siteManagement: false,
        technicianPercent: 50,
        correctiveMinor: true,
        correctiveMajor: false,
        bladeIntegrityManagement: false,
        craneCoverage: false,
        craneEventCap: 0,
        craneFinancialCap: 0,
        majorEventCap: 0,
        majorFinancialCap: 0
    },
    {
        name: "Vestas AOM 4000",
        isDefault: false,
        preventiveMaintenance: true,
        bladeInspections: true,
        blade: true,
        bladeLEP: false,
        remoteMonitoring: true,
        remoteTechnicalSupport: true,
        sitePersonnel: "partial",
        siteManagement: false,
        technicianPercent: 75,
        correctiveMinor: true,
        correctiveMajor: true,
        bladeIntegrityManagement: false,
        craneCoverage: false,
        craneEventCap: 0,
        craneFinancialCap: 0,
        majorEventCap: 0,
        majorFinancialCap: 0
    },
    {
        name: "Vestas AOM 5000",
        isDefault: false,
        preventiveMaintenance: true,
        bladeInspections: true,
        blade: true,
        bladeLEP: true,
        remoteMonitoring: true,
        remoteTechnicalSupport: true,
        sitePersonnel: "full",
        siteManagement: true,
        technicianPercent: 100,
        correctiveMinor: true,
        correctiveMajor: true,
        bladeIntegrityManagement: true,
        craneCoverage: true,
        craneEventCap: 5,
        craneFinancialCap: 1000000,
        majorEventCap: 3,
        majorFinancialCap: 2000000
    },

    // Siemens Gamesa Renewable Energy (SGRE)
    {
        name: "SGRE Basic O&M",
        isDefault: true,
        preventiveMaintenance: true,
        bladeInspections: true,
        blade: false,
        bladeLEP: false,
        remoteMonitoring: true,
        remoteTechnicalSupport: true,
        sitePersonnel: "partial",
        siteManagement: false,
        technicianPercent: 50,
        correctiveMinor: true,
        correctiveMajor: false,
        bladeIntegrityManagement: false,
        craneCoverage: false,
        craneEventCap: 0,
        craneFinancialCap: 0,
        majorEventCap: 0,
        majorFinancialCap: 0
    },
    {
        name: "SGRE Full Service 300W",
        isDefault: false,
        preventiveMaintenance: true,
        bladeInspections: true,
        blade: true,
        bladeLEP: true,
        remoteMonitoring: true,
        remoteTechnicalSupport: true,
        sitePersonnel: "full",
        siteManagement: true,
        technicianPercent: 100,
        correctiveMinor: true,
        correctiveMajor: true,
        bladeIntegrityManagement: true,
        craneCoverage: true,
        craneEventCap: 0,
        craneFinancialCap: 0,
        majorEventCap: 0,
        majorFinancialCap: 0
    },

    // GE Renewable Energy
    {
        name: "GE Essential Service",
        isDefault: true,
        preventiveMaintenance: true,
        bladeInspections: true,
        blade: false,
        bladeLEP: false,
        remoteMonitoring: true,
        remoteTechnicalSupport: true,
        sitePersonnel: "partial",
        siteManagement: false,
        technicianPercent: 50,
        correctiveMinor: true,
        correctiveMajor: false,
        bladeIntegrityManagement: false,
        craneCoverage: false,
        craneEventCap: 0,
        craneFinancialCap: 0,
        majorEventCap: 0,
        majorFinancialCap: 0
    },
    {
        name: "GE Comprehensive Service",
        isDefault: false,
        preventiveMaintenance: true,
        bladeInspections: true,
        blade: true,
        bladeLEP: true,
        remoteMonitoring: true,
        remoteTechnicalSupport: true,
        sitePersonnel: "full",
        siteManagement: true,
        technicianPercent: 100,
        correctiveMinor: true,
        correctiveMajor: true,
        bladeIntegrityManagement: true,
        craneCoverage: true,
        craneEventCap: 3,
        craneFinancialCap: 600000,
        majorEventCap: 2,
        majorFinancialCap: 1200000
    },

    // Goldwind
    {
        name: "Goldwind Core Service",
        isDefault: true,
        preventiveMaintenance: true,
        bladeInspections: true,
        blade: false,
        bladeLEP: false,
        remoteMonitoring: true,
        remoteTechnicalSupport: true,
        sitePersonnel: "partial",
        siteManagement: false,
        technicianPercent: 50,
        correctiveMinor: true,
        correctiveMajor: false,
        bladeIntegrityManagement: false,
        craneCoverage: false,
        craneEventCap: 0,
        craneFinancialCap: 0,
        majorEventCap: 0,
        majorFinancialCap: 0
    },
    {
        name: "Goldwind Advanced Service",
        isDefault: false,
        preventiveMaintenance: true,
        bladeInspections: true,
        blade: true,
        bladeLEP: true,
        remoteMonitoring: true,
        remoteTechnicalSupport: true,
        sitePersonnel: "full",
        siteManagement: true,
        technicianPercent: 100,
        correctiveMinor: true,
        correctiveMajor: true,
        bladeIntegrityManagement: true,
        craneCoverage: true,
        craneEventCap: 5,
        craneFinancialCap: 1000000,
        majorEventCap: 3,
        majorFinancialCap: 2000000
    },

    // Envision Energy (added as a fifth major OEM)
    {
        name: "Envision Basic Service",
        isDefault: true,
        preventiveMaintenance: true,
        bladeInspections: true,
        blade: false,
        bladeLEP: false,
        remoteMonitoring: true,
        remoteTechnicalSupport: true,
        sitePersonnel: "partial",
        siteManagement: false,
        technicianPercent: 50,
        correctiveMinor: true,
        correctiveMajor: false,
        bladeIntegrityManagement: false,
        craneCoverage: false,
        craneEventCap: 0,
        craneFinancialCap: 0,
        majorEventCap: 0,
        majorFinancialCap: 0
    },
    {
        name: "Envision Enhanced Service",
        isDefault: false,
        preventiveMaintenance: true,
        bladeInspections: true,
        blade: true,
        bladeLEP: true,
        remoteMonitoring: true,
        remoteTechnicalSupport: true,
        sitePersonnel: "full",
        siteManagement: true,
        technicianPercent: 100,
        correctiveMinor: true,
        correctiveMajor: true,
        bladeIntegrityManagement: true,
        craneCoverage: true,
        craneEventCap: 4,
        craneFinancialCap: 800000,
        majorEventCap: 2,
        majorFinancialCap: 1500000
    }
];

// Function to seed the database
async function seedOEMScopes() {
    try {
        console.log('Connecting to MongoDB...');
        await connectDB();

        console.log('Checking for existing OEM scopes...');
        const count = await OEMScope.countDocuments();

        if (count > 0) {
            console.log(`Found ${count} existing OEM scopes. Checking for updates...`);

            // Update existing scopes or add new ones
            for (const scope of defaultOEMScopes) {
                await OEMScope.findOneAndUpdate(
                    { name: scope.name },
                    scope,
                    { upsert: true, new: true, setDefaultsOnInsert: true }
                );
                console.log(`Upserted: ${scope.name}`);
            }
        } else {
            console.log('No existing OEM scopes found. Creating defaults...');
            await OEMScope.insertMany(defaultOEMScopes);
            console.log(`Inserted ${defaultOEMScopes.length} default OEM scopes`);
        }

        console.log('Seeding completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding OEM scopes:', error);
        process.exit(1);
    }
}

// If called directly, run the seed function
if (require.main === module) {
    seedOEMScopes();
}

// Export the seed function
module.exports = { seedOEMScopes };