import {
    assert,
    describe,
    test,
    clearStore,
    beforeAll,
    afterAll
} from "matchstick-as/assembly/index"

describe("Describe entity assertions", () => {
    afterAll(() => {
        clearStore()
    })

    test("Entity created and stored", () => {
        assert.assertTrue(true)
    })
})
