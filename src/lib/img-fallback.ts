export const FALLBACK_IMG = "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=400&h=500&fit=crop";

export const onImgError: React.ReactEventHandler<HTMLImageElement> = (e) => {
  const el = e.currentTarget;
  if (el.dataset.fallback === "1") return;
  el.dataset.fallback = "1";
  el.src = FALLBACK_IMG;
};
