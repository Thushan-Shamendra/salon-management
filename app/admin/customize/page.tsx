"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminButton from "@/components/admin/AdminButton";
import ConfirmModal from "@/components/admin/ConfirmModal";
import ImageUpload from "@/components/ui/ImageUpload";
import { adminPages, publicPages, globalGroups, getCustomizationFolder } from "@/lib/customization-registry";
import { CUSTOMIZATION_FONTS, CUSTOMIZATION_FONT_CSS, type ContentField, type GlobalRegistration, type SectionRegistration, type SectionOverride, type StyleField, type CustomizationFont } from "@/lib/customization-types";
import type { CloudinaryFolder } from "@/lib/cloudinary-constants";
import { useSectionCustomization } from "@/components/customization/CustomizationProvider";

type Tab = "global" | "public" | "admin";
type PreviewSize = "desktop" | "tablet" | "mobile";
type FieldKind = "color" | "font" | "number" | "select" | "text";
interface FieldDefinition {
  key: string;
  label: string;
  kind: FieldKind;
  defaultValue: string | number;
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
}

const CONTENT_LABELS: Record<ContentField, string> = {
  eyebrow: "Eyebrow text", heading: "Main heading", highlightedText: "Highlighted heading text",
  subheading: "Subheading", description: "Description", primaryButtonText: "Primary button text", secondaryButtonText: "Secondary button text",
};
const STYLE_LABELS: Record<StyleField, string> = {
  backgroundColor: "Background color", backgroundImage: "Background image", alignment: "Text alignment",
  heading: "Heading typography", highlightedText: "Highlighted text", description: "Description typography",
  primaryButton: "Primary button", secondaryButton: "Secondary button", sectionHeading: "Section headings",
  textColor: "Text color", headingColor: "Heading color", headingFont: "Default heading font", bodyFont: "Default body font",
  activeLinkColor: "Active link color", hoverColor: "Hover color", linkColor: "Link color", accentColor: "Accent color",
  activeItemBackground: "Active item background", activeItemTextColor: "Active item text color", hoverBackground: "Hover background",
};
const color = (key: string, label: string, defaultValue = "#7C3AED"): FieldDefinition => ({ key, label, kind: "color", defaultValue });
const number = (key: string, label: string, defaultValue: number, min: number, max: number, step = 1): FieldDefinition => ({ key, label, kind: "number", defaultValue, min, max, step });
const font: FieldDefinition = { key: "fontFamily", label: "Font family", kind: "font", defaultValue: "Geist" };
const weight = number("fontWeight", "Font weight", 700, 100, 900, 100);
const HEADING_FIELDS: FieldDefinition[] = [font, number("fontSizeDesktop", "Desktop size (px)", 36, 16, 96), number("fontSizeTablet", "Tablet size (px)", 30, 16, 96), number("fontSizeMobile", "Mobile size (px)", 24, 16, 64), weight, color("color", "Text color", "#1C1917")];
const DESCRIPTION_FIELDS: FieldDefinition[] = [font, number("fontSize", "Font size (px)", 16, 12, 32), color("color", "Text color", "#57534E")];
const BUTTON_FIELDS: FieldDefinition[] = [color("backgroundColor", "Background color"), color("textColor", "Text color", "#FFFFFF"), font, number("fontSize", "Font size (px)", 14, 12, 24), weight, { key: "size", label: "Button size", kind: "select", defaultValue: "medium", options: ["small", "medium", "large"] }, number("borderRadius", "Border radius (px)", 12, 0, 100), color("borderColor", "Border color")];
const fieldClass = "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 disabled:bg-stone-100 disabled:text-stone-400 focus:outline-none focus:ring-2 focus:ring-purple-300";

