import { createMockedFunction } from "matchstick-as/assembly/index"
import { ethereum, Address, BigInt } from "@graphprotocol/graph-ts"
import "./constants"
import { MARKET_SENDER, MARKET_PCD_HOLDER, MARKET_POSITION_ID, MARKET_COLLATERAL } from "./constants"

const sender = MARKET_SENDER
const pcdHolder = MARKET_PCD_HOLDER
const positionId = MARKET_POSITION_ID
const collateral = MARKET_COLLATERAL

export function setupMarketMockedFunctions(factoryAddress: Address, peripheryAddress: Address, market: Address): void {
  // Market contract
  createMockedFunction(market, "feed", "feed():(address)")
    .returns([ethereum.Value.fromAddress(Address.zero())])
  createMockedFunction(market, "factory", "factory():(address)")
    .returns([ethereum.Value.fromAddress(Address.zero())])
  for (let i = 0; i < 15; i++) {
    createMockedFunction(market, "params", "params(uint256):(uint256)")
      .withArgs([ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(i))])
      .returns([ethereum.Value.fromI32(1)])
  }
  createMockedFunction(market, "dpUpperLimit", "dpUpperLimit():(uint256)")
    .returns([ethereum.Value.fromI32(1)])
  createMockedFunction(market, "oiLongShares", "oiLongShares():(uint256)")
    .returns([ethereum.Value.fromI32(1)])
  createMockedFunction(market, "oiShortShares", "oiShortShares():(uint256)")
    .returns([ethereum.Value.fromI32(1)])

  // Periphery contract
  createMockedFunction(peripheryAddress, "ois", "ois(address):(uint256,uint256)")
    .withArgs([ethereum.Value.fromAddress(market)])
    .returns([ethereum.Value.fromI32(1), ethereum.Value.fromI32(1)])
  createMockedFunction(peripheryAddress, "cost", "cost(address,address,uint256):(uint256)")
    .withArgs([ethereum.Value.fromAddress(market), ethereum.Value.fromAddress(sender), ethereum.Value.fromUnsignedBigInt(positionId)])
    .returns([ethereum.Value.fromUnsignedBigInt(collateral)])
  createMockedFunction(peripheryAddress, "value", "value(address,address,uint256):(uint256)")
    .withArgs([ethereum.Value.fromAddress(market), ethereum.Value.fromAddress(sender), ethereum.Value.fromUnsignedBigInt(positionId)])
    .returns([ethereum.Value.fromI32(1)])
  createMockedFunction(peripheryAddress, "cost", "cost(address,address,uint256):(uint256)")
    .withArgs([ethereum.Value.fromAddress(market), ethereum.Value.fromAddress(pcdHolder), ethereum.Value.fromUnsignedBigInt(positionId)])
    .returns([ethereum.Value.fromUnsignedBigInt(collateral)])
  createMockedFunction(peripheryAddress, "value", "value(address,address,uint256):(uint256)")
    .withArgs([ethereum.Value.fromAddress(market), ethereum.Value.fromAddress(pcdHolder), ethereum.Value.fromUnsignedBigInt(positionId)])
    .returns([ethereum.Value.fromI32(1)])

  // Market state contract
  createMockedFunction(peripheryAddress, "marketState", "marketState(address):((uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,int256))")
    .withArgs([ethereum.Value.fromAddress(market)])
    .returns([ethereum.Value.fromTuple(changetype<ethereum.Tuple>([
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(0)),
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(0)),
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(0)),
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(0)),
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(0)),
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(0)),
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(0)),
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(0)),
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(0)),
      ethereum.Value.fromSignedBigInt(BigInt.fromI32(1))
    ]))])

  createMockedFunction(factoryAddress, "feeRecipient", "feeRecipient():(address)")
    .returns([ethereum.Value.fromAddress(Address.zero())])
  createMockedFunction(factoryAddress, "deployer", "deployer():(address)")
    .returns([ethereum.Value.fromAddress(Address.zero())])
}

export function setupTradingMiningMockedFunctions(tmAddress: Address, epoch: i32): void {
  // TradingMining contract
  createMockedFunction(tmAddress, "getCurrentEpoch", "getCurrentEpoch():(uint256)")
    .returns([ethereum.Value.fromI32(epoch)])
  createMockedFunction(tmAddress, "rewardToken1", "rewardToken1():(address)")
    .returns([ethereum.Value.fromAddress(Address.zero())])
  createMockedFunction(tmAddress, "rewardToken2", "rewardToken2():(address)")
    .returns([ethereum.Value.fromAddress(Address.zero())])
  createMockedFunction(tmAddress, "token1Percentage", "token1Percentage():(uint8)")
    .returns([ethereum.Value.fromI32(0)])
  createMockedFunction(tmAddress, "startTime", "startTime():(uint64)")
    .returns([ethereum.Value.fromI32(0)])
  createMockedFunction(tmAddress, "epochDuration", "epochDuration():(uint64)")
    .returns([ethereum.Value.fromI32(0)])
  createMockedFunction(tmAddress, "pcdHolderBonusPercentage", "pcdHolderBonusPercentage():(uint8)")
    .returns([ethereum.Value.fromI32(0)])
  createMockedFunction(tmAddress, "totalRewards", "totalRewards():(uint256)")
    .returns([ethereum.Value.fromI32(0)])
  createMockedFunction(tmAddress, "maxRewardPerEpochPerAddress", "maxRewardPerEpochPerAddress():(uint256)")
    .returns([ethereum.Value.fromI32(0)])
}