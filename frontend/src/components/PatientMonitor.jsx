import { useState, useEffect, useRef } from "react";
import { Heart, Activity, Droplets, Thermometer, Waves } from "lucide-react";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { useSettings } from "../context/SettingsContext";

const createWaveformGenerator = (patientId, heartRate = 70, spo2 = 98, temp = 37, bpSys = 120) => {
  const seed = patientId.toString().split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  const seededRandom = (modifier = 0) => {
    const x = Math.sin(seed + modifier) * 10000;
    return x - Math.floor(x);
  };

  const params = {
    baselineNoise: 0.01 + seededRandom(1) * 0.04,
    phaseShift: seededRandom(2) * Math.PI * 2,
    amplitudeBase: 0.15 + seededRandom(3) * 0.1,
    amplitudeVariation: 0.9 + seededRandom(4) * 0.2,
    noiseIntensity: 0.03 + seededRandom(5) * 0.04,
    qrsWidth: 0.08 + seededRandom(6) * 0.04,
    qrsHeight: 0.4 + seededRandom(7) * 0.2,
    spo2Amplitude: (spo2 - 90) / 100,
    tempDrift: (temp - 37) * 0.01,
    bpBaseline: (bpSys - 120) / 200,
    hrVariability: 2 + seededRandom(8) * 3,
    irregularityChance: seededRandom(9) * 0.08,
  };

  let beatTime = 0;
  let lastBeatTime = 0;
  let hasQRS = false;
  let qrsProgress = 0;

  return {
    params,
    nextPoint: (currentHr, currentSpo2, currentTemp, currentBpSys) => {
      beatTime += 0.12;
      
      const variability = currentHr + (seededRandom(beatTime * 10) - 0.5) * params.hrVariability;
      const cycleLength = 60000 / variability;
      const phase = (beatTime * 100 + params.phaseShift) % cycleLength;
      const phaseNorm = phase / cycleLength;
      
      let ecgValue = 0;
      
      const pWave = Math.sin(phaseNorm * Math.PI * 2 * 0.5) * params.amplitudeBase * 0.2;
      const qrsComplex = () => {
        if (phaseNorm < params.qrsWidth) {
          const qProgress = phaseNorm / params.qrsWidth;
          if (qProgress < 0.3) {
            return -params.qrsHeight * 0.3 * qProgress / 0.3;
          } else if (qProgress < 0.5) {
            return -params.qrsHeight * 0.3 + params.qrsHeight * (qProgress - 0.3) / 0.2;
          } else {
            return params.qrsHeight * (1 - (qProgress - 0.5) / 0.5);
          }
        }
        return 0;
      };
      const tWave = Math.sin(phaseNorm * Math.PI * 2) * params.amplitudeBase * 0.3;
      
      const isIrregular = seededRandom(beatTime * 100) < params.irregularityChance;
      const irregularFactor = isIrregular ? 1.15 + seededRandom(beatTime * 50) * 0.2 : 1;
      
      ecgValue = (pWave + qrsComplex() + tWave) * params.amplitudeVariation * irregularFactor;
      
      const noise = (seededRandom(beatTime * 1000) - 0.5) * params.noiseIntensity;
      const drift = Math.sin(beatTime * 0.5) * params.tempDrift;
      const bpEffect = Math.sin(beatTime * 0.3) * params.bpBaseline * 0.1;
      
      ecgValue += noise + drift + bpEffect;
      ecgValue = Math.max(0.1, Math.min(0.9, 0.5 + ecgValue));
      
      const spo2Base = currentSpo2 / 100;
      const spo2Pulse = Math.sin(beatTime * 100 * (variability / 60)) * params.spo2Amplitude * 0.1;
      const spo2Noise = (seededRandom(beatTime * 2000) - 0.5) * 0.01;
      const spo2Value = Math.max(0.85, Math.min(1, spo2Base + spo2Pulse + spo2Noise));
      
      return { hr: ecgValue, spo2: spo2Value };
    },
    getSeed: () => seed,
  };
};

