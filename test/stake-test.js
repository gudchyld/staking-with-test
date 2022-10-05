const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { seconds, days } = require("@nomicfoundation/hardhat-network-helpers/dist/src/helpers/time/duration");


const staked = ethers.utils.parseEther("100");
describe("Staking Contract", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployStakingFixture() {


    // Contracts are deployed using the first signer/account by default
    const waitTime = (await time.latest()) + 2592000;
    const [owner, otherAccount] = await ethers.getSigners();

    const tokenSupply = await ethers.utils.parseEther("100000");

    const timi = await ethers.getContractFactory("Timidan");
    const TimiContract = await timi.deploy(owner.address);

    const stake = await ethers.getContractFactory("Staking");
    const StakeContract = await stake.deploy(TimiContract.address);

    return { waitTime, tokenSupply, StakeContract, TimiContract, owner, otherAccount };
  }

  describe("Deployment", function () {
    it("Should ensure that staking contract has no timidan token", async function () {
      const { TimiContract, StakeContract } = await loadFixture(deployStakingFixture);

      expect(await TimiContract.balanceOf(StakeContract.address)).to.equal(0);
    });

    it("Should ensure that that the deployer of timidan token is the first account from hardhat", async function () {
      const { TimiContract, owner } = await loadFixture(deployStakingFixture);

      expect(await TimiContract.owner()).to.equal(owner.address);
    });

    it("should ensure that the total supply of timidan was minted to the deployer", async function () {
      const { TimiContract, owner, tokenSupply } = await loadFixture(deployStakingFixture);

      expect(await TimiContract.balanceOf(owner.address)).to.equal(tokenSupply);
    });

  })

  describe("Staking", function () {
    it("Should fuel the staking contract and otherAccount", async function () {
      const { owner, StakeContract, TimiContract, otherAccount } = await loadFixture(deployStakingFixture);

      await TimiContract.transfer(otherAccount.address, ethers.utils.parseEther("200"));
      await TimiContract.transfer(StakeContract.address, ethers.utils.parseEther("1000"));

      expect(await TimiContract.balanceOf(otherAccount.address)).to.equal(ethers.utils.parseEther("200"));
      expect(await TimiContract.balanceOf(StakeContract.address)).to.equal(ethers.utils.parseEther("1000"));
    });


    it("should allow people to stake", async function () {
      //approve the contract to spend the stakers token
      const { TimiContract, otherAccount, StakeContract } = await loadFixture(deployStakingFixture);


      await TimiContract.transfer(otherAccount.address, ethers.utils.parseEther("200"));

      await TimiContract.connect(otherAccount).approve(StakeContract.address, ethers.utils.parseEther("100"));
      await StakeContract.connect(otherAccount).stake(ethers.utils.parseEther("100"));

      // expect(await TimiContract.balanceOf(otherAccount.address)).to.equal(ethers.utils.parseEther("200"));
      const res = await StakeContract.getUser(otherAccount.address);
      //console.log(res.stakedAmount);

      expect(await res.stakedAmount).to.equal(ethers.utils.parseEther("100"));
    });

    it("Should allow people to withdraw their stake", async function () {

      const { waitTime, TimiContract, otherAccount, StakeContract } = await loadFixture(deployStakingFixture);

      await TimiContract.transfer(otherAccount.address, ethers.utils.parseEther("100"));

      await TimiContract.connect(otherAccount).approve(StakeContract.address, ethers.utils.parseEther("100"));
      await StakeContract.connect(otherAccount).stake(ethers.utils.parseEther("100"));

      // await ethers.provider.send("evm_increaseTime", [2592000]);
      // await ethers.provider.send("evm_mine", []);
      await time.increaseTo(waitTime);
      await StakeContract.connect(otherAccount).unstake(0);

      const signerBalance = await TimiContract.balanceOf(otherAccount.address);
      //console.log("Signer Balance: ", signerBalance);
      console.log(signerBalance.toString());
      //console.log(ethers.utils.parseEther(signerBalance));
      console.log((staked.div(10)).toString());


      expect(signerBalance).to.closeTo(staked.div(10), staked.div(10).sub(ethers.utils.parseEther("0.03")))
      // //confirm balance
      // expect((await Staking.getUser(signer2address)).stakedAmount).to.equal(staked)

    });


  })

})