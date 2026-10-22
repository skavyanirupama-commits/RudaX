
const SCENARIO_CONFIG = {
    normal: {
        startLevel: 42,
        risePerStep: 0.2,
        pumpStatus: "ON",
        pumpEfficiency: 95,
        drainageFlow: 80,
        sensorHealth: "HEALTHY"
    },

    pump_failure: {
        startLevel: 42,
        risePerStep: 2.6,
        pumpStatus: "OFF",
        pumpEfficiency: 0,
        drainageFlow: 35,
        sensorHealth: "HEALTHY"
    },

    blocked_drainage: {
        startLevel: 42,
        risePerStep: 1.8,
        pumpStatus: "ON",
        pumpEfficiency: 90,
        drainageFlow: 12,
        sensorHealth: "HEALTHY"
    },

    sensor_fault: {
        startLevel: 42,
        risePerStep: 0.2,
        pumpStatus: "ON",
        pumpEfficiency: 95,
        drainageFlow: 80,
        sensorHealth: "SUSPECT"
    }
};

function generateProgression(scenario = "normal") {
    const config = SCENARIO_CONFIG[scenario];

    if (!config) {
        throw new Error("Unknown simulation scenario");
    }

    const progression = [];

    for (let step = 0; step <= 10; step++) {
        const waterLevel = Math.min(
            100,
            Number((config.startLevel + config.risePerStep * step).toFixed(1))
        );

        progression.push({
            minute: step * 2,
            waterLevel,
            pumpStatus: config.pumpStatus
        });
    }

    return {
        scenario,
        simulated: true,
        intervalMinutes: 2,
        progression
    };
}

module.exports = { generateProgression };
