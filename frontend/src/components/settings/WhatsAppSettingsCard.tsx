'use client';

import { Loader2, MessageCircle, ShieldCheck, TriangleAlert } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  fetchWhatsAppConfig,
  getApiErrorMessage,
  updateWhatsAppConfigRequest,
} from '@/lib/api';
import type { WhatsAppConfig } from '@/lib/types';
import { cn } from '@/lib/utils';

export function WhatsAppSettingsCard() {
  const [config, setConfig] = useState<WhatsAppConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [phoneNumberId, setPhoneNumberId] = useState('');
  const [accessToken, setAccessToken] = useState('');

  useEffect(() => {
    fetchWhatsAppConfig()
      .then((cfg) => {
        setConfig(cfg);
        setEnabled(cfg.enabled);
        setPhoneNumberId(cfg.phoneNumberId ?? '');
      })
      .catch((err) =>
        toast.error(getApiErrorMessage(err, 'Unable to load WhatsApp config')),
      )
      .finally(() => setLoading(false));
  }, []);

  async function onSave() {
    setSaving(true);
    try {
      const updated = await updateWhatsAppConfigRequest({
        enabled,
        phoneNumberId: phoneNumberId.trim(),
        // Only send the token if the user typed a new one.
        accessToken: accessToken.trim() || undefined,
      });
      setConfig(updated);
      setEnabled(updated.enabled);
      setPhoneNumberId(updated.phoneNumberId ?? '');
      setAccessToken('');
      toast.success('WhatsApp settings saved');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Unable to save WhatsApp settings'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section>
      <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-50">
        Guest messaging (WhatsApp)
      </h3>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#111726]">
        {loading ? (
          <div className="flex h-24 items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-[#D4AF37]" />
          </div>
        ) : (
          <>
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-300">
                <MessageCircle className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-50">
                  Auto-send welcome &amp; folio messages
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Connect your WhatsApp Cloud API number. Without it, the app
                  still prepares a free click-to-send wa.me link.
                </p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                />
                <span className="h-6 w-11 rounded-full bg-slate-300 after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-[#D4AF37] peer-checked:after:translate-x-5 dark:bg-slate-700" />
              </label>
            </div>

            {config && !config.encryptionAvailable ? (
              <p className="mt-4 flex items-start gap-2 rounded-lg bg-amber-500/10 px-3 py-2 text-[11px] text-amber-700 dark:text-amber-300">
                <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Server encryption key (CREDENTIALS_ENC_KEY) isn&apos;t set, so the
                token can&apos;t be stored securely yet. Ask your admin to set it.
              </p>
            ) : null}

            <div className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Phone Number ID
                </label>
                <input
                  value={phoneNumberId}
                  onChange={(e) => setPhoneNumberId(e.target.value)}
                  placeholder="e.g. 123456789012345"
                  className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 bg-transparent px-3 text-sm outline-none focus:ring-2 focus:ring-[#D4AF37] dark:border-slate-700"
                />
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Access token
                  {config?.hasToken ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-300">
                      <ShieldCheck className="h-3 w-3" />
                      saved
                    </span>
                  ) : null}
                </label>
                <input
                  type="password"
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  placeholder={
                    config?.hasToken ? '•••••••• (leave blank to keep)' : 'Paste token'
                  }
                  className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 bg-transparent px-3 font-mono text-xs outline-none focus:ring-2 focus:ring-[#D4AF37] dark:border-slate-700"
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  Stored encrypted (AES-256-GCM); never shown again. Start free
                  with Meta&apos;s test number &amp; temporary token.
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={saving}
              onClick={() => void onSave()}
              className={cn(
                'mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#D4AF37] px-4 text-sm font-semibold text-slate-950 hover:bg-[#C49F27] disabled:opacity-60',
              )}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save WhatsApp settings
            </button>
          </>
        )}
      </div>
    </section>
  );
}
