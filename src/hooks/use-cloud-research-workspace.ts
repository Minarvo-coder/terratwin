"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  loadPendingSyncQueueFromStorage,
  loadResearchRecordsFromStorage,
  loadUserCloudCacheFromStorage,
  savePendingSyncQueueToStorage,
  saveResearchRecordsToStorage,
  saveUserCloudCacheToStorage,
} from "@/lib/terratwin/services/research-snapshot-service"
import type {
  AuthenticatedWorkspaceUser,
  CloudBackendPersistenceMode,
  CloudWorkspaceSyncState,
  PendingWorkspaceSyncOperation,
  ResearchAssessmentRecord,
} from "@/lib/terratwin/types/research-workflow"

export interface UseCloudResearchWorkspaceReturn {
  researchRecords: Record<string, ResearchAssessmentRecord>
  authUser: AuthenticatedWorkspaceUser | null
  syncState: CloudWorkspaceSyncState
  backendMode: CloudBackendPersistenceMode
  pendingQueueCount: number
  unsyncedLocalRecordsCount: number
  lastSyncMessage: string | null
  lastSyncError: string | null
  upsertResearchRecord: (record: ResearchAssessmentRecord) => Promise<void>
  deleteResearchRecord: (contextKey: string) => Promise<void>
  importLocalRecordsToCloud: () => Promise<void>
  retryCloudSync: () => Promise<void>
}

