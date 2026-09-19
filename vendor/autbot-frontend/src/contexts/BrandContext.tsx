import { createContext, useContext, useMemo } from "react";

type BrandName = "autbot" | "titia";

interface BrandContextValue {
  brand: BrandName;
  appName: string;
  assistantName: string;
  logoSrc: string;
  homePath: string;
  footerText: string;
  returnUrl?: string;
}

const BrandContext = createContext<BrandContextValue>({
  brand: "autbot",
  appName: "AutBot",
  assistantName: "AutBot",
  logoSrc: "/AutBot_Logo.png",
  homePath: "/",
  footerText: "",
  returnUrl: undefined,
});

export function BrandProvider({
  children,
  brand,
}: {
  children: React.ReactNode;
  brand: BrandName;
}) {
  const value = useMemo<BrandContextValue>(() => {
    if (brand === "titia") {
      const query = new URLSearchParams(window.location.search);
      return {
        brand,
        appName: "TitiA",
        assistantName: "TitiA",
        logoSrc: "/AutBot_Logo.png",
        homePath: "/sso/conta-comigo",
        footerText: "TitiA (made with AutBot)",
        returnUrl: query.get("returnUrl") || undefined,
      };
    }

    return {
      brand,
      appName: "AutBot",
      assistantName: "AutBot",
      logoSrc: "/AutBot_Logo.png",
      homePath: "/",
      footerText: "",
      returnUrl: undefined,
    };
  }, [brand]);

  return <BrandContext.Provider value={value}>{children}</BrandContext.Provider>;
}

export function useBrand() {
  return useContext(BrandContext);
}
