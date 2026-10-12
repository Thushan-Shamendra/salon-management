import { getGlobalCustomization, getPageCustomizations } from "@/lib/customization";
import { CustomizationProvider } from "./CustomizationProvider";
import type { CustomizationScope, GlobalOverrides } from "@/lib/customization-types";
import type { ReactNode } from "react";

export async function PageCustomization({scope, pageKey, children}: {scope: CustomizationScope; pageKey: string; children: ReactNode}) {
  const [allGlobal, sections] = await Promise.all([getGlobalCustomization(), getPageCustomizations(scope, pageKey)]);
  // Never serialize admin presentation values onto public pages.
  const global: GlobalOverrides = scope === "public" ? {
    publicHeader: allGlobal.publicHeader,
    publicWebsite: allGlobal.publicWebsite,
    publicFooter: allGlobal.publicFooter,
  } : {
    adminHeader: allGlobal.adminHeader,
    adminSidebar: allGlobal.adminSidebar,
    adminWebsite: allGlobal.adminWebsite,
  };
  return <CustomizationProvider scope={scope} pageKey={pageKey} global={global} sections={sections}>{children}</CustomizationProvider>;
}

export default PageCustomization;
