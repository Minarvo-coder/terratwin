"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Crosshair, ScanSearch } from "lucide-react"
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
    topEarthAnalog: "Lake Salda, Turkey (86.4% Geo / 81.1% Rover)",
  },
  {
    id: "moon-tranquility",
    body: "Moon",
    badgeColor: "border-cyan-500/40 text-cyan-400 bg-cyan-950/40",
    name: "Mare Tranquillitatis",
    coords: "0.67° N, 23.47° E",
    temp: "-20°C",
    lithology: "Basaltic Regolith",
    topEarthAnalog: "Askja & Holuhraun, Iceland (85.1% Geo) · Craters of the Moon, USA (81.8% Geo)",
  },
]

export function LandingHero() {
  const [activeTargetIndex, setActiveTargetIndex] = useState(0)
  const target = HERO_TARGETS[activeTargetIndex]

  return (
    <section className="relative overflow-hidden border-b border-slate-800/80 py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid items-center gap-12 lg:grid-cols-12">
          {/* Left Column: Heading & Mission Brief */}
          <div className="flex flex-col gap-6 lg:col-span-7">
            {/* Status Pill */}
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-950/40 px-3.5 py-1 text-xs text-sky-300 w-fit">
              <span className="flex size-1.5 rounded-full bg-sky-400" />
              <span>NASA Space Apps Challenge &bull; Planetary Analog Intelligence</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-balance text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl leading-[1.1]">
              Earth Analogs for <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-cyan-300 to-indigo-300">
                Lunar & Martian
              </span>{" "}
              Environments.
            </h1>

            {/* Subtitle */}
            <p className="max-w-xl text-base sm:text-lg leading-relaxed text-slate-300">
              An algorithmic mission-planning engine connecting extraterrestrial targets to real-world Earth testbeds across 12 environmental parameters, live Copernicus DEM, and NASA climatology.
            </p>

            {/* Interactive Target Quick-Switcher on Hero */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <div className="flex items-center justify-between mb-3 text-xs text-slate-400">
                <span className="flex items-center gap-1.5 text-slate-200 font-medium">
                  <Crosshair className="size-3.5 text-sky-400" />
                  Target Telemetry Preview
                </span>
                <span className="text-slate-400 text-xs">Select target</span>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {HERO_TARGETS.map((t, idx) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTargetIndex(idx)}
                    className={cn(
                      "flex items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition-all cursor-pointer border",
                      activeTargetIndex === idx
                        ? "border-sky-500/60 bg-slate-800 text-white font-medium"
                        : "border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-slate-200",
                    )}
                  >
                    <span className="font-semibold">{t.body}</span>
                    <span className="text-[11px] text-slate-400">{t.name.split(" ")[0]}</span>
                  </button>
                ))}
              </div>

              {/* Dynamic Telemetry Box */}
              <div className="grid grid-cols-3 gap-2 border-t border-slate-800 pt-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Coordinates</span>
                  <span className="text-slate-200 font-mono text-[11px]">{target.coords}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Mean Temp</span>
                  <span className="text-sky-300 font-semibold font-mono text-[11px]">{target.temp}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Top Analog</span>
                  <span className="text-emerald-400 truncate block text-[11px] font-medium">{target.topEarthAnalog}</span>
                </div>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link
                href="/explore"
                className="inline-flex items-center gap-2 rounded-lg bg-sky-400 px-5 py-3 text-sm font-semibold text-slate-950 transition-all hover:bg-sky-300 cursor-pointer"
              >
                <span>Launch Explorer</span>
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/discover"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-5 py-3 text-sm font-medium text-slate-200 transition-all hover:border-slate-600 hover:bg-slate-800 hover:text-white"
              >
                <ScanSearch className="size-4 text-sky-400" />
                <span>Discovery Scanner</span>
              </Link>
              <Link
                href="/methodology"
                className="inline-flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-slate-400 transition-all hover:text-slate-200"
              >
                <span>Methodology &amp; Math</span>
              </Link>
            </div>
          </div>

          {/* Right Column: Visual Telemetry Display */}
          <div className="lg:col-span-5">
            <div className="relative rounded-xl border border-slate-800 bg-slate-900/60 p-2">
              {/* Terrain Graphic Container */}
              <div className="relative overflow-hidden rounded-lg border border-slate-800 bg-slate-950">
                <Image
                  src="/images/analog-terrain.png"
                  alt="Arid planetary analog terrain simulation"
                  width={1200}
                  height={800}
                  priority
                  className="aspect-[4/3] w-full object-cover brightness-95"
                />

                {/* Clean HUD Overlay Elements */}
                <div className="absolute top-3 left-3 rounded-md bg-slate-950/90 border border-slate-800 px-2.5 py-1 text-xs text-sky-300 backdrop-blur-md font-medium">
                  Mission Telemetry Preview
                </div>

                <div className="absolute bottom-3 left-3 right-3 rounded-md bg-slate-950/90 border border-slate-800 p-3 backdrop-blur-md text-xs">
                  <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
                    <span>Target Location</span>
                    <span className="text-emerald-400 font-medium font-mono text-[10px]">Deterministic</span>
                  </div>
                  <div className="flex items-center justify-between font-semibold text-white">
                    <span>{target.name}</span>
                    <span className="text-slate-400 font-normal font-mono text-[11px]">{target.coords}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tactical Stat Strip */}
        <div className="mt-14 grid grid-cols-2 gap-4 border-t border-slate-800/80 pt-8 sm:grid-cols-4">
          <div className="flex flex-col gap-1 border-l-2 border-sky-500 pl-4">
            <span className="text-2xl font-bold text-white sm:text-3xl font-mono">12</span>
            <span className="text-xs text-slate-400">Environmental Parameters</span>
          </div>
          <div className="flex flex-col gap-1 border-l-2 border-slate-600 pl-4">
            <span className="text-2xl font-bold text-white sm:text-3xl font-mono">31</span>
            <span className="text-xs text-slate-400">Curated Atlas Sites (+ Live Scanner)</span>
          </div>
          <div className="flex flex-col gap-1 border-l-2 border-emerald-500 pl-4">
            <span className="text-2xl font-bold text-white sm:text-3xl font-mono">100%</span>
            <span className="text-xs text-slate-400">Deterministic (&ge;40% Coverage Gate)</span>
          </div>
          <div className="flex flex-col gap-1 border-l-2 border-amber-500 pl-4">
            <span className="text-2xl font-bold text-white sm:text-3xl font-mono">04</span>
            <span className="text-xs text-slate-400">Mission Weight Profiles</span>
          </div>
        </div>
      </div>
    </section>
  )
}
