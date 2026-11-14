import { formatCoverage, formatFeatureValue } from "../format.ts"
import {
  RESEARCH_WORKFLOW_DISCLAIMER,
  RESEARCH_TASK_STATUS_LABELS,
  type ResearchAssessmentRecord,
} from "../types/research-workflow.ts"

const PAGE_WIDTH = 612
const PAGE_HEIGHT = 792
const MARGIN_LEFT = 44
const MARGIN_RIGHT = 44
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT // 524 pt
const TOP_START_Y = PAGE_HEIGHT - 58 // 734 pt
const BOTTOM_LIMIT_Y = 54

type PdfFontId = "F1" | "F2" | "F3"

const WINANSI_MAP: Record<number, number> = {
  0x2013: 0x96, // en dash
  0x2014: 0x97, // em dash
  0x2018: 0x91,
  0x2019: 0x92,
  0x201c: 0x93,
  0x201d: 0x94,
  0x2022: 0x95, // bullet
  0x2026: 0x85, // ellipsis
}

const ASCII_FALLBACKS: Record<string, string> = {
  "≤": "<=",
  "≥": ">=",
  "≈": "~",
  "≠": "!=",
  "→": "->",
  "←": "<-",
  "↔": "<->",
  "✓": "[OK]",
  "✔": "[OK]",
  "✖": "[X]",
  "µ": "u",
  "μ": "u",
  "Δ": "Delta",
  "−": "-",
  "⁰": "^0",
  "¹": "^1",
  "⁴": "^4",
  "⁵": "^5",
  "⁻": "^-",
  "\u00a0": " ",
  "₀": "0",
  "₁": "1",
  "₂": "2",
  "₃": "3",
  "₄": "4",
}

/**
 * Converts arbitrary UTF-8 input into a safe PDF WinAnsi octal-escaped literal string.
 */
function encodePdfText(raw: string): string {
  let normalized = raw.replace(/\r\n/g, "\n").replace(/[\r\t]/g, " ")
  for (const [sym, rep] of Object.entries(ASCII_FALLBACKS)) {
    if (normalized.includes(sym)) {
      normalized = normalized.split(sym).join(rep)
    }
  }

  let out = ""
  for (let i = 0; i < normalized.length; i++) {
    const code = normalized.charCodeAt(i)
    if (code === 0x5c) {
      out += "\\\\"
    } else if (code === 0x28) {
      out += "\\("
    } else if (code === 0x29) {
      out += "\\)"
    } else if (code >= 0x20 && code <= 0x7e) {
      out += normalized[i]
    } else if (code >= 0xa0 && code <= 0xff) {
      out += "\\" + code.toString(8).padStart(3, "0")
    } else if (WINANSI_MAP[code] !== undefined) {
      out += "\\" + WINANSI_MAP[code].toString(8).padStart(3, "0")
    } else {
      out += "?"
    }
  }
  return out
}

function sanitizeDisplayText(raw: string): string {
  let out = raw.replace(/\r\n/g, " ").replace(/[\r\n\t]+/g, " ").trim()
  for (const [sym, rep] of Object.entries(ASCII_FALLBACKS)) {
    if (out.includes(sym)) out = out.split(sym).join(rep)
  }
  return out
}

function estimateCharWidthPt(ch: string, font: PdfFontId, size: number): number {
  if (font === "F3") return size * 0.6
  const scale = font === "F2" ? 1.06 : 1.0
  if (ch === " ") return size * 0.28 * scale
  if ("ijlI|!.,:;'`".includes(ch)) return size * 0.25 * scale
  if ("frt[]()-\"/\\".includes(ch)) return size * 0.34 * scale
  if ("MWwm@%#".includes(ch)) return size * 0.78 * scale
  if (ch >= "A" && ch <= "Z") return size * 0.65 * scale
  if (ch >= "0" && ch <= "9") return size * 0.56 * scale
  return size * 0.52 * scale
}

function measureTextWidthPt(text: string, font: PdfFontId, size: number): number {
  let sum = 0
  for (let i = 0; i < text.length; i++) {
    sum += estimateCharWidthPt(text[i], font, size)
  }
  return sum
}

function wrapTextToLines(
  text: string,
  maxWidthPt: number,
  font: PdfFontId,
  size: number
): string[] {
  const clean = sanitizeDisplayText(text)
  if (!clean) return [""]

  const lines: string[] = []
  const words = clean.split(/\s+/)
  let current = ""

  const pushHardBrokenWord = (word: string) => {
    let chunk = ""
    for (let i = 0; i < word.length; i++) {
      const ch = word[i]
      const candidate = chunk + ch
      if (measureTextWidthPt(candidate, font, size) > maxWidthPt && chunk.length > 0) {
        lines.push(chunk)
        chunk = ch
      } else {
        chunk = candidate
      }
    }
    if (chunk) current = chunk
  }

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word
    if (measureTextWidthPt(candidate, font, size) <= maxWidthPt) {
      current = candidate
    } else {
      if (current) {
        lines.push(current)
        current = ""
      }
      if (measureTextWidthPt(word, font, size) > maxWidthPt) {
        pushHardBrokenWord(word)
      } else {
        current = word
      }
    }
  }
  if (current) lines.push(current)

  return lines.length > 0 ? lines : [""]
}

