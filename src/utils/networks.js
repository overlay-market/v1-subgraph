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
  },

  "berachain-mainnet": {
    contracts: {
      OverlayV1Factory: {
        address: "0xc5f85207a16fb6634ead4f17ad5222f122e8f0de",
        startBlock: 1047495
      },
      OverlayV1Token: {
        address: "0xaeD2f0c7AaCfE2B59Cc70964833EA4C28C2CdbDB",
        startBlock: 1047495
      },
      TokenStake: {
        address: "0x0000000000000000000000000000000000000000",
        startBlock: 1047495
      },
      ReferralList: {
        address: "0x0000000000000000000000000000000000000000",
        startBlock: 1047495
      },
      TradingMining: {
        address: "0x0000000000000000000000000000000000000000",
        startBlock: 1047495
      },
      PowerCard: {
        address: "0x0000000000000000000000000000000000000000",
        startBlock: 1047495
      },
      PlanckCat: {
        address: "0x0000000000000000000000000000000000000000",
        startBlock: 1047495
      },
      Shiva: {
        address: "0x7a555c83F7d2D26362C2b4954Cf01EBf9fA07DA0",
        startBlock: 1047495
      }
    },
    PERIPHERY_ADDRESS: "0x2a154eba61a182e726a540ae2856fc012106e763"
  },

  "bsc": {
    contracts: {
      OverlayV1Factory: {
        address: "0xC35093f76fF3D31Af27A893CDcec585F1899eE54",
        startBlock: 55756263
      },
      OverlayV1Factory2: {
        address: "0x17D4F2ea0c3227FB6b31ADA99265E41f3369150A",
        startBlock: 66339154
      },
      OverlayV1Token: {
        address: "0x1F34c87ded863Fe3A3Cd76FAc8adA9608137C8c3",
        startBlock: 55756263
      },
      TokenStake: {
        address: "0x0000000000000000000000000000000000000000",
        startBlock: 55756263
      },
      ReferralList: {
        address: "0x1a0ef183d548405705bb9b00e8b4ef3524ae090e",
        startBlock: 60694597
      },
      TradingMining: {
        address: "0x0000000000000000000000000000000000000000",
        startBlock: 55756263
      },
      PowerCard: {
        address: "0x0000000000000000000000000000000000000000",
        startBlock: 55756263
      },
      PlanckCat: {
        address: "0x0000000000000000000000000000000000000000",
        startBlock: 55756263
      },
      Shiva: {
        address: "0xeB497c228F130BD91E7F13f81c312243961d894A",
        startBlock: 56557980
      },
      LBSC: {
        address: "0x7017b3B9014D92812fAee1b628BCc13eBe09B04a",
        startBlock: 73297453
      }
    },
    PERIPHERY_ADDRESSES: ["0x10575a9C8F36F9F42D7DB71Ef179eD9BEf8Df238", "0x9C52f7107efBe6e0010E924a0B53265ba4e8959d"]
  },

  "chapel": {
    contracts: {
      OverlayV1Factory: {
        address: "0x222Ef39b61f868992F77bd68Fc9d7c82683ffA20",
        startBlock: 67907766
      },
      OverlayV1Factory2: {
        address: "0xb5F885b61e2cC1515a66A2E6636FCAA43daBf044",
        startBlock: 68007894
      },
      OverlayV1Token: {
        address: "0x1A0eF183D548405705bb9B00E8b4ef3524AE090E",
        startBlock: 67907766
      },
      TokenStake: {
        address: "0x0000000000000000000000000000000000000000",
        startBlock: 67907766
      },
      ReferralList: {
        address: "0x0000000000000000000000000000000000000000",
        startBlock: 67907766
      },
      TradingMining: {
        address: "0x0000000000000000000000000000000000000000",
        startBlock: 67907766
      },
      PowerCard: {
        address: "0x0000000000000000000000000000000000000000",
        startBlock: 67907766
      },
      PlanckCat: {
        address: "0x0000000000000000000000000000000000000000",
        startBlock: 67907766
      },
      Shiva: {
        address: "0x9fB7D92526Fc13bB3c0603d39E55e5C371c26Ce6",
        startBlock: 68004676
      },
      LBSC: {
        address: "0x7017b3B9014D92812fAee1b628BCc13eBe09B04a",
        startBlock: 73297453
      }
    },
    PERIPHERY_ADDRESSES: ["0x6C57F1d360027c10b3b698b302120DaD31CB34c9", "0x3A6892e5da2f87F3865aA1aEA2fcaCCE27C44ea8"]
  }
};