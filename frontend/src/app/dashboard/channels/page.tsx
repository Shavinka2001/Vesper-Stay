'use client';

import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Copy,
  Link2,
  Loader2,
  Plus,
  RadioTower,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { AddChannelModal } from '@/components/channels/AddChannelModal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import {
  apiOrigin,
  deleteChannelConnectionRequest,
  fetchChannelConnections,
  getApiErrorMessage,
  syncChannelConnectionRequest,
} from '@/lib/api';
import type { ChannelConnection, ChannelSyncStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

const CHANNEL_LABEL: Record<string, string> = {
  AIRBNB: 'Airbnb',
  BOOKING_COM: 'Booking.com',
  EXPEDIA: 'Expedia',
  ICAL: 'iCal',
  OTHER: 'Other',
};

function statusStyle(status: ChannelSyncStatus): {
  cls: string;
  label: string;
} {
  switch (status) {
    case 'SUCCESS':
      return { cls: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300', label: 'Synced' };
    case 'FAILED':
      return { cls: 'bg-rose-500/15 text-rose-700 dark:text-rose-300', label: 'Failed' };
    case 'SYNCING':
      return { cls: 'bg-amber-500/15 text-amber-700 dark:text-amber-300', label: 'Syncing' };
    default:
      return { cls: 'bg-slate-500/15 text-slate-600 dark:text-slate-300', label: 'Idle' };
  }
}

function formatWhen(iso: string | null): string {
  if (!iso) return 'Never';
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ChannelsPage() {
  const [connections, setConnections] = useState<ChannelConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ChannelConnection | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setConnections(await fetchChannelConnections());
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Unable to load channels'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSync(conn: ChannelConnection) {
    if (!conn.iCalImportUrl) {
      toast.error('Add an import iCal URL first');
      return;
    }
    setSyncingId(conn.id);
    try {
      const result = await syncChannelConnectionRequest(conn.id);
      const parts = [`${result.imported} blocked`];
      if (result.cancelled) parts.push(`${result.cancelled} freed`);
      if (result.failed) parts.push(`${result.failed} conflicts`);
      toast.success(`Sync complete — ${parts.join(', ')}`);
      await load();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Sync failed'));
    } finally {
      setSyncingId(null);
    }
  }

  async function onCopyExport(conn: ChannelConnection) {
    if (!conn.iCalExportUrl) {
      toast.error('Map this channel to a room to get an export link');
      return;
    }
    try {
      await navigator.clipboard.writeText(`${apiOrigin()}${conn.iCalExportUrl}`);
      toast.success('Export link copied — paste it into the OTA');
    } catch {
      toast.error('Could not copy to clipboard');
    }
  }

  async function onDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteChannelConnectionRequest(deleteTarget.id);
      setConnections((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      toast.success('Channel removed');
      setDeleteTarget(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Unable to remove channel'));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
            Channel Manager
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Two-way calendar sync with Airbnb, Booking.com &amp; any iCal OTA.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#D4AF37] px-4 text-sm font-semibold text-slate-950 hover:bg-[#C49F27]"
        >
          <Plus className="h-4 w-4" />
          Connect Channel
        </button>
      </div>

      {/* How it works */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-400">
        <p className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-200">
          <Link2 className="h-3.5 w-3.5 text-[#D4AF37]" />
          How sync works
        </p>
        <p className="mt-1.5 leading-relaxed">
          <strong>Export:</strong> copy your room&apos;s link and paste it into
          the OTA so it blocks your booked dates.{' '}
          <strong>Import:</strong> paste the OTA&apos;s iCal link here, then
          <em> Sync</em> to block those dates in VesperStay — preventing double
          bookings both ways.
        </p>
      </div>

      {loading && connections.length === 0 ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-[#D4AF37]" />
        </div>
      ) : connections.length === 0 ? (
        <div className="flex h-56 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-200 px-6 text-center text-slate-400 dark:border-slate-700">
          <RadioTower className="h-9 w-9 opacity-50" />
          <div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
              No channels connected yet
            </p>
            <p className="mt-1 text-xs">
              Connect Airbnb or Booking.com to keep calendars in sync.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#D4AF37] px-3 text-xs font-semibold text-[#8A7020] dark:text-[#D4AF37]"
          >
            <Plus className="h-3.5 w-3.5" />
            Connect your first channel
          </button>
        </div>
      ) : (
        <div className="grid gap-3">
          {connections.map((conn) => {
            const status = statusStyle(conn.lastSyncStatus);
            const busy = syncingId === conn.id;
            return (
              <div
                key={conn.id}
                className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-[#111726]"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#D4AF37]/15 text-[#8A7020] dark:text-[#D4AF37]">
                        <RadioTower className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-900 dark:text-slate-50">
                          {conn.name}
                        </p>
                        <p className="text-xs text-slate-400">
                          {CHANNEL_LABEL[conn.channelType] ?? conn.channelType}
                          {conn.room ? ` · Room ${conn.room.number}` : ' · No room'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <span
                    className={cn(
                      'inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
                      status.cls,
                    )}
                  >
                    {conn.lastSyncStatus === 'SUCCESS' ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : conn.lastSyncStatus === 'FAILED' ? (
                      <AlertTriangle className="h-3.5 w-3.5" />
                    ) : (
                      <Clock className="h-3.5 w-3.5" />
                    )}
                    {status.label}
                  </span>
                </div>

                <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-500">
                  <div>
                    <dt className="text-slate-400">Last synced</dt>
                    <dd className="text-slate-700 dark:text-slate-300">
                      {formatWhen(conn.lastSyncedAt)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-400">Import feed</dt>
                    <dd className="text-slate-700 dark:text-slate-300">
                      {conn.iCalImportUrl ? 'Configured' : 'Export only'}
                    </dd>
                  </div>
                </dl>

                {conn.lastSyncError ? (
                  <p className="mt-2 rounded-lg bg-rose-500/10 px-3 py-2 text-[11px] text-rose-600 dark:text-rose-300">
                    {conn.lastSyncError}
                  </p>
                ) : null}

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={busy || !conn.iCalImportUrl}
                    onClick={() => void onSync(conn)}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-slate-900 px-3 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                  >
                    {busy ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3.5 w-3.5" />
                    )}
                    Sync now
                  </button>
                  <button
                    type="button"
                    disabled={!conn.iCalExportUrl}
                    onClick={() => void onCopyExport(conn)}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Copy export link
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(conn)}
                    className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-lg border border-rose-200 px-3 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:border-rose-900 dark:hover:bg-rose-950/40"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AddChannelModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreated={() => void load()}
      />

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Remove this channel?"
        description={
          deleteTarget
            ? `"${deleteTarget.name}" will stop syncing. Existing imported blocks stay until you clear them.`
            : ''
        }
        confirmText="Remove channel"
        isDestructive
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void onDelete()}
      />
    </div>
  );
}
