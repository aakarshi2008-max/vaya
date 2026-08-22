import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Julie // Voice-Enabled RAG Model | HH Goa 2026",
  description: "High-performance Sub-200ms Voice RAG system built for Hacker House Goa 2026 Shortlisting Task 2. Powered by Sarvam AI, ElevenLabs STT, vast multi-strategy chunking on ai4bharat/MSMARCO-XI, model harness orchestration, and hallucination guardrails.",
  keywords: ["HH Goa 2026", "Voice RAG", "Sarvam AI", "ElevenLabs", "MSMARCO-XI", "AI4Bharat", "Sub-200ms", "Model Harness", "Guardrails"],
  authors: [{ name: "HH Goa 2026 Builder" }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-[#07090e] text-white selection:bg-[#00f0ff] selection:text-black">
        {children}
      </body>
    </html>
  );
}

