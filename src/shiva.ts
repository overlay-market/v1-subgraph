import { Address, Bytes, log } from '@graphprotocol/graph-ts'

import {
  ShivaBuild as ShivaBuildEvent,
  ShivaUnwind as ShivaUnwindEvent,
} from "../generated/Shiva/Shiva"
import { Position, RouterParams } from "../generated/schema"
import { loadBuild, loadLatestUnwind, loadMarket, loadRouter, loadTransaction } from "./utils"
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

  let marketPositionId = market.id.toHexString().concat('-').concat(positionId.toHexString())
  let position = Position.load(marketPositionId)
  
    
  if (position === null) {
    log.error('No Position for handleShivaBuild. Market: {}', [market.id.toHexString()])
    return
  }

  const build = loadBuild(position)

  position.owner = owner
  position.router = router.id

  const routerParamsId = shivaAddress.concat(Bytes.fromUTF8(position.id))
  
  const routerParams = new RouterParams(routerParamsId)
  routerParams.brokerId = brokerId
  routerParams.performer = performer
  routerParams.router = router.id
  routerParams.transaction = transaction.id

  build.routerParams = routerParams.id
  build.owner = owner

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

  position.owner = owner
  position.router = router.id

  const routerParamsId = shivaAddress.concat(Bytes.fromUTF8(latestUnwind.id))
  const routerParams = new RouterParams(routerParamsId)
  routerParams.brokerId = brokerId
  routerParams.performer = performer
  routerParams.router = router.id
  routerParams.transaction = transaction.id

  latestUnwind.routerParams = routerParams.id
  latestUnwind.owner = owner

  router.save()
  position.save()
  routerParams.save()
  latestUnwind.save()
}