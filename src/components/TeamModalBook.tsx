import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Github, Linkedin, ChevronLeft, ChevronRight, Sparkles, BookOpen } from 'lucide-react';

interface TeamModalBookProps {
  isOpen: boolean;
  onClose: () => void;
}

type TeamMember = {
  name: string;
  role: string;
  photo: string;
  bio: string;
  contributions: string[];
  github: string;
  linkedin: string;
  x: string;
};

const TEAM_MEMBERS: TeamMember[] = [
  {
    name: 'Suraj Kolekar',
    role: 'RAG & AI Core Architect',
    photo: '/team/Suraj.png',
    bio: 'Engineered sub-200ms vector retrieval pipelines and dense embedding chunking algorithms on MSMARCO-XI.',
    contributions: ['FastEmbed Vector Indexing', 'Multi-lingual Grounding Pipeline', 'Sub-200ms Synthesis Optimization'],
    github: 'https://github.com/Suraj0788',
    linkedin: 'https://www.linkedin.com/in/suraj-kolekar-11597140b/',
    x: 'https://x.com/PanCoon_in',
  },
  {
    name: 'Aakarshi Gupta',
    role: 'Product & Design Lead',
    photo: '/team/Aakarshi.jpg',
    bio: 'Crafted the voice-first conversational experience, telemetry dashboards, and the HackerHouse Goa design aesthetic.',
    contributions: ['HH Goa Design System', 'Voice UX & Audio Waveform Orb', 'Interactive Dossier Book Flow'],
    github: 'https://github.com/aakarshi2008-max',
    linkedin: 'https://www.linkedin.com/in/aakarshi-gupta-49272a40a',
    x: 'https://x.com/i_Aakarshii',
  },
  {
    name: 'Anant Tiwari',
    role: 'Full Stack & Orchestration Engineer',
    photo: '/team/anant.jpeg',
    bio: 'Engineered the Fastify orchestrator, Sarvam AI voice integration, telemetry trackers, and latency benchmarks.',
    contributions: ['Sarvam AI Voice STT Bridge', 'Model Harness State Machine', 'Benchmark Suite & Guardrails'],
    github: 'https://github.com/harshqs',
    linkedin: 'https://www.linkedin.com/in/anant-tiwari-og/',
    x: 'https://x.com/devanant_tiwari',
  },
];

const XIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
    <path d="M17.4 3h3.2l-7 8.02L21.5 21h-6.3l-4.94-6.46L4.7 21H1.5l7.48-8.55L2.1 3h6.46l4.46 5.9L17.4 3Zm-1.12 16.2h1.78L7.3 4.7H5.4l10.88 14.5Z" />
  </svg>
);

