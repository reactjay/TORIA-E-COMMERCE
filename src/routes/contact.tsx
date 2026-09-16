import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { StoreShell } from "@/components/store/store-shell";
import { getStoreSettings, listCategories, listProducts } from "@/lib/server/catalog";

export const Route = createFileRoute("/contact")({
  loader: async () => {
    const [categories, products, settings] = await Promise.all([
      listCategories(),
      listProducts({ data: {} }),
      getStoreSettings(),
    ]);
    return { categories, products, settings };
  },
  component: ContactPage,
});

function ContactPage() {
  const { categories, products, settings } = Route.useLoaderData();
  return (
    <StoreShell categories={categories} products={products}>
      <div className="mx-auto grid max-w-5xl gap-10 px-6 py-16 lg:grid-cols-2">
        <div>
          <p className="label-caps">Contact</p>
          <h1 className="mt-3 font-display text-5xl text-espresso">The atelier is listening.</h1>
          <ul className="mt-8 space-y-3 text-sm">
            <li>{settings.storeEmail}</li>
            <li>{settings.storePhone}</li>
            <li>{settings.storeAddress}</li>
          </ul>
        </div>
        <form
          className="space-y-3 rounded-[22px] border border-line bg-ivory p-6"
          onSubmit={(e) => {
            e.preventDefault();
            toast.success("Message received. We’ll reply shortly.");
            (e.currentTarget as HTMLFormElement).reset();
          }}
        >
          <input className="field" name="name" required placeholder="Full name" />
          <input className="field" name="email" type="email" required placeholder="Email" />
          <textarea className="field min-h-32" name="message" required placeholder="How can we help?" />
          <button type="submit" className="btn-primary w-full">
            Send
          </button>
        </form>
      </div>
    </StoreShell>
  );
}
