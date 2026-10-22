
function getSensorReadings(scenario = "normal") {
    const readings = {
        waterLevel: 42,
        waterLevelRise: 0.2,
        pumpStatus: "ON",
        pumpEfficiency: 95,
        drainageFlow: 80,
        sensorHealth: "HEALTHY"
    };

    if (scenario === "pump_failure") {
        readings.waterLevel = 68;
        readings.waterLevelRise = 2.5;
        readings.pumpStatus = "OFF";
        readings.pumpEfficiency = 0;
        readings.drainageFlow = 35;
    }

    if (scenario === "blocked_drainage") {
        readings.waterLevel = 60;
        readings.waterLevelRise = 1.8;
        readings.drainageFlow = 12;
    }

    if (scenario === "sensor_fault") {
        readings.waterLevel = 99;
        readings.waterLevelRise = 15;
        readings.sensorHealth = "SUSPECT";
    }

    return readings;
}

function diagnoseIncident(readings) {
    const evidence = [];
    let diagnosis = "NO_MAJOR_FAULT";
    let severity = "NORMAL";

    if (
        readings.pumpStatus === "OFF" &&
        readings.waterLevelRise > 1
    ) {
        diagnosis = "PUMP_FAILURE";
        severity = "CRITICAL";

        evidence.push("Pump is OFF");
        evidence.push("Water level is rising rapidly");
    } else if (
        readings.drainageFlow < 20 &&
        readings.waterLevelRise > 1
    ) {
        diagnosis = "BLOCKED_DRAINAGE";
        severity = "HIGH";

        evidence.push("Drainage flow is unusually low");
        evidence.push("Water level is rising rapidly");
    } else if (readings.sensorHealth === "SUSPECT") {
        diagnosis = "SENSOR_FAULT";
        severity = "WARNING";

        evidence.push("Sensor reports suspicious readings");
        evidence.push("Reading requires independent verification");
    }

    return {
        diagnosis,
        severity,
        evidence,
        engineerReviewRequired: severity !== "NORMAL"
    };
}

module.exports = {
    getSensorReadings,
    diagnoseIncident
};
