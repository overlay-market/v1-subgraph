import { Transfer as TransferEvent } from "../generated/NIP/NIP"

import { loadAccount } from "./utils"
import { ZERO_BI } from "./utils/constants"

export function handleTransfer(event: TransferEvent): void {
    const from = loadAccount(event.params.from)
    const to = loadAccount(event.params.to)
    const amount = event.params.value
    
    from.nipBalance = from.nipBalance < amount ? ZERO_BI : from.nipBalance.minus(amount)
    to.nipBalance = to.nipBalance.plus(amount)
    
    from.save()
    to.save()
}
