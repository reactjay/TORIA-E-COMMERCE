import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { saveProduct } from "@/lib/server/admin";
import type { Category, Product, ProductColor } from "@/lib/types";

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function fileToDataUrl(file: File) {
  if (file.size > 2_500_000) throw new Error("Image must be under 2.5MB.");
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function ProductForm({
  product,
  categories,
}: {
  product?: Product;
  categories: Category[];
}) {
  const navigate = useNavigate();
  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [details, setDetails] = useState(product?.details ?? "");
  const [price, setPrice] = useState(String(product?.price ?? ""));
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? categories[0]?.id ?? "");
  const [stock, setStock] = useState(String(product?.stock ?? 10));
  const [sizes, setSizes] = useState((product?.sizes ?? ["XS", "S", "M", "L", "XL"]).join(", "));
  const [colors, setColors] = useState<ProductColor[]>(
    product?.colors ?? [{ name: "Cream", hex: "#F5F0E8" }],
  );
  const [imageUrl, setImageUrl] = useState(product?.imageUrl ?? "");
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [isNew, setIsNew] = useState(product?.isNew ?? false);
  const [isActive, setIsActive] = useState(product?.isActive ?? true);
  const [busy, setBusy] = useState(false);

  async function onImage(file: File | undefined, gallery = false) {
    if (!file) return;
    try {
      const url = await fileToDataUrl(file);
      if (gallery) setImages((imgs) => [...imgs, url]);
      else {
        setImageUrl(url);
        setImages((imgs) => (imgs.length ? imgs : [url]));
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not read image.");
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const saved = await saveProduct({
        data: {
          id: product?.id,
          name,
          slug: slug || slugify(name),
          description,
          details,
          price: Math.round(Number(price) || 0),
          categoryId,
          imageUrl: imageUrl || images[0] || "/images/hero.jpg",
          images: images.length ? images : imageUrl ? [imageUrl] : [],
          stock: Math.max(0, Math.round(Number(stock) || 0)),
          sizes: sizes
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          colors,
          isNew,
          isActive,
        },
      });
      toast.success(product ? "Product updated." : "Product created.");
      await navigate({ to: "/admin/products/$productId", params: { productId: saved.id } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save product.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={(e) => void submit(e)} className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-3">
        <input className="field" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
        <input
          className="field"
          placeholder="Slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          onBlur={() => setSlug((s) => s || slugify(name))}
        />
        <textarea className="field min-h-32" placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} required />
        <textarea className="field min-h-24" placeholder="Details" value={details} onChange={(e) => setDetails(e.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <input className="field" type="number" min={0} placeholder="Price (₦)" value={price} onChange={(e) => setPrice(e.target.value)} required />
          <input className="field" type="number" min={0} placeholder="Stock" value={stock} onChange={(e) => setStock(e.target.value)} />
        </div>
        <select className="field" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <input className="field" placeholder="Sizes (comma separated)" value={sizes} onChange={(e) => setSizes(e.target.value)} />
        <div className="space-y-2">
          <p className="label-caps">Colours</p>
          {colors.map((c, i) => (
            <div key={i} className="flex gap-2">
              <input
                className="field"
                value={c.name}
                onChange={(e) =>
                  setColors((list) => list.map((x, n) => (n === i ? { ...x, name: e.target.value } : x)))
                }
              />
              <input
                className="h-11 w-16 rounded border border-line"
                type="color"
                value={c.hex}
                onChange={(e) =>
                  setColors((list) => list.map((x, n) => (n === i ? { ...x, hex: e.target.value } : x)))
                }
              />
            </div>
          ))}
          <button
            type="button"
            className="text-sm underline"
            onClick={() => setColors((list) => [...list, { name: "New", hex: "#D8C8B5" }])}
          >
            Add colour
          </button>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isNew} onChange={(e) => setIsNew(e.target.checked)} /> New arrival
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} /> Active on storefront
        </label>
      </div>
      <div className="space-y-4">
        <label className="block">
          <span className="label-caps">Primary image</span>
          <input className="mt-2 block w-full text-sm" type="file" accept="image/*" onChange={(e) => void onImage(e.target.files?.[0])} />
        </label>
        {imageUrl ? <img src={imageUrl} alt="" className="aspect-[3/4] w-full max-w-xs object-cover" /> : null}
        <label className="block">
          <span className="label-caps">Gallery images</span>
          <input className="mt-2 block w-full text-sm" type="file" accept="image/*" onChange={(e) => void onImage(e.target.files?.[0], true)} />
        </label>
        <div className="flex flex-wrap gap-2">
          {images.map((src) => (
            <img key={src.slice(0, 40)} src={src} alt="" className="size-20 object-cover" />
          ))}
        </div>
        <button type="submit" className="btn-primary w-full" disabled={busy}>
          {busy ? "Saving…" : product ? "Save changes" : "Create product"}
        </button>
      </div>
    </form>
  );
}
