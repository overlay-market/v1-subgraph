import { ethereum, Address, BigInt, log, Bytes } from "@graphprotocol/graph-ts"
import { integer } from "@protofire/subgraph-toolkit";
import {
  FeeRecipientUpdated,
  FeedFactoryAdded,
  MarketDeployed,
  ParamUpdated,
  EmergencyShutdown
} from "../generated/OverlayV1Factory/OverlayV1Factory"
import {
  OverlayV1Market,
  Build as BuildEvent,
  Liquidate as LiquidateEvent,
  Unwind as UnwindEvent,
  EmergencyWithdraw as EmergencyWithdrawEvent,
  CacheRiskCalc as CacheRiskCalcEvent,
  Update as UpdateEvent
} from "../generated/templates/OverlayV1Market/OverlayV1Market";

import { Factory, Market, Position, Build, Unwind, Liquidate } from "../generated/schema"
import { OverlayV1Market as MarketTemplate } from './../generated/templates';
import { TRANSFER_SIG, OVL_ADDRESS, FACTORY_ADDRESS, ZERO_BI, ONE_BI, ONE_18DEC_BI, ZERO_BD, ADDRESS_ZERO, factoryContract, stateContract, RISK_PARAMS } from './utils/constants';
import { loadMarket, loadPosition, loadFactory, loadTransaction, loadAccount, loadAnalytics } from "./utils";
import { updateReferralRewards } from "./referral";
import { updateTraderEpochVolume } from "./trading-mining";
import { updateMarketHourData } from "./temporal-data-logger";
import { updateAnalyticsHourData, updateMarketState } from "./utils/helpers";

// TODO: rename or separate this file into multiple files

export function handleMarketDeployed(event: MarketDeployed): void {

  // load factory
  let factory = loadFactory(Address.fromString(FACTORY_ADDRESS))

  // adding a new market to the count
  factory.marketCount = factory.marketCount.plus(ONE_BI)

  // vars that will be used to populate the information for a new market
  let marketAddress = event.params.market
  let feedAddress = event.params.feed
  let marketContract = OverlayV1Market.bind(event.params.market)
  let market = new Market(marketAddress) as Market
  let marketState = updateMarketState(market.id)

  // basic info about the market
  market.feedAddress = feedAddress.toHexString()
  market.factory = factory.id
  market.createdAtTimestamp = event.block.timestamp
  market.createdAtBlockNumber = event.block.number

  // all params
  market.k = marketContract.params(integer.fromNumber(0))
  market.lmbda = marketContract.params(integer.fromNumber(1))
  market.delta = marketContract.params(integer.fromNumber(2))
  market.capPayoff = marketContract.params(integer.fromNumber(3))
  market.capNotional = marketContract.params(integer.fromNumber(4))
  market.capLeverage = marketContract.params(integer.fromNumber(5))
  market.circuitBreakerWindow = marketContract.params(integer.fromNumber(6))
  market.circuitBreakerMintTarget = marketContract.params(integer.fromNumber(7))
  market.maintenanceMarginFraction = marketContract.params(integer.fromNumber(8))
  market.maintenanceMarginBurnRate = marketContract.params(integer.fromNumber(9))
  market.liquidationFeeRate = marketContract.params(integer.fromNumber(10))
  market.tradingFeeRate = marketContract.params(integer.fromNumber(11))
  market.minCollateral = marketContract.params(integer.fromNumber(12))
  market.priceDriftUpperLimit = marketContract.params(integer.fromNumber(13))
  market.averageBlockTime = marketContract.params(integer.fromNumber(14))
  market.oiLong = marketState.oiLong
  market.oiShort = marketState.oiShort
  market.oiLongShares = ZERO_BI;
  market.oiShortShares = ZERO_BI;
  market.isShutdown = false
  market.totalBuildFees = ZERO_BI
  market.numberOfBuilds = ZERO_BI
  market.totalUnwindFees = ZERO_BI
  market.numberOfUnwinds = ZERO_BI
  market.totalLiquidateFees = ZERO_BI
  market.numberOfLiquidates = ZERO_BI
  market.totalFees = ZERO_BI
  market.totalVolume = ZERO_BI
  market.totalMint = ZERO_BI
  market.dpUpperLimit = marketContract.dpUpperLimit()

  market.save()
  // create tracked market contract based on template
  MarketTemplate.create(event.params.market)
  factory.save()
}

