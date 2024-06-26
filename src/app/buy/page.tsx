"use client";

import React from "react";
import CoinifyWidgetBuy from "../Coinify/CoinifyWidgetBuy";
import { useSearchParams } from "next/navigation";

const Page = () => {
  const searchParams = useSearchParams();

  const accountAddress = searchParams.get("accountAddress");
  const language = searchParams.get("language");
  const fiatCurrencyId = searchParams.get("fiatCurrencyId");
  const cryptoCurrencyId = searchParams.get("cryptoCurrencyId");
  const primaryColor = searchParams.get("primaryColor");
  const fiatAmount = searchParams.get("fiatAmount");
  const cryptoAmount = searchParams.get("cryptoAmount");
  const buySessionId = searchParams.get("buySessionId");

  if (accountAddress && cryptoCurrencyId) {
    return (
      <CoinifyWidgetBuy
        accountAddress={accountAddress}
        currency={cryptoCurrencyId}
        fiatCurrencyId={fiatCurrencyId}
        mode={"onRamp"}
        fiatAmount={fiatAmount}
        cryptoAmount={cryptoAmount}
        language={language}
        primaryColor={primaryColor}
        buySessionId={buySessionId}
      />
    );
  }

  return null;
};

export default Page;
