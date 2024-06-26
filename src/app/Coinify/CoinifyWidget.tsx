"use client";

// @flow

import React, { useState, useEffect, useRef, useCallback } from "react";
import styled from "styled-components";
import querystring from "querystring";
import type { Account } from "@ledgerhq/wallet-api-client";
import { ExchangeSDK } from "@ledgerhq/exchange-sdk";
import BigNumber from "bignumber.js";
import { useApi } from "../Providers/LedgerLiveSDKProvider";

type CoinifyConfig = {
  host: string;
  url: string;
  partnerId: string;
};

const COINIFY_CONFIG: { [key: string]: CoinifyConfig } = {
  sandbox: {
    host: "https://trade-ui.sandbox.coinify.com",
    url: "https://trade-ui.sandbox.coinify.com/widget",
    partnerId: "191f0c7f-076d-459f-bf2d-833465bfadc2",
  },
  prod: {
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
  defaultFiatCurrency: string | null;
  address?: string | null;
  targetPage: string;
  buySessionId: string | null;
  addressConfirmation?: boolean;
  transferConfirmation?: boolean;
  transferOutMedia?: string;
  transferInMedia?: string;
  confirmMessages?: boolean;
  buyAmount?: string | null;
  sellAmount?: string | null;
};

type Props = {
  account: Account;
  currency: string;
  fiatCurrencyId: string | null;
  mode: "onRamp" | "offRamp" | "history";
  cryptoAmount: string | null;
  fiatAmount: string | null;
  language: string | null;
  primaryColor: string | null;
  buySessionId: string | null;
};

const CoinifyWidget = ({
  account,
  currency,
  fiatCurrencyId,
  mode,
  fiatAmount,
  cryptoAmount,
  primaryColor,
  buySessionId = null,
}: Props) => {
  const api: ExchangeSDK = useApi();

  const env = new URLSearchParams(window.location.search).get("env") || "prod";

  const tradeId = useRef(null);
  const [widgetLoaded, setWidgetLoaded] = useState(false);

  const widgetRef: { current: null | HTMLIFrameElement } = useRef(null);

  const coinifyConfig = COINIFY_CONFIG[env];
  const widgetConfig: CoinifyWidgetConfig = {
    primaryColor,
    partnerId: coinifyConfig.partnerId,
    cryptoCurrencies: currency ? currency : null,
    defaultFiatCurrency: fiatCurrencyId ? fiatCurrencyId : null,
    address: account.address,
    targetPage: mode,
    buySessionId,
  };

  // FIXME: could use switch case?
  if (mode === "onRamp") {
    widgetConfig.transferOutMedia = "blockchain";
    widgetConfig.confirmMessages = true;
    widgetConfig.buyAmount = fiatAmount;
    widgetConfig.sellAmount = cryptoAmount;
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
    if (mode === "onRamp" && account) {
      console.log(`Coinify Start OnRamp Widget | currencyName: ${currency}`);
    }
    if (mode === "offRamp" && account) {
      console.log(`Coinify Start OffRamp Widget | currencyName: ${currency}`);
    }
    if (mode === "history") {
      console.log("Coinify Start History Widget");
    }
  }, [account, currency, mode]);

  const url = `${coinifyConfig.url}?${querystring.stringify(widgetConfig)}`;

  const handleOnResultBuy = useCallback(
    (address: string) => {
      if (!widgetRef?.current?.contentWindow || !account || mode !== "onRamp") {
        return;
      }

      widgetRef.current.contentWindow.postMessage(
        {
          type: "event",
          event: "trade.confirm-trade-prepared",
          context: {
            address,
            confirmed: true,
            buySessionId,
          },
        },
        coinifyConfig.host
      );
      if (currency) {
        console.log(`Coinify Confirm OnRamp End | currencyName: ${currency}`);
      }
    },
    [coinifyConfig.host, currency, account, mode, buySessionId]
  );

  const handleOnResult = useCallback(() => {
    if (widgetRef?.current?.contentWindow) {
      if (account && mode === "onRamp") {
        widgetRef.current.contentWindow.postMessage(
          {
            type: "event",
            event: "trade.confirm-trade-prepared",
            context: {
              address: account.address,
              confirmed: true,
              buySessionId,
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
  }, [coinifyConfig.host, currency, account, mode, buySessionId]);

  const handleOnCancel = useCallback(() => {
    if (widgetRef?.current?.contentWindow) {
      if (mode === "onRamp" && account) {
        widgetRef.current.contentWindow.postMessage(
          {
            type: "event",
            event: "trade.confirm-trade-prepared",
            context: {
              address: account.address,
              confirmed: false,
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
  }, [coinifyConfig.host, account, mode]);

  const setTransactionId = useCallback(
    (
      txId: string
    ): Promise<{
      inAmount: number;
      transferIn: unknown;
      providerSig: {
        payload: string;
        signature: string;
      };
    }> => {
      return new Promise((resolve) => {
        const onReply = (e: any) => {
          if (!e.isTrusted || e.origin !== coinifyConfig.host || !e.data)
            return;
          const { type, event, context } = e.data;

          if (type === "event" && event === "trade.trade-created") {
            resolve(context);
          }
        };

        window.addEventListener("message", onReply, { once: true });

        if (widgetRef.current?.contentWindow) {
          widgetRef.current.contentWindow.postMessage(
            {
              type: "event",
              event: "settings.partner-context-changed",
              context: {
                partnerContext: {
                  nonce: txId,
                },
              },
            },
            coinifyConfig.host
          );

          widgetRef.current.contentWindow.postMessage(
            {
              type: "event",
              event: "trade.confirm-trade-prepared",
              context: {
                confirmed: true,
              },
            },
            coinifyConfig.host
          );
        }
      });
    },
    [coinifyConfig]
  );

  const initSellFlow = useCallback(async () => {
    const getSellPayload = async (nonce: string) => {
      const coinifyContext = await setTransactionId(nonce);

      return {
        recipientAddress: (coinifyContext.transferIn as any).details.account,
        amount: new BigNumber(coinifyContext.inAmount),
        binaryPayload: Buffer.from(coinifyContext.providerSig.payload, "ascii"),
        signature: Buffer.from(coinifyContext.providerSig.signature, "base64"),
      };
    };
    await api.sell({
      accountId: account.id,
      amount: new BigNumber(0),
      feeStrategy: "MEDIUM",
      getSellPayload,
    });
  }, [account.id, api, setTransactionId]);

  useEffect(() => {
    if (!account) return;

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
                  buySessionId,
                },
              },
              coinifyConfig.host
            );
          }
          break;
        case "trade.trade-prepared":
          if (mode === "offRamp" && currency) {
            initSellFlow().then(handleOnResult).catch(handleOnCancel);
          }
          break;
        case "trade.receive-account-changed":
          if (account && context.address === account.address) {
            // FIXME: VERIFY ADDRESS

            // FIXME: handle cancel / error
            api.walletAPI.account
              .receive(account.id)
              .then((verifiedAddress) => handleOnResultBuy(verifiedAddress))
              .catch((error: unknown) => console.error(error));

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
    account,
    coinifyConfig,
    currency,
    handleOnCancel,
    handleOnResult,
    handleOnResultBuy,
    initSellFlow,
    mode,
    api,
  ]);

  return (
    <CustomIframe
      src={url}
      ref={widgetRef}
      style={{ opacity: widgetLoaded ? 1 : 0 }}
      onLoad={() => setTimeout(() => setWidgetLoaded(true), 500)}
      allow="camera"
    />
  );
};

export default CoinifyWidget;
