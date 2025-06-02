"use client";
// @flow

import React, { useState, useEffect, useRef, useCallback } from "react";
import styled from "styled-components";
import querystring from "querystring";
import { useApi } from "../Providers/LedgerLiveSDKProvider";

type CoinifyConfig = {
  webviewHost: string;
  host: string;
  url: string;
  partnerId: string;
};

const COINIFY_CONFIG: { [key: string]: CoinifyConfig } = {
  sandbox: {
    webviewHost: "https://platform-app-coinify-staging.vercel.app/?env=sandbox",
    host: "https://trade-ui.sandbox.coinify.com",
    url: "https://trade-ui.sandbox.coinify.com/widget",
    partnerId: "191f0c7f-076d-459f-bf2d-833465bfadc2",
  },
  prod: {
    webviewHost: "https://platform-app-coinify.vercel.app",
    host: "https://trade-ui.coinify.com",
    url: "https://trade-ui.coinify.com/widget",
    partnerId: "191f0c7f-076d-459f-bf2d-833465bfadc2",
  },
};

const CustomIframe = styled.iframe`
  border: none;
  width: 100%;
  height: 100%;
  flex: 1;
  transition: opacity 200ms ease-out;
`;

type CoinifyWidgetConfig = {
  primaryColor: string | null;
  partnerId: string;
  cryptoCurrencies?: string | null;
  defaultFiatCurrency?: string;
  address?: string | null;
  targetPage: string;
  isBuyAmountWithFees?: boolean;
  addressConfirmation?: boolean;
  transferConfirmation?: boolean;
  transferOutMedia?: string | null;
  transferInMedia?: string | null;
  confirmMessages?: boolean;
  buyAmount?: string | null;
  sellAmount?: string | null;
  topLevelDomain?: string;
  partnerContext?: string | null;
};

type Props = {
  accountAddress: string | null;
  currency: string;
  fiatCurrencyId: string | null;
  mode: "onRamp" | "offRamp" | "history";
  cryptoAmount: string | null;
  fiatAmount: string | null;
  language: string | null;
  primaryColor: string | null;
  buySessionId: string | null;
  transferInMedia: string | null;
  transferOutMedia: string | null;
};

