import {
  ShivaBuild as ShivaBuildEvent,
  ShivaUnwind as ShivaUnwindEvent,
} from "../generated/Shiva/Shiva"
import { loadAccount, loadMarket } from "./utils"
import { takeSnapshots } from './temporal-data-logger'


export function handleShivaBuild(event: ShivaBuildEvent): void {
  const owner = loadAccount(event.params.owner)
  const marketId = event.params.market
  const market = loadMarket(event, marketId)
  takeSnapshots(event, market, owner)
}

export function handleShivaUnwind(event: ShivaUnwindEvent): void {
  const owner = loadAccount(event.params.owner)
  const marketId = event.params.market
  const market = loadMarket(event, marketId)
  takeSnapshots(event, market, owner)
}