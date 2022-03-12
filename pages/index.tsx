import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useApi } from "../src/providers/LedgerLiveSDKProvider";

import Coinify from "../src/Coinify";
import { Account, Currency } from "@ledgerhq/live-app-sdk";

type QueryParams = {
  accountId?: string;
  accountAddress?: string;
  language?: string;
  fiatCurrencyId?: string;
  cryptoCurrencyId?: string;
  primaryColor?: string;
  mode?: "onRamp" | "offRamp";
  fiatAmount?: string;
  cryptoAmount?: string;
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
    accountId,
    language,
    fiatCurrencyId,
    cryptoCurrencyId,
    primaryColor,
    mode,
    fiatAmount,
    cryptoAmount,
  } = router.query as QueryParams;

  if (state.data) {
    return (
      <Coinify
        defaultCryptoCurrencyId={cryptoCurrencyId}
        defaultFiatCurrencyId={fiatCurrencyId}
        defaultAccountId={accountId}
        defaultMode={mode}
        defaultCryptoAmount={cryptoAmount}
        defaultFiatAmount={fiatAmount}
        language={language}
        primaryColor={primaryColor}
        accounts={state.data.accounts}
        currencies={state.data.currencies}
      />
    );
  }

  return null;
};

export default Page;