const CoinifyWidgetBuy = ({
  accountAddress,
  currency,
  fiatCurrencyId,
  mode,
  fiatAmount,
  cryptoAmount,
  primaryColor,
  transferInMedia,
  transferOutMedia,
  buySessionId = "",
}: Props) => {
  const api = useApi();

  const env = new URLSearchParams(window.location.search).get("env") || "prod";

  const tradeId = useRef(null);
  const [widgetLoaded, setWidgetLoaded] = useState(false);

  const widgetRef: { current: null | HTMLIFrameElement } = useRef(null);
  const partnerContext = { buySessionId };
  const coinifyConfig = COINIFY_CONFIG[env];
  const widgetConfig: CoinifyWidgetConfig = {
    primaryColor,
    partnerId: coinifyConfig.partnerId,
    cryptoCurrencies: currency ? currency : null,
    defaultFiatCurrency: fiatCurrencyId ? fiatCurrencyId : undefined,
    address: accountAddress,
    targetPage: mode,
    topLevelDomain: coinifyConfig.webviewHost.replace("https://", ""),
    partnerContext: JSON.stringify(partnerContext),
  };

  // FIXME: could use switch case?
  if (mode === "onRamp") {
    widgetConfig.transferOutMedia = transferOutMedia;
    widgetConfig.transferInMedia = transferInMedia;
    widgetConfig.confirmMessages = true;
    widgetConfig.buyAmount = fiatAmount;
    widgetConfig.sellAmount = cryptoAmount;
    widgetConfig.isBuyAmountWithFees = true;
  }

  if (mode === "offRamp") {
    widgetConfig.transferInMedia = "blockchain";
    widgetConfig.confirmMessages = true;
    widgetConfig.buyAmount = fiatAmount;
    widgetConfig.sellAmount = cryptoAmount;
  }

  if (mode === "history") {
    widgetConfig.transferOutMedia = "";
    widgetConfig.transferInMedia = "";
  }

  useEffect(() => {
    if (!currency) return;
    if (mode === "onRamp" && accountAddress) {
      console.log(`Coinify Start OnRamp Widget | currencyName: ${currency}`);
    }
    if (mode === "offRamp" && accountAddress) {
      console.log(`Coinify Start OffRamp Widget | currencyName: ${currency}`);
    }
    if (mode === "history") {
      console.log("Coinify Start History Widget");
    }
  }, [accountAddress, currency, mode]);

  const url = `${coinifyConfig.url}?${querystring.stringify(widgetConfig)}`;

  const handleOnResultBuy = useCallback(
    (address: string) => {
      if (
        !widgetRef?.current?.contentWindow ||
        !accountAddress ||
        mode !== "onRamp"
      ) {
        return;
      }

      widgetRef.current.contentWindow.postMessage(
        {
          type: "event",
          event: "trade.confirm-trade-prepared",
          context: {
            address,
            confirmed: true,
            partnerContext: {
              buySessionId,
            },
          },
        },
        coinifyConfig.host
      );
      if (currency) {
        console.log(`Coinify Confirm OnRamp End | currencyName: ${currency}`);
      }
    },
    [coinifyConfig.host, currency, accountAddress, mode, buySessionId]
  );

  const handleOnResult = useCallback(() => {
    if (widgetRef?.current?.contentWindow) {
      if (accountAddress && mode === "onRamp") {
        widgetRef.current.contentWindow.postMessage(
          {
            type: "event",
            event: "trade.confirm-trade-prepared",
            context: {
              address: accountAddress,
              confirmed: true,
              partnerContext: {
                buySessionId,
              },
            },
          },
          coinifyConfig.host
        );
        if (currency) {
          console.log(`Coinify Confirm Buy End | currencyName: ${currency}`);
        }
      }
      if (tradeId.current && mode === "offRamp") {
        widgetRef.current.contentWindow.postMessage(
          {
            type: "event",
            event: "trade.confirm-trade-created",
            context: {
              confirmed: true,
              transferInitiated: true,
              tradeId: tradeId.current,
            },
          },
          coinifyConfig.host
        );
        if (currency) {
          console.log(`Coinify Confirm Sell End | currencyName: ${currency}`);
        }
      }
    }
  }, [coinifyConfig.host, currency, accountAddress, mode, buySessionId]);

  const handleOnCancel = useCallback(() => {
    if (widgetRef?.current?.contentWindow) {
      if (mode === "onRamp" && accountAddress) {
        widgetRef.current.contentWindow.postMessage(
          {
            type: "event",
            event: "trade.confirm-trade-prepared",
            context: {
              address: accountAddress,
              confirmed: false,
              partnerContext: {
                buySessionId,
              },
            },
          },
          coinifyConfig.host
        );
      }
      if (mode === "offRamp") {
        widgetRef.current.contentWindow.postMessage(
          {
            type: "event",
            event: "trade.confirm-trade-created",
            context: {
              confirmed: false,
            },
          },
          coinifyConfig.host
        );
      }
    }
  }, [coinifyConfig.host, accountAddress, mode, buySessionId]);

  useEffect(() => {
    if (!accountAddress) return;

    function onMessage(e: any) {
      if (!e.isTrusted || e.origin !== coinifyConfig.host || !e.data) return;
      const { type, event, context } = e.data;

      if (type !== "event") return;
      switch (event) {
        case "trade.trade-created":
          tradeId.current = context.id;
          if (mode === "onRamp" && widgetRef.current?.contentWindow) {
            widgetRef.current.contentWindow.postMessage(
              {
                type: "event",
                event: "trade.confirm-trade-created",
                context: {
                  confirmed: true,
                  tradeId: tradeId.current,
                  partnerContext: {
                    buySessionId,
                  },
                },
              },
              coinifyConfig.host
            );
          }
          break;
        case "trade.trade-prepared":
          break;
        case "trade.receive-account-changed":
          if (accountAddress && context.address === accountAddress) {
            // FIXME: VERIFY ADDRESS

            // FIXME: handle cancel / error
            handleOnResultBuy(accountAddress);

            if (currency) {
              console.log(
                `Coinify Confirm Buy Start | currencyName: ${currency}`
              );
            }
          } else {
            // Address mismatch, potential attack
          }
          break;
        case "trade.trade-placed":
          if (currency) {
            console.log(
              `Coinify Widget Event Trade Placed | currencyName: ${currency}`
            );
          }
          break;
      }
    }

    window.addEventListener("message", onMessage, false);
    return () => window.removeEventListener("message", onMessage, false);
  }, [
    accountAddress,
    coinifyConfig,
    currency,
    handleOnCancel,
    handleOnResult,
    handleOnResultBuy,
    mode,
    api,
    buySessionId,
  ]);

  return (
    <CustomIframe
      src={url}
      ref={widgetRef}
      style={{ opacity: widgetLoaded ? 1 : 0 }}
      onLoad={() => setTimeout(() => setWidgetLoaded(true), 500)}
      allow="camera;payment"
    />
  );
};

export default CoinifyWidgetBuy;
