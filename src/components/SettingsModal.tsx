import React from 'react';
import { X, Key, Cpu, Mic, Shield, Sparkles, Check } from 'lucide-react';
import { STTEnginePreference } from '../lib/stt';
import { ChunkingStrategyId, STRATEGY_CONFIGS } from '../lib/chunking/types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sttEngine: STTEnginePreference;
  onSetSTTEngine: (engine: STTEnginePreference) => void;
  sarvamKey: string;
  onSetSarvamKey: (key: string) => void;
  elevenLabsKey: string;
  onSetElevenLabsKey: (key: string) => void;
  activeStrategy: ChunkingStrategyId;
  onSetStrategy: (strategy: ChunkingStrategyId) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  sttEngine,
  onSetSTTEngine,
  sarvamKey,
  onSetSarvamKey,
  elevenLabsKey,
  onSetElevenLabsKey,
  activeStrategy,
  onSetStrategy
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl bg-[#0b0f17] border border-[#1e293b] rounded-2xl shadow-2xl overflow-hidden flex flex-col font-mono text-xs">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#1b2537] bg-[#0d121c]">
          <div className="flex items-center space-x-2">
            <Key className="w-4 h-4 text-[#00f0ff]" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Julie System & Engine Settings
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#1a2334] transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* STT Engine Selection */}
          <div>
            <label className="text-gray-300 font-bold mb-2 flex items-center space-x-1.5">
              <Mic className="w-3.5 h-3.5 text-[#00f0ff]" />
              <span>Speech-to-Text Engine (Task 2 Requirement 1)</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'sarvam', name: 'Sarvam AI', sub: 'Saarika / Saaras (Indic)' },
                { id: 'elevenlabs', name: 'ElevenLabs', sub: 'Scribe v1 STT' },
                { id: 'fast_stream', name: 'FastStream', sub: 'Sub-50ms Speculative' }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => onSetSTTEngine(item.id as STTEnginePreference)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    sttEngine === item.id
                      ? 'bg-[#121c2e] border-[#00f0ff] text-white shadow-md shadow-[#00f0ff]/10'
                      : 'bg-[#111724] border-[#1e293b] text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <div className="font-bold">{item.name}</div>
                  <div className="text-[10px] text-gray-500 mt-0.5">{item.sub}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Sarvam AI Key */}
          <div>
            <label className="text-gray-300 font-bold mb-1 block">
              Sarvam AI API Subscription Key (Optional)
            </label>
            <input
              type="password"
              value={sarvamKey}
              onChange={(e) => onSetSarvamKey(e.target.value)}
              placeholder="Enter your Sarvam API subscription key..."
              className="w-full bg-[#121824] border border-[#1f2b3e] focus:border-[#00f0ff] rounded-xl px-3.5 py-2.5 text-white outline-none"
            />
            <p className="text-[10px] text-gray-500 mt-1">
              Used for live Saarika multilingual transcription. (Built-in simulation active if left empty).
            </p>
          </div>

          {/* ElevenLabs Key */}
          <div>
            <label className="text-gray-300 font-bold mb-1 block">
              ElevenLabs API Key (Optional)
            </label>
            <input
              type="password"
              value={elevenLabsKey}
              onChange={(e) => onSetElevenLabsKey(e.target.value)}
              placeholder="Enter your ElevenLabs API key..."
              className="w-full bg-[#121824] border border-[#1f2b3e] focus:border-[#00f0ff] rounded-xl px-3.5 py-2.5 text-white outline-none"
            />
            <p className="text-[10px] text-gray-500 mt-1">
              Used for ElevenLabs Scribe STT voice transcription.
            </p>
          </div>

          {/* Default Chunking Strategy */}
          <div>
            <label className="text-gray-300 font-bold mb-1 block">
              Default Chunking Architecture
            </label>
            <select
              value={activeStrategy}
              onChange={(e) => onSetStrategy(e.target.value as ChunkingStrategyId)}
              className="w-full bg-[#121824] border border-[#1f2b3e] focus:border-[#00f0ff] rounded-xl px-3.5 py-2.5 text-white outline-none cursor-pointer"
            >
              {Object.keys(STRATEGY_CONFIGS).map((k) => (
                <option key={k} value={k}>
                  {STRATEGY_CONFIGS[k as ChunkingStrategyId].name} — {STRATEGY_CONFIGS[k as ChunkingStrategyId].tagline}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#1b2537] bg-[#0d121c] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#00f0ff] hover:bg-[#00e599] text-black font-bold transition-all cursor-pointer"
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
};

