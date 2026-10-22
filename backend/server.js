const { generateProgression } = require("./simulation");
const express = require("express");
const cors = require("cors");

const {
    getSensorReadings,
    diagnoseIncident
} = require("./sensors");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Home endpoint
app.get("/", (req, res) => {
    res.json({
        project: "RudaX",
        message: "From Alert to Action",
        status: "Backend is running"
    });
});

// List supported simulation scenarios
app.get("/api/scenarios", (req, res) => {
    res.json([
        { id: "normal", name: "Normal Operations" },
        { id: "pump_failure", name: "Pump Failure" },
        { id: "blocked_drainage", name: "Blocked Drainage" },
        { id: "sensor_fault", name: "Sensor Fault" }
    ]);
});

// Get sensor readings and diagnosis
app.get("/api/analyze", (req, res) => {
    const scenario = req.query.scenario || "normal";

    const allowedScenarios = [
        "normal",
        "pump_failure",
        "blocked_drainage",
        "sensor_fault"
    ];

    if (!allowedScenarios.includes(scenario)) {
        return res.status(400).json({
            error: "Unknown scenario",
            allowedScenarios
        });
    }

    const readings = getSensorReadings(scenario);
    const incident = diagnoseIncident(readings);

    res.json({
        scenario,
        readings,
        incident,
        simulated: true
    });
});

app.get("/api/progression", (req, res) => {
    const scenario = req.query.scenario || "normal";

    try {
        const result = generateProgression(scenario);
        res.json(result);
    } catch (error) {
        res.status(400).json({
            error: error.message
        });
    }
});


app.get("/api/assess-step", (req, res) => {
    const scenario = req.query.scenario || "normal";
    const minute = Number(req.query.minute || 0);

    const validScenarios = [
        "normal",
        "pump_failure",
        "blocked_drainage",
        "sensor_fault"
    ];

    if (!validScenarios.includes(scenario)) {
        return res.status(400).json({
            error: "Unknown simulation scenario"
        });
    }

    if (!Number.isFinite(minute) || minute < 0 || minute > 20) {
        return res.status(400).json({
            error: "Minute must be between 0 and 20"
        });
    }

    const { progression } = generateProgression(scenario);
    const step = progression.reduce((closest, point) =>
        Math.abs(point.minute - minute) < Math.abs(closest.minute - minute)
            ? point
            : closest
    );

    const baseReadings = getSensorReadings(scenario);

    const readings = {
        ...baseReadings,
        waterLevel: step.waterLevel,
        waterLevelRise:
            scenario === "pump_failure" ? 2.6 :
            scenario === "blocked_drainage" ? 1.8 : 0.2
    };

    const incident = diagnoseIncident(readings);

    res.json({
        scenario,
        minute: step.minute,
        readings,
        incident,
        simulated: true
    });
});


app.listen(PORT, () => {
    console.log(`RudaX backend running at http://localhost:${PORT}`);
});
