import { Address, Bytes, log } from '@graphprotocol/graph-ts'

import {
  ShivaBuild as ShivaBuildEvent,
  ShivaUnwind as ShivaUnwindEvent,
} from "../generated/Shiva/Shiva"
import { Position, RouterParams } from "../generated/schema"
import { loadAccount, loadAnalytics, loadBuild, loadLatestUnwind, loadMarket, loadRouter, loadTransaction } from "./utils"
import { ONE_18DEC_BI, ONE_BI, SHIVA_ADDRESS, ZERO_BI } from "./utils/constants"
import { updateReferralRewards } from './referral'
import { updateTraderEpochVolume } from './trading-mining'

const shivaAddress = Address.fromString(SHIVA_ADDRESS)

export function handleShivaBuild(event: ShivaBuildEvent): void {
  const owner = loadAccount(event.params.owner)
  const shivaAccount = loadAccount(shivaAddress)
  const performer = event.params.performer
  const positionId = event.params.positionId
  const brokerId = event.params.brokerId
  const marketId = event.params.market

  const market = loadMarket(event, marketId)
  const router = loadRouter(shivaAddress)
  const transaction = loadTransaction(event)

  let marketPositionId = market.id.toHexString().concat('-').concat(positionId.toHexString())
  let position = Position.load(marketPositionId)
  
  if (position === null) {
    log.error('No Position for handleShivaBuild. Market: {}', [market.id.toHexString()])
    return
  }

  const build = loadBuild(position)

  let analytics = loadAnalytics(market.factory)
  if (owner.ovlVolumeTraded.equals(ZERO_BI)) {
    analytics.totalUsers = analytics.totalUsers.plus(ONE_BI)
  }

  shivaAccount.numberOfOpenPositions = shivaAccount.numberOfOpenPositions.minus(ONE_BI)
  owner.numberOfOpenPositions = owner.numberOfOpenPositions.plus(ONE_BI)
  
  position.owner = owner.id
  position.router = router.id

  const routerParamsId = shivaAddress.concat(Bytes.fromUTF8(position.id))
  
  const routerParams = new RouterParams(routerParamsId)
  routerParams.brokerId = brokerId
  routerParams.performer = performer
  routerParams.router = router.id
  routerParams.transaction = transaction.id

  build.routerParams = routerParams.id
  build.owner = owner.id

  if (position.initialNotional) {
    owner.ovlVolumeTraded = owner.ovlVolumeTraded.plus(position.initialNotional)
    shivaAccount.ovlVolumeTraded = shivaAccount.ovlVolumeTraded.minus(position.initialNotional)
  }

  updateReferralRewards(event, event.params.owner, build.feeAmount)
  updateTraderEpochVolume(event.params.owner, position.initialNotional)

  shivaAccount.save()
  owner.save()
  router.save()
  position.save()
  routerParams.save()
  build.save()
}

export function handleShivaUnwind(event: ShivaUnwindEvent): void {
  const owner = loadAccount(event.params.owner)
  const shivaAccount = loadAccount(shivaAddress)
  const performer = event.params.performer
  const positionId = event.params.positionId
  const brokerId = event.params.brokerId
  const marketId = event.params.market

  const market = loadMarket(event, marketId)
  const router = loadRouter(shivaAddress)
  const transaction = loadTransaction(event)
  
  let marketPositionId = market.id.toHexString().concat('-').concat(positionId.toHexString())
  let position = Position.load(marketPositionId)
    
  if (position === null) {
    log.error('No Position for handleShivaUnwind. Market: {}', [market.id.toHexString()])
    return
  }
  
  const latestUnwind = loadLatestUnwind(position)

  if (latestUnwind === null) {
    log.error('No Unwind for handleShivaUnwind', [])
    return
  }

  if (event.params.fraction == ONE_18DEC_BI) {
    owner.numberOfOpenPositions = owner.numberOfOpenPositions.minus(ONE_BI)
  }

  owner.numberOfUnwinds = owner.numberOfUnwinds.plus(ONE_BI)
  shivaAccount.numberOfUnwinds = shivaAccount.numberOfUnwinds.minus(ONE_BI)

  owner.realizedPnl = owner.realizedPnl.plus(latestUnwind.pnl)
  shivaAccount.realizedPnl = shivaAccount.realizedPnl.minus(latestUnwind.pnl)

  owner.ovlVolumeTraded = owner.ovlVolumeTraded.plus(latestUnwind.volume)
  shivaAccount.ovlVolumeTraded = shivaAccount.ovlVolumeTraded.minus(latestUnwind.volume)
  
  position.owner = owner.id
  position.router = router.id

  const routerParamsId = shivaAddress.concat(Bytes.fromUTF8(latestUnwind.id))
  const routerParams = new RouterParams(routerParamsId)
  routerParams.brokerId = brokerId
  routerParams.performer = performer
  routerParams.router = router.id
  routerParams.transaction = transaction.id

  latestUnwind.routerParams = routerParams.id
  latestUnwind.owner = owner.id

  updateReferralRewards(event, event.params.owner, latestUnwind.feeAmount)
  updateTraderEpochVolume(event.params.owner, latestUnwind.volume)

  shivaAccount.save()
  owner.save()
  router.save()
  position.save()
  routerParams.save()
  latestUnwind.save()
}