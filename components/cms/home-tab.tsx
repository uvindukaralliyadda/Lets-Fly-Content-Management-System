"use client";

import { useEffect, useState, type ReactNode } from "react";

type HeroKind = "desktop" | "mobile";

interface HeroSlide {
  id: string;
  title: string;
  link: string;
  active: boolean;
  desktop: string;
  mobile: string;
}

interface HeroError {
  [key: string]: string;
}

const HERO_KEY = "lf_hero_slides";
const HERO_MAX = 10;
const HERO_SPECS: Record<HeroKind, { width: number; height: number; label: string }> = {
  desktop: { width: 1920, height: 800, label: "Desktop" },
  mobile: { width: 750, height: 1000, label: "Mobile" },
};

const stats = [
  { label: "Travel Packages", value: 24, icon: "outbound", style: "home-stat-blue", trend: "+3", foot: "Outbound & Sri Lanka" },
  { label: "Projects", value: 12, icon: "projects", style: "home-stat-purple", trend: "+1", foot: "Active this quarter" },
  { label: "Hotels", value: 38, icon: "hotels", style: "home-stat-green", trend: "+5", foot: "Partner properties" },
  { label: "Gallery Images", value: 246, icon: "gallery", style: "home-stat-orange", trend: "+18", foot: "Across all albums" },
];

const quickLinks = [
  { id: "outbound", title: "Outbound Travels", description: "International tour packages", icon: "outbound" },
  { id: "srilanka", title: "Travel Sri Lanka", description: "Local tours and experiences", icon: "srilanka" },
  { id: "hotels", title: "Hotel Bookings", description: "Hotel listings and rates", icon: "hotels" },
  { id: "gallery", title: "Gallery", description: "Photos and albums", icon: "gallery" },
];

const icons: Record<string, ReactNode> = {
  outbound: <><path d="M2 22h20" /><path d="M6.4 17.4 3 13l2-1 3 2 4-2.5L6 6l2.5-1 8 4 3.6-2a2 2 0 0 1 2 3.4L9 17.4z" /></>,
  projects: <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />,
  hotels: <><path d="M3 21h18M5 21V7l7-4 7 4v14" /><path d="M9 9h1M14 9h1M9 13h1M14 13h1M10 21v-4h4v4" /></>,
  gallery: <><rect height="18" rx="2" width="18" x="3" y="3" /><circle cx="9" cy="9" r="2" /><path d="m21 15-5-5L5 21" /></>,
  srilanka: <><path d="M12 3c2.5 0 5 2.6 5 7 0 5-2.7 11-5 11s-5-6-5-11c0-4.4 2.5-7 5-7z" /><circle cx="12" cy="10" r="2" /></>,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  up: <path d="m7 17 10-10M8 7h9v9" />,
};

function HomeIcon({ name, size = 20 }: { name: string; size?: number }) {
  return (
    <svg aria-hidden="true" fill="none" height={size} viewBox="0 0 24 24" width={size} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
      {icons[name]}
    </svg>
  );
}

