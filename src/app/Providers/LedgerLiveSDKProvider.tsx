import React, { createContext, useState, useEffect, useContext } from "react";
import * as Sentry from "@sentry/nextjs";

import { ExchangeSDK } from "@ledgerhq/exchange-sdk";

type LedgerLiveSDKContextType = {
  api?: ExchangeSDK;
};

const defaultContext: LedgerLiveSDKContextType = { api: undefined };

export const LedgerLiveSDKContext =
  createContext<LedgerLiveSDKContextType>(defaultContext);

const LedgerLiveSDKProvider = ({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement => {
  const [api, setApi] = useState<ExchangeSDK | null>(null);

  useEffect(() => {
    const llapi = new ExchangeSDK("coinify", undefined, undefined, "https://buy.api.aws.ppr.ldg-tech.com/sell/v1");

    setApi(llapi);

    return () => {
      setApi(null);
      llapi.disconnect();
    };
  }, []);

  if (!api) {
    return <></>;
  }

  return (
    <LedgerLiveSDKContext.Provider value={{ api }}>
      {children}
    </LedgerLiveSDKContext.Provider>
  );
};

export const useApi = (): ExchangeSDK => {
  const { api } = useContext(LedgerLiveSDKContext);

  // This should theoretically never happen
  if (!api) {
    const error = new Error("API not initialized");
    Sentry.captureException(error);
    throw error;
  }

  return api;
};

export default LedgerLiveSDKProvider;
