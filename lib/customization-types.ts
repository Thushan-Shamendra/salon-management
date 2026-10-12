export const CUSTOMIZATION_FONTS = [
  "Geist", "Inter", "Poppins", "DM Sans", "Montserrat", "Roboto",
  "Open Sans", "Lato", "Playfair Display", "Merriweather",
] as const;

export type CustomizationFont = (typeof CUSTOMIZATION_FONTS)[number];
export type CustomizationScope = "public" | "admin";
export type ContentField = "eyebrow" | "heading" | "highlightedText" | "subheading" | "description" | "primaryButtonText" | "secondaryButtonText";
export type GlobalGroupKey = "publicHeader" | "publicWebsite" | "publicFooter" | "adminHeader" | "adminSidebar" | "adminWebsite";

export interface HeadingStyle {
  fontFamily?: CustomizationFont;
  fontSizeDesktop?: number;
  fontSizeTablet?: number;
  fontSizeMobile?: number;
  fontWeight?: number;
  color?: string;
}
export interface DescriptionStyle {
  fontFamily?: CustomizationFont;
  fontSize?: number;
  color?: string;
}
export interface ButtonStyle {
  backgroundColor?: string;
  textColor?: string;
  fontFamily?: CustomizationFont;
  fontSize?: number;
  fontWeight?: number;
  size?: "small" | "medium" | "large";
  borderRadius?: number;
  borderColor?: string;
}
export interface SectionStyle {
  backgroundColor?: string;
  backgroundImage?: { url: string; publicId?: string };
  alignment?: "left" | "center" | "right";
  heading?: HeadingStyle;
  highlightedText?: { color?: string };
  description?: DescriptionStyle;
  primaryButton?: ButtonStyle;
  secondaryButton?: ButtonStyle;
  sectionHeading?: HeadingStyle;
  textColor?: string;
  headingColor?: string;
  headingFont?: CustomizationFont;
  bodyFont?: CustomizationFont;
  activeLinkColor?: string;
  hoverColor?: string;
  linkColor?: string;
  accentColor?: string;
  activeItemBackground?: string;
  activeItemTextColor?: string;
  hoverBackground?: string;
}
export type StyleField = keyof SectionStyle;
export interface SectionOverride {
  content?: Partial<Record<ContentField, string>>;
  style?: SectionStyle;
}
export type PageOverrides = Record<string, SectionOverride>;
export type GlobalOverrides = Partial<Record<GlobalGroupKey, SectionOverride>>;
export interface SectionRegistration {
  key: string;
  label: string;
  content?: Partial<Record<ContentField, string>>;
  styles: StyleField[];
  defaultImage?: string;
}
export interface PageRegistration {
  key: string;
  label: string;
  sections: SectionRegistration[];
}
export interface GlobalRegistration extends SectionRegistration {
  key: GlobalGroupKey;
  scope: CustomizationScope;
}

export const CUSTOMIZATION_FONT_CSS: Record<CustomizationFont, string> = {
  Geist: "var(--font-geist-sans), Arial, sans-serif",
  Inter: "var(--font-custom-inter), Arial, sans-serif",
  Poppins: "var(--font-custom-poppins), Arial, sans-serif",
  "DM Sans": "var(--font-custom-dm-sans), Arial, sans-serif",
  Montserrat: "var(--font-custom-montserrat), Arial, sans-serif",
  Roboto: "var(--font-custom-roboto), Arial, sans-serif",
  "Open Sans": "var(--font-custom-open-sans), Arial, sans-serif",
  Lato: "var(--font-custom-lato), Arial, sans-serif",
  "Playfair Display": "var(--font-custom-playfair), Georgia, serif",
  Merriweather: "var(--font-custom-merriweather), Georgia, serif",
};
