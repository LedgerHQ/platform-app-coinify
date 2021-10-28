// @flow

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { BigNumber } from "bignumber.js";
import styled, { useTheme } from "styled-components";
import querystring from "querystring";
import LedgerLiveApi, {
  BitcoinTransaction,
  ExchangeType,
  FAMILIES,
  FeesLevel,
  WindowMessageTransport,
} from "@ledgerhq/live-app-sdk";
import type { Account, Currency, Unit } from "@ledgerhq/live-app-sdk";

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
  address?: string | null;
  targetPage: string;
  addressConfirmation?: boolean;
  transferConfirmation?: boolean;
  transferOutMedia?: string;
  transferInMedia?: string;
  confirmMessages?: boolean;
};

type Props = {
  account: Account;
  currency: Currency;
  mode: string;
};

const CoinifyWidget = ({ account, currency, mode }: Props) => {
  const api = useRef<LedgerLiveApi>();

  const env = useMemo(
    () => new URLSearchParams(window.location.search).get("env") || "prod",
    [window.location]
  );

  const tradeId = useRef(null);
  const [widgetLoaded, setWidgetLoaded] = useState(false);
  const { colors } = useTheme();
  const widgetRef: { current: null | HTMLIFrameElement } = useRef(null);

  const coinifyConfig = COINIFY_CONFIG[env];
  const widgetConfig: CoinifyWidgetConfig = {
    primaryColor: colors.primary,
    partnerId: coinifyConfig.partnerId,
    cryptoCurrencies: currency ? currency.ticker : null,
    address: account.address,
    targetPage: mode,
  };

  // FIXME: could use switch case?
  if (mode === "buy") {
    widgetConfig.transferOutMedia = "blockchain";
    widgetConfig.confirmMessages = true;
  }

  if (mode === "sell") {
    widgetConfig.transferInMedia = "blockchain";
    widgetConfig.confirmMessages = true;
  }

  if (mode === "trade-history") {
    widgetConfig.transferOutMedia = "";
    widgetConfig.transferInMedia = "";
  }

  useEffect(() => {
    if (!currency) return;
    if (mode === "buy" && account) {
      console.log(`Coinify Start Buy Widget | currencyName: ${currency.name}`);
    }
    if (mode === "sell" && account) {
      console.log(`Coinify Start Sell Widget | currencyName: ${currency.name}`);
    }
    if (mode === "trade-history") {
      console.log("Coinify Start History Widget");
    }
  }, [account, currency, mode]);

  useEffect(() => {
    const llapi = new LedgerLiveApi(new WindowMessageTransport());

    llapi.connect();
    api.current = llapi;

    return () => {
      api.current = undefined;
      void llapi.disconnect();
    };
  }, []);

  const url = `${coinifyConfig.url}?${querystring.stringify(widgetConfig)}`;

  const handleOnResultBuy = useCallback(
    (address: string) => {
      if (!widgetRef?.current?.contentWindow || !account || mode !== "buy") {
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
        console.log(`Coinify Confirm Buy End | currencyName: ${currency.name}`);
      }
    },
    [coinifyConfig.host, currency, account, mode]
  );

  const handleOnResult = useCallback(() => {
    if (widgetRef?.current?.contentWindow) {
      if (account && mode === "buy") {
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
      if (tradeId.current && mode === "sell") {
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
      if (mode === "buy" && account) {
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
      if (mode === "sell") {
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

  const initSellFlow = async () => {
    if (!api.current) {
      console.error("NO LL-API");
      throw new Error("NO LL-API");
    }

    const nonce = await api.current
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

    const signedTx = await api.current
      .completeExchange({
        provider: "coinify",
        fromAccountId: account.id,
        transaction: tx,
        binaryPayload: coinifyContext.providerSig.payload,
        signature: coinifyContext.providerSig.signature,
        feesStrategy: FeesLevel.Medium,
        exchangeType: ExchangeType.SELL,
      })
      .catch((e) => {
        throw e;
      });

    // signedTx is not actually used by the widget
    return signedTx;
  };

  useEffect(() => {
    if (!account) return;

    function onMessage(e: any) {
      if (!e.isTrusted || e.origin !== coinifyConfig.host || !e.data) return;
      const { type, event, context } = e.data;

      if (type !== "event") return;
      switch (event) {
        case "trade.trade-created":
          tradeId.current = context.id;
          if (mode === "buy" && widgetRef.current?.contentWindow) {
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
          if (mode === "sell" && currency) {
            initSellFlow().then(handleOnResult).catch(handleOnCancel);
          }
          break;
        case "trade.receive-account-changed":
          if (account && context.address === account.address) {
            // FIXME: VERIFY ADDRESS
            if (!api.current) {
              console.error("NO LL-API");
              return;
            }

            // FIXME: handle cancel / error
            api.current
              .receive(account.id)
              .then((verifiedAddress) => handleOnResultBuy(verifiedAddress));

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
    account,
    mode,
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
