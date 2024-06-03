// THIS IS AN AUTOGENERATED FILE. DO NOT EDIT THIS FILE DIRECTLY.

import {
  ethereum,
  JSONValue,
  TypedMap,
  Entity,
  Bytes,
  Address,
  BigInt,
} from "@graphprotocol/graph-ts";

export class HeartbeatSet extends ethereum.Event {
  get params(): HeartbeatSet__Params {
    return new HeartbeatSet__Params(this);
  }
}

export class HeartbeatSet__Params {
  _event: HeartbeatSet;

  constructor(event: HeartbeatSet) {
    this._event = event;
  }

  get heartbeat(): BigInt {
    return this._event.parameters[0].value.toBigInt();
  }
}

export class OverlayV1ChainlinkFeed__latestResultValue0Struct extends ethereum.Tuple {
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

export class OverlayV1ChainlinkFeed extends ethereum.SmartContract {
  static bind(address: Address): OverlayV1ChainlinkFeed {
    return new OverlayV1ChainlinkFeed("OverlayV1ChainlinkFeed", address);
  }

  aggregator(): Address {
    let result = super.call("aggregator", "aggregator():(address)", []);

    return result[0].toAddress();
  }

  try_aggregator(): ethereum.CallResult<Address> {
    let result = super.tryCall("aggregator", "aggregator():(address)", []);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toAddress());
  }

  decimals(): i32 {
    let result = super.call("decimals", "decimals():(uint8)", []);

    return result[0].toI32();
  }

  try_decimals(): ethereum.CallResult<i32> {
    let result = super.tryCall("decimals", "decimals():(uint8)", []);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toI32());
  }

  description(): string {
    let result = super.call("description", "description():(string)", []);

    return result[0].toString();
  }

  try_description(): ethereum.CallResult<string> {
    let result = super.tryCall("description", "description():(string)", []);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toString());
  }

  feedFactory(): Address {
    let result = super.call("feedFactory", "feedFactory():(address)", []);

    return result[0].toAddress();
  }

  try_feedFactory(): ethereum.CallResult<Address> {
    let result = super.tryCall("feedFactory", "feedFactory():(address)", []);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toAddress());
  }

  heartbeat(): BigInt {
    let result = super.call("heartbeat", "heartbeat():(uint256)", []);

    return result[0].toBigInt();
  }

  try_heartbeat(): ethereum.CallResult<BigInt> {
    let result = super.tryCall("heartbeat", "heartbeat():(uint256)", []);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  latest(): OverlayV1ChainlinkFeed__latestResultValue0Struct {
    let result = super.call(
      "latest",
      "latest():((uint256,uint256,uint256,uint256,uint256,uint256,uint256,bool))",
      [],
    );

    return changetype<OverlayV1ChainlinkFeed__latestResultValue0Struct>(
      result[0].toTuple(),
    );
  }

  try_latest(): ethereum.CallResult<OverlayV1ChainlinkFeed__latestResultValue0Struct> {
    let result = super.tryCall(
      "latest",
      "latest():((uint256,uint256,uint256,uint256,uint256,uint256,uint256,bool))",
      [],
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(
      changetype<OverlayV1ChainlinkFeed__latestResultValue0Struct>(
        value[0].toTuple(),
      ),
    );
  }

  macroWindow(): BigInt {
    let result = super.call("macroWindow", "macroWindow():(uint256)", []);

    return result[0].toBigInt();
  }

  try_macroWindow(): ethereum.CallResult<BigInt> {
    let result = super.tryCall("macroWindow", "macroWindow():(uint256)", []);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  microWindow(): BigInt {
    let result = super.call("microWindow", "microWindow():(uint256)", []);

    return result[0].toBigInt();
  }

  try_microWindow(): ethereum.CallResult<BigInt> {
    let result = super.tryCall("microWindow", "microWindow():(uint256)", []);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  ov(): Address {
    let result = super.call("ov", "ov():(address)", []);

    return result[0].toAddress();
  }

  try_ov(): ethereum.CallResult<Address> {
    let result = super.tryCall("ov", "ov():(address)", []);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toAddress());
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

  get _ov(): Address {
    return this._call.inputValues[0].value.toAddress();
  }

  get _aggregator(): Address {
    return this._call.inputValues[1].value.toAddress();
  }

  get _microWindow(): BigInt {
    return this._call.inputValues[2].value.toBigInt();
  }

  get _macroWindow(): BigInt {
    return this._call.inputValues[3].value.toBigInt();
  }

  get _heartbeat(): BigInt {
    return this._call.inputValues[4].value.toBigInt();
  }
}

export class ConstructorCall__Outputs {
  _call: ConstructorCall;

  constructor(call: ConstructorCall) {
    this._call = call;
  }
}

export class SetHeartbeatCall extends ethereum.Call {
  get inputs(): SetHeartbeatCall__Inputs {
    return new SetHeartbeatCall__Inputs(this);
  }

  get outputs(): SetHeartbeatCall__Outputs {
    return new SetHeartbeatCall__Outputs(this);
  }
}

export class SetHeartbeatCall__Inputs {
  _call: SetHeartbeatCall;

  constructor(call: SetHeartbeatCall) {
    this._call = call;
  }

  get _heartbeat(): BigInt {
    return this._call.inputValues[0].value.toBigInt();
  }
}

export class SetHeartbeatCall__Outputs {
  _call: SetHeartbeatCall;

  constructor(call: SetHeartbeatCall) {
    this._call = call;
  }
}
