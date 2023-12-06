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

export class ClaimContractInitialized extends ethereum.Event {
  get params(): ClaimContractInitialized__Params {
    return new ClaimContractInitialized__Params(this);
  }
}

export class ClaimContractInitialized__Params {
  _event: ClaimContractInitialized;

  constructor(event: ClaimContractInitialized) {
    this._event = event;
  }

  get epoch(): BigInt {
    return this._event.parameters[0].value.toBigInt();
  }

  get claimContract(): Address {
    return this._event.parameters[1].value.toAddress();
  }
}

export class OwnershipTransferred extends ethereum.Event {
  get params(): OwnershipTransferred__Params {
    return new OwnershipTransferred__Params(this);
  }
}

export class OwnershipTransferred__Params {
  _event: OwnershipTransferred;

  constructor(event: OwnershipTransferred) {
    this._event = event;
  }

  get previousOwner(): Address {
    return this._event.parameters[0].value.toAddress();
  }

  get newOwner(): Address {
    return this._event.parameters[1].value.toAddress();
  }
}

export class RewardTokensUpdated extends ethereum.Event {
  get params(): RewardTokensUpdated__Params {
    return new RewardTokensUpdated__Params(this);
  }
}

export class RewardTokensUpdated__Params {
  _event: RewardTokensUpdated;

  constructor(event: RewardTokensUpdated) {
    this._event = event;
  }

  get rewardToken2(): Address {
    return this._event.parameters[0].value.toAddress();
  }

  get token1Percentage(): i32 {
    return this._event.parameters[1].value.toI32();
  }
}

export class TradingMining extends ethereum.SmartContract {
  static bind(address: Address): TradingMining {
    return new TradingMining("TradingMining", address);
  }

  claimContractForEpoch(epoch: BigInt): Address {
    let result = super.call(
      "claimContractForEpoch",
      "claimContractForEpoch(uint256):(address)",
      [ethereum.Value.fromUnsignedBigInt(epoch)]
    );

    return result[0].toAddress();
  }

  try_claimContractForEpoch(epoch: BigInt): ethereum.CallResult<Address> {
    let result = super.tryCall(
      "claimContractForEpoch",
      "claimContractForEpoch(uint256):(address)",
      [ethereum.Value.fromUnsignedBigInt(epoch)]
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toAddress());
  }

  epochDuration(): BigInt {
    let result = super.call("epochDuration", "epochDuration():(uint64)", []);

    return result[0].toBigInt();
  }