export const TeamModalBook: React.FC<TeamModalBookProps> = ({ isOpen, onClose }) => {
  const [currentMemberIdx, setCurrentMemberIdx] = useState<number>(0);
  const [photoError, setPhotoError] = useState<boolean>(false);

  if (!isOpen) return null;

  const member = TEAM_MEMBERS[currentMemberIdx];

  const nextMember = () => {
    setPhotoError(false);
    setCurrentMemberIdx((prev) => (prev + 1) % TEAM_MEMBERS.length);
  };

  const prevMember = () => {
    setPhotoError(false);
    setCurrentMemberIdx((prev) => (prev - 1 + TEAM_MEMBERS.length) % TEAM_MEMBERS.length);
  };

  const initials = member.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 overflow-y-auto">
      <div className="w-full max-w-3xl app-card p-6 sm:p-8 shadow-2xl relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl app-card-subtle text-[var(--theme-text-muted)] hover:text-[var(--theme-text-title)] transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Book Header */}
        <div className="flex items-center space-x-3 border-b border-[var(--theme-border-subtle)] pb-4 mb-6">
          <BookOpen className="w-6 h-6 text-[var(--theme-accent-primary)]" />
          <div>
            <h2 className="text-xl font-black text-[var(--theme-text-title)]">
              Julie // Team Dossier Book
            </h2>
            <p className="text-xs font-mono text-[var(--theme-text-muted)]">
              Hacker House Goa 2026 Residency Builders · #RAGInGoa
            </p>
          </div>
        </div>

        {/* Member Chapter Card */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
          {/* Photo Column */}
          <div className="sm:col-span-5 flex flex-col items-center">
            <div className="relative w-40 h-40 rounded-3xl overflow-hidden border-2 border-[var(--theme-border)] shadow-xl bg-[var(--theme-card-subtle)]">
              {!photoError ? (
                <img
                  src={member.photo}
                  alt={member.name}
                  className="w-full h-full object-cover object-top"
                  onError={() => setPhotoError(true)}
                />
              ) : (
                <span className="grid h-full w-full place-items-center font-black text-4xl text-[var(--theme-text-title)]">
                  {initials}
                </span>
              )}
            </div>
            <span className="app-badge mt-3 text-xs">
              MEMBER {currentMemberIdx + 1} OF {TEAM_MEMBERS.length}
            </span>
          </div>

          {/* Details Column */}
          <div className="sm:col-span-7 space-y-3 font-mono">
            <div>
              <span className="text-[10px] font-black text-[var(--theme-accent-secondary)] uppercase tracking-wider">
                {member.role}
              </span>
              <h3 className="text-2xl font-black text-[var(--theme-text-title)] font-sans">
                {member.name}
              </h3>
            </div>

            <p className="text-xs text-[var(--theme-text-body)] leading-relaxed font-sans">
              {member.bio}
            </p>

            {/* Core Responsibilities */}
            <div className="space-y-1 pt-1">
              <span className="text-[10px] font-black text-[var(--theme-text-muted)] uppercase">
                Key Contributions:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {member.contributions.map((c, i) => (
                  <span key={i} className="app-card-subtle px-2.5 py-1 text-[10px] rounded-lg">
                    {c}
                  </span>
                ))}
              </div>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-2 pt-2">
              <a
                href={member.github}
                target="_blank"
                rel="noreferrer"
                className="p-2.5 rounded-xl app-card-subtle text-[var(--theme-text-title)] hover:border-[var(--theme-border)] transition-all"
                title="GitHub"
              >
                <Github className="w-4 h-4" />
              </a>
              <a
                href={member.linkedin}
                target="_blank"
                rel="noreferrer"
                className="p-2.5 rounded-xl app-card-subtle text-[var(--theme-text-title)] hover:border-[var(--theme-border)] transition-all"
                title="LinkedIn"
              >
                <Linkedin className="w-4 h-4" />
              </a>
              <a
                href={member.x}
                target="_blank"
                rel="noreferrer"
                className="p-2.5 rounded-xl app-card-subtle text-[var(--theme-text-title)] hover:border-[var(--theme-border)] transition-all"
                title="X (Twitter)"
              >
                <XIcon className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Footer Page Navigation */}
        <div className="flex items-center justify-between border-t border-[var(--theme-border-subtle)] pt-5 mt-6">
          <button
            onClick={prevMember}
            className="px-4 py-2 rounded-xl app-card-subtle font-mono text-xs font-bold flex items-center space-x-1.5 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous Member</span>
          </button>

          {/* Member Indicators */}
          <div className="flex items-center gap-2">
            {TEAM_MEMBERS.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  setPhotoError(false);
                  setCurrentMemberIdx(i);
                }}
                className={`h-2.5 rounded-full transition-all cursor-pointer ${
                  currentMemberIdx === i
                    ? 'w-6 bg-[var(--theme-accent-primary)]'
                    : 'w-2.5 bg-[var(--theme-meter-track)]'
                }`}
              />
            ))}
          </div>

          <button
            onClick={nextMember}
            className="px-4 py-2 rounded-xl app-btn-primary font-mono text-xs font-black flex items-center space-x-1.5 cursor-pointer"
          >
            <span>Next Member</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
