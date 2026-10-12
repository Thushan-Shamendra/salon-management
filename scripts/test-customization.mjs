import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import ts from "typescript";

// Compile the pure customization modules in memory. Never connect to MongoDB.
const project = process.cwd();
const nativeRequire = createRequire(import.meta.url);
const modules = new Map();
function load(filename) {
  const full = path.resolve(project, filename);
  if (modules.has(full)) return modules.get(full).exports;
  assert(full.startsWith(path.join(project, "lib") + path.sep), "Only pure lib modules may be loaded");
  const source = fs.readFileSync(full, "utf8");
  assert(!/mongoose|connectDB|lib\/mongodb|next\/headers/.test(source), "Tests must not load database or auth modules");
  const mod = { exports: {} };
  modules.set(full, mod);
  const compiled = ts.transpileModule(source, {compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022}}).outputText;
  const localRequire = (name) => name.startsWith(".") ? load(path.relative(project, path.resolve(path.dirname(full), name + (path.extname(name) ? "" : ".ts"))))
    : name.startsWith("@/") ? load(name.slice(2) + ".ts") : nativeRequire(name);
  new Function("require", "module", "exports", compiled)(localRequire, mod, mod.exports);
  return mod.exports;
}

const registry = load("lib/customization-registry.ts");
const validator = load("lib/customization-validation.ts");
const { buildCustomizationCss } = load("lib/customization-styles.ts");
const { CUSTOMIZATION_FONTS } = load("lib/customization-types.ts");
let assertions = 0;
function check(name, action) { action(); assertions++; console.log(`PASS ${name}`); }
const section = {key: "hero", label: "Hero", content: {heading: "Original", primaryButtonText: "Book"}, styles: ["heading", "description", "backgroundColor", "backgroundImage", "alignment", "primaryButton"]};
const validate = (v) => validator.validateSectionOverride(v, section, "salon-management/customization/public/home/hero");
const rejects = (v) => assert.throws(() => validate(v), validator.CustomizationValidationError);

