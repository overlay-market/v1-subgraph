// THIS IS AN AUTOGENERATED FILE. DO NOT EDIT THIS FILE DIRECTLY.

import {
  ethereum,
  JSONValue,
  TypedMap,
  Entity,
  Bytes,
  Address,
  BigInt
} from "@graphprotocol/graph-ts";

export class OverlayV1State__dataResultData_Struct extends ethereum.Tuple {
  get timestamp(): BigInt {
    return this[0].toBigInt();
  }

  get microWindow(): BigInt {
    return this[1].toBigInt();
  }

  get macroWindow(): BigInt {
    return this[2].toBigInt();
  }

  get priceOverMicroWindow(): BigInt {
    return this[3].toBigInt();
  }

  get priceOverMacroWindow(): BigInt {
    return this[4].toBigInt();
  }

  get priceOneMacroWindowAgo(): BigInt {
    return this[5].toBigInt();
  }

  get reserveOverMicroWindow(): BigInt {
    return this[6].toBigInt();
  }

  get hasReserve(): boolean {
    return this[7].toBoolean();
  }
}

export class OverlayV1State__marketStateResultState_Struct extends ethereum.Tuple {
  get bid(): BigInt {
    return this[0].toBigInt();
  }

  get ask(): BigInt {
    return this[1].toBigInt();
  }

  get mid(): BigInt {
    return this[2].toBigInt();
  }

  get volumeBid(): BigInt {
    return this[3].toBigInt();
  }

  get volumeAsk(): BigInt {
    return this[4].toBigInt();
  }

  get oiLong(): BigInt {
    return this[5].toBigInt();
  }

  get oiShort(): BigInt {
    return this[6].toBigInt();
  }

  get capOi(): BigInt {
    return this[7].toBigInt();
  }

  get circuitBreakerLevel(): BigInt {
    return this[8].toBigInt();
  }

  get fundingRate(): BigInt {
    return this[9].toBigInt();
  }
}

export class OverlayV1State__oisResult {
  value0: BigInt;
  value1: BigInt;

  constructor(value0: BigInt, value1: BigInt) {
    this.value0 = value0;
    this.value1 = value1;
  }

  toMap(): TypedMap<string, ethereum.Value> {
    let map = new TypedMap<string, ethereum.Value>();
    map.set("value0", ethereum.Value.fromUnsignedBigInt(this.value0));
    map.set("value1", ethereum.Value.fromUnsignedBigInt(this.value1));
    return map;
  }
}

export class OverlayV1State__positionResultPosition_Struct extends ethereum.Tuple {
  get notionalInitial(): BigInt {
    return this[0].toBigInt();
  }

  get debtInitial(): BigInt {
    return this[1].toBigInt();
  }

  get midTick(): i32 {
    return this[2].toI32();
  }

  get entryTick(): i32 {
    return this[3].toI32();
  }

  get isLong(): boolean {
    return this[4].toBoolean();
  }

  get liquidated(): boolean {
    return this[5].toBoolean();
  }

  get oiShares(): BigInt {
    return this[6].toBigInt();
  }

  get fractionRemaining(): i32 {
    return this[7].toI32();
  }
}

export class OverlayV1State__positionEstimateResultPosition_Struct extends ethereum.Tuple {
  get notionalInitial(): BigInt {
    return this[0].toBigInt();
  }

  get debtInitial(): BigInt {
    return this[1].toBigInt();
  }

  get midTick(): i32 {
    return this[2].toI32();
  }

  get entryTick(): i32 {
    return this[3].toI32();
  }

  get isLong(): boolean {
    return this[4].toBoolean();
  }

  get liquidated(): boolean {
    return this[5].toBoolean();
  }

  get oiShares(): BigInt {
    return this[6].toBigInt();
  }

  get fractionRemaining(): i32 {
    return this[7].toI32();
  }
}

export class OverlayV1State__pricesResult {
  value0: BigInt;
  value1: BigInt;
  value2: BigInt;

  constructor(value0: BigInt, value1: BigInt, value2: BigInt) {
    this.value0 = value0;
    this.value1 = value1;
    this.value2 = value2;
  }

