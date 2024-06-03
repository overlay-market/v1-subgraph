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
import { updateMarketState } from "./utils/helpers";

function handleFeedDeployed(event: FeedDeployedEvent): void {
  let factory = loadFactory(event.address.toHexString())
  factory.feed = event.params.feed.toHexString()
  factory.save()
}