check("All twelve actual public pages are registered", () => assert.deepEqual(registry.publicPages.map(p => p.key).sort(), ["home", "about", "services", "products", "promotions", "wedding", "vendors", "gallery", "reviews", "contact", "privacy", "terms"].sort()));
check("Registration keys are unique and every page supports page styling", () => {
  for (const pages of [registry.publicPages, registry.adminPages]) {
    assert.equal(new Set(pages.map(p => p.key)).size, pages.length);
    for (const p of pages) {
      assert.equal(new Set(p.sections.map(s => s.key)).size, p.sections.length);
      assert(p.sections.some(s => s.key === "page"));
    }
  }
});
check("Zero overrides produce no CSS", () => {
  for (const p of registry.publicPages) assert.equal(buildCustomizationCss("public", p.key, {}, {}), "");
  for (const p of registry.adminPages) assert.equal(buildCustomizationCss("admin", p.key, {}, {}), "");
});
check("Only changed content is stored", () => {
  assert.deepEqual(validate({content: {heading: "Original"}, style: {heading: {}}}), {});
  assert.deepEqual(validate({content: {heading: "Custom"}}), {content: {heading: "Custom"}});
  assert.deepEqual(validate({}), {});
});
check("Unknown content, CSS, structural fields and prototype payloads are rejected", () => {
  for (const v of [{html: "<script>"}, {content: {price: "1"}}, {style: {className: "x"}}, {style: {heading: {letterSpacing: "1em"}}}, {style: {primaryButton: {href: "https://example.com"}}}, JSON.parse('{"__proto__":{"admin":true}}')]) rejects(v);
  rejects(Object.create({style: {backgroundColor: "#fff"}}));
});
check("Text stays plain and bounded", () => { rejects({content: {heading: "<script>alert(1)</script>"}}); rejects({content: {heading: "x".repeat(241)}}); });
check("HEX accepts valid forms and rejects CSS expressions", () => {
  for (const value of ["#fff", "#abcd", "#7c3aed", "#7c3aedff"]) assert.equal(validate({style: {backgroundColor: value}}).style.backgroundColor, value.toUpperCase());
  for (const value of ["red", "url(https://x)", "var(--x)", "expression(x)", "#fff;display:none", "#12"]) rejects({style: {backgroundColor: value}});
});
check("Only approved font families are accepted", () => {
  for (const fontFamily of CUSTOMIZATION_FONTS) assert.equal(validate({style: {heading: {fontFamily}}}).style.heading.fontFamily, fontFamily);
  for (const fontFamily of ["https://example.com/font.css", "Arial;display:none", "Comic Sans"]) rejects({style: {heading: {fontFamily}}});
});
check("Responsive typography and buttons respect limits", () => {
  validate({style: {heading: {fontSizeDesktop: 96, fontSizeTablet: 16, fontSizeMobile: 64, fontWeight: 900}, description: {fontSize: 32}, primaryButton: {fontSize: 24, size: "large", borderRadius: 64}}});
  for (const v of [{heading: {fontSizeDesktop: 0}}, {heading: {fontSizeDesktop: 97}}, {heading: {fontSizeMobile: 65}}, {heading: {fontWeight: 650}}, {description: {fontSize: 33}}, {primaryButton: {fontSize: 25}}, {primaryButton: {size: "huge"}}, {primaryButton: {borderRadius: -1}}]) rejects({style: v});
});
check("Image URLs reject executable, credential and unsafe CSS URLs", () => {
  validate({style: {backgroundImage: {url: "https://example.com/image.webp"}}});
  validate({style: {backgroundImage: {url: "/images/hero-salon.jpg"}}});
  for (const url of ["javascript:alert(1)", "data:image/svg+xml,evil", "http://example.com/img.png", "//example.com/img.png", "https://u:p@example.com/x", "/../secrets", "https://x.com/a');color:red/*"]) rejects({style: {backgroundImage: {url}}});
});
check("Uploaded images stay within the registered section folder", () => {
  validate({style: {backgroundImage: {url: "https://res.cloudinary.com/demo/image/upload/x.webp", publicId: "salon-management/customization/public/home/hero/x"}}});
  rejects({style: {backgroundImage: {url: "https://res.cloudinary.com/demo/image/upload/x.webp", publicId: "salon-management/gallery/x"}}});
  assert(registry.isCustomizationFolder("salon-management/customization/global"));
  assert(!registry.isCustomizationFolder("salon-management/customization/public/unknown/hero"));
  assert(!registry.isCustomizationFolder("salon-management/customization/public/home/../../../gallery"));
});
check("Arbitrary pages, sections and fields cannot be saved", () => {
  for (const args of [["unknown", "home", "hero"], ["public", "not-a-page", "hero"], ["public", "home", "product-cards"]]) assert.throws(() => validator.validatePageSectionOverride(...args, {}), validator.CustomizationValidationError);
  assert.throws(() => validator.validateGlobalOverride("adminSecurity", {}), validator.CustomizationValidationError);
  assert.throws(() => validator.validateGlobalOverride("publicWebsite", {style: {primaryButton: {textColor: "#fff"}}}), validator.CustomizationValidationError);
});
check("CSS precedence is global then page then section", () => {
  const css = buildCustomizationCss("public", "home", {publicWebsite: {style: {backgroundColor: "#111111"}}}, {page: {style: {backgroundColor: "#222222"}}, hero: {style: {backgroundColor: "#333333", heading: {fontSizeDesktop: 80, fontSizeMobile: 40, fontFamily: "Poppins"}}}});
  assert(css.indexOf("#111111") < css.indexOf("#222222"));
  assert(css.indexOf("#222222") < css.indexOf("#333333"));
  assert(css.includes('@media(min-width:1024px)'));
  assert(css.includes('--font-custom-poppins'));
  assert(!css.includes('product-card'));
});
check("Admin title style never targets unmarked stats or tables", () => {
  const css = buildCustomizationCss("admin", "dashboard", {}, {page: {style: {heading: {color: "#123456"}}}});
  assert(css.includes('data-customization-role="heading"'));
  assert(!css.includes('h1') && !css.includes('table') && !css.includes('stat'));
});
check("CSS generator rejects malformed values defensively", () => {
  const css = buildCustomizationCss("public", "home", {publicWebsite: {style: {backgroundColor: "#fff;display:none"}}}, {hero: {style: {heading: {fontSizeDesktop: -100, fontFamily: "unsafe"}, backgroundImage: {url: 'https://x.com/</style><script>'}}}});
  assert.equal(css, "");
});
check("Source integrations preserve visibility, locking and backup isolation", () => {
  const home = fs.readFileSync(path.join(project, "app/page.tsx"), "utf8");
  for (const key of ["products", "promotions", "wedding", "gallery"]) assert(home.includes(`pageVisibility.${key}`));
  for (const p of registry.publicPages) {
    const file = path.join(project, "app", p.key === "home" ? "page.tsx" : `${p.key}/page.tsx`);
    assert(fs.readFileSync(file, "utf8").includes("PageCustomization"), `${p.key} needs server page retrieval`);
  }
  const sidebar = fs.readFileSync(path.join(project, "components/admin/AdminSidebar.tsx"), "utf8");
  assert(sidebar.includes('/admin/customize'));
  for (const p of registry.publicPages) for (const s of p.sections) {
    assert(!/card|chart|table|form-field|map-marker/.test(s.key), `Locked component registered: ${p.key}.${s.key}`);
  }
});
console.log(`\n${assertions} customization checks passed. No database reads or writes.`);
