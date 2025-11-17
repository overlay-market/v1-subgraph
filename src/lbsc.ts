import { Bytes, log } from "@graphprotocol/graph-ts"
import {LoanOpened as LoanOpenedEvent, LoanSettled as LoanSettledEvent} from "../generated/LBSC/LBSC"
import { StableLoan } from "../generated/schema"
import { loadAccount } from "./utils"
import { ZERO_BI } from "./utils/constants"

export function handleLoanOpened(event: LoanOpenedEvent): void {
    const borrower = loadAccount(event.params.borrower)
    const loanId = event.params.loanId
    const stableLoanId = event.address.toHexString().concat('-').concat(loanId.toString())

    let stableLoan = StableLoan.load(stableLoanId)

    if (stableLoan === null) {
        stableLoan = new StableLoan(stableLoanId)
    }

    stableLoan.loanId = loanId
    stableLoan.borrower = borrower.id
    stableLoan.stableAmount = event.params.stableAmount
    stableLoan.ovlAmount = event.params.ovlAmount
    stableLoan.price = event.params.price
    stableLoan.ovlRepaid = ZERO_BI
    stableLoan.collateralReturned = ZERO_BI
    stableLoan.collateralSeized = ZERO_BI

    stableLoan.save()
}

export function handleLoanSettled(event: LoanSettledEvent): void {
    const loanId = event.params.loanId
    const stableLoanId = event.address.toHexString().concat('-').concat(loanId.toString())

    let stableLoan = StableLoan.load(stableLoanId)

    if (stableLoan === null) {
        log.error('No Loan found. LoanId: {}', [loanId.toHexString()])
        return
    }

    stableLoan.ovlRepaid = event.params.ovlRepaid
    stableLoan.collateralReturned = event.params.collateralReturned
    stableLoan.collateralSeized = event.params.collateralSeized

    stableLoan.save()
}
