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
import { LoanOpened as LoanOpenedEvent, LoanSettled as LoanSettledEvent } from "../../../generated/LBSC/LBSC"
import { Build as BuildEvent, Unwind as UnwindEvent } from "../../../generated/templates/OverlayV1Market/OverlayV1Market"
import { ShivaBuild as ShivaBuildEvent, ShivaUnwind as ShivaUnwindEvent, ShivaBuildStable as ShivaBuildStableEvent } from "../../../generated/Shiva/Shiva"
import { handleLoanOpened, handleLoanSettled } from "../../lbsc"
import { handleBuild, handleUnwind } from "../../mapping"
import { handleShivaBuild, handleShivaUnwind, handleShivaBuildStable } from "../../shiva"
import { StableLoan, Account, Position, Unwind, Router, Liquidate } from "../../../generated/schema"
import { ZERO_BI, SHIVA_ADDRESS, PERIPHERY_ADDRESSES, TRADING_MINING_ADDRESS } from "../../utils/constants"
import { setupMarketMockedFunctions, setupTradingMiningMockedFunctions } from "./shared/mockedFunctions"

// Constants from real transactions
const lbscAddress = Address.fromString("0x7017b3B9014D92812fAee1b628BCc13eBe09B04a")
const shivaAddress = Address.fromString(SHIVA_ADDRESS)
const marketAddress = Address.fromString("0x7a227B197C61079f4251AaA55aB25d14ac84f588")
const borrowerAddress = Address.fromString("0x85f66DBe1ed470A091d338CFC7429AA871720283")
const factoryAddress = Address.fromString("0x0000000000000000000000000000000000000004")
const peripheryAddress = Address.fromString(PERIPHERY_ADDRESSES[0])
const tmAddress = Address.fromString(TRADING_MINING_ADDRESS)

// Build tx values (0xfc566884...)
const loanId = BigInt.fromI32(39)
const stableAmount = BigInt.fromString("100000000000000000000") // 100e18
const ovlAmount = BigInt.fromString("883826903771907628355")
const loanPrice = BigInt.fromString("113144326760398502")
const positionIdBigInt = BigInt.fromI32(5)
const buildOi = BigInt.fromString("191229501901097827783")
const buildDebt = BigInt.fromString("19716138622604093247917")
const buildPrice = BigInt.fromString("108249595750694139910")
const collateral = BigInt.fromString("679866849055313560273")
const leverage = BigInt.fromString("30000000000000000000") // 30e18
const brokerId = BigInt.fromI32(0)

// Derived IDs
const stableLoanId = lbscAddress.toHexString().concat('-').concat(loanId.toString())
const marketPositionId = marketAddress.toHexString().concat('-').concat(positionIdBigInt.toHexString())

// Event creators
function createLoanOpenedEvent(
    loanId: BigInt,
    borrower: Address,
    stableAmount: BigInt,
    ovlAmount: BigInt,
    price: BigInt
): LoanOpenedEvent {
    const event = changetype<LoanOpenedEvent>(newMockEvent())
    event.address = lbscAddress
    event.parameters = [
        new ethereum.EventParam("loanId", ethereum.Value.fromUnsignedBigInt(loanId)),
        new ethereum.EventParam("borrower", ethereum.Value.fromAddress(borrower)),
        new ethereum.EventParam("stableAmount", ethereum.Value.fromUnsignedBigInt(stableAmount)),
        new ethereum.EventParam("ovlAmount", ethereum.Value.fromUnsignedBigInt(ovlAmount)),
        new ethereum.EventParam("price", ethereum.Value.fromUnsignedBigInt(price))
    ]
    return event
}

function createBuildEvent(
    market: Address,
    sender: Address,
    positionId: BigInt,
    oi: BigInt,
    debt: BigInt,
    isLong: boolean,
    price: BigInt,
    oiAfterBuild: BigInt,
    oiSharesAfterBuild: BigInt
): BuildEvent {
    const event = changetype<BuildEvent>(newMockEvent())
    event.address = market
    event.parameters = [
        new ethereum.EventParam("sender", ethereum.Value.fromAddress(sender)),
        new ethereum.EventParam("positionId", ethereum.Value.fromUnsignedBigInt(positionId)),
        new ethereum.EventParam("oi", ethereum.Value.fromUnsignedBigInt(oi)),
        new ethereum.EventParam("debt", ethereum.Value.fromUnsignedBigInt(debt)),
        new ethereum.EventParam("isLong", ethereum.Value.fromBoolean(isLong)),
        new ethereum.EventParam("price", ethereum.Value.fromUnsignedBigInt(price)),
        new ethereum.EventParam("oiAfterBuild", ethereum.Value.fromUnsignedBigInt(oiAfterBuild)),
        new ethereum.EventParam("oiSharesAfterBuild", ethereum.Value.fromUnsignedBigInt(oiSharesAfterBuild))
    ]
    return event
}

