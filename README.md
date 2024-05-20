This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash

yarn dev

```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

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
