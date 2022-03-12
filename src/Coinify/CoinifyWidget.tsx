// @flow

import React, { useState, useEffect, useRef, useCallback } from "react";
import { BigNumber } from "bignumber.js";
import styled from "styled-components";
import querystring from "querystring";
import {
  BitcoinTransaction,
  ExchangeType,
  FAMILIES,
  FeesLevel,
} from "@ledgerhq/live-app-sdk";
import type { Account, Currency, Unit } from "@ledgerhq/live-app-sdk";
import { useApi } from "../providers/LedgerLiveSDKProvider";

const parseCurrencyUnit = (unit: Unit, valueString: string): BigNumber => {
  const str = valueString.replace(/,/g, ".");
  const value = new BigNumber(str);
  if (value.isNaN()) return new BigNumber(0);
  return value.times(new BigNumber(10).pow(unit.magnitude)).integerValue();
};

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
  primaryColor?: string;
  partnerId: string;
  cryptoCurrencies?: string | null;
  defaultFiatCurrency?: string;
  address?: string | null;
  targetPage: string;
  addressConfirmation?: boolean;
  transferConfirmation?: boolean;
  transferOutMedia?: string;
  transferInMedia?: string;
  confirmMessages?: boolean;
  buyAmount?: string;
  sellAmount?: string;
};

type Props = {
  account: Account;
  currency: Currency;
  fiatCurrencyId?: string;
  mode: "onRamp" | "offRamp" | "history";
  cryptoAmount?: string;
  fiatAmount?: string;
  language?: string;
  primaryColor?: string;
};

const CoinifyWidget = ({
  account,
  currency,
  fiatCurrencyId,
  mode,
  fiatAmount,
  cryptoAmount,
  primaryColor,
}: Props) => {
  const api = useApi();

  const env = new URLSearchParams(window.location.search).get("env") || "prod";

  const tradeId = useRef(null);
  const [widgetLoaded, setWidgetLoaded] = useState(false);

  const widgetRef: { current: null | HTMLIFrameElement } = useRef(null);

  const coinifyConfig = COINIFY_CONFIG[env];
  const widgetConfig: CoinifyWidgetConfig = {
    primaryColor,
    partnerId: coinifyConfig.partnerId,
    cryptoCurrencies: currency ? currency.ticker : null,
    defaultFiatCurrency: fiatCurrencyId ? fiatCurrencyId : undefined,
    address: account.address,
    targetPage: mode,
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
      console.log(
        `Coinify Start OnRamp Widget | currencyName: ${currency.name}`
      );
    }
    if (mode === "offRamp" && account) {
      console.log(
        `Coinify Start OffRamp Widget | currencyName: ${currency.name}`
      );
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
          },
        },
        coinifyConfig.host
      );
      if (currency) {
        console.log(
          `Coinify Confirm OnRamp End | currencyName: ${currency.name}`
        );
      }
    },
    [coinifyConfig.host, currency, account, mode]
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
            },
          },
          coinifyConfig.host
        );
        if (currency) {
          console.log(
            `Coinify Confirm Buy End | currencyName: ${currency.name}`
          );
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
          console.log(
            `Coinify Confirm Sell End | currencyName: ${currency.name}`
          );
        }
      }
    }
  }, [coinifyConfig.host, currency, account, mode]);

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
    (txId) => {
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
        }
        if (widgetRef.current?.contentWindow) {
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
    const nonce = await api
      .startExchange({
        exchangeType: ExchangeType.SELL,
      })
      .catch((e) => {
        throw e;
      });

    const coinifyContext: any = await setTransactionId(nonce);

    const tx: BitcoinTransaction = {
      family: FAMILIES.BITCOIN,
      amount: parseCurrencyUnit(
        currency.units[0],
        coinifyContext.inAmount.toString(10)
      ),
      recipient: coinifyContext.transferIn.details.account,
    };

    const signedTx = await api
      .completeExchange({
        provider: "coinify",
        fromAccountId: account.id,
        transaction: tx,
        binaryPayload: Buffer.from(coinifyContext.providerSig.payload, "ascii"),
        signature: Buffer.from(coinifyContext.providerSig.signature, "base64"),
        feesStrategy: FeesLevel.Medium,
        exchangeType: ExchangeType.SELL,
      })
      .catch((e) => {
        throw e;
      });

    // signedTx is not actually used by the widget
    return signedTx;
  }, [account.id, api, currency.units, setTransactionId]);

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
            api
              .receive(account.id)
              .then((verifiedAddress) => handleOnResultBuy(verifiedAddress))
              .catch((error: unknown) => console.error(error));

            if (currency) {
              console.log(
                `Coinify Confirm Buy Start | currencyName: ${currency.name}`
              );
            }
          } else {
            // Address mismatch, potential attack
          }
          break;
        case "trade.trade-placed":
          if (currency) {
            console.log(
              `Coinify Widget Event Trade Placed | currencyName: ${currency.name}`
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
