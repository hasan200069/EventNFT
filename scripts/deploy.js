const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("Deploying EventNFT Platform contracts...");

  // Get the ContractFactory and Signers here.
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Deploy EventTicketNFT contract
  console.log("\n1. Deploying EventTicketNFT...");
  const EventTicketNFT = await ethers.getContractFactory("EventTicketNFT");
  const ticketNFT = await EventTicketNFT.deploy();
  await ticketNFT.deployed();
  console.log("EventTicketNFT deployed to:", ticketNFT.address);

  // Deploy TicketMarketplace contract
  console.log("\n2. Deploying TicketMarketplace...");
  const TicketMarketplace = await ethers.getContractFactory("TicketMarketplace");
  const marketplace = await TicketMarketplace.deploy(ticketNFT.address);
  await marketplace.deployed();
  console.log("TicketMarketplace deployed to:", marketplace.address);

  // Authorize marketplace in NFT contract
  console.log("\n3. Authorizing marketplace in NFT contract...");
  const authorizeTx = await ticketNFT.authorizeMarketplace(marketplace.address);
  await authorizeTx.wait();
  console.log("Marketplace authorized successfully");

  // Save deployment addresses
  const deploymentData = {
    network: network.name,
    chainId: network.config.chainId,
    deployer: deployer.address,
    contracts: {
      EventTicketNFT: {
        address: ticketNFT.address,
        transactionHash: ticketNFT.deployTransaction.hash
      },
      TicketMarketplace: {
        address: marketplace.address,
        transactionHash: marketplace.deployTransaction.hash
      }
    },
    deploymentTime: new Date().toISOString()
  };

  // Write deployment data to file
  const deploymentPath = `deployments/${network.name}.json`;
  if (!fs.existsSync('deployments')) {
    fs.mkdirSync('deployments');
  }
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentData, null, 2));
  console.log(`\nDeployment data saved to ${deploymentPath}`);

  // Generate contract ABIs for frontend
  const artifactsPath = 'frontend/src/contracts';
  if (!fs.existsSync(artifactsPath)) {
    fs.mkdirSync(artifactsPath, { recursive: true });
  }

  // Copy ABIs
  const eventTicketNFTArtifact = JSON.parse(fs.readFileSync('artifacts/contracts/EventTicketNFT.sol/EventTicketNFT.json'));
  const marketplaceArtifact = JSON.parse(fs.readFileSync('artifacts/contracts/TicketMarketplace.sol/TicketMarketplace.json'));

  fs.writeFileSync(
    `${artifactsPath}/EventTicketNFT.json`,
    JSON.stringify({
      address: ticketNFT.address,
      abi: eventTicketNFTArtifact.abi
    }, null, 2)
  );

  fs.writeFileSync(
    `${artifactsPath}/TicketMarketplace.json`,
    JSON.stringify({
      address: marketplace.address,
      abi: marketplaceArtifact.abi
    }, null, 2)
  );

  console.log("Contract ABIs copied to frontend");

  console.log("\n🎉 Deployment completed successfully!");
  console.log("\nContract Addresses:");
  console.log("==================");
  console.log(`EventTicketNFT: ${ticketNFT.address}`);
  console.log(`TicketMarketplace: ${marketplace.address}`);
  console.log("\nNext Steps:");
  console.log("1. Update frontend environment variables");
  console.log("2. Start the frontend application");
  console.log("3. Add admin addresses if needed");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 