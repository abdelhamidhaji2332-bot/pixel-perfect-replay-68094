import { AnimatePresence, motion, useMotionValueEvent, useSpring } from "framer-motion";
import { ArrowDown, ArrowUp, AudioLines, Crosshair, Maximize2, Minimize2, Plus, Ruler, SlidersHorizontal, Waves } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { readSensor, type SensorReading } from "../sim/physics";
import { OpticalBench, type CameraView } from "../scene/OpticalBench";
import { CalibrationChart } from "./CalibrationChart";
import { Oscilloscope } from "./Oscilloscope";
import { lessonStages, PresentationGuide } from "./PresentationGuide";

type ChartMode = "calibration" | "scope";
type Effects = { noise: boolean; hysteresis: boolean; nonlinearity: boolean; temperature: number; direction: 1 | -1 };
const initialEffects: Effects = { noise: false, hysteresis: false, nonlinearity: false, temperature: 20, direction: 1 };
const springConfig = { stiffness: 140, damping: 24, mass: 0.8 };

function formatDistance(value: number) { return value.toFixed(1).replace(".", ","); }

export function Simulator() {
  const [distance, setDistance] = useState(42);
  const [effects, setEffects] = useState<Effects>(initialEffects);
  const [noiseSample, setNoiseSample] = useState(0);
  const [running, setRunning] = useState(true);
  const [presentation, setPresentation] = useState(false);
  const [cameraView, setCameraView] = useState<CameraView>("iso");
  const [chartMode, setChartMode] = useState<ChartMode>("calibration");
  const [activeStage, setActiveStage] = useState(1);
  const [samples, setSamples] = useState<Array<{ distance: number; voltage: number }>>([]);
  const [tick, setTick] = useState(0);
  const [ready, setReady] = useState(false);
  const reading = useMemo(() => readSensor(distance, effects, noiseSample), [distance, effects, noiseSample]);
  const voltageSpring = useSpring(reading.voltage, springConfig);
  const distanceSpring = useSpring(reading.measuredCm, springConfig);
  const [smoothVoltage, setSmoothVoltage] = useState(reading.voltage);
  const [smoothDistance, setSmoothDistance] = useState(reading.measuredCm);

  useEffect(() => { voltageSpring.set(reading.voltage); }, [reading.voltage, voltageSpring]);
  useEffect(() => { distanceSpring.set(reading.measuredCm); }, [reading.measuredCm, distanceSpring]);
  useMotionValueEvent(voltageSpring, "change", (value) => setSmoothVoltage(value));
  useMotionValueEvent(distanceSpring, "change", (value) => setSmoothDistance(value));

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTick((value) => value + 1);
      if (effects.noise) {
        const u = Math.max(Number.EPSILON, Math.random());
        const v = Math.max(Number.EPSILON, Math.random());
        setNoiseSample(Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v));
      } else setNoiseSample(0);
    }, 80);
    return () => window.clearInterval(timer);
  }, [effects.noise]);

  const setTarget = useCallback((value: number) => {
    setEffects((current) => ({ ...current, direction: value >= distance ? 1 : -1 }));
    setDistance(Math.min(120, Math.max(0, value)));
  }, [distance]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLElement && ["INPUT", "TEXTAREA", "SELECT"].includes(event.target.tagName)) return;
      if (event.key.toLowerCase() === "p") { setPresentation((value) => !value); return; }
      if (event.key === "Escape") { setPresentation(false); return; }
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        setTarget(distance + (event.key === "ArrowRight" ? 1 : -1) * (event.shiftKey ? 1 : 0.1));
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [distance, setTarget]);

  useEffect(() => {
    const stage = lessonStages[activeStage];
    if (stage) setTarget(stage.distance);
    if (activeStage === 0) setEffects((value) => ({ ...value, nonlinearity: false }));
    if (activeStage === 2) setEffects((value) => ({ ...value, nonlinearity: true }));
    if (activeStage === 3) setEffects((value) => ({ ...value, noise: true, hysteresis: true }));
  }, [activeStage, setTarget]);

  const recordPoint = () => setSamples((points) => [...points, { distance: reading.measuredCm, voltage: reading.voltage }]);
  const toggleEffect = (effect: "noise" | "hysteresis" | "nonlinearity") => setEffects((value) => ({ ...value, [effect]: !value[effect] }));

  return (
    <main className={`studio-shell ${presentation ? "presentation-mode" : ""}`}>
      <motion.header className="topbar" initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 280, damping: 26 }}>
        <div className="brand-lockup"><span className="brand-mark"><Crosshair size={19} strokeWidth={1.65} /></span><div><span className="brand-kicker">LABORATOIRE DE MÉTROLOGIE · CPGE SII</span><h1>Banc d’essai virtuel <span>/</span> Capteur ultrasonore</h1></div></div>
        <div className="topbar-right"><span className={`system-status ${ready ? "is-ready" : ""}`}><i />{ready ? "BANC CONNECTÉ" : "INITIALISATION"}</span><span className="topbar-divider" /><Button variant="outline" className="presentation-toggle" onClick={() => setPresentation((value) => !value)}>{presentation ? <Minimize2 size={15} /> : <Maximize2 size={15} />}{presentation ? "Quitter le mode" : "Mode présentation"}<kbd>P</kbd></Button></div>
      </motion.header>

      <motion.section className="workspace-grid" initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1, delayChildren: 0.14 } } }}>
        <div className="main-column">
          <motion.section className="bench-panel" variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 280, damping: 26 } } }} aria-label="Banc optique interactif">
            <div className="bench-overlay bench-overlay-top"><div><span className="eyebrow">VUE EN DIRECT</span><div className="bench-title">Banc optique <span>·</span> 120 cm</div></div><span className={`zone-badge zone-${reading.zone}`}>{reading.zone === "dead" ? "ZONE MORTE" : reading.zone === "saturation" ? "SATURATION" : "PLAGE LINÉAIRE"}</span></div>
            <OpticalBench distance={distance} onDistanceChange={setTarget} running={running} cameraView={cameraView} ready={() => setReady(true)} />
            <div className="bench-overlay bench-overlay-bottom"><div className="camera-switcher" aria-label="Vue caméra">{(["iso", "top", "focus"] as const).map((view) => <Button key={view} variant="ghost" size="sm" className={cameraView === view ? "control-selected" : ""} onClick={() => setCameraView(view)}>{view === "iso" ? "Isométrique" : view === "top" ? "Dessus" : "Capteur"}</Button>)}</div><Button variant="outline" size="sm" className="pulse-button" onClick={() => setRunning((value) => !value)}><Waves size={15} />{running ? "Suspendre les ondes" : "Émettre une onde"}</Button></div>
          </motion.section>

          <motion.section className="analysis-panel" variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 280, damping: 26 } } }}>
            <div className="panel-heading analysis-heading"><div><span className="eyebrow">ANALYSE DU SIGNAL</span><h2>Caractéristique statique</h2></div><div className="analysis-actions"><div className="segmented-tabs" role="tablist" aria-label="Analyse"><button role="tab" aria-selected={chartMode === "calibration"} className={chartMode === "calibration" ? "selected" : ""} onClick={() => setChartMode("calibration")}><Ruler size={14} />Caractéristique</button><button role="tab" aria-selected={chartMode === "scope"} className={chartMode === "scope" ? "selected" : ""} onClick={() => setChartMode("scope")}><AudioLines size={14} />Oscilloscope</button></div>{chartMode === "calibration" && <Button variant="default" size="sm" className="sample-button" onClick={recordPoint}><Plus size={14} />Relever un point</Button>}</div></div>
            <AnimatePresence mode="wait" initial={false}><motion.div key={chartMode} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.18 }}>{chartMode === "calibration" ? <CalibrationChart distance={reading.measuredCm} voltage={reading.voltage} points={samples} nonlinearity={effects.nonlinearity} /> : <Oscilloscope distance={distance} temperature={effects.temperature} running={running} />}</motion.div></AnimatePresence>
            {chartMode === "calibration" && <div className="chart-legend"><span><i className="legend-actual" />Caractéristique mesurée</span><span><i className="legend-ideal" />Modèle linéaire idéal</span><span><i className="legend-tangent" />Tangente locale</span><span className="legend-sensitivity">S ≈ {reading.sensitivityMvPerCm.toFixed(1).replace(".", ",")} mV/cm</span></div>}
            {chartMode === "scope" && <div className="chart-legend"><span><i className="legend-actual" />Émission · CH1</span><span><i className="legend-echo" />Écho reçu · CH2</span><span className="legend-sensitivity">Δt = {reading.timeOfFlightMs.toFixed(3).replace(".", ",")} ms</span><span className="scope-update">BALAYAGE {String(tick % 100).padStart(2, "0")}</span></div>}
          </motion.section>
        </div>

        <motion.aside className="side-column" variants={{ hidden: { opacity: 0, x: 18 }, show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 280, damping: 26 } } }}>
          <section className="telemetry-section" aria-label="Télémétrie en temps réel"><div className="panel-heading"><div><span className="eyebrow">MESURE EN TEMPS RÉEL</span><h2>Télémétrie</h2></div><span className="live-dot"><i /> LIVE</span></div>
            <div className="primary-readout"><div className="readout-label"><span className="readout-symbol cyan">d</span><span>DISTANCE MESURÉE</span></div><div className="readout-value"><span>{formatDistance(smoothDistance)}</span><small>cm</small></div><div className="readout-sub">Cible à {formatDistance(distance)} cm <span>·</span> écart {formatDistance(Math.abs(smoothDistance - distance))} cm</div></div>
            <div className="secondary-readouts"><div className="small-readout"><div className="readout-label"><span className="readout-symbol amber">U</span><span>TENSION Uₛ</span></div><div className="small-value"><span>{smoothVoltage.toFixed(2).replace(".", ",")}</span><small>V</small></div></div><div className="small-readout"><div className="readout-label"><span className="readout-symbol green">Δt</span><span>TEMPS DE VOL</span></div><div className="small-value"><span>{reading.timeOfFlightMs.toFixed(3).replace(".", ",")}</span><small>ms</small></div></div></div>
            <div className="sensitivity-strip"><div><span className="sensitivity-label">SENSIBILITÉ LOCALE</span><strong>{reading.sensitivityMvPerCm.toFixed(1).replace(".", ",")} <small>mV/cm</small></strong></div><span className="sensitivity-eq">dUₛ / dd</span></div>
          </section>

          <section className="controls-section" aria-label="Paramètres du capteur"><div className="panel-heading controls-heading"><div><span className="eyebrow">RÉGLAGES DU BANC</span><h2>Paramètres</h2></div><SlidersHorizontal size={17} className="muted-icon" /></div>
            <div className="target-control"><div className="control-label-row"><label htmlFor="distance-slider">Position de la cible</label><div className="fine-tune"><Button variant="ghost" size="icon" aria-label="Rapprocher de 0,1 cm" onClick={() => setTarget(distance - 0.1)}><ArrowDown size={13} /></Button><strong>{formatDistance(distance)} <small>cm</small></strong><Button variant="ghost" size="icon" aria-label="Éloigner de 0,1 cm" onClick={() => setTarget(distance + 0.1)}><ArrowUp size={13} /></Button></div></div><input id="distance-slider" aria-label="Position de la cible en centimètres" type="range" min="0" max="120" step="0.1" value={distance} onChange={(event) => setTarget(Number(event.target.value))} className="distance-range"/><div className="range-marks"><span>0 cm</span><span>5 cm</span><span>80 cm</span><span>120 cm</span></div></div>
            <div className="switch-list"><ToggleRow label="Bruit de mesure" detail="Dispersion · fidélité" checked={effects.noise} onChange={() => toggleEffect("noise")} color="cyan"/><ToggleRow label="Cycle d’hystérésis" detail="Écart selon le sens" checked={effects.hysteresis} onChange={() => toggleEffect("hysteresis")} color="amber"/><ToggleRow label="Non-linéarité" detail="Compression dès 75 cm" checked={effects.nonlinearity} onChange={() => toggleEffect("nonlinearity")} color="red"/></div>
            <div className="temperature-control"><div className="control-label-row"><label htmlFor="temperature-slider">Dérive thermique <span>T</span></label><strong>{effects.temperature.toFixed(0)} <small>°C</small></strong></div><input id="temperature-slider" aria-label="Température ambiante en degrés Celsius" type="range" min="-10" max="50" step="1" value={effects.temperature} onChange={(event) => setEffects((value) => ({ ...value, temperature: Number(event.target.value) }))} className="temperature-range"/><div className="temperature-foot">Vitesse du son <strong>{reading.speedOfSound.toFixed(1).replace(".", ",")} m/s</strong></div></div>
          </section>

          <AnimatePresence mode="popLayout">{reading.zone !== "linear" && <motion.div className={`range-alert ${reading.zone}`} initial={{ opacity: 0, height: 0, y: -4 }} animate={{ opacity: 1, height: "auto", y: 0 }} exit={{ opacity: 0, height: 0, y: -4 }}><span className="alert-mark">!</span><span><strong>{reading.zone === "dead" ? "Mesure en zone morte" : "Saturation du capteur"}</strong><small>{reading.zone === "dead" ? "Distance inférieure à 5 cm" : "La sortie atteint sa limite de 10 V"}</small></span></motion.div>}</AnimatePresence>
        </motion.aside>
      </motion.section>

      <motion.footer className="footer-area" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 280, damping: 26, delay: 0.36 }}>
        <AnimatePresence mode="wait"><motion.div key={activeStage} className="presenter-note" initial={{ opacity: 0, x: 9 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -7 }} transition={{ duration: 0.18 }}><span className="note-number">0{activeStage + 1}</span><div><strong>{lessonStages[activeStage]?.description}</strong><span>{lessonStages[activeStage]?.note}</span></div></motion.div></AnimatePresence>
        <PresentationGuide active={activeStage} onChange={setActiveStage} />
        <div className="footer-caption"><span>CARACTÉRISTIQUES MÉTROLOGIQUES D’UN CAPTEUR</span><span>c(T) = 331,3 + 0,606 T <i>·</i> <Button variant="ghost" size="sm" className="reset-button" onClick={() => { setDistance(42); setEffects(initialEffects); setActiveStage(1); setSamples([]); }}>Réinitialiser</Button></span></div>
      </motion.footer>
    </main>
  );
}

function ToggleRow({ label, detail, checked, onChange, color }: { label: string; detail: string; checked: boolean; onChange: () => void; color: string }) {
  return <div className="switch-row"><div className="switch-copy"><span className={`effect-dot ${color}`} /><span><strong>{label}</strong><small>{detail}</small></span></div><Button variant="ghost" role="switch" aria-checked={checked} aria-label={label} className={`switch-control ${checked ? "is-on" : ""}`} onClick={onChange}><span /></Button></div>;
}

export type { SensorReading };