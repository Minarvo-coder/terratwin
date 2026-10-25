import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function LandingHero() {
  return (
    <section className="border-b border-border">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
        <div className="flex flex-col gap-6">
          <p className="font-mono text-xs uppercase tracking-widest text-primary">Planetary analog research</p>
          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
            Find the places on Earth that behave most like the Moon and Mars.
          </h1>
          <p className="max-w-xl text-pretty leading-relaxed text-muted-foreground">
            TerraTwin compares environmental features of lunar and Martian target regions with candidate field sites
            on Earth, then ranks them for a chosen mission purpose — rover testing or geological field research.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/explore" className={cn(buttonVariants({ size: "lg" }), "gap-2")}>
              Open the explorer
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <Link href="/methodology" className={buttonVariants({ size: "lg", variant: "outline" })}>
              Methodology and data
            </Link>
          </div>
        </div>
        <figure className="overflow-hidden rounded-xl border border-border bg-card">
          <Image
            src="/images/analog-terrain.png"
            alt="Arid, rocky desert plain at twilight resembling a planetary surface"
            width={1200}
            height={800}
            priority
            className="aspect-[3/2] w-full object-cover"
          />
          <figcaption className="border-t border-border px-4 py-2 text-xs text-muted-foreground">
            Illustrative image of an arid analog-style landscape. Not a specific field site.
          </figcaption>
        </figure>
      </div>
    </section>
  )
}
