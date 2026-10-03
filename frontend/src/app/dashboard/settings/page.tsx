'use client';

import {
  BedDouble,
  Pencil,
  Plus,
  Trash2,
  Users,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { AddRoomModal } from '@/components/rooms/AddRoomModal';
import { AddRoomTypeModal } from '@/components/rooms/AddRoomTypeModal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { currencySymbol } from '@/components/dashboard/nav-config';
import {
  deleteRoomRequest,
  deleteRoomTypeRequest,
  fetchPhysicalRooms,
  fetchRoomTypes,
  getApiErrorMessage,
  updateRoomStatusRequest,
} from '@/lib/api';
import type { PhysicalRoom, RoomTypeRecord } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';

const STATUS_OPTIONS = [
  { value: 'AVAILABLE', label: 'Available' },
  { value: 'DIRTY', label: 'Dirty' },
  { value: 'OCCUPIED', label: 'Occupied' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
] as const;

type ConfirmState =
  | {
      kind: 'type';
      target: RoomTypeRecord;
    }
  | {
      kind: 'room';
      target: PhysicalRoom;
    }
  | null;

function statusTone(status: string): string {
  switch (status) {
    case 'AVAILABLE':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900';
    case 'DIRTY':
    case 'CLEANING':
      return 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900';
    case 'OCCUPIED':
      return 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-900';
    case 'MAINTENANCE':
    case 'OUT_OF_ORDER':
      return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900';
    default:
      return 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
  }
}

export default function SettingsPage() {
  const property = useAuthStore((s) => s.property);
  const symbol = currencySymbol(property?.currency ?? 'USD');

  const [roomTypes, setRoomTypes] = useState<RoomTypeRecord[]>([]);
  const [rooms, setRooms] = useState<PhysicalRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeModalOpen, setTypeModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<RoomTypeRecord | null>(null);
  const [roomModalOpen, setRoomModalOpen] = useState(false);
  const [confirmState, setConfirmState] = useState<ConfirmState>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [types, physical] = await Promise.all([
        fetchRoomTypes(),
        fetchPhysicalRooms(),
      ]);
      setRoomTypes(types);
      setRooms(physical);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Unable to load inventory'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function executeConfirmedDelete() {
    if (!confirmState) return;

    if (confirmState.kind === 'type') {
      const type = confirmState.target;
      const previous = roomTypes;
      setRoomTypes((list) => list.filter((t) => t.id !== type.id));
      setConfirmState(null);
      try {
        await deleteRoomTypeRequest(type.id);
        toast.success('Room type deleted successfully');
      } catch (err) {
        setRoomTypes(previous);
        toast.error(getApiErrorMessage(err, 'Unable to delete room type'));
      }
      return;
    }

    const room = confirmState.target;
    const previous = rooms;
    setRooms((list) => list.filter((r) => r.id !== room.id));
    setConfirmState(null);
    try {
      await deleteRoomRequest(room.id);
      toast.success('Room deleted successfully');
      const types = await fetchRoomTypes();
      setRoomTypes(types);
    } catch (err) {
      setRooms(previous);
      toast.error(getApiErrorMessage(err, 'Unable to delete room'));
    }
  }

  async function handleStatusChange(roomId: string, status: string) {
    const previous = rooms;
    setRooms((list) =>
      list.map((r) => (r.id === roomId ? { ...r, status } : r)),
    );
    try {
      await updateRoomStatusRequest(roomId, status);
      toast.success('Housekeeping status updated');
    } catch (err) {
      setRooms(previous);
      toast.error(getApiErrorMessage(err, 'Unable to update status'));
    }
  }

  const confirmTitle =
    confirmState?.kind === 'type'
      ? `Delete “${confirmState.target.name}”?`
      : confirmState?.kind === 'room'
        ? `Delete “${confirmState.target.number}”?`
        : '';

  const confirmDescription =
    confirmState?.kind === 'type'
      ? 'All physical rooms must be removed first. This cannot be undone.'
      : confirmState?.kind === 'room'
        ? 'This room will be removed from inventory and the tape chart.'
        : '';

  return (
    <>
      <ConfirmModal
        isOpen={confirmState !== null}
        title={confirmTitle}
        description={confirmDescription}
        confirmText="Delete"
        cancelText="Keep"
        isDestructive
        onCancel={() => setConfirmState(null)}
        onConfirm={executeConfirmedDelete}
      />

      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
              Rooms & Inventory
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Manage room types and physical inventory for{' '}
              {property?.name ?? 'your property'}.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setEditingType(null);
                setTypeModalOpen(true);
              }}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-[#111726] dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <Plus className="h-4 w-4" />
              Add Room Type
            </button>
            <button
              type="button"
              onClick={() => setRoomModalOpen(true)}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-[#D4AF37] px-3.5 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-[#C49F27]"
            >
              <Plus className="h-4 w-4" />
              Add Room / Cabana
            </button>
          </div>
        </div>

        <section>
          <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-50">
            Room types
          </h3>
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-40 animate-pulse rounded-2xl bg-slate-200/70 dark:bg-slate-800"
                />
              ))}
            </div>
          ) : roomTypes.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center dark:border-slate-700 dark:bg-[#111726]">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                No room types yet
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Start by creating Deluxe Villa, Cabana, or Suite categories.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {roomTypes.map((type) => (
                <article
                  key={type.id}
                  className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#111726]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h4 className="truncate text-base font-semibold text-slate-900 dark:text-slate-50">
                        {type.name}
                      </h4>
                      <p className="mt-1 text-sm font-medium text-[#B89428] dark:text-[#D4AF37]">
                        {symbol}
                        {Number(type.baseRate).toLocaleString()}
                        <span className="font-normal text-slate-400">
                          {' '}
                          / night
                        </span>
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        aria-label={`Edit ${type.name}`}
                        onClick={() => {
                          setEditingType(type);
                          setTypeModalOpen(true);
                        }}
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Delete ${type.name}`}
                        onClick={() =>
                          setConfirmState({ kind: 'type', target: type })
                        }
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {type.description ? (
                    <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-500">
                      {type.description}
                    </p>
                  ) : null}

                  <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      Max {type.maxOccupancy} guests
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <BedDouble className="h-3.5 w-3.5" />
                      {type._count?.rooms ?? 0} rooms
                    </span>
                  </div>

                  {type.amenities?.length ? (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {type.amenities.map((amenity) => (
                        <span
                          key={amenity}
                          className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                        >
                          {amenity}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </section>

        <section>
          <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-50">
            Physical rooms
          </h3>
          {loading ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-28 animate-pulse rounded-2xl bg-slate-200/70 dark:bg-slate-800"
                />
              ))}
            </div>
          ) : rooms.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center dark:border-slate-700 dark:bg-[#111726]">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                No physical rooms yet
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Add Villa 101, Cabana 04, and other units to appear on the tape
                chart.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {rooms.map((room) => (
                <article
                  key={room.id}
                  className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-[#111726]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-50">
                        {room.number}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-slate-500">
                        {room.roomTypeName}
                        {room.floor ? ` · ${room.floor}` : ''}
                      </p>
                    </div>
                    <button
                      type="button"
                      aria-label={`Delete ${room.number}`}
                      onClick={() =>
                        setConfirmState({ kind: 'room', target: room })
                      }
                      className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-300"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="mt-3">
                    <label className="sr-only" htmlFor={`status-${room.id}`}>
                      Housekeeping status
                    </label>
                    <select
                      id={`status-${room.id}`}
                      value={
                        room.status === 'CLEANING' ? 'DIRTY' : room.status
                      }
                      onChange={(e) =>
                        void handleStatusChange(room.id, e.target.value)
                      }
                      className={cn(
                        'w-full rounded-lg border px-2.5 py-2 text-xs font-semibold outline-none focus:ring-2 focus:ring-[#D4AF37]',
                        statusTone(room.status),
                      )}
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      <AddRoomTypeModal
        open={typeModalOpen}
        editing={editingType}
        onClose={() => {
          setTypeModalOpen(false);
          setEditingType(null);
        }}
        onSaved={(type, mode) => {
          if (mode === 'create') {
            setRoomTypes((list) =>
              [...list, type].sort((a, b) => a.name.localeCompare(b.name)),
            );
            toast.success(`Created room type “${type.name}”`);
          } else {
            setRoomTypes((list) =>
              list.map((t) => (t.id === type.id ? { ...t, ...type } : t)),
            );
            toast.success(`Updated “${type.name}”`);
          }
          void load();
        }}
      />

      <AddRoomModal
        open={roomModalOpen}
        roomTypes={roomTypes}
        onClose={() => setRoomModalOpen(false)}
        onCreated={() => {
          toast.success('Room added to inventory');
          void load();
        }}
      />
    </>
  );
}
