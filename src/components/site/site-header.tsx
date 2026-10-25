import Link from "next/link"
import { Globe2 } from "lucide-react"
import { SiteNav } from "./site-nav"
import AuthButton from "@/components/auth-button"
import { Suspense } from "react"

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-[1000] border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="flex size-7 items-center justify-center rounded-md bg-primary/15 text-primary">
            <Globe2 className="size-4" aria-hidden="true" />
          </span>
          TerraTwin
        </Link>
        <div className="flex items-center gap-4">
          <SiteNav />
          <div className="h-4 w-px bg-border hidden sm:block" />
          <Suspense fallback={<div className="h-7 w-20 rounded bg-muted animate-pulse" />}>
            <AuthButton />
          </Suspense>
        </div>
      </div>
    </header>
  )
}
