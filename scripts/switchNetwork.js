/**
 * Update subgraph.yaml for the specified network
 * Usage: node update-subgraph.js <network>
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
  
  // Update network, addresses and start blocks for all data sources
  subgraph.dataSources.forEach(dataSource => {
    // Update network name
    dataSource.network = networkName;
    
    // Update address and startBlock if this contract exists in our config
    if (networkConfig.contracts[dataSource.name]) {
      const contract = networkConfig.contracts[dataSource.name];
      dataSource.source.address = contract.address;
      dataSource.source.startBlock = contract.startBlock;
    }
  });
  
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
  const configTs = `// Auto-generated config for network: ${networkName}
// Generated on: ${new Date().toISOString()}
// To change, add, or remove constants, look at scripts/switchNetwork.js

export const FACTORY_ADDRESS = '${networkConfig.contracts.OverlayV1Factory.address}'
export const PERIPHERY_ADDRESS = '${networkConfig.PERIPHERY_ADDRESS}'
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