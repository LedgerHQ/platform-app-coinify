// @flow

import React, { useState, useCallback, useRef, useEffect } from "react";
import styled from "styled-components";

import LedgerLiveApi, { WindowMessageTransport } from "@ledgerhq/live-app-sdk";
import type { Account, Currency } from "@ledgerhq/live-app-sdk";

import CoinifyWidget from "./CoinifyWidget";
import Button from "./components/Button";

const SellContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  flex: 1;
  height: 100%;
`;

const SELECTABLE_CURRENCIES = ["bitcoin"];

// FIXME: verry similar to Buy component, could be refacto
const Sell = () => {
  const api = useRef<LedgerLiveApi>();

  const [currencies, setCurrencies] = useState<Currency[]>();
  const [selectedAccount, setSelectedAccount] = useState<Account>();
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>();

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

  const reset = useCallback(() => setSelectedAccount(undefined), []);

  const selectAccount = async () => {
    if (!api.current) {
      return;
    }

    if (!currencies) {
      console.warn("No currencies available");
      return;
    }

    const account = await api.current
      .requestAccount({ currencies: SELECTABLE_CURRENCIES })
      .catch((error) => {
        console.error({ error });
        return undefined;
      });

    const currency = currencies.find((cur) => cur.id === account?.currency);

    setSelectedCurrency(currency);
    setSelectedAccount(account);
  };

  return (
    <SellContainer>
      {selectedAccount && selectedCurrency ? (
        <CoinifyWidget
          account={selectedAccount}
          currency={selectedCurrency}
          mode="sell"
          onReset={reset}
        />
      ) : (
        <Button onClick={selectAccount}>Select Account</Button>
      )}
    </SellContainer>
  );
};

export default Sell;
