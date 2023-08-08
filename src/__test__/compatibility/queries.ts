export const QUERIES = [
    `query account{
        unwinds(where: {owner: "0xc070dc5ef504970982570ee0072e235f21a47029"}) {
            id
            transaction {
                builds {
                    id
                    feeAmount
                }
                unwinds {
                    id
                    feeAmount
                    transferAmount
                }
                id
            }
        }
        builds(where: {owner: "0xc070dc5ef504970982570ee0072e235f21a47029"}) {
            id
            transaction {
                id
                builds {
                    id
                    feeAmount
                }
                unwinds {
                    id
                    feeAmount
                }
            }
        }
    }`,
]
