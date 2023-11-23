// Commented lines are because of the emergencyWithdraw new feature. Suggest to remove once the new version is deployed
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
    `query markets {
        markets {
            id
            feedAddress
            factory {
                id
            }
            k
            lmbda
            delta
            capPayoff
            capNotional
            capLeverage
            circuitBreakerWindow
            circuitBreakerMintTarget
            maintenanceMarginFraction
            maintenanceMarginBurnRate
            liquidationFeeRate
            tradingFeeRate
            minCollateral
            priceDriftUpperLimit
            averageBlockTime
            isShutdown
            numberOfBuilds
            numberOfLiquidates
            totalBuildFees
            totalFees
            totalLiquidateFees
            totalUnwindFees
            createdAtBlockNumber
            createdAtTimestamp
            //   numberOfUnwinds
            //   oiLong
            //   oiShort
        }
    }`,
    `query positions {
        positions(orderBy: createdAtTimestamp, orderDirection: desc) {
            id
            positionId
            isLiquidated
            //   currentDebt
            //   currentOi
            entryPrice
            //   fractionUnwound
            initialCollateral
            initialDebt
            initialNotional
            initialOi
            isLong
            leverage
            createdAtBlockNumber
            createdAtTimestamp
            mint
            //   numberOfUniwnds
        }
    }`,
    `query unwinds {
        // unwinds(orderBy: timestamp, orderDirection: desc) {
        unwinds(orderBy: timestamp, orderDirection: desc, where: {price_gt: "0"}) {
            collateral
            currentDebt
            currentOi
            feeAmount
            fraction
            fractionOfPosition
            id
            isLong
            mint
            pnl
            price
            size
            timestamp
            transferAmount
            unwindNumber
            value
            volume
        }
    }`,
    `query builds {
        builds(orderBy: timestamp, orderDirection: desc) {
            collateral
            currentDebt
            currentOi
            feeAmount
            id
            isLong
            price
            timestamp
            value
        }
    }`,
    `query accounts {
        accounts(
            first: 1000
            orderBy: realizedPnl
            orderDirection: desc
            where: {realizedPnl_not: "0"}
        ) {
            id
            numberOfLiquidatedPositions
            //   numberOfOpenPositions
            //   numberOfUnwinds
            realizedPnl
        }
    }`,
]
