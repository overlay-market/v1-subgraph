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

export class AddAffiliate extends ethereum.Event {
  get params(): AddAffiliate__Params {
    return new AddAffiliate__Params(this);
  }
}

export class AddAffiliate__Params {
  _event: AddAffiliate;

  constructor(event: AddAffiliate) {
    this._event = event;
  }

  get trader(): Address {
    return this._event.parameters[0].value.toAddress();
  }

  get affiliate(): Address {
    return this._event.parameters[1].value.toAddress();
  }
}

export class Airdrop extends ethereum.Event {
  get params(): Airdrop__Params {
    return new Airdrop__Params(this);
  }
}

export class Airdrop__Params {
  _event: Airdrop;

  constructor(event: Airdrop) {
    this._event = event;
  }
}

export class AllowAffiliates extends ethereum.Event {
  get params(): AllowAffiliates__Params {
    return new AllowAffiliates__Params(this);
  }
}

export class AllowAffiliates__Params {
  _event: AllowAffiliates;

  constructor(event: AllowAffiliates) {
    this._event = event;
  }

  get affiliates(): Array<Address> {
    return this._event.parameters[0].value.toAddressArray();
  }
}

export class Initialized extends ethereum.Event {
  get params(): Initialized__Params {
    return new Initialized__Params(this);
  }
}

export class Initialized__Params {
  _event: Initialized;

  constructor(event: Initialized) {
    this._event = event;
  }

  get version(): BigInt {
    return this._event.parameters[0].value.toBigInt();
  }
}

export class OwnershipHandoverCanceled extends ethereum.Event {
  get params(): OwnershipHandoverCanceled__Params {
    return new OwnershipHandoverCanceled__Params(this);
  }
}

export class OwnershipHandoverCanceled__Params {
  _event: OwnershipHandoverCanceled;

  constructor(event: OwnershipHandoverCanceled) {
    this._event = event;
  }

  get pendingOwner(): Address {
    return this._event.parameters[0].value.toAddress();
  }
}

export class OwnershipHandoverRequested extends ethereum.Event {
  get params(): OwnershipHandoverRequested__Params {
    return new OwnershipHandoverRequested__Params(this);
  }
}

export class OwnershipHandoverRequested__Params {
  _event: OwnershipHandoverRequested;

  constructor(event: OwnershipHandoverRequested) {
    this._event = event;
  }

  get pendingOwner(): Address {
    return this._event.parameters[0].value.toAddress();
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

  get oldOwner(): Address {
    return this._event.parameters[0].value.toAddress();
  }

  get newOwner(): Address {
    return this._event.parameters[1].value.toAddress();
  }
}

export class RolesUpdated extends ethereum.Event {
  get params(): RolesUpdated__Params {
    return new RolesUpdated__Params(this);
  }
}

export class RolesUpdated__Params {
  _event: RolesUpdated;

  constructor(event: RolesUpdated) {
    this._event = event;
  }

  get user(): Address {
    return this._event.parameters[0].value.toAddress();
  }

  get roles(): BigInt {
    return this._event.parameters[1].value.toBigInt();
  }
}

export class Upgraded extends ethereum.Event {
  get params(): Upgraded__Params {
    return new Upgraded__Params(this);
  }
}

export class Upgraded__Params {
  _event: Upgraded;

  constructor(event: Upgraded) {
    this._event = event;
  }

  get implementation(): Address {
    return this._event.parameters[0].value.toAddress();
  }
}

export class ReferralList extends ethereum.SmartContract {
  static bind(address: Address): ReferralList {
    return new ReferralList("ReferralList", address);
  }

  ROLE_AIRDROPPER(): BigInt {
    let result = super.call(
      "ROLE_AIRDROPPER",
      "ROLE_AIRDROPPER():(uint256)",
      []
    );

    return result[0].toBigInt();
  }

