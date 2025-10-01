# Your Project's Title...
https://academy.worldbank.org/en/home

## Environments
These will be the same content because there is no 'preview' in AEM 6.5
- Preview: https://main--wbcopy--helms-charity.aem.page/en/home
- Live: https://main--wbcopy--helms-charity.aem.live/en/home

## Installation

```sh
npm i
```

## Linting

```sh
npm run lint
```

## Local development

1. Create a new repository based on the `aem-boilerplate` template and add a mountpoint in the `fstab.yaml`.
1. Add the [AEM Code Sync GitHub App](https://github.com/apps/aem-code-sync) to the repository
1. Install the [AEM CLI](https://github.com/adobe/helix-cli): `npm install -g @adobe/aem-cli`
1. Start AEM Proxy: `aem up` (opens your browser at `http://localhost:3000`)
1. Open the `world-bank` directory in your favorite IDE and start coding :)
