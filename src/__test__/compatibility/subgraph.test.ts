/// <reference types="@types/jest" />

import axios from "axios"

import { QUERIES } from "./queries"

const OLD_SUBGRAPH_URL = "https://api.studio.thegraph.com/query/46086/overlay-v2-subgraph-arbitrum/version/latest"
const NEW_SUBGRAPH_URL = "https://api.studio.thegraph.com/query/49419/overlay-contracts/v0.0.7"

describe("Compatibility tests with previous subgraph", () => {
    test("All queries match", async () => {
        for (const query of QUERIES) {
            const oldRes = axios.post(OLD_SUBGRAPH_URL, { query, variables: {} })
            const newRes = axios.post(NEW_SUBGRAPH_URL, { query, variables: {} })

            const [oldData, newData] = await Promise.all([oldRes, newRes])

            expect(oldData.data.data).toEqual(newData.data.data)
        }
    })
})
