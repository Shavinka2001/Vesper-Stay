'use client';

import {
  ChevronDown,
  KeyRound,
  Loader2,
  MoreHorizontal,
  Plus,
  Shield,
  Trash2,
  UsersRound,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { AddStaffModal } from '@/components/staff/AddStaffModal';
import { formatRoleBadge } from '@/components/dashboard/nav-config';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import {
  deleteStaffMemberRequest,
  fetchStaffMembers,
  getApiErrorMessage,
  resetStaffPasswordRequest,
  toggleStaffStatusRequest,
  updateStaffRoleRequest,
} from '@/lib/api';
import type { StaffAssignableRole, StaffMember } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';

type RoleFilter = 'ALL' | StaffAssignableRole | 'HOTEL_OWNER';

const FILTERS: Array<{ id: RoleFilter; label: string }> = [
  { id: 'ALL', label: 'All Members' },
  { id: 'MANAGER', label: 'Managers' },
  { id: 'FRONT_DESK', label: 'Front Desk' },
  { id: 'HOUSEKEEPING', label: 'Housekeeping' },
];

const ASSIGNABLE: StaffAssignableRole[] = [
  'MANAGER',
  'FRONT_DESK',
  'HOUSEKEEPING',
];

function initials(first: string, last: string): string {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

function roleBadgeClass(role: string): string {
  if (role === 'HOTEL_OWNER' || role === 'SUPER_ADMIN') {
    return 'bg-[#D4AF37]/20 text-[#8A7020] dark:text-[#D4AF37]';
  }
  if (role === 'MANAGER') {
    return 'bg-[#D4AF37]/15 text-[#8A7020] dark:text-[#D4AF37]';
  }
  if (role === 'FRONT_DESK') {
    return 'bg-teal-500/15 text-teal-700 dark:text-teal-300';
  }
  return 'bg-slate-500/15 text-slate-600 dark:text-slate-300';
}

function avatarClass(role: string): string {
  if (role === 'HOTEL_OWNER' || role === 'SUPER_ADMIN' || role === 'MANAGER') {
    return 'bg-[#D4AF37] text-slate-950';
  }
  if (role === 'FRONT_DESK') {
    return 'bg-teal-600 text-white';
  }
  return 'bg-slate-500 text-white';
}

function formatDate(iso: string | null): string {
  if (!iso) return 'Never';
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function generateTempPassword(): string {
  const alphabet =
    'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$';
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  let out = '';
  for (let i = 0; i < bytes.length; i += 1) {
    out += alphabet[bytes[i]! % alphabet.length];
  }
  return `Vs${out}`;
}

export default function StaffPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  const canManage = useMemo(() => {
    const roles = user?.roles ?? [];
    return (
      roles.includes('HOTEL_OWNER') ||
      roles.includes('MANAGER') ||
      roles.includes('SUPER_ADMIN')
    );
  }, [user]);

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<RoleFilter>('ALL');
  const [addOpen, setAddOpen] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<StaffMember | null>(null);
  const [editTarget, setEditTarget] = useState<StaffMember | null>(null);
  const [editRole, setEditRole] = useState<StaffAssignableRole>('FRONT_DESK');
  const [resetTarget, setResetTarget] = useState<StaffMember | null>(null);
  const [resetPassword, setResetPassword] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await fetchStaffMembers();
      setStaff(list);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Unable to load team'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    if (!canManage) {
      router.replace('/dashboard');
      return;
    }
    void load();
  }, [isHydrated, canManage, load, router]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) {
        setMenuOpenId(null);
      }
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const filtered = useMemo(() => {
    if (filter === 'ALL') return staff;
    return staff.filter((m) => m.role === filter);
  }, [staff, filter]);

  async function onToggle(member: StaffMember) {
    if (member.role === 'HOTEL_OWNER') {
      toast.error('Cannot deactivate the hotel owner');
      return;
    }
    try {
      const updated = await toggleStaffStatusRequest(
        member.id,
        !member.isActive,
      );
      setStaff((prev) =>
        prev.map((s) => (s.id === updated.id ? updated : s)),
      );
      toast.success(
        updated.isActive ? 'Access activated' : 'Access deactivated',
      );
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Unable to update status'));
    }
  }

  async function onRemove() {
    if (!removeTarget) return;
    setActionLoading(true);
    try {
      await deleteStaffMemberRequest(removeTarget.id);
      setStaff((prev) => prev.filter((s) => s.id !== removeTarget.id));
      toast.success('Staff access removed');
      setRemoveTarget(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Unable to remove staff'));
    } finally {
      setActionLoading(false);
    }
  }

  async function onSaveRole() {
    if (!editTarget) return;
    setActionLoading(true);
    try {
      const updated = await updateStaffRoleRequest(editTarget.id, {
        role: editRole,
      });
      setStaff((prev) =>
        prev.map((s) => (s.id === updated.id ? updated : s)),
      );
      toast.success('Role updated');
      setEditTarget(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Unable to update role'));
    } finally {
      setActionLoading(false);
    }
  }

  async function onResetPassword() {
    if (!resetTarget || resetPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setActionLoading(true);
    try {
      await resetStaffPasswordRequest(resetTarget.id, {
        password: resetPassword,
      });
      toast.success('Temporary password reset');
      setResetTarget(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Unable to reset password'));
    } finally {
      setActionLoading(false);
    }
  }

  if (!isHydrated || !canManage) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
            Team & Access Control
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Invite staff, assign roles, and control who can sign in to this
            property.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#D4AF37] px-4 text-sm font-semibold text-slate-950 hover:bg-[#C49F27]"
        >
          <Plus className="h-4 w-4" />
          Add Team Member
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={cn(
              'h-9 rounded-lg border px-3 text-xs font-semibold transition',
              filter === f.id
                ? 'border-[#D4AF37] bg-[#D4AF37]/15 text-[#8A7020] dark:text-[#D4AF37]'
                : 'border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-900',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading && staff.length === 0 ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-[#D4AF37]" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex h-48 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 text-slate-400 dark:border-slate-700">
          <UsersRound className="h-8 w-8 opacity-50" />
          <p className="text-sm">No team members in this filter</p>
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="grid gap-3 md:hidden">
            {filtered.map((member) => (
              <StaffCard
                key={member.id}
                member={member}
                currentUserId={user?.id}
                onToggle={() => void onToggle(member)}
                onEditRole={() => {
                  if (member.role === 'HOTEL_OWNER') return;
                  setEditRole(
                    ASSIGNABLE.includes(member.role as StaffAssignableRole)
                      ? (member.role as StaffAssignableRole)
                      : 'FRONT_DESK',
                  );
                  setEditTarget(member);
                }}
                onResetPassword={() => {
                  setResetPassword(generateTempPassword());
                  setResetTarget(member);
                }}
                onRemove={() => setRemoveTarget(member)}
              />
            ))}
          </div>

          {/* Desktop list */}
          <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white md:block dark:border-slate-800 dark:bg-[#111726]">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-900/60">
                <tr>
                  <th className="px-4 py-3">Member</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((member) => {
                  const isOwner = member.role === 'HOTEL_OWNER';
                  const isSelf = member.id === user?.id;
                  return (
                    <tr
                      key={member.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span
                            className={cn(
                              'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                              avatarClass(member.role),
                            )}
                          >
                            {initials(member.firstName, member.lastName)}
                          </span>
                          <div className="min-w-0">
                            <p className="font-medium text-slate-900 dark:text-slate-50">
                              {member.firstName} {member.lastName}
                            </p>
                            <p className="truncate text-xs text-slate-400">
                              {member.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                            roleBadgeClass(member.role),
                          )}
                        >
                          {formatRoleBadge(member.role)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {member.phone ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {formatDate(member.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          disabled={isOwner}
                          onClick={() => void onToggle(member)}
                          className={cn(
                            'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition',
                            member.isActive
                              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                              : 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
                            isOwner && 'cursor-not-allowed opacity-70',
                          )}
                        >
                          <span
                            className={cn(
                              'h-1.5 w-1.5 rounded-full',
                              member.isActive ? 'bg-emerald-500' : 'bg-rose-500',
                            )}
                          />
                          {member.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="relative px-4 py-3 text-right">
                        {isOwner || isSelf ? (
                          <span className="text-xs text-slate-400">—</span>
                        ) : (
                          <div
                            className="relative inline-block"
                            ref={menuOpenId === member.id ? menuRef : undefined}
                          >
                            <button
                              type="button"
                              onClick={() =>
                                setMenuOpenId((id) =>
                                  id === member.id ? null : member.id,
                                )
                              }
                              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                            {menuOpenId === member.id ? (
                              <div className="absolute right-0 z-20 mt-1 w-48 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-[#0B0F17]">
                                <button
                                  type="button"
                                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-900"
                                  onClick={() => {
                                    setMenuOpenId(null);
                                    setEditRole(
                                      ASSIGNABLE.includes(
                                        member.role as StaffAssignableRole,
                                      )
                                        ? (member.role as StaffAssignableRole)
                                        : 'FRONT_DESK',
                                    );
                                    setEditTarget(member);
                                  }}
                                >
                                  <Shield className="h-3.5 w-3.5" />
                                  Edit Role
                                </button>
                                <button
                                  type="button"
                                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-900"
                                  onClick={() => {
                                    setMenuOpenId(null);
                                    setResetPassword(generateTempPassword());
                                    setResetTarget(member);
                                  }}
                                >
                                  <KeyRound className="h-3.5 w-3.5" />
                                  Reset Password
                                </button>
                                <button
                                  type="button"
                                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
                                  onClick={() => {
                                    setMenuOpenId(null);
                                    setRemoveTarget(member);
                                  }}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  Remove Access
                                </button>
                              </div>
                            ) : null}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      <AddStaffModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreated={() => void load()}
      />

      <ConfirmModal
        isOpen={!!removeTarget}
        title="Remove staff access?"
        description={
          removeTarget
            ? `${removeTarget.firstName} ${removeTarget.lastName} will lose access to this property immediately.`
            : ''
        }
        confirmText="Remove Access"
        isDestructive
        onCancel={() => setRemoveTarget(null)}
        onConfirm={() => onRemove()}
      />

      {/* Edit role */}
      {editTarget ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close"
            className="absolute inset-0 bg-slate-950/55"
            onClick={() => setEditTarget(null)}
          />
          <div className="relative z-10 w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-[#111726]">
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50">
              Edit role
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              {editTarget.firstName} {editTarget.lastName}
            </p>
            <div className="mt-4 space-y-2">
              {ASSIGNABLE.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setEditRole(r)}
                  className={cn(
                    'flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-sm transition',
                    editRole === r
                      ? 'border-[#D4AF37] bg-[#D4AF37]/10'
                      : 'border-slate-200 dark:border-slate-700',
                  )}
                >
                  {formatRoleBadge(r)}
                  {editRole === r ? (
                    <ChevronDown className="h-4 w-4 rotate-180 text-[#D4AF37]" />
                  ) : null}
                </button>
              ))}
            </div>
            <button
              type="button"
              disabled={actionLoading}
              onClick={() => void onSaveRole()}
              className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#D4AF37] text-sm font-semibold text-slate-950 disabled:opacity-60"
            >
              {actionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              Save role
            </button>
          </div>
        </div>
      ) : null}

      {/* Reset password */}
      {resetTarget ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close"
            className="absolute inset-0 bg-slate-950/55"
            onClick={() => setResetTarget(null)}
          />
          <div className="relative z-10 w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-[#111726]">
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50">
              Reset password
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Temporary password for {resetTarget.firstName}{' '}
              {resetTarget.lastName}
            </p>
            <div className="mt-4 flex gap-2">
              <input
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
                className="h-10 flex-1 rounded-lg border border-slate-300 bg-transparent px-3 font-mono text-xs outline-none focus:ring-2 focus:ring-[#D4AF37] dark:border-slate-700"
              />
              <button
                type="button"
                onClick={() => setResetPassword(generateTempPassword())}
                className="h-10 rounded-lg border border-slate-300 px-3 text-xs font-semibold dark:border-slate-700"
              >
                Generate
              </button>
            </div>
            <button
              type="button"
              disabled={actionLoading}
              onClick={() => void onResetPassword()}
              className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-slate-900 text-sm font-semibold text-white dark:bg-white dark:text-slate-950 disabled:opacity-60"
            >
              {actionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              Save password
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

type StaffCardProps = {
  member: StaffMember;
  currentUserId?: string;
  onToggle: () => void;
  onEditRole: () => void;
  onResetPassword: () => void;
  onRemove: () => void;
};

function StaffCard({
  member,
  currentUserId,
  onToggle,
  onEditRole,
  onResetPassword,
  onRemove,
}: StaffCardProps) {
  const isOwner = member.role === 'HOTEL_OWNER';
  const isSelf = member.id === currentUserId;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-[#111726]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold',
              avatarClass(member.role),
            )}
          >
            {initials(member.firstName, member.lastName)}
          </span>
          <div>
            <p className="font-medium text-slate-900 dark:text-slate-50">
              {member.firstName} {member.lastName}
            </p>
            <p className="text-xs text-slate-400">{member.email}</p>
          </div>
        </div>
        <span
          className={cn(
            'rounded-md px-2 py-0.5 text-[10px] font-bold uppercase',
            roleBadgeClass(member.role),
          )}
        >
          {formatRoleBadge(member.role)}
        </span>
      </div>
      <dl className="mt-3 space-y-1 text-xs text-slate-500">
        <div className="flex justify-between">
          <dt>Phone</dt>
          <dd className="text-slate-700 dark:text-slate-300">
            {member.phone ?? '—'}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt>Created</dt>
          <dd>{formatDate(member.createdAt)}</dd>
        </div>
      </dl>
      <div className="mt-3 flex items-center justify-between gap-2">
        <button
          type="button"
          disabled={isOwner}
          onClick={onToggle}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
            member.isActive
              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
              : 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
            isOwner && 'opacity-70',
          )}
        >
          <span
            className={cn(
              'h-1.5 w-1.5 rounded-full',
              member.isActive ? 'bg-emerald-500' : 'bg-rose-500',
            )}
          />
          {member.isActive ? 'Active' : 'Inactive'}
        </button>
        {!isOwner && !isSelf ? (
          <div className="flex gap-1">
            <button
              type="button"
              onClick={onEditRole}
              className="rounded-lg border border-slate-200 px-2 py-1 text-[10px] font-semibold dark:border-slate-700"
            >
              Role
            </button>
            <button
              type="button"
              onClick={onResetPassword}
              className="rounded-lg border border-slate-200 px-2 py-1 text-[10px] font-semibold dark:border-slate-700"
            >
              Password
            </button>
            <button
              type="button"
              onClick={onRemove}
              className="rounded-lg border border-rose-200 px-2 py-1 text-[10px] font-semibold text-rose-600 dark:border-rose-900"
            >
              Remove
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
