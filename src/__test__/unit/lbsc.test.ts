import {
    assert,
    describe,
    test,
    clearStore,
    beforeAll,
    beforeEach,
    afterEach,
    logStore
} from "matchstick-as/assembly/index"
import { newMockEvent } from "matchstick-as"
import { ethereum, Address, BigInt, Bytes, log, crypto, ByteArray, BigDecimal } from "@graphprotocol/graph-ts"
import { LoanSettled as LoanSettledEvent } from "../../../generated/LBSC/LBSC"
import { handleLoanSettled } from "../../lbsc"
import { StableLoan, Account, Position, Unwind } from "../../../generated/schema"
import { ZERO_BI } from "../../utils/constants"

const lbscAddress = Address.fromString("0x7017b3B9014D92812fAee1b628BCc13eBe09B04a")
const borrowerAddress = Address.fromString("0x0000000000000000000000000000000000000001")
const loanId = BigInt.fromI32(1)
const stableLoanId = lbscAddress.toHexString().concat('-').concat(loanId.toString())
const positionId = "market-pos-1"
const unwindId = "market-pos-1-0"

function createLoanSettledEvent(
    loanId: BigInt,
    borrower: Address,
    ovlRepaid: BigInt,
    collateralReturned: BigInt,
    collateralSeized: BigInt
): LoanSettledEvent {
    const event = changetype<LoanSettledEvent>(newMockEvent())
    event.address = lbscAddress
    event.parameters = [
        new ethereum.EventParam("loanId", ethereum.Value.fromUnsignedBigInt(loanId)),
        new ethereum.EventParam("borrower", ethereum.Value.fromAddress(borrower)),
        new ethereum.EventParam("ovlRepaid", ethereum.Value.fromUnsignedBigInt(ovlRepaid)),
        new ethereum.EventParam("collateralReturned", ethereum.Value.fromUnsignedBigInt(collateralReturned)),
        new ethereum.EventParam("collateralSeized", ethereum.Value.fromUnsignedBigInt(collateralSeized))
    ]
    return event
}