interface PdfPageBuffer {
  commands: string[]
}

function rgbFill(r: number, g: number, b: number): string {
  return `${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} rg`
}

function rgbStroke(r: number, g: number, b: number): string {
  return `${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} RG`
}

class ScientificPdfDocumentBuilder {
  private pages: PdfPageBuffer[] = []
  private currentPageIndex = 0
  private y = TOP_START_Y
  private readonly snapshotId: string
  private readonly candidateLabel: string

  constructor(snapshotId: string, candidateLabel: string) {
    this.snapshotId = snapshotId
    this.candidateLabel = candidateLabel
    this.pages.push({ commands: [] })
  }

  private get page(): PdfPageBuffer {
    return this.pages[this.currentPageIndex]
  }

  private pushCmd(cmd: string) {
    this.page.commands.push(cmd)
  }

  newPage() {
    this.pages.push({ commands: [] })
    this.currentPageIndex = this.pages.length - 1
    this.y = TOP_START_Y - 12
    this.drawRunningHeader()
  }

  setCursorY(nextY: number) {
    this.y = nextY
  }

  ensureSpace(requiredPt: number) {
    if (this.y - requiredPt < BOTTOM_LIMIT_Y) {
      this.newPage()
    }
  }

  private drawRunningHeader() {
    const cmds = this.page.commands
    cmds.push("q")
    cmds.push(rgbFill(0.39, 0.45, 0.55))
    cmds.push(`BT /F3 7.5 Tf ${MARGIN_LEFT} ${PAGE_HEIGHT - 30} Td (${encodePdfText(`TERRATWIN SCIENTIFIC ASSESSMENT | ${this.candidateLabel} | SNAPSHOT ${this.snapshotId}`)}) Tj ET`)
    cmds.push(rgbStroke(0.80, 0.84, 0.90))
    cmds.push(`0.6 w ${MARGIN_LEFT} ${PAGE_HEIGHT - 36} m ${PAGE_WIDTH - MARGIN_RIGHT} ${PAGE_HEIGHT - 36} l S`)
    cmds.push("Q")
  }

  drawRect(
    x: number,
    bottomY: number,
    w: number,
    h: number,
    fillRgb?: [number, number, number],
    strokeRgb?: [number, number, number],
    lineWidth = 0.6
  ) {
    this.pushCmd("q")
    if (fillRgb) this.pushCmd(rgbFill(fillRgb[0], fillRgb[1], fillRgb[2]))
    if (strokeRgb) {
      this.pushCmd(rgbStroke(strokeRgb[0], strokeRgb[1], strokeRgb[2]))
      this.pushCmd(`${lineWidth} w`)
    }
    const op = fillRgb && strokeRgb ? "B" : fillRgb ? "f" : "S"
    this.pushCmd(`${x.toFixed(2)} ${bottomY.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re ${op}`)
    this.pushCmd("Q")
  }

  drawTextLine(
    text: string,
    x: number,
    baselineY: number,
    font: PdfFontId,
    size: number,
    colorRgb: [number, number, number] = [0.07, 0.10, 0.16]
  ) {
    this.pushCmd("q")
    this.pushCmd(rgbFill(colorRgb[0], colorRgb[1], colorRgb[2]))
    this.pushCmd(
      `BT /${font} ${size.toFixed(1)} Tf ${x.toFixed(2)} ${baselineY.toFixed(2)} Td (${encodePdfText(
        text
      )}) Tj ET`
    )
    this.pushCmd("Q")
  }

  drawSectionHeading(numLabel: string, title: string) {
    this.ensureSpace(34)
    this.y -= 8
    this.drawRect(MARGIN_LEFT, this.y - 16, CONTENT_WIDTH, 18, [0.93, 0.96, 0.99], [0.78, 0.84, 0.92])
    this.drawRect(MARGIN_LEFT, this.y - 16, 4, 18, [0.02, 0.52, 0.78])
    this.drawTextLine(`${numLabel}  ${title}`, MARGIN_LEFT + 10, this.y - 11, "F2", 9.5, [0.05, 0.14, 0.25])
    this.y -= 26
  }

