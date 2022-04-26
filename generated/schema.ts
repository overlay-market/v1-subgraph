// THIS IS AN AUTOGENERATED FILE. DO NOT EDIT THIS FILE DIRECTLY.

import {
  TypedMap,
  Entity,
  Value,
  ValueKind,
  store,
  Bytes,
  BigInt,
  BigDecimal
} from "@graphprotocol/graph-ts";

export class Factory extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));

    this.set("marketCount", Value.fromBigInt(BigInt.zero()));
    this.set("txCount", Value.fromBigInt(BigInt.zero()));
    this.set("totalVolumeOVL", Value.fromBigDecimal(BigDecimal.zero()));
    this.set("totalFeesOVL", Value.fromBigDecimal(BigDecimal.zero()));
    this.set("totalValueLockedOVL", Value.fromBigDecimal(BigDecimal.zero()));
    this.set("feeRecipient", Value.fromString(""));
    this.set("owner", Value.fromString(""));
  }

  save(): void {
    let id = this.get("id");
    assert(id != null, "Cannot save Factory entity without an ID");
    if (id) {
      assert(
        id.kind == ValueKind.STRING,
        "Cannot save Factory entity with non-string ID. " +
          'Considering using .toHex() to convert the "id" to a string.'
      );
      store.set("Factory", id.toString(), this);
    }
  }

  static load(id: string): Factory | null {
    return changetype<Factory | null>(store.get("Factory", id));
  }

  get id(): string {
    let value = this.get("id");
    return value!.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get marketCount(): BigInt {
    let value = this.get("marketCount");
    return value!.toBigInt();
  }

  set marketCount(value: BigInt) {
    this.set("marketCount", Value.fromBigInt(value));
  }

  get txCount(): BigInt {
    let value = this.get("txCount");
    return value!.toBigInt();
  }

  set txCount(value: BigInt) {
    this.set("txCount", Value.fromBigInt(value));
  }

  get totalVolumeOVL(): BigDecimal {
    let value = this.get("totalVolumeOVL");
    return value!.toBigDecimal();
  }

  set totalVolumeOVL(value: BigDecimal) {
    this.set("totalVolumeOVL", Value.fromBigDecimal(value));
  }

  get totalFeesOVL(): BigDecimal {
    let value = this.get("totalFeesOVL");
    return value!.toBigDecimal();
  }

  set totalFeesOVL(value: BigDecimal) {
    this.set("totalFeesOVL", Value.fromBigDecimal(value));
  }

  get totalValueLockedOVL(): BigDecimal {
    let value = this.get("totalValueLockedOVL");
    return value!.toBigDecimal();
  }

  set totalValueLockedOVL(value: BigDecimal) {
    this.set("totalValueLockedOVL", Value.fromBigDecimal(value));
  }

  get feeRecipient(): string {
    let value = this.get("feeRecipient");
    return value!.toString();
  }

  set feeRecipient(value: string) {
    this.set("feeRecipient", Value.fromString(value));
  }

  get owner(): string {
    let value = this.get("owner");
    return value!.toString();
  }

  set owner(value: string) {
    this.set("owner", Value.fromString(value));
  }

  get markets(): Array<string> {
    let value = this.get("markets");
    return value!.toStringArray();
  }

  set markets(value: Array<string>) {
    this.set("markets", Value.fromStringArray(value));
  }
}

