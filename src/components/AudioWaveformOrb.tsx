import React, { useEffect, useRef } from 'react';
import { HarnessState } from '../lib/harness/orchestrator';
import { Radio, Mic, CheckCircle, ShieldAlert, Sparkles, Activity, Cpu } from 'lucide-react';

interface AudioWaveformOrbProps {
  state: HarnessState;
  isRecording: boolean;
  isSpeaking: boolean;
  theme?: 'hh-goa' | 'rose-white';
}

export const AudioWaveformOrb: React.FC<AudioWaveformOrbProps> = ({
  state,
  isRecording,
  isSpeaking,
  theme = 'hh-goa',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let phase = 0;
    const isHHGoa = theme === 'hh-goa';

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;
      const cx = width / 2;
      const cy = height / 2;

      // Color scheme based on state & active theme
      let colorPrimary = isHHGoa ? '#ffe600' : '#ff4d94';
      let colorGlow = isHHGoa ? 'rgba(255, 230, 0, 0.40)' : 'rgba(255, 77, 148, 0.35)';
      let colorSecondary = isHHGoa ? '#ff0080' : '#ff75ab';
      let waveAmp = 14;
      let waveFreq = 0.035;

      if (state === 'LISTENING' || isRecording) {
        colorPrimary = isHHGoa ? '#ff0080' : '#ff4d94';
        colorGlow = isHHGoa ? 'rgba(255, 0, 128, 0.60)' : 'rgba(255, 77, 148, 0.55)';
        colorSecondary = isHHGoa ? '#ffe600' : '#ffa8cb';
        waveAmp = 34;
        waveFreq = 0.055;
      } else if (state === 'AUDIO_SYNTHESIZING' || isSpeaking) {
        colorPrimary = isHHGoa ? '#ffe600' : '#ff75ab';
        colorGlow = isHHGoa ? 'rgba(255, 230, 0, 0.60)' : 'rgba(255, 117, 171, 0.55)';
        colorSecondary = isHHGoa ? '#ff0080' : '#fce1ec';
        waveAmp = 28;
        waveFreq = 0.045;
      } else if (state === 'RETRIEVING' || state === 'GENERATING') {
        colorPrimary = isHHGoa ? '#ffe600' : '#ff4d94';
        colorGlow = isHHGoa ? 'rgba(255, 230, 0, 0.60)' : 'rgba(255, 77, 148, 0.55)';
        colorSecondary = isHHGoa ? '#ff0080' : '#ff75ab';
        waveAmp = 24;
        waveFreq = 0.065;
      } else if (state === 'REFUSED') {
        colorPrimary = '#e11d48';
        colorGlow = 'rgba(225, 29, 72, 0.40)';
        colorSecondary = '#fda4af';
        waveAmp = 10;
        waveFreq = 0.08;
      }

      // ── Outer Orbital Ring ──
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(phase * 0.35);
      ctx.beginPath();
      ctx.ellipse(0, 0, 85, 32, phase * 0.4, 0, Math.PI * 2);
      ctx.strokeStyle = colorSecondary;
      ctx.globalAlpha = 0.35;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([8, 12]);
      ctx.stroke();
      ctx.restore();

      // ── Reverse Inner Ring ──
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-phase * 0.3);
      ctx.beginPath();
      ctx.ellipse(0, 0, 72, 26, -phase * 0.4, 0, Math.PI * 2);
      ctx.strokeStyle = colorPrimary;
      ctx.globalAlpha = 0.4;
      ctx.lineWidth = 1.3;
      ctx.setLineDash([5, 8]);
      ctx.stroke();
      ctx.restore();

      // ── Radiant Core Hologram ──
      const radiusPulse = 34 + Math.sin(phase * 2.5) * 5;
      const coreGrad = ctx.createRadialGradient(cx, cy, 3, cx, cy, radiusPulse + 20);
      coreGrad.addColorStop(0, '#ffffff');
      coreGrad.addColorStop(0.35, colorPrimary);
      coreGrad.addColorStop(0.75, colorGlow);
      coreGrad.addColorStop(1, 'transparent');

      ctx.beginPath();
      ctx.arc(cx, cy, radiusPulse + 20, 0, Math.PI * 2);
      ctx.fillStyle = coreGrad;
      ctx.fill();

      // ── Center Ring ──
      ctx.beginPath();
      ctx.arc(cx, cy, radiusPulse, 0, Math.PI * 2);
      ctx.strokeStyle = colorPrimary;
      ctx.globalAlpha = 0.85;
      ctx.lineWidth = 2;
      ctx.stroke();

      // ── Harmonic Waveforms ──
      const layers = [
        { color: colorPrimary, alpha: 0.9, scale: 1.0, freqMul: 1.0, shift: 0 },
        { color: colorSecondary, alpha: 0.65, scale: 0.7, freqMul: 1.4, shift: 1.5 },
        { color: isHHGoa ? '#ffffff' : '#ffa8cb', alpha: 0.45, scale: 0.5, freqMul: 0.8, shift: 3.0 },
      ];

      for (const layer of layers) {
        ctx.beginPath();
        ctx.strokeStyle = layer.color;
        ctx.globalAlpha = layer.alpha;
        ctx.lineWidth = 2.2;

        for (let x = 0; x < width; x++) {
          const bell = Math.sin((x / width) * Math.PI);
          const y = cy + Math.sin(x * waveFreq * layer.freqMul + phase + layer.shift) * waveAmp * layer.scale * bell;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      ctx.globalAlpha = 1.0;
      phase += 0.04;
      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [state, isRecording, isSpeaking, theme]);

  const getStateBadgeText = () => {
    switch (state) {
      case 'LISTENING':
        return { text: 'VOICE STREAM ACTIVE · LISTENING', icon: Mic };
      case 'TRANSCRIBING':
        return { text: 'SARVAM STT TRANSCRIBING', icon: Radio };
      case 'INPUT_GUARDRAIL':
        return { text: 'SAFETY GUARDRAIL CHECKING', icon: ShieldAlert };
      case 'RETRIEVING':
        return { text: 'SEARCHING MSMARCO-XI PASSAGES', icon: Sparkles };
      case 'GENERATING':
        return { text: 'SUB-200MS GROUNDED ANSWERING', icon: Activity };
      case 'OUTPUT_GUARDRAIL':
        return { text: 'GROUNDING VERIFIED WITH EVIDENCE', icon: CheckCircle };
      case 'AUDIO_SYNTHESIZING':
        return { text: 'PLAYING GROUNDED VOICE', icon: Activity };
      case 'REFUSED':
        return { text: 'GUARDRAIL REFUSAL ARMED · SAFE', icon: ShieldAlert };
      default:
        return { text: 'JULIE · VOICE RAG READY FOR QUESTIONS', icon: Radio };
    }
  };

  const badge = getStateBadgeText();
  const IconComponent = badge.icon;

  return (
    <div className="relative flex flex-col items-center justify-center py-2">
      {/* Visual Canvas */}
      <div className="relative w-full max-w-xl h-36 flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={560}
          height={140}
          className="w-full h-full"
        />
      </div>

      {/* Semantic State Badge */}
      <div className="mt-1 flex items-center">
        <div className="app-badge flex items-center space-x-2 text-xs font-mono font-black tracking-wider transition-all duration-300 py-1.5 px-4 shadow-sm">
          <IconComponent className="w-3.5 h-3.5 animate-pulse" />
          <span>{badge.text}</span>
        </div>
      </div>
    </div>
  );
};
