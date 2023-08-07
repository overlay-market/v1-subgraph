/// <reference types="@types/jest" />

import axios from "axios"

import { ACCOUNT_QUERY } from "./queries"

const OLD_SUBGRAPH_URL = "https://api.studio.thegraph.com/query/46086/overlay-v2-subgraph-arbitrum/version/latest"
const NEW_SUBGRAPH_URL = "https://api.studio.thegraph.com/query/49419/overlay-contracts/version/latest"

describe("Compatibility tests with previous subgraph", () => {
    test("Account entities", async () => {
        const oldRes = await axios.post(OLD_SUBGRAPH_URL, { query: ACCOUNT_QUERY, variables: {} })
        const oldData = oldRes.data.data

        const newRes = await axios.post(NEW_SUBGRAPH_URL, { query: ACCOUNT_QUERY, variables: {} })
        const newData = newRes.data.data

        expect(oldData).toEqual(newData)
    })
})
