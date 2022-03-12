import React from "react";
import { useRouter } from "next/router";
import { AppProps } from "next/app";
import Head from "next/head";

import { StyleProvider } from "@ledgerhq/react-ui";

import { GlobalStyle } from "../styles/GlobalStyle";

import "modern-normalize";
import LedgerLiveSDKProvider from "../src/providers/LedgerLiveSDKProvider";

export default function MyApp({ Component, pageProps }: AppProps): JSX.Element {
  const router = useRouter();

  // FIXME: make sure "theme" can only be ("dark" | "light" | undefined)
  const theme = router.query.theme as "dark" | "light" | undefined;

  return (
    <>
      <Head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0"
        />
        <title>Ledger Platform Apps</title>
      </Head>
      {/* FIXME: remove local GlobalStyle? Should be handled by ui lib StyleProvider. PS: handle __next div 100% height */}
      <GlobalStyle />
      <StyleProvider selectedPalette={theme} fontsPath="/fonts">
        <LedgerLiveSDKProvider>
          <Component {...pageProps} />
        </LedgerLiveSDKProvider>
      </StyleProvider>
    </>
  );
}
