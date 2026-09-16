import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { AdminGuard } from "@/components/admin/guard";
import { AdminShell } from "@/components/admin/admin-shell";
import { getStoreSettings } from "@/lib/server/catalog";
import { saveSettings } from "@/lib/server/admin";

export const Route = createFileRoute("/admin/settings")({
  component: () => (
    <AdminGuard>
      <SettingsPage />
    </AdminGuard>
  ),
});

function SettingsPage() {
  const [form, setForm] = useState({
    bankName: "",
    accountName: "",
    accountNumber: "",
    deliveryFee: 5000,
    storeEmail: "",
    storePhone: "",
    storeAddress: "",
  });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void getStoreSettings().then((s) => {
      setForm({
        bankName: s.bankName,
        accountName: s.accountName,
        accountNumber: s.accountNumber,
        deliveryFee: s.deliveryFee,
        storeEmail: s.storeEmail,
        storePhone: s.storePhone,
        storeAddress: s.storeAddress,
      });
      setReady(true);
    });
  }, []);

  return (
    <AdminShell title="Settings" subtitle="Bank details, delivery and atelier contact.">
      {!ready ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : (
        <form
          className="max-w-xl space-y-3 rounded-2xl border border-line bg-ivory p-6"
          onSubmit={(e) => {
            e.preventDefault();
            void saveSettings({ data: form })
              .then(() => toast.success("Settings saved."))
              .catch((err) => toast.error(err instanceof Error ? err.message : "Could not save."));
          }}
        >
          <input className="field" placeholder="Bank name" value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} />
          <input className="field" placeholder="Account name" value={form.accountName} onChange={(e) => setForm({ ...form, accountName: e.target.value })} />
          <input className="field" placeholder="Account number" value={form.accountNumber} onChange={(e) => setForm({ ...form, accountNumber: e.target.value })} />
          <input
            className="field"
            type="number"
            min={0}
            placeholder="Delivery fee"
            value={form.deliveryFee}
            onChange={(e) => setForm({ ...form, deliveryFee: Number(e.target.value) })}
          />
          <input className="field" placeholder="Store email" value={form.storeEmail} onChange={(e) => setForm({ ...form, storeEmail: e.target.value })} />
          <input className="field" placeholder="Store phone" value={form.storePhone} onChange={(e) => setForm({ ...form, storePhone: e.target.value })} />
          <input className="field" placeholder="Store address" value={form.storeAddress} onChange={(e) => setForm({ ...form, storeAddress: e.target.value })} />
          <button type="submit" className="btn-primary w-full">
            Save settings
          </button>
        </form>
      )}
    </AdminShell>
  );
}
