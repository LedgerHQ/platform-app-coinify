import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useApi } from "../src/providers/LedgerLiveSDKProvider";

import Coinify from "../src/Coinify";
import { Account, Currency } from "@ledgerhq/live-app-sdk";

type QueryParams = {
  fiatCurrencyId?: string; // Fiat currency selected by the user
  cryptoCurrencyId?: string; // Crypto currency selected by the user
  accountId?: string; // Ledger Live crypto account id selected by the user
  mode?: "onRamp" | "offRamp"; // Are we onRamping or offRamping ? (buy / sell crypto)
  amount?: number; // amount of crypto / fiat to buy or sell
  amountCurrency?: "fiat" | "crypto"; // is the amount in fiat or in crypto ?
  theme?: "light" | "dark"; // theme currently used in Ledger Live
  lang?: string; // fr, en, es...
};

type PageState = {
  data?: {
    accounts: Account[];
    currencies: Currency[];
  };
  error?: any;
};

const Page = () => {
  const router = useRouter();
  const [state, setState] = useState<PageState>({
    data: undefined,
    error: undefined,
  });

  const api = useApi();

  useEffect(() => {
    Promise.all([api.listAccounts(), api.listCurrencies()])
      .then(([accounts, currencies]) => {
        setState({
          data: { accounts, currencies },
          error: undefined,
        });
      })
      .catch((error) => {
        setState({ error, data: undefined });
      });
  }, []);

  const {
    cryptoCurrencyId,
    fiatCurrencyId,
    accountId,
    mode,
    amount,
    amountCurrency,
  } = router.query as QueryParams;

  if (state.data) {
    return (
      <Coinify
        defaultCryptoCurrencyId={cryptoCurrencyId}
        defaultFiatCurrencyId={fiatCurrencyId}
        defaultAccountId={accountId}
        defaultMode={mode}
        defaultAmount={amount}
        defaultAmountCurrency={amountCurrency}
        accounts={state.data.accounts}
        currencies={state.data.currencies}
      />
    );
  }

  return null;
};

export default Page;
