# Overlay v1-subgraph

Deployed Subgraphs
| Chain | URL |
| --- | --- |
| Kovan | https://thegraph.com/hosted-service/subgraph/bigboydiamonds/overlay-v1-subgraph |
| Rinkeby | https://thegraph.com/hosted-service/subgraph/bigboydiamonds/overlay-v1-subgraph-rinkeby |

# Run tests

## Compatibility tests

To run tests against the legacy subgraph, run:

```bash
yarn test:compat
```

## Unit tests

To run unit tests, you first need to build a Docker image:

```bash
yarn test:build
```

Now run the tests:

```bash
yarn test:unit
```

> If you are on Windows, run `yarn test:unit-win` instead.