describe("handleLoanSettled", () => {
    beforeEach(() => {
        // Setup Account
        let account = new Account(borrowerAddress)
        account.realizedPnl = ZERO_BI
        account.realizedPnlOvl = BigInt.fromI32(1000)
        account.realizedPnlStables = BigInt.fromI32(1000)
        account.numberOfUnwinds = ZERO_BI
        account.numberOfLiquidatedPositions = ZERO_BI
        account.numberOfOpenPositions = ZERO_BI
        account.planckCatBalance = ZERO_BI
        account.ovlVolumeTraded = ZERO_BI
        account.save()

        // Setup StableLoan
        let stableLoan = new StableLoan(stableLoanId)
        stableLoan.loanId = loanId
        stableLoan.borrower = borrowerAddress
        stableLoan.stableAmount = BigInt.fromI32(500)
        stableLoan.ovlAmount = BigInt.fromI32(500) // 1:1 for simplicity
        stableLoan.price = BigInt.fromI32(100)
        stableLoan.ovlRepaid = ZERO_BI
        stableLoan.collateralReturned = ZERO_BI
        stableLoan.collateralSeized = ZERO_BI
        stableLoan.save()

        // Setup Position and link to StableLoan
        let position = new Position(positionId)
        position.loan = stableLoanId
        position.owner = borrowerAddress
        position.market = Address.fromString("0x0000000000000000000000000000000000000002")
        position.positionId = "1"
        position.initialOi = ZERO_BI
        position.initialDebt = ZERO_BI
        position.initialCollateral = ZERO_BI
        position.initialNotional = ZERO_BI
        position.leverage = BigDecimal.fromString("1")
        position.fractionUnwound = ZERO_BI
        position.isLong = true
        position.entryPrice = ZERO_BI
        position.isLiquidated = false
        position.currentOi = ZERO_BI
        position.currentDebt = ZERO_BI
        position.mint = ZERO_BI
        position.createdAtTimestamp = ZERO_BI
        position.createdAtBlockNumber = ZERO_BI
        position.numberOfUniwnds = ZERO_BI
        position.save()
    })

    afterEach(() => {
        clearStore()
    })

    test("liquidates positions should behave accordingly (no changes to PnL if no latestUnwind)", () => {
        const event = createLoanSettledEvent(
            loanId,
            borrowerAddress,
            BigInt.fromI32(100),
            ZERO_BI,
            BigInt.fromI32(400) // Collateral seized > 0
        )

        handleLoanSettled(event)

        // Check account PnL is NOT modified
        assert.fieldEquals("Account", borrowerAddress.toHexString(), "realizedPnlOvl", "1000")
        assert.fieldEquals("Account", borrowerAddress.toHexString(), "realizedPnlStables", "1000")

        // Check stableLoan updated
        assert.fieldEquals("StableLoan", stableLoanId, "ovlRepaid", "100")
        assert.fieldEquals("StableLoan", stableLoanId, "collateralSeized", "400")
    })

    test("regular unwinds with collateralSeized > 0 should modify owner PnL", () => {
        const event = createLoanSettledEvent(
            loanId,
            borrowerAddress,
            BigInt.fromI32(100),
            ZERO_BI,
            BigInt.fromI32(400)
        )

        // Setup Unwind (latest unwind)
        let unwind = new Unwind(unwindId)
        unwind.position = positionId
        unwind.pnl = BigInt.fromI32(200)
        unwind.transaction = event.transaction.hash // Same tx
        unwind.timestamp = event.block.timestamp
        unwind.owner = borrowerAddress
        unwind.unwindNumber = BigInt.fromI32(1)
        unwind.oiUnwound = ZERO_BI
        unwind.price = ZERO_BI
        unwind.fraction = ZERO_BI
        unwind.fractionOfPosition = ZERO_BI
        unwind.transferAmount = ZERO_BI
        unwind.feeAmount = ZERO_BI
        unwind.fundingPayment = ZERO_BI
        unwind.size = ZERO_BI
        unwind.volume = ZERO_BI
        unwind.mint = ZERO_BI
        unwind.save()

        // Update position unwind count logic
        let position = Position.load(positionId)!
        position.numberOfUniwnds = BigInt.fromI32(1)
        position.save()

        // Setup Receipt and Logs to satisfy isOrderedRequest
        const shivaUnwindSig = crypto.keccak256(ByteArray.fromUTF8("ShivaUnwind(address,address,address,uint256,uint256,uint32)"))

        let log1 = new ethereum.Log(
            lbscAddress,
            [changetype<Bytes>(shivaUnwindSig)],
            Bytes.fromHexString("0x00"),
            event.block.hash,
            event.transaction.hash,
            Bytes.fromHexString("0x00"),
            event.transaction.index,
            event.block.number,
            BigInt.fromI32(0),
            "mined",
            null // removed
        )
        log1.logIndex = BigInt.fromI32(1)

        let log2 = new ethereum.Log(
            lbscAddress,
            [],
            Bytes.fromHexString("0x00"),
            event.block.hash,
            event.transaction.hash,
            Bytes.fromHexString("0x00"),
            event.transaction.index,
            event.block.number,
            BigInt.fromI32(0),
            "mined",
            null
        )
        log2.logIndex = BigInt.fromI32(2)

        event.logIndex = BigInt.fromI32(2) // LoanSettled is after

        let receipt = new ethereum.TransactionReceipt(
            event.transaction.hash,
            event.transaction.index,
            event.block.hash,
            event.block.number,
            BigInt.fromI32(0),
            BigInt.fromI32(0),
            event.address,
            [log1, log2],
            BigInt.fromI32(1),
            Bytes.fromHexString("0x00"),
            Bytes.fromHexString("0x00")
        )
        event.receipt = receipt

        handleLoanSettled(event)

        assert.fieldEquals("Account", borrowerAddress.toHexString(), "realizedPnlOvl", "800")
        assert.fieldEquals("Account", borrowerAddress.toHexString(), "realizedPnlStables", "1200")
    })

    test("unwind from different transaction should NOT modify PnL", () => {
        const event = createLoanSettledEvent(
            loanId,
            borrowerAddress,
            BigInt.fromI32(100),
            ZERO_BI,
            BigInt.fromI32(400)
        )

        let unwind = new Unwind(unwindId)
        unwind.position = positionId
        unwind.pnl = BigInt.fromI32(200)
        unwind.transaction = Bytes.fromHexString("0x1234567890123456789012345678901234567890123456789012345678901234") // Different tx
        unwind.timestamp = event.block.timestamp
        unwind.owner = borrowerAddress
        unwind.unwindNumber = BigInt.fromI32(1)
        unwind.oiUnwound = ZERO_BI
        unwind.price = ZERO_BI
        unwind.fraction = ZERO_BI
        unwind.fractionOfPosition = ZERO_BI
        unwind.transferAmount = ZERO_BI
        unwind.feeAmount = ZERO_BI
        unwind.fundingPayment = ZERO_BI
        unwind.size = ZERO_BI
        unwind.volume = ZERO_BI
        unwind.mint = ZERO_BI
        unwind.save()

        // Update position unwind count logic
        let position = Position.load(positionId)!
        position.numberOfUniwnds = BigInt.fromI32(1)
        position.save()

        handleLoanSettled(event)

        assert.fieldEquals("Account", borrowerAddress.toHexString(), "realizedPnlOvl", "1000")
        assert.fieldEquals("Account", borrowerAddress.toHexString(), "realizedPnlStables", "1000")
    })

    test("unwind from same transaction but unordered (ShivaUnwind missing or after) should NOT modify PnL", () => {
        const event = createLoanSettledEvent(
            loanId,
            borrowerAddress,
            BigInt.fromI32(100),
            ZERO_BI,
            BigInt.fromI32(400)
        )

        let unwind = new Unwind(unwindId)
        unwind.position = positionId
        unwind.pnl = BigInt.fromI32(200)
        unwind.transaction = event.transaction.hash
        unwind.timestamp = event.block.timestamp
        unwind.owner = borrowerAddress
        unwind.unwindNumber = BigInt.fromI32(1)
        unwind.oiUnwound = ZERO_BI
        unwind.price = ZERO_BI
        unwind.fraction = ZERO_BI
        unwind.fractionOfPosition = ZERO_BI
        unwind.transferAmount = ZERO_BI
        unwind.feeAmount = ZERO_BI
        unwind.fundingPayment = ZERO_BI
        unwind.size = ZERO_BI
        unwind.volume = ZERO_BI
        unwind.mint = ZERO_BI
        unwind.save()

        // Update position unwind count logic
        let position = Position.load(positionId)!
        position.numberOfUniwnds = BigInt.fromI32(1)
        position.save()

        // Receipt with no relevant logs
        let receipt = new ethereum.TransactionReceipt(
            event.transaction.hash,
            event.transaction.index,
            event.block.hash,
            event.block.number,
            BigInt.fromI32(0),
            BigInt.fromI32(0),
            event.address,
            [],
            BigInt.fromI32(1),
            Bytes.fromHexString("0x00"),
            Bytes.fromHexString("0x00")
        )
        event.receipt = receipt

        handleLoanSettled(event)

        assert.fieldEquals("Account", borrowerAddress.toHexString(), "realizedPnlOvl", "1000")
        assert.fieldEquals("Account", borrowerAddress.toHexString(), "realizedPnlStables", "1000")
    })
})

