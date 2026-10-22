
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Droplets,
  Gauge,
  GitBranch,
  HardHat,
  Play,
  Pause,
  RotateCcw,
  ShieldCheck,
  Waves,
  Zap,
} from "lucide-react";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import "./App.css";

const API = "http://localhost:3000";

const SCENARIOS = [
  {
    value: "pump_failure",
    label: "Pump Failure",
    description: "Pump offline and water level rising rapidly.",
  },
  {
    value: "blocked_drainage",
    label: "Blocked Drainage",
    description: "Restricted drainage flow causes water accumulation.",
  },
  {
    value: "sensor_fault",
    label: "Sensor Fault",
    description: "Suspicious sensor reading requires verification.",
  },
  {
    value: "normal",
    label: "Normal Operations",
    description: "Water level stable and equipment operating normally.",
  },
];

const RECOMMENDATIONS = {
  PUMP_FAILURE: [
    [
      "01",
      "Verify pump power",
      "Check the pump status and control panel from a safe location.",
    ],
    [
      "02",
      "Check backup pumping",
      "Assess available backup capacity with authorized personnel.",
    ],
    [
      "03",
      "Escalate the incident",
      "Follow the site's emergency procedure and access restrictions.",
    ],
  ],

  BLOCKED_DRAINAGE: [
    [
      "01",
      "Inspect the drainage path",
      "Check for a possible obstruction from a safe location.",
    ],
    [
      "02",
      "Compare water levels",
      "Compare upstream and downstream readings.",
    ],
    [
      "03",
      "Request an engineering review",
      "Authorized personnel must approve any maintenance action.",
    ],
  ],

  SENSOR_FAULT: [
    [
      "01",
      "Verify the reading",
      "Compare the suspicious value with an independent measurement.",
    ],
    [
      "02",
      "Inspect the sensor",
      "Check sensor condition, connections, and calibration.",
    ],
    [
      "03",
      "Keep the incident under review",
      "Do not dismiss a possible hazard until verified.",
    ],
  ],

  NO_MAJOR_FAULT: [
    [
      "01",
      "Continue monitoring",
      "Observe the water level and equipment indicators.",
    ],
    [
      "02",
      "Cross-check readings",
      "Compare available measurements for consistency.",
    ],
    [
      "03",
      "Follow site procedures",
      "Escalate if readings move outside expected limits.",
    ],
  ],
};

function MetricCard({
  icon: Icon,
  label,
  value,
  unit,
  status,
  tone = "teal",
  detail,
}) {
  return (
    <article className="metric-card">
      <div className="metric-top">
        <span className={`metric-icon ${tone}`}>
          <Icon size={18} />
        </span>

        <span className="metric-label">{label}</span>
        <span className="metric-dot" />
      </div>

      <div className="metric-value">
        {value ?? "—"}
        {unit && <small>{unit}</small>}
      </div>

      <div className="metric-status">{status}</div>

      {detail && <div className="metric-detail">{detail}</div>}
    </article>
  );
}

function severityClass(severity) {
  return String(severity || "loading").toLowerCase();
}

