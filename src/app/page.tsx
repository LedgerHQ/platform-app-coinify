"use client";

import React, { useEffect, useState } from "react";
import * as Sentry from "@sentry/nextjs";

import { Account, Currency } from "@ledgerhq/wallet-api-client";
import Coinify from "./Coinify/Coinify";
import { useApi } from "./Providers/LedgerLiveSDKProvider";

type PageState = {
  data?: {
    accounts: Account[];
    currencies: Currency[];
  };
  error?: any;
};

const Page = () => {
  const [state, setState] = useState<PageState>({
    data: undefined,
    error: undefined,
  });

  const api = useApi();

  useEffect(() => {
    Promise.all([api.walletAPI.account.list(), api.walletAPI.currency.list()])
      .then(([accounts, currencies]) => {
        setState({
          data: { accounts, currencies },
          error: undefined,
        });
      })
      .catch((error) => {
        Sentry.captureException(error);
        setState({ error, data: undefined });
      });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (state.data) {
    return (
      <Coinify
        accounts={state.data.accounts}
        currencies={state.data.currencies}
      />
    );
  }

  return null;
};

export default Page;
