import React, { useState, useCallback, useEffect } from "react";

import styled from "styled-components";

import type { Account, Currency } from "@ledgerhq/live-app-sdk";

import CoinifyWidget from "./CoinifyWidget";
import { Button, Icon, Text } from "@ledgerhq/react-ui";

import Tabs from "@ledgerhq/react-ui/components/tabs/Tabs";
import { useApi } from "../providers/LedgerLiveSDKProvider";

const Layout = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const Content = styled.div`
  flex: auto;
  align-items: center;
  justify-content: center;
  flex-direction: column;
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
  const api = useApi();

  const [selectedMode, setSelectedMode] = useState<Modes>("buy");
  const [currencies, setCurrencies] = useState<Currency[]>();
  const [selectedAccount, setSelectedAccount] = useState<Account>();
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>();

  const onReset = useCallback(() => setSelectedAccount(undefined), []);

  useEffect(() => {
    api.listCurrencies().then((currencies) => setCurrencies(currencies));
  }, [api]);

  useEffect(() => {
    onReset();
  }, [selectedMode]);

  const selectAccount = async () => {
    if (!currencies) {
      console.warn("No currencies available");
      return;
    }

    const account = await api
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
      <Text ff="Inter|SemiBold" fontSize={7}>
        {`${selectedMode === "buy" ? "Buy" : "Sell"} crypto with Coinify`}
      </Text>
      <Tabs
        onTabChange={(index) => setSelectedMode(index === 0 ? "buy" : "sell")}
        tabs={[
          {
            index: 0,
            title: "Buy",
            // FIXME: tabs component does not have a 100% height (and I can't manage to make it so)
            // Should Tabs's components be optionnal?
            Component: <></>,
          },
          {
            index: 1,
            title: "Sell",
            Component: <></>,
          },
        ]}
      />

      <Content>
        {selectedAccount && selectedCurrency ? (
          <CoinifyWidget
            account={selectedAccount}
            currency={selectedCurrency}
            mode={selectedMode}
          />
        ) : (
          <>
            <Button variant="main" onClick={selectAccount}>
              Select Account
            </Button>
          </>
        )}
      </Content>
      {selectedAccount && selectedCurrency ? (
        <Footer>
          <Button
            iconButton={true}
            iconPosition="left"
            outline={false}
            Icon={() => <Icon name="Refresh" />}
            onClick={onReset}
          >
            Reset
          </Button>
        </Footer>
      ) : (
        <></>
      )}
    </Layout>
  );
};

export default Coinify;