function makeSlideId() {
  return `hs${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

function loadSlides(): HeroSlide[] {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(HERO_KEY) ?? "[]");
    return Array.isArray(saved) ? (saved as HeroSlide[]) : [];
  } catch {
    return [];
  }
}

function readHeroFile(file: File, kind: HeroKind): Promise<{ src?: string; error?: string }> {
  const spec = HERO_SPECS[kind];
  if (!/\.webp$/i.test(file.name) || file.type !== "image/webp") {
    return Promise.resolve({ error: "Only WebP (.webp) files are accepted." });
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onerror = () => resolve({ error: "Could not read the file." });
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        resolve({ error: "Could not read the file." });
        return;
      }
      const image = new Image();
      image.onerror = () => resolve({ error: "This file is not a valid WebP image." });
      image.onload = () => {
        if (image.naturalWidth === spec.width && image.naturalHeight === spec.height) {
          resolve({ src: reader.result as string });
          return;
        }
        resolve({
          error: `Image is ${image.naturalWidth} × ${image.naturalHeight} px. ${spec.label} banners must be exactly ${spec.width} × ${spec.height} px.`,
        });
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

export default function HomeTab({ onNavigate }: { onNavigate: (section: string) => void }) {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [errors, setErrors] = useState<HeroError>({});
  const [dirty, setDirty] = useState(false);
  const [notice, setNotice] = useState("");
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setSlides(loadSlides());
    setNow(new Date());
  }, []);

  function updateSlide(id: string, field: keyof HeroSlide, value: string | boolean) {
    setSlides((current) => current.map((slide) => slide.id === id ? { ...slide, [field]: value } : slide));
    setDirty(true);
  }

  function addSlide() {
    if (slides.length >= HERO_MAX) return;
    setSlides((current) => [...current, {
      id: makeSlideId(),
      title: "",
      link: "",
      active: true,
      desktop: "",
      mobile: "",
    }]);
    setDirty(true);
  }

  function moveSlide(index: number, offset: -1 | 1) {
    const target = index + offset;
    if (target < 0 || target >= slides.length) return;
    setSlides((current) => {
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    setDirty(true);
  }

  function deleteSlide(id: string) {
    if (!window.confirm("Delete this slot and its images?")) return;
    setSlides((current) => current.filter((slide) => slide.id !== id));
    setErrors((current) => {
      const next = { ...current };
      delete next[`${id}:desktop`];
      delete next[`${id}:mobile`];
      return next;
    });
    setDirty(true);
  }

  async function uploadImage(id: string, kind: HeroKind, file?: File) {
    if (!file) return;
    const key = `${id}:${kind}`;
    const result = await readHeroFile(file, kind);
    if (result.error) {
      setErrors((current) => ({ ...current, [key]: result.error ?? "" }));
      return;
    }
    setErrors((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
    updateSlide(id, kind, result.src ?? "");
  }

  function removeImage(id: string, kind: HeroKind) {
    setErrors((current) => {
      const next = { ...current };
      delete next[`${id}:${kind}`];
      return next;
    });
    updateSlide(id, kind, "");
  }

  function saveSlides() {
    const incomplete = slides.findIndex((slide) => slide.active && (!slide.desktop || !slide.mobile));
    if (incomplete >= 0) {
      setNotice(`Slot ${incomplete + 1} needs both desktop and mobile images (or hide it).`);
      return;
    }
    try {
      localStorage.setItem(HERO_KEY, JSON.stringify(slides));
    } catch {
      setNotice("Could not save: browser storage is full. Remove some images.");
      return;
    }
    setDirty(false);
    setNotice("Hero slider saved");
  }

  const date = now?.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }) ?? "";
  const hour = now?.getHours() ?? 0;
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="cms-home">
      <section className="home-hero card" aria-label="Hero slider">
        <div className="home-card-heading">
          <div>
            <h2>Hero Slider</h2>
            <p>Banners shown at the top of the website home page. Add as many slots as you need (up to {HERO_MAX}); each slot needs a desktop and a mobile image.</p>
          </div>
        </div>
        <div className="home-hero-spec">
          <span>Desktop: <b>1920 × 800 px</b></span>
          <span>Mobile: <b>750 × 1000 px</b></span>
          <span>Format: <b>WebP</b></span>
        </div>
        {slides.length ? slides.map((slide, index) => (
          <article className="home-hero-slot" key={slide.id}>
            <div className="home-slot-heading">
              <h3>Slot {index + 1}</h3>
              <label className="home-visible"><input checked={slide.active} onChange={(event) => updateSlide(slide.id, "active", event.target.checked)} type="checkbox" /> Visible</label>
              <button className="home-button home-button-ghost" disabled={index === 0} onClick={() => moveSlide(index, -1)} type="button" aria-label="Move slot up">↑</button>
              <button className="home-button home-button-ghost" disabled={index === slides.length - 1} onClick={() => moveSlide(index, 1)} type="button" aria-label="Move slot down">↓</button>
              <button className="home-button home-button-ghost" onClick={() => deleteSlide(slide.id)} type="button">Delete</button>
            </div>
            <div className="home-hero-fields">
              <label>Banner title (alt text)<input onChange={(event) => updateSlide(slide.id, "title", event.target.value)} placeholder="e.g. Summer in Maldives" type="text" value={slide.title} /></label>
              <label>Link URL (optional)<input onChange={(event) => updateSlide(slide.id, "link", event.target.value)} placeholder="/holidays/maldives" type="text" value={slide.link} /></label>
            </div>
            <div className="home-hero-images">
              {(["desktop", "mobile"] as const).map((kind) => {
                const spec = HERO_SPECS[kind];
                return (
                  <div className="home-upload" key={kind}>
                    <b>{spec.label} version</b>
                    <p>Exactly <strong>{spec.width} × {spec.height} px</strong> · <strong>WebP</strong> (.webp) only</p>
                    <div className={`home-image-preview home-image-${kind}`} style={slide[kind] ? { backgroundImage: `url("${slide[kind]}")` } : undefined}>{slide[kind] ? "" : "No image"}</div>
                    <div className="home-upload-actions">
                      <label className="home-button home-button-ghost">
                        {slide[kind] ? "Replace image" : "Upload image"}
                        <input accept="image/webp,.webp" hidden onChange={(event) => void uploadImage(slide.id, kind, event.target.files?.[0])} type="file" />
                      </label>
                      {slide[kind] && <button className="home-button home-button-ghost" onClick={() => removeImage(slide.id, kind)} type="button">Remove</button>}
                    </div>
                    <span className="home-error" role="alert">{errors[`${slide.id}:${kind}`] ?? ""}</span>
                  </div>
                );
              })}
            </div>
          </article>
        )) : <div className="home-hero-empty">No hero slots yet. Add your first slot to get started.</div>}
        <div className="home-hero-footer">
          <button className="home-button home-button-ghost" disabled={slides.length >= HERO_MAX} onClick={addSlide} type="button">+ Add slot</button>
          <button className="home-button home-button-primary" onClick={saveSlides} type="button">Save hero slider</button>
          <span className="home-hint" aria-live="polite">{notice || (dirty ? "Unsaved changes" : "")}</span>
        </div>
      </section>

      <section className="home-welcome">
        <div>
          <h1>{greeting}, Admin <span aria-hidden="true">👋</span></h1>
          <p>Welcome to your travel management workspace.</p>
        </div>
        <span className="home-date"><CalendarIcon />{date}</span>
      </section>

      <section className="home-stats" aria-label="Overview">
        {stats.map((stat) => (
          <article className="home-stat card" key={stat.label}>
            <div className="home-stat-top"><span className={`home-stat-icon ${stat.style}`}><HomeIcon name={stat.icon} /></span><span className="home-trend"><HomeIcon name="up" size={12} />{stat.trend}</span></div>
            <div className="home-stat-label">{stat.label}</div>
            <div className="home-stat-value">{stat.value}</div>
            <div className="home-stat-foot">{stat.foot}</div>
          </article>
        ))}
      </section>

      <div className="home-section-heading"><h2>Quick Access</h2><span>Jump straight into a section</span></div>
      <section className="home-quick">
        {quickLinks.map((item) => (
          <button className="home-quick-card card" key={item.id} onClick={() => onNavigate(item.id)} type="button">
            <span className="home-quick-icon"><HomeIcon name={item.icon} /></span>
            <b>{item.title}</b>
            <p>{item.description}</p>
            <span className="home-quick-go">Open <HomeIcon name="arrow" size={14} /></span>
          </button>
        ))}
      </section>
    </div>
  );
}

function CalendarIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="15" viewBox="0 0 24 24" width="15">
      <rect height="18" rx="2" stroke="currentColor" strokeWidth="2" width="18" x="3" y="4" />
      <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    </svg>
  );
}
