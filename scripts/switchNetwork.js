/**
 * Update subgraph.yaml for the specified network
 * Usage: node scripts/switchNetwork.js <network>
 */

const fs = require('fs');
const yaml = require('yaml');
const path = require('path');

const networks = require('../src/utils/networks');

// Get network from command line
const networkName = process.argv[2];
if (!networkName) {
  console.error('Please specify a network. Usage: node update-subgraph.js <network>');
  process.exit(1);
}

// Check if network exists in configuration
if (!networks[networkName]) {
  console.error(`Network "${networkName}" not found in networks.js.`);
  console.error(`Available networks: ${Object.keys(networks).join(', ')}`);
  process.exit(1);
}

const networkConfig = networks[networkName];
console.log(`Updating configuration for network: ${networkName}`);

// Update subgraph.yaml
try {
  const subgraphPath = path.join(__dirname, '..', 'subgraph.yaml');
  const subgraphFile = fs.readFileSync(subgraphPath, 'utf8');
  const subgraph = yaml.parse(subgraphFile);

  // Find all factory contracts in the network config
  const factoryContracts = Object.keys(networkConfig.contracts)
    .filter(key => key.startsWith('OverlayV1Factory'))
    .sort();

  // Find existing factory dataSources in subgraph
  const factoryDataSources = subgraph.dataSources.filter(ds =>
    ds.name && ds.name.startsWith('OverlayV1Factory')
  );
  const nonFactoryDataSources = subgraph.dataSources.filter(ds =>
    !ds.name || !ds.name.startsWith('OverlayV1Factory')
  );

  // Update or create factory dataSources to match network config
  const updatedFactoryDataSources = [];
  factoryContracts.forEach((contractKey, index) => {
    const contract = networkConfig.contracts[contractKey];
    let factoryDS = factoryDataSources.find(ds => ds.name === contractKey);

    if (!factoryDS && factoryDataSources.length > 0) {
      // Clone the first factory dataSource as a template
      factoryDS = JSON.parse(JSON.stringify(factoryDataSources[0]));
      factoryDS.name = contractKey;
    }

    if (factoryDS) {
      factoryDS.network = networkName;
      factoryDS.source.address = contract.address;
      factoryDS.source.startBlock = contract.startBlock;
      updatedFactoryDataSources.push(factoryDS);
    }
  });

  // Update non-factory dataSources
  nonFactoryDataSources.forEach(dataSource => {
    dataSource.network = networkName;

    if (networkConfig.contracts[dataSource.name]) {
      const contract = networkConfig.contracts[dataSource.name];
      dataSource.source.address = contract.address;
      dataSource.source.startBlock = contract.startBlock;
    }
  });

  // Rebuild dataSources array: factories first, then others
  subgraph.dataSources = [...updatedFactoryDataSources, ...nonFactoryDataSources];

  // Update network for templates
  if (subgraph.templates) {
    subgraph.templates.forEach(template => {
      template.network = networkName;
    });
  }

  fs.writeFileSync(subgraphPath, yaml.stringify(subgraph));
  console.log('✅ Updated subgraph.yaml successfully');
} catch (error) {
  console.error('Error updating subgraph.yaml:', error);
  process.exit(1);
}

// Generate the config.ts file with network-specific constants
try {
  // Collect all factory addresses (OverlayV1Factory, OverlayV1Factory2, etc.)
  const factoryAddresses = [];
  const factoryContracts = Object.keys(networkConfig.contracts)
    .filter(key => key.startsWith('OverlayV1Factory'))
    .sort(); // Sort to ensure consistent ordering (Factory, Factory2, ...)

  factoryContracts.forEach(key => {
    factoryAddresses.push(networkConfig.contracts[key].address);
  });

  // Get periphery addresses (array or single address)
  let peripheryAddresses;
  if (networkConfig.PERIPHERY_ADDRESSES) {
    peripheryAddresses = networkConfig.PERIPHERY_ADDRESSES;
  } else {
    // Backward compatibility: if only PERIPHERY_ADDRESS exists, use it for all factories
    peripheryAddresses = factoryAddresses.map(() => networkConfig.PERIPHERY_ADDRESS);
  }

  const configTs = `// Auto-generated config for network: ${networkName}
// Generated on: ${new Date().toISOString()}
// To change, add, or remove constants, look at scripts/switchNetwork.js

export const FACTORY_ADDRESSES: Array<string> = [${factoryAddresses.map(addr => `'${addr}'`).join(', ')}]
export const PERIPHERY_ADDRESSES: Array<string> = [${peripheryAddresses.map(addr => `'${addr}'`).join(', ')}]
export const FACTORY_ADDRESS = FACTORY_ADDRESSES[0]

export function getPeripheryAddressForFactory(factoryAddress: string): string {
    let lookup = factoryAddress.toLowerCase()
    for (let i = 0; i < FACTORY_ADDRESSES.length; i++) {
        if (FACTORY_ADDRESSES[i].toLowerCase() == lookup) {
            return PERIPHERY_ADDRESSES[i]
        }
    }
    return PERIPHERY_ADDRESSES[0]
}
export const OVL_ADDRESS = '${networkConfig.contracts.OverlayV1Token.address}'
export const REFERRAL_ADDRESS = '${networkConfig.contracts.ReferralList.address}'
export const TRADING_MINING_ADDRESS = '${networkConfig.contracts.TradingMining.address}'
export const SHIVA_ADDRESS = '${networkConfig.contracts.Shiva.address}'
`;

  // Ensure directory exists
  const configDir = path.join(__dirname, '..', 'src', 'utils');
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  const configPath = path.join(__dirname, '..', 'src', 'utils', 'config.ts');
  fs.writeFileSync(configPath, configTs);
  console.log('✅ Generated src/utils/config.ts');
} catch (error) {
  console.error('Error generating config.ts:', error);
  process.exit(1);
}

console.log(`\n🚀 Successfully configured for network: ${networkName}`);