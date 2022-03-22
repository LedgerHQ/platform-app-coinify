import React from "react";
import { useRouter } from "next/router";
import CoinifyWidgetBuy from "../src/Coinify/CoinifyWidgetBuy";

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

const Page = () => {
  const router = useRouter();

  const {
    accountAddress,
    language,
    fiatCurrencyId,
    cryptoCurrencyId,
    primaryColor,
    fiatAmount,
    cryptoAmount,
  } = router.query as QueryParams;

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
      />
    );
  }

  return null;
};

export default Page;