export class Market extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));

    this.set("feedAddress", Value.fromString(""));
    this.set("factory", Value.fromString(""));
    this.set("createdAtTimestamp", Value.fromBigInt(BigInt.zero()));
    this.set("createdAtBlockNumber", Value.fromBigInt(BigInt.zero()));
    this.set("k", Value.fromBigInt(BigInt.zero()));
    this.set("lmbda", Value.fromBigInt(BigInt.zero()));
    this.set("delta", Value.fromBigInt(BigInt.zero()));
    this.set("capPayoff", Value.fromBigInt(BigInt.zero()));
    this.set("capNotional", Value.fromBigInt(BigInt.zero()));
    this.set("capLeverage", Value.fromBigInt(BigInt.zero()));
    this.set("circuitBreakerWindow", Value.fromBigInt(BigInt.zero()));
    this.set("circuitBreakerMintTarget", Value.fromBigInt(BigInt.zero()));
    this.set("maintenanceMarginFraction", Value.fromBigInt(BigInt.zero()));
    this.set("maintenanceMarginBurnRate", Value.fromBigInt(BigInt.zero()));
    this.set("liquidationFeeRate", Value.fromBigInt(BigInt.zero()));
    this.set("tradingFeeRate", Value.fromBigInt(BigInt.zero()));
    this.set("minCollateral", Value.fromBigInt(BigInt.zero()));
    this.set("priceDriftUpperLimit", Value.fromBigInt(BigInt.zero()));
    this.set("averageBlockTime", Value.fromBigInt(BigInt.zero()));
    this.set("oiLong", Value.fromBigInt(BigInt.zero()));
    this.set("oiShort", Value.fromBigInt(BigInt.zero()));
  }

  save(): void {
    let id = this.get("id");
    assert(id != null, "Cannot save Market entity without an ID");
    if (id) {
      assert(
        id.kind == ValueKind.STRING,
        "Cannot save Market entity with non-string ID. " +
          'Considering using .toHex() to convert the "id" to a string.'
      );
      store.set("Market", id.toString(), this);
    }
  }

  static load(id: string): Market | null {
    return changetype<Market | null>(store.get("Market", id));
  }

  get id(): string {
    let value = this.get("id");
    return value!.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get feedAddress(): string {
    let value = this.get("feedAddress");
    return value!.toString();
  }

  set feedAddress(value: string) {
    this.set("feedAddress", Value.fromString(value));
  }

  get factory(): string {
    let value = this.get("factory");
    return value!.toString();
  }

  set factory(value: string) {
    this.set("factory", Value.fromString(value));
  }

  get createdAtTimestamp(): BigInt {
    let value = this.get("createdAtTimestamp");
    return value!.toBigInt();
  }

  set createdAtTimestamp(value: BigInt) {
    this.set("createdAtTimestamp", Value.fromBigInt(value));
  }

  get createdAtBlockNumber(): BigInt {
    let value = this.get("createdAtBlockNumber");
    return value!.toBigInt();
  }

  set createdAtBlockNumber(value: BigInt) {
    this.set("createdAtBlockNumber", Value.fromBigInt(value));
  }

  get k(): BigInt {
    let value = this.get("k");
    return value!.toBigInt();
  }

  set k(value: BigInt) {
    this.set("k", Value.fromBigInt(value));
  }

  get lmbda(): BigInt {
    let value = this.get("lmbda");
    return value!.toBigInt();
  }

  set lmbda(value: BigInt) {
    this.set("lmbda", Value.fromBigInt(value));
  }

  get delta(): BigInt {
    let value = this.get("delta");
    return value!.toBigInt();
  }

  set delta(value: BigInt) {
    this.set("delta", Value.fromBigInt(value));
  }

  get capPayoff(): BigInt {
    let value = this.get("capPayoff");
    return value!.toBigInt();
  }

  set capPayoff(value: BigInt) {
    this.set("capPayoff", Value.fromBigInt(value));
  }

  get capNotional(): BigInt {
    let value = this.get("capNotional");
    return value!.toBigInt();
  }

  set capNotional(value: BigInt) {
    this.set("capNotional", Value.fromBigInt(value));
  }

  get capLeverage(): BigInt {
    let value = this.get("capLeverage");
    return value!.toBigInt();
  }

  set capLeverage(value: BigInt) {
    this.set("capLeverage", Value.fromBigInt(value));
  }

  get circuitBreakerWindow(): BigInt {
    let value = this.get("circuitBreakerWindow");
    return value!.toBigInt();
  }

  set circuitBreakerWindow(value: BigInt) {
    this.set("circuitBreakerWindow", Value.fromBigInt(value));
  }

  get circuitBreakerMintTarget(): BigInt {
    let value = this.get("circuitBreakerMintTarget");
    return value!.toBigInt();
  }

  set circuitBreakerMintTarget(value: BigInt) {
    this.set("circuitBreakerMintTarget", Value.fromBigInt(value));
  }

  get maintenanceMarginFraction(): BigInt {
    let value = this.get("maintenanceMarginFraction");
    return value!.toBigInt();
  }

  set maintenanceMarginFraction(value: BigInt) {
    this.set("maintenanceMarginFraction", Value.fromBigInt(value));
  }

  get maintenanceMarginBurnRate(): BigInt {
    let value = this.get("maintenanceMarginBurnRate");
    return value!.toBigInt();
  }

  set maintenanceMarginBurnRate(value: BigInt) {
    this.set("maintenanceMarginBurnRate", Value.fromBigInt(value));
  }

  get liquidationFeeRate(): BigInt {
    let value = this.get("liquidationFeeRate");
    return value!.toBigInt();
  }

  set liquidationFeeRate(value: BigInt) {
    this.set("liquidationFeeRate", Value.fromBigInt(value));
  }

  get tradingFeeRate(): BigInt {
    let value = this.get("tradingFeeRate");
    return value!.toBigInt();
  }

  set tradingFeeRate(value: BigInt) {
    this.set("tradingFeeRate", Value.fromBigInt(value));
  }

  get minCollateral(): BigInt {
    let value = this.get("minCollateral");
    return value!.toBigInt();
  }

  set minCollateral(value: BigInt) {
    this.set("minCollateral", Value.fromBigInt(value));
  }

  get priceDriftUpperLimit(): BigInt {
    let value = this.get("priceDriftUpperLimit");
    return value!.toBigInt();
  }

  set priceDriftUpperLimit(value: BigInt) {
    this.set("priceDriftUpperLimit", Value.fromBigInt(value));
  }

  get averageBlockTime(): BigInt {
    let value = this.get("averageBlockTime");
    return value!.toBigInt();
  }

  set averageBlockTime(value: BigInt) {
    this.set("averageBlockTime", Value.fromBigInt(value));
  }

  get oiLong(): BigInt {
    let value = this.get("oiLong");
    return value!.toBigInt();
  }

  set oiLong(value: BigInt) {
    this.set("oiLong", Value.fromBigInt(value));
  }

  get oiShort(): BigInt {
    let value = this.get("oiShort");
    return value!.toBigInt();
  }

  set oiShort(value: BigInt) {
    this.set("oiShort", Value.fromBigInt(value));
  }

  get positions(): Array<string> {
    let value = this.get("positions");
    return value!.toStringArray();
  }

  set positions(value: Array<string>) {
    this.set("positions", Value.fromStringArray(value));
  }
}