export function handleBuild(event: BuildEvent): void {
  // Load the market entity using the market address from the event
  let market = loadMarket(event, event.address)
  // Load the account entity corresponding to the sender of the transaction
  let sender = loadAccount(event.params.sender)

  // Convert market ID and sender ID to Address type for further usage
  let marketAddress = Address.fromBytes(market.id)
  let senderAddress = Address.fromBytes(sender.id)

  // Retrieve the position ID from the event and create a unique ID for the position entity
  let positionId = event.params.positionId
  let id = market.id.concatI32(positionId.toI32())
  let position = new Position(id) as Position

  // Initialize transfer fee amount to zero
  let transferFeeAmount = ZERO_BI

  // Retrieve the transaction receipt and load the factory entity associated with the market
  let receipt = event.receipt
  let factory = Factory.load(market.factory)

  // This block of code is to get `transferFeeAmount` from the logs
  // Build transactions generate 3 (sometimes 4) relevant logs:
  // 1. Build: The main event log indicating the build action.
  // 2. (Optional) Approve: This is emitted only for the first Build in the market.
  // 3. Transfer from user to smart contract: The transfer of collateral from the user to the market contract.
  // 4. Transfer from smart contract to fee recipient: The transfer of the fee amount from the market contract to the fee recipient.

  // All code below is to find the second Transfer function (from the smart contract to the fee recipient) and extract the `transferFeeAmount` value.

  if (receipt && factory) {
    // Initialize the index for the Build event log
    let buildIndex = 0

    // Iterate over the logs to find the log corresponding to the Build event
    for (let i = 0; i < receipt.logs.length; i++) {
      if (receipt.logs[i].logIndex.toI32() === event.logIndex.toI32()) {
        buildIndex = i
        break
      }
    }

    // Check if the next log is not an ERC20 transfer event, adjust the index if necessary
    // The first Build event on each market emits an Approve event after the Build event,
    // which might shift the position of the subsequent Transfer logs.
    if (receipt.logs[buildIndex + 1].topics[0].notEqual(TRANSFER_SIG)) {
      buildIndex += 1
    }

    // Calculate the index for the transfer event log from the smart contract to the fee recipient
    let index = +buildIndex + 2

    // Further adjust the index if the next log is not an ERC20 transfer event
    // This adjustment is a precautionary step, though it is rare for this to happen.
    if (receipt.logs[buildIndex + 1].topics[0].notEqual(TRANSFER_SIG)) {
      log.warning("IT HAPPENS", [])
      index += 1
    }

    // Extract the first topic (event signature) and the address of the log at the calculated index
    const _topic0 = receipt.logs[index].topics[0]
    const _address = receipt.logs[index].address

    // Verify that the log is an ERC20 Transfer event and matches the OVL token address
    if (
      _topic0.equals(TRANSFER_SIG) &&
      _address.toHexString() == OVL_ADDRESS &&
      receipt.logs[index].topics.length > 1
    ) {
      // Decode the recipient address from the log's topics
      let topics2address = ethereum.decode('address', receipt.logs[index].topics[2])!.toAddress()

      // Check if the recipient is the fee recipient and decode the transfer amount
      if (topics2address.toHexString().toLowerCase() == factory.feeRecipient.toLowerCase()) {
        const _transferAmount = receipt.logs[index].data
        transferFeeAmount = ethereum.decode('uin256', _transferAmount)!.toBigInt()
      } else {
        // Log an error if the recipient does not match the expected fee recipient
        log.error("handleBuild: 2nd if: transaction: {}, buildIndex: {}, index {}", [
          event.transaction.hash.toHexString(),
          buildIndex.toString(),
          index.toString()
        ])
      }
    } else {
      // Log an error if the log does not match the expected ERC20 transfer event
      log.error("handleBuild: 1st if: transaction: {}, buildIndex: {}, index {}", [
        event.transaction.hash.toHexString(),
        buildIndex.toString(),
        index.toString()
      ])
    }
  } else {
    // Log an error if the receipt or factory is missing
    log.error("handleBuild: receipt && factory: tx {}, {}, {}", [
      event.transaction.hash.toHexString(),
      !receipt ? "no receipt" : "receipt found",
      !factory ? "no factory" : factory.feeRecipient
    ])
  }

  // Initialize the Position entity with data from the event and calculations
  position.owner = sender.id
  position.positionId = positionId.toHexString()
  position.market = market.id
  position.initialOi = event.params.oi
  position.initialDebt = event.params.debt

  // Calculate initial collateral and notional using the state contract
  let initialCollateral = stateContract.cost(marketAddress, senderAddress, positionId)
  let initialNotional = initialCollateral.plus(event.params.debt)
  position.initialCollateral = initialCollateral
  position.initialNotional = initialNotional
  // Calculate the leverage for the position
  position.leverage = (initialNotional.toBigDecimal()).div(initialCollateral.toBigDecimal())
  position.isLong = event.params.isLong
  position.entryPrice = event.params.price
  position.isLiquidated = false
  position.currentOi = event.params.oi
  position.currentDebt = event.params.debt
  position.mint = ZERO_BI
  position.createdAtTimestamp = event.block.timestamp
  position.createdAtBlockNumber = event.block.number
  position.numberOfUniwnds = BigInt.fromI32(0)
  position.fractionUnwound = BigInt.fromI32(0)

  // Update the open interest in the market based on the position's side (long/short)
  if (position.isLong) {
    market.oiLong = event.params.oiAfterBuild
    market.oiLongShares = event.params.oiSharesAfterBuild
  } else {
    market.oiShort = event.params.oiAfterBuild
    market.oiShortShares = event.params.oiSharesAfterBuild
  }

  // Update market-level metrics with the calculated fee and notional
  market.totalBuildFees = market.totalBuildFees.plus(transferFeeAmount)
  market.numberOfBuilds = market.numberOfBuilds.plus(ONE_BI)
  market.totalFees = market.totalFees.plus(transferFeeAmount)
  market.totalVolume = market.totalVolume.plus(initialNotional)

  // Load or create the Transaction entity for this event
  let transaction = loadTransaction(event)

  // Create a new Build entity to track this specific build event
  let build = new Build(position.id) as Build
  build.position = position.id
  build.owner = sender.id
  build.currentOi = event.params.oi
  build.currentDebt = event.params.debt
  build.isLong = event.params.isLong
  build.price = event.params.price
  build.collateral = initialCollateral
  // Calculate the current value of the position using the state contract
  build.value = stateContract.value(marketAddress, senderAddress, positionId)
  build.timestamp = transaction.timestamp
  build.transaction = transaction.id
  build.feeAmount = transferFeeAmount

  // Update the analytics entity to reflect the new build and market activity
  let analytics = loadAnalytics(market.factory)
  if (sender.ovlVolumeTraded.equals(ZERO_BI)) {
    analytics.totalUsers = analytics.totalUsers.plus(ONE_BI)
  }
  analytics.totalTransactions = analytics.totalTransactions.plus(ONE_BI)
  analytics.totalTokensLocked = analytics.totalTokensLocked.plus(initialCollateral)
  analytics.totalVolumeBuilds = analytics.totalVolumeBuilds.plus(initialNotional)
  analytics.totalVolume = analytics.totalVolume.plus(initialNotional)

  // Update hourly analytics data for this market
  updateAnalyticsHourData(analytics, event.block.timestamp)

  // Increment the sender's open positions count
  sender.numberOfOpenPositions = sender.numberOfOpenPositions.plus(ONE_BI)

  // Update referral rewards and trader epoch volume for the sender
  updateReferralRewards(event, event.params.sender, transferFeeAmount)
  updateTraderEpochVolume(event.params.sender, initialNotional)

  // Update the sender's total traded volume
  sender.ovlVolumeTraded = sender.ovlVolumeTraded.plus(initialNotional)

  // Update hourly market data with the new position's notional
  updateMarketHourData(market, event.block.timestamp, initialNotional, ZERO_BI)

  // Save all the updated and new entities
  position.save()
  market.save()
  build.save()
  sender.save()
  transaction.save()
  analytics.save()
}

