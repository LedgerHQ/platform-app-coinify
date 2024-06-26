"use client";

// @flow

import React, { useState, useCallback, useEffect, useRef } from "react";

import styled from "styled-components";

import type { Account, Currency } from "@ledgerhq/wallet-api-client";

import CoinifyWidget from "./CoinifyWidget";
import { Button, Icon, Text, Chip } from "@ledgerhq/react-ui";
import { useApi } from "../Providers/LedgerLiveSDKProvider";
import { useSearchParams } from "next/navigation";

const Layout = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const Header = styled.div`
  max-height: 5%;
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

export type Modes = "onRamp" | "offRamp";

const SELECTABLE_CURRENCIES_ONRAMP = [
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

type CoinifyProps = {
  currencies: Currency[];
  accounts: Account[];
};

const Coinify = ({ currencies, accounts }: CoinifyProps) => {
  const searchParams = useSearchParams();

  const defaultAccountId = searchParams.get("accountId");
  const language = searchParams.get("language");
  const defaultFiatCurrencyId = searchParams.get("fiatCurrencyId");
  const defaultCryptoCurrencyId = searchParams.get("cryptoCurrencyId");
  const primaryColor = searchParams.get("primaryColor");
  const defaultMode = searchParams.get("mode") as Modes;
  const defaultFiatAmount = searchParams.get("fiatAmount");
  const defaultCryptoAmount = searchParams.get("cryptoAmount");
  const buySessionId = searchParams.get("buySessionId");

  const api = useApi();

  const [selectedMode, setSelectedMode] = useState<Modes>(
    defaultMode || "onRamp"
  );

  const [selectedAccountId, setSelectedAccount] = useState<string | null>(
    defaultAccountId
  );
  const [selectedCurrencyId, setSelectedCurrency] = useState<string | null>(
    defaultCryptoCurrencyId
  );

  const selectedAccount = selectedAccountId
    ? accounts.find((account) => account.id === selectedAccountId)
    : undefined;

  const selectedCurrency = selectedCurrencyId
    ? currencies.find(
        (currency) =>
          currency.ticker.toLowerCase() === selectedCurrencyId.toLowerCase()
      )
    : undefined;

  const onReset = useCallback(() => setSelectedAccount(null), []);

  const mounted = useRef(false);
  useEffect(() => {
    if (mounted.current) {
      onReset();
    }
  }, [selectedMode, onReset]);

  useEffect(() => {
    mounted.current = true;
  }, []);

  console.log("Widget started with settings: ", {
    defaultCryptoCurrencyId,
    defaultAccountId,
    defaultFiatCurrencyId,
    defaultMode,
    defaultCryptoAmount,
    defaultFiatAmount,
    currencies,
    accounts,
    selectedAccount,
    selectedCurrency,
    buySessionId,
  });

  const selectAccount = async () => {
    if (!currencies) {
      console.warn("No currencies available");
      return;
    }
    let SELECTABLE_CURRENCIES_OFFRAMP = ["bitcoin"];
    const env =
      new URLSearchParams(window.location.search).get("env") || "prod";
    if (env && env === "sandbox") {
      SELECTABLE_CURRENCIES_OFFRAMP = ["bitcoin_testnet"];
    }
    const account = await api.walletAPI.account
      .request({
        // FIXME: use a 'getSelectableCurrencies' function instead of ternarry
        currencyIds:
          selectedMode === "onRamp"
            ? SELECTABLE_CURRENCIES_ONRAMP
            : SELECTABLE_CURRENCIES_OFFRAMP,
      })
      .catch((error) => {
        console.error({ error });
        return undefined;
      });

    const currency = currencies.find((cur) => cur.id === account?.currency);

    if (currency) {
      setSelectedCurrency(currency.ticker);
    }
    if (account) {
      setSelectedAccount(account.id);
    }
  };

  return (
    <Layout>
      {!defaultMode ? (
        <Header>
          <Chip
            initialActiveIndex={0}
            onTabChange={(index) =>
              setSelectedMode(index === 0 ? "onRamp" : "offRamp")
            }
          >
            <Text color="inherit" variant="small">
              Buy
            </Text>

            <Text color="inherit" variant="small">
              Sell
            </Text>
          </Chip>
        </Header>
      ) : null}

      <Content>
        {selectedAccount && selectedCurrencyId ? (
          <CoinifyWidget
            account={selectedAccount}
            currency={selectedCurrencyId}
            fiatCurrencyId={defaultFiatCurrencyId}
            mode={selectedMode}
            fiatAmount={defaultFiatAmount}
            cryptoAmount={defaultCryptoAmount}
            language={language}
            primaryColor={primaryColor}
            buySessionId={buySessionId}
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
      ) : null}
    </Layout>
  );
};

export default Coinify;
