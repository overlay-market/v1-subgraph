import { ethereum, Address, BigInt, log } from "@graphprotocol/graph-ts"
import { integer } from "@protofire/subgraph-toolkit";
import {
  OverlayV1Factory,
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
  Unwind as UnwindEvent
} from "../generated/templates/OverlayV1Market/OverlayV1Market";

import { Factory, Market, Position, Build, Unwind, Liquidate } from "../generated/schema"
import { OverlayV1Market as MarketTemplate } from './../generated/templates';
import { TRANSFER_SIG, OVL_ADDRESS, FACTORY_ADDRESS, ZERO_BI, ONE_BI, ONE_18DEC_BI, ZERO_BD, ADDRESS_ZERO, factoryContract, stateContract, RISK_PARAMS, PERIPHERY_ADDRESS } from "./utils/constants"
import { loadMarket, loadPosition, loadFactory, loadTransaction, loadAccount } from "./utils";

export function handleMarketDeployed(event: MarketDeployed): void {
  
  // load factory
  let factory = Factory.load(FACTORY_ADDRESS.toLowerCase())
  if (factory === null) {
    factory = new Factory(FACTORY_ADDRESS.toLowerCase())
    factory.marketCount = ZERO_BI
    factory.txCount = ZERO_BI
    factory.totalVolumeOVL = ZERO_BD
    factory.totalFeesOVL = ZERO_BD
    factory.totalValueLockedOVL = ZERO_BD

    factory.feeRecipient = factoryContract.try_feeRecipient().reverted ? ADDRESS_ZERO : factoryContract.try_feeRecipient().value.toHexString()
    factory.owner = factoryContract.try_deployer().reverted ? ADDRESS_ZERO : factoryContract.try_deployer().value.toHexString()
  }

  factory.marketCount = factory.marketCount.plus(ONE_BI)

  let marketAddress = event.params.market
  let feedAddress = event.params.feed
  let marketContract = OverlayV1Market.bind(event.params.market)
  let market = new Market(marketAddress.toHexString()) as Market

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
  market.oiLong = stateContract.ois(marketAddress).value0
  market.oiShort = stateContract.ois(marketAddress).value1
  market.isShutdown = false
  market.totalBuildFees = ZERO_BI
  market.numberOfBuilds = ZERO_BI
  market.totalUnwindFees = ZERO_BI
  market.numberOfUnwinds = ZERO_BI
  market.totalLiquidateFees = ZERO_BI
  market.numberOfLiquidates = ZERO_BI
  market.totalFees = ZERO_BI

  market.save()
  // create tracked market contract based on template
  MarketTemplate.create(event.params.market)
  factory.save()
}

