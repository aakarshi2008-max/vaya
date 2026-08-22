import React, { useState } from 'react';
import { IconGithub, IconLinkedin, IconUsers } from './CustomIcons';

type TeamMember = {
  name: string;
  role: string;
  photo: string;
  github: string;
  linkedin: string;
  x: string;
};

const TEAM_MEMBERS: TeamMember[] = [
  {
    name: 'Suraj Kolekar',
    role: 'RAG & AI Engineer',
    photo: '/team/Suraj.png',
    github: 'https://github.com/Suraj0788',
    linkedin: 'https://www.linkedin.com/in/suraj-kolekar-11597140b/',
    x: 'https://x.com/PanCoon_in',
  },
  {
    name: 'Aakarshi Gupta',
    role: 'Product & Design Lead',
    photo: '/team/Aakarshi.jpg',
    github: 'https://github.com/aakarshi2008-max',
    linkedin: 'https://www.linkedin.com/in/aakarshi-gupta-49272a40a',
    x: 'https://x.com/i_Aakarshii',
  },
  {
    name: 'Anant Tiwari',
    role: 'Full Stack & Orchestration',
    photo: '/team/anant.jpeg',
    github: 'https://github.com/harshqs',
    linkedin: 'https://www.linkedin.com/in/anant-tiwari-og/',
    x: 'https://x.com/devanant_tiwari',
  },
];

function profileHandle(url: string) {
  try {
    const path = new URL(url).pathname.replace(/^\/+|\/+$/g, '');
    const last = path.split('/').filter(Boolean).pop() || path;
    return last.replace(/^in\//, '');
  } catch {
    return url;
  }
}

const XIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
    <path d="M17.4 3h3.2l-7 8.02L21.5 21h-6.3l-4.94-6.46L4.7 21H1.5l7.48-8.55L2.1 3h6.46l4.46 5.9L17.4 3Zm-1.12 16.2h1.78L7.3 4.7H5.4l10.88 14.5Z" />
  </svg>
);

const MemberPhoto: React.FC<{ member: TeamMember }> = ({ member }) => {
  const [failed, setFailed] = useState(false);
  const initials = member.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return (
    <div className="relative shrink-0">
      <div className="relative h-28 w-28 overflow-hidden rounded-2xl border-2 border-[var(--theme-border)] bg-[var(--theme-card-subtle)] sm:h-32 sm:w-32 shadow-sm">
        {!failed ? (
          <img
            src={member.photo}
            alt={member.name}
            className="h-full w-full object-cover object-top"
            onError={() => setFailed(true)}
          />
        ) : (
          <span className="grid h-full w-full place-items-center font-black text-3xl text-[var(--theme-text-title)]">
            {initials}
          </span>
        )}
      </div>
    </div>
  );
};

const SocialRow: React.FC<{ href: string; label: string; icon: React.ReactNode }> = ({
  href,
  label,
  icon,
}) => (
  <a
    href={href}
    target="_blank"
    rel="noreferrer"
    className="group flex min-w-0 items-center gap-3 rounded-xl border border-[var(--theme-border-subtle)] bg-[var(--theme-card-bg)] px-3 py-2 transition hover:border-[var(--theme-border)] shadow-sm"
  >
    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[var(--theme-card-subtle)] text-[var(--theme-text-title)] transition-all">
      {icon}
    </span>
    <span className="min-w-0">
      <span className="block font-mono text-[9px] font-black tracking-[.16em] text-[var(--theme-text-muted)]">{label}</span>
      <span className="block truncate font-mono text-xs text-[var(--theme-text-body)] font-bold group-hover:underline">
        {profileHandle(href)}
      </span>
    </span>
  </a>
);

export const TeamMembers: React.FC = () => (
  <section
    id="team"
    className="app-card p-6 sm:p-8 transition-all"
  >
    <div className="relative mb-6 flex flex-wrap items-end justify-between gap-3 border-b border-[var(--theme-border-subtle)] pb-4">
      <div>
        <p className="font-mono text-[11px] font-black tracking-[.18em] text-[var(--theme-text-muted)] flex items-center gap-1.5 uppercase">
          <IconUsers className="w-3.5 h-3.5 text-[var(--theme-accent-primary)]" /> JULIE / CREW
        </p>
        <h2 className="mt-1 text-2xl font-black text-[var(--theme-text-title)] sm:text-3xl">Meet The Team</h2>
      </div>
      <span className="app-badge font-mono text-xs">
        3 BUILDERS · #RAGInGoa
      </span>
    </div>

    <div className="relative grid grid-cols-1 gap-5 md:grid-cols-3">
      {TEAM_MEMBERS.map((member) => (
        <div
          key={member.name}
          className="flex flex-col justify-between rounded-2xl app-card-subtle p-5 transition"
        >
          <div>
            <div className="flex items-center gap-4">
              <MemberPhoto member={member} />
              <div>
                <h3 className="font-sans font-black text-base text-[var(--theme-text-title)] leading-tight">{member.name}</h3>
                <p className="font-mono text-[11px] font-bold text-[var(--theme-accent-secondary)] mt-0.5">{member.role}</p>
                <div className="mt-2 inline-flex items-center gap-1 app-badge text-[9px] font-mono font-black">
                  <span>#RAGInGoa</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-2">
            <SocialRow href={member.github} label="GITHUB" icon={<IconGithub className="h-4 w-4" />} />
            <SocialRow href={member.linkedin} label="LINKEDIN" icon={<IconLinkedin className="h-4 w-4" />} />
            <SocialRow href={member.x} label="X (TWITTER)" icon={<XIcon className="h-4 w-4" />} />
          </div>
        </div>
      ))}
    </div>
  </section>
);