  drawParagraph(
    text: string,
    options?: {
      font?: PdfFontId
      size?: number
      color?: [number, number, number]
      indent?: number
      lineHeight?: number
      gapAfter?: number
    }
  ) {
    const font = options?.font ?? "F1"
    const size = options?.size ?? 8.8
    const color = options?.color ?? [0.12, 0.16, 0.24]
    const indent = options?.indent ?? 0
    const lineHeight = options?.lineHeight ?? 12.2
    const gapAfter = options?.gapAfter ?? 5

    const lines = wrapTextToLines(text, CONTENT_WIDTH - indent, font, size)
    for (const line of lines) {
      this.ensureSpace(lineHeight + 2)
      this.drawTextLine(line, MARGIN_LEFT + indent, this.y - size, font, size, color)
      this.y -= lineHeight
    }
    this.y -= gapAfter
  }

  drawBullet(text: string, font: PdfFontId = "F1", size = 8.5) {
    const lines = wrapTextToLines(text, CONTENT_WIDTH - 16, font, size)
    const lh = 11.8
    this.ensureSpace(lines.length * lh + 4)
    lines.forEach((line, idx) => {
      if (idx === 0) {
        this.drawTextLine("-", MARGIN_LEFT + 4, this.y - size, "F2", size, [0.02, 0.52, 0.78])
      }
      this.drawTextLine(line, MARGIN_LEFT + 14, this.y - size, font, size, [0.14, 0.18, 0.26])
      this.y -= lh
    })
    this.y -= 2
  }

  drawCalloutBox(
    title: string,
    bodyLines: string[],
    fillRgb: [number, number, number],
    borderRgb: [number, number, number],
    titleColor: [number, number, number]
  ) {
    const wrappedBlocks = bodyLines.flatMap((b) =>
      wrapTextToLines(b, CONTENT_WIDTH - 20, "F1", 8.4)
    )
    const boxHeight = 20 + wrappedBlocks.length * 11.5 + 8
    this.ensureSpace(boxHeight + 6)
    const bottomY = this.y - boxHeight
    this.drawRect(MARGIN_LEFT, bottomY, CONTENT_WIDTH, boxHeight, fillRgb, borderRgb, 0.8)
    this.drawTextLine(title, MARGIN_LEFT + 10, this.y - 13, "F2", 8.8, titleColor)
    let cursorY = this.y - 26
    for (const line of wrappedBlocks) {
      this.drawTextLine(line, MARGIN_LEFT + 10, cursorY, "F1", 8.4, [0.15, 0.18, 0.25])
      cursorY -= 11.5
    }
    this.y = bottomY - 8
  }

  drawKeyValueGrid(pairs: Array<{ label: string; value: string }>) {
    const colW = (CONTENT_WIDTH - 8) / 2
    for (let i = 0; i < pairs.length; i += 2) {
      const left = pairs[i]
      const right = pairs[i + 1]
      const leftLines = wrapTextToLines(left.value, colW - 14, "F1", 8.4)
      const rightLines = right ? wrapTextToLines(right.value, colW - 14, "F1", 8.4) : []
      const maxLines = Math.max(leftLines.length, rightLines.length, 1)
      const rowH = 15 + maxLines * 10.8 + 5
      this.ensureSpace(rowH + 4)
      const bottomY = this.y - rowH

      const drawCell = (cellX: number, item: { label: string; value: string }, lines: string[]) => {
        this.drawRect(cellX, bottomY, colW, rowH, [0.97, 0.98, 0.99], [0.85, 0.89, 0.93])
        this.drawTextLine(item.label.toUpperCase(), cellX + 7, this.y - 11, "F2", 7.2, [0.34, 0.42, 0.52])
        let cy = this.y - 22
        for (const ln of lines) {
          this.drawTextLine(ln, cellX + 7, cy, "F1", 8.4, [0.08, 0.12, 0.18])
          cy -= 10.8
        }
      }

      drawCell(MARGIN_LEFT, left, leftLines)
      if (right) {
        drawCell(MARGIN_LEFT + colW + 8, right, rightLines)
      }
      this.y = bottomY - 5
    }
  }

