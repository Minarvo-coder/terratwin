import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FEATURE_MAP } from "@/lib/terratwin/features"
import { formatFeatureValue } from "@/lib/terratwin/format"
import type { FeatureScore } from "@/lib/terratwin/types"
import { cn } from "@/lib/utils"

interface FeatureComparisonTableProps {
  featureScores: FeatureScore[]
  targetName: string
  candidateName: string
}

export function FeatureComparisonTable({ featureScores, targetName, candidateName }: FeatureComparisonTableProps) {
  return (
    <Table>
      <caption className="sr-only">
        Environmental features of {targetName} compared with {candidateName}. All values illustrative.
      </caption>
      <TableHeader>
        <TableRow>
          <TableHead>Feature</TableHead>
          <TableHead>Target</TableHead>
          <TableHead>Earth candidate</TableHead>
          <TableHead className="text-right">Similarity</TableHead>
          <TableHead className="text-right">Weight</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {featureScores.map((item) => {
          const missing = item.similarity === null
          return (
            <TableRow key={item.key}>
              <TableCell className="font-medium">{FEATURE_MAP[item.key].label}</TableCell>
              <TableCell className="font-mono text-xs tabular-nums">{formatFeatureValue(item.key, item.targetValue)}</TableCell>
              <TableCell className={cn("font-mono text-xs tabular-nums", item.candidateValue === null && "text-warning")}>
                {formatFeatureValue(item.key, item.candidateValue)}
              </TableCell>
              <TableCell className={cn("text-right font-mono text-xs tabular-nums", missing && "text-warning")}>
                {missing ? "—" : Math.round((item.similarity ?? 0) * 100)}
              </TableCell>
              <TableCell className="text-right font-mono text-xs tabular-nums text-muted-foreground">
                {item.weight.toFixed(1)}
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
