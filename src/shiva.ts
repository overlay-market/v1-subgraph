import { Address, log } from '@graphprotocol/graph-ts'

import {
  ShivaBuild as ShivaBuildEvent,
  ShivaUnwind as ShivaUnwindEvent,
} from "../generated/Shiva/Shiva"
import { RouterParams } from "../generated/schema"
import { loadBuild, loadLatestUnwind, loadMarket, loadPosition, loadRouter, loadTransaction } from "./utils"
import { SHIVA_ADDRESS } from "./utils/constants"

const shivaAddress = Address.fromString(SHIVA_ADDRESS)

export function handleShivaBuild(event: ShivaBuildEvent): void {
  const owner = event.params.owner
  const performer = event.params.performer
  const positionId = event.params.positionId
  const brokerId = event.params.brokerId
  const marketId = event.params.market

  const market = loadMarket(event, marketId)
  const router = loadRouter(shivaAddress)
  const transaction = loadTransaction(event)
  const position = loadPosition(event, shivaAddress, market, positionId)
  const build = loadBuild(position)

  position.owner = owner
  position.router = router.id

  const routerParamsId = shivaAddress.concatI32(positionId.toI32())
  const routerParams = new RouterParams(routerParamsId)
  routerParams.brokerId = brokerId
  routerParams.performer = performer
  routerParams.router = router.id
  routerParams.transaction = transaction.id

  build.routerParams = routerParams.id

  router.save()
  position.save()
  routerParams.save()
  build.save()
}

export function handleShivaUnwind(event: ShivaUnwindEvent): void {
  const owner = event.params.owner
  const performer = event.params.performer
  const positionId = event.params.positionId
  const brokerId = event.params.brokerId
  const marketId = event.params.market

  const market = loadMarket(event, marketId)
  const router = loadRouter(shivaAddress)
  const transaction = loadTransaction(event)
  const position = loadPosition(event, shivaAddress, market, positionId)
  const latestUnwind = loadLatestUnwind(position)

  if (!latestUnwind) {
    log.error('No Unwind for handleShivaUnwind', [])
    return
  }

  position.owner = owner
  position.router = router.id

  const routerParamsId = shivaAddress.concatI32(positionId.toI32())
  const routerParams = new RouterParams(routerParamsId)
  routerParams.brokerId = brokerId
  routerParams.performer = performer
  routerParams.router = router.id
  routerParams.transaction = transaction.id

  latestUnwind.routerParams = routerParams.id

  router.save()
  position.save()
  routerParams.save()
  latestUnwind.save()
}