  drawTable(
    headers: Array<{ label: string; width: number; font?: PdfFontId }>,
    rows: Array<string[]>
  ) {
    const drawTableHeader = () => {
      this.ensureSpace(24)
      const headerH = 18
      const bottomY = this.y - headerH
      this.drawRect(MARGIN_LEFT, bottomY, CONTENT_WIDTH, headerH, [0.09, 0.17, 0.28])
      let cx = MARGIN_LEFT
      for (const col of headers) {
        this.drawTextLine(col.label, cx + 4, this.y - 12.5, "F2", 7.4, [0.95, 0.98, 1.0])
        cx += col.width
      }
      this.y = bottomY
    }

    drawTableHeader()

    rows.forEach((cells, rowIdx) => {
      const cellWrapped = headers.map((col, idx) =>
        wrapTextToLines(cells[idx] ?? "", col.width - 8, col.font ?? "F1", 7.6)
      )
      const maxLines = Math.max(1, ...cellWrapped.map((l) => l.length))
      const rowH = Math.max(17, maxLines * 9.8 + 7)

      if (this.y - rowH < BOTTOM_LIMIT_Y) {
        this.newPage()
        drawTableHeader()
      }

      const bottomY = this.y - rowH
      const bg: [number, number, number] = rowIdx % 2 === 0 ? [1.0, 1.0, 1.0] : [0.96, 0.98, 0.99]
      this.drawRect(MARGIN_LEFT, bottomY, CONTENT_WIDTH, rowH, bg, [0.84, 0.88, 0.93], 0.45)

      let cx = MARGIN_LEFT
      for (let c = 0; c < headers.length; c++) {
        const font = headers[c].font ?? "F1"
        const lines = cellWrapped[c]
        let cy = this.y - 11
        for (const ln of lines) {
          this.drawTextLine(ln, cx + 4, cy, font, 7.6, [0.10, 0.14, 0.22])
          cy -= 9.8
        }
        if (c > 0) {
          this.pushCmd("q")
          this.pushCmd(rgbStroke(0.86, 0.90, 0.94))
          this.pushCmd(`0.4 w ${cx.toFixed(2)} ${bottomY.toFixed(2)} m ${cx.toFixed(2)} ${this.y.toFixed(2)} l S`)
          this.pushCmd("Q")
        }
        cx += headers[c].width
      }
      this.y = bottomY
    })

    this.y -= 8
  }

  /**
   * Draws an evidence-backed dimensionless horizontal similarity & coverage bar chart.
   */
  drawSimilarityBarChart(
    items: Array<{ label: string; weightPct: number; similarityPct: number | null; statusLabel: string }>
  ) {
    const barLeft = MARGIN_LEFT + 165
    const barMaxW = 240
    const rowH = 16

    this.ensureSpace(items.length * rowH + 22)
    this.drawParagraph("Dimensionless Feature Similarity Profile (0-100% scale; null = unmeasured)", {
      font: "F2",
      size: 8.2,
      color: [0.12, 0.22, 0.35],
      gapAfter: 3,
    })

    for (const item of items) {
      this.ensureSpace(rowH + 4)
      const topY = this.y
      const textY = topY - 10.5
      this.drawTextLine(`${item.label} (${item.weightPct}%)`, MARGIN_LEFT + 4, textY, "F1", 7.8, [0.12, 0.16, 0.24])
      this.drawRect(barLeft, topY - 12, barMaxW, 8, [0.91, 0.94, 0.97], [0.80, 0.85, 0.90], 0.4)

      if (item.similarityPct !== null && Number.isFinite(item.similarityPct)) {
        const clamped = Math.max(0, Math.min(100, item.similarityPct))
        const fillW = (clamped / 100) * barMaxW
        const fillColor: [number, number, number] =
          clamped >= 75
            ? [0.06, 0.58, 0.42]
            : clamped >= 45
            ? [0.02, 0.52, 0.78]
            : [0.75, 0.22, 0.26]
        if (fillW > 0.5) {
          this.drawRect(barLeft, topY - 12, fillW, 8, fillColor)
        }
        this.drawTextLine(
          `${clamped.toFixed(0)}% (${item.statusLabel})`,
          barLeft + barMaxW + 8,
          textY,
          "F3",
          7.4,
          [0.10, 0.14, 0.22]
        )
      } else {
        this.drawTextLine(
          `N/A - ${item.statusLabel}`,
          barLeft + barMaxW + 8,
          textY,
          "F3",
          7.4,
          [0.45, 0.50, 0.58]
        )
      }
      this.y -= rowH
    }
    this.y -= 6
  }