function createShivaBuildEvent(
    market: Address,
    owner: Address,
    performer: Address,
    positionId: BigInt,
    collateral: BigInt,
    leverage: BigInt,
    brokerId: BigInt,
    isLong: boolean
): ShivaBuildEvent {
    const event = changetype<ShivaBuildEvent>(newMockEvent())
    event.address = shivaAddress
    event.parameters = [
        new ethereum.EventParam("owner", ethereum.Value.fromAddress(owner)),
        new ethereum.EventParam("market", ethereum.Value.fromAddress(market)),
        new ethereum.EventParam("performer", ethereum.Value.fromAddress(performer)),
        new ethereum.EventParam("positionId", ethereum.Value.fromUnsignedBigInt(positionId)),
        new ethereum.EventParam("collateral", ethereum.Value.fromUnsignedBigInt(collateral)),
        new ethereum.EventParam("leverage", ethereum.Value.fromUnsignedBigInt(leverage)),
        new ethereum.EventParam("brokerId", ethereum.Value.fromUnsignedBigInt(brokerId)),
        new ethereum.EventParam("isLong", ethereum.Value.fromBoolean(isLong))
    ]
    return event
}

function createShivaBuildStableEvent(
    market: Address,
    positionId: BigInt,
    loanId: BigInt
): ShivaBuildStableEvent {
    const event = changetype<ShivaBuildStableEvent>(newMockEvent())
    event.address = shivaAddress
    event.parameters = [
        new ethereum.EventParam("market", ethereum.Value.fromAddress(market)),
        new ethereum.EventParam("positionId", ethereum.Value.fromUnsignedBigInt(positionId)),
        new ethereum.EventParam("loanId", ethereum.Value.fromUnsignedBigInt(loanId))
    ]
    return event
}

function createUnwindEvent(
    market: Address,
    sender: Address,
    positionId: BigInt,
    fraction: BigInt,
    mint: BigInt,
    price: BigInt,
    oiAfterUnwind: BigInt,
    oiSharesAfterUnwind: BigInt
): UnwindEvent {
    const event = changetype<UnwindEvent>(newMockEvent())
    event.address = market
    event.parameters = [
        new ethereum.EventParam("sender", ethereum.Value.fromAddress(sender)),
        new ethereum.EventParam("positionId", ethereum.Value.fromUnsignedBigInt(positionId)),
        new ethereum.EventParam("fraction", ethereum.Value.fromUnsignedBigInt(fraction)),
        new ethereum.EventParam("mint", ethereum.Value.fromSignedBigInt(mint)),
        new ethereum.EventParam("price", ethereum.Value.fromUnsignedBigInt(price)),
        new ethereum.EventParam("oiAfterUnwind", ethereum.Value.fromUnsignedBigInt(oiAfterUnwind)),
        new ethereum.EventParam("oiSharesAfterUnwind", ethereum.Value.fromUnsignedBigInt(oiSharesAfterUnwind))
    ]
    return event
}

function createShivaUnwindEvent(
    market: Address,
    owner: Address,
    performer: Address,
    positionId: BigInt,
    fraction: BigInt,
    brokerId: BigInt
): ShivaUnwindEvent {
    const event = changetype<ShivaUnwindEvent>(newMockEvent())
    event.address = shivaAddress
    event.parameters = [
        new ethereum.EventParam("owner", ethereum.Value.fromAddress(owner)),
        new ethereum.EventParam("market", ethereum.Value.fromAddress(market)),
        new ethereum.EventParam("performer", ethereum.Value.fromAddress(performer)),
        new ethereum.EventParam("positionId", ethereum.Value.fromUnsignedBigInt(positionId)),
        new ethereum.EventParam("fraction", ethereum.Value.fromUnsignedBigInt(fraction)),
        new ethereum.EventParam("brokerId", ethereum.Value.fromUnsignedBigInt(brokerId))
    ]
    return event
}

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