export function useCloudResearchWorkspace(): UseCloudResearchWorkspaceReturn {
  const [researchRecords, setResearchRecords] = useState<
    Record<string, ResearchAssessmentRecord>
  >({})
  const [localOnlyRecords, setLocalOnlyRecords] = useState<
    Record<string, ResearchAssessmentRecord>
  >({})
  const [authUser, setAuthUser] = useState<AuthenticatedWorkspaceUser | null>(null)
  const [syncState, setSyncState] = useState<CloudWorkspaceSyncState>("unauthenticated-local")
  const [backendMode, setBackendMode] =
    useState<CloudBackendPersistenceMode>("browser-local-only")
  const [pendingQueue, setPendingQueue] = useState<PendingWorkspaceSyncOperation[]>([])
  const [lastSyncMessage, setLastSyncMessage] = useState<string | null>(null)
  const [lastSyncError, setLastSyncError] = useState<string | null>(null)

  const flushPendingQueueForUser = useCallback(
    async (
      user: AuthenticatedWorkspaceUser,
      queue: PendingWorkspaceSyncOperation[]
    ): Promise<{
      flushedAll: boolean
      latestRecords?: Record<string, ResearchAssessmentRecord>
      backendMode?: CloudBackendPersistenceMode
      hadConflict?: boolean
    }> => {
      if (queue.length === 0) {
        return { flushedAll: true }
      }

      const remaining: PendingWorkspaceSyncOperation[] = [...queue]
      let latestRecords: Record<string, ResearchAssessmentRecord> | undefined
      let latestMode: CloudBackendPersistenceMode | undefined
      let hadConflict = false

      while (remaining.length > 0) {
        const op = remaining[0]
        try {
          if (op.kind === "upsert" && op.record) {
            const res = await fetch("/api/research-workspace", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ action: "upsert", record: op.record }),
            })
            if (!res.ok) throw new Error(`HTTP ${res.status}`)
            const data = (await res.json()) as {
              records: Record<string, ResearchAssessmentRecord>
              backendMode: CloudBackendPersistenceMode
              hadRevisionConflict?: boolean
            }
            latestRecords = data.records
            latestMode = data.backendMode
            if (data.hadRevisionConflict) hadConflict = true
          } else if (op.kind === "delete") {
            const res = await fetch(
              `/api/research-workspace?contextKey=${encodeURIComponent(op.contextKey)}`,
              { method: "DELETE" }
            )
            if (!res.ok) throw new Error(`HTTP ${res.status}`)
            const data = (await res.json()) as {
              records: Record<string, ResearchAssessmentRecord>
              backendMode: CloudBackendPersistenceMode
            }
            latestRecords = data.records
            latestMode = data.backendMode
          }
          remaining.shift()
        } catch {
          savePendingSyncQueueToStorage(user.id, remaining)
          setPendingQueue(remaining)
          return { flushedAll: false }
        }
      }

      savePendingSyncQueueToStorage(user.id, [])
      setPendingQueue([])
      return {
        flushedAll: true,
        latestRecords,
        backendMode: latestMode,
        hadConflict,
      }
    },
    []
  )

  const refreshWorkspace = useCallback(async () => {
    const storedLocal = loadResearchRecordsFromStorage()
    setLocalOnlyRecords(storedLocal)

    try {
      const res = await fetch("/api/research-workspace", {
        method: "GET",
        cache: "no-store",
      })
      if (!res.ok) {
        throw new Error(`Workspace status check returned HTTP ${res.status}`)
      }
      const data = (await res.json()) as {
        authenticated: boolean
        user: AuthenticatedWorkspaceUser | null
        records: Record<string, ResearchAssessmentRecord>
        backendMode: CloudBackendPersistenceMode
      }

      if (!data.authenticated || !data.user) {
        setAuthUser(null)
        setBackendMode("browser-local-only")
        setSyncState("unauthenticated-local")
        setPendingQueue([])
        setResearchRecords(storedLocal)
        return
      }

      setAuthUser(data.user)
      setBackendMode(data.backendMode)

      const queued = loadPendingSyncQueueFromStorage(data.user.id)
      setPendingQueue(queued)

      if (queued.length > 0) {
        setSyncState("syncing")
        const flushed = await flushPendingQueueForUser(data.user, queued)
        if (flushed.flushedAll && flushed.latestRecords) {
          setResearchRecords(flushed.latestRecords)
          saveUserCloudCacheToStorage(data.user.id, flushed.latestRecords)
          setSyncState(flushed.hadConflict ? "conflict-merged" : "cloud-synced")
          setLastSyncError(null)
          return
        }
      }

      setResearchRecords(data.records)
      saveUserCloudCacheToStorage(data.user.id, data.records)
      setSyncState("cloud-synced")
      setLastSyncError(null)
    } catch {
      // Offline or transient network error on initial load: fall back to user's cached cloud state or local storage
      if (authUser) {
        const cachedUserRecords = loadUserCloudCacheFromStorage(authUser.id)
        if (Object.keys(cachedUserRecords).length > 0) {
          setResearchRecords(cachedUserRecords)
          return
        }
      }
      setResearchRecords(storedLocal)
    }
  }, [authUser, flushPendingQueueForUser])

  useEffect(() => {
    queueMicrotask(() => {
      void refreshWorkspace()
    })
  }, [refreshWorkspace])

  useEffect(() => {
    if (typeof window === "undefined") return
    const handleOnline = () => {
      void refreshWorkspace()
    }
    window.addEventListener("online", handleOnline)
    return () => window.removeEventListener("online", handleOnline)
  }, [refreshWorkspace])

  const upsertResearchRecord = useCallback(
    async (record: ResearchAssessmentRecord) => {
      setLastSyncError(null)

      if (!authUser) {
        setResearchRecords((prev) => {
          const next = { ...prev, [record.contextKey]: record }
          saveResearchRecordsToStorage(next)
          setLocalOnlyRecords(next)
          return next
        })
        setSyncState("unauthenticated-local")
        return
      }

      const ownedRecord: ResearchAssessmentRecord = {
        ...record,
        ownerUserId: authUser.id,
        storageMode: "supabase-cloud-rls-and-local-cache",
      }

      // Immediate optimistic update + local user cache durability
      setResearchRecords((prev) => {
        const next = { ...prev, [ownedRecord.contextKey]: ownedRecord }
        saveUserCloudCacheToStorage(authUser.id, next)
        return next
      })

      const enqueueOffline = (reason: string) => {
        const op: PendingWorkspaceSyncOperation = {
          opId: `op-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          userId: authUser.id,
          kind: "upsert",
          contextKey: ownedRecord.contextKey,
          record: ownedRecord,
          queuedAt: new Date().toISOString(),
        }
        const currentQ = loadPendingSyncQueueFromStorage(authUser.id).filter(
          (item) => item.contextKey !== ownedRecord.contextKey
        )
        const nextQ = [...currentQ, op]
        savePendingSyncQueueToStorage(authUser.id, nextQ)
        setPendingQueue(nextQ)
        setSyncState("offline-queued")
        setLastSyncMessage(
          `Saved to local offline queue (${reason}). Will sync to cloud without overwriting history when connection resumes.`
        )
      }

      if (typeof navigator !== "undefined" && navigator.onLine === false) {
        enqueueOffline("browser offline")
        return
      }

      setSyncState("syncing")
      try {
        const res = await fetch("/api/research-workspace", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ action: "upsert", record: ownedRecord }),
        })
        const data = (await res.json()) as {
          success?: boolean
          records?: Record<string, ResearchAssessmentRecord>
          backendMode?: CloudBackendPersistenceMode
          hadRevisionConflict?: boolean
          error?: { code?: string; message?: string }
        }

        if (!res.ok || !data.records) {
          if (res.status >= 500) {
            enqueueOffline(`server HTTP ${res.status}`)
            return
          }
          setSyncState("sync-error")
          setLastSyncError(
            data.error?.message ?? `Cloud synchronization failed (HTTP ${res.status}).`
          )
          return
        }

        setResearchRecords(data.records)
        saveUserCloudCacheToStorage(authUser.id, data.records)
        if (data.backendMode) setBackendMode(data.backendMode)
        if (data.hadRevisionConflict) {
          setSyncState("conflict-merged")
          setLastSyncMessage(
            "Synchronized with cloud and merged concurrent revisions without overwriting historical snapshots."
          )
        } else {
          setSyncState("cloud-synced")
          setLastSyncMessage(
            `Synchronized snapshot ${ownedRecord.snapshot.snapshotId} to your private cloud workspace.`
          )
        }
      } catch {
        enqueueOffline("network unreachable")
      }
    },
    [authUser]
  )

  const deleteResearchRecord = useCallback(
    async (contextKey: string) => {
      setLastSyncError(null)

      if (!authUser) {
        setResearchRecords((prev) => {
          const next = { ...prev }
          delete next[contextKey]
          saveResearchRecordsToStorage(next)
          setLocalOnlyRecords(next)
          return next
        })
        return
      }

      setResearchRecords((prev) => {
        const next = { ...prev }
        delete next[contextKey]
        saveUserCloudCacheToStorage(authUser.id, next)
        return next
      })

      setSyncState("syncing")
      try {
        const res = await fetch(
          `/api/research-workspace?contextKey=${encodeURIComponent(contextKey)}`,
          { method: "DELETE" }
        )
        const data = (await res.json()) as {
          records?: Record<string, ResearchAssessmentRecord>
          backendMode?: CloudBackendPersistenceMode
        }
        if (res.ok && data.records) {
          setResearchRecords(data.records)
          saveUserCloudCacheToStorage(authUser.id, data.records)
          if (data.backendMode) setBackendMode(data.backendMode)
          setSyncState("cloud-synced")
          setLastSyncMessage("Removed research record from your cloud workspace.")
          return
        }
      } catch {
        const op: PendingWorkspaceSyncOperation = {
          opId: `op-del-${Date.now()}`,
          userId: authUser.id,
          kind: "delete",
          contextKey,
          queuedAt: new Date().toISOString(),
        }
        const nextQ = [...loadPendingSyncQueueFromStorage(authUser.id), op]
        savePendingSyncQueueToStorage(authUser.id, nextQ)
        setPendingQueue(nextQ)
        setSyncState("offline-queued")
      }
    },
    [authUser]
  )

  const unsyncedLocalRecordsCount = useMemo(() => {
    if (!authUser) return 0
    return Object.keys(localOnlyRecords).length
  }, [authUser, localOnlyRecords])

  const importLocalRecordsToCloud = useCallback(async () => {
    if (!authUser) return
    const currentLocal = loadResearchRecordsFromStorage()
    const count = Object.keys(currentLocal).length
    if (count === 0) {
      setLastSyncMessage("No browser-local research records found to import.")
      return
    }

    setSyncState("syncing")
    setLastSyncError(null)
    try {
      const res = await fetch("/api/research-workspace", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "import-local-batch",
          records: currentLocal,
        }),
      })
      const data = (await res.json()) as {
        records?: Record<string, ResearchAssessmentRecord>
        backendMode?: CloudBackendPersistenceMode
        hadRevisionConflict?: boolean
        importedCount?: number
        error?: { message?: string }
      }

      if (!res.ok || !data.records) {
        setSyncState("sync-error")
        setLastSyncError(data.error?.message ?? "Failed to import browser-local records to cloud.")
        return
      }

      setResearchRecords(data.records)
      saveUserCloudCacheToStorage(authUser.id, data.records)
      // Clear legacy anonymous browser localStorage bucket now that all records are safely in user's cloud + user cache
      saveResearchRecordsToStorage({})
      setLocalOnlyRecords({})
      if (data.backendMode) setBackendMode(data.backendMode)
      setSyncState(data.hadRevisionConflict ? "conflict-merged" : "cloud-synced")
      setLastSyncMessage(
        `Safely imported and deduplicated ${data.importedCount ?? count} browser-local record(s) into your cloud workspace.`
      )
    } catch {
      setSyncState("offline-queued")
      setLastSyncError("Network unreachable while importing local records; local data preserved intact.")
    }
  }, [authUser])

  const retryCloudSync = useCallback(async () => {
    await refreshWorkspace()
  }, [refreshWorkspace])

  return {
    researchRecords,
    authUser,
    syncState,
    backendMode,
    pendingQueueCount: pendingQueue.length,
    unsyncedLocalRecordsCount,
    lastSyncMessage,
    lastSyncError,
    upsertResearchRecord,
    deleteResearchRecord,
    importLocalRecordsToCloud,
    retryCloudSync,
  }
}
