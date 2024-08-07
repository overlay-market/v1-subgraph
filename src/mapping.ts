import { ethereum, Address, BigInt, log } from "@graphprotocol/graph-ts"
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
  let factory = loadFactory(FACTORY_ADDRESS.toLowerCase())

  factory.marketCount = factory.marketCount.plus(ONE_BI)

  let marketAddress = event.params.market
  let feedAddress = event.params.feed
  let marketContract = OverlayV1Market.bind(event.params.market)
  let market = new Market(marketAddress.toHexString()) as Market
  let marketState = updateMarketState(market.id)

  market.feedAddress = feedAddress.toHexString()
  market.factory = factory.id
  market.createdAtTimestamp = event.block.timestamp
  market.createdAtBlockNumber = event.block.number

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
  let market = loadMarket(event, event.address)
  let marketState = updateMarketState(market.id)
  let sender = loadAccount(event.params.sender)

  let marketAddress = Address.fromString(market.id)
  let senderAddress = Address.fromString(sender.id)

  let positionId = event.params.positionId
  let id = market.id.concat('-').concat(positionId.toHexString())
  let position = new Position(id) as Position

  let transferFeeAmount = ZERO_BI
  let receipt = event.receipt
  let factory = Factory.load(market.factory.toLowerCase())

  if (receipt && factory) {
    const logLength = receipt.logs.length
    log.warning("handleBuild: START: tx: {}, transactionLogIndex: {}, logIndex: {}, transaction.index: {}, logs length: {}, logs[0].logIndex: {}, logs[0].transactionIndex: {}, logs[0].transactionLogIndex: {}", [
      event.transaction.hash.toHexString(),
      event.transactionLogIndex.toI32().toString(),
      event.logIndex.toI32().toString(),
      event.transaction.index.toI32().toString(),
      logLength.toString(),
      receipt.logs[0].logIndex.toI32().toString(),
      receipt.logs[0].transactionIndex.toI32().toString(),
      receipt.logs[0].transactionLogIndex.toI32().toString(),
    ])
    let buildIndex = 0
    for (let i = 0; i < receipt.logs.length; i++) {
      if (receipt.logs[i].logIndex.toI32() === event.logIndex.toI32()) {
        buildIndex = i
        break
      }
    }
    if (receipt.logs[buildIndex + 1].topics[0].notEqual(TRANSFER_SIG)) {
      buildIndex += 1
    }
    let index = +buildIndex + 2
    log.warning("handleBuild: indexes: tx {}, buildIndex: {}, index: {}", [
      event.transaction.hash.toHexString(),
      buildIndex.toString(),
      index.toString()
    ])
    if (receipt.logs[buildIndex + 1].topics[0].notEqual(TRANSFER_SIG)) {
      index += 1
    }
    const _topic0 = receipt.logs[index].topics[0]
    const _address = receipt.logs[index].address
    // find the log that matches the ERC20 transfer to the owner
    if (
      _topic0.equals(TRANSFER_SIG) &&
      _address.toHexString() == OVL_ADDRESS &&
      receipt.logs[index].topics.length > 1
    ) {
      let topics2address = ethereum.decode('address', receipt.logs[index].topics[2])!.toAddress()
      log.warning("handleBuild: 1 stage receipt found: tx: {}, 2address: {}, feeRecipient: {}", [
        event.transaction.hash.toHexString(),
        topics2address.toHexString(),
        factory.feeRecipient.toLowerCase()
      ])
      if (topics2address.toHexString().toLowerCase() == factory.feeRecipient.toLowerCase()) {
        const _transferAmount = receipt.logs[index].data
        transferFeeAmount = ethereum.decode('uin256', _transferAmount)!.toBigInt()
        log.warning("handleBuild: 2 stage receipt found: tx{},  transferFeeAmount: {}", [
          event.transaction.hash.toHexString(),
          transferFeeAmount.toHexString()
        ])
      } else {
        log.error("handleBuild: 2nd if: transaction: {}, buildIndex: {}, index {}", [
          event.transaction.hash.toHexString(),
          buildIndex.toString(),
          index.toString()
        ])
      }
    } else {
      log.error("handleBuild: 1st if: transaction: {}, buildIndex: {}, index {}", [
        event.transaction.hash.toHexString(),
        buildIndex.toString(),
        index.toString()
      ])
    }
  } else {
    log.error("handleBuild: receipt && factory: tx {}, {}, {}", [
      event.transaction.hash.toHexString(),
      !receipt ? "no receipt" : "receipt found",
      !factory ? "no factory" : factory.feeRecipient
    ])
  }

  position.owner = sender.id
  position.positionId = positionId.toHexString()
  position.market = market.id
  position.initialOi = event.params.oi
  position.initialDebt = event.params.debt

  let initialCollateral = stateContract.cost(marketAddress, senderAddress, positionId)
  let initialNotional = initialCollateral.plus(event.params.debt)
  position.initialCollateral = initialCollateral
  position.initialNotional = initialNotional
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

  if (position.isLong) {
    market.oiLong = event.params.oiAfterBuild
    market.oiLongShares = event.params.oiSharesAfterBuild
  } else {
    market.oiShort = event.params.oiAfterBuild
    market.oiShortShares = event.params.oiSharesAfterBuild
  }
  market.totalBuildFees = market.totalBuildFees.plus(transferFeeAmount)
  market.numberOfBuilds = market.numberOfBuilds.plus(ONE_BI)
  market.totalFees = market.totalFees.plus(transferFeeAmount)
  market.totalVolume = market.totalVolume.plus(initialNotional)

  let transaction = loadTransaction(event)
  let build = new Build(position.id) as Build

  build.position = position.id
  build.owner = sender.id
  build.currentOi = event.params.oi
  build.currentDebt = event.params.debt
  build.isLong = event.params.isLong
  build.price = event.params.price
  build.collateral = initialCollateral
  build.value = stateContract.value(marketAddress, senderAddress, positionId)
  build.timestamp = transaction.timestamp
  build.transaction = transaction.id
  build.feeAmount = transferFeeAmount

  // analytics update
  let analytics = loadAnalytics(market.factory.toLowerCase())
  if (sender.ovlVolumeTraded.equals(ZERO_BI)) {
    analytics.totalUsers = analytics.totalUsers.plus(ONE_BI)
  }
  analytics.totalTransactions = analytics.totalTransactions.plus(ONE_BI)
  analytics.totalTokensLocked = analytics.totalTokensLocked.plus(initialCollateral)
  analytics.totalVolumeBuilds = analytics.totalVolumeBuilds.plus(initialNotional)
  analytics.totalVolume = analytics.totalVolume.plus(initialNotional)

  updateAnalyticsHourData(analytics, event.block.timestamp)

  sender.numberOfOpenPositions = sender.numberOfOpenPositions.plus(ONE_BI)

  updateReferralRewards(event, event.params.sender, transferFeeAmount)
  updateTraderEpochVolume(event.params.sender, initialNotional)
  sender.ovlVolumeTraded = sender.ovlVolumeTraded.plus(initialNotional)

  updateMarketHourData(market, event.block.timestamp, initialNotional, ZERO_BI)

  position.save()
  market.save()
  build.save()
  sender.save()
  transaction.save()
  analytics.save()
}