import { createMockedFunction } from "matchstick-as/assembly/index"

function setupShivaPeripheryMocks(peripheryAddress: Address, market: Address, shiva: Address, positionId: BigInt): void {
    // Mock market.factory to return actual factory address
    createMockedFunction(market, "factory", "factory():(address)")
        .returns([ethereum.Value.fromAddress(factoryAddress)])

    // Mock factory.ovl
    createMockedFunction(factoryAddress, "ovl", "ovl():(address)")
        .returns([ethereum.Value.fromAddress(Address.zero())])

    // Mock periphery calls for Shiva as sender
    createMockedFunction(peripheryAddress, "cost", "cost(address,address,uint256):(uint256)")
        .withArgs([ethereum.Value.fromAddress(market), ethereum.Value.fromAddress(shiva), ethereum.Value.fromUnsignedBigInt(positionId)])
        .returns([ethereum.Value.fromUnsignedBigInt(collateral)])
    createMockedFunction(peripheryAddress, "value", "value(address,address,uint256):(uint256)")
        .withArgs([ethereum.Value.fromAddress(market), ethereum.Value.fromAddress(shiva), ethereum.Value.fromUnsignedBigInt(positionId)])
        .returns([ethereum.Value.fromI32(1)])
    createMockedFunction(peripheryAddress, "oi", "oi(address,address,uint256):(uint256)")
        .withArgs([ethereum.Value.fromAddress(market), ethereum.Value.fromAddress(shiva), ethereum.Value.fromUnsignedBigInt(positionId)])
        .returns([ethereum.Value.fromUnsignedBigInt(buildOi)])
    createMockedFunction(peripheryAddress, "debt", "debt(address,address,uint256):(uint256)")
        .withArgs([ethereum.Value.fromAddress(market), ethereum.Value.fromAddress(shiva), ethereum.Value.fromUnsignedBigInt(positionId)])
        .returns([ethereum.Value.fromUnsignedBigInt(buildDebt)])
    createMockedFunction(peripheryAddress, "prices", "prices(address):(uint256,uint256)")
        .withArgs([ethereum.Value.fromAddress(market)])
        .returns([ethereum.Value.fromUnsignedBigInt(buildPrice), ethereum.Value.fromUnsignedBigInt(buildPrice)])

    // Position struct mock
    createMockedFunction(peripheryAddress, "position", "position(address,address,uint256):((uint96,uint96,uint96,uint32,bool,bool,bool))")
        .withArgs([ethereum.Value.fromAddress(market), ethereum.Value.fromAddress(shiva), ethereum.Value.fromUnsignedBigInt(positionId)])
        .returns([ethereum.Value.fromTuple(changetype<ethereum.Tuple>([
            ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(0)),
            ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(0)),
            ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(0)),
            ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(0)),
            ethereum.Value.fromBoolean(true), // isLong
            ethereum.Value.fromBoolean(false),
            ethereum.Value.fromBoolean(false)
        ]))])
}

