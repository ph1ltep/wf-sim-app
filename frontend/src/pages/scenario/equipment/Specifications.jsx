// frontend/src/pages/scenario/equipment/Specifications.jsx
import React, { useState, useEffect } from 'react';
import { Typography, Alert } from 'antd';
import { useScenario } from 'contexts/ScenarioContext';
import { GlobalOutlined } from '@ant-design/icons';
import { getAllLocations } from 'api/locations';

// Import project-specific components
import LocationSelector from 'components/forms/selectors/LocationSelector';
import ProjectMetrics from 'components/cards/ProjectMetrics';

// Import context field components
import {
    FormSection,
    NumberField,
    SelectField,
    PercentageField,
    ResponsiveFieldRow,
    FormDivider,
    CompactFieldGroup,
    FieldCard
} from 'components/contextFields';

const { Title } = Typography;

const Specifications = () => {
    // Base paths for different parts of equipment settings
    const windFarmPath = ['settings', 'project', 'windFarm'];
    const bladesPath = ['settings', 'project', 'equipment', 'blades'];

    // Get scenario context
    const {
        scenarioData,
        getValueByPath,
        updateByPath,
        selectedLocation,
        updateSelectedLocation
    } = useScenario();

    // State to track fields from locations
    const [fieldsFromLocations, setFieldsFromLocations] = useState({
        capacityFactor: false
    });

    // State for locations
    const [locations, setLocations] = useState([]);
    const [loadingLocations, setLoadingLocations] = useState(false);

    // Get calculated metrics from context
    const calculatedMetrics = getValueByPath(['settings', 'metrics'], {});

    // Fetch locations
    useEffect(() => {
        const fetchLocations = async () => {
            try {
                setLoadingLocations(true);
                const response = await getAllLocations();

                if (response.success && response.data) {
                    setLocations(response.data);
                }
            } catch (error) {
                console.error('Error fetching locations:', error);
            } finally {
                setLoadingLocations(false);
            }
        };

        fetchLocations();
    }, []);

    // Handle location selection change
    const handleLocationChange = (locationId) => {
        const locationData = locations.find(loc => loc._id === locationId);
        if (locationData) {
            updateSelectedLocation(locationData);
        }
    };

    // Load location defaults
    const loadLocationDefaults = () => {
        if (!selectedLocation) return;

        // Prepare updates for location-specific fields
        const updates = {
            [`${windFarmPath.join('.')}.capacityFactor`]: selectedLocation.capacityFactor
        };

        // Apply updates and mark fields as coming from locations
        updateByPath(updates);
        setFieldsFromLocations({
            capacityFactor: true
        });
    };

    // Check if we have an active scenario
    if (!scenarioData) {
        return (
            <div>
                <Title level={2}>Equipment Specifications</Title>
                <Alert
                    message="No Active Scenario"
                    description="Please create or load a scenario first."
                    type="warning"
                />
            </div>
        );
    }

    return (
        <div>
            <Title level={2}>Equipment Specifications</Title>
            <p>Configure the wind turbine specifications and view calculated project metrics.</p>

            {/* Location selection */}
            <LocationSelector
                selectedLocation={selectedLocation}
                locations={locations}
                loading={loadingLocations}
                onLocationChange={handleLocationChange}
                onLoadDefaults={loadLocationDefaults}
            />

            {/* Wind Farm Configuration Card */}
            <FieldCard>
                <FormSection title="Wind Farm Configuration">
                    <ResponsiveFieldRow layout="threeColumn">
                        <NumberField
                            path={[...windFarmPath, 'numWTGs']}
                            label="Number of WTGs"
                            tooltip="Number of wind turbine generators in the project"
                            min={1}
                            step={1}
                            required
                            affectedMetrics={['totalMW', 'grossAEP', 'netAEP', 'componentQuantities']}
                        />
                        <NumberField
                            path={[...windFarmPath, 'mwPerWTG']}
                            label="Megawatts per WTG"
                            tooltip="Nameplate capacity of each wind turbine in megawatts"
                            min={0.1}
                            step={0.1}
                            precision={2}
                            required
                            affectedMetrics={['totalMW', 'grossAEP', 'netAEP']}
                        />
                        <SelectField
                            path={[...windFarmPath, 'wtgPlatformType']}
                            label="WTG Platform Type"
                            tooltip="Type of wind turbine generator platform"
                            options={[
                                { value: 'geared', label: 'Geared' },
                                { value: 'direct-drive', label: 'Direct Drive' }
                            ]}
                            required
                            affectedMetrics={['componentQuantities']}
                        />
                    </ResponsiveFieldRow>
                </FormSection>

                <FormDivider margin="small" orientation="left" />

                {/* Performance Parameters */}
                <FormSection title="Performance Parameters">
                    <ResponsiveFieldRow layout="oneColumn">
                        <NumberField
                            path={[...windFarmPath, 'capacityFactor']}
                            label={
                                fieldsFromLocations.capacityFactor ?
                                    <>Capacity Factor (%) <GlobalOutlined style={{ color: '#1890ff' }} /></> :
                                    "Capacity Factor (%)"
                            }
                            tooltip="Expected capacity factor as a percentage of nameplate capacity"
                            min={1}
                            max={60}
                            step={0.5}
                            precision={2}
                            required
                            affectedMetrics={['grossAEP', 'netAEP']}
                        />
                    </ResponsiveFieldRow>

                    <ResponsiveFieldRow layout="twoColumn">
                        <PercentageField
                            path={[...windFarmPath, 'curtailmentLosses']}
                            label="Curtailment Losses"
                            tooltip="Energy losses due to grid curtailment or operational restrictions"
                            min={0}
                            max={30}
                            step={0.5}
                            precision={2}
                            affectedMetrics={['netAEP']}
                        />
                        <PercentageField
                            path={[...windFarmPath, 'electricalLosses']}
                            label="Electrical Losses"
                            tooltip="Energy losses in electrical systems, transformers, and transmission"
                            min={0}
                            max={15}
                            step={0.5}
                            precision={2}
                            affectedMetrics={['netAEP']}
                        />
                    </ResponsiveFieldRow>
                </FormSection>
            </FieldCard>

            {/* Project Metrics Card */}
            <ProjectMetrics calculatedValues={calculatedMetrics} />
        </div>
    );
};

export default Specifications;