  toPdfBytes(metadata: { title: string; author: string; subject: string }): Uint8Array {
    const totalPages = this.pages.length
    for (let i = 0; i < totalPages; i++) {
      const footerLines = this.pages[i].commands
      footerLines.push("q")
      footerLines.push(rgbStroke(0.80, 0.84, 0.90))
      footerLines.push(`0.6 w ${MARGIN_LEFT} 40 m ${PAGE_WIDTH - MARGIN_RIGHT} 40 l S`)
      footerLines.push(rgbFill(0.38, 0.44, 0.54))
      footerLines.push(
        `BT /F1 7.3 Tf ${MARGIN_LEFT} 27 Td (${encodePdfText(
          "TerraTwin Exploratory Screening Record (not official NASA certification)."
        )}) Tj ET`
      )
      footerLines.push(
        `BT /F3 7.5 Tf ${PAGE_WIDTH - MARGIN_RIGHT - 58} 27 Td (${encodePdfText(
          `Page ${i + 1} of ${totalPages}`
        )}) Tj ET`
      )
      footerLines.push("Q")
    }

    // Object numbering:
    // 1: Catalog, 2: Pages, 3: Info, 4: F1 Helvetica, 5: F2 Helvetica-Bold, 6: F3 Courier
    // Then pairs of (Page object, Content stream object) per page
    const objects: string[] = []
    const pageObjIds: number[] = []
    const nextPageObjBase = 7

    for (let i = 0; i < totalPages; i++) {
      pageObjIds.push(nextPageObjBase + i * 2)
    }

    objects.push(`1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`)
    objects.push(
      `2 0 obj\n<< /Type /Pages /Kids [${pageObjIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${totalPages} >>\nendobj\n`
    )
    objects.push(
      `3 0 obj\n<< /Title (${encodePdfText(metadata.title)}) /Author (${encodePdfText(
        metadata.author
      )}) /Subject (${encodePdfText(metadata.subject)}) /Producer (TerraTwin PDF 1.4 Generator v6.6) >>\nendobj\n`
    )
    objects.push(
      `4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj\n`
    )
    objects.push(
      `5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>\nendobj\n`
    )
    objects.push(
      `6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Courier /Encoding /WinAnsiEncoding >>\nendobj\n`
    )

    for (let i = 0; i < totalPages; i++) {
      const pageId = nextPageObjBase + i * 2
      const contentId = pageId + 1
      const streamBody = this.pages[i].commands.join("\n") + "\n"
      const streamByteLen = Buffer.byteLength(streamBody, "latin1")
      objects.push(
        `${pageId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 4 0 R /F2 5 0 R /F3 6 0 R >> >> /Contents ${contentId} 0 R >>\nendobj\n`
      )
      objects.push(
        `${contentId} 0 obj\n<< /Length ${streamByteLen} >>\nstream\n${streamBody}endstream\nendobj\n`
      )
    }

    const header = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n"
    const chunks: Buffer[] = [Buffer.from(header, "latin1")]
    const offsets: number[] = [0]
    let currentOffset = chunks[0].length

    for (const objStr of objects) {
      offsets.push(currentOffset)
      const buf = Buffer.from(objStr, "latin1")
      chunks.push(buf)
      currentOffset += buf.length
    }

    const xrefStart = currentOffset
    const totalObjs = objects.length + 1
    let xref = `xref\n0 ${totalObjs}\n0000000000 65535 f \n`
    for (let i = 1; i < offsets.length; i++) {
      xref += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`
    }
    const trailer = `trailer\n<< /Size ${totalObjs} /Root 1 0 R /Info 3 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`
    chunks.push(Buffer.from(xref + trailer, "latin1"))

    return new Uint8Array(Buffer.concat(chunks))
  }
}

export function generateScientificAssessmentPdf(
  record: ResearchAssessmentRecord,
  options?: { exportTimestamp?: string }
): Uint8Array {
  const s = record.snapshot
  const intel = s.intelligence
  const meta = s.reportMetadata
  const exportTime = options?.exportTimestamp ?? new Date().toISOString()

  const doc = new ScientificPdfDocumentBuilder(s.snapshotId, s.candidateId)

  // --- COVER HEADER BANNER ---
  doc.drawRect(MARGIN_LEFT, TOP_START_Y - 78, CONTENT_WIDTH, 78, [0.05, 0.11, 0.21])
  doc.drawRect(MARGIN_LEFT, TOP_START_Y - 78, CONTENT_WIDTH, 3, [0.02, 0.68, 0.88])
  doc.drawTextLine("TERRATWIN | NASA SPACE APPS CHALLENGE — TEAM HEXARCHY", MARGIN_LEFT + 12, TOP_START_Y - 18, "F2", 8.2, [0.35, 0.80, 0.96])
  doc.drawTextLine(meta.reportTitle, MARGIN_LEFT + 12, TOP_START_Y - 38, "F2", 15.0, [1.0, 1.0, 1.0])
  doc.drawTextLine(meta.reportSubtitle, MARGIN_LEFT + 12, TOP_START_Y - 54, "F1", 9.5, [0.80, 0.88, 0.95])
  doc.drawTextLine(
    `Snapshot: ${s.snapshotId} (v${s.schemaVersion})  |  Generated: ${exportTime}`,
    MARGIN_LEFT + 12,
    TOP_START_Y - 69,
    "F3",
    7.6,
    [0.62, 0.78, 0.92]
  )

  doc.setCursorY(TOP_START_Y - 90)

  // --- MANDATORY DISCLAIMER BOX ---
  doc.drawCalloutBox(
    "SCIENTIFIC SCREENING DISCLAIMER (NON-CERTIFICATION NOTICE)",
    [
      RESEARCH_WORKFLOW_DISCLAIMER,
      `Workflow record revision: ${s.revisionLabel} · Storage scope: ${meta.storageMode}.`,
    ],
    [1.0, 0.97, 0.91],
    [0.85, 0.56, 0.08],
    [0.58, 0.34, 0.02]
  )

  // --- 01. EXECUTIVE SCIENTIFIC SUMMARY ---
  doc.drawSectionHeading("01", "Executive Scientific Summary")
  doc.drawKeyValueGrid([
    { label: "Earth Analog Candidate", value: `${s.candidateName} (${s.candidateId})` },
    { label: "Planetary Target", value: `${s.target.name} (${s.target.body.toUpperCase()})` },
    { label: "Mission Profile", value: `${s.missionProfileLabel} (${s.missionProfileId})` },
    {
      label: "Similarity Score / Coverage",
      value: `${s.scoreDisplay}  |  Weighted Coverage: ${
        s.coverage !== null ? formatCoverage(s.coverage) : "Unscored curated archive"
      }`,
    },
    {
      label: "Research Priority",
      value: `${intel.researchPriority.label} (${intel.researchPriority.level})`,
    },
    { label: "Verification Status", value: s.verificationStateSummary },
  ])
  doc.drawParagraph(intel.missionInterpretation, { font: "F1", size: 8.6, gapAfter: 6 })

  // --- 02. GEOGRAPHIC CONTEXT ---
  doc.drawSectionHeading("02", "Geographic & Environmental Context")
  const bboxText = s.coordinates.boundingBox
    ? `[${s.coordinates.boundingBox.map((n) => n.toFixed(4)).join(", ")}] (minLat, minLon, maxLat, maxLon)`
    : "Single site coordinate / not bounded by scan grid box"
  doc.drawKeyValueGrid([
    {
      label: "WGS84 Coordinates",
      value: `${s.coordinates.latitude.toFixed(4)}° lat, ${s.coordinates.longitude.toFixed(4)}° lon`,
    },
    { label: "Bounding Box", value: bboxText },
    {
      label: "Candidate Origin & Novelty Tier",
      value: `${s.candidateSourceKind}  |  Novelty tier: ${s.noveltyTier}`,
    },
    { label: "Geological Setting / Context", value: s.candidate.setting || s.candidate.country || "Not specified" },
  ])
  if (s.candidate.summary) {
    doc.drawParagraph(`Summary: ${s.candidate.summary}`, { size: 8.4, gapAfter: 5 })
  }

  // --- 03. METHODOLOGY & INTERPRETATION RULES ---
  doc.drawSectionHeading("03", "Scientific Methodology & Reliability Safeguards")
  doc.drawBullet(
    "Terrain & Elevation: Copernicus DEM GLO-90 (served via Open-Meteo) with a 5-point central-difference gradient over ~445 m neighbor baseline (polar exclusion |lat| > 89.5 deg)."
  )
  doc.drawBullet(
    "Climatology & Solar Flux: NASA POWER Climatology API v2.10.1 (MERRA-2 0.5x0.625 deg T2M 2m air temperature & diurnal range proxy; CERES SYN1DEG 24h mean solar irradiance)."
  )
  doc.drawBullet(
    "Geology Mapping: Macrostrat v2 geologic polygons mapped conservatively to TerraTwin's 7-class lithology taxonomy; ambiguous mixed/unmapped units stay null."
  )
  doc.drawBullet(
    "Similarity & 40% Gate: Mission-weighted bounded similarity omits missing features (null) from weight normalization without zero-imputation and withholds scores below 40% coverage."
  )
  doc.drawParagraph(intel.presentationThresholdDisclosure, { size: 8.2, color: [0.24, 0.30, 0.40], gapAfter: 6 })

  // --- 04. SCIENTIFIC MEASUREMENTS & SIMILARITY EXPLAINABILITY ---
  doc.drawSectionHeading("04", "Scientific Measurements & Similarity Explainability")
  doc.drawSimilarityBarChart(
    intel.featureExplanations.map((f) => ({
      label: f.shortLabel,
      weightPct: Math.round(f.missionWeight * 100),
      similarityPct: f.similarity !== null ? f.similarity * 100 : null,
      statusLabel: f.comparisonStatus.replace("_", " "),
    }))
  )

  doc.drawTable(
    [
      { label: "Feature", width: 88 },
      { label: "Earth Value", width: 72, font: "F3" },
      { label: "Target Ref", width: 72, font: "F3" },
      { label: "Wt", width: 32, font: "F3" },
      { label: "Match / Status", width: 84 },
      { label: "Evidence / Origin & Source", width: 176 },
    ],
    intel.featureExplanations.map((f) => [
      `${f.shortLabel} (${f.unit || "cat"})`,
      formatFeatureValue(f.key, f.earthValue),
      formatFeatureValue(f.key, f.targetValue),
      `${Math.round(f.missionWeight * 100)}%`,
      f.similarity !== null
        ? `${Math.round(f.similarity * 100)}% (${f.contributionCategory})`
        : f.comparisonStatus.replace("_", " "),
      `${f.evidenceClassification} / ${f.dataOrigin} (${f.verificationState})${
        f.sourceTitle ? ` — ${f.sourceTitle}` : ""
      }`,
    ])
  )

  // --- 05. EVIDENCE QUALITY & PROVENANCE ---
  doc.drawSectionHeading("05", "Evidence Quality & Provenance Summary")
  doc.drawParagraph(intel.evidenceQuality.assessmentSummary, { size: 8.5, gapAfter: 3 })
  doc.drawParagraph(
    `Counts: ${intel.evidenceQuality.comparableCount} comparable, ${intel.evidenceQuality.missingCount} missing, ${intel.evidenceQuality.incompatibleCount} incompatible | Origins: ${intel.evidenceQuality.measuredCount} measured, ${intel.evidenceQuality.derivedCount} derived, ${intel.evidenceQuality.proxyCount} proxy, ${intel.evidenceQuality.independentlyVerifiedCount} verified.`,
    { font: "F3", size: 7.9, gapAfter: 3 }
  )
  doc.drawParagraph(intel.evidenceQuality.distinctionNote, { size: 8.1, color: [0.25, 0.32, 0.42], gapAfter: 4 })
  for (const resNote of intel.evidenceQuality.resolutionNotes) {
    doc.drawBullet(resNote, "F1", 8.1)
  }

  // --- 06. CANDIDATE VALIDATION CHECKLIST ---
  doc.drawSectionHeading("06", "Candidate Validation Checklist")
  doc.drawTable(
    [
      { label: "Check Criterion", width: 145 },
      { label: "Status", width: 82, font: "F3" },
      { label: "Scientific Evidence & Explanation", width: 297 },
    ],
    s.validationChecklist.map((c) => [
      c.label,
      c.status.toUpperCase(),
      c.explanation,
    ])
  )

  // --- 07. RESEARCH PRIORITY & BOUNDED WEIGHT-SENSITIVITY ANALYSIS ---
  doc.drawSectionHeading("07", "Research Priority & Bounded Sensitivity Analysis")
  doc.drawParagraph(`Assigned Priority: ${intel.researchPriority.label}`, { font: "F2", size: 9.0, gapAfter: 3 })
  for (const r of intel.researchPriority.reasons) {
    doc.drawBullet(r, "F1", 8.3)
  }
  doc.drawParagraph(`Recommended Next Action: ${intel.researchPriority.nextAction}`, {
    font: "F2",
    size: 8.4,
    gapAfter: 6,
  })

  if (intel.sensitivityAnalysis.status === "completed" && intel.sensitivityAnalysis.scenarios.length > 0) {
    doc.drawParagraph(
      `Exploratory ±${Math.round(intel.sensitivityAnalysis.perturbationFraction * 100)}% Weight-Sensitivity Exploration (Range: ${
        intel.sensitivityAnalysis.minScore?.toFixed(1) ?? "N/A"
      }% to ${intel.sensitivityAnalysis.maxScore?.toFixed(1) ?? "N/A"}%, Span: ${
        intel.sensitivityAnalysis.scoreSpan?.toFixed(1) ?? "0.0"
      } pts, Set Size: ${intel.sensitivityAnalysis.evaluatedCandidateSetSize}, Rank Order Shift: ${
        intel.sensitivityAnalysis.orderChangedWithinEvaluatedSet ? "YES" : "NO"
      }):`,
      { font: "F2", size: 8.4, gapAfter: 4 }
    )
    doc.drawTable(
      [
        { label: "Scenario", width: 130 },
        { label: "Weight Perturbation", width: 254 },
        { label: "Score", width: 70, font: "F3" },
        { label: "Set Rank", width: 70, font: "F3" },
      ],
      intel.sensitivityAnalysis.scenarios.map((sc) => [
        sc.label,
        sc.perturbationSummary,
        sc.score !== null ? `${sc.score.toFixed(1)}%` : "N/A",
        sc.rankInEvaluatedSet !== null ? `#${sc.rankInEvaluatedSet}` : "Unranked",
      ])
    )
    for (const cav of intel.sensitivityAnalysis.caveats) {
      doc.drawBullet(cav, "F1", 8.0)
    }
  } else {
    doc.drawCalloutBox(
      "SENSITIVITY ANALYSIS STATUS",
      [intel.sensitivityAnalysis.unavailableReason ?? "Sensitivity analysis unavailable for this record."],
      [0.97, 0.97, 0.98],
      [0.75, 0.79, 0.85],
      [0.25, 0.30, 0.38]
    )
  }

  // --- 08. FOLLOW-UP RESEARCH PLAN & USER NOTES ---
  doc.drawSectionHeading("08", "Follow-Up Research Plan & Researcher Notes")
  doc.drawParagraph(
    "Note: Workflow task statuses track operational review only and never mark scientific measurements as independently verified.",
    { size: 8.1, color: [0.32, 0.38, 0.46], gapAfter: 4 }
  )
  if (record.tasks.length > 0) {
    doc.drawTable(
      [
        { label: "Task Title & Evidence Gap", width: 170 },
        { label: "Priority", width: 58, font: "F3" },
        { label: "Workflow Status", width: 92 },
        { label: "Suggested Method & Task Notes", width: 204 },
      ],
      record.tasks.map((t) => [
        `${t.title} [${t.relatedGap}]`,
        t.priority.toUpperCase(),
        `${RESEARCH_TASK_STATUS_LABELS[t.status]} (obs: not verified)`,
        `${t.suggestedObservationMethod}${t.owner ? ` | Owner: ${t.owner}` : ""}${
          t.notes ? ` | Note: ${t.notes}` : ""
        }`,
      ])
    )
  } else {
    doc.drawParagraph("No follow-up tasks generated on this record.", { size: 8.4 })
  }

  if (record.notes.length > 0) {
    doc.drawParagraph("User-Authored Research Notes (Distinguished from Measured Scientific Telemetry):", {
      font: "F2",
      size: 8.5,
      color: [0.58, 0.34, 0.02],
      gapAfter: 4,
    })
    for (const note of record.notes) {
      doc.drawCalloutBox(
        `USER NOTE: ${note.title} (${note.createdAt})`,
        [
          note.body,
          `Feature: ${note.relatedFeature ?? "general"}  |  Role: ${note.authorRole}`,
          ...(note.userSuppliedSourceUrl
            ? [`User-supplied external link (unverified): ${note.userSuppliedSourceUrl}`]
            : []),
        ],
        [1.0, 0.98, 0.94],
        [0.85, 0.65, 0.25],
        [0.52, 0.30, 0.04]
      )
    }
  } else {
    doc.drawParagraph("No user-authored notes attached to this assessment snapshot.", { size: 8.2, gapAfter: 5 })
  }

  // --- 09. PLANETARY SCIENTIFIC LIMITATIONS ---
  doc.drawSectionHeading("09", "Planetary Scientific Limitations")
  for (const lim of s.scientificLimitations) {
    doc.drawBullet(lim, "F1", 8.3)
  }

  // --- 10. SOURCES & REFERENCES ---
  doc.drawSectionHeading("10", "Traceable Sources & References")
  const allRefs = [
    ...s.sourceReferences.map((r) => [
      r.originKind,
      r.title,
      `${r.providerOrOrg}${r.identifierOrVersion ? ` (${r.identifierOrVersion})` : ""}`,
      r.url ?? "URL not provided in source record",
    ]),
    ...record.notes
      .filter((n) => Boolean(n.userSuppliedSourceUrl))
      .map((n) => [
        "user-supplied-reference",
        n.title,
        "User-authored link (NOT independently verified by TerraTwin)",
        n.userSuppliedSourceUrl!,
      ]),
  ]
  if (allRefs.length > 0) {
    doc.drawTable(
      [
        { label: "Origin Kind", width: 88, font: "F3" },
        { label: "Dataset / Literature Title", width: 146 },
        { label: "Provider / Attribution", width: 130 },
        { label: "Source URL / Locator", width: 160, font: "F3" },
      ],
      allRefs
    )
  } else {
    doc.drawParagraph("No external source references were attached to this candidate record.", { size: 8.4 })
  }

  // --- 11. REPRODUCIBILITY MANIFEST ---
  doc.drawSectionHeading("11", "Reproducibility Manifest")
  doc.drawKeyValueGrid([
    { label: "Record / Snapshot ID", value: `${record.recordId}  |  ${s.snapshotId}` },
    { label: "Schema & Report Version", value: `Snapshot v${s.schemaVersion}  |  Report v${meta.reportVersion}` },
    { label: "Snapshot Created / Exported", value: `Created: ${s.createdAt} | PDF Generated: ${exportTime}` },
    { label: "Methodology Version", value: meta.methodologyVersion },
    { label: "Content Integrity Digest", value: s.contentDigest },
    { label: "Dataset Temporal Context", value: meta.datasetTemporalContext.join("; ") },
    { label: "Source Dataset Versions", value: meta.sourceVersions.join("; ") },
    { label: "Storage Scope", value: `${meta.storageMode} — ${meta.storageNotice}` },
  ])
  doc.drawParagraph(`Digest Scope Note: ${s.digestScopeNote}`, { size: 7.9, color: [0.30, 0.36, 0.45] })

  return doc.toPdfBytes({
    title: `${meta.reportTitle} - ${s.candidateName}`,
    author: "TerraTwin Research Workflow (Team HEXARCHY)",
    subject: `Planetary Analog Assessment: ${s.candidateId} vs ${s.target.name} (${s.missionProfileLabel})`,
  })
}