describe("Full flow: Build tx (0xfc566884) -> Unwind tx (0xb8837997)", () => {
    beforeAll(() => {
        // Setup mocked contract functions for market
        setupMarketMockedFunctions(factoryAddress, peripheryAddress, marketAddress)
        setupTradingMiningMockedFunctions(tmAddress, 0)

        // Additional mocks for Shiva as sender (required by handleBuild/handleUnwind)
        setupShivaPeripheryMocks(peripheryAddress, marketAddress, shivaAddress, positionIdBigInt)

        // Setup Router with lbsc (required for ShivaBuildStable)
        let router = new Router(shivaAddress)
        router.lbsc = lbscAddress
        router.save()
    })

    afterEach(() => {
        clearStore()
    })

    test("full build and unwind flow with handlers processing all events", () => {
        // ========== BUILD TRANSACTION (0xfc566884) ==========
        // https://testnet.bscscan.com/tx/0xfc566884181879badcdba2e96f72db627ed42ccaf8167770ef776db4a691cf08#eventlog

        // Log 2: LoanOpened
        const loanOpenedEvent = createLoanOpenedEvent(
            loanId,
            borrowerAddress,
            stableAmount,
            ovlAmount,
            loanPrice
        )
        handleLoanOpened(loanOpenedEvent)

        // Verify StableLoan created
        assert.entityCount("StableLoan", 1)
        assert.fieldEquals("StableLoan", stableLoanId, "loanId", loanId.toString())
        assert.fieldEquals("StableLoan", stableLoanId, "borrower", borrowerAddress.toHexString())

        // Log 7: Build (from Market - sender is Shiva)
        const buildEvent = createBuildEvent(
            marketAddress,
            shivaAddress, // Shiva is the sender at market level
            positionIdBigInt,
            buildOi,
            buildDebt,
            true, // isLong
            buildPrice,
            buildOi,
            buildOi
        )
        handleBuild(buildEvent)

        // Verify Position created (owned by Shiva at this point)
        assert.entityCount("Position", 1)
        assert.fieldEquals("Position", marketPositionId, "owner", shivaAddress.toHexString())

        // Log 10: ShivaBuild (transfers ownership from Shiva to borrower)
        const shivaBuildEvent = createShivaBuildEvent(
            marketAddress,
            borrowerAddress,
            borrowerAddress, // performer = owner in this tx
            positionIdBigInt,
            collateral,
            leverage,
            brokerId,
            true
        )
        handleShivaBuild(shivaBuildEvent)

        // Verify Position now owned by borrower
        assert.fieldEquals("Position", marketPositionId, "owner", borrowerAddress.toHexString())

        // Log 11: ShivaBuildStable (links position to loan)
        const shivaBuildStableEvent = createShivaBuildStableEvent(
            marketAddress,
            positionIdBigInt,
            loanId
        )
        handleShivaBuildStable(shivaBuildStableEvent)

        // Verify Position linked to StableLoan
        assert.fieldEquals("Position", marketPositionId, "loan", stableLoanId)


        // ========== UNWIND TRANSACTION (0xb8837997) ==========
        // https://testnet.bscscan.com/tx/0xb88379974dd871ecf74be85ecc6c3b6c811f85e1be21286ac44afb7dd1969f45#eventlog

        // PnL calculation values from unwind tx
        const unwindFraction = BigInt.fromString("1000000000000000000") // 1e18 (100%)
        const unwindMint = BigInt.fromString("-604054409078465007392") // negative mint = loss
        const unwindPrice = BigInt.fromString("105098874287455699164")
        const oiAfterUnwind = BigInt.fromString("122530005035266707345")

        // Get current account state before ShivaUnwind
        let accountBeforeShivaUnwind = Account.load(borrowerAddress)!
        const pnlOvlBeforeShivaUnwind = accountBeforeShivaUnwind.realizedPnlOvl
        const pnlStablesBeforeShivaUnwind = accountBeforeShivaUnwind.realizedPnlStables

        // Log 1: Unwind (from Market - sender is Shiva)
        const unwindEvent = createUnwindEvent(
            marketAddress,
            shivaAddress,
            positionIdBigInt,
            unwindFraction,
            unwindMint,
            unwindPrice,
            oiAfterUnwind,
            oiAfterUnwind
        )
        handleUnwind(unwindEvent)

        // Verify Unwind created
        const unwindId = marketPositionId.concat('-0')
        assert.entityCount("Unwind", 1)

        // Log 5: ShivaUnwind (updates owner PnL)
        const shivaUnwindEvent = createShivaUnwindEvent(
            marketAddress,
            borrowerAddress,
            borrowerAddress,
            positionIdBigInt,
            unwindFraction,
            brokerId
        )
        handleShivaUnwind(shivaUnwindEvent)

        // Get the unwind pnl for expected calculations
        let unwindEntity = Unwind.load(unwindId)!
        const unwindPnl = unwindEntity.pnl

        // Get current account state after ShivaUnwind (PnL already added)
        let accountAfterShivaUnwind = Account.load(borrowerAddress)!
        const pnlOvlAfterShivaUnwind = accountAfterShivaUnwind.realizedPnlOvl
        const pnlStablesAfterShivaUnwind = accountAfterShivaUnwind.realizedPnlStables
        // assert pnlStablesBeforeShivaUnwind = pnlStablesAfterShivaUnwind
        assert.fieldEquals("Account", borrowerAddress.toHexString(), "realizedPnlStables", pnlStablesBeforeShivaUnwind.toString())

        // Log 7: LoanSettled with collateralSeized > 0
        const collateralSeized = BigInt.fromString("100000000000000000000") // 100e18
        const loanSettledEvent = createLoanSettledEvent(
            loanId,
            borrowerAddress,
            ZERO_BI,
            ZERO_BI,
            collateralSeized
        )
        loanSettledEvent.logIndex = BigInt.fromI32(7)

        // Setup receipt with ShivaUnwind at index 6, LoanSettled at index 7
        const shivaUnwindSig = crypto.keccak256(ByteArray.fromUTF8("ShivaUnwind(address,address,address,uint256,uint256,uint32)"))
        const genericLogSig = crypto.keccak256(ByteArray.fromUTF8("GenericLog(address,bytes,bytes,bytes,bytes,bytes,bytes,bytes,bytes,bytes,bytes,bytes)"))

        // (
        //     public address: Address,
        //     public topics: Array<Bytes>,
        //     public data: Bytes,
        //     public blockHash: Bytes,
        //     public blockNumber: Bytes,
        //     public transactionHash: Bytes,
        //     public transactionIndex: BigInt,
        //     public logIndex: BigInt,
        //     public transactionLogIndex: BigInt,
        //     public logType: string,
        //     public removed: Wrapped<bool> | null,
        // )
        let genericLog = new ethereum.Log(
            shivaAddress,
            [changetype<Bytes>(genericLogSig)],
            Bytes.fromHexString("0x00"),
            loanSettledEvent.block.hash,
            loanSettledEvent.transaction.hash,
            loanSettledEvent.transaction.hash,
            loanSettledEvent.transaction.index,
            BigInt.fromI32(0),
            BigInt.fromI32(0),
            "mined",
            null
        )

        let shivaUnwindLog = new ethereum.Log(
            shivaAddress,
            [changetype<Bytes>(shivaUnwindSig)],
            Bytes.fromHexString("0x00"),
            loanSettledEvent.block.hash,
            loanSettledEvent.transaction.hash,
            loanSettledEvent.transaction.hash,
            loanSettledEvent.transaction.index,
            BigInt.fromI32(6),
            BigInt.fromI32(0),
            "mined",
            null
        )
        shivaUnwindLog.logIndex = BigInt.fromI32(6)

        let loanSettledLog = new ethereum.Log(
            lbscAddress,
            [],
            Bytes.fromHexString("0x00"),
            loanSettledEvent.block.hash,
            loanSettledEvent.transaction.hash,
            loanSettledEvent.transaction.hash,
            loanSettledEvent.transaction.index,
            BigInt.fromI32(7),
            BigInt.fromI32(0),
            "mined",
            null
        )
        loanSettledLog.logIndex = BigInt.fromI32(7)

        let receipt = new ethereum.TransactionReceipt(
            loanSettledEvent.transaction.hash,
            loanSettledEvent.transaction.index,
            loanSettledEvent.block.hash,
            loanSettledEvent.block.number,
            BigInt.fromI32(0),
            BigInt.fromI32(0),
            loanSettledEvent.address,
            [genericLog, genericLog, genericLog, genericLog, genericLog, genericLog, shivaUnwindLog, loanSettledLog],
            BigInt.fromI32(1),
            Bytes.fromHexString("0x00"),
            Bytes.fromHexString("0x00")
        )
        loanSettledEvent.receipt = receipt

        handleLoanSettled(loanSettledEvent)

        // Verify LoanSettled updated the loan
        assert.fieldEquals("StableLoan", stableLoanId, "collateralSeized", collateralSeized.toString())

        // Verify PnL adjustment:
        // handleLoanSettled should:
        // - subtract unwindPnl from realizedPnlOvl
        // - add stablePnl to realizedPnlStables

        let finalAccount = Account.load(borrowerAddress)!

        // Expected: realizedPnlOvl = pnlOvlBeforeShivaUnwind
        const expectedPnlOvl = pnlOvlBeforeShivaUnwind
        assert.fieldEquals("Account", borrowerAddress.toHexString(), "realizedPnlOvl", expectedPnlOvl.toString())

        // Expected: realizedPnlStables = pnlStablesAfterShivaUnwind + (unwindPnl * stableAmount / ovlAmount)
        const stablePnl = unwindPnl.times(stableAmount).div(ovlAmount)
        const expectedPnlStables = pnlStablesAfterShivaUnwind.plus(stablePnl)
        assert.fieldEquals("Account", borrowerAddress.toHexString(), "realizedPnlStables", expectedPnlStables.toString())
    })
})

// ==================== LIQUIDATION FLOW TEST ====================

// Liquidation test constants (different market)
const liqMarketAddress = Address.fromString("0x110c548EEBFA7cF481c5EB625f7b3433B44Ce30a")
const liqLoanId = BigInt.fromI32(32)
const liqStableAmount = BigInt.fromString("10000000000000000000") // 10e18
const liqOvlAmount = BigInt.fromString("87180163759204519349")
const liqLoanPrice = BigInt.fromString("114704992154183648")
const liqPositionIdBigInt = BigInt.fromI32(13)
const liqBuildOi = BigInt.fromString("4349364445546226231")
const liqBuildDebt = BigInt.fromString("332114909558874359424")
const liqBuildPrice = BigInt.fromString("96411547259757586372")
const liqCollateral = BigInt.fromString("83028727389718589856")
const liqLeverage = BigInt.fromString("5000000000000000000") // 5e18

// Derived IDs for liquidation test
const liqStableLoanId = lbscAddress.toHexString().concat('-').concat(liqLoanId.toString())
const liqMarketPositionId = liqMarketAddress.toHexString().concat('-').concat(liqPositionIdBigInt.toHexString())

import { Liquidate as LiquidateEvent } from "../../../generated/templates/OverlayV1Market/OverlayV1Market"
import { handleLiquidate } from "../../mapping"

function createLiquidateEvent(
    market: Address,
    sender: Address,
    owner: Address,
    positionId: BigInt,
    mint: BigInt,
    price: BigInt,
    oiAfterLiquidate: BigInt,
    oiSharesAfterLiquidate: BigInt
): LiquidateEvent {
    const event = changetype<LiquidateEvent>(newMockEvent())
    event.address = market
    event.parameters = [
        new ethereum.EventParam("sender", ethereum.Value.fromAddress(sender)),
        new ethereum.EventParam("owner", ethereum.Value.fromAddress(owner)),
        new ethereum.EventParam("positionId", ethereum.Value.fromUnsignedBigInt(positionId)),
        new ethereum.EventParam("mint", ethereum.Value.fromSignedBigInt(mint)),
        new ethereum.EventParam("price", ethereum.Value.fromUnsignedBigInt(price)),
        new ethereum.EventParam("oiAfterLiquidate", ethereum.Value.fromUnsignedBigInt(oiAfterLiquidate)),
        new ethereum.EventParam("oiSharesAfterLiquidate", ethereum.Value.fromUnsignedBigInt(oiSharesAfterLiquidate))
    ]
    return event
}

function setupLiquidationMarketMocks(market: Address, positionId: BigInt): void {
    // Mock market.factory to return actual factory address
    createMockedFunction(market, "factory", "factory():(address)")
        .returns([ethereum.Value.fromAddress(factoryAddress)])
    createMockedFunction(market, "feed", "feed():(address)")
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

    // Periphery mocks for liqMarket
    createMockedFunction(peripheryAddress, "ois", "ois(address):(uint256,uint256)")
        .withArgs([ethereum.Value.fromAddress(market)])
        .returns([ethereum.Value.fromI32(1), ethereum.Value.fromI32(1)])
    createMockedFunction(peripheryAddress, "cost", "cost(address,address,uint256):(uint256)")
        .withArgs([ethereum.Value.fromAddress(market), ethereum.Value.fromAddress(shivaAddress), ethereum.Value.fromUnsignedBigInt(positionId)])
        .returns([ethereum.Value.fromUnsignedBigInt(liqCollateral)])
    createMockedFunction(peripheryAddress, "value", "value(address,address,uint256):(uint256)")
        .withArgs([ethereum.Value.fromAddress(market), ethereum.Value.fromAddress(shivaAddress), ethereum.Value.fromUnsignedBigInt(positionId)])
        .returns([ethereum.Value.fromI32(1)])
    createMockedFunction(peripheryAddress, "prices", "prices(address):(uint256,uint256)")
        .withArgs([ethereum.Value.fromAddress(market)])
        .returns([ethereum.Value.fromUnsignedBigInt(liqBuildPrice), ethereum.Value.fromUnsignedBigInt(liqBuildPrice)])
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
}

