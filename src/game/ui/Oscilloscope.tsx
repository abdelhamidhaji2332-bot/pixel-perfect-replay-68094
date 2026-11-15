type OscilloscopeProps = { distance: number; temperature: number; running: boolean };

function signalPath(y: number, amplitude: number, phase: number, distance: number, speed: number) {
  const delay = Math.min(1.3, ((2 * distance / 100) / speed) * 1000);
  return Array.from({ length: 181 }, (_, index) => {
    const x = 13 + index * (574 / 180);
    const t = index / 180;
    const pulse = Math.exp(-Math.pow((t - (0.22 + delay / 2)) / 0.018, 2));
    const echo = Math.exp(-Math.pow((t - (0.55 + delay / 3)) / 0.024, 2));
    const wave = Math.sin((t * 16 - phase) * Math.PI) * pulse + Math.sin((t * 22 - phase) * Math.PI) * echo * 0.7;
    return `${index === 0 ? "M" : "L"} ${x} ${y - amplitude * wave}`;
  }).join(" ");
}

export function Oscilloscope({ distance, temperature, running }: OscilloscopeProps) {
  const speed = 331.3 + 0.606 * temperature;
  const phase = running ? Date.now() / 160 : 0;
  return (
    <div className="chart-wrap scope-wrap">
      <svg className="calibration-svg" viewBox="0 0 610 210" role="img" aria-label="Oscilloscope à deux voies : émission et écho ultrasonore">
        {[0, 1, 2, 3, 4, 5].map((i) => <line key={`v-${i}`} x1={13 + i * 114.8} x2={13 + i * 114.8} y1="15" y2="186" className="scope-grid" />)}
        {[0, 1, 2, 3, 4].map((i) => <line key={`h-${i}`} x1="13" x2="587" y1={20 + i * 41} y2={20 + i * 41} className="scope-grid" />)}
        <line x1="13" x2="587" y1="103" y2="103" className="scope-baseline" />
        <path d={signalPath(62, 28, phase, distance, speed)} className="scope-send" />
        <path d={signalPath(144, 26, phase - 0.2, distance, speed)} className="scope-echo" />
        <text x="16" y="33" className="scope-label send">CH1 · ÉMISSION</text>
        <text x="16" y="116" className="scope-label echo">CH2 · ÉCHO</text>
        <text x="587" y="202" className="scope-axis" textAnchor="end">TEMPS →</text>
      </svg>
    </div>
  );
}