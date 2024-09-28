const { ethers } = require('ethers');

// Specify your Ethereum node provider URL, e.g., Infura or Alchemy
const providerUrl = 'http://192.168.2.3:8545';

// Set up a provider
const provider = new ethers.providers.JsonRpcProvider(providerUrl);

// ERC-20 Token Contract Address (replace with the actual contract address)
const tokenAddress = '0x470c8950C0c3aA4B09654bC73b004615119A44b5';

// ERC-20 Token Contract ABI (only the balanceOf function is necessary for this task)
const tokenAbi = [
  'function balanceOf(address owner) view returns (uint256)'
];

// Connect to the token contract
const tokenContract = new ethers.Contract(tokenAddress, tokenAbi, provider);

// Specify the wallet address whose token balance you want to check
const walletAddress = '0x59EC4D4B0Fbe583776e04D1aA95700f2D3D94bA0';

async function getTokenBalance() {
  // Query the balance
  const balance = await tokenContract.balanceOf(walletAddress);

  // ethers.js returns values as BigNumber objects, convert it to a string
  console.log(`Balance: ${ethers.utils.formatUnits(balance, 18)} Tokens`);
}

getTokenBalance();