function pathValue(override: SectionOverride, path: string): unknown {
  return path.split(".").reduce<unknown>((value, part) => value && typeof value === "object" ? (value as Record<string, unknown>)[part] : undefined, override);
}
function updateValue(override: SectionOverride, path: string, value?: unknown): SectionOverride {
  const result = structuredClone(override) as Record<string, unknown>;
  const parts = path.split(".");
  function apply(target: Record<string, unknown>, index: number) {
    const key = parts[index];
    if (index === parts.length - 1) {
      if (value === undefined) delete target[key];
      else target[key] = value;
    } else {
      const nested = target[key] && typeof target[key] === "object" ? { ...(target[key] as Record<string, unknown>) } : {};
      apply(nested, index + 1);
      if (Object.keys(nested).length) target[key] = nested;
      else delete target[key];
    }
  }
  apply(result, 0);
  return result as SectionOverride;
}
function isHex(value: unknown): value is string {
  return typeof value === "string" && /^#(?:[\da-f]{3}|[\da-f]{6})$/i.test(value);
}
function safeImage(value: unknown): value is string {
  if (typeof value !== "string") return false;
  if (/^\/(?!\/)/.test(value)) return true;
  try { return ["https:", "http:"].includes(new URL(value).protocol); } catch { return false; }
}
function fontCss(value: unknown): string | undefined {
  return typeof value === "string" && CUSTOMIZATION_FONTS.includes(value as CustomizationFont) ? CUSTOMIZATION_FONT_CSS[value as CustomizationFont] : undefined;
}