test("mimic tx 0xb8837997 with correct log ordering (ShivaUnwind at index 6, LoanSettled at index 7)", () => {
    const specificBorrower = Address.fromString("0x85f66DBe1ed470A091d338CFC7429AA871720283")
    const specificLoanId = BigInt.fromI32(39)
    const specificStableLoanId = lbscAddress.toHexString().concat('-').concat(specificLoanId.toString())
    const specificPositionId = "market-pos-mimic-5"
    const specificUnwindId = "market-pos-mimic-5-0"

    // Setup Account
    let account = new Account(specificBorrower)
    account.realizedPnl = ZERO_BI
    account.realizedPnlOvl = BigInt.fromI32(5000) // Initial state
    account.realizedPnlStables = BigInt.fromI32(5000)
    account.numberOfUnwinds = ZERO_BI
    account.numberOfLiquidatedPositions = ZERO_BI
    account.numberOfOpenPositions = ZERO_BI
    account.planckCatBalance = ZERO_BI
    account.ovlVolumeTraded = ZERO_BI
    account.save()

    // Setup StableLoan
    let stableLoan = new StableLoan(specificStableLoanId)
    stableLoan.loanId = specificLoanId
    stableLoan.borrower = specificBorrower
    stableLoan.stableAmount = BigInt.fromI32(1000)
    stableLoan.ovlAmount = BigInt.fromI32(1000)
    stableLoan.price = BigInt.fromI32(100)
    stableLoan.ovlRepaid = ZERO_BI
    stableLoan.collateralReturned = ZERO_BI
    stableLoan.collateralSeized = ZERO_BI
    stableLoan.save()

    // Setup Position
    let position = new Position(specificPositionId)
    position.loan = specificStableLoanId
    position.owner = specificBorrower
    position.market = Address.fromString("0x7a227B197C61079f4251AaA55aB25d14ac84f588") // Market from logs
    position.positionId = "5"
    position.initialOi = ZERO_BI
    position.initialDebt = ZERO_BI
    position.initialCollateral = ZERO_BI
    position.initialNotional = ZERO_BI
    position.leverage = BigDecimal.fromString("1")
    position.fractionUnwound = ZERO_BI
    position.isLong = true
    position.entryPrice = ZERO_BI
    position.isLiquidated = false
    position.currentOi = ZERO_BI
    position.currentDebt = ZERO_BI
    position.mint = ZERO_BI
    position.createdAtTimestamp = ZERO_BI
    position.createdAtBlockNumber = ZERO_BI
    position.numberOfUniwnds = ZERO_BI
    position.save()

    const event = createLoanSettledEvent(
        specificLoanId,
        specificBorrower,
        ZERO_BI, // ovlRepaid
        ZERO_BI, // collateralReturned
        BigInt.fromString("100000000000000000000") // collateralSeized (100 in 1e18)
    )
    // Set event details to match tx
    event.transaction.hash = Bytes.fromHexString("0xb88379974dd871ecf74be85ecc6c3b6c811f85e1be21286ac44afb7dd1969f45")
    event.logIndex = BigInt.fromI32(7)

    // Setup Latest Unwind
    let unwind = new Unwind(specificUnwindId)
    unwind.position = specificPositionId
    unwind.pnl = BigInt.fromI32(200) // PnL from ShivaUnwind might be different but using 200 for logic check
    unwind.transaction = event.transaction.hash
    unwind.timestamp = event.block.timestamp
    unwind.owner = specificBorrower
    unwind.unwindNumber = BigInt.fromI32(1)
    unwind.oiUnwound = ZERO_BI
    unwind.price = ZERO_BI
    unwind.fraction = ZERO_BI
    unwind.fractionOfPosition = ZERO_BI
    unwind.transferAmount = ZERO_BI
    unwind.feeAmount = ZERO_BI
    unwind.fundingPayment = ZERO_BI
    unwind.size = ZERO_BI
    unwind.volume = ZERO_BI
    unwind.mint = ZERO_BI
    unwind.save()

    // Update position unwind count logic
    let positionLoaded = Position.load(specificPositionId)!
    positionLoaded.numberOfUniwnds = BigInt.fromI32(1)
    positionLoaded.save()

    // Setup Receipt Logs
    // ShivaUnwind at index 6
    const shivaUnwindSig = crypto.keccak256(ByteArray.fromUTF8("ShivaUnwind(address,address,address,uint256,uint256,uint32)"))
    const shivaAddress = Address.fromString("0x9fB7D92526Fc13bB3c0603d39E55e5C371c26Ce6")

    let shivaUnwindLog = new ethereum.Log(
        shivaAddress,
        [changetype<Bytes>(shivaUnwindSig)],
        Bytes.fromHexString("0x00"),
        event.block.hash,
        event.transaction.hash,
        Bytes.fromHexString("0x00"),
        event.transaction.index,
        event.block.number,
        BigInt.fromI32(0),
        "mined",
        null
    )
    shivaUnwindLog.logIndex = BigInt.fromI32(6)

    let loanSettledLog = new ethereum.Log(
        lbscAddress,
        [], // Empty topics
        Bytes.fromHexString("0x00"),
        event.block.hash,
        event.transaction.hash,
        Bytes.fromHexString("0x00"),
        event.transaction.index,
        event.block.number,
        BigInt.fromI32(0),
        "mined",
        null
    )
    loanSettledLog.logIndex = BigInt.fromI32(7)

    // Add logs
    let receipt = new ethereum.TransactionReceipt(
        event.transaction.hash,
        event.transaction.index,
        event.block.hash,
        event.block.number,
        BigInt.fromI32(0),
        BigInt.fromI32(0),
        event.address,
        [shivaUnwindLog, loanSettledLog],
        BigInt.fromI32(1),
        Bytes.fromHexString("0x00"),
        Bytes.fromHexString("0x00")
    )
    event.receipt = receipt

    handleLoanSettled(event)

    // Expected PnL Change:
    // realizedPnlOvl = 5000 - 200 = 4800
    // stablePnl = 200 * 1000 / 1000 = 200
    // realizedPnlStables = 5000 + 200 = 5200

    assert.fieldEquals("Account", specificBorrower.toHexString(), "realizedPnlOvl", "4800")
    assert.fieldEquals("Account", specificBorrower.toHexString(), "realizedPnlStables", "5200")
})

