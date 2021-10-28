import React, { useEffect, useState } from "react";

import Button from "../src/components/Button";

import Buy from "../src/Buy";
import Sell from "../src/Sell";

type Modes = "buy" | "sell";

const Coinify = () => {
  const [mounted, setMounted] = useState(false);
  const [selectedMode, setSelectedMode] = useState<Modes>("buy");

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) {
    return <></>;
  }

  // FIXME: use tabs / mutually exclusive buttons for mode selection
  return (
    <>
      <Button onClick={() => setSelectedMode("buy")}>Buy</Button>
      <Button onClick={() => setSelectedMode("sell")}>Sell</Button>

      {selectedMode === "buy" && <Buy />}
      {selectedMode === "sell" && <Sell />}
    </>
  );
};

export default Coinify;