export function handleBuild(event: BuildEvent): void {
  let market = loadMarket(event, event.address)
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
    for (let i=0; i < receipt.logs.length; i++) {
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

  market.oiLong = stateContract.ois(marketAddress).value0
  market.oiShort = stateContract.ois(marketAddress).value1
  market.totalBuildFees = market.totalBuildFees.plus(transferFeeAmount)
  market.numberOfBuilds = market.numberOfBuilds.plus(ONE_BI)
  market.totalFees = market.totalFees.plus(transferFeeAmount)

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
  build.feeAmount =  transferFeeAmount

  sender.numberOfOpenPositions = sender.numberOfOpenPositions.plus(ONE_BI)

  position.save()
  market.save()
  build.save()
  sender.save()
  transaction.save()
}

export function handleUnwind(event: UnwindEvent): void {
  let market = loadMarket(event, event.address)
  let sender = loadAccount(event.params.sender)
  
  let marketAddress = Address.fromString(market.id)
  let senderAddress = Address.fromString(sender.id)
  
  let positionId = event.params.positionId
  let position = loadPosition(event, senderAddress, market, positionId)
  let unwindNumber = position.numberOfUniwnds

  position.mint = position.mint.plus(event.params.mint)
  position.numberOfUniwnds = position.numberOfUniwnds.plus(BigInt.fromI32(1))

  market.oiLong = stateContract.ois(marketAddress).value0
  market.oiShort = stateContract.ois(marketAddress).value1

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
    for (let i=0; i < receipt.logs.length; i++) {
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
  unwind.transferAmount =  transferAmount
  unwind.pnl =  pnl
  unwind.feeAmount =  transferFeeAmount
  unwind.currentOi = position.currentOi
  unwind.currentDebt = position.currentDebt
  unwind.isLong = stateContract.position(marketAddress, senderAddress, positionId).isLong
  unwind.price = event.params.price
  unwind.fraction = event.params.fraction
  unwind.fractionOfPosition = fractionOfPosition
  unwind.volume = transferAmount.plus(position.initialDebt.times(fractionOfPosition).div(ONE_18DEC_BI)) 
  unwind.mint = event.params.mint
  unwind.unwindNumber = unwindNumber
  unwind.collateral = stateContract.collateral(marketAddress, senderAddress, positionId)
  unwind.value = stateContract.value(marketAddress, senderAddress, positionId)
  unwind.timestamp = transaction.timestamp
  unwind.transaction = transaction.id

  position.currentOi = stateContract.oi(marketAddress, senderAddress, positionId)
  position.currentDebt = stateContract.debt(marketAddress, senderAddress, positionId)

  market.totalUnwindFees = market.totalUnwindFees.plus(transferFeeAmount)
  market.numberOfUnwinds = market.numberOfUnwinds.plus(ONE_BI)
  market.totalFees = market.totalFees.plus(transferFeeAmount)

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

  sender.numberOfUnwinds = sender.numberOfUnwinds.plus(ONE_BI)
  sender.realizedPnl = sender.realizedPnl.plus(pnl)
  if (event.params.fraction == ONE_18DEC_BI) {
    sender.numberOfOpenPositions = sender.numberOfOpenPositions.minus(ONE_BI)
  }
  
  position.save()
  market.save()
  unwind.save()
  sender.save()
  transaction.save()
}

export function handleLiquidate(event: LiquidateEvent): void {
  let market = loadMarket(event, event.address)
  let sender = loadAccount(event.params.sender)
  let owner = loadAccount(event.params.owner)

  let marketAddress = Address.fromString(market.id)
  let senderAddress = Address.fromString(sender.id)

  let positionId = event.params.positionId
  let position = loadPosition(event, senderAddress, market, positionId)

  let receipt = event.receipt
  // initialize variables
  let transferFeeAmount = ZERO_BI
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
    for (let i=0; i < receipt.logs.length; i++) {
      if (receipt.logs[i].logIndex.toI32() === event.logIndex.toI32()) {
        liquidateIndex = i
        break
      }
    }
    if (receipt.logs[liquidateIndex + 1].topics[0].notEqual(TRANSFER_SIG)) {
      liquidateIndex += 1
    }
    const feeIndex = +liquidateIndex + 3
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
  }

  owner.realizedPnl = sender.realizedPnl.minus(position.initialCollateral.times(ONE_18DEC_BI.minus(position.fractionUnwound)).div(ONE_18DEC_BI))

  position.mint = position.mint.plus(event.params.mint)
  position.isLiquidated = true
  position.fractionUnwound = ONE_18DEC_BI

  market.oiLong = stateContract.ois(marketAddress).value0
  market.oiShort = stateContract.ois(marketAddress).value1
  market.totalLiquidateFees = market.totalLiquidateFees.plus(transferFeeAmount)
  market.numberOfLiquidates = market.numberOfLiquidates.plus(ONE_BI)
  market.totalFees = market.totalFees.plus(transferFeeAmount)

  let transaction = loadTransaction(event)
  let liquidate = new Liquidate(position.id) as Liquidate

  liquidate.position = position.id
  liquidate.owner = owner.id
  liquidate.sender = sender.id
  liquidate.currentOi = position.currentOi
  liquidate.currentDebt = position.currentDebt
  liquidate.isLong = stateContract.position(marketAddress, senderAddress, positionId).isLong
  liquidate.price = event.params.price
  liquidate.mint = event.params.mint
  liquidate.collateral = stateContract.collateral(marketAddress, senderAddress, positionId)
  liquidate.value = stateContract.value(marketAddress, senderAddress, positionId)
  liquidate.timestamp = transaction.timestamp
  liquidate.transaction = transaction.id

  position.currentOi = stateContract.oi(marketAddress, senderAddress, positionId)
  position.currentDebt = stateContract.debt(marketAddress, senderAddress, positionId)

  owner.numberOfLiquidatedPositions = owner.numberOfLiquidatedPositions.plus(ONE_BI)
  owner.numberOfOpenPositions = owner.numberOfOpenPositions.minus(ONE_BI)

  position.save()
  market.save()
  liquidate.save()
  sender.save()
  owner.save()
  transaction.save()
}


export function handleFeeRecipientUpdated(event: FeeRecipientUpdated): void {
  let factoryAddress = event.address.toHexString()
  let factory = loadFactory(factoryAddress.toLowerCase())
  factory.feeRecipient = event.params.recipient.toHexString()

  factory.save()
}

export function handleFeedFactoryAdded(event: FeedFactoryAdded): void {}


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