import { NextResponse, type NextRequest } from "next/server"
import { getAuthenticatedWorkspaceUser } from "@/utils/supabase/workspace-auth"
import {
  CloudResearchWorkspaceService,
  ImmutableRevisionError,
  RlsSecurityError,
} from "@/lib/terratwin/services/cloud-research-workspace-service"
import type { ResearchAssessmentRecord } from "@/lib/terratwin/types/research-workflow"

export async function GET(request: NextRequest) {
  try {
    const { user, supabase } = await getAuthenticatedWorkspaceUser()
    const requireAuth = request.nextUrl.searchParams.get("requireAuth") === "1"

    if (!user) {
      if (requireAuth) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "UNAUTHENTICATED",
              message: "Authentication required to read cloud research workspace records.",
            },
          },
          { status: 401 }
        )
      }
      return NextResponse.json(
        {
          success: true,
          authenticated: false,
          user: null,
          records: {},
          backendMode: "browser-local-only",
        },
        { status: 200 }
      )
    }

    const service = new CloudResearchWorkspaceService({ supabase })
    const result = await service.listRecords(user)

    return NextResponse.json(
      {
        success: true,
        authenticated: true,
        user: {
          id: user.id,
          email: user.email,
          authProvider: user.authProvider,
        },
        records: result.records,
        backendMode: result.backendMode,
      },
      { status: 200 }
    )
  } catch (err) {
    if (err instanceof RlsSecurityError) {
      return NextResponse.json(
        {
          success: false,
          error: { code: err.code, message: err.message },
        },
        { status: err.statusCode }
      )
    }
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "WORKSPACE_FETCH_FAILED",
          message: err instanceof Error ? err.message : "Failed to load cloud research workspace.",
        },
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, supabase } = await getAuthenticatedWorkspaceUser()
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHENTICATED",
            message: "Authentication required to write cloud research workspace records.",
          },
        },
        { status: 401 }
      )
    }

    const body = (await request.json()) as {
      action?: "upsert" | "import-local-batch"
      record?: ResearchAssessmentRecord
      records?: Record<string, ResearchAssessmentRecord> | ResearchAssessmentRecord[]
    }

    const service = new CloudResearchWorkspaceService({ supabase })

    if (body.action === "import-local-batch") {
      if (!body.records || typeof body.records !== "object") {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "VALIDATION_ERROR",
              message: "import-local-batch requires a records collection.",
            },
          },
          { status: 400 }
        )
      }
      const res = await service.importLocalRecordsBatch(user, body.records)
      return NextResponse.json(
        {
          success: true,
          authenticated: true,
          user,
          records: res.records,
          backendMode: res.backendMode,
          hadRevisionConflict: res.hadRevisionConflict ?? false,
          importedCount: res.importedCount ?? 0,
        },
        { status: 200 }
      )
    }

    const recordPayload = body.record ?? (body as unknown as ResearchAssessmentRecord)
    if (!recordPayload || typeof recordPayload !== "object" || !recordPayload.recordId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Request body must provide a valid ResearchAssessmentRecord.",
          },
        },
        { status: 400 }
      )
    }

    const res = await service.upsertRecord(user, recordPayload)
    return NextResponse.json(
      {
        success: true,
        authenticated: true,
        user,
        records: res.records,
        backendMode: res.backendMode,
        hadRevisionConflict: res.hadRevisionConflict ?? false,
      },
      { status: 200 }
    )
  } catch (err) {
    if (err instanceof RlsSecurityError) {
      return NextResponse.json(
        {
          success: false,
          error: { code: err.code, message: err.message },
        },
        { status: err.statusCode }
      )
    }
    if (err instanceof ImmutableRevisionError) {
      return NextResponse.json(
        {
          success: false,
          error: { code: err.code, message: err.message },
        },
        { status: err.statusCode }
      )
    }
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "VALIDATION_OR_SYNC_ERROR",
          message: err instanceof Error ? err.message : "Failed to synchronize research record.",
        },
      },
      { status: 400 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { user, supabase } = await getAuthenticatedWorkspaceUser()
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHENTICATED",
            message: "Authentication required to delete cloud research workspace records.",
          },
        },
        { status: 401 }
      )
    }

    let contextKey = request.nextUrl.searchParams.get("contextKey") ?? ""
    let ownerUserId = request.nextUrl.searchParams.get("ownerUserId") ?? undefined

    if (!contextKey) {
      try {
        const body = (await request.json()) as { contextKey?: string; ownerUserId?: string }
        contextKey = body.contextKey ?? ""
        ownerUserId = body.ownerUserId
      } catch {
        // Ignore empty body
      }
    }

    if (!contextKey) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "contextKey is required to delete a research record.",
          },
        },
        { status: 400 }
      )
    }

    const service = new CloudResearchWorkspaceService({ supabase })
    const res = await service.deleteRecord(user, { contextKey, ownerUserId })

    return NextResponse.json(
      {
        success: true,
        authenticated: true,
        user,
        records: res.records,
        backendMode: res.backendMode,
      },
      { status: 200 }
    )
  } catch (err) {
    if (err instanceof RlsSecurityError) {
      return NextResponse.json(
        {
          success: false,
          error: { code: err.code, message: err.message },
        },
        { status: err.statusCode }
      )
    }
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "WORKSPACE_DELETE_FAILED",
          message: err instanceof Error ? err.message : "Failed to delete research record.",
        },
      },
      { status: 500 }
    )
  }
}
