import { useMemo } from "react";
import { outputVoltage } from "../sim/physics";

type CalibrationChartProps = {
  distance: number;
  voltage: number;
  points: Array<{ distance: number; voltage: number }>;
  nonlinearity: boolean;
};

const chart = { left: 48, right: 605, top: 16, bottom: 192 };
const xScale = (x: number) => chart.left + (x / 120) * (chart.right - chart.left);
const yScale = (y: number) => chart.bottom - (y / 10) * (chart.bottom - chart.top);

export function CalibrationChart({ distance, voltage, points, nonlinearity }: CalibrationChartProps) {
  const actual = useMemo(() => Array.from({ length: 61 }, (_, index) => {
    const d = index * 2;
    return `${index === 0 ? "M" : "L"} ${xScale(d)} ${yScale(outputVoltage(d, nonlinearity))}`;
  }).join(" "), [nonlinearity]);
  const tangentDeltaX = 9;
  const tangentStartX = Math.max(5, distance - tangentDeltaX);
  const tangentEndX = Math.min(120, distance + tangentDeltaX);
  const tangentStartY = outputVoltage(tangentStartX, nonlinearity);
  const tangentEndY = outputVoltage(tangentEndX, nonlinearity);
  const idealPath = `M ${xScale(5)} ${yScale(0)} L ${xScale(80)} ${yScale(10)}`;

  return (
    <div className="chart-wrap">
      <svg className="calibration-svg" viewBox="0 0 640 232" role="img" aria-label="Courbe d’étalonnage : tension de sortie en fonction de la distance">
        {[0, 2, 4, 6, 8, 10].map((value) => <g key={`y-${value}`}><line x1={chart.left} x2={chart.right} y1={yScale(value)} y2={yScale(value)} className="chart-grid" /><text x={chart.left - 11} y={yScale(value) + 4} className="chart-axis-label" textAnchor="end">{value}</text></g>)}
        {[0, 20, 40, 60, 80, 100, 120].map((value) => <g key={`x-${value}`}><line x1={xScale(value)} x2={xScale(value)} y1={chart.top} y2={chart.bottom} className="chart-grid vertical" /><text x={xScale(value)} y={chart.bottom + 18} className="chart-axis-label" textAnchor="middle">{value}</text></g>)}
        <path d={idealPath} className="chart-ideal" />
        <path d={actual} className="chart-actual" />
        <path d={`M ${xScale(tangentStartX)} ${yScale(tangentStartY)} L ${xScale(tangentEndX)} ${yScale(tangentEndY)}`} className="chart-tangent" />
        <path d={`M ${xScale(tangentStartX)} ${chart.bottom - 6} L ${xScale(tangentStartX)} ${yScale(tangentStartY)}`} className="chart-slope-guide" />
        <path d={`M ${xScale(tangentStartX)} ${yScale(tangentStartY)} L ${xScale(tangentEndX)} ${yScale(tangentStartY)}`} className="chart-slope-guide" />
        {points.map((point, index) => <circle key={`${point.distance}-${index}`} cx={xScale(point.distance)} cy={yScale(point.voltage)} r="4" className="chart-sample" />)}
        <line x1={xScale(distance)} x2={xScale(distance)} y1={chart.top} y2={chart.bottom} className="chart-crosshair" />
        <line x1={chart.left} x2={xScale(distance)} y1={yScale(voltage)} y2={yScale(voltage)} className="chart-crosshair" />
        <circle cx={xScale(distance)} cy={yScale(voltage)} r="7" className="chart-live-point" />
        <text x="14" y="15" className="chart-axis-title">Uₛ · V</text>
        <text x="605" y="226" className="chart-axis-title" textAnchor="end">d · cm</text>
      </svg>
    </div>
  );
}