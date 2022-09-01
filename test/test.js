const { expect } = require("chai");
const { ethers } = require("hardhat");
const { utils } = ethers;
const { BigNumber } = ethers;
const tokensABI = require('../abi/tokens.json');
let controller = null;
let tokensAddress = null;
let tokens = null;
let accounts = null;
let provider = null;

beforeEach(async function () {
  accounts = await ethers.getSigners();

  // Get all contract instances
  const Controller = await ethers.getContractFactory("Controller");
  const Tokens = await ethers.getContractFactory("Tokens");

  // deploy all contracts
  controller = await Controller.deploy();

  // wait to be published to blockchain
  await controller.deployed();

  // hardhat local blockchain
  provider = await ethers.provider;

  // controller deploys tokens, get tokens contract
  tokensAddress = controller.tokenContract();
  tokens = new ethers.Contract(tokensAddress, tokensABI, accounts[0]);

  // one ether in units hardhat can read
  const oneEtherInHex = utils.hexStripZeros(
    utils.parseEther("1").toHexString()
  );

  // set account[0] to have 1 ether
  await provider.send("hardhat_setBalance", [
    accounts[0].address,
    oneEtherInHex,
  ]);

  // tests will faill if initial account doesn't have 1 ether to start
  const balance = await provider.getBalance(accounts[0].address);
  //expect(balance).to.be.equal(new BigNumber.from(utils.parseEther("1")));
});

describe("tokens initial state", function () {
  it("name, symbol, controller address", async function () {
    // name 
    expect(await tokens.name()).to.be.equal("Forging");
    // symbol
    expect(await tokens.symbol()).to.be.equal("FORGE");
    // controller address
    //expect(await tokens.controller()).to.be.equal(controller.address);
  });
});


describe("Tokens - mint", function () {
  it("non-controller mint revert", async function () {
    await expect(tokens.mint(accounts[0].address, 0, 1)).to.be.reverted;
  });
});

describe("Tokens - mintBatch", function () {
  it("non-controller mintBatch revert", async function () {
    await expect(tokens.mintBatch(accounts[0].address, [0,1,2], [1,1,1])).to.be.reverted;
  });
});

describe("Tokens - burn", function () {
  it("burn token 4 owned by address[0]", async function () {
    // mint token 1
    await controller.initialMint(new BigNumber.from("1"));

    // advance time by 1 day + 1 second
    await provider.send("evm_increaseTime", [24 * 60 * 60 + 1]);

    // mint token 2
    await controller.initialMint(new BigNumber.from("2"));

    // burn token 1 and 2 to mint 4 burnableMint
    await expect(controller.burnableMint(4, [1,2], [1,1])).to.not.be.reverted;
    
    // burn expect to revert
    await expect(tokens.burn(accounts[0].address, 4, 1)).to.be.reverted;
  });
});

describe("Tokens - burnBatch", function () {
  it("non-controller burnBatch revert", async function () {
    // mint token 0
    await controller.initialMint(new BigNumber.from("1"));

    // advance time by 1 day + 1 second
    await provider.send("evm_increaseTime", [24 * 60 * 60 + 1]);

    // mint token 2
    await controller.initialMint(new BigNumber.from("2"));

    await expect(tokens.burnBatch(accounts[0].address, [0,2], [1,1])).to.be.reverted;
  });
});

describe("Controller - mint", function () {
  it("controller - mint initial tokens", async function () {
    // mint token 0
    await controller.initialMint(new BigNumber.from("0"));

    // check if address[0] has balance of 1 for token 0
    expect(await tokens.balanceOf(accounts[0].address, new BigNumber.from("0"))).to.eql(new BigNumber.from("1"));
  });

  it("controller mint revert before coolDown met", async function () {
    // mint token 0 then try to mint another token right after 
    await controller.initialMint(new BigNumber.from("0"));

    await expect(controller.initialMint(new BigNumber.from("0"))).to.be.revertedWith(
      "1 day cool down not satisfied!"
    );    
  });

  it("controller mint revert if not initial mint token", async function () {
    await expect(controller.initialMint(3)).to.be.revertedWith(
      "Initial mint is only for tokenID's 0, 1 or 2!"
    );
  });
});

describe("Controller - initialMint", function () {
  it("controller - mint initial tokens", async function () {
    // mint token 0
    await controller.initialMint(new BigNumber.from("0"));

    // check if address[0] has balance of 1 for token 0
    expect(await tokens.balanceOf(accounts[0].address, new BigNumber.from("0"))).to.eql(new BigNumber.from("1"));
  });

  it("controller mint revert before coolDown met", async function () {
    // mint token 0 then try to mint another token right after 
    await controller.initialMint(new BigNumber.from("0"));

    await expect(controller.initialMint(new BigNumber.from("0"))).to.be.revertedWith(
      "1 day cool down not satisfied!"
    );    
  });

  it("controller mint revert if not initial mint token", async function () {
    await expect(controller.initialMint(3)).to.be.revertedWith(
      "Initial mint is only for tokenID's 0, 1 or 2!"
    );
  });
});

describe("Controller - burnableMint", function () {
  it("controller - burnableMint token 3", async function () {
    // mint token 0
    await controller.initialMint(new BigNumber.from("0"));

    // advance time by 1 day + 1 second
    await provider.send("evm_increaseTime", [24 * 60 * 60 + 1]);

    // mint token 1
    await controller.initialMint(new BigNumber.from("1"));

    // burnableMint for token 3
    await controller.burnableMint(3, [0,1], [1,1]);

    // check if address[0] has balance of 1 for token 3
    expect(await tokens.balanceOf(accounts[0].address, new BigNumber.from("3"))).to.eql(new BigNumber.from("1"));
  });

  it("controller - burnableMint token 4", async function () {
    // mint token 1
    await controller.initialMint(new BigNumber.from("1"));

    // advance time by 1 day + 1 second
    await provider.send("evm_increaseTime", [24 * 60 * 60 + 1]);

    // mint token 2
    await controller.initialMint(new BigNumber.from("2"));

    // burnableMint for token 4
    await controller.burnableMint(4, [1,2], [1,1]);

    // check if address[0] has balance of 1 for token 4
    expect(await tokens.balanceOf(accounts[0].address, new BigNumber.from("4"))).to.eql(new BigNumber.from("1"));
  });

  it("controller - burnableMint token 5", async function () {
    // mint token 0
    await controller.initialMint(new BigNumber.from("0"));

    // advance time by 1 day + 1 second
    await provider.send("evm_increaseTime", [24 * 60 * 60 + 1]);

    // mint token 2
    await controller.initialMint(new BigNumber.from("2"));

    // burnableMint for token 5
    await controller.burnableMint(5, [0,2], [1,1]);

    // check if address[0] has balance of 1 for token 5
    expect(await tokens.balanceOf(accounts[0].address, new BigNumber.from("5"))).to.eql(new BigNumber.from("1"));
  });

  it("controller - burnableMint token 6", async function () {
    // mint token 0
    await controller.initialMint(new BigNumber.from("0"));

    // advance time by 1 day + 1 second
    await provider.send("evm_increaseTime", [24 * 60 * 60 + 1]);

    // mint token 1
    await controller.initialMint(new BigNumber.from("1"));

    // advance time by 1 day + 1 second
    await provider.send("evm_increaseTime", [24 * 60 * 60 + 1]);

    // mint token 2
    await controller.initialMint(new BigNumber.from("2"));

    // burnableMint for token 6
    await controller.burnableMint(6, [0,1,2], [1,1,1]);

    // check if address[0] has balance of 1 for token 6
    expect(await tokens.balanceOf(accounts[0].address, new BigNumber.from("6"))).to.eql(new BigNumber.from("1"));
  });

  it("controller - burnableMint token 10 (revert as non existent)", async function () {
    // mint token 0
    await controller.initialMint(new BigNumber.from("0"));

    // advance time by 1 day + 1 second
    await provider.send("evm_increaseTime", [24 * 60 * 60 + 1]);

    // mint token 1
    await controller.initialMint(new BigNumber.from("1"));

    // burnableMint for token 10
    await expect(controller.burnableMint(10, [0,1,2], [1,1,1])).to.be.revertedWith(
      "Invalid tokenID to mint specified"
    );
  });
});

describe("Controller - trade", function () {
  it("trade token 0 for 1", async function () {
    // mint token 0
    await controller.initialMint(new BigNumber.from("0"));

    // trade token 0 for 1
    await expect(controller.trade(0, 1)).to.not.be.reverted;

    // token 1 balance should be 1
    expect(await tokens.balanceOf(accounts[0].address, new BigNumber.from("1"))).to.eql(new BigNumber.from("1"));
  });

  it("trade token 0 for 1", async function () {
    // mint token 0
    await controller.initialMint(new BigNumber.from("0"));

    // trade token 0 for 1
    await expect(controller.trade(0, 1)).to.not.be.reverted;

    // token 1 balance should be 1
    expect(await tokens.balanceOf(accounts[0].address, new BigNumber.from("1"))).to.eql(new BigNumber.from("1"));
  });

  it("revert if trying to trade forged tokens", async function () {
    // mint token 0
    await controller.initialMint(new BigNumber.from("0"));

    // advance time by 1 day + 1 second
    await provider.send("evm_increaseTime", [24 * 60 * 60 + 1]);

    // mint token 2
    await controller.initialMint(new BigNumber.from("2"));

    // burnableMint for token 5
    await controller.burnableMint(5, [0,2], [1,1]);

    // revert on trade token 5 for 6 
    await expect(controller.trade(5, 6)).to.be.revertedWith(
      "You can only trade for tokens 0-2!"
    );    
  });

});