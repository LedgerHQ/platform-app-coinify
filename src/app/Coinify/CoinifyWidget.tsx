"use client";

// @flow

import React, { useState, useEffect, useRef, useCallback } from "react";
import * as Sentry from "@sentry/nextjs";

import styled from "styled-components";
import querystring from "querystring";
import type { Account } from "@ledgerhq/wallet-api-client";
import { ExchangeSDK } from "@ledgerhq/exchange-sdk";
import BigNumber from "bignumber.js";
import { useApi } from "../Providers/LedgerLiveSDKProvider";
import { GetSellPayload } from "@ledgerhq/exchange-sdk/dist/types/sdk.types";

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
  addressConfirmation?: boolean;
  transferConfirmation?: boolean;
  transferOutMedia?: string | null;
  transferInMedia?: string | null;
  confirmMessages?: boolean;
  buyAmount?: string | null;
  sellAmount?: string | null;
  partnerContext?: string | null;
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
  transferInMedia: string | null;
  transferOutMedia: string | null;
};

interface CoinifyContext {
  id: number;
  trackingId: string;
  state: string;
  traderId: number;
  traderEmail: string;
  inAmount: number;
  inCurrency: string;
  outCurrency: string;
  outAmountExpected: number;
  transferIn: TransferIn;
  transferOut: TransferOut;
  createTime: string; // ISO 8601 timestamp
  updateTime: string; // ISO 8601 timestamp
  isPriceQuoteApproximate: boolean;
  quoteExpireTime: string; // ISO 8601 timestamp
  providerSig: ProviderSignature;
  partnerContext: PartnerContext;
}

interface TransferIn {
  id: number;
  sendAmount: number;
  receiveAmount: number;
  currency: string;
  medium: string;
  details: TransferInDetails;
}

interface TransferInDetails {
  account: string;
  paymentUri: string;
}

interface TransferOut {
  id: number;
  sendAmount: number;
  receiveAmount: number;
  currency: string;
  medium: string;
  details: TransferOutDetails;
  mediumReceiveAccountId: number;
}

interface TransferOutDetails {
  account: BankAccount;
  bank: BankDetails;
  holder: HolderDetails;
}

interface BankAccount {
  bic: string;
  currency: string;
  number: string;
}

interface BankDetails {
  address: Address;
  name: string | null;
}

interface HolderDetails {
  address: Address;
  name: string;
}

interface Address {
  city?: string;
  country: string;
  state?: string | null;
  street?: string;
  zipcode?: string;
}

interface ProviderSignature {
  payload: string;
  header: SignatureHeader;
  signature: string;
}

interface SignatureHeader {
  alg: string;
  kid: string;
}

interface PartnerContext {
  nonce: string;
}

const CoinifyWidget = ({
  account,
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
  const api: ExchangeSDK = useApi();

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
    defaultFiatCurrency: fiatCurrencyId ? fiatCurrencyId : null,
    address: account.address,
    targetPage: mode,
    partnerContext: JSON.stringify(partnerContext),
  };

  // FIXME: could use switch case?
  if (mode === "onRamp") {
    widgetConfig.transferOutMedia = transferOutMedia;
    widgetConfig.transferInMedia = transferInMedia;
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
  }, [coinifyConfig.host, account, mode, buySessionId]);

  const setTransactionId = useCallback(
    (
      txId: string
    ): Promise<CoinifyContext> => {
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

  const initSellFlow = useCallback(async ({ rate }: { rate: number }) => {
    const getSellPayload: GetSellPayload = async (nonce: string) => {
      const coinifyContext = await setTransactionId(nonce);

      return {
        recipientAddress: (coinifyContext.transferIn as any).details.account,
        amount: new BigNumber(coinifyContext.inAmount),
        binaryPayload: coinifyContext.providerSig.payload,
        signature: Buffer.from(coinifyContext.providerSig.signature, "base64"),
        beData: {
          inAmount: coinifyContext.inAmount,
          outAmount: coinifyContext.outAmountExpected,
        }
      };
    };
    try {
      await api.sell({
        fromAccountId: account.id,
        fromAmount: new BigNumber(0),
        feeStrategy: "medium",
        rate,
        getSellPayload,
      });
    } catch (error) {
      Sentry.captureException(error);
      console.error(error);
    }
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
          if (mode === "offRamp" && currency) {
            initSellFlow({ rate: context.quoteAmount / context.baseAmount }).then(handleOnResult).catch(handleOnCancel);
          }
          break;
        case "trade.receive-account-changed":
          if (account && context.address === account.address) {
            // FIXME: VERIFY ADDRESS

            // FIXME: handle cancel / error
            api.walletAPI.account
              .receive(account.id)
              .then((verifiedAddress) => handleOnResultBuy(verifiedAddress))
              .catch((error: unknown) => {
                Sentry.captureException(error);
                console.error(error);
              });

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
    buySessionId,
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
