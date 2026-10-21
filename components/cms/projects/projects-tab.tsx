"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import seeds from "./projects.json";
import "./projects.css";

const STORAGE_KEY = "letsfly-cms-projects-v1";
const VIEW_KEY = "cms-proj-view";
const categories = { csr: "CSR", events: "Events", other: "Other" } as const;
type ProjectCategory = keyof typeof categories;
type ProjectStatus = "draft" | "published";
type ProjectImage = { src: string; alt: string; name?: string };
interface Project {
  id: string;
  slug: string;
  category: ProjectCategory | "";
  title: string;
  date: string;
  summary: string;
  description: string;
  cover: ProjectImage;
  gallery: ProjectImage[];
  status: ProjectStatus;
  updatedAt: number;
}
type SeedProject = (typeof seeds)[number];

const seedProjects = (): Project[] => seeds.map((project: SeedProject, index) => ({
  id: `pj-${project.id}`,
  slug: project.id,
  category: project.category as ProjectCategory,
  title: project.title,
  date: project.date,
  summary: project.summary || "",
  description: project.overview.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join(""),
  cover: { ...project.cover },
  gallery: project.gallery.map((image) => ({ ...image })),
  status: project.id === "corporate-awards-night-colombo" ? "draft" : "published",
  updatedAt: Date.now() - (index + 1) * 5 * 3600_000,
}));

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character] ?? character);
}

function safeDescription(value: string) {
  const template = document.createElement("template");
  template.innerHTML = value;
  const allowed = new Set(["P", "BR", "B", "STRONG", "I", "EM", "A"]);
  const clean = (parent: ParentNode) => {
    [...parent.childNodes].forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) return;
      if (!(node instanceof HTMLElement)) {
        node.remove();
        return;
      }
      clean(node);
      if (node.tagName === "DIV") {
        const paragraph = document.createElement("p");
        paragraph.append(...node.childNodes);
        node.replaceWith(paragraph);
        return;
      }
      if (!allowed.has(node.tagName)) {
        node.replaceWith(...node.childNodes);
        return;
      }
      [...node.attributes].forEach((attribute) => {
        if (!(node.tagName === "A" && attribute.name === "href")) node.removeAttribute(attribute.name);
      });
      if (node.tagName === "A") {
        const href = node.getAttribute("href") || "";
        if (!/^(https?:|mailto:|tel:)/i.test(href)) {
          node.replaceWith(...node.childNodes);
        } else {
          node.setAttribute("target", "_blank");
          node.setAttribute("rel", "noopener");
        }
      }
    });
  };
  clean(template.content);
  const output = document.createElement("div");
  let paragraph: HTMLParagraphElement | null = null;
  [...template.content.childNodes].forEach((node) => {
    if (node instanceof HTMLParagraphElement) {
      paragraph = null;
      output.append(node);
    } else {
      if (!paragraph) {
        paragraph = document.createElement("p");
        output.append(paragraph);
      }
      paragraph.append(node);
    }
  });
  return output.innerHTML;
}

function readProjects(): Project[] {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === null) {
    const initial = seedProjects();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    return initial;
  }
  try {
    const parsed: unknown = JSON.parse(saved);
    if (Array.isArray(parsed)) return parsed as Project[];
  } catch (error) {
    console.error("Saved project data is not readable; restoring the existing sample projects.", error);
  }
  const initial = seedProjects();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
  return initial;
}

function slugify(value: string) {
  return value.normalize("NFKD").toLowerCase().trim()
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function newId() {
  return `pj-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function dateLabel(value: string) {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? "No date"
    : date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

function timeAgo(value: number) {
  const minutes = Math.max(0, Math.floor((Date.now() - value) / 60_000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return dateLabel(new Date(value).toISOString().slice(0, 10));
}

function imageCount(project: Project) {
  return [project.cover, ...project.gallery].filter((image) => image.src).length;
}

function backgroundStyle(src: string) {
  return src ? { backgroundImage: `url("${src.replace(/"/g, "%22")}")` } : undefined;
}

function blankProject(): Project {
  return {
    id: newId(), slug: "", category: "", title: "",
    date: new Date().toISOString().slice(0, 10), summary: "", description: "",
    cover: { src: "", alt: "" }, gallery: [], status: "draft", updatedAt: Date.now(),
  };
}