export function handleUnwind(event: UnwindEvent): void {
  let market = loadMarket(event, event.address)
  let marketState = updateMarketState(market.id)
  let sender = loadAccount(event.params.sender)
  let marketAddress = Address.fromString(market.id)
  let senderAddress = Address.fromString(sender.id)

  let positionId = event.params.positionId
  let position = loadPosition(event, senderAddress, market, positionId)
  let unwindNumber = position.numberOfUniwnds

  position.mint = position.mint.plus(event.params.mint)
  position.numberOfUniwnds = position.numberOfUniwnds.plus(BigInt.fromI32(1))

  market.oiLong = marketState.oiLong
  market.oiShort = marketState.oiShort

  let transaction = loadTransaction(event)
  let unwind = new Unwind(position.id.concat('-').concat(unwindNumber.toString())) as Unwind

  let receipt = event.receipt
  // initialize variables
  let transferAmount = ZERO_BI
  let transferFeeAmount = ZERO_BI
  let pnl = ZERO_BI
  // fraction of the position unwound BEFORE this transaction
  const fractionUnwound = position.fractionUnwound
  // this unwind size = intialCollateral * (1 - fractionUnwound) * unwindFraction
  const fractionOfPosition = (ONE_18DEC_BI.minus(fractionUnwound)).times(event.params.fraction).div(ONE_18DEC_BI)
  const unwindSize = position.initialCollateral
    .times(
      fractionOfPosition
    ).div(
      ONE_18DEC_BI
    )

  let factory = Factory.load(market.factory.toLowerCase())
  if (receipt && factory) {
    const logLength = receipt.logs.length
    log.warning("handleUnwind: START: tx: {}, transactionLogIndex: {}, logIndex: {}, transaction.index: {}, logs length: {}, logs[0].logIndex: {}, logs[0].transactionIndex: {}, logs[0].transactionLogIndex: {}", [
      event.transaction.hash.toHexString(),
      event.transactionLogIndex.toI32().toString(),
      event.logIndex.toI32().toString(),
      event.transaction.index.toI32().toString(),
      logLength.toString(),
      receipt.logs[0].logIndex.toI32().toString(),
      receipt.logs[0].transactionIndex.toI32().toString(),
      receipt.logs[0].transactionLogIndex.toI32().toString(),
    ])
    let unwindIndex = 0
    for (let i = 0; i < receipt.logs.length; i++) {
      if (receipt.logs[i].logIndex.toI32() === event.logIndex.toI32()) {
        unwindIndex = i
        break
      }
    }
    if (receipt.logs[unwindIndex + 1].topics[0].notEqual(TRANSFER_SIG)) {
      unwindIndex += 1
    }
    const userTransferIndex = +unwindIndex + 2
    const feeIndex = +unwindIndex + 3
    const _topic0user = receipt.logs[userTransferIndex].topics[0]
    const _addressuser = receipt.logs[userTransferIndex].address
    // find the log that matches the ERC20 transfer to the owner
    if (
      _topic0user.equals(TRANSFER_SIG) &&
      _addressuser.toHexString() == OVL_ADDRESS &&
      receipt.logs[userTransferIndex].topics.length > 1
    ) {
      let topics2address = ethereum.decode('address', receipt.logs[userTransferIndex].topics[2])!.toAddress()
      if (topics2address == event.params.sender) {
        const _transferAmount = receipt.logs[userTransferIndex].data
        // save transferAmount from the ERC20 Transfer event
        transferAmount = ethereum.decode('uin256', _transferAmount)!.toBigInt()
        // calculate pnl = tranferAmount - unwindSize
        pnl = transferAmount.minus(
          unwindSize
        )
      } else {
        log.error("handleUnwind: 2nd if: transaction: {}, unwindIndex: {}, userTransferIndex {}", [
          event.transaction.hash.toHexString(),
          unwindIndex.toString(),
          userTransferIndex.toString()
        ])
      }
    } else {
      log.error("handleUnwind: 1st if: transaction: {}, unwindIndex: {}, userTransferIndex {}", [
        event.transaction.hash.toHexString(),
        unwindIndex.toString(),
        userTransferIndex.toString()
      ])
    }
    const _topic0 = receipt.logs[feeIndex].topics[0]
    const _address = receipt.logs[feeIndex].address
    // find the log that matches the ERC20 transfer to the owner
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
        log.error("handleUnwind: 2nd if: transaction: {}, unwindIndex: {}, feeIndex {}", [
          event.transaction.hash.toHexString(),
          unwindIndex.toString(),
          feeIndex.toString()
        ])
      }
    } else {
      log.error("handleUnwind: 1st if: transaction: {}, unwindIndex: {}, feeIndex {}", [
        event.transaction.hash.toHexString(),
        unwindIndex.toString(),
        feeIndex.toString()
      ])
    }
  }

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

  // analytics update
  let analytics = loadAnalytics(market.factory.toLowerCase())
  analytics.totalTransactions = analytics.totalTransactions.plus(ONE_BI)
  analytics.totalTokensLocked = analytics.totalTokensLocked.minus(position.initialCollateral.times(fractionOfPosition).div(ONE_18DEC_BI))
  analytics.totalVolumeUnwinds = analytics.totalVolumeUnwinds.plus(unwind.volume)
  analytics.totalVolume = analytics.totalVolume.plus(unwind.volume)

  updateAnalyticsHourData(analytics, event.block.timestamp)

  // position.currentOi = stateContract.oi(marketAddress, senderAddress, positionId)
  position.currentDebt = position.currentDebt.times(ONE_18DEC_BI.minus(unwind.fraction)).div(ONE_18DEC_BI)

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

  market.totalUnwindFees = market.totalUnwindFees.plus(transferFeeAmount)
  market.numberOfUnwinds = market.numberOfUnwinds.plus(ONE_BI)
  market.totalFees = market.totalFees.plus(transferFeeAmount)
  market.totalVolume = market.totalVolume.plus(unwind.volume)
  market.totalMint = market.totalMint.plus(event.params.mint)

  log.warning("fractionUnwound: {}, {}, {}", [
    fractionUnwound.toString(),
    event.params.fraction.toString(),
    ONE_18DEC_BI
      .minus(
        (ONE_18DEC_BI.minus(fractionUnwound))
          .times
          (ONE_18DEC_BI.minus(event.params.fraction))
          .div(ONE_18DEC_BI)
      ).toString()
  ])

  position.fractionUnwound =
    ONE_18DEC_BI
      .minus(
        (ONE_18DEC_BI.minus(fractionUnwound))
          .times
          (ONE_18DEC_BI.minus(event.params.fraction))
          .div(ONE_18DEC_BI)
      )

  // funding = exitPrice * (oiUnwound - oiInitial * fractionUnwound)
  // oiUnwound = oiBeforeUnwind - oiAfterUnwind

  const fundingPayment = event.params.price.times(
    oiUnwound.minus(
      position.initialOi.times(fractionOfPosition)
    )
  )
  unwind.fundingPayment = fundingPayment

  sender.numberOfUnwinds = sender.numberOfUnwinds.plus(ONE_BI)
  sender.realizedPnl = sender.realizedPnl.plus(pnl)
  if (event.params.fraction == ONE_18DEC_BI) {
    sender.numberOfOpenPositions = sender.numberOfOpenPositions.minus(ONE_BI)
  }

  updateReferralRewards(event, event.params.sender, transferFeeAmount)
  updateTraderEpochVolume(event.params.sender, unwind.volume)
  sender.ovlVolumeTraded = sender.ovlVolumeTraded.plus(unwind.volume)

  updateMarketHourData(market, event.block.timestamp, unwind.volume, event.params.mint)

  position.save()
  market.save()
  unwind.save()
  sender.save()
  transaction.save()
  analytics.save()
}