describe("Full flow: Build tx (0x59e8c4cf) -> Liquidate tx (0x0007340e)", () => {
    beforeAll(() => {
        // Setup router
        let router = new Router(shivaAddress)
        router.lbsc = lbscAddress
        router.save()

        // Setup trading mining mocks
        setupTradingMiningMockedFunctions(tmAddress, 0)

        // Setup market mocks for liquidation test
        setupLiquidationMarketMocks(liqMarketAddress, liqPositionIdBigInt)
    })

    afterEach(() => {
        clearStore()
    })

    test("full build and liquidation flow - PnL should NOT be modified (no ShivaUnwind)", () => {
        // ========== BUILD TRANSACTION (0x59e8c4cf) ==========
        // https://testnet.bscscan.com/tx/0x59e8c4cf6b35cd73def3d5dd77b141b675c6026902016125bd3c64124a0b621d#eventlog

        // Log 2: LoanOpened
        const loanOpenedEvent = createLoanOpenedEvent(
            liqLoanId,
            borrowerAddress,
            liqStableAmount,
            liqOvlAmount,
            liqLoanPrice
        )
        handleLoanOpened(loanOpenedEvent)

        // Verify StableLoan created
        assert.entityCount("StableLoan", 1)
        assert.fieldEquals("StableLoan", liqStableLoanId, "loanId", liqLoanId.toString())

        // Log 7: Build (from Market - sender is Shiva)
        const buildEvent = createBuildEvent(
            liqMarketAddress,
            shivaAddress,
            liqPositionIdBigInt,
            liqBuildOi,
            liqBuildDebt,
            true, // isLong
            liqBuildPrice,
            liqBuildOi,
            liqBuildOi
        )
        handleBuild(buildEvent)

        // Verify Position created
        assert.entityCount("Position", 1)

        // Log 10: ShivaBuild
        const shivaBuildEvent = createShivaBuildEvent(
            liqMarketAddress,
            borrowerAddress,
            borrowerAddress,
            liqPositionIdBigInt,
            liqCollateral,
            liqLeverage,
            brokerId,
            true
        )
        handleShivaBuild(shivaBuildEvent)

        // Log 11: ShivaBuildStable
        const shivaBuildStableEvent = createShivaBuildStableEvent(
            liqMarketAddress,
            liqPositionIdBigInt,
            liqLoanId
        )
        handleShivaBuildStable(shivaBuildStableEvent)

        // Verify Position linked to StableLoan
        assert.fieldEquals("Position", liqMarketPositionId, "loan", liqStableLoanId)

        // Get current account state before liquidation
        let accountBeforeLiquidation = Account.load(borrowerAddress)!
        const pnlOvlBeforeLiquidation = accountBeforeLiquidation.realizedPnlOvl
        const pnlStablesBeforeLiquidation = accountBeforeLiquidation.realizedPnlStables

        // ========== LIQUIDATE TRANSACTION (0x0007340e) ==========
        // https://testnet.bscscan.com/tx/0x0007340e8cc080262344c9df8f546e67aaf86c72d6a961f5359fb4d3bab4d0f7#eventlog

        // Note: Liquidation TX does NOT have ShivaUnwind event, only:
        // Log 1: LoanSettled
        // Log 3: Liquidate
        // (plus Transfer events)

        // Log 1: LoanSettled with collateralSeized > 0
        const liqCollateralSeized = BigInt.fromString("10000000000000000000") // 10e18
        const loanSettledEvent = createLoanSettledEvent(
            liqLoanId,
            borrowerAddress,
            ZERO_BI,
            ZERO_BI,
            liqCollateralSeized
        )
        loanSettledEvent.logIndex = BigInt.fromI32(1)

        // Setup receipt WITHOUT ShivaUnwind - only LoanSettled and Liquidate logs
        let loanSettledLog = new ethereum.Log(
            lbscAddress,
            [],
            Bytes.fromHexString("0x00"),
            loanSettledEvent.block.hash,
            loanSettledEvent.transaction.hash,
            loanSettledEvent.transaction.hash,
            loanSettledEvent.transaction.index,
            BigInt.fromI32(1),
            BigInt.fromI32(0),
            "mined",
            null
        )
        loanSettledLog.logIndex = BigInt.fromI32(1)

        // Generic transfer log (not ShivaUnwind)
        const transferSig = crypto.keccak256(ByteArray.fromUTF8("Transfer(address,address,uint256)"))
        let transferLog = new ethereum.Log(
            liqMarketAddress,
            [changetype<Bytes>(transferSig)],
            Bytes.fromHexString("0x00"),
            loanSettledEvent.block.hash,
            loanSettledEvent.transaction.hash,
            loanSettledEvent.transaction.hash,
            loanSettledEvent.transaction.index,
            BigInt.fromI32(0),
            BigInt.fromI32(0),
            "mined",
            null
        )
        transferLog.logIndex = BigInt.fromI32(0)

        let receipt = new ethereum.TransactionReceipt(
            loanSettledEvent.transaction.hash,
            loanSettledEvent.transaction.index,
            loanSettledEvent.block.hash,
            loanSettledEvent.block.number,
            BigInt.fromI32(0),
            BigInt.fromI32(0),
            loanSettledEvent.address,
            [transferLog, loanSettledLog], // No ShivaUnwind before LoanSettled!
            BigInt.fromI32(1),
            Bytes.fromHexString("0x00"),
            Bytes.fromHexString("0x00")
        )
        loanSettledEvent.receipt = receipt

        handleLoanSettled(loanSettledEvent)

        // Verify LoanSettled updated the loan
        assert.fieldEquals("StableLoan", liqStableLoanId, "collateralSeized", liqCollateralSeized.toString())

        // After LoanSettled (before Liquidate), PnL should NOT be modified yet
        // because there's no Unwind entity and no ShivaUnwind log
        assert.fieldEquals("Account", borrowerAddress.toHexString(), "realizedPnlOvl", pnlOvlBeforeLiquidation.toString())
        assert.fieldEquals("Account", borrowerAddress.toHexString(), "realizedPnlStables", pnlStablesBeforeLiquidation.toString())

        // Log 3: Liquidate event (from Market)
        // Liquidate data from tx 0x0007340e:
        // sender: 0x85f66DBe1ed470A091d338CFC7429AA871720283 (liquidator/borrower)
        // owner: 0x9fB7D92526Fc13bB3c0603d39E55e5C371c26Ce6 (Shiva - because position was built via Shiva)
        // positionId: 13
        // mint: -79801820927883822955 (negative = loss)
        // price: 78945256840088000000
        // oiAfterLiquidate: 1067355538828551310424
        // oiSharesAfterLiquidate: 1088394485960246158162
        const liquidateMint = BigInt.fromString("-79801820927883822955")
        const liquidatePrice = BigInt.fromString("78945256840088000000")
        const oiAfterLiquidate = BigInt.fromString("1067355538828551310424")
        const oiSharesAfterLiquidate = BigInt.fromString("1088394485960246158162")

        const liquidateEvent = createLiquidateEvent(
            liqMarketAddress,
            borrowerAddress, // sender (liquidator)
            shivaAddress, // owner (Shiva - because position was built via Shiva)
            liqPositionIdBigInt,
            liquidateMint,
            liquidatePrice,
            oiAfterLiquidate,
            oiSharesAfterLiquidate
        )
        handleLiquidate(liquidateEvent)
        let liquidateEntity = Liquidate.load(liqMarketPositionId)!

        // EXPECTED: After Liquidate event, realizedPnlStables SHOULD be updated
        // The position was built with stableAmount/ovlAmount, so the PnL in stables should be:
        // stablePnL = liquidateEntity.size * liqStableAmount / liqOvlAmount
        const expectedStablePnl = liquidateEntity.size.times(liqStableAmount).div(liqOvlAmount)
        const expectedPnlStables = pnlStablesBeforeLiquidation.minus(expectedStablePnl)

        // This assertion should FAIL until the feature is implemented
        assert.fieldEquals("Account", borrowerAddress.toHexString(), "realizedPnlStables", expectedPnlStables.toString())

        // realizedPnlOvl should remain unchanged (since this is a liquidation via stables)
        assert.fieldEquals("Account", borrowerAddress.toHexString(), "realizedPnlOvl", pnlOvlBeforeLiquidation.toString())
    })
})