async function readImage(file: File, maxWidth: number): Promise<ProjectImage> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) &&
      !/\.(jpe?g|png|webp)$/i.test(file.name)) {
    throw new Error(`${file.name}: unsupported format (use JPG, PNG or WebP).`);
  }
  if (file.size > 5 * 1024 * 1024) throw new Error(`${file.name}: larger than 5 MB.`);

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = objectUrl;
    await image.decode();
    const scale = Math.min(1, maxWidth / image.naturalWidth);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(image.naturalWidth * scale);
    canvas.height = Math.round(image.naturalHeight * scale);
    const context = canvas.getContext("2d");
    if (!context) throw new Error(`${file.name}: image processing is not available.`);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return {
      src: canvas.toDataURL("image/jpeg", 0.8),
      alt: file.name.replace(/\.[a-z0-9]+$/i, "").replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim(),
      name: file.name,
    };
  } catch (error) {
    if (error instanceof Error && error.message.startsWith(file.name)) throw error;
    throw new Error(`${file.name}: could not be read.`);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export default function ProjectsTab({ onDirtyChange }: { onDirtyChange: (dirty: boolean) => void }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Project | null>(null);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"all" | ProjectCategory>("all");
  const [status, setStatus] = useState<"" | ProjectStatus>("");
  const [sort, setSort] = useState("newest");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [preview, setPreview] = useState<Project | null>(null);
  const [imageError, setImageError] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const descriptionEditor = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      setProjects(readProjects());
      setView(localStorage.getItem(VIEW_KEY) === "list" ? "list" : "grid");
    } catch (caught) {
      console.error("Could not load projects.", caught);
      setError("Projects could not be loaded from browser storage.");
    }
  }, []);

  useEffect(() => {
    const editor = descriptionEditor.current;
    if (editor && draft && editor.innerHTML !== draft.description) editor.innerHTML = draft.description;
  }, [activeId, draft]);
  const counts = useMemo(() => ({
    all: projects.length,
    csr: projects.filter((project) => project.category === "csr").length,
    events: projects.filter((project) => project.category === "events").length,
    other: projects.filter((project) => project.category === "other").length,
  }), [projects]);
  const filtered = useMemo(() => {
    const term = query.trim().toLocaleLowerCase();
    const result = projects.filter((project) =>
      (category === "all" || project.category === category) &&
      (!status || project.status === status) &&
      (!term || `${project.title} ${project.summary}`.toLocaleLowerCase().includes(term)),
    );
    const comparators: Record<string, (a: Project, b: Project) => number> = {
      newest: (a, b) => b.date.localeCompare(a.date),
      oldest: (a, b) => a.date.localeCompare(b.date),
      updated: (a, b) => b.updatedAt - a.updatedAt,
      name: (a, b) => a.title.localeCompare(b.title),
    };
    return result.sort(comparators[sort]);
  }, [category, projects, query, sort, status]);

  function saveList(next: Project[], message?: string) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setProjects(next);
      setError("");
      if (message) setNotice(message);
      return true;
    } catch (caught) {
      console.error("Could not save projects.", caught);
      setError("Could not save: browser storage is full. Try fewer or smaller photos.");
      return false;
    }
  }

  function startNew() {
    setDraft(blankProject());
    setActiveId("new");
    setSlugTouched(false);
    onDirtyChange(false);
    setError("");
    setNotice("");
  }

  function startEdit(project: Project) {
    setDraft({ ...project, cover: { ...project.cover }, gallery: project.gallery.map((image) => ({ ...image })) });
    setActiveId(project.id);
    setSlugTouched(project.slug !== slugify(project.title));
    onDirtyChange(false);
    setError("");
    setNotice("");
  }

  function updateDraft(update: Partial<Project>) {
    setDraft((currentDraft) => {
      if (!currentDraft) return currentDraft;
      const next = { ...currentDraft, ...update };
      if (update.title !== undefined && !slugTouched) next.slug = slugify(update.title);
      return next;
    });
    onDirtyChange(true);
    setError("");
  }

  function saveProject(nextStatus: ProjectStatus) {
    if (!draft) return;
    const savedProject = projects.find((project) => project.id === draft.id);
    if (nextStatus === "draft" && savedProject?.status === "published" &&
        !window.confirm("This project is currently published. Saving it as a draft will hide it from the Projects page until you publish it again.")) {
      return;
    }
    const slug = slugify(draft.slug || draft.title);
    const validation = !draft.title.trim()
      ? "Add a project title."
      : nextStatus === "published" && !draft.category
        ? "Choose a category: CSR, Events or Other."
        : nextStatus === "published" && !slug
          ? "Add a page URL (slug)."
          : nextStatus === "published" && projects.some((project) => project.id !== draft.id && project.slug === slug)
            ? "This URL is already used by another project. Please change it."
            : nextStatus === "published" && !draft.date
              ? "Choose the project date."
              : nextStatus === "published" && !draft.summary.trim()
                ? "Write a short card summary."
                : nextStatus === "published" && !draft.description.replace(/<[^>]*>/g, "").trim()
                  ? "Write the description overview."
                  : nextStatus === "published" && !draft.cover.src
                    ? "Upload a cover image."
                    : nextStatus === "published" && !draft.cover.alt.trim()
                      ? "Describe the cover image (alt text)."
                      : nextStatus === "published" && draft.gallery.some((image) => !image.alt.trim())
                        ? "Add alt text to every gallery photo."
                        : "";
    if (validation) {
      setError(validation);
      return;
    }
    const updated: Project = {
      ...draft,
      title: draft.title.trim(),
      slug,
      summary: draft.summary.trim(),
      description: safeDescription(draft.description),
      cover: { ...draft.cover, alt: draft.cover.alt.trim() },
      gallery: draft.gallery.filter((image) => image.src).map((image) => ({ ...image, alt: image.alt.trim() })),
      status: nextStatus,
      updatedAt: Date.now(),
    };
    const exists = projects.some((project) => project.id === updated.id);
    const next = exists
      ? projects.map((project) => project.id === updated.id ? updated : project)
      : [updated, ...projects];
    if (saveList(next, nextStatus === "published" ? "Project published." : "Draft saved successfully.")) {
      setDraft(updated);
      setActiveId(null);
      onDirtyChange(false);
    }
  }

  async function chooseCover(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !draft) return;
    try {
      const image = await readImage(file, 1600);
      updateDraft({ cover: { ...image, alt: draft.cover.alt || image.alt } });
      setImageError("");
    } catch (caught) {
      setImageError(caught instanceof Error ? caught.message : "Could not read the image.");
    }
  }

  async function chooseGallery(event: ChangeEvent<HTMLInputElement>) {
    const files = [...(event.target.files ?? [])];
    event.target.value = "";
    if (!draft || !files.length) return;
    const loaded = await Promise.all(files.map(async (file) => {
      try {
        return await readImage(file, 1400);
      } catch (caught) {
        setImageError((currentError) => [currentError, caught instanceof Error ? caught.message : "Could not read image."]
          .filter(Boolean).join(" "));
        return null;
      }
    }));
    const images = loaded.filter((image): image is ProjectImage => image !== null);
    if (images.length) updateDraft({ gallery: [...draft.gallery, ...images] });
  }

  async function duplicateProject(project: Project) {
    const copy = {
      ...project,
      id: newId(),
      title: `${project.title} (copy)`,
      slug: slugify(`${project.title} copy`),
      status: "draft" as const,
      updatedAt: Date.now(),
    };
    let uniqueSlug = copy.slug || "project";
    let suffix = 2;
    while (projects.some((item) => item.slug === uniqueSlug)) uniqueSlug = `${copy.slug}-${suffix++}`;
    copy.slug = uniqueSlug;
    saveList([...projects.slice(0, projects.indexOf(project) + 1), copy, ...projects.slice(projects.indexOf(project) + 1)], `Duplicated as “${copy.title}” (Draft).`);
  }

  async function deleteProject(project: Project) {
    if (!window.confirm(`Delete “${project.title}” and all ${imageCount(project)} photos? This cannot be undone.`)) return;
    saveList(projects.filter((item) => item.id !== project.id), `“${project.title}” deleted.`);
  }

  function resetProjects() {
    if (!window.confirm("All projects will be replaced with the original sample projects. Anything you added or edited in this browser will be lost.")) return;
    saveList(seedProjects(), "Sample projects restored.");
  }

  function clearFilters() {
    setQuery("");
    setCategory("all");
    setStatus("");
  }

  function closeEditor() {
    setActiveId(null);
    setDraft(null);
    onDirtyChange(false);
    setError("");
    setImageError("");
  }

  function moveGallery(index: number, offset: -1 | 1) {
    if (!draft) return;
    const target = index + offset;
    if (target < 0 || target >= draft.gallery.length) return;
    const gallery = [...draft.gallery];
    [gallery[index], gallery[target]] = [gallery[target], gallery[index]];
    updateDraft({ gallery });
  }

  function setCoverFromGallery(index: number) {
    if (!draft) return;
    const gallery = [...draft.gallery];
    const [image] = gallery.splice(index, 1);
    if (draft.cover.src) gallery.splice(index, 0, draft.cover);
    updateDraft({ cover: image, gallery });
  }

  function onDrop(event: DragEvent<HTMLElement>, target: "cover" | "gallery") {
    event.preventDefault();
    if (target === "cover") {
      const file = event.dataTransfer.files[0];
      if (file && draft) {
        void readImage(file, 1600).then((image) => updateDraft({ cover: { ...image, alt: draft.cover.alt || image.alt } }))
          .catch((caught: unknown) => setImageError(caught instanceof Error ? caught.message : "Could not read the image."));
      }
    } else {
      const files = [...event.dataTransfer.files];
      void Promise.all(files.map(async (file) => {
        try {
          return await readImage(file, 1400);
        } catch (caught) {
          setImageError((currentError) => [currentError, caught instanceof Error ? caught.message : "Could not read image."]
            .filter(Boolean).join(" "));
          return null;
        }
      })).then((images) => {
        const accepted = images.filter((image): image is ProjectImage => image !== null);
        if (accepted.length) updateDraft({ gallery: [...(draft?.gallery ?? []), ...accepted] });
      });
    }
  }

  const activeEdit = activeId !== null;

  return (
    <div className="cms-projects">
      {notice && <p className="project-notice" role="status">{notice}</p>}
      {error && <p className="project-error" role="alert">{error}</p>}
      {!activeEdit ? (
        <>
          <section className="project-page-heading">
            <div><h2>Projects</h2><p>Manage the CSR initiatives, events and other projects shown on the website’s Projects page.</p></div>
            <button className="project-primary" onClick={startNew} type="button">＋ Add Project</button>
          </section>
          <nav aria-label="Filter by category" className="project-category-tabs">
            {(["all", "csr", "events", "other"] as const).map((item) => (
              <button aria-pressed={category === item} className={category === item ? "active" : ""} key={item}
                onClick={() => setCategory(item)} type="button">
                {item === "all" ? "All" : categories[item]} <span>{counts[item]}</span>
              </button>
            ))}
          </nav>
          <section aria-label="Project filters" className="project-toolbar">
            <label className="project-search"><span aria-hidden="true">⌕</span><input aria-label="Search projects" onChange={(event) => setQuery(event.target.value)} placeholder="Search by project title or summary…" type="search" value={query} /></label>
            <select aria-label="Publication status" onChange={(event) => setStatus(event.target.value as "" | ProjectStatus)} value={status}>
              <option value="">All statuses</option><option value="published">Published</option><option value="draft">Draft</option>
            </select>
            <select aria-label="Sort projects" onChange={(event) => setSort(event.target.value)} value={sort}>
              <option value="newest">Project date: newest first</option><option value="oldest">Project date: oldest first</option>
              <option value="updated">Recently updated</option><option value="name">Name (A–Z)</option>
            </select>
            <div aria-label="Layout" className="project-view-toggle" role="group">
              {(["grid", "list"] as const).map((item) => (
                <button aria-pressed={view === item} key={item} onClick={() => {
                  setView(item);
                  try { localStorage.setItem(VIEW_KEY, item); } catch (caught) {
                    console.error("Could not save project layout preference.", caught);
                    setError("The layout preference could not be saved.");
                  }
                }} title={`${item} view`} type="button">{item === "grid" ? "▦" : "☷"}</button>
              ))}
            </div>
          </section>
          <div className="project-result-bar">
            <span>{query || category !== "all" || status ? <>Showing <b>{filtered.length}</b> of {projects.length} projects</> : <><b>{projects.length} {projects.length === 1 ? "project" : "projects"}</b> · {projects.filter((project) => project.status === "published").length} published · {projects.filter((project) => project.status === "draft").length} draft{projects.filter((project) => project.status === "draft").length === 1 ? "" : "s"}</>}</span>
            {(query || category !== "all" || status) && <button onClick={clearFilters} type="button">× Clear filters</button>}
          </div>
          {projects.length === 0 ? (
            <div className="project-empty"><h3>No projects yet</h3><p>Add your first project to show it on the website’s Projects page.</p><button className="project-primary" onClick={startNew} type="button">＋ Add Project</button></div>
          ) : filtered.length === 0 ? (
            <div className="project-empty"><h3>No projects match your filters</h3><p>Try another category or search term.</p><button className="project-secondary" onClick={clearFilters} type="button">Clear filters</button></div>
          ) : (
            <div className={`project-cards ${view}`}>
              <button className="project-add-card" onClick={startNew} type="button"><span>＋</span><b>Add new project</b><small>Create a CSR, event or other project with its description and photo gallery.</small></button>
              {filtered.map((project) => (
                <article className="project-card" key={project.id}>
                  <button className="project-card-cover" onClick={() => startEdit(project)} style={backgroundStyle(project.cover.src)} type="button">
                    <span className={`project-status ${project.status}`}>{project.status === "published" ? "Published" : "Draft"}</span>
                    {imageCount(project) > 1 && <span className="project-photo-count">{imageCount(project)} photos</span>}
                  </button>
                  <div className="project-card-body">
                    <span className={`project-category ${project.category || "none"}`}>{categories[project.category as ProjectCategory] || "No category"}</span>
                    <h3>{project.title || "Untitled project"}</h3>
                    <p>{project.summary || <i>No summary yet</i>}</p>
                    <small>{dateLabel(project.date)} · Updated {timeAgo(project.updatedAt)}</small>
                  </div>
                  <div className="project-card-actions">
                    <button onClick={() => startEdit(project)} type="button">Edit</button>
                    <button onClick={() => setPreview(project)} type="button">Preview</button>
                    <button aria-label={`Duplicate ${project.title}`} onClick={() => void duplicateProject(project)} type="button">Duplicate</button>
                    <button aria-label={`Delete ${project.title}`} onClick={() => void deleteProject(project)} type="button">Delete</button>
                  </div>
                </article>
              ))}
            </div>
          )}
          <p className="project-demo-note">Prototype: changes are saved in this browser only, not on a server. Published projects appear on the public Projects page, newest first.
            <button onClick={resetProjects} type="button">Reset sample projects</button>
          </p>
        </>
      ) : draft && (
        <section className="project-editor">
          <button className="project-back" onClick={closeEditor} type="button">← Back to Projects</button>
          <header className="project-editor-heading">
            <div className="project-editor-thumb" style={backgroundStyle(draft.cover.src)} />
            <div><span className={`project-category ${draft.category || "none"}`}>{categories[draft.category as ProjectCategory] || "No category yet"}</span><h2>{draft.title || (activeId === "new" ? "New project" : "Untitled project")}</h2><p>{dateLabel(draft.date)} · {imageCount(draft)} photos</p></div>
            <span className={`project-status ${draft.status}`}>{draft.status === "published" ? "Published" : "Draft"}</span>
          </header>
          <div className="project-editor-grid">
            <div className="project-editor-main">
              <section className="project-panel">
                <header><h3>Project details</h3><p>Shown on the Projects page and at the top of the project page. Fields marked * are required to publish.</p></header>
                <div className="project-form-grid">
                  <fieldset className="project-field full"><legend>Category *</legend><div className="project-radio-row">
                    {(Object.entries(categories) as [ProjectCategory, string][]).map(([key, label]) => (
                      <button aria-pressed={draft.category === key} className={`project-radio ${key}`} key={key} onClick={() => updateDraft({ category: key })} type="button">{label}</button>
                    ))}
                  </div><small>CSR for community work, Events for conferences and launches, Other for group trips and everything else.</small></fieldset>
                  <label className="project-field full">Project title *<input maxLength={100} onChange={(event) => updateDraft({ title: event.target.value })} placeholder="e.g. Beach Clean-up at Mount Lavinia" value={draft.title} /></label>
                  <label className="project-field full">Page URL (slug) *<span className="project-slug"><span>letsfly.lk/projects/</span><input maxLength={80} onChange={(event) => { setSlugTouched(true); updateDraft({ slug: event.target.value }); }} value={draft.slug} /></span><small>Created automatically from the title. Use lowercase letters, numbers and hyphens.</small></label>
                  <label className="project-field">Project date *<input onChange={(event) => updateDraft({ date: event.target.value })} type="date" value={draft.date} /><small>Used to sort projects, newest first.</small></label>
                  <label className="project-field">Publication status<select onChange={(event) => updateDraft({ status: event.target.value as ProjectStatus })} value={draft.status}><option value="draft">Draft</option><option value="published">Published</option></select><small>Choosing Published checks the project and puts it live.</small></label>
                  <label className="project-field full">Card summary *<textarea maxLength={200} onChange={(event) => updateDraft({ summary: event.target.value })} placeholder="One or two sentences shown on the Projects page card." rows={3} value={draft.summary} /><small>{draft.summary.length} / 200</small></label>
                </div>
              </section>
              <section className="project-panel">
                <header><h3>Description Overview *</h3><p>The full story of the project, shown in full on the project page. Use the formatting buttons or write paragraphs.</p></header>
                <div className="project-editor-tools">
                  <button onMouseDown={(event) => event.preventDefault()} onClick={() => document.execCommand("bold")} type="button"><b>B</b></button>
                  <button onMouseDown={(event) => event.preventDefault()} onClick={() => document.execCommand("italic")} type="button"><i>I</i></button>
                  <button onClick={() => {
                    const url = window.prompt("Paste the full web address, starting with https://");
                    if (url && /^(https?:\/\/|mailto:|tel:)\S+$/i.test(url)) document.execCommand("createLink", false, url);
                  }} onMouseDown={(event) => event.preventDefault()} type="button">Link</button>
                  <button onMouseDown={(event) => event.preventDefault()} onClick={() => { document.execCommand("removeFormat"); document.execCommand("unlink"); }} type="button">Clear formatting</button>
                </div>
                <div aria-label="Description overview" className="project-richtext" contentEditable onInput={(event) => updateDraft({ description: event.currentTarget.innerHTML })} onPaste={(event) => {
                  event.preventDefault();
                  document.execCommand("insertText", false, event.clipboardData.getData("text/plain"));
                }} ref={descriptionEditor} role="textbox" suppressContentEditableWarning />
              </section>
              <section className="project-panel">
                <header><div><h3>Project gallery</h3><p>Photos shown on the project page after the cover image. Add a short description (alt text) to each one.</p></div>
                  <label className="project-secondary project-file-button">＋ Upload images<input accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" hidden multiple onChange={(event) => void chooseGallery(event)} type="file" /></label>
                </header>
                {imageError && <p className="project-error" role="alert">{imageError}</p>}
                <div className="project-gallery-edit" onDragOver={(event) => event.preventDefault()} onDrop={(event) => onDrop(event, "gallery")}>
                  {draft.gallery.map((image, index) => (
                    <article key={`${image.src.slice(0, 35)}-${index}`}>
                      <div className="project-gallery-image" style={backgroundStyle(image.src)}><span>{index + 1}</span></div>
                      <input aria-label={`Alt text for image ${index + 1}`} maxLength={140} onChange={(event) => updateDraft({ gallery: draft.gallery.map((item, itemIndex) => itemIndex === index ? { ...item, alt: event.target.value } : item) })} placeholder="Describe this photo (alt text)" value={image.alt} />
                      <div className="project-gallery-actions">
                        <button aria-label={`Move image ${index + 1} earlier`} disabled={index === 0} onClick={() => moveGallery(index, -1)} type="button">←</button>
                        <button aria-label={`Move image ${index + 1} later`} disabled={index === draft.gallery.length - 1} onClick={() => moveGallery(index, 1)} type="button">→</button>
                        <button onClick={() => setCoverFromGallery(index)} type="button">Set as cover</button>
                        <button onClick={() => updateDraft({ gallery: draft.gallery.filter((_, itemIndex) => itemIndex !== index) })} type="button">Remove</button>
                      </div>
                    </article>
                  ))}
                  <label className="project-gallery-add">＋ Add project photos<small>Drag & drop or browse · JPG, PNG, WebP · max 5 MB each<input accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" hidden multiple onChange={(event) => void chooseGallery(event)} type="file" /></small></label>
                </div>
              </section>
            </div>
            <aside className="project-editor-side">
              <section className="project-panel">
                <header><h3>Cover image *</h3><p>The main image on the project card and at the top of the project page.</p></header>
                <p className="project-image-spec">1600 × 900 px · 16:9 · JPG / PNG / WebP · Max 5 MB</p>
                {imageError && <p className="project-error" role="alert">{imageError}</p>}
                <label className="project-cover-upload" onDragOver={(event) => event.preventDefault()} onDrop={(event) => onDrop(event, "cover")} style={backgroundStyle(draft.cover.src)}>
                  {!draft.cover.src && <>Upload Cover Image<small>Drag & drop here, or browse files</small></>}
                  <input accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" hidden onChange={(event) => void chooseCover(event)} type="file" />
                </label>
                {draft.cover.src && <button className="project-secondary" onClick={() => updateDraft({ cover: { ...draft.cover, src: "", name: undefined } })} type="button">Remove cover</button>}
                <label className="project-field">Cover alt text *<input maxLength={140} onChange={(event) => updateDraft({ cover: { ...draft.cover, alt: event.target.value } })} placeholder="Describe the cover photo" value={draft.cover.alt} /></label>
              </section>
              <section className="project-panel project-live-preview"><h3>Card preview · Projects page</h3><div className="project-preview-image" style={backgroundStyle(draft.cover.src)} /><span className={`project-category ${draft.category || "none"}`}>{categories[draft.category as ProjectCategory] || "Category"}</span><b>{draft.title || "Project title"}</b><p>{draft.summary || "Your card summary will appear here."}</p></section>
            </aside>
          </div>
          <footer className="project-actionbar"><span>{error && <span role="alert">{error}</span>}</span><div>
            <button className="project-secondary" onClick={closeEditor} type="button">Cancel</button>
            <button className="project-secondary" onClick={() => setPreview(draft)} type="button">Preview</button>
            <button className="project-secondary" onClick={() => saveProject("draft")} type="button">Save Draft</button>
            <button className="project-primary" onClick={() => saveProject("published")} type="button">Publish</button>
          </div></footer>
        </section>
      )}
      {preview && <div className="project-modal-backdrop" onClick={() => setPreview(null)}>
        <section aria-label="Project preview" aria-modal="true" className="project-preview-modal" onClick={(event) => event.stopPropagation()} role="dialog">
          <header><div><span className={`project-category ${preview.category || "none"}`}>{categories[preview.category as ProjectCategory] || "Category"}</span><h2>{preview.title || "Untitled project"}</h2><p>{dateLabel(preview.date)} · {preview.status === "published" ? "Published" : "Draft — not visible on the website"}</p></div><button aria-label="Close preview" onClick={() => setPreview(null)} type="button">×</button></header>
          {preview.cover.src && <img alt={preview.cover.alt} className="project-preview-hero" src={preview.cover.src} />}
          <div className="project-preview-copy"><p>{preview.summary}</p><div dangerouslySetInnerHTML={{ __html: safeDescription(preview.description) }} /></div>
          {!!preview.gallery.length && <div className="project-preview-gallery">{preview.gallery.map((image, index) => <img alt={image.alt} key={`${image.src.slice(0, 35)}-${index}`} src={image.src} />)}</div>}
          <footer><button className="project-secondary" onClick={() => setPreview(null)} type="button">Close preview</button></footer>
        </section>
      </div>}
    </div>
  );
}