  try_ROLE_AIRDROPPER(): ethereum.CallResult<BigInt> {
    let result = super.tryCall(
      "ROLE_AIRDROPPER",
      "ROLE_AIRDROPPER():(uint256)",
      []
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  UPGRADE_INTERFACE_VERSION(): string {
    let result = super.call(
      "UPGRADE_INTERFACE_VERSION",
      "UPGRADE_INTERFACE_VERSION():(string)",
      []
    );

    return result[0].toString();
  }

  try_UPGRADE_INTERFACE_VERSION(): ethereum.CallResult<string> {
    let result = super.tryCall(
      "UPGRADE_INTERFACE_VERSION",
      "UPGRADE_INTERFACE_VERSION():(string)",
      []
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toString());
  }

  affiliateComission(): BigInt {
    let result = super.call(
      "affiliateComission",
      "affiliateComission():(uint48)",
      []
    );

    return result[0].toBigInt();
  }

  try_affiliateComission(): ethereum.CallResult<BigInt> {
    let result = super.tryCall(
      "affiliateComission",
      "affiliateComission():(uint48)",
      []
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  allowedAffiliates(affiliate: Address): boolean {
    let result = super.call(
      "allowedAffiliates",
      "allowedAffiliates(address):(bool)",
      [ethereum.Value.fromAddress(affiliate)]
    );

    return result[0].toBoolean();
  }

  try_allowedAffiliates(affiliate: Address): ethereum.CallResult<boolean> {
    let result = super.tryCall(
      "allowedAffiliates",
      "allowedAffiliates(address):(bool)",
      [ethereum.Value.fromAddress(affiliate)]
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBoolean());
  }

  hasAllRoles(user: Address, roles: BigInt): boolean {
    let result = super.call(
      "hasAllRoles",
      "hasAllRoles(address,uint256):(bool)",
      [
        ethereum.Value.fromAddress(user),
        ethereum.Value.fromUnsignedBigInt(roles)
      ]
    );

    return result[0].toBoolean();
  }

  try_hasAllRoles(user: Address, roles: BigInt): ethereum.CallResult<boolean> {
    let result = super.tryCall(
      "hasAllRoles",
      "hasAllRoles(address,uint256):(bool)",
      [
        ethereum.Value.fromAddress(user),
        ethereum.Value.fromUnsignedBigInt(roles)
      ]
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBoolean());
  }

  hasAnyRole(user: Address, roles: BigInt): boolean {
    let result = super.call(
      "hasAnyRole",
      "hasAnyRole(address,uint256):(bool)",
      [
        ethereum.Value.fromAddress(user),
        ethereum.Value.fromUnsignedBigInt(roles)
      ]
    );

    return result[0].toBoolean();
  }

  try_hasAnyRole(user: Address, roles: BigInt): ethereum.CallResult<boolean> {
    let result = super.tryCall(
      "hasAnyRole",
      "hasAnyRole(address,uint256):(bool)",
      [
        ethereum.Value.fromAddress(user),
        ethereum.Value.fromUnsignedBigInt(roles)
      ]
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBoolean());
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

  ownershipHandoverExpiresAt(pendingOwner: Address): BigInt {
    let result = super.call(
      "ownershipHandoverExpiresAt",
      "ownershipHandoverExpiresAt(address):(uint256)",
      [ethereum.Value.fromAddress(pendingOwner)]
    );

    return result[0].toBigInt();
  }

  try_ownershipHandoverExpiresAt(
    pendingOwner: Address
  ): ethereum.CallResult<BigInt> {
    let result = super.tryCall(
      "ownershipHandoverExpiresAt",
      "ownershipHandoverExpiresAt(address):(uint256)",
      [ethereum.Value.fromAddress(pendingOwner)]
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  proxiableUUID(): Bytes {
    let result = super.call("proxiableUUID", "proxiableUUID():(bytes32)", []);

    return result[0].toBytes();
  }

  try_proxiableUUID(): ethereum.CallResult<Bytes> {
    let result = super.tryCall(
      "proxiableUUID",
      "proxiableUUID():(bytes32)",
      []
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBytes());
  }

  referrals(trader: Address): Address {
    let result = super.call("referrals", "referrals(address):(address)", [
      ethereum.Value.fromAddress(trader)
    ]);

    return result[0].toAddress();
  }

  try_referrals(trader: Address): ethereum.CallResult<Address> {
    let result = super.tryCall("referrals", "referrals(address):(address)", [
      ethereum.Value.fromAddress(trader)
    ]);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toAddress());
  }

  rewardToken(): Address {
    let result = super.call("rewardToken", "rewardToken():(address)", []);

    return result[0].toAddress();
  }

  try_rewardToken(): ethereum.CallResult<Address> {
    let result = super.tryCall("rewardToken", "rewardToken():(address)", []);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toAddress());
  }

  rolesOf(user: Address): BigInt {
    let result = super.call("rolesOf", "rolesOf(address):(uint256)", [
      ethereum.Value.fromAddress(user)
    ]);

    return result[0].toBigInt();
  }

  try_rolesOf(user: Address): ethereum.CallResult<BigInt> {
    let result = super.tryCall("rolesOf", "rolesOf(address):(uint256)", [
      ethereum.Value.fromAddress(user)
    ]);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  traderDiscount(): BigInt {
    let result = super.call("traderDiscount", "traderDiscount():(uint48)", []);

    return result[0].toBigInt();
  }

  try_traderDiscount(): ethereum.CallResult<BigInt> {
    let result = super.tryCall(
      "traderDiscount",
      "traderDiscount():(uint48)",
      []
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
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
}

export class ConstructorCall__Outputs {
  _call: ConstructorCall;

  constructor(call: ConstructorCall) {
    this._call = call;
  }
}

export class AddAffiliateCall extends ethereum.Call {
  get inputs(): AddAffiliateCall__Inputs {
    return new AddAffiliateCall__Inputs(this);
  }

  get outputs(): AddAffiliateCall__Outputs {
    return new AddAffiliateCall__Outputs(this);
  }
}

export class AddAffiliateCall__Inputs {
  _call: AddAffiliateCall;

  constructor(call: AddAffiliateCall) {
    this._call = call;
  }

  get _affiliate(): Address {
    return this._call.inputValues[0].value.toAddress();
  }
}

export class AddAffiliateCall__Outputs {
  _call: AddAffiliateCall;

  constructor(call: AddAffiliateCall) {
    this._call = call;
  }
}

export class AirdropERC20Call extends ethereum.Call {
  get inputs(): AirdropERC20Call__Inputs {
    return new AirdropERC20Call__Inputs(this);
  }

  get outputs(): AirdropERC20Call__Outputs {
    return new AirdropERC20Call__Outputs(this);
  }
}

export class AirdropERC20Call__Inputs {
  _call: AirdropERC20Call;

  constructor(call: AirdropERC20Call) {
    this._call = call;
  }

  get _addresses(): Array<Address> {
    return this._call.inputValues[0].value.toAddressArray();
  }

  get _amounts(): Array<BigInt> {
    return this._call.inputValues[1].value.toBigIntArray();
  }

  get _totalAmount(): BigInt {
    return this._call.inputValues[2].value.toBigInt();
  }
}

export class AirdropERC20Call__Outputs {
  _call: AirdropERC20Call;

  constructor(call: AirdropERC20Call) {
    this._call = call;
  }
}

export class AllowAffiliatesCall extends ethereum.Call {
  get inputs(): AllowAffiliatesCall__Inputs {
    return new AllowAffiliatesCall__Inputs(this);
  }

  get outputs(): AllowAffiliatesCall__Outputs {
    return new AllowAffiliatesCall__Outputs(this);
  }
}

export class AllowAffiliatesCall__Inputs {
  _call: AllowAffiliatesCall;

  constructor(call: AllowAffiliatesCall) {
    this._call = call;
  }

  get _affiliates(): Array<Address> {
    return this._call.inputValues[0].value.toAddressArray();
  }
}

export class AllowAffiliatesCall__Outputs {
  _call: AllowAffiliatesCall;

  constructor(call: AllowAffiliatesCall) {
    this._call = call;
  }
}

export class CancelOwnershipHandoverCall extends ethereum.Call {
  get inputs(): CancelOwnershipHandoverCall__Inputs {
    return new CancelOwnershipHandoverCall__Inputs(this);
  }

  get outputs(): CancelOwnershipHandoverCall__Outputs {
    return new CancelOwnershipHandoverCall__Outputs(this);
  }
}

export class CancelOwnershipHandoverCall__Inputs {
  _call: CancelOwnershipHandoverCall;

  constructor(call: CancelOwnershipHandoverCall) {
    this._call = call;
  }
}

export class CancelOwnershipHandoverCall__Outputs {
  _call: CancelOwnershipHandoverCall;

  constructor(call: CancelOwnershipHandoverCall) {
    this._call = call;
  }
}

export class CompleteOwnershipHandoverCall extends ethereum.Call {
  get inputs(): CompleteOwnershipHandoverCall__Inputs {
    return new CompleteOwnershipHandoverCall__Inputs(this);
  }

  get outputs(): CompleteOwnershipHandoverCall__Outputs {
    return new CompleteOwnershipHandoverCall__Outputs(this);
  }
}

export class CompleteOwnershipHandoverCall__Inputs {
  _call: CompleteOwnershipHandoverCall;

  constructor(call: CompleteOwnershipHandoverCall) {
    this._call = call;
  }

  get pendingOwner(): Address {
    return this._call.inputValues[0].value.toAddress();
  }
}

export class CompleteOwnershipHandoverCall__Outputs {
  _call: CompleteOwnershipHandoverCall;

  constructor(call: CompleteOwnershipHandoverCall) {
    this._call = call;
  }
}

export class GrantRolesCall extends ethereum.Call {
  get inputs(): GrantRolesCall__Inputs {
    return new GrantRolesCall__Inputs(this);
  }

  get outputs(): GrantRolesCall__Outputs {
    return new GrantRolesCall__Outputs(this);
  }
}

export class GrantRolesCall__Inputs {
  _call: GrantRolesCall;

  constructor(call: GrantRolesCall) {
    this._call = call;
  }

  get user(): Address {
    return this._call.inputValues[0].value.toAddress();
  }

  get roles(): BigInt {
    return this._call.inputValues[1].value.toBigInt();
  }
}

export class GrantRolesCall__Outputs {
  _call: GrantRolesCall;

  constructor(call: GrantRolesCall) {
    this._call = call;
  }
}

export class InitializeCall extends ethereum.Call {
  get inputs(): InitializeCall__Inputs {
    return new InitializeCall__Inputs(this);
  }

  get outputs(): InitializeCall__Outputs {
    return new InitializeCall__Outputs(this);
  }
}

export class InitializeCall__Inputs {
  _call: InitializeCall;

  constructor(call: InitializeCall) {
    this._call = call;
  }

  get _airdropper(): Address {
    return this._call.inputValues[0].value.toAddress();
  }

  get _rewardToken(): Address {
    return this._call.inputValues[1].value.toAddress();
  }
}

export class InitializeCall__Outputs {
  _call: InitializeCall;

  constructor(call: InitializeCall) {
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

export class RenounceRolesCall extends ethereum.Call {
  get inputs(): RenounceRolesCall__Inputs {
    return new RenounceRolesCall__Inputs(this);
  }

  get outputs(): RenounceRolesCall__Outputs {
    return new RenounceRolesCall__Outputs(this);
  }
}

export class RenounceRolesCall__Inputs {
  _call: RenounceRolesCall;

  constructor(call: RenounceRolesCall) {
    this._call = call;
  }

  get roles(): BigInt {
    return this._call.inputValues[0].value.toBigInt();
  }
}

export class RenounceRolesCall__Outputs {
  _call: RenounceRolesCall;

  constructor(call: RenounceRolesCall) {
    this._call = call;
  }
}

export class RequestOwnershipHandoverCall extends ethereum.Call {
  get inputs(): RequestOwnershipHandoverCall__Inputs {
    return new RequestOwnershipHandoverCall__Inputs(this);
  }

  get outputs(): RequestOwnershipHandoverCall__Outputs {
    return new RequestOwnershipHandoverCall__Outputs(this);
  }
}

export class RequestOwnershipHandoverCall__Inputs {
  _call: RequestOwnershipHandoverCall;

  constructor(call: RequestOwnershipHandoverCall) {
    this._call = call;
  }
}

export class RequestOwnershipHandoverCall__Outputs {
  _call: RequestOwnershipHandoverCall;

  constructor(call: RequestOwnershipHandoverCall) {
    this._call = call;
  }
}

export class RevokeRolesCall extends ethereum.Call {
  get inputs(): RevokeRolesCall__Inputs {
    return new RevokeRolesCall__Inputs(this);
  }

  get outputs(): RevokeRolesCall__Outputs {
    return new RevokeRolesCall__Outputs(this);
  }
}

export class RevokeRolesCall__Inputs {
  _call: RevokeRolesCall;

  constructor(call: RevokeRolesCall) {
    this._call = call;
  }

  get user(): Address {
    return this._call.inputValues[0].value.toAddress();
  }

  get roles(): BigInt {
    return this._call.inputValues[1].value.toBigInt();
  }
}

export class RevokeRolesCall__Outputs {
  _call: RevokeRolesCall;

  constructor(call: RevokeRolesCall) {
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

export class UpgradeToAndCallCall extends ethereum.Call {
  get inputs(): UpgradeToAndCallCall__Inputs {
    return new UpgradeToAndCallCall__Inputs(this);
  }

  get outputs(): UpgradeToAndCallCall__Outputs {
    return new UpgradeToAndCallCall__Outputs(this);
  }
}

export class UpgradeToAndCallCall__Inputs {
  _call: UpgradeToAndCallCall;

  constructor(call: UpgradeToAndCallCall) {
    this._call = call;
  }

  get newImplementation(): Address {
    return this._call.inputValues[0].value.toAddress();
  }

  get data(): Bytes {
    return this._call.inputValues[1].value.toBytes();
  }
}

export class UpgradeToAndCallCall__Outputs {
  _call: UpgradeToAndCallCall;

  constructor(call: UpgradeToAndCallCall) {
    this._call = call;
  }
}
