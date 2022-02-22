import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useApi } from "../src/providers/LedgerLiveSDKProvider";

import Coinify from "../src/Coinify";
import { Account, Currency } from "@ledgerhq/live-app-sdk";

type QueryParams = {
  cryptoCurrencyId?: string;
  accountId?: string;
  mode?: "onRamp" | "offRamp";
  amount?: number;
  amountCurrency?: "fiat" | "crypto";
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

  const { cryptoCurrencyId, accountId, mode, amount, amountCurrency } =
    router.query as QueryParams;

  if (state.data) {
    return (
      <Coinify
        defaultCryptoCurrencyId={cryptoCurrencyId}
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