export class Position extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));

    this.set("positionId", Value.fromBigInt(BigInt.zero()));
    this.set("owner", Value.fromString(""));
    this.set("market", Value.fromString(""));
    this.set("initialOi", Value.fromBigInt(BigInt.zero()));
    this.set("initialDebt", Value.fromBigInt(BigInt.zero()));
    this.set("isLong", Value.fromBoolean(false));
    this.set("entryPrice", Value.fromBigInt(BigInt.zero()));
    this.set("isLiquidated", Value.fromBoolean(false));
    this.set("currentOi", Value.fromBigInt(BigInt.zero()));
    this.set("currentDebt", Value.fromBigInt(BigInt.zero()));
    this.set("leverage", Value.fromBigInt(BigInt.zero()));
    this.set("mint", Value.fromBigInt(BigInt.zero()));
    this.set("createdAtTimestamp", Value.fromBigInt(BigInt.zero()));
    this.set("createdAtBlockNumber", Value.fromBigInt(BigInt.zero()));
    this.set("transaction", Value.fromString(""));
  }

  save(): void {
    let id = this.get("id");
    assert(id != null, "Cannot save Position entity without an ID");
    if (id) {
      assert(
        id.kind == ValueKind.STRING,
        "Cannot save Position entity with non-string ID. " +
          'Considering using .toHex() to convert the "id" to a string.'
      );
      store.set("Position", id.toString(), this);
    }
  }

  static load(id: string): Position | null {
    return changetype<Position | null>(store.get("Position", id));
  }

  get id(): string {
    let value = this.get("id");
    return value!.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get positionId(): BigInt {
    let value = this.get("positionId");
    return value!.toBigInt();
  }

  set positionId(value: BigInt) {
    this.set("positionId", Value.fromBigInt(value));
  }

  get owner(): string {
    let value = this.get("owner");
    return value!.toString();
  }

  set owner(value: string) {
    this.set("owner", Value.fromString(value));
  }

  get market(): string {
    let value = this.get("market");
    return value!.toString();
  }

  set market(value: string) {
    this.set("market", Value.fromString(value));
  }

  get initialOi(): BigInt {
    let value = this.get("initialOi");
    return value!.toBigInt();
  }

  set initialOi(value: BigInt) {
    this.set("initialOi", Value.fromBigInt(value));
  }

  get initialDebt(): BigInt {
    let value = this.get("initialDebt");
    return value!.toBigInt();
  }

  set initialDebt(value: BigInt) {
    this.set("initialDebt", Value.fromBigInt(value));
  }

  get isLong(): boolean {
    let value = this.get("isLong");
    return value!.toBoolean();
  }

  set isLong(value: boolean) {
    this.set("isLong", Value.fromBoolean(value));
  }

  get entryPrice(): BigInt {
    let value = this.get("entryPrice");
    return value!.toBigInt();
  }

  set entryPrice(value: BigInt) {
    this.set("entryPrice", Value.fromBigInt(value));
  }

  get isLiquidated(): boolean {
    let value = this.get("isLiquidated");
    return value!.toBoolean();
  }

  set isLiquidated(value: boolean) {
    this.set("isLiquidated", Value.fromBoolean(value));
  }

  get currentOi(): BigInt {
    let value = this.get("currentOi");
    return value!.toBigInt();
  }

  set currentOi(value: BigInt) {
    this.set("currentOi", Value.fromBigInt(value));
  }

  get currentDebt(): BigInt {
    let value = this.get("currentDebt");
    return value!.toBigInt();
  }

  set currentDebt(value: BigInt) {
    this.set("currentDebt", Value.fromBigInt(value));
  }

  get leverage(): BigInt {
    let value = this.get("leverage");
    return value!.toBigInt();
  }

  set leverage(value: BigInt) {
    this.set("leverage", Value.fromBigInt(value));
  }

  get mint(): BigInt {
    let value = this.get("mint");
    return value!.toBigInt();
  }

  set mint(value: BigInt) {
    this.set("mint", Value.fromBigInt(value));
  }

  get createdAtTimestamp(): BigInt {
    let value = this.get("createdAtTimestamp");
    return value!.toBigInt();
  }

  set createdAtTimestamp(value: BigInt) {
    this.set("createdAtTimestamp", Value.fromBigInt(value));
  }

  get createdAtBlockNumber(): BigInt {
    let value = this.get("createdAtBlockNumber");
    return value!.toBigInt();
  }

  set createdAtBlockNumber(value: BigInt) {
    this.set("createdAtBlockNumber", Value.fromBigInt(value));
  }

  get transaction(): string {
    let value = this.get("transaction");
    return value!.toString();
  }

  set transaction(value: string) {
    this.set("transaction", Value.fromString(value));
  }
}

