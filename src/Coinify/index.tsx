import React, { useState, useCallback, useRef, useEffect } from "react";

import styled from "styled-components";

import LedgerLiveApi, { WindowMessageTransport } from "@ledgerhq/live-app-sdk";
import type { Account, Currency } from "@ledgerhq/live-app-sdk";

import Button from "../components/Button";
import CoinifyWidget from "./CoinifyWidget";

const Layout = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const Header = styled.div``;

const Content = styled.div`
  flex: auto;
  align-items: center;
  justify-content: center;
  display: flex;
`;

const Footer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

type Modes = "buy" | "sell";

const SELECTABLE_CURRENCIES_BUY = [
  "bitcoin",
  "ethereum",
  "polkadot",
  "litecoin",
  "dogecoin",
  "bitcoin_cash",
  "stellar",
  "ethereum/erc20/usd_tether__erc20_",
  "ethereum/erc20/celsius",
  "ethereum/erc20/compound",
  "ethereum/erc20/makerdao",
  "ethereum/erc20/uniswap",
  "ethereum/erc20/link_chainlink",
];

const SELECTABLE_CURRENCIES_SELL = ["bitcoin"];

const Coinify = () => {
  const api = useRef<LedgerLiveApi>();

  const [selectedMode, setSelectedMode] = useState<Modes>("buy");
  const [currencies, setCurrencies] = useState<Currency[]>();
  const [selectedAccount, setSelectedAccount] = useState<Account>();
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>();

  const onReset = useCallback(() => setSelectedAccount(undefined), []);

  useEffect(() => {
    const llapi = new LedgerLiveApi(new WindowMessageTransport());

    llapi.connect();
    llapi
      .listCurrencies()
      .then((currencies) => setCurrencies(currencies))
      .then(() => {
        api.current = llapi;
      });

    return () => {
      api.current = undefined;
      void llapi.disconnect();
    };
  }, []);

  useEffect(() => {
    onReset();
  }, [selectedMode]);

  const selectAccount = async () => {
    if (!api.current) {
      return;
    }

    if (!currencies) {
      console.warn("No currencies available");
      return;
    }

    const account = await api.current
      .requestAccount({
        // FIXME: use a 'getSelectableCurrencies' function instead of ternarry
        currencies:
          selectedMode === "buy"
            ? SELECTABLE_CURRENCIES_BUY
            : SELECTABLE_CURRENCIES_SELL,
      })
      .catch((error) => {
        console.error({ error });
        return undefined;
      });

    const currency = currencies.find((cur) => cur.id === account?.currency);

    setSelectedCurrency(currency);
    setSelectedAccount(account);
  };

  return (
    <Layout>
      <Header>
        <Button onClick={() => setSelectedMode("buy")}>Buy</Button>
        <Button onClick={() => setSelectedMode("sell")}>Sell</Button>
      </Header>
      <Content>
        {selectedAccount && selectedCurrency ? (
          <CoinifyWidget
            account={selectedAccount}
            currency={selectedCurrency}
            mode={selectedMode}
          />
        ) : (
          <Button onClick={selectAccount}>Select Account</Button>
        )}
      </Content>

      <Footer>
        <Button onClick={onReset}>{"exchange.reset"}</Button>
      </Footer>
    </Layout>
  );
};

export default Coinify;
