import React, { useState, useCallback, useEffect, useRef } from "react";

import styled from "styled-components";

import type { Account, Currency } from "@ledgerhq/live-app-sdk";

import CoinifyWidget from "./CoinifyWidget";
import { Button, Icon, Text } from "@ledgerhq/react-ui";

import { Chip } from "@ledgerhq/react-ui/components/tabs";
import { useApi } from "../providers/LedgerLiveSDKProvider";

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

type Modes = "onRamp" | "offRamp";

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

const SELECTABLE_CURRENCIES_OFFRAMP = ["bitcoin"];

type CoinifyProps = {
  defaultCryptoCurrencyId?: string;
  defaultFiatCurrencyId?: string;
  defaultAccountId?: string;
  defaultMode?: Modes;
  defaultCryptoAmount?: string;
  defaultFiatAmount?: string;
  language?: string;
  primaryColor?: string;
  currencies: Currency[];
  accounts: Account[];
};

const Coinify = ({
  defaultCryptoCurrencyId,
  defaultFiatCurrencyId,
  defaultAccountId,
  defaultMode,
  defaultCryptoAmount,
  defaultFiatAmount,
  currencies,
  accounts,
  language,
  primaryColor,
}: CoinifyProps) => {
  const api = useApi();

  const [selectedMode, setSelectedMode] = useState<Modes>(
    defaultMode || "onRamp"
  );

  const [selectedAccountId, setSelectedAccount] = useState<string | undefined>(
    defaultAccountId
  );
  const [selectedCurrencyId, setSelectedCurrency] = useState<
    string | undefined
  >(defaultCryptoCurrencyId);

  const selectedAccount = selectedAccountId
    ? accounts.find((account) => account.id === selectedAccountId)
    : undefined;

  const selectedCurrency = selectedCurrencyId
    ? currencies.find(
        (currency) =>
          currency.ticker.toLowerCase() === selectedCurrencyId.toLowerCase()
      )
    : undefined;

  const onReset = useCallback(() => setSelectedAccount(undefined), []);

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
  });

  const selectAccount = async () => {
    if (!currencies) {
      console.warn("No currencies available");
      return;
    }

    const account = await api
      .requestAccount({
        // FIXME: use a 'getSelectableCurrencies' function instead of ternarry
        currencies:
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