export default function App() {
  const [scenario, setScenario] = useState("pump_failure");
  const [data, setData] = useState(null);
  const [progression, setProgression] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [stepAssessment, setStepAssessment] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const timerRef = useRef(null);

  // Load the selected scenario's analysis and timeline.
  useEffect(() => {
    let active = true;

    setLoading(true);
    setError("");
    setData(null);
    setStepAssessment(null);
    setProgression([]);
    setCurrentStep(0);
    setIsPlaying(false);

    async function loadScenario() {
      try {
        const [analysisResponse, progressionResponse] =
          await Promise.all([
            fetch(
              `${API}/api/analyze?scenario=${encodeURIComponent(scenario)}`
            ),
            fetch(
              `${API}/api/progression?scenario=${encodeURIComponent(scenario)}`
            ),
          ]);

        if (!analysisResponse.ok || !progressionResponse.ok) {
          throw new Error("The backend returned an error.");
        }

        const [analysis, timeline] = await Promise.all([
          analysisResponse.json(),
          progressionResponse.json(),
        ]);

        if (!active) return;

        setData(analysis);
        setProgression(timeline.progression || []);
      } catch (err) {
        if (!active) return;

        setError(
          "Cannot load scenario data. Check that the backend is running on port 3000."
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    loadScenario();

    return () => {
      active = false;
    };
  }, [scenario]);

  const simulatedReading = progression[currentStep];

  const displayedWaterLevel =
    simulatedReading?.waterLevel ?? data?.readings?.waterLevel;

  const visibleProgression = useMemo(() => {
    return progression.slice(0, currentStep + 1).map((point) => ({
      time: `${point.minute} min`,
      minute: point.minute,
      level: point.waterLevel,
    }));
  }, [progression, currentStep]);

  // Get the diagnosis for the current point in the simulation.
  useEffect(() => {
    const minute = simulatedReading?.minute;

    if (minute === undefined) return;

    let active = true;

    async function loadAssessment() {
      try {
        const response = await fetch(
          `${API}/api/assess-step?scenario=${encodeURIComponent(
            scenario
          )}&minute=${minute}`
        );

        if (!response.ok) {
          throw new Error("Assessment request failed.");
        }

        const result = await response.json();

        if (active) {
          setStepAssessment(result);
        }
      } catch {
        if (active) {
          // Fall back to the scenario's overall analysis.
          setStepAssessment(null);
        }
      }
    }

    loadAssessment();

    return () => {
      active = false;
    };
  }, [scenario, simulatedReading?.minute]);

  // Playback timer.
  useEffect(() => {
    if (!isPlaying || progression.length === 0) {
      return undefined;
    }

    timerRef.current = setInterval(() => {
      setCurrentStep((previous) => {
        if (previous >= progression.length - 1) {
          setIsPlaying(false);
          return previous;
        }

        return previous + 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isPlaying, progression.length]);

  // IMPORTANT:
  // Overall incident status comes from incident.severity.
  // Sensor health is a separate measurement.
  const readings = stepAssessment?.readings ?? data?.readings;
  const incident = stepAssessment?.incident ?? data?.incident;

  const severity = incident?.severity ?? "UNKNOWN";
  const diagnosis = incident?.diagnosis ?? "WAITING_FOR_DATA";

  const isNormal = severity === "NORMAL";
  const isSensorFault = diagnosis === "SENSOR_FAULT";

  const recommendations =
    RECOMMENDATIONS[diagnosis] || RECOMMENDATIONS.NO_MAJOR_FAULT;

  const selectedScenario = SCENARIOS.find(
    (item) => item.value === scenario
  );

  const levelColor =
    displayedWaterLevel >= 60 ? "#ff737b" : "#49dfc6";

  const progressPercent =
    progression.length > 1
      ? (currentStep / (progression.length - 1)) * 100
      : 0;

  function playSimulation() {
    if (!progression.length) return;

    if (currentStep >= progression.length - 1) {
      setCurrentStep(0);
    }

    setIsPlaying(true);
  }

  function pauseSimulation() {
    setIsPlaying(false);
  }

  function resetSimulation() {
    setIsPlaying(false);
    setCurrentStep(0);
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <Waves size={23} />
          </div>

          <div>
            <div className="brand-name">
              Ruda<span>X</span>
            </div>
            <div className="brand-subtitle">
              MINE WATER INTELLIGENCE
            </div>
          </div>
        </div>

        <div className="side-section-label">WORKSPACE</div>

        <div className="nav-item active">
          <Activity size={17} />
          Overview
          <span className="nav-indicator" />
        </div>

        <div className="nav-item">
          <GitBranch size={17} />
          Incident pathways
        </div>

        <div className="nav-item">
          <Gauge size={17} />
          Sensor network
        </div>

        <div className="nav-item">
          <ShieldCheck size={17} />
          Response review
        </div>

        <div className="sidebar-bottom">
          <div className="system-status">
            <span className="pulse-dot" />
            <div>
              <strong>Simulation environment</strong>
              <small>Connected · Demo data</small>
            </div>
          </div>

          <div className="sidebar-foot">
            RUDA X / FIELD SYSTEMS
            <br />
            DECISION SUPPORT · V1.0
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb">
            Operations <span>/</span>{" "}
            <strong>Incident overview</strong>
          </div>

          <div className="topbar-right">
            <span className="demo-pill">
              <span />
              SIMULATION MODE
            </span>
            <span className="avatar">RX</span>
          </div>
        </header>

        <div className="page-content">
          <section className="page-heading">
            <div>
              <div className="eyebrow">
                <span className="eyebrow-line" />
                UNDERGROUND WATER INFRASTRUCTURE
              </div>

              <h1>
                Incident overview
                <span className="heading-period">.</span>
              </h1>

              <p className="page-subtitle">
                Turn sensor signals into explainable,
                engineer-reviewed response options.
              </p>
            </div>

            <div className="scenario-control">
              <label htmlFor="scenario">
                SIMULATION SCENARIO
              </label>

              <div className="select-wrap">
                <select
                  id="scenario"
                  value={scenario}
                  onChange={(event) => {
                    setScenario(event.target.value);
                  }}
                >
                  {SCENARIOS.map((item) => (
                    <option value={item.value} key={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>

                <ChevronDown size={15} />
              </div>
            </div>
          </section>

          {error && (
            <div className="error-banner">
              <AlertTriangle size={18} />
              <span>{error}</span>
            </div>
          )}

          <section
            className={`incident-banner ${
              isNormal ? "normal" : "alert"
            }`}
          >
            <div className="incident-symbol">
              {isNormal ? (
                <CheckCircle2 size={24} />
              ) : (
                <AlertTriangle size={24} />
              )}
            </div>

            <div className="incident-copy">
              <div className="eyebrow">
                CURRENT ASSESSMENT
                <span className="live-dot" />
              </div>

              <h2>
                {loading
                  ? "Loading sensor assessment"
                  : diagnosis.replaceAll("_", " ")}
              </h2>

              <p>
                {loading
                  ? "Retrieving the selected scenario."
                  : isNormal
                    ? "No major fault identified by the current demo rules."
                    : diagnosis === "WAITING_FOR_DATA"
                      ? "Waiting for the backend assessment."
                      : "Potential incident detected. Review the evidence before taking action."}
              </p>
            </div>

            <div
              className={`severity severity-${severityClass(severity)}`}
            >
              {loading ? "LOADING" : severity}
            </div>
          </section>

          <div className="section-heading">
            <div>
              <h3>System telemetry</h3>
              <p>
                Current values from the selected simulated scenario
              </p>
            </div>

            <span className="updated-label">
              <span className="pulse-dot" />
              STEP {progression.length ? currentStep + 1 : 0} OF{" "}
              {progression.length}
            </span>
          </div>

          <section className="metrics-grid">
            <MetricCard
              icon={Droplets}
              label="WATER LEVEL"
              value={displayedWaterLevel}
              unit="%"
              status={
                displayedWaterLevel >= 60
                  ? "Elevated level"
                  : "Within demo range"
              }
              tone={displayedWaterLevel >= 60 ? "red" : "teal"}
              detail="Illustrative level index"
            />

            <MetricCard
              icon={Zap}
              label="PUMP STATUS"
              value={readings?.pumpStatus}
              status={
                readings?.pumpStatus === "OFF"
                  ? "Requires inspection"
                  : readings?.pumpStatus === "ON"
                    ? "Operating in simulation"
                    : "Waiting for reading"
              }
              tone={
                readings?.pumpStatus === "OFF" ? "red" : "teal"
              }
            />

            <MetricCard
              icon={Waves}
              label="DRAINAGE FLOW"
              value={readings?.drainageFlow}
              unit=" u"
              status={
                readings?.drainageFlow < 20
                  ? "Restricted flow"
                  : readings?.drainageFlow != null
                    ? "Flow within demo range"
                    : "Waiting for reading"
              }
              tone={
                readings?.drainageFlow < 20 ? "amber" : "blue"
              }
            />

            <MetricCard
              icon={ShieldCheck}
              label="SENSOR HEALTH"
              value={readings?.sensorHealth}
              status={
                readings?.sensorHealth === "SUSPECT"
                  ? "Independent verification needed"
                  : readings?.sensorHealth === "HEALTHY"
                    ? "Sensor reports healthy"
                    : "Waiting for reading"
              }
              tone={isSensorFault ? "amber" : "teal"}
            />
          </section>

          <section className="content-grid">
            <article className="panel chart-panel">
              <div className="panel-heading">
                <div>
                  <div className="panel-kicker">
                    WATER LEVEL / PROGRESSION
                  </div>
                  <h3>Incident timeline</h3>
                  <p>{selectedScenario?.description}</p>
                </div>

                <div className="time-badge">
                  T+{simulatedReading?.minute ?? 0} MIN
                </div>
              </div>

              <div className="chart-summary">
                <div>
                  <span>WATER LEVEL</span>
                  <strong>
                    {displayedWaterLevel ?? "—"}
                    <small>%</small>
                  </strong>
                </div>

                <div className="chart-summary-change">
                  {displayedWaterLevel >= 60 ? (
                    <ArrowUpRight size={15} />
                  ) : (
                    <ArrowDownRight size={15} />
                  )}

                  <span>
                    {displayedWaterLevel >= 60
                      ? "Elevated in this scenario"
                      : "Demo range"}
                  </span>
                </div>
              </div>

              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={visibleProgression}
                    margin={{
                      top: 8,
                      right: 8,
                      left: -22,
                      bottom: 0,
                    }}
                  >
                    <defs>
                      <linearGradient
                        id="levelFill"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor={levelColor}
                          stopOpacity={0.28}
                        />
                        <stop
                          offset="100%"
                          stopColor={levelColor}
                          stopOpacity={0.015}
                        />
                      </linearGradient>
                    </defs>

                    <CartesianGrid
                      stroke="#22313e"
                      strokeDasharray="3 5"
                      vertical={false}
                    />

                    <XAxis
                      dataKey="time"
                      tick={{ fill: "#718493", fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />

                    <YAxis
                      domain={[0, 100]}
                      ticks={[0, 25, 50, 75, 100]}
                      tick={{ fill: "#718493", fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />

                    <Tooltip
                      contentStyle={{
                        background: "#101c27",
                        border: "1px solid #2b3b49",
                        borderRadius: 8,
                        color: "#e9f1f6",
                        fontSize: 12,
                      }}
                      formatter={(value) => [
                        `${value}%`,
                        "Water level",
                      ]}
                    />

                    <Area
                      type="monotone"
                      dataKey="level"
                      stroke={levelColor}
                      strokeWidth={2.5}
                      fill="url(#levelFill)"
                      isAnimationActive={false}
                      dot={false}
                      activeDot={{
                        r: 4,
                        fill: levelColor,
                        stroke: "#101c27",
                        strokeWidth: 2,
                      }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="playback-controls">
                <button
                  className="play-button"
                  onClick={playSimulation}
                  disabled={isPlaying || !progression.length}
                >
                  <Play size={14} fill="currentColor" />
                  Play
                </button>

                <button
                  onClick={pauseSimulation}
                  disabled={!isPlaying}
                >
                  <Pause size={14} />
                  Pause
                </button>

                <button onClick={resetSimulation}>
                  <RotateCcw size={14} />
                  Reset
                </button>

                <span className="step-count">
                  Step {progression.length ? currentStep + 1 : 0} /{" "}
                  {progression.length}
                </span>
              </div>

              <div className="progress-track">
                <div style={{ width: `${progressPercent}%` }} />
              </div>

              <div className="chart-footnote">
                <Clock3 size={13} />
                Each step represents 2 simulated minutes · Not a
                real-world forecast
              </div>
            </article>

            <article className="panel evidence-panel">
              <div className="panel-heading">
                <div>
                  <div className="panel-kicker">EXPLAINABILITY</div>
                  <h3>Evidence signals</h3>
                  <p>
                    Reasons behind the current demo assessment
                  </p>
                </div>

                <span className="evidence-count">
                  {incident?.evidence?.length ?? 0} SIGNALS
                </span>
              </div>

              <div className="evidence-list">
                {(
                  incident?.evidence?.length
                    ? incident.evidence
                    : isNormal
                      ? [
                          "No major fault signal was triggered by the current demo rules.",
                        ]
                      : ["Waiting for incident evidence."]
                ).map((item, index) => (
                  <div
                    className="evidence-item"
                    key={`${item}-${index}`}
                  >
                    <span
                      className={`evidence-number ${
                        isNormal ? "green" : ""
                      }`}
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <div>
                      <strong>{item}</strong>
                      <small>
                        {isNormal
                          ? "Consistent with current demo rules"
                          : "Supporting signal · simulated input"}
                      </small>
                    </div>

                    <CheckCircle2
                      size={16}
                      className="evidence-check"
                    />
                  </div>
                ))}
              </div>

              <div className="confidence-note">
                <ShieldCheck size={17} />
                <div>
                  <strong>
                    Decision support, not autonomous control
                  </strong>
                  <p>
                    Check evidence against independent measurements
                    and site procedures.
                  </p>
                </div>
              </div>
            </article>
          </section>

          <section className="panel recommendations-panel">
            <div className="panel-heading">
              <div>
                <div className="panel-kicker">
                  RESPONSE PLANNING
                </div>
                <h3>Recommended next steps</h3>
                <p>
                  Suggested checks for qualified personnel — not
                  automatic commands
                </p>
              </div>

              <span className="review-pill">
                <HardHat size={14} />
                ENGINEER REVIEW REQUIRED
              </span>
            </div>

            <div className="recommendation-grid">
              {recommendations.map(
                ([number, title, description]) => (
                  <div
                    className="recommendation-card"
                    key={number}
                  >
                    <span className="recommendation-number">
                      {number}
                    </span>

                    <div>
                      <h4>{title}</h4>
                      <p>{description}</p>
                    </div>

                    <ArrowUpRight
                      size={16}
                      className="recommendation-arrow"
                    />
                  </div>
                )
              )}
            </div>
          </section>

          <footer className="footer">
            <div>
              <span className="footer-mark">
                <Waves size={15} />
              </span>
              <strong>RudaX</strong>
              <span>From alert to action.</span>
            </div>

            <p>
              <span className="footer-status" />
              SIMULATED DATA ONLY
              <span className="footer-separator">·</span>
              NO REAL SENSORS CONNECTED
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
}