export function handleUnwind(event: UnwindEvent): void {
  // Load the market entity using the market address from the event
  let market = loadMarket(event, event.address)
  // Update the market state by retrieving fresh data from the state contract
  let marketState = updateMarketState(market.id)
  // Load the account entity corresponding to the sender of the transaction
  let sender = loadAccount(event.params.sender)
  // Convert the sender's ID to an Address type for further usage
  let senderAddress = Address.fromBytes(sender.id)

  // Retrieve the position ID from the event and load the corresponding position entity
  let positionId = event.params.positionId
  let position = loadPosition(event, senderAddress, market, positionId)
  // Track the current number of unwinds for this position
  let unwindNumber = position.numberOfUniwnds

  // Increment the number of unwinds for this position
  position.mint = position.mint.plus(event.params.mint)
  position.numberOfUniwnds = position.numberOfUniwnds.plus(BigInt.fromI32(1))

  // Update the market's open interest values based on the current market state
  market.oiLong = marketState.oiLong
  market.oiShort = marketState.oiShort

  // Load or create the Transaction entity for this event
  let transaction = loadTransaction(event)
  // Create a new Unwind entity to represent this unwind operation
  let unwind = new Unwind(position.id.concatI32(unwindNumber.toI32())) as Unwind

  // Initialize variables for the PnL, transfer amount, and fee amount
  let transferAmount = ZERO_BI
  let transferFeeAmount = ZERO_BI
  let pnl = ZERO_BI

  // Fraction of the position unwound BEFORE this transaction
  const fractionUnwound = position.fractionUnwound
  // This unwind size = initialCollateral * (1 - fractionUnwound) * unwindFraction
  const fractionOfPosition = (ONE_18DEC_BI.minus(fractionUnwound)).times(event.params.fraction).div(ONE_18DEC_BI)
  const unwindSize = position.initialCollateral
    .times(
      fractionOfPosition
    ).div(
      ONE_18DEC_BI
    )

  // Retrieve the transaction receipt and load the factory entity associated with the market
  let receipt = event.receipt
  let factory = Factory.load(market.factory)

  // This block of code is to get `transferAmount` and `transferFeeAmount` from the logs
  // Unwind transaction consists of 4 relevant logs:
  // Unwind, (Approve for the first Unwind in the market), Transfer from SC to user, Transfer from SC to fee recipient
  // The code below adjusts the index to correctly identify the transfer logs

  if (receipt && factory) {
    // Initialize the index for the Unwind event log
    let unwindIndex = 0

    // Iterate over the logs to find the log corresponding to the Unwind event
    for (let i = 0; i < receipt.logs.length; i++) {
      if (receipt.logs[i].logIndex.toI32() === event.logIndex.toI32()) {
        unwindIndex = i
        break
      }
    }

    // Check if the next log is not an ERC20 transfer event, adjust index if necessary
    // The first Unwind event on each market emits an Approve event after the Unwind event
    if (receipt.logs[unwindIndex + 1].topics[0].notEqual(TRANSFER_SIG)) {
      unwindIndex += 1
    }

    // Calculate the index for the transfer event log (user transfer)
    const userTransferIndex = +unwindIndex + 2
    const feeIndex = +unwindIndex + 3

    // Extract the first topic and address of the user transfer log
    const _topic0user = receipt.logs[userTransferIndex].topics[0]
    const _addressuser = receipt.logs[userTransferIndex].address

    // Find the log that matches the ERC20 transfer to the owner
    if (
      _topic0user.equals(TRANSFER_SIG) &&
      _addressuser.toHexString() == OVL_ADDRESS &&
      receipt.logs[userTransferIndex].topics.length > 1
    ) {
      // Decode the recipient address from the log's topics
      let topics2address = ethereum.decode('address', receipt.logs[userTransferIndex].topics[2])!.toAddress()

      // Check if the recipient is the sender and decode the transfer amount
      if (topics2address == event.params.sender) {
        const _transferAmount = receipt.logs[userTransferIndex].data
        // Save transferAmount from the ERC20 Transfer event
        transferAmount = ethereum.decode('uin256', _transferAmount)!.toBigInt()
        // Calculate PnL = transferAmount - unwindSize
        pnl = transferAmount.minus(unwindSize)
      } else {
        // Log an error if the recipient does not match the expected sender
        log.error("handleUnwind: 2nd if: transaction: {}, unwindIndex: {}, userTransferIndex {}", [
          event.transaction.hash.toHexString(),
          unwindIndex.toString(),
          userTransferIndex.toString()
        ])
      }
    } else {
      // Log an error if the log does not match the expected ERC20 transfer event
      log.error("handleUnwind: 1st if: transaction: {}, unwindIndex: {}, userTransferIndex {}", [
        event.transaction.hash.toHexString(),
        unwindIndex.toString(),
        userTransferIndex.toString()
      ])
    }

    // Extract the first topic and address of the fee transfer log
    const _topic0 = receipt.logs[feeIndex].topics[0]
    const _address = receipt.logs[feeIndex].address

    // Find the log that matches the ERC20 transfer to the fee recipient
    if (
      _topic0.equals(TRANSFER_SIG) &&
      _address.toHexString() == OVL_ADDRESS &&
      receipt.logs[feeIndex].topics.length > 1
    ) {
      // Decode the recipient address from the log's topics
      let topics2address = ethereum.decode('address', receipt.logs[feeIndex].topics[2])!.toAddress()

      // Check if the recipient is the fee recipient and decode the transfer amount
      if (topics2address.toHexString().toLowerCase() == factory.feeRecipient.toLowerCase()) {
        const _transferAmount = receipt.logs[feeIndex].data
        // Save the transferFeeAmount from the ERC20 Transfer event
        transferFeeAmount = ethereum.decode('uin256', _transferAmount)!.toBigInt()
      } else {
        // Log an error if the recipient does not match the expected fee recipient
        log.error("handleUnwind: 2nd if: transaction: {}, unwindIndex: {}, feeIndex {}", [
          event.transaction.hash.toHexString(),
          unwindIndex.toString(),
          feeIndex.toString()
        ])
      }
    } else {
      // Log an error if the log does not match the expected ERC20 transfer event
      log.error("handleUnwind: 1st if: transaction: {}, unwindIndex: {}, feeIndex {}", [
        event.transaction.hash.toHexString(),
        unwindIndex.toString(),
        feeIndex.toString()
      ])
    }
  }

  // Assign calculated values to the Unwind entity based on the event and calculations
  unwind.position = position.id
  unwind.owner = sender.id
  unwind.size = unwindSize
  unwind.transferAmount = transferAmount
  unwind.pnl = pnl
  unwind.feeAmount = transferFeeAmount
  unwind.currentOi = position.currentOi // TODO remove
  unwind.currentDebt = position.currentDebt
  unwind.isLong = position.isLong
  unwind.price = event.params.price
  unwind.fraction = event.params.fraction
  unwind.fractionOfPosition = fractionOfPosition
  unwind.volume = transferAmount.plus(position.initialDebt.times(fractionOfPosition).div(ONE_18DEC_BI))
  unwind.mint = event.params.mint
  unwind.unwindNumber = unwindNumber
  unwind.collateral = ZERO_BI
  unwind.value = ZERO_BI
  unwind.timestamp = transaction.timestamp
  unwind.transaction = transaction.id

  // Analytics update: update overall metrics
  let analytics = loadAnalytics(market.factory)
  analytics.totalTransactions = analytics.totalTransactions.plus(ONE_BI)
  analytics.totalTokensLocked = analytics.totalTokensLocked.minus(position.initialCollateral.times(fractionOfPosition).div(ONE_18DEC_BI))
  analytics.totalVolumeUnwinds = analytics.totalVolumeUnwinds.plus(unwind.volume)
  analytics.totalVolume = analytics.totalVolume.plus(unwind.volume)

  updateAnalyticsHourData(analytics, event.block.timestamp)

  // Update the position's current debt and open interest
  position.currentDebt = position.currentDebt.times(ONE_18DEC_BI.minus(unwind.fraction)).div(ONE_18DEC_BI)

  // Calculate the amount of open interest unwound
  let oiUnwound: BigInt; // used later for fundingPayment calculations

  if (position.isLong) {
    oiUnwound = market.oiLong.minus(event.params.oiAfterUnwind)
    market.oiLong = event.params.oiAfterUnwind
    market.oiLongShares = event.params.oiSharesAfterUnwind
  } else {
    oiUnwound = market.oiShort.minus(event.params.oiAfterUnwind)
    market.oiShort = event.params.oiAfterUnwind
    market.oiShortShares = event.params.oiSharesAfterUnwind
  }

  // Update market-level metrics with the calculated fee and notional
  market.totalUnwindFees = market.totalUnwindFees.plus(transferFeeAmount)
  market.numberOfUnwinds = market.numberOfUnwinds.plus(ONE_BI)
  market.totalFees = market.totalFees.plus(transferFeeAmount)
  market.totalVolume = market.totalVolume.plus(unwind.volume)
  market.totalMint = market.totalMint.plus(event.params.mint)

  // Calculate the updated fraction unwound for the position
  position.fractionUnwound =
    ONE_18DEC_BI
      .minus(
        (ONE_18DEC_BI.minus(fractionUnwound))
          .times
          (ONE_18DEC_BI.minus(event.params.fraction))
          .div(ONE_18DEC_BI)
      )

  // Calculate the funding payment for the unwind operation
  // funding = exitPrice * (oiUnwound - oiInitial * fractionUnwound)
  const fundingPayment = event.params.price.times(
    oiUnwound.minus(
      position.initialOi.times(fractionOfPosition)
    )
  )
  unwind.fundingPayment = fundingPayment

  // Update the sender's metrics: increment unwinds, update realized PnL, and decrement open positions if fully unwound
  sender.numberOfUnwinds = sender.numberOfUnwinds.plus(ONE_BI)
  sender.realizedPnl = sender.realizedPnl.plus(pnl)
  if (event.params.fraction == ONE_18DEC_BI) {
    sender.numberOfOpenPositions = sender.numberOfOpenPositions.minus(ONE_BI)
  }

  // Update referral rewards and trader epoch volume for the sender
  updateReferralRewards(event, event.params.sender, transferFeeAmount)
  updateTraderEpochVolume(event.params.sender, unwind.volume)
  sender.ovlVolumeTraded = sender.ovlVolumeTraded.plus(unwind.volume)

  // Update hourly market data with the new position's notional
  updateMarketHourData(market, event.block.timestamp, unwind.volume, event.params.mint)

  // Save all the updated and new entities
  position.save()
  market.save()
  unwind.save()
  sender.save()
  transaction.save()
  analytics.save()
}


