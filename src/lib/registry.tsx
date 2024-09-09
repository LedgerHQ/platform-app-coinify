"use client";

import React from "react";

import { StyleSheetManager, WebTarget } from "styled-components";
import emotionIsPropValid from "@emotion/is-prop-valid";

export default function StyledComponentsRegistry({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StyleSheetManager shouldForwardProp={shouldForwardProp}>
      {children}
    </StyleSheetManager>
  );
}

function shouldForwardProp(propName: string, target: WebTarget) {
  if (typeof target === "string") {
    // For HTML elements, forward the prop if it is a valid HTML attribute
    return emotionIsPropValid(propName);
  }
  // For other elements, forward all props
  return true;
}
