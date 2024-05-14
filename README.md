# Platform app Coinify

This is a Live App integrating the Coinify widget used to buy and sell crypto in the Ledger Live context. As of today it is not yet integrated in the Ledger Live platform.

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

# Getting Started

First, run the development server:

```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `pages/index.tsx`. The page auto-updates as you edit the file.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

# How to develop
Use the `manifest-dev.json` file to load it in Ledger Live as a live-app. 

## Use sandbox environment
In the "manifest.json" file, set the `url` parameter with a `env` query parameter set to "sandbox".

Example: `"url": "http://localhost:3000?env=sandbox"`

## URL params can change the UI landing page
For exampleoing through the sell flow on ledger live will land you directly on the sell page. Example sell params
```
?mode=offRamp
```

##Testing 
You will need a bitcoin_test and come funds to test the flow end to end. 

# Todo

- Polish UI: for now it is the bare minimum and not styled
- Configure linter and prettier: for now it is the bare minimum
- Deploy to Vercel (if relevant)
- Integrate in LL (if relevant)