export class Transaction extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));

    this.set("blockNumber", Value.fromBigInt(BigInt.zero()));
    this.set("timestamp", Value.fromBigInt(BigInt.zero()));
    this.set("gasLimit", Value.fromBigInt(BigInt.zero()));
    this.set("gasPrice", Value.fromBigInt(BigInt.zero()));
  }

  save(): void {
    let id = this.get("id");
    assert(id != null, "Cannot save Transaction entity without an ID");
    if (id) {
      assert(
        id.kind == ValueKind.STRING,
        "Cannot save Transaction entity with non-string ID. " +
          'Considering using .toHex() to convert the "id" to a string.'
      );
      store.set("Transaction", id.toString(), this);
    }
  }

  static load(id: string): Transaction | null {
    return changetype<Transaction | null>(store.get("Transaction", id));
  }

  get id(): string {
    let value = this.get("id");
    return value!.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get blockNumber(): BigInt {
    let value = this.get("blockNumber");
    return value!.toBigInt();
  }

  set blockNumber(value: BigInt) {
    this.set("blockNumber", Value.fromBigInt(value));
  }

  get timestamp(): BigInt {
    let value = this.get("timestamp");
    return value!.toBigInt();
  }

  set timestamp(value: BigInt) {
    this.set("timestamp", Value.fromBigInt(value));
  }

  get gasLimit(): BigInt {
    let value = this.get("gasLimit");
    return value!.toBigInt();
  }

  set gasLimit(value: BigInt) {
    this.set("gasLimit", Value.fromBigInt(value));
  }

  get gasPrice(): BigInt {
    let value = this.get("gasPrice");
    return value!.toBigInt();
  }

  set gasPrice(value: BigInt) {
    this.set("gasPrice", Value.fromBigInt(value));
  }

  get builds(): Array<string> {
    let value = this.get("builds");
    return value!.toStringArray();
  }

  set builds(value: Array<string>) {
    this.set("builds", Value.fromStringArray(value));
  }
}

