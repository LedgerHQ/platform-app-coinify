import React, { useState, useCallback, useEffect } from "react";

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
  defaultAccountId?: string;
  defaultMode?: Modes;
  currencies: Currency[];
  accounts: Account[];
};

const Coinify = ({
  defaultCryptoCurrencyId,
  defaultAccountId,
  defaultMode,
  currencies,
  accounts,
}: CoinifyProps) => {
  const api = useApi();

  const [selectedMode, setSelectedMode] = useState<Modes>(
    defaultMode || "onRamp"
  );

  const [selectedAccount, setSelectedAccount] = useState<Account | undefined>(
    defaultAccountId
      ? accounts.find((account) => account.id === defaultAccountId)
      : undefined
  );
  const [selectedCurrency, setSelectedCurrency] = useState<
    Currency | undefined
  >(
    defaultCryptoCurrencyId
      ? currencies.find((currency) => currency.id === defaultCryptoCurrencyId)
      : undefined
  );

  const onReset = useCallback(() => setSelectedAccount(undefined), []);

  useEffect(() => {
    onReset();
  }, [selectedMode, onReset]);

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

    setSelectedCurrency(currency);
    setSelectedAccount(account);
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