  toMap(): TypedMap<string, ethereum.Value> {
    let map = new TypedMap<string, ethereum.Value>();
    map.set("value0", ethereum.Value.fromUnsignedBigInt(this.value0));
    map.set("value1", ethereum.Value.fromUnsignedBigInt(this.value1));
    map.set("value2", ethereum.Value.fromUnsignedBigInt(this.value2));
    return map;
  }
}

export class OverlayV1State__volumesResult {
  value0: BigInt;
  value1: BigInt;

  constructor(value0: BigInt, value1: BigInt) {
    this.value0 = value0;
    this.value1 = value1;
  }

  toMap(): TypedMap<string, ethereum.Value> {
    let map = new TypedMap<string, ethereum.Value>();
    map.set("value0", ethereum.Value.fromUnsignedBigInt(this.value0));
    map.set("value1", ethereum.Value.fromUnsignedBigInt(this.value1));
    return map;
  }
}

export class OverlayV1State extends ethereum.SmartContract {
  static bind(address: Address): OverlayV1State {
    return new OverlayV1State("OverlayV1State", address);
  }

  ask(market: Address, fractionOfCapOi: BigInt): BigInt {
    let result = super.call("ask", "ask(address,uint256):(uint256)", [
      ethereum.Value.fromAddress(market),
      ethereum.Value.fromUnsignedBigInt(fractionOfCapOi)
    ]);

    return result[0].toBigInt();
  }

