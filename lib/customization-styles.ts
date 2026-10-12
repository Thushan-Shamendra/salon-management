import {
  CUSTOMIZATION_FONT_CSS,
  type ButtonStyle, type CustomizationScope, type DescriptionStyle,
  type GlobalOverrides, type HeadingStyle, type PageOverrides, type SectionStyle,
} from "./customization-types";

// CSS is generated exclusively from structured, bounded values. Content never enters CSS.
const color = (value?: string) => value && /^#(?:[\da-f]{3}|[\da-f]{4}|[\da-f]{6}|[\da-f]{8})$/i.test(value) ? value : undefined;
const pixels = (value: number | undefined, min: number, max: number) => typeof value === "number" && Number.isFinite(value) && value >= min && value <= max ? `${value}px` : undefined;
const font = (value?: keyof typeof CUSTOMIZATION_FONT_CSS) => value && Object.hasOwn(CUSTOMIZATION_FONT_CSS, value) ? CUSTOMIZATION_FONT_CSS[value] : undefined;
type Declarations = Record<string, string | undefined>;
const rule = (selector: string, values: Declarations) => {
  const declarations = Object.entries(values).filter(([, v]) => v !== undefined).map(([k, v]) => `${k}:${v}!important`).join(";");
  return declarations ? `${selector}{${declarations}}` : "";
};
const weight = (value?: number) => value && Number.isInteger(value) && value >= 100 && value <= 900 && value % 100 === 0 ? String(value) : undefined;
const headingRules = (selector: string, style?: HeadingStyle) => !style ? "" :
  rule(selector, { "font-family": font(style.fontFamily), "font-size": pixels(style.fontSizeMobile, 16, 64), "font-weight": weight(style.fontWeight), color: color(style.color) }) +
  (pixels(style.fontSizeTablet, 16, 96) ? `@media(min-width:768px){${rule(selector, {"font-size": pixels(style.fontSizeTablet, 16, 96)})}}` : "") +
  (pixels(style.fontSizeDesktop, 16, 96) ? `@media(min-width:1024px){${rule(selector, {"font-size": pixels(style.fontSizeDesktop, 16, 96)})}}` : "");
const descriptionRules = (selector: string, style?: DescriptionStyle) => style ? rule(selector, { "font-family": font(style.fontFamily), "font-size": pixels(style.fontSize, 12, 32), color: color(style.color) }) : "";
const buttonRules = (selector: string, style?: ButtonStyle) => {
  if (!style) return "";
  const sizes = {small: "8px 16px", medium: "12px 24px", large: "16px 32px"};
  return rule(selector, {
    "background-color": color(style.backgroundColor), "background-image": color(style.backgroundColor) ? "none" : undefined, color: color(style.textColor),
    "font-family": font(style.fontFamily), "font-size": pixels(style.fontSize, 12, 24),
    "font-weight": weight(style.fontWeight), padding: style.size && Object.hasOwn(sizes, style.size) ? sizes[style.size] : undefined,
    "border-radius": pixels(style.borderRadius, 0, 100), "border-color": color(style.borderColor),
    "border-width": color(style.borderColor) ? "1px" : undefined, "border-style": color(style.borderColor) ? "solid" : undefined,
  });
};
function backgroundRules(selector: string, style?: SectionStyle) {
  if (!style) return "";
  // Images use a fixed URL grammar as well as server validation.
  const url = style.backgroundImage?.url;
  const image = url && (/^https:\/\/[^\s"'<>\\]+$/i.test(url) || /^\/(?!\/)[^\s"'<>\\]+$/.test(url)) ? `url(${JSON.stringify(url)})` : undefined;
  return rule(selector, { "background-color": color(style.backgroundColor), "background-image": image ?? (color(style.backgroundColor) ? "none" : undefined), "background-size": image ? "cover" : undefined, "background-position": image ? "center" : undefined });
}

export function buildCustomizationCss(scope: CustomizationScope, pageKey: string, global: GlobalOverrides = {}, sections: PageOverrides = {}) {
  if (!/^[a-z][a-z0-9-]*$/.test(pageKey)) return "";
  const page = `[data-customization-scope="${scope}"][data-customization-page="${pageKey}"]`;
  const role = (name: string) => `${page} [data-customization-role="${name}"]`;
  const website = (scope === "public" ? global.publicWebsite : global.adminWebsite)?.style;
  const editableText = ["eyebrow", "heading", "highlight", "subheading", "description", "sectionHeading"].map(role).join(",");
  const headings = ["heading", "sectionHeading", "subheading"].map(role).join(",");
  let css = rule(editableText, { color: color(website?.textColor), "font-family": font(website?.bodyFont) });
  css += rule(headings, {color: color(website?.headingColor), "font-family": font(website?.headingFont)});
  const sectionRoots = `${page} [data-customization-section]`;
  css += rule(`${page} > div,${sectionRoots}`, {"background-color": color(website?.backgroundColor)});
  if (scope === "admin") {
    css += rule(`${page} [data-customization-admin-body]`, {color: color(website?.textColor), "font-family": font(website?.bodyFont)});
    css += buttonRules(`${page} [data-customization-admin-primary="true"]`, website?.primaryButton);
  }

  // Page defaults precede individual sections, so the most specific override wins.
  const pageStyle = sections.page?.style;
  css += backgroundRules(`${page} > div,${sectionRoots}`, pageStyle);
  css += rule(editableText, {color: color(pageStyle?.textColor), "font-family": font(pageStyle?.bodyFont)});
  css += rule(headings, {color: color(pageStyle?.headingColor), "font-family": font(pageStyle?.headingFont)});
  css += headingRules(scope === "admin" ? role("heading") : headings, pageStyle?.heading);
  css += headingRules([role("sectionHeading"), role("subheading")].join(","), pageStyle?.sectionHeading);
  css += descriptionRules(role("description"), pageStyle?.description);
  for (const [key, override] of Object.entries(sections)) {
    if (!/^[a-z][a-z0-9-]*$/.test(key)) continue;
    const section = `${page} [data-customization-section="${key}"]`;
    const target = (name: string) => `${section} [data-customization-role="${name}"]`;
    const s = override.style;
    if (!s) continue;
    css += backgroundRules(section, s);
    if (color(s.backgroundColor) && !s.backgroundImage?.url) css += rule(`${target("backgroundImage")},${target("backgroundImage")} ~ div`, {opacity: "0.2"});
    css += rule(section, {"text-align": ["left", "center", "right"].includes(s.alignment || "") ? s.alignment : undefined});
    if (s.alignment) css += rule(["heading", "description", "eyebrow", "subheading"].map(target).join(","), {"text-align": ["left", "center", "right"].includes(s.alignment) ? s.alignment : undefined});
    css += headingRules(target("heading"), s.heading);
    css += headingRules([target("sectionHeading"), target("subheading")].join(","), s.sectionHeading);
    css += rule(target("highlight"), {color: color(s.highlightedText?.color)});
    css += descriptionRules(target("description"), s.description);
    css += buttonRules(target("primaryButton"), s.primaryButton);
    css += buttonRules(target("secondaryButton"), s.secondaryButton);
  }

  const header = `${page} [data-customization-header="${scope}"]`;
  const hs = (scope === "public" ? global.publicHeader : global.adminHeader)?.style;
  css += backgroundRules(header, hs);
  css += rule(`${header},${header} a:not([data-customization-role="primaryButton"]),${header} button:not([data-customization-role="primaryButton"])`, {color: color(hs?.textColor)});
  css += rule(`${header} [data-customization-header-text]`, {color: color(hs?.textColor)});
  css += rule(`${header} [data-customization-active="true"]`, {color: color(hs?.activeLinkColor)});
  css += rule(`${header} [data-customization-active="true"] [data-customization-role="headerAccent"]`, {"background-color": color(hs?.activeLinkColor)});
  css += rule(`${header} a:hover`, {color: color(hs?.hoverColor)});
  css += buttonRules(`${header} [data-customization-role="primaryButton"]`, hs?.primaryButton);
  if (scope === "public") {
    const footer = `${page} [data-customization-footer]`;
    const fs = global.publicFooter?.style;
    css += backgroundRules(footer, fs);
    if (color(fs?.backgroundColor) && !fs?.backgroundImage?.url) css += rule(`${footer} [data-customization-role="backgroundImage"]`, {opacity: "0.2"});
    css += rule(`${footer} [data-customization-role="footerText"]`, {color: color(fs?.textColor)});
    css += rule(`${footer} [data-customization-role="footerHeading"]`, {color: color(fs?.headingColor)});
    css += rule(`${footer} [data-customization-role="footerLink"]`, {color: color(fs?.linkColor)});
    css += rule(`${footer} [data-customization-role="footerAccent"]`, {color: color(fs?.accentColor)});
  } else {
    const sidebar = `${page} [data-customization-sidebar]`;
    const ss = global.adminSidebar?.style;
    css += backgroundRules(sidebar, ss);
    css += rule(`${sidebar},${sidebar} a,${sidebar} button`, {color: color(ss?.textColor)});
    css += rule(`${sidebar} a:hover`, {"background-color": color(ss?.hoverBackground)});
    css += rule(`${sidebar} [data-customization-active="true"]`, {"background-color": color(ss?.activeItemBackground), "background-image": color(ss?.activeItemBackground) ? "none" : undefined, color: color(ss?.activeItemTextColor)});
  }
  return css;
}
