"use client";

import { StyleProvider } from "@ledgerhq/react-ui/index";
import { useSearchParams } from "next/navigation";
import LedgerLiveSDKProvider from "./LedgerLiveSDKProvider";
import StyledComponentsRegistry from "@/lib/registry";

const Providers = ({ children }: { children: React.ReactNode }) => {
  const searchParams = useSearchParams();

  // FIXME: make sure "theme" can only be ("dark" | "light" | undefined)
  const theme = searchParams.get("theme") as "dark" | "light" | undefined;

  return (
    <StyledComponentsRegistry>
      <StyleProvider selectedPalette={theme} fontsPath="/fonts">
        <LedgerLiveSDKProvider>{children}</LedgerLiveSDKProvider>
      </StyleProvider>
    </StyledComponentsRegistry>
  );
};

export default Providers;
