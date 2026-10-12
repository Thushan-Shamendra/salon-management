import { Inter, Poppins, DM_Sans, Montserrat, Roboto, Open_Sans, Lato, Playfair_Display, Merriweather } from "next/font/google";

// Only these bundled, self-hosted fonts are available to the editor.
const inter = Inter({subsets: ["latin"], variable: "--font-custom-inter", display: "swap", preload: false});
const poppins = Poppins({subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--font-custom-poppins", display: "swap", preload: false});
const dmSans = DM_Sans({subsets: ["latin"], variable: "--font-custom-dm-sans", display: "swap", preload: false});
const montserrat = Montserrat({subsets: ["latin"], variable: "--font-custom-montserrat", display: "swap", preload: false});
const roboto = Roboto({subsets: ["latin"], variable: "--font-custom-roboto", display: "swap", preload: false});
const openSans = Open_Sans({subsets: ["latin"], variable: "--font-custom-open-sans", display: "swap", preload: false});
const lato = Lato({subsets: ["latin"], weight: ["400", "700", "900"], variable: "--font-custom-lato", display: "swap", preload: false});
const playfair = Playfair_Display({subsets: ["latin"], variable: "--font-custom-playfair", display: "swap", preload: false});
const merriweather = Merriweather({subsets: ["latin"], variable: "--font-custom-merriweather", display: "swap", preload: false});

export const customizationFontVariables = [inter, poppins, dmSans, montserrat, roboto, openSans, lato, playfair, merriweather].map(f => f.variable).join(" ");
