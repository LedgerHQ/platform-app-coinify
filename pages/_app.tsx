import React from "react";
import { useRouter } from "next/router";
import { AppProps } from "next/app";
import Head from "next/head";

import { StyleProvider } from "@ledgerhq/react-ui";

import { GlobalStyle } from "../styles/GlobalStyle";

import "modern-normalize";

export default function MyApp({ Component, pageProps }: AppProps): JSX.Element {
  const router = useRouter();

  // FIXME: make sure "theme" can only be ("dark" | "light" | undefined)
  const { theme } = router.query;

  return (
    <>
      <Head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0"
        />
        <title>Ledger Platform Apps</title>
        {/* FIXME: fonts should be useless here, already handled by ui lib */}
        <link rel="preconnect" href="https://fonts.gstatic.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </Head>
      {/* FIXME: remove local GlobalStyle? Should be handled by ui lib StyleProvider. PS: handle __next div 100% height */}
      <GlobalStyle />
      <StyleProvider selectedPalette={theme}>
        <Component {...pageProps} />
      </StyleProvider>
    </>
  );
}
