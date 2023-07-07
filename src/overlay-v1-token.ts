import { Transfer as TransferEvent } from "../generated/OverlayV1Token/OverlayV1Token"

import { loadAccount } from "./utils"
import { ZERO_BI } from "./utils/constants"

export function handleTransfer(event: TransferEvent): void {
    const from = loadAccount(event.params.from)
    const to = loadAccount(event.params.to)
    const amount = event.params.value
    
    from.ovlBalance = from.ovlBalance < amount ? ZERO_BI : from.ovlBalance.minus(amount)
    to.ovlBalance = to.ovlBalance.plus(amount)
    
    from.save()
    to.save()
}