export function handleEmergencyWithdraw(event: EmergencyWithdrawEvent): void {
  let market = loadMarket(event, event.address)
  let marketState = updateMarketState(market.id)
  let sender = loadAccount(event.params.sender)

  let marketAddress = Address.fromString(market.id)
  let senderAddress = Address.fromString(sender.id)

  let positionId = event.params.positionId
  let position = loadPosition(event, senderAddress, market, positionId)
  let unwindNumber = position.numberOfUniwnds

  position.numberOfUniwnds = position.numberOfUniwnds.plus(BigInt.fromI32(1))

  market.oiLong = marketState.oiLong
  market.oiShort = marketState.oiShort

  let transaction = loadTransaction(event)
  let unwind = new Unwind(position.id.concat('-').concat(unwindNumber.toString())) as Unwind

  // fraction of the position unwound BEFORE this transaction
  const fractionUnwound = position.fractionUnwound
  // this unwind size = intialCollateral * (1 - fractionUnwound) * unwindFraction
  const fractionOfPosition = (ONE_18DEC_BI.minus(fractionUnwound)).times(ONE_18DEC_BI).div(ONE_18DEC_BI)

  unwind.position = position.id
  unwind.owner = sender.id
  unwind.size = event.params.collateral
  unwind.transferAmount = event.params.collateral
  unwind.pnl = ZERO_BI
  unwind.feeAmount = ZERO_BI
  unwind.currentOi = position.currentOi
  unwind.currentDebt = position.currentDebt
  unwind.isLong = position.isLong
  unwind.price = ZERO_BI
  unwind.fraction = ONE_18DEC_BI
  unwind.fractionOfPosition = fractionOfPosition
  unwind.volume = ZERO_BI
  unwind.mint = ZERO_BI
  unwind.unwindNumber = unwindNumber
  unwind.collateral = ZERO_BI
  unwind.value = ZERO_BI
  unwind.timestamp = transaction.timestamp
  unwind.transaction = transaction.id

  position.currentOi = ZERO_BI
  position.currentDebt = ZERO_BI

  market.numberOfUnwinds = market.numberOfUnwinds.plus(ONE_BI)

  position.fractionUnwound = ONE_18DEC_BI

  sender.numberOfUnwinds = sender.numberOfUnwinds.plus(ONE_BI)
  sender.numberOfOpenPositions = sender.numberOfOpenPositions.minus(ONE_BI)

  position.save()
  market.save()
  unwind.save()
  sender.save()
  transaction.save()
}

export function handleCacheRiskCalc(event: CacheRiskCalcEvent): void {
  let market = loadMarket(event, event.address)
  let marketState = updateMarketState(market.id)

  market.dpUpperLimit = event.params.newDpUpperLimit

  market.save()
}

export function handleUpdate(event: UpdateEvent): void {
  let market = loadMarket(event, event.address)
  let marketState = updateMarketState(market.id)

  market.oiLong = event.params.oiLong
  market.oiShort = event.params.oiShort

  market.save()
}

export function handleLiquidate(event: LiquidateEvent): void {
  let market = loadMarket(event, event.address)
  let marketState = updateMarketState(market.id)
  let sender = loadAccount(event.params.sender)
  let owner = loadAccount(event.params.owner)

  let marketAddress = Address.fromString(market.id)
  let senderAddress = Address.fromString(sender.id)
  let ownerAddress = Address.fromString(owner.id)

  let positionId = event.params.positionId
  let position = loadPosition(event, ownerAddress, market, positionId)

  let receipt = event.receipt
  // initialize variables
  let transferFeeAmount = ZERO_BI
  let transferLiquidatorAmount = ZERO_BI
  let factory = Factory.load(market.factory.toLowerCase())
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
      if (topics2address.toHexString().toLowerCase() == sender.id.toLowerCase()) {
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
  let analytics = loadAnalytics(market.factory.toLowerCase())
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
  let factoryAddress = event.address.toHexString()
  let factory = loadFactory(factoryAddress.toLowerCase())
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