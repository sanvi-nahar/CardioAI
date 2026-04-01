import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function VitalsChart({ vitals }) {
  // Safety: if vitals is null/empty
  if (!vitals || vitals.length === 0) {
    return <p className="text-sm text-slate-500">No vitals data yet.</p>;
  }

  // Use last 50 vitals for chart
  const recentVitals = vitals.slice(-50);

  // Map to chart-friendly data
  const data = recentVitals.map((v) => ({
    time: new Date(v.timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
    heartRate: v.heartRate,
    spo2: v.spo2,
  }));

  return (
    <div className="w-full h-72 bg-white rounded-xl shadow-sm border border-slate-200 p-4">
      <h3 className="text-lg font-semibold text-slate-800 mb-2">
        Heart Rate & SpO₂ Trend
      </h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" />
          <YAxis yAxisId="left" domain={[40, 140]} />
          <YAxis yAxisId="right" orientation="right" domain={[80, 100]} />
          <Tooltip />
          <Legend />
          {/* HR line */}
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="heartRate"
            name="Heart Rate (bpm)"
            strokeWidth={2}
            dot={false}
            isAnimationActive={true}
          />
          {/* SpO2 line */}
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="spo2"
            name="SpO₂ (%)"
            strokeWidth={2}
            dot={false}
            strokeDasharray="4 2"
            isAnimationActive={true}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