export function handleEmergencyWithdraw(event: EmergencyWithdrawEvent): void {
  // Load the market entity using the market address from the event
  let market = loadMarket(event, event.address)
  // Update the market state by retrieving fresh data from the state contract
  let marketState = updateMarketState(market.id)
  // Load the account entity corresponding to the sender of the transaction
  let sender = loadAccount(event.params.sender)

  // Convert the sender's ID to an Address type for further usage
  let senderAddress = Address.fromBytes(sender.id)

  // Retrieve the position ID from the event and load the corresponding position entity
  let positionId = event.params.positionId
  let position = loadPosition(event, senderAddress, market, positionId)
  // Track the current number of unwinds for this position
  let unwindNumber = position.numberOfUniwnds

  // Increment the number of unwinds for this position
  position.numberOfUniwnds = position.numberOfUniwnds.plus(BigInt.fromI32(1))

  // Update the market's open interest values based on the current market state
  market.oiLong = marketState.oiLong
  market.oiShort = marketState.oiShort

  // Load or create the Transaction entity for this event
  let transaction = loadTransaction(event)
  // Create a new Unwind entity to represent this emergency withdrawal
  let unwind = new Unwind(position.id.concatI32(unwindNumber.toI32())) as Unwind

  // Calculate the fraction of the position that was unwound before this transaction
  const fractionUnwound = position.fractionUnwound
  // Calculate the fraction of the position being unwound in this transaction
  const fractionOfPosition = (ONE_18DEC_BI.minus(fractionUnwound)).times(ONE_18DEC_BI).div(ONE_18DEC_BI)

  // Assign values to the Unwind entity based on the event and position data
  unwind.position = position.id
  unwind.owner = sender.id
  unwind.size = event.params.collateral // The size of the unwind is the collateral being withdrawn
  unwind.transferAmount = event.params.collateral // The transfer amount is the same as the withdrawn collateral
  unwind.pnl = ZERO_BI // PnL is zero since it's an emergency withdrawal
  unwind.feeAmount = ZERO_BI // No fees are charged during an emergency withdrawal
  unwind.currentOi = position.currentOi // Open interest at the time of the emergency withdrawal
  unwind.currentDebt = position.currentDebt // Debt at the time of the emergency withdrawal
  unwind.isLong = position.isLong // Whether the position was long or short
  unwind.price = ZERO_BI // Price is not applicable in an emergency withdrawal
  unwind.fraction = ONE_18DEC_BI // The entire position is unwound
  unwind.fractionOfPosition = fractionOfPosition // Fraction of the original position unwound
  unwind.volume = ZERO_BI // No trading volume associated with an emergency withdrawal
  unwind.mint = ZERO_BI // No minting occurs in an emergency withdrawal
  unwind.unwindNumber = unwindNumber // The current unwind number for this position
  unwind.collateral = ZERO_BI // Collateral is set to zero since it's withdrawn
  unwind.value = ZERO_BI // Value is set to zero as the position is closed
  unwind.timestamp = transaction.timestamp // Timestamp of the transaction
  unwind.transaction = transaction.id // ID of the transaction
  unwind.fundingPayment = ZERO_BI

  // Reset the position's open interest and debt to zero since the position is fully unwound
  position.currentOi = ZERO_BI
  position.currentDebt = ZERO_BI

  // Increment the total number of unwinds in the market
  market.numberOfUnwinds = market.numberOfUnwinds.plus(ONE_BI)

  // Set the fraction unwound to 1, indicating the entire position has been unwound
  position.fractionUnwound = ONE_18DEC_BI

  // Update the sender's metrics: increment unwinds and decrement open positions
  sender.numberOfUnwinds = sender.numberOfUnwinds.plus(ONE_BI)
  sender.numberOfOpenPositions = sender.numberOfOpenPositions.minus(ONE_BI)

  // Save the updated entities to the subgraph store
  position.save()
  market.save()
  unwind.save()
  sender.save()
  transaction.save()
}

export function handleCacheRiskCalc(event: CacheRiskCalcEvent): void {
  let market = loadMarket(event, event.address)

  market.dpUpperLimit = event.params.newDpUpperLimit

  market.save()
}

export function handleUpdate(event: UpdateEvent): void {
  let market = loadMarket(event, event.address)

  market.oiLong = event.params.oiLong
  market.oiShort = event.params.oiShort

  market.save()
}

export function handleLiquidate(event: LiquidateEvent): void {
  let market = loadMarket(event, event.address)
  let sender = loadAccount(event.params.sender)
  let owner = loadAccount(event.params.owner)

  let ownerAddress = Address.fromBytes(owner.id)

  let positionId = event.params.positionId
  let position = loadPosition(event, ownerAddress, market, positionId)

  let receipt = event.receipt
  // initialize variables
  let transferFeeAmount = ZERO_BI
  let transferLiquidatorAmount = ZERO_BI
  let factory = Factory.load(market.factory)
  if (receipt && factory) {
    const logLength = receipt.logs.length
    log.warning("handleLiquidate: START: tx: {}, transactionLogIndex: {}, logIndex: {}, transaction.index: {}, logs length: {}, logs[0].logIndex: {}, logs[0].transactionIndex: {}, logs[0].transactionLogIndex: {}", [
      event.transaction.hash.toHexString(),
      event.transactionLogIndex.toI32().toString(),
      event.logIndex.toI32().toString(),
      event.transaction.index.toI32().toString(),
      logLength.toString(),
      receipt.logs[0].logIndex.toI32().toString(),
      receipt.logs[0].transactionIndex.toI32().toString(),
      receipt.logs[0].transactionLogIndex.toI32().toString(),
    ])
    let liquidateIndex = 0
    for (let i = 0; i < receipt.logs.length; i++) {
      if (receipt.logs[i].logIndex.toI32() === event.logIndex.toI32()) {
        liquidateIndex = i
        break
      }
    }
    if (receipt.logs[liquidateIndex + 1].topics[0].notEqual(TRANSFER_SIG)) {
      liquidateIndex += 1
    }
    const feeIndex = +liquidateIndex + 3
    let _topic0 = receipt.logs[feeIndex].topics[0]
    let _address = receipt.logs[feeIndex].address
    // find the log that matches the ERC20 transfer to the feeRecipient
    if (
      _topic0.equals(TRANSFER_SIG) &&
      _address.toHexString() == OVL_ADDRESS &&
      receipt.logs[feeIndex].topics.length > 1
    ) {
      let topics2address = ethereum.decode('address', receipt.logs[feeIndex].topics[2])!.toAddress()
      if (topics2address.toHexString().toLowerCase() == factory.feeRecipient.toLowerCase()) {
        const _transferAmount = receipt.logs[feeIndex].data
        transferFeeAmount = ethereum.decode('uin256', _transferAmount)!.toBigInt()
      } else {
        log.error("handleLiquidate: 2nd if: transaction: {}, liquidateIndex: {}, feeIndex {}", [
          event.transaction.hash.toHexString(),
          liquidateIndex.toString(),
          feeIndex.toString()
        ])
      }
    } else {
      log.error("handleLiquidate: 1st if: transaction: {}, liquidateIndex: {}, feeIndex {}", [
        event.transaction.hash.toHexString(),
        liquidateIndex.toString(),
        feeIndex.toString()
      ])
    }
    const liquidatorTransferIndex = +liquidateIndex + 2
    _topic0 = receipt.logs[liquidatorTransferIndex].topics[0]
    _address = receipt.logs[liquidatorTransferIndex].address
    // find the log that matches the ERC20 transfer to the sender
    if (
      _topic0.equals(TRANSFER_SIG) &&
      _address.toHexString() == OVL_ADDRESS &&
      receipt.logs[liquidatorTransferIndex].topics.length > 1
    ) {
      let topics2address = ethereum.decode('address', receipt.logs[liquidatorTransferIndex].topics[2])!.toAddress()
      if (topics2address == Address.fromBytes(sender.id)) {
        const _transferAmount = receipt.logs[liquidatorTransferIndex].data
        transferLiquidatorAmount = ethereum.decode('uin256', _transferAmount)!.toBigInt()
      } else {
        log.error("handleLiquidate: 2nd if: transaction: {}, liquidateIndex: {}, liquidatorTransferIndex {}", [
          event.transaction.hash.toHexString(),
          liquidateIndex.toString(),
          liquidatorTransferIndex.toString()
        ])
      }
    } else {
      log.error("handleLiquidate: 1st if: transaction: {}, liquidateIndex: {}, liquidatorTransferIndex {}", [
        event.transaction.hash.toHexString(),
        liquidateIndex.toString(),
        liquidatorTransferIndex.toString()
      ])
    }
  }
  const fractionOfPosition = ONE_18DEC_BI.minus(position.fractionUnwound)
  const liquidateSize = position.initialCollateral.times(fractionOfPosition).div(ONE_18DEC_BI)

  owner.realizedPnl = owner.realizedPnl.minus(liquidateSize)

  position.mint = position.mint.plus(event.params.mint)
  position.isLiquidated = true
  position.fractionUnwound = ONE_18DEC_BI

  let oiUnwound: BigInt; // used later for fundingPayment calculations

  if (position.isLong) {
    oiUnwound = market.oiLong.minus(event.params.oiAfterLiquidate)
    market.oiLong = event.params.oiAfterLiquidate
    market.oiLongShares = event.params.oiSharesAfterLiquidate
  } else {
    oiUnwound = market.oiShort.minus(event.params.oiAfterLiquidate)
    market.oiShort = event.params.oiAfterLiquidate
    market.oiShortShares = event.params.oiSharesAfterLiquidate
  }
  market.totalLiquidateFees = market.totalLiquidateFees.plus(transferFeeAmount)
  market.numberOfLiquidates = market.numberOfLiquidates.plus(ONE_BI)
  market.totalFees = market.totalFees.plus(transferFeeAmount)

  let transaction = loadTransaction(event)
  let liquidate = new Liquidate(position.id) as Liquidate

  // funding = exitPrice * (oiUnwound - oiInitial * fractionUnwound)
  // oiUnwound = oiBeforeUnwind - oiAfterUnwind
  const fundingPayment = event.params.price.times(
    oiUnwound.minus(fractionOfPosition)
  )
  liquidate.fundingPayment = fundingPayment
  liquidate.position = position.id
  liquidate.owner = owner.id
  liquidate.sender = sender.id
  liquidate.currentOi = position.currentOi
  liquidate.currentDebt = position.currentDebt
  liquidate.isLong = position.isLong
  liquidate.price = event.params.price
  liquidate.mint = event.params.mint
  liquidate.collateral = ZERO_BI
  liquidate.value = ZERO_BI
  liquidate.timestamp = transaction.timestamp
  liquidate.transaction = transaction.id
  liquidate.fractionOfPosition = fractionOfPosition
  liquidate.size = liquidateSize
  liquidate.liquidationFee = transferLiquidatorAmount
  // marginToBurn  = feeRecipientAmount / (1/ MaintenanceMarginBurnRate - 1) 
  const marginToBurn = transferFeeAmount.times(ONE_18DEC_BI).div(ONE_18DEC_BI.times(ONE_18DEC_BI).div(market.maintenanceMarginBurnRate).minus(ONE_18DEC_BI))
  // volume = transferFeeAmount + initialDebt * fractionOfPosition / ONE + transferLiquidatorAmount
  liquidate.volume = transferFeeAmount.plus(position.initialDebt.times(fractionOfPosition).div(ONE_18DEC_BI)).plus(transferLiquidatorAmount)
  liquidate.marginToBurn = marginToBurn
  liquidate.transferFeeAmount = transferFeeAmount

  // analytics update
  let analytics = loadAnalytics(market.factory)
  analytics.totalTransactions = analytics.totalTransactions.plus(ONE_BI)
  analytics.totalTokensLocked = analytics.totalTokensLocked.minus(position.initialCollateral.times(fractionOfPosition).div(ONE_18DEC_BI))
  analytics.totalVolumeLiquidations = analytics.totalVolumeLiquidations.plus(liquidate.volume)
  analytics.totalVolume = analytics.totalVolume.plus(liquidate.volume)

  updateAnalyticsHourData(analytics, event.block.timestamp)

  market.totalVolume = market.totalVolume.plus(liquidate.volume)
  market.totalMint = market.totalMint.plus(event.params.mint)

  position.currentOi = ZERO_BI
  position.currentDebt = ZERO_BI

  owner.numberOfLiquidatedPositions = owner.numberOfLiquidatedPositions.plus(ONE_BI)
  owner.numberOfOpenPositions = owner.numberOfOpenPositions.minus(ONE_BI)

  updateMarketHourData(market, event.block.timestamp, liquidate.volume, event.params.mint)

  position.save()
  market.save()
  liquidate.save()
  sender.save()
  owner.save()
  transaction.save()
  analytics.save()
}


