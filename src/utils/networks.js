/**
 * Network configurations for all supported chains
 */
module.exports = {
  "arbitrum-sepolia": {
    contracts: {
      OverlayV1Factory: {
        address: "0xa2dBe262D27647243Ac3187d05DBF6c3C6ECC14D",
        startBlock: 45021636
      },
      OverlayV1Token: {
        address: "0x3E27fAe625f25291bFda517f74bf41DC40721dA2",
        startBlock: 45021636
      },
      TokenStake: {
        address: "0x0000000000000000000000000000000000000000",
        startBlock: 45021636
      },
      ReferralList: {
        address: "0x1cee53AB89004b2a9E173edc6F51509f8eB32122",
        startBlock: 45021636
      },
      TradingMining: {
        address: "0xFDf98Ac225Aa3B2788dcE96ffe55C2Bb3edCf4c9",
        startBlock: 45021636
      },
      PowerCard: {
        address: "0x07e70171D6a764a9370546Eb39Bc74A0E34424a0",
        startBlock: 232882664
      },
      PlanckCat: {
        address: "0x0000000000000000000000000000000000000000",
        startBlock: 45021636
      },
      Shiva: {
        address: "0x0000000000000000000000000000000000000000",
        startBlock: 45021636
      }
    },
    PERIPHERY_ADDRESS: "0x2878837ea173e8bd40db7cee360b15c1c27deb5a"
  },
  
  "berachain-bepolia": {
    contracts: {
      OverlayV1Factory: {
        address: "0x128AA6673cD244fA3e855f41B1596b3414297CF0",
        startBlock: 909604
      },
      OverlayV1Token: {
        address: "0xd37f15e6f2E5F4A624bbb9864f56bbd2e9b201b5",
        startBlock: 909604
      },
      TokenStake: {
        address: "0x0000000000000000000000000000000000000000",
        startBlock: 909604
      },
      ReferralList: {
        address: "0x0337507Bd36eCC6cAb708d1cBAa199F92F50EA63",
        startBlock: 1125252
      },
      TradingMining: {
        address: "0x0000000000000000000000000000000000000000",
        startBlock: 1125252
      },
      PowerCard: {
        address: "0x0000000000000000000000000000000000000000",
        startBlock: 1125252
      },
      PlanckCat: {
        address: "0x0000000000000000000000000000000000000000",
        startBlock: 1125252
      },
      Shiva: {
        address: "0xFf84cb66F0c302Cd860244868E10D110D8dc505D",
        startBlock: 909604
      }
    },
    PERIPHERY_ADDRESS: "0x4f69dfb24958fcf69b70bca73c3e74f2c82bb405"
  }
};