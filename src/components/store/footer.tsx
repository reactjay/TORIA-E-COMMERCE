import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Mail } from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/store/logo";
import { subscribeNewsletter } from "@/lib/server/catalog";

export function StoreFooter() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await subscribeNewsletter({ data: { email } });
      toast.success("You’re on the list.");
      setEmail("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not subscribe.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <footer className="mt-16 border-t border-line bg-cream pb-24 lg:pb-0">
      <div className="mx-auto grid max-w-[1400px] gap-10 px-6 py-12 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
        <div>
          <Logo />
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted">
            Wear your presence. Contemporary pieces designed for effortless everyday style.
          </p>
        </div>
        <div>
          <p className="label-caps mb-4">Shop</p>
          <ul className="space-y-2 text-sm">
            <li>
              <Link to="/shop" search={{ arrivals: undefined }} className="hover:text-espresso">
                All pieces
              </Link>
            </li>
            <li>
              <Link to="/shop/$category" params={{ category: "dresses" }} className="hover:text-espresso">
                Dresses
              </Link>
            </li>
            <li>
              <Link to="/shop/$category" params={{ category: "tops" }} className="hover:text-espresso">
                Tops
              </Link>
            </li>
            <li>
              <Link to="/shop/$category" params={{ category: "jackets" }} className="hover:text-espresso">
                Jackets
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="label-caps mb-4">Maison</p>
          <ul className="space-y-2 text-sm">
            <li>
              <Link to="/about" className="hover:text-espresso">
                About
              </Link>
            </li>
            <li>
              <Link to="/contact" className="hover:text-espresso">
                Contact
              </Link>
            </li>
            <li>
              <Link to="/account" className="hover:text-espresso">
                Order lookup
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="label-caps mb-4">Atelier notes</p>
          <form onSubmit={onSubmit} className="flex gap-2">
            <input
              className="field h-11"
              type="email"
              required
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button type="submit" className="btn-primary h-11 px-3" disabled={busy} aria-label="Subscribe">
              <Mail className="size-4" />
            </button>
          </form>
        </div>
      </div>
      <div className="border-t border-line px-6 py-5 text-center text-xs text-muted">
        © {new Date().getFullYear()} Elite. All rights reserved.
      </div>
    </footer>
  );
}
