# Overlay v1-subgraph

Deployed Subgraphs
| Chain | URL |
| --- | --- |
| Berachain Bepolia | https://api.goldsky.com/api/public/project_cm3n5avsu08tw01vthbry8fl7/subgraphs/overlay-bepolia/latest/gn |
| Berachain Mainnet | https://api.goldsky.com/api/public/project_clyiptt06ifuv01ul9xiwfj28/subgraphs/overlay-berachain/prod/gn |

## Usage

First, use `node scripts/switchNetwork.js <network-name>` to set correct addresses and the network.

Available networks: `arbitrum-sepolia`, `berachain-bepolia`, `berachain-mainnet`

Use `goldsky` CLI tool to deploy.

## Run tests

### Compatibility tests

To run tests against the legacy subgraph, run:

```bash
yarn test:compat
```

### Unit tests

To run unit tests, you first need to build a Docker image:

```bash
yarn test:build
```

Now run the tests:

```bash
yarn test:unit
```

> If you are on Windows, run `yarn test:unit-win` instead.