  try_ask(
    market: Address,
    fractionOfCapOi: BigInt
  ): ethereum.CallResult<BigInt> {
    let result = super.tryCall("ask", "ask(address,uint256):(uint256)", [
      ethereum.Value.fromAddress(market),
      ethereum.Value.fromUnsignedBigInt(fractionOfCapOi)
    ]);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  bid(market: Address, fractionOfCapOi: BigInt): BigInt {
    let result = super.call("bid", "bid(address,uint256):(uint256)", [
      ethereum.Value.fromAddress(market),
      ethereum.Value.fromUnsignedBigInt(fractionOfCapOi)
    ]);

    return result[0].toBigInt();
  }

  try_bid(
    market: Address,
    fractionOfCapOi: BigInt
  ): ethereum.CallResult<BigInt> {
    let result = super.tryCall("bid", "bid(address,uint256):(uint256)", [
      ethereum.Value.fromAddress(market),
      ethereum.Value.fromUnsignedBigInt(fractionOfCapOi)
    ]);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  capOi(market: Address): BigInt {
    let result = super.call("capOi", "capOi(address):(uint256)", [
      ethereum.Value.fromAddress(market)
    ]);

    return result[0].toBigInt();
  }

  try_capOi(market: Address): ethereum.CallResult<BigInt> {
    let result = super.tryCall("capOi", "capOi(address):(uint256)", [
      ethereum.Value.fromAddress(market)
    ]);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  circuitBreakerLevel(market: Address): BigInt {
    let result = super.call(
      "circuitBreakerLevel",
      "circuitBreakerLevel(address):(uint256)",
      [ethereum.Value.fromAddress(market)]
    );

    return result[0].toBigInt();
  }

  try_circuitBreakerLevel(market: Address): ethereum.CallResult<BigInt> {
    let result = super.tryCall(
      "circuitBreakerLevel",
      "circuitBreakerLevel(address):(uint256)",
      [ethereum.Value.fromAddress(market)]
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  collateral(market: Address, owner: Address, id: BigInt): BigInt {
    let result = super.call(
      "collateral",
      "collateral(address,address,uint256):(uint256)",
      [
        ethereum.Value.fromAddress(market),
        ethereum.Value.fromAddress(owner),
        ethereum.Value.fromUnsignedBigInt(id)
      ]
    );

    return result[0].toBigInt();
  }

  try_collateral(
    market: Address,
    owner: Address,
    id: BigInt
  ): ethereum.CallResult<BigInt> {
    let result = super.tryCall(
      "collateral",
      "collateral(address,address,uint256):(uint256)",
      [
        ethereum.Value.fromAddress(market),
        ethereum.Value.fromAddress(owner),
        ethereum.Value.fromUnsignedBigInt(id)
      ]
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  cost(market: Address, owner: Address, id: BigInt): BigInt {
    let result = super.call("cost", "cost(address,address,uint256):(uint256)", [
      ethereum.Value.fromAddress(market),
      ethereum.Value.fromAddress(owner),
      ethereum.Value.fromUnsignedBigInt(id)
    ]);

    return result[0].toBigInt();
  }

  try_cost(
    market: Address,
    owner: Address,
    id: BigInt
  ): ethereum.CallResult<BigInt> {
    let result = super.tryCall(
      "cost",
      "cost(address,address,uint256):(uint256)",
      [
        ethereum.Value.fromAddress(market),
        ethereum.Value.fromAddress(owner),
        ethereum.Value.fromUnsignedBigInt(id)
      ]
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  costEstimate(
    market: Address,
    collateral: BigInt,
    leverage: BigInt,
    isLong: boolean
  ): BigInt {
    let result = super.call(
      "costEstimate",
      "costEstimate(address,uint256,uint256,bool):(uint256)",
      [
        ethereum.Value.fromAddress(market),
        ethereum.Value.fromUnsignedBigInt(collateral),
        ethereum.Value.fromUnsignedBigInt(leverage),
        ethereum.Value.fromBoolean(isLong)
      ]
    );

    return result[0].toBigInt();
  }

  try_costEstimate(
    market: Address,
    collateral: BigInt,
    leverage: BigInt,
    isLong: boolean
  ): ethereum.CallResult<BigInt> {
    let result = super.tryCall(
      "costEstimate",
      "costEstimate(address,uint256,uint256,bool):(uint256)",
      [
        ethereum.Value.fromAddress(market),
        ethereum.Value.fromUnsignedBigInt(collateral),
        ethereum.Value.fromUnsignedBigInt(leverage),
        ethereum.Value.fromBoolean(isLong)
      ]
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  data(feed: Address): OverlayV1State__dataResultData_Struct {
    let result = super.call(
      "data",
      "data(address):((uint256,uint256,uint256,uint256,uint256,uint256,uint256,bool))",
      [ethereum.Value.fromAddress(feed)]
    );

    return changetype<OverlayV1State__dataResultData_Struct>(
      result[0].toTuple()
    );
  }

  try_data(
    feed: Address
  ): ethereum.CallResult<OverlayV1State__dataResultData_Struct> {
    let result = super.tryCall(
      "data",
      "data(address):((uint256,uint256,uint256,uint256,uint256,uint256,uint256,bool))",
      [ethereum.Value.fromAddress(feed)]
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(
      changetype<OverlayV1State__dataResultData_Struct>(value[0].toTuple())
    );
  }

  debt(market: Address, owner: Address, id: BigInt): BigInt {
    let result = super.call("debt", "debt(address,address,uint256):(uint256)", [
      ethereum.Value.fromAddress(market),
      ethereum.Value.fromAddress(owner),
      ethereum.Value.fromUnsignedBigInt(id)
    ]);

    return result[0].toBigInt();
  }

  try_debt(
    market: Address,
    owner: Address,
    id: BigInt
  ): ethereum.CallResult<BigInt> {
    let result = super.tryCall(
      "debt",
      "debt(address,address,uint256):(uint256)",
      [
        ethereum.Value.fromAddress(market),
        ethereum.Value.fromAddress(owner),
        ethereum.Value.fromUnsignedBigInt(id)
      ]
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  debtEstimate(
    market: Address,
    collateral: BigInt,
    leverage: BigInt,
    isLong: boolean
  ): BigInt {
    let result = super.call(
      "debtEstimate",
      "debtEstimate(address,uint256,uint256,bool):(uint256)",
      [
        ethereum.Value.fromAddress(market),
        ethereum.Value.fromUnsignedBigInt(collateral),
        ethereum.Value.fromUnsignedBigInt(leverage),
        ethereum.Value.fromBoolean(isLong)
      ]
    );

    return result[0].toBigInt();
  }

  try_debtEstimate(
    market: Address,
    collateral: BigInt,
    leverage: BigInt,
    isLong: boolean
  ): ethereum.CallResult<BigInt> {
    let result = super.tryCall(
      "debtEstimate",
      "debtEstimate(address,uint256,uint256,bool):(uint256)",
      [
        ethereum.Value.fromAddress(market),
        ethereum.Value.fromUnsignedBigInt(collateral),
        ethereum.Value.fromUnsignedBigInt(leverage),
        ethereum.Value.fromBoolean(isLong)
      ]
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  factory(): Address {
    let result = super.call("factory", "factory():(address)", []);

    return result[0].toAddress();
  }

  try_factory(): ethereum.CallResult<Address> {
    let result = super.tryCall("factory", "factory():(address)", []);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toAddress());
  }

  fractionOfCapOi(market: Address, oi: BigInt): BigInt {
    let result = super.call(
      "fractionOfCapOi",
      "fractionOfCapOi(address,uint256):(uint256)",
      [
        ethereum.Value.fromAddress(market),
        ethereum.Value.fromUnsignedBigInt(oi)
      ]
    );

    return result[0].toBigInt();
  }

  try_fractionOfCapOi(
    market: Address,
    oi: BigInt
  ): ethereum.CallResult<BigInt> {
    let result = super.tryCall(
      "fractionOfCapOi",
      "fractionOfCapOi(address,uint256):(uint256)",
      [
        ethereum.Value.fromAddress(market),
        ethereum.Value.fromUnsignedBigInt(oi)
      ]
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  fundingRate(market: Address): BigInt {
    let result = super.call("fundingRate", "fundingRate(address):(int256)", [
      ethereum.Value.fromAddress(market)
    ]);

    return result[0].toBigInt();
  }

  try_fundingRate(market: Address): ethereum.CallResult<BigInt> {
    let result = super.tryCall("fundingRate", "fundingRate(address):(int256)", [
      ethereum.Value.fromAddress(market)
    ]);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  liquidatable(market: Address, owner: Address, id: BigInt): boolean {
    let result = super.call(
      "liquidatable",
      "liquidatable(address,address,uint256):(bool)",
      [
        ethereum.Value.fromAddress(market),
        ethereum.Value.fromAddress(owner),
        ethereum.Value.fromUnsignedBigInt(id)
      ]
    );

    return result[0].toBoolean();
  }

  try_liquidatable(
    market: Address,
    owner: Address,
    id: BigInt
  ): ethereum.CallResult<boolean> {
    let result = super.tryCall(
      "liquidatable",
      "liquidatable(address,address,uint256):(bool)",
      [
        ethereum.Value.fromAddress(market),
        ethereum.Value.fromAddress(owner),
        ethereum.Value.fromUnsignedBigInt(id)
      ]
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBoolean());
  }

  liquidationFee(market: Address, owner: Address, id: BigInt): BigInt {
    let result = super.call(
      "liquidationFee",
      "liquidationFee(address,address,uint256):(uint256)",
      [
        ethereum.Value.fromAddress(market),
        ethereum.Value.fromAddress(owner),
        ethereum.Value.fromUnsignedBigInt(id)
      ]
    );

    return result[0].toBigInt();
  }

  try_liquidationFee(
    market: Address,
    owner: Address,
    id: BigInt
  ): ethereum.CallResult<BigInt> {
    let result = super.tryCall(
      "liquidationFee",
      "liquidationFee(address,address,uint256):(uint256)",
      [
        ethereum.Value.fromAddress(market),
        ethereum.Value.fromAddress(owner),
        ethereum.Value.fromUnsignedBigInt(id)
      ]
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  liquidationPrice(market: Address, owner: Address, id: BigInt): BigInt {
    let result = super.call(
      "liquidationPrice",
      "liquidationPrice(address,address,uint256):(uint256)",
      [
        ethereum.Value.fromAddress(market),
        ethereum.Value.fromAddress(owner),
        ethereum.Value.fromUnsignedBigInt(id)
      ]
    );

    return result[0].toBigInt();
  }

  try_liquidationPrice(
    market: Address,
    owner: Address,
    id: BigInt
  ): ethereum.CallResult<BigInt> {
    let result = super.tryCall(
      "liquidationPrice",
      "liquidationPrice(address,address,uint256):(uint256)",
      [
        ethereum.Value.fromAddress(market),
        ethereum.Value.fromAddress(owner),
        ethereum.Value.fromUnsignedBigInt(id)
      ]
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  liquidationPriceEstimate(
    market: Address,
    collateral: BigInt,
    leverage: BigInt,
    isLong: boolean
  ): BigInt {
    let result = super.call(
      "liquidationPriceEstimate",
      "liquidationPriceEstimate(address,uint256,uint256,bool):(uint256)",
      [
        ethereum.Value.fromAddress(market),
        ethereum.Value.fromUnsignedBigInt(collateral),
        ethereum.Value.fromUnsignedBigInt(leverage),
        ethereum.Value.fromBoolean(isLong)
      ]
    );

    return result[0].toBigInt();
  }

  try_liquidationPriceEstimate(
    market: Address,
    collateral: BigInt,
    leverage: BigInt,
    isLong: boolean
  ): ethereum.CallResult<BigInt> {
    let result = super.tryCall(
      "liquidationPriceEstimate",
      "liquidationPriceEstimate(address,uint256,uint256,bool):(uint256)",
      [
        ethereum.Value.fromAddress(market),
        ethereum.Value.fromUnsignedBigInt(collateral),
        ethereum.Value.fromUnsignedBigInt(leverage),
        ethereum.Value.fromBoolean(isLong)
      ]
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  maintenanceMargin(market: Address, owner: Address, id: BigInt): BigInt {
    let result = super.call(
      "maintenanceMargin",
      "maintenanceMargin(address,address,uint256):(uint256)",
      [
        ethereum.Value.fromAddress(market),
        ethereum.Value.fromAddress(owner),
        ethereum.Value.fromUnsignedBigInt(id)
      ]
    );

    return result[0].toBigInt();
  }

  try_maintenanceMargin(
    market: Address,
    owner: Address,
    id: BigInt
  ): ethereum.CallResult<BigInt> {
    let result = super.tryCall(
      "maintenanceMargin",
      "maintenanceMargin(address,address,uint256):(uint256)",
      [
        ethereum.Value.fromAddress(market),
        ethereum.Value.fromAddress(owner),
        ethereum.Value.fromUnsignedBigInt(id)
      ]
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  maintenanceMarginEstimate(
    market: Address,
    collateral: BigInt,
    leverage: BigInt,
    isLong: boolean
  ): BigInt {
    let result = super.call(
      "maintenanceMarginEstimate",
      "maintenanceMarginEstimate(address,uint256,uint256,bool):(uint256)",
      [
        ethereum.Value.fromAddress(market),
        ethereum.Value.fromUnsignedBigInt(collateral),
        ethereum.Value.fromUnsignedBigInt(leverage),
        ethereum.Value.fromBoolean(isLong)
      ]
    );

    return result[0].toBigInt();
  }

  try_maintenanceMarginEstimate(
    market: Address,
    collateral: BigInt,
    leverage: BigInt,
    isLong: boolean
  ): ethereum.CallResult<BigInt> {
    let result = super.tryCall(
      "maintenanceMarginEstimate",
      "maintenanceMarginEstimate(address,uint256,uint256,bool):(uint256)",
      [
        ethereum.Value.fromAddress(market),
        ethereum.Value.fromUnsignedBigInt(collateral),
        ethereum.Value.fromUnsignedBigInt(leverage),
        ethereum.Value.fromBoolean(isLong)
      ]
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  marginExcessBeforeLiquidation(
    market: Address,
    owner: Address,
    id: BigInt
  ): BigInt {
    let result = super.call(
      "marginExcessBeforeLiquidation",
      "marginExcessBeforeLiquidation(address,address,uint256):(int256)",
      [
        ethereum.Value.fromAddress(market),
        ethereum.Value.fromAddress(owner),
        ethereum.Value.fromUnsignedBigInt(id)
      ]
    );

    return result[0].toBigInt();
  }

  try_marginExcessBeforeLiquidation(
    market: Address,
    owner: Address,
    id: BigInt
  ): ethereum.CallResult<BigInt> {
    let result = super.tryCall(
      "marginExcessBeforeLiquidation",
      "marginExcessBeforeLiquidation(address,address,uint256):(int256)",
      [
        ethereum.Value.fromAddress(market),
        ethereum.Value.fromAddress(owner),
        ethereum.Value.fromUnsignedBigInt(id)
      ]
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  market(feed: Address): Address {
    let result = super.call("market", "market(address):(address)", [
      ethereum.Value.fromAddress(feed)
    ]);

    return result[0].toAddress();
  }

  try_market(feed: Address): ethereum.CallResult<Address> {
    let result = super.tryCall("market", "market(address):(address)", [
      ethereum.Value.fromAddress(feed)
    ]);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toAddress());
  }

  marketState(market: Address): OverlayV1State__marketStateResultState_Struct {
    let result = super.call(
      "marketState",
      "marketState(address):((uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,int256))",
      [ethereum.Value.fromAddress(market)]
    );

    return changetype<OverlayV1State__marketStateResultState_Struct>(
      result[0].toTuple()
    );
  }

  try_marketState(
    market: Address
  ): ethereum.CallResult<OverlayV1State__marketStateResultState_Struct> {
    let result = super.tryCall(
      "marketState",
      "marketState(address):((uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,int256))",
      [ethereum.Value.fromAddress(market)]
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(
      changetype<OverlayV1State__marketStateResultState_Struct>(
        value[0].toTuple()
      )
    );
  }

  mid(market: Address): BigInt {
    let result = super.call("mid", "mid(address):(uint256)", [
      ethereum.Value.fromAddress(market)
    ]);

    return result[0].toBigInt();
  }

  try_mid(market: Address): ethereum.CallResult<BigInt> {
    let result = super.tryCall("mid", "mid(address):(uint256)", [
      ethereum.Value.fromAddress(market)
    ]);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  minted(market: Address): BigInt {
    let result = super.call("minted", "minted(address):(int256)", [
      ethereum.Value.fromAddress(market)
    ]);

    return result[0].toBigInt();
  }

  try_minted(market: Address): ethereum.CallResult<BigInt> {
    let result = super.tryCall("minted", "minted(address):(int256)", [
      ethereum.Value.fromAddress(market)
    ]);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  notional(market: Address, owner: Address, id: BigInt): BigInt {
    let result = super.call(
      "notional",
      "notional(address,address,uint256):(uint256)",
      [
        ethereum.Value.fromAddress(market),
        ethereum.Value.fromAddress(owner),
        ethereum.Value.fromUnsignedBigInt(id)
      ]
    );

    return result[0].toBigInt();
  }

  try_notional(
    market: Address,
    owner: Address,
    id: BigInt
  ): ethereum.CallResult<BigInt> {
    let result = super.tryCall(
      "notional",
      "notional(address,address,uint256):(uint256)",
      [
        ethereum.Value.fromAddress(market),
        ethereum.Value.fromAddress(owner),
        ethereum.Value.fromUnsignedBigInt(id)
      ]
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  oi(market: Address, owner: Address, id: BigInt): BigInt {
    let result = super.call("oi", "oi(address,address,uint256):(uint256)", [
      ethereum.Value.fromAddress(market),
      ethereum.Value.fromAddress(owner),
      ethereum.Value.fromUnsignedBigInt(id)
    ]);

    return result[0].toBigInt();
  }

  try_oi(
    market: Address,
    owner: Address,
    id: BigInt
  ): ethereum.CallResult<BigInt> {
    let result = super.tryCall("oi", "oi(address,address,uint256):(uint256)", [
      ethereum.Value.fromAddress(market),
      ethereum.Value.fromAddress(owner),
      ethereum.Value.fromUnsignedBigInt(id)
    ]);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  oiEstimate(
    market: Address,
    collateral: BigInt,
    leverage: BigInt,
    isLong: boolean
  ): BigInt {
    let result = super.call(
      "oiEstimate",
      "oiEstimate(address,uint256,uint256,bool):(uint256)",
      [
        ethereum.Value.fromAddress(market),
        ethereum.Value.fromUnsignedBigInt(collateral),
        ethereum.Value.fromUnsignedBigInt(leverage),
        ethereum.Value.fromBoolean(isLong)
      ]
    );

    return result[0].toBigInt();
  }

  try_oiEstimate(
    market: Address,
    collateral: BigInt,
    leverage: BigInt,
    isLong: boolean
  ): ethereum.CallResult<BigInt> {
    let result = super.tryCall(
      "oiEstimate",
      "oiEstimate(address,uint256,uint256,bool):(uint256)",
      [
        ethereum.Value.fromAddress(market),
        ethereum.Value.fromUnsignedBigInt(collateral),
        ethereum.Value.fromUnsignedBigInt(leverage),
        ethereum.Value.fromBoolean(isLong)
      ]
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  ois(market: Address): OverlayV1State__oisResult {
    let result = super.call("ois", "ois(address):(uint256,uint256)", [
      ethereum.Value.fromAddress(market)
    ]);

    return new OverlayV1State__oisResult(
      result[0].toBigInt(),
      result[1].toBigInt()
    );
  }

  try_ois(market: Address): ethereum.CallResult<OverlayV1State__oisResult> {
    let result = super.tryCall("ois", "ois(address):(uint256,uint256)", [
      ethereum.Value.fromAddress(market)
    ]);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(
      new OverlayV1State__oisResult(value[0].toBigInt(), value[1].toBigInt())
    );
  }

  position(
    market: Address,
    owner: Address,
    id: BigInt
  ): OverlayV1State__positionResultPosition_Struct {
    let result = super.call(
      "position",
      "position(address,address,uint256):((uint96,uint96,int24,int24,bool,bool,uint240,uint16))",
      [
        ethereum.Value.fromAddress(market),
        ethereum.Value.fromAddress(owner),
        ethereum.Value.fromUnsignedBigInt(id)
      ]
    );

    return changetype<OverlayV1State__positionResultPosition_Struct>(
      result[0].toTuple()
    );
  }

  try_position(
    market: Address,
    owner: Address,
    id: BigInt
  ): ethereum.CallResult<OverlayV1State__positionResultPosition_Struct> {
    let result = super.tryCall(
      "position",
      "position(address,address,uint256):((uint96,uint96,int24,int24,bool,bool,uint240,uint16))",
      [
        ethereum.Value.fromAddress(market),
        ethereum.Value.fromAddress(owner),
        ethereum.Value.fromUnsignedBigInt(id)
      ]
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(
      changetype<OverlayV1State__positionResultPosition_Struct>(
        value[0].toTuple()
      )
    );
  }

  positionEstimate(
    market: Address,
    collateral: BigInt,
    leverage: BigInt,
    isLong: boolean
  ): OverlayV1State__positionEstimateResultPosition_Struct {
    let result = super.call(
      "positionEstimate",
      "positionEstimate(address,uint256,uint256,bool):((uint96,uint96,int24,int24,bool,bool,uint240,uint16))",
      [
        ethereum.Value.fromAddress(market),
        ethereum.Value.fromUnsignedBigInt(collateral),
        ethereum.Value.fromUnsignedBigInt(leverage),
        ethereum.Value.fromBoolean(isLong)
      ]
    );

    return changetype<OverlayV1State__positionEstimateResultPosition_Struct>(
      result[0].toTuple()
    );
  }

  try_positionEstimate(
    market: Address,
    collateral: BigInt,
    leverage: BigInt,
    isLong: boolean
  ): ethereum.CallResult<
    OverlayV1State__positionEstimateResultPosition_Struct
  > {
    let result = super.tryCall(
      "positionEstimate",
      "positionEstimate(address,uint256,uint256,bool):((uint96,uint96,int24,int24,bool,bool,uint240,uint16))",
      [
        ethereum.Value.fromAddress(market),
        ethereum.Value.fromUnsignedBigInt(collateral),
        ethereum.Value.fromUnsignedBigInt(leverage),
        ethereum.Value.fromBoolean(isLong)
      ]
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(
      changetype<OverlayV1State__positionEstimateResultPosition_Struct>(
        value[0].toTuple()
      )
    );
  }

  prices(market: Address): OverlayV1State__pricesResult {
    let result = super.call(
      "prices",
      "prices(address):(uint256,uint256,uint256)",
      [ethereum.Value.fromAddress(market)]
    );

    return new OverlayV1State__pricesResult(
      result[0].toBigInt(),
      result[1].toBigInt(),
      result[2].toBigInt()
    );
  }

  try_prices(
    market: Address
  ): ethereum.CallResult<OverlayV1State__pricesResult> {
    let result = super.tryCall(
      "prices",
      "prices(address):(uint256,uint256,uint256)",
      [ethereum.Value.fromAddress(market)]
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(
      new OverlayV1State__pricesResult(
        value[0].toBigInt(),
        value[1].toBigInt(),
        value[2].toBigInt()
      )
    );
  }

  tradingFee(market: Address, owner: Address, id: BigInt): BigInt {
    let result = super.call(
      "tradingFee",
      "tradingFee(address,address,uint256):(uint256)",
      [
        ethereum.Value.fromAddress(market),
        ethereum.Value.fromAddress(owner),
        ethereum.Value.fromUnsignedBigInt(id)
      ]
    );

    return result[0].toBigInt();
  }

  try_tradingFee(
    market: Address,
    owner: Address,
    id: BigInt
  ): ethereum.CallResult<BigInt> {
    let result = super.tryCall(
      "tradingFee",
      "tradingFee(address,address,uint256):(uint256)",
      [
        ethereum.Value.fromAddress(market),
        ethereum.Value.fromAddress(owner),
        ethereum.Value.fromUnsignedBigInt(id)
      ]
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  value(market: Address, owner: Address, id: BigInt): BigInt {
    let result = super.call(
      "value",
      "value(address,address,uint256):(uint256)",
      [
        ethereum.Value.fromAddress(market),
        ethereum.Value.fromAddress(owner),
        ethereum.Value.fromUnsignedBigInt(id)
      ]
    );

    return result[0].toBigInt();
  }

  try_value(
    market: Address,
    owner: Address,
    id: BigInt
  ): ethereum.CallResult<BigInt> {
    let result = super.tryCall(
      "value",
      "value(address,address,uint256):(uint256)",
      [
        ethereum.Value.fromAddress(market),
        ethereum.Value.fromAddress(owner),
        ethereum.Value.fromUnsignedBigInt(id)
      ]
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  volumeAsk(market: Address, fractionOfCapOi: BigInt): BigInt {
    let result = super.call(
      "volumeAsk",
      "volumeAsk(address,uint256):(uint256)",
      [
        ethereum.Value.fromAddress(market),
        ethereum.Value.fromUnsignedBigInt(fractionOfCapOi)
      ]
    );

    return result[0].toBigInt();
  }

  try_volumeAsk(
    market: Address,
    fractionOfCapOi: BigInt
  ): ethereum.CallResult<BigInt> {
    let result = super.tryCall(
      "volumeAsk",
      "volumeAsk(address,uint256):(uint256)",
      [
        ethereum.Value.fromAddress(market),
        ethereum.Value.fromUnsignedBigInt(fractionOfCapOi)
      ]
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  volumeBid(market: Address, fractionOfCapOi: BigInt): BigInt {
    let result = super.call(
      "volumeBid",
      "volumeBid(address,uint256):(uint256)",
      [
        ethereum.Value.fromAddress(market),
        ethereum.Value.fromUnsignedBigInt(fractionOfCapOi)
      ]
    );

    return result[0].toBigInt();
  }

  try_volumeBid(
    market: Address,
    fractionOfCapOi: BigInt
  ): ethereum.CallResult<BigInt> {
    let result = super.tryCall(
      "volumeBid",
      "volumeBid(address,uint256):(uint256)",
      [
        ethereum.Value.fromAddress(market),
        ethereum.Value.fromUnsignedBigInt(fractionOfCapOi)
      ]
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  volumes(market: Address): OverlayV1State__volumesResult {
    let result = super.call("volumes", "volumes(address):(uint256,uint256)", [
      ethereum.Value.fromAddress(market)
    ]);

    return new OverlayV1State__volumesResult(
      result[0].toBigInt(),
      result[1].toBigInt()
    );
  }

  try_volumes(
    market: Address
  ): ethereum.CallResult<OverlayV1State__volumesResult> {
    let result = super.tryCall(
      "volumes",
      "volumes(address):(uint256,uint256)",
      [ethereum.Value.fromAddress(market)]
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(
      new OverlayV1State__volumesResult(
        value[0].toBigInt(),
        value[1].toBigInt()
      )
    );
  }
}

export class ConstructorCall extends ethereum.Call {
  get inputs(): ConstructorCall__Inputs {
    return new ConstructorCall__Inputs(this);
  }

  get outputs(): ConstructorCall__Outputs {
    return new ConstructorCall__Outputs(this);
  }
}

export class ConstructorCall__Inputs {
  _call: ConstructorCall;

  constructor(call: ConstructorCall) {
    this._call = call;
  }

  get _factory(): Address {
    return this._call.inputValues[0].value.toAddress();
  }
}

export class ConstructorCall__Outputs {
  _call: ConstructorCall;

  constructor(call: ConstructorCall) {
    this._call = call;
  }
}