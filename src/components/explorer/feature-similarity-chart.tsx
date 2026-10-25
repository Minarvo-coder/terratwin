"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { FEATURE_MAP } from "@/lib/terratwin/features"
import type { FeatureScore } from "@/lib/terratwin/types"

const chartConfig = {
  similarity: { label: "Similarity (illustrative)", color: "var(--chart-1)" },
} satisfies ChartConfig

export function FeatureSimilarityChart({ featureScores }: { featureScores: FeatureScore[] }) {
  const data = featureScores
    .filter((item) => item.similarity !== null)
    .map((item) => ({
      feature: FEATURE_MAP[item.key].shortLabel,
      similarity: Math.round((item.similarity ?? 0) * 100),
    }))

  return (
    <figure className="flex flex-col gap-2">
      <figcaption className="text-xs text-muted-foreground">Per-feature similarity, 0–100 (illustrative)</figcaption>
      <ChartContainer config={chartConfig} className="aspect-auto h-72 w-full">
        <BarChart data={data} layout="vertical" margin={{ left: 4, right: 16 }} accessibilityLayer>
          <CartesianGrid horizontal={false} />
          <XAxis type="number" domain={[0, 100]} tickLine={false} axisLine={false} tickCount={6} />
          <YAxis type="category" dataKey="feature" tickLine={false} axisLine={false} width={92} />
          <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel={false} />} />
          <Bar dataKey="similarity" fill="var(--color-similarity)" radius={3} barSize={14} isAnimationActive={false} />
        </BarChart>
      </ChartContainer>
    </figure>
  )
}