export function handleFeeRecipientUpdated(event: FeeRecipientUpdated): void {
  let factoryAddress = event.address
  let factory = loadFactory(factoryAddress)
  factory.feeRecipient = event.params.recipient.toHexString()

  factory.save()
}

export function handleFeedFactoryAdded(event: FeedFactoryAdded): void { }


export function handleParamUpdated(event: ParamUpdated): void {
  let market = loadMarket(event, event.params.market)
  let riskParamIndex = event.params.name
  let updateValue = event.params.value

  if (riskParamIndex === RISK_PARAMS.k) market.k = updateValue
  if (riskParamIndex === RISK_PARAMS.lmbda) market.lmbda = updateValue
  if (riskParamIndex === RISK_PARAMS.delta) market.delta = updateValue
  if (riskParamIndex === RISK_PARAMS.capPayoff) market.capPayoff = updateValue
  if (riskParamIndex === RISK_PARAMS.capLeverage) market.capLeverage = updateValue
  if (riskParamIndex === RISK_PARAMS.circuitBreakerWindow) market.circuitBreakerWindow = updateValue
  if (riskParamIndex === RISK_PARAMS.circuitBreakerMintTarget) market.circuitBreakerMintTarget = updateValue
  if (riskParamIndex === RISK_PARAMS.maintenanceMarginFraction) market.maintenanceMarginFraction = updateValue
  if (riskParamIndex === RISK_PARAMS.maintenanceMarginBurnRate) market.maintenanceMarginBurnRate = updateValue
  if (riskParamIndex === RISK_PARAMS.liquidationFeeRate) market.liquidationFeeRate = updateValue
  if (riskParamIndex === RISK_PARAMS.tradingFeeRate) market.tradingFeeRate = updateValue
  if (riskParamIndex === RISK_PARAMS.minCollateral) market.minCollateral = updateValue
  if (riskParamIndex === RISK_PARAMS.priceDriftUpperLimit) market.priceDriftUpperLimit = updateValue
  if (riskParamIndex === RISK_PARAMS.averageBlockTime) market.averageBlockTime = updateValue

  market.save()
}

export function handleEmergencyShutdown(event: EmergencyShutdown): void {
  let market = loadMarket(event, event.params.market)
  market.isShutdown = true

  market.save()
}