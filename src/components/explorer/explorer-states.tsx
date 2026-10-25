import { AlertCircle, SearchX } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"

export function ExplorerLoading() {
  return (
    <div role="status" aria-label="Loading candidate rankings" className="flex flex-col gap-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Skeleton className="h-[26rem] rounded-lg" />
        <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4">
          <Skeleton className="mb-2 h-4 w-40" />
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-12" />
          ))}
        </div>
      </div>
      <Skeleton className="h-96 rounded-lg" />
      <span className="sr-only">Loading…</span>
    </div>
  )
}

export function ExplorerError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Alert variant="destructive">
      <AlertCircle aria-hidden="true" />
      <AlertTitle>Could not load candidate rankings</AlertTitle>
      <AlertDescription>
        <p>{message}</p>
        <Button size="sm" variant="outline" className="mt-3" onClick={onRetry}>
          Try again
        </Button>
      </AlertDescription>
    </Alert>
  )
}

export function ExplorerEmpty({ minScore, onReset }: { minScore: number; onReset: () => void }) {
  return (
    <Empty className="rounded-lg border border-dashed border-border bg-card">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <SearchX aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle>No candidates meet this threshold</EmptyTitle>
        <EmptyDescription>
          No sample site scores at or above {minScore} for this target and mission purpose. Lower the minimum
          similarity to see more candidates.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button variant="outline" onClick={onReset}>
          Reset threshold
        </Button>
      </EmptyContent>
    </Empty>
  )
}