export class Build extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));

    this.set("positionId", Value.fromString(""));
    this.set("currentOi", Value.fromBigInt(BigInt.zero()));
    this.set("currentDebt", Value.fromBigInt(BigInt.zero()));
    this.set("isLong", Value.fromBoolean(false));
    this.set("price", Value.fromBigInt(BigInt.zero()));
    this.set("leverage", Value.fromBigInt(BigInt.zero()));
    this.set("cost", Value.fromBigInt(BigInt.zero()));
    this.set("collateral", Value.fromBigInt(BigInt.zero()));
    this.set("value", Value.fromBigInt(BigInt.zero()));
    this.set("timestamp", Value.fromBigInt(BigInt.zero()));
    this.set("transaction", Value.fromString(""));
  }

  save(): void {
    let id = this.get("id");
    assert(id != null, "Cannot save Build entity without an ID");
    if (id) {
      assert(
        id.kind == ValueKind.STRING,
        "Cannot save Build entity with non-string ID. " +
          'Considering using .toHex() to convert the "id" to a string.'
      );
      store.set("Build", id.toString(), this);
    }
  }

  static load(id: string): Build | null {
    return changetype<Build | null>(store.get("Build", id));
  }

  get id(): string {
    let value = this.get("id");
    return value!.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get positionId(): string {
    let value = this.get("positionId");
    return value!.toString();
  }

  set positionId(value: string) {
    this.set("positionId", Value.fromString(value));
  }

  get currentOi(): BigInt {
    let value = this.get("currentOi");
    return value!.toBigInt();
  }

  set currentOi(value: BigInt) {
    this.set("currentOi", Value.fromBigInt(value));
  }

  get currentDebt(): BigInt {
    let value = this.get("currentDebt");
    return value!.toBigInt();
  }

  set currentDebt(value: BigInt) {
    this.set("currentDebt", Value.fromBigInt(value));
  }

  get isLong(): boolean {
    let value = this.get("isLong");
    return value!.toBoolean();
  }

  set isLong(value: boolean) {
    this.set("isLong", Value.fromBoolean(value));
  }

  get price(): BigInt {
    let value = this.get("price");
    return value!.toBigInt();
  }

  set price(value: BigInt) {
    this.set("price", Value.fromBigInt(value));
  }

  get leverage(): BigInt {
    let value = this.get("leverage");
    return value!.toBigInt();
  }

  set leverage(value: BigInt) {
    this.set("leverage", Value.fromBigInt(value));
  }

  get cost(): BigInt {
    let value = this.get("cost");
    return value!.toBigInt();
  }

  set cost(value: BigInt) {
    this.set("cost", Value.fromBigInt(value));
  }

  get collateral(): BigInt {
    let value = this.get("collateral");
    return value!.toBigInt();
  }

  set collateral(value: BigInt) {
    this.set("collateral", Value.fromBigInt(value));
  }

  get value(): BigInt {
    let value = this.get("value");
    return value!.toBigInt();
  }

  set value(value: BigInt) {
    this.set("value", Value.fromBigInt(value));
  }

  get timestamp(): BigInt {
    let value = this.get("timestamp");
    return value!.toBigInt();
  }

  set timestamp(value: BigInt) {
    this.set("timestamp", Value.fromBigInt(value));
  }

  get transaction(): string {
    let value = this.get("transaction");
    return value!.toString();
  }

  set transaction(value: string) {
    this.set("transaction", Value.fromString(value));
  }
}
