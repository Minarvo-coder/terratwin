"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Crosshair, Sparkles, Compass, ShieldAlert, Cpu, Terminal, Radio } from "lucide-react"
import { cn } from "@/lib/utils"

const HERO_TARGETS = [
  {
    id: "mars-jezero",
    body: "Mars",
    badgeColor: "border-rose-500/40 text-rose-400 bg-rose-950/40",
    name: "Jezero Crater Delta",
    coords: "18.38° N, 77.58° E",
    temp: "-60°C",
    lithology: "Clay-sedimentary & Volcanic",
    topEarthAnalog: "Salda Lake, Turkey (91% Match)",
  },
  {
    id: "moon-tranquility",
    body: "Moon",
    badgeColor: "border-cyan-500/40 text-cyan-400 bg-cyan-950/40",
    name: "Mare Tranquillitatis",
    coords: "0.67° N, 23.47° E",
    temp: "-20°C",
    lithology: "Basaltic Regolith",
    topEarthAnalog: "Craters of the Moon, USA (87% Match)",
  },
]

export function LandingHero() {
  const [activeTargetIndex, setActiveTargetIndex] = useState(0)
  const target = HERO_TARGETS[activeTargetIndex]

  return (
    <section className="relative overflow-hidden border-b border-cyan-500/15 py-16 lg:py-24">
      {/* Background ambient cosmic glow */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[900px] rounded-full bg-cyan-500/10 blur-[130px]" />
        <div className="absolute right-0 top-1/3 h-[400px] w-[600px] rounded-full bg-purple-600/10 blur-[120px]" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid items-center gap-12 lg:grid-cols-12">
          {/* Left Column: Heading & Mission Brief */}
          <div className="flex flex-col gap-6 lg:col-span-7">
            {/* Status Pill */}
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-950/40 px-3.5 py-1 text-xs font-mono text-cyan-300 w-fit backdrop-blur-md shadow-[0_0_15px_rgba(56,189,248,0.15)]">
              <span className="flex size-2 rounded-full bg-cyan-400 animate-pulse" />
              <span>NASA SPACE APPS CHALLENGE · TERRESTRIAL ANALOG TWIN</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-balance text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl leading-[1.1]">
              Earth Analogs for <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-300">
                Lunar & Martian
              </span>{" "}
              Environments.
            </h1>

            {/* Subtitle */}
            <p className="max-w-xl text-base sm:text-lg leading-relaxed text-slate-300">
              TerraTwin is an algorithmic mission-planning engine. It maps the environmental, mineralogical, and
              geomorphological conditions of extraterrestrial exploration targets against real-world terrestrial field sites.
            </p>

            {/* Interactive Target Quick-Switcher on Hero */}
            <div className="rounded-xl border border-cyan-500/20 bg-slate-900/70 p-4 backdrop-blur-md">
              <div className="flex items-center justify-between mb-3 text-xs font-mono text-slate-400">
                <span className="flex items-center gap-1.5 text-cyan-400">
                  <Crosshair className="size-3.5" />
                  INTERACTIVE RECON PREVIEW:
                </span>
                <span className="text-slate-500">SELECT CELESTIAL TARGET</span>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {HERO_TARGETS.map((t, idx) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTargetIndex(idx)}
                    className={cn(
                      "flex items-center justify-between rounded-lg px-3 py-2 text-left font-mono text-xs transition-all cursor-pointer border",
                      activeTargetIndex === idx
                        ? "border-cyan-400 bg-cyan-950/60 text-white shadow-[0_0_15px_rgba(56,189,248,0.2)]"
                        : "border-slate-800 bg-slate-950/50 text-slate-400 hover:border-slate-700 hover:text-slate-200",
                    )}
                  >
                    <span className="font-semibold">{t.body}</span>
                    <span className="text-[10px] text-slate-500">{t.name.split(" ")[0]}</span>
                  </button>
                ))}
              </div>

              {/* Dynamic Telemetry Box */}
              <div className="grid grid-cols-3 gap-2 border-t border-slate-800/80 pt-3 text-[11px] font-mono">
                <div>
                  <span className="text-slate-500 block text-[10px]">COORDINATES</span>
                  <span className="text-slate-200">{target.coords}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">MEAN TEMP</span>
                  <span className="text-cyan-400 font-semibold">{target.temp}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">TOP ANALOG</span>
                  <span className="text-emerald-400 truncate block">{target.topEarthAnalog}</span>
                </div>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                href="/explore"
                className="group relative flex items-center gap-2.5 rounded-lg border border-cyan-400/50 bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3.5 text-sm font-semibold text-slate-950 shadow-[0_0_25px_rgba(56,189,248,0.35)] transition-all hover:shadow-[0_0_35px_rgba(56,189,248,0.55)] hover:scale-[1.02] cursor-pointer"
              >
                <Terminal className="size-4" />
                <span>Launch Explorer Terminal</span>
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/methodology"
                className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/60 px-5 py-3.5 text-sm font-semibold text-slate-200 backdrop-blur-sm transition-all hover:border-cyan-500/40 hover:bg-slate-850 hover:text-white"
              >
                <span>Methodology & Math</span>
              </Link>
            </div>
          </div>

          {/* Right Column: Visual HUD Telemetry Display */}
          <div className="lg:col-span-5">
            <div className="relative rounded-2xl border border-cyan-500/30 bg-slate-950/80 p-2 shadow-2xl backdrop-blur-xl">
              {/* Corner HUD Reticles */}
              <div className="pointer-events-none absolute -top-1.5 -left-1.5 size-4 border-t-2 border-l-2 border-cyan-400" />
              <div className="pointer-events-none absolute -top-1.5 -right-1.5 size-4 border-t-2 border-r-2 border-cyan-400" />
              <div className="pointer-events-none absolute -bottom-1.5 -left-1.5 size-4 border-b-2 border-l-2 border-cyan-400" />
              <div className="pointer-events-none absolute -bottom-1.5 -right-1.5 size-4 border-b-2 border-r-2 border-cyan-400" />

              {/* Terrain Graphic Container */}
              <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
                {/* Scanner Beam Animation */}
                <div className="scanner-beam pointer-events-none" />

                <Image
                  src="/images/analog-terrain.png"
                  alt="Arid planetary analog terrain simulation"
                  width={1200}
                  height={800}
                  priority
                  className="aspect-[4/3] w-full object-cover brightness-90 contrast-110"
                />

                {/* Tactical HUD Overlay Elements */}
                <div className="absolute top-3 left-3 rounded bg-slate-950/80 border border-cyan-500/30 px-2 py-1 font-mono text-[10px] text-cyan-300 backdrop-blur-md">
                  FEED: ORBITAL OPTICAL // SYNTHETIC
                </div>

                <div className="absolute bottom-3 left-3 right-3 rounded-lg bg-slate-950/85 border border-slate-800/90 p-3 backdrop-blur-md font-mono text-xs">
                  <div className="flex items-center justify-between text-slate-400 text-[10px] mb-1">
                    <span>SECTOR TELEMETRY</span>
                    <span className="text-cyan-400 font-bold">100% REPRODUCIBLE</span>
                  </div>
                  <div className="flex items-center justify-between font-semibold text-white">
                    <span>{target.name}</span>
                    <span className="text-slate-400 font-normal text-[11px]">{target.coords}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tactical Stat Strip */}
        <div className="mt-14 grid grid-cols-2 gap-4 border-t border-cyan-500/15 pt-8 sm:grid-cols-4">
          <div className="flex flex-col gap-1 border-l-2 border-cyan-500/40 pl-4 font-mono">
            <span className="text-2xl font-bold text-white sm:text-3xl">08</span>
            <span className="text-xs text-slate-400 uppercase tracking-wider">Scientific Dimensions</span>
          </div>
          <div className="flex flex-col gap-1 border-l-2 border-purple-500/40 pl-4 font-mono">
            <span className="text-2xl font-bold text-white sm:text-3xl">15+</span>
            <span className="text-xs text-slate-400 uppercase tracking-wider">Calibrated Earth Basins</span>
          </div>
          <div className="flex flex-col gap-1 border-l-2 border-emerald-500/40 pl-4 font-mono">
            <span className="text-2xl font-bold text-white sm:text-3xl">100%</span>
            <span className="text-xs text-slate-400 uppercase tracking-wider">Deterministic Scoring</span>
          </div>
          <div className="flex flex-col gap-1 border-l-2 border-amber-500/40 pl-4 font-mono">
            <span className="text-2xl font-bold text-white sm:text-3xl">NASA</span>
            <span className="text-xs text-slate-400 uppercase tracking-wider">Space Apps 2026 Target</span>
          </div>
        </div>
      </div>
    </section>
  )
}