function OverrideField({ definition, path, draft, onChange, multiline = false }: {
  definition: FieldDefinition; path: string; draft: SectionOverride;
  onChange: (path: string, value?: unknown) => void; multiline?: boolean;
}) {
  const value = pathValue(draft, path);
  const enabled = value !== undefined;
  const shownValue = enabled ? String(value) : String(definition.defaultValue);
  const id = `customizer-${path.replaceAll(".", "-")}`;
  return (
    <div className="space-y-2 rounded-xl border border-stone-200 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label htmlFor={id} className="text-xs font-semibold text-stone-700">{definition.label}</label>
        <label className="flex cursor-pointer items-center gap-1.5 text-xs text-stone-600">
          <input type="checkbox" checked={enabled} onChange={(event) => onChange(path, event.target.checked ? definition.defaultValue : undefined)} className="accent-purple-600" />
          Override
        </label>
      </div>
      {definition.kind === "color" ? (
        <div className="flex items-center gap-2">
          <input aria-label={`${definition.label} picker`} type="color" value={isHex(shownValue) ? (shownValue.length === 4 ? `#${shownValue.slice(1).split("").map((char) => char + char).join("")}` : shownValue) : "#7C3AED"} disabled={!enabled} onChange={(event) => onChange(path, event.target.value.toUpperCase())} className="h-10 w-12 shrink-0 cursor-pointer rounded-md border border-stone-300 disabled:cursor-default" />
          <input id={id} type="text" value={shownValue} maxLength={7} disabled={!enabled} onChange={(event) => onChange(path, event.target.value)} aria-invalid={enabled && !isHex(shownValue)} className={fieldClass} placeholder="#7C3AED" />
        </div>
      ) : definition.kind === "font" || definition.kind === "select" ? (
        <select id={id} value={shownValue} disabled={!enabled} onChange={(event) => onChange(path, event.target.value)} className={fieldClass}>
          {(definition.kind === "font" ? CUSTOMIZATION_FONTS : definition.options || []).map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      ) : definition.kind === "number" ? (
        <input id={id} type="number" value={shownValue} disabled={!enabled} min={definition.min} max={definition.max} step={definition.step || 1} onChange={(event) => onChange(path, event.target.value === "" ? "" : Number(event.target.value))} className={fieldClass} />
      ) : multiline ? (
        <textarea id={id} value={shownValue} disabled={!enabled} rows={4} maxLength={2000} onChange={(event) => onChange(path, event.target.value)} className={fieldClass} />
      ) : (
        <input id={id} type="text" value={shownValue} disabled={!enabled} maxLength={300} onChange={(event) => onChange(path, event.target.value)} className={fieldClass} />
      )}
      {!enabled && <p className="text-[11px] text-stone-500">Using the original default. Enable Override to change this field.</p>}
      {enabled && <button type="button" onClick={() => onChange(path)} className="text-[11px] font-semibold text-purple-700 hover:underline">Reset this field to default</button>}
    </div>
  );
}

function DraftPreview({ draft, registration, size }: { draft: SectionOverride; registration: SectionRegistration; size: PreviewSize }) {
  const style = draft.style || {};
  const text = (field: ContentField, fallback = "") => draft.content?.[field] ?? registration.content?.[field] ?? fallback;
  const heading = style.heading || {};
  const description = style.description || {};
  const image = style.backgroundImage?.url || registration.defaultImage;
  const headingSize = size === "mobile" ? heading.fontSizeMobile : size === "tablet" ? heading.fontSizeTablet : heading.fontSizeDesktop;
  const headingStyle: CSSProperties = { color: isHex(heading.color) ? heading.color : isHex(style.headingColor) ? style.headingColor : undefined, fontFamily: fontCss(heading.fontFamily || style.headingFont), fontSize: headingSize, fontWeight: heading.fontWeight };
  const buttonStyle = (role: "primaryButton" | "secondaryButton"): CSSProperties => {
    const button = style[role] || {};
    return { backgroundColor: isHex(button.backgroundColor) ? button.backgroundColor : undefined, color: isHex(button.textColor) ? button.textColor : undefined, fontFamily: fontCss(button.fontFamily), fontSize: button.fontSize, fontWeight: button.fontWeight, borderRadius: button.borderRadius, border: button.borderColor && isHex(button.borderColor) ? `1px solid ${button.borderColor}` : undefined, padding: button.size === "small" ? "8px 14px" : button.size === "large" ? "16px 24px" : "12px 20px" };
  };
  return (
    <div className="overflow-hidden rounded-2xl border border-stone-200 bg-stone-50 p-3">
      <div className="mx-auto rounded-xl bg-white px-5 py-8 transition-all" style={{ width: size === "mobile" ? "min(100%, 320px)" : "100%", minHeight: 220, backgroundColor: isHex(style.backgroundColor) ? style.backgroundColor : undefined, backgroundImage: image && safeImage(image) ? `url(${JSON.stringify(image)})` : undefined, backgroundSize: "cover", backgroundPosition: "center", textAlign: style.alignment || "left", color: isHex(style.textColor) ? style.textColor : undefined, fontFamily: fontCss(style.bodyFont) }}>
        {text("eyebrow") && <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-purple-700">{text("eyebrow")}</p>}
        <h2 className="text-2xl font-bold leading-tight text-stone-900" style={headingStyle}>{text("heading", registration.label)}{text("highlightedText") && <> <span className="text-purple-700" style={{ color: isHex(style.highlightedText?.color) ? style.highlightedText?.color : undefined }}>{text("highlightedText")}</span></>}</h2>
        {text("subheading") && <p className="mt-3 text-lg font-semibold text-stone-700">{text("subheading")}</p>}
        <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-stone-600" style={{ fontFamily: fontCss(description.fontFamily || style.bodyFont), fontSize: description.fontSize, color: isHex(description.color) ? description.color : isHex(style.textColor) ? style.textColor : undefined }}>{text("description", "Preview the selected colors and typography here.")}</p>
        {(registration.styles.includes("primaryButton") || text("primaryButtonText")) && <span className="mt-5 inline-block rounded-xl bg-purple-600 text-sm font-semibold text-white" style={buttonStyle("primaryButton")}>{text("primaryButtonText", "Book Appointment")}</span>}
        {(registration.styles.includes("secondaryButton") || text("secondaryButtonText")) && <span className="ml-2 mt-5 inline-block rounded-xl border border-stone-300 bg-white text-sm font-semibold text-stone-700" style={buttonStyle("secondaryButton")}>{text("secondaryButtonText", "Explore More")}</span>}
      </div>
    </div>
  );
}

export default function WebsiteCustomizerPage() {
  const router = useRouter();
  const customization = useSectionCustomization("page");
  const [tab, setTab] = useState<Tab>("global");
  const [groupKey, setGroupKey] = useState<string>("publicHeader");
  const [pageKey, setPageKey] = useState("home");
  const [sectionKey, setSectionKey] = useState("hero");
  const [draft, setDraft] = useState<SectionOverride>({});
  const [saved, setSaved] = useState<SectionOverride>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [resetOpen, setResetOpen] = useState(false);
  const [previewSize, setPreviewSize] = useState<PreviewSize>("desktop");
  const pages = tab === "admin" ? adminPages : publicPages;
  const selectedPage = pages.find((page) => page.key === pageKey) || pages[0];
  const selectedGroup = globalGroups.find((group) => group.key === groupKey) || globalGroups[0];
  const registration: SectionRegistration | GlobalRegistration = tab === "global" ? selectedGroup : selectedPage.sections.find((section) => section.key === sectionKey) || selectedPage.sections[0];
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);
  const target = tab === "global" ? `global:${selectedGroup.key}` : `${tab}:${selectedPage.key}:${registration.key}`;
  const sectionUrl = `/api/admin/customization/pages/${tab === "admin" ? "admin" : "public"}/${selectedPage.key}/${registration.key}`;
  const uploadFolder = tab === "global" ? "salon-management/customization/global" : getCustomizationFolder(tab === "admin" ? "admin" : "public", selectedPage.key, registration.key);
  const currentPageUrl = tab === "global" ? selectedGroup.scope === "admin" ? "/admin" : "/" : tab === "admin" ? selectedPage.key === "dashboard" ? "/admin" : `/admin/${selectedPage.key}` : selectedPage.key === "home" ? "/" : `/${selectedPage.key}`;

  useEffect(() => {
    const controller = new AbortController();
    const [scope, page, section] = target.split(":");
    async function load() {
      setLoading(true); setError(""); setMessage("");
      try {
        const url = scope === "global" ? "/api/admin/customization/global" : `/api/admin/customization/pages/${scope}/${page}`;
        const response = await fetch(url, { signal: controller.signal, cache: "no-store" });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || "Unable to load customization.");
        if (!controller.signal.aborted) {
          const override = scope === "global" ? data.customization?.[page] || {} : data.sections?.[section] || {};
          setDraft(override); setSaved(override);
        }
      } catch (err) {
        if (!controller.signal.aborted) setError(err instanceof Error ? err.message : "Unable to load customization.");
      } finally { if (!controller.signal.aborted) setLoading(false); }
    }
    void load();
    return () => controller.abort();
  }, [target]);

  useEffect(() => {
    if (!dirty) return;
    const beforeUnload = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    const navigation = (event: MouseEvent) => {
      const anchor = (event.target as Element)?.closest?.("a[href]");
      if (!(anchor instanceof HTMLAnchorElement) || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      const destination = new URL(anchor.href, window.location.href);
      if (destination.pathname === window.location.pathname && destination.search === window.location.search) return;
      if (!window.confirm("Leave Website Customizer and discard your unsaved changes?")) { event.preventDefault(); event.stopPropagation(); }
    };
    window.addEventListener("beforeunload", beforeUnload);
    document.addEventListener("click", navigation, true);
    return () => { window.removeEventListener("beforeunload", beforeUnload); document.removeEventListener("click", navigation, true); };
  }, [dirty]);

  const navigate = (action: () => void) => {
    if (saving || (dirty && !window.confirm("Discard unsaved customization changes?"))) return;
    setDraft({}); setSaved({}); action();
  };
  const change = (path: string, value?: unknown) => { setDraft((current) => updateValue(current, path, value)); setMessage(""); };
  const validateDraft = (): string | undefined => {
    const validate = (value: unknown, path: string): string | undefined => {
      if (!value || typeof value !== "object") return;
      for (const [key, entry] of Object.entries(value)) {
        if ((key.toLowerCase().includes("color") || ["activeItemBackground", "hoverBackground"].includes(key)) && !isHex(entry)) return `Enter a valid HEX color for ${key}.`;
        if (key === "url" && !safeImage(entry)) return "Enter a valid image URL starting with HTTPS, HTTP, or a local / path.";
        if (typeof entry === "number" && (!Number.isFinite(entry) || entry < 0)) return `Enter a valid size for ${key}.`;
        if (entry === "" && !path.startsWith("content")) return "Complete or reset empty style fields before saving.";
        const nestedError = validate(entry, `${path}.${key}`); if (nestedError) return nestedError;
      }
    };
    return validate(draft, "");
  };
  const save = async (reset = false) => {
    if (!reset) { const invalid = validateDraft(); if (invalid) { setError(invalid); return; } }
    setSaving(true); setError(""); setMessage("");
    try {
      const url = tab === "global" ? "/api/admin/customization/global" : sectionUrl;
      const response = await fetch(url, { method: reset && tab !== "global" ? "DELETE" : "PATCH", headers: { "Content-Type": "application/json" }, ...(reset && tab !== "global" ? {} : { body: JSON.stringify(tab === "global" ? { group: selectedGroup.key, override: reset ? {} : draft } : draft) }) });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "Unable to save customization.");
      const next = reset ? {} : data.override ?? draft;
      setDraft(next); setSaved(next); setResetOpen(false);
      setMessage(reset ? "Original defaults restored for this selection." : "Customization saved. Your changes are now visible on the website.");
      router.refresh();
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to save customization."); }
    finally { setSaving(false); }
  };

  function renderStyle(key: StyleField) {
    if (key === "backgroundImage") {
      const image = draft.style?.backgroundImage;
      return <div key={key} className="space-y-4 rounded-2xl border border-stone-200 bg-white p-4">
        <h3 className="text-sm font-bold text-stone-900">Background image</h3>
        <p className="text-xs text-stone-500">{image?.url ? "Custom image" : "Using Default Image"}</p>
        <ImageUpload folder={uploadFolder as CloudinaryFolder} value={image?.url} publicId={image?.publicId} onChange={(result) => change("style.backgroundImage", { url: result.url, publicId: result.publicId })} onRemove={() => change("style.backgroundImage")} label={image?.url ? "Replace override" : "Upload override"} description="Upload a background image with the existing signed Cloudinary uploader." disabled={saving} />
        <label className="block space-y-1.5 text-xs font-semibold text-stone-700">Image URL<input type="url" value={image?.url || ""} onChange={(event) => change("style.backgroundImage", event.target.value ? { url: event.target.value } : undefined)} placeholder="https://..." className={fieldClass} /></label>
        {image && <button type="button" onClick={() => change("style.backgroundImage")} className="text-xs font-semibold text-purple-700 hover:underline">Reset image to default</button>}
      </div>;
    }
    const nested = key === "heading" || key === "sectionHeading" ? HEADING_FIELDS : key === "description" ? DESCRIPTION_FIELDS : key === "primaryButton" || key === "secondaryButton" ? BUTTON_FIELDS : key === "highlightedText" ? [color("color", "Text color")] : undefined;
    const single: FieldDefinition = key === "alignment" ? { key, label: STYLE_LABELS[key], kind: "select", defaultValue: "left", options: ["left", "center", "right"] } : key === "headingFont" || key === "bodyFont" ? { key, label: STYLE_LABELS[key], kind: "font", defaultValue: "Geist" } : color(key, STYLE_LABELS[key], key === "backgroundColor" ? "#FFFFFF" : key === "textColor" || key === "headingColor" ? "#1C1917" : "#7C3AED");
    return <div key={key} className="rounded-2xl border border-stone-200 bg-white p-4">
      <h3 className="mb-3 text-sm font-bold text-stone-900">{STYLE_LABELS[key]}</h3>
      <div className={nested ? "grid gap-3 sm:grid-cols-2" : ""}>{(nested || [single]).map((definition) => <OverrideField key={definition.key} definition={definition} path={`style.${key}${nested ? `.${definition.key}` : ""}`} draft={draft} onChange={change} />)}</div>
    </div>;
  }

  return (
    <div className="space-y-6 pb-16">
      <AdminPageHeader title="Website Customizer" description="Customize SALVORA website content, typography, colors, backgrounds and buttons without changing application structure." breadcrumbs={[{ label: "Website Customizer" }]} />
      <div role="tablist" aria-label="Customization area" className="flex flex-wrap gap-2 rounded-2xl border border-stone-200 bg-white p-2">
        {([ ["global", "Global Design"], ["public", "Public Pages"], ["admin", "Admin Portal"] ] as const).map(([key, label]) => <button key={key} type="button" role="tab" aria-selected={tab === key} onClick={() => navigate(() => { setTab(key); if (key !== "global") { const nextPages = key === "admin" ? adminPages : publicPages; setPageKey(nextPages[0].key); setSectionKey(nextPages[0].sections[0].key); } })} className={`rounded-xl px-4 py-2.5 text-xs font-semibold sm:text-sm ${tab === key ? "bg-purple-600 text-white shadow-sm" : "text-stone-600 hover:bg-stone-50"}`}>{label}</button>)}
      </div>
      <div className="grid items-start gap-5 xl:grid-cols-[210px_minmax(0,1fr)_320px]">
        <aside className="space-y-4 rounded-2xl border border-stone-200 bg-white p-4 xl:sticky xl:top-24">
          {tab === "global" ? <label className="block space-y-2 text-xs font-semibold text-stone-700">Global area<select value={selectedGroup.key} onChange={(event) => navigate(() => setGroupKey(event.target.value))} className={fieldClass}>{globalGroups.map((group) => <option key={group.key} value={group.key}>{group.label}</option>)}</select></label> : <>
            <label className="block space-y-2 text-xs font-semibold text-stone-700">Page<select value={selectedPage.key} onChange={(event) => navigate(() => { const next = pages.find((page) => page.key === event.target.value)!; setPageKey(next.key); setSectionKey(next.sections[0].key); })} className={fieldClass}>{pages.map((page) => <option key={page.key} value={page.key}>{page.label}</option>)}</select></label>
            <label className="block space-y-2 text-xs font-semibold text-stone-700 xl:hidden">Section<select value={registration.key} onChange={(event) => navigate(() => setSectionKey(event.target.value))} className={fieldClass}>{selectedPage.sections.map((section) => <option key={section.key} value={section.key}>{section.label}</option>)}</select></label>
            <nav aria-label="Page sections" className="hidden space-y-1 xl:block">{selectedPage.sections.map((section) => <button key={section.key} type="button" onClick={() => navigate(() => setSectionKey(section.key))} className={`w-full rounded-lg px-3 py-2 text-left text-xs font-semibold ${registration.key === section.key ? "bg-purple-50 text-purple-700" : "text-stone-600 hover:bg-stone-50"}`}>{section.label}</button>)}</nav>
          </>}
          <p className="text-xs leading-relaxed text-stone-500">Only enabled overrides are saved. Resetting a field restores its original SALVORA design.</p>
          <a href={currentPageUrl} target="_blank" rel="noopener noreferrer" className="inline-flex text-xs font-semibold text-purple-700 hover:underline">Open current page ↗</a>
        </aside>

        <section aria-label="Customization controls" className="min-w-0 space-y-4">
          <div className="rounded-2xl border border-stone-200 bg-white p-4"><h2 data-customization-role="sectionHeading" className="text-base font-bold text-stone-900">{tab === "global" ? registration.label : `${selectedPage.label} · ${registration.label}`}</h2><p className="mt-1 text-xs text-stone-500">Text and appearance only. Cards, maps, forms and data remain managed by their existing modules.</p></div>
          {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
          {message && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{message}</div>}
          {loading ? <div className="rounded-2xl border border-stone-200 bg-white p-8 text-sm text-stone-500" role="status">Loading customization…</div> : <fieldset disabled={saving} className="space-y-4">
            {registration.content && Object.keys(registration.content).length > 0 && <div className="rounded-2xl border border-stone-200 bg-white p-4"><h3 className="mb-3 text-sm font-bold text-stone-900">Content</h3><div className="space-y-3">{Object.entries(registration.content).map(([key, defaultValue]) => <OverrideField key={key} definition={{ key, label: CONTENT_LABELS[key as ContentField], kind: "text", defaultValue: defaultValue || "" }} path={`content.${key}`} draft={draft} onChange={change} multiline={key === "description"} />)}</div></div>}
            {registration.styles.map(renderStyle)}
          </fieldset>}
          <div className="sticky bottom-3 z-10 flex flex-wrap justify-between gap-3 rounded-2xl border border-stone-200 bg-white/95 p-4 shadow-lg backdrop-blur-sm">
            <AdminButton variant="secondary" disabled={loading || saving || !Object.keys(saved).length && !Object.keys(draft).length} onClick={() => setResetOpen(true)}>Reset to Default</AdminButton>
            <AdminButton data-customization-role="primaryButton" disabled={loading || !dirty} loading={saving} onClick={() => void save()}>{customization.text("primaryButtonText", "Save Changes")}</AdminButton>
          </div>
        </section>

        <aside className="space-y-3 xl:sticky xl:top-24" aria-label="Live preview">
          <div className="flex flex-wrap items-center justify-between gap-2"><h2 data-customization-role="sectionHeading" className="text-sm font-bold text-stone-900">Live preview</h2><select aria-label="Preview screen size" value={previewSize} onChange={(event) => setPreviewSize(event.target.value as PreviewSize)} className="rounded-lg border border-stone-300 bg-white px-2 py-1.5 text-xs">{(["desktop", "tablet", "mobile"] as const).map((size) => <option key={size} value={size}>{size[0].toUpperCase() + size.slice(1)}</option>)}</select></div>
          <DraftPreview draft={draft} registration={registration} size={previewSize} />
          <p className="text-xs leading-relaxed text-stone-500">Changes here are a local preview until you save. The full page keeps its existing layout and live content.</p>
          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${dirty ? "bg-amber-50 text-amber-800" : "bg-stone-100 text-stone-600"}`}>{dirty ? "Unsaved changes" : "All changes saved"}</span>
        </aside>
      </div>
      <ConfirmModal isOpen={resetOpen} onClose={() => setResetOpen(false)} onConfirm={() => save(true)} title="Reset to the original SALVORA design?" message={`Reset ${tab === "global" ? registration.label : `${selectedPage.label} ${registration.label}`} to its original defaults? This removes only customization overrides for this selection.`} confirmText="Reset to Default" loading={saving} variant="primary" />
    </div>
  );
}