  try_epochDuration(): ethereum.CallResult<BigInt> {
    let result = super.tryCall("epochDuration", "epochDuration():(uint64)", []);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  getCurrentEpoch(): BigInt {
    let result = super.call(
      "getCurrentEpoch",
      "getCurrentEpoch():(uint256)",
      []
    );

    return result[0].toBigInt();
  }

  try_getCurrentEpoch(): ethereum.CallResult<BigInt> {
    let result = super.tryCall(
      "getCurrentEpoch",
      "getCurrentEpoch():(uint256)",
      []
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  hasClaimed(user: Address, epoch: BigInt): boolean {
    let result = super.call(
      "hasClaimed",
      "hasClaimed(address,uint256):(bool)",
      [
        ethereum.Value.fromAddress(user),
        ethereum.Value.fromUnsignedBigInt(epoch)
      ]
    );

    return result[0].toBoolean();
  }

  try_hasClaimed(user: Address, epoch: BigInt): ethereum.CallResult<boolean> {
    let result = super.tryCall(
      "hasClaimed",
      "hasClaimed(address,uint256):(bool)",
      [
        ethereum.Value.fromAddress(user),
        ethereum.Value.fromUnsignedBigInt(epoch)
      ]
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBoolean());
  }

  maxRewardPerEpochPerAddress(): BigInt {
    let result = super.call(
      "maxRewardPerEpochPerAddress",
      "maxRewardPerEpochPerAddress():(uint256)",
      []
    );

    return result[0].toBigInt();
  }

  try_maxRewardPerEpochPerAddress(): ethereum.CallResult<BigInt> {
    let result = super.tryCall(
      "maxRewardPerEpochPerAddress",
      "maxRewardPerEpochPerAddress():(uint256)",
      []
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  owner(): Address {
    let result = super.call("owner", "owner():(address)", []);

    return result[0].toAddress();
  }

  try_owner(): ethereum.CallResult<Address> {
    let result = super.tryCall("owner", "owner():(address)", []);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toAddress());
  }

  pcdHolderBonusPercentage(): i32 {
    let result = super.call(
      "pcdHolderBonusPercentage",
      "pcdHolderBonusPercentage():(uint8)",
      []
    );

    return result[0].toI32();
  }

  try_pcdHolderBonusPercentage(): ethereum.CallResult<i32> {
    let result = super.tryCall(
      "pcdHolderBonusPercentage",
      "pcdHolderBonusPercentage():(uint8)",
      []
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toI32());
  }

  rewardToken1(): Address {
    let result = super.call("rewardToken1", "rewardToken1():(address)", []);

    return result[0].toAddress();
  }

  try_rewardToken1(): ethereum.CallResult<Address> {
    let result = super.tryCall("rewardToken1", "rewardToken1():(address)", []);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toAddress());
  }

  rewardToken2(): Address {
    let result = super.call("rewardToken2", "rewardToken2():(address)", []);

    return result[0].toAddress();
  }

  try_rewardToken2(): ethereum.CallResult<Address> {
    let result = super.tryCall("rewardToken2", "rewardToken2():(address)", []);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toAddress());
  }

  startTime(): BigInt {
    let result = super.call("startTime", "startTime():(uint64)", []);

    return result[0].toBigInt();
  }

  try_startTime(): ethereum.CallResult<BigInt> {
    let result = super.tryCall("startTime", "startTime():(uint64)", []);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  token1Percentage(): i32 {
    let result = super.call(
      "token1Percentage",
      "token1Percentage():(uint8)",
      []
    );

    return result[0].toI32();
  }

  try_token1Percentage(): ethereum.CallResult<i32> {
    let result = super.tryCall(
      "token1Percentage",
      "token1Percentage():(uint8)",
      []
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toI32());
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

  get _startTime(): BigInt {
    return this._call.inputValues[0].value.toBigInt();
  }

  get _epochDuration(): BigInt {
    return this._call.inputValues[1].value.toBigInt();
  }

  get _rewardToken1(): Address {
    return this._call.inputValues[2].value.toAddress();
  }

  get _rewardToken2(): Address {
    return this._call.inputValues[3].value.toAddress();
  }

  get _token1Percentage(): i32 {
    return this._call.inputValues[4].value.toI32();
  }

  get _pcdHolderBonusPercentage(): i32 {
    return this._call.inputValues[5].value.toI32();
  }

  get _maxRewardPerEpochPerAddress(): BigInt {
    return this._call.inputValues[6].value.toBigInt();
  }
}

export class ConstructorCall__Outputs {
  _call: ConstructorCall;

  constructor(call: ConstructorCall) {
    this._call = call;
  }
}

export class ClaimCall extends ethereum.Call {
  get inputs(): ClaimCall__Inputs {
    return new ClaimCall__Inputs(this);
  }

  get outputs(): ClaimCall__Outputs {
    return new ClaimCall__Outputs(this);
  }
}

export class ClaimCall__Inputs {
  _call: ClaimCall;

  constructor(call: ClaimCall) {
    this._call = call;
  }

  get epoch(): BigInt {
    return this._call.inputValues[0].value.toBigInt();
  }

  get to(): Address {
    return this._call.inputValues[1].value.toAddress();
  }

  get amount(): BigInt {
    return this._call.inputValues[2].value.toBigInt();
  }

  get proof(): Array<Bytes> {
    return this._call.inputValues[3].value.toBytesArray();
  }
}

export class ClaimCall__Outputs {
  _call: ClaimCall;

  constructor(call: ClaimCall) {
    this._call = call;
  }
}

export class InitClaimContractCall extends ethereum.Call {
  get inputs(): InitClaimContractCall__Inputs {
    return new InitClaimContractCall__Inputs(this);
  }

  get outputs(): InitClaimContractCall__Outputs {
    return new InitClaimContractCall__Outputs(this);
  }
}

export class InitClaimContractCall__Inputs {
  _call: InitClaimContractCall;

  constructor(call: InitClaimContractCall) {
    this._call = call;
  }

  get epoch(): BigInt {
    return this._call.inputValues[0].value.toBigInt();
  }

  get merkleRoot(): Bytes {
    return this._call.inputValues[1].value.toBytes();
  }

  get totalRewards(): BigInt {
    return this._call.inputValues[2].value.toBigInt();
  }
}

export class InitClaimContractCall__Outputs {
  _call: InitClaimContractCall;

  constructor(call: InitClaimContractCall) {
    this._call = call;
  }
}

export class RenounceOwnershipCall extends ethereum.Call {
  get inputs(): RenounceOwnershipCall__Inputs {
    return new RenounceOwnershipCall__Inputs(this);
  }

  get outputs(): RenounceOwnershipCall__Outputs {
    return new RenounceOwnershipCall__Outputs(this);
  }
}

export class RenounceOwnershipCall__Inputs {
  _call: RenounceOwnershipCall;

  constructor(call: RenounceOwnershipCall) {
    this._call = call;
  }
}

export class RenounceOwnershipCall__Outputs {
  _call: RenounceOwnershipCall;

  constructor(call: RenounceOwnershipCall) {
    this._call = call;
  }
}

export class SetRewardToken2Call extends ethereum.Call {
  get inputs(): SetRewardToken2Call__Inputs {
    return new SetRewardToken2Call__Inputs(this);
  }

  get outputs(): SetRewardToken2Call__Outputs {
    return new SetRewardToken2Call__Outputs(this);
  }
}

export class SetRewardToken2Call__Inputs {
  _call: SetRewardToken2Call;

  constructor(call: SetRewardToken2Call) {
    this._call = call;
  }

  get _rewardToken2(): Address {
    return this._call.inputValues[0].value.toAddress();
  }

  get _token1Percentage(): i32 {
    return this._call.inputValues[1].value.toI32();
  }
}

export class SetRewardToken2Call__Outputs {
  _call: SetRewardToken2Call;

  constructor(call: SetRewardToken2Call) {
    this._call = call;
  }
}

export class TransferOwnershipCall extends ethereum.Call {
  get inputs(): TransferOwnershipCall__Inputs {
    return new TransferOwnershipCall__Inputs(this);
  }

  get outputs(): TransferOwnershipCall__Outputs {
    return new TransferOwnershipCall__Outputs(this);
  }
}

export class TransferOwnershipCall__Inputs {
  _call: TransferOwnershipCall;

  constructor(call: TransferOwnershipCall) {
    this._call = call;
  }

  get newOwner(): Address {
    return this._call.inputValues[0].value.toAddress();
  }
}

export class TransferOwnershipCall__Outputs {
  _call: TransferOwnershipCall;

  constructor(call: TransferOwnershipCall) {
    this._call = call;
  }
}