const PatientMonitor = ({ patient, onClick }) => {
  const [ecgData, setEcgData] = useState([]);
  const generatorRef = useRef(null);
  const timeRef = useRef(0);
  const intervalRef = useRef(null);
  const { settings } = useSettings();

  const heartRate = patient.heartRate || 70;
  const spo2 = patient.spo2 || 98;
  const temp = patient.temp || 37;
  const bpSys = patient.bp ? parseInt(patient.bp.split('/')[0]) || 120 : 120;

  const waveformEnabled = settings.waveformAnimation !== false;

  useEffect(() => {
    generatorRef.current = createWaveformGenerator(
      patient._id,
      heartRate,
      spo2,
      temp,
      bpSys
    );
    
    const { params } = generatorRef.current;
    const initialData = [];
    for (let i = 0; i < 80; i++) {
      timeRef.current = i * 0.12;
      const point = generatorRef.current.nextPoint(heartRate, spo2, temp, bpSys);
      initialData.push(point);
    }
    setEcgData(initialData);
  }, [patient._id, waveformEnabled]);

  useEffect(() => {
    if (!waveformEnabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      if (!generatorRef.current) return;
      
      const currentHr = patient.heartRate || 70;
      const currentSpo2 = patient.spo2 || 98;
      const currentTemp = patient.temp || 37;
      const currentBpSys = patient.bp ? parseInt(patient.bp.split('/')[0]) || 120 : 120;
      
      const newPoint = generatorRef.current.nextPoint(currentHr, currentSpo2, currentTemp, currentBpSys);
      
      setEcgData(prev => {
        const newData = [...prev, newPoint];
        if (newData.length > 80) {
          return newData.slice(-80);
        }
        return newData;
      });
    }, 130);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [patient._id, patient.heartRate, patient.spo2, patient.temp, patient.bp, waveformEnabled]);

  const isCritical = patient.status?.toLowerCase() === "critical";
  const isWarning = patient.status?.toLowerCase() === "warning";

  const getStatusBadge = () => {
    if (isCritical) {
      return { bg: "bg-red-600", text: "text-white", label: "CRITICAL" };
    }
    if (isWarning) {
      return { bg: "bg-yellow-500", text: "text-black", label: "WARNING" };
    }
    return { bg: "bg-emerald-500", text: "text-white", label: "NORMAL" };
  };

  const status = getStatusBadge();

  return (
    <div
      onClick={onClick}
      className={`
        bg-slate-900 rounded-2xl border-2 overflow-hidden cursor-pointer
        transition-all hover:scale-[1.01] hover:shadow-2xl
        ${isCritical ? "border-red-500 shadow-red-500/20" : isWarning ? "border-yellow-500 shadow-yellow-500/20" : "border-slate-700"}
        ${isCritical ? "animate-pulse" : ""}
      `}
    >
      {/* TOP SECTION - Header */}
      <div className="bg-slate-800/80 px-5 py-4 border-b border-slate-700">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-700 flex items-center justify-center">
              <Activity className="text-slate-300" size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{patient.name}</h3>
              <p className="text-xs text-slate-400">Bed {patient.bed} • {patient.ward}</p>
            </div>
          </div>
          <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${status.bg} ${status.text}`}>
            {status.label}
          </span>
        </div>
      </div>

      {/* MIDDLE SECTION - Live Waveform */}
      {waveformEnabled ? (
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center gap-2 mb-3">
          <Waves className="text-slate-500" size={16} />
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Live ECG</span>
          <span className="ml-auto text-xs text-slate-500">HR: {heartRate} bpm</span>
        </div>
        
        <div className="relative h-24 bg-black/50 rounded-lg overflow-hidden">
          {/* Grid lines */}
          <div className="absolute inset-0 opacity-20">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="absolute top-0 bottom-0 w-px bg-green-500" style={{ left: `${i * 12.5}%` }} />
            ))}
            {[...Array(4)].map((_, i) => (
              <div key={i} className="absolute left-0 right-0 h-px bg-green-500" style={{ top: `${i * 25}%` }} />
            ))}
          </div>
          
          {/* ECG Waveform */}
          <div className="h-full w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ecgData}>
                <Line
                  type="monotone"
                  dataKey="hr"
                  stroke="#00ff88"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          {/* SpO2 Waveform overlay */}
          <div className="absolute bottom-1 left-0 right-0 h-8">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ecgData}>
                <Line
                  type="monotone"
                  dataKey="spo2"
                  stroke="#00d4ff"
                  strokeWidth={1.5}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      ) : (
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <Activity className="text-slate-500" size={16} />
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Live Monitoring</span>
          <span className="ml-auto text-xs text-slate-500">HR: {heartRate} bpm</span>
        </div>
        <div className="mt-2 text-center text-slate-500 text-sm">
          Waveform animation disabled in settings
        </div>
      </div>
      )}

      {/* BOTTOM SECTION - Vitals Grid */}
      <div className="p-4">
        <div className="grid grid-cols-4 gap-2">
          {/* Heart Rate */}
          <div className="bg-slate-800/60 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Heart className="text-green-500" size={14} />
              <span className="text-[10px] text-slate-400 uppercase">HR</span>
            </div>
            <p className="text-lg font-bold text-green-400">{patient.heartRate || "--"}</p>
            <p className="text-[10px] text-slate-500">bpm</p>
          </div>

          {/* SpO2 */}
          <div className="bg-slate-800/60 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Droplets className="text-cyan-400" size={14} />
              <span className="text-[10px] text-slate-400 uppercase">SpO₂</span>
            </div>
            <p className="text-lg font-bold text-cyan-400">{patient.spo2 || "--"}</p>
            <p className="text-[10px] text-slate-500">%</p>
          </div>

          {/* BP */}
          <div className="bg-slate-800/60 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Activity className="text-yellow-500" size={14} />
              <span className="text-[10px] text-slate-400 uppercase">BP</span>
            </div>
            <p className="text-lg font-bold text-yellow-400">{patient.bp || "--/--"}</p>
            <p className="text-[10px] text-slate-500">mmHg</p>
          </div>

          {/* Temperature */}
          <div className="bg-slate-800/60 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Thermometer className="text-orange-500" size={14} />
              <span className="text-[10px] text-slate-400 uppercase">Temp</span>
            </div>
            <p className="text-lg font-bold text-orange-400">{patient.temp || "--"}</p>
            <p className="text-[10px] text-slate-500">°C</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientMonitor;
