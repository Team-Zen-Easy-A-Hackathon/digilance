/* eslint-disable no-undef */
const { assert } = require('chai');
/* eslint-disable jest/valid-describe-callback */
const FreelanceMarketplace = artifacts.require('FreelanceMarketplace.sol');
const FLTToken = artifacts.require("FLTToken");
const Ether = artifacts.require("Ether");

require('chai')
  .use(require('chai-as-promised'))
  .should();

contract('FreelanceMarketplace', (accounts) => {
  let fltToken;
  let etherToken;
  let freelanceMarketplace;

  const owner = accounts[0];
  const client = accounts[1];
  const writer = accounts[2];
  const anotherWriter = accounts[3];
  const topic = "Test topic";
  const allowance = '10000000000000000000000';
  const reward = 500;
  const deadline = new Date().getTime() + 3600;

  before(async () => {
    freelanceMarketplace = await FreelanceMarketplace.deployed();
    fltToken = await FLTToken.deployed();
    etherToken = await Ether.deployed();

    await fltToken.transfer(client, String(reward * (10**18)));
    await fltToken.approve(freelanceMarketplace.address, allowance, { from: owner });
    await fltToken.approve(freelanceMarketplace.address, allowance, { from: client });
  })

  describe('deployment', async () => {
    it('deploys successfully', async () => {
      const address = await freelanceMarketplace.address
      assert.notEqual(address, 0x0)
      assert.notEqual(address, '')
      assert.notEqual(address, null)
      assert.notEqual(address, undefined)
    })

    it('has a name', async () => {
      const name = await freelanceMarketplace.name()
      assert.equal(name, 'Freelance Marketplace')
    });

  });

  describe("requestArticle()", () => {
    it("should debit client and allow them to request an article", async () => {
      const balanceBeforeRequest = await fltToken.balanceOf(client);
      const tx = await freelanceMarketplace.requestArticle(topic, deadline, reward, { from: client });
      const event = tx.logs[1].args;
      const balanceAfterRequest = await fltToken.balanceOf(client);

      assert.equal(event.id, 1, "Wrong article ID");
      assert.equal(event.topic, topic, "Wrong topic");
      assert.equal(event.reward, reward, "Wrong reward");
      assert.equal(event.client, client, "Wrong client");
      assert.equal(event.deadline, deadline, "Wrong deadline");
      assert.equal(web3.utils.fromWei(balanceAfterRequest), web3.utils.fromWei(balanceBeforeRequest) - reward);
    });

    it("should not allow a client to request an article that has already been requested", async () => {
      await freelanceMarketplace.requestArticle(topic, deadline, reward, { from: client }).should.be.rejected;
    });

    it("should not allow a client to request an article if they do not have enough FLT tokens", async () => {
      const newTopic = 'New Topic';
      await freelanceMarketplace.requestArticle(newTopic, deadline, reward * 2, { from: client }).should.be.rejected;
    });
  });

  describe("acceptArticleRequest()", () => {
    it("should not allow a client to accept his request", async () => {
      await freelanceMarketplace.acceptArticleRequest(topic, { from: client }).should.be.rejected;
    });

    it("should allow a freelancer to accept an article", async () => {
      // Accept the request from a writer
      const tx = await freelanceMarketplace.acceptArticleRequest(topic, { from: writer });

      const event = tx.logs[0].args;

      // Make sure request status is update
      assert.equal(event.status, "2", "Wrong status");
    });

    it("should not allow a client to accept an article that has already been accepted", async () => {
      // Try accepting an already accepted article from the owner
      await freelanceMarketplace.acceptArticleRequest(topic, deadline, reward, { from: owner }).should.be.rejected;
    });
  });

  describe("submitArticle", async () => {
    const articleBody = "Lorem ipsum dolor sit amet, consectetur adipiscing elit.";

    it('should prevent the client from submitting their own article', async () => {
      // Submit article from the person that requested the article
      await freelanceMarketplace.submitArticle(topic, 8, articleBody, { from: client }).should.be.rejected;
    })

    it("should only allow writer of article to submit it", async () => {
      // Submit article from a writer different from actual writer
      await freelanceMarketplace.submitArticle(topic, 8, articleBody, { from: anotherWriter }).should.be.rejected;
    });

    it("should allow a freelancer to submit an article", async () => {
  
      // Submit the article from correct writer
      const result = await freelanceMarketplace.submitArticle(topic, 8, articleBody, { from: writer });
  
      // Check the emitted event
      assert.equal(result.logs[0].event, "ArticleSubmitted", "ArticleSubmitted event should be emitted");
  
      // Check the stored article
      const article = await freelanceMarketplace.articles(topic);
      assert.equal(article.topic, topic, "Article title should match submitted title");
      assert.equal(article.content, articleBody, "Article body should match submitted body");
      assert.equal(article.author, writer, "Article author should match submitting account");
      assert.equal(article.reward, reward, "Article author should match submitting account");
    });

    it('calculates the correct reward and credits the freelancer', async () => {
      const transferAmount = reward * 2;
      await fltToken.transfer(client, web3.utils.toWei(transferAmount.toString(), 'ether'));
      const now = new Date().getTime();
      // Create 2 requests with different deadlines (1 hour later and 3 hours later)
      const oneHourLaterRequest = {
        topic: 'topic1',
        reward,
        expectedReward: reward * 0.8,
        deadline: now - (3600 * 1000),
      };

      const threeHoursLaterRequest = {
        topic: 'topic2',
        reward,
        expectedReward: reward * 0.6,
        deadline: now - (3 * 3600 * 1000),
      };

      // Submit requests
      await freelanceMarketplace.requestArticle(
        oneHourLaterRequest.topic,
        oneHourLaterRequest.deadline,
        oneHourLaterRequest.reward,
        { from: client }
      );
      await freelanceMarketplace.requestArticle(
        threeHoursLaterRequest.topic,
        threeHoursLaterRequest.deadline,
        threeHoursLaterRequest.reward,
        { from: client }
      );

      // Accept the requests from a writer
      await freelanceMarketplace.acceptArticleRequest(oneHourLaterRequest.topic, { from: writer });
      await freelanceMarketplace.acceptArticleRequest(threeHoursLaterRequest.topic, { from: writer });

      // Submit the articles from the writer
      const result1Hour = await freelanceMarketplace.submitArticle(oneHourLaterRequest.topic, 8, articleBody, { from: writer });
      const result3Hours = await freelanceMarketplace.submitArticle(threeHoursLaterRequest.topic, 8, articleBody, { from: writer });

      // Get the emitted event
      const event1Hour= result1Hour.logs[0].args;
      const event3Hours= result3Hours.logs[0].args;

      // Assert that the correct rewards are calculated and paid.
      assert.equal(event1Hour.reward, oneHourLaterRequest.expectedReward);
      assert.equal(event3Hours.reward, threeHoursLaterRequest.expectedReward);
    })
  });

  describe("approveArticle()", async () => {
    it("should only allow article owner to approve it", async () => {
      await freelanceMarketplace.approveArticle(topic, { from: anotherWriter }).should.be.rejected;
    });

    it("should allow article owner to approve it and pay the author", async () => {
      const balanceBeforeApproval = await fltToken.balanceOf(writer);
      const tx = await freelanceMarketplace.approveArticle(topic, { from: client });

      const articleApprovedEvent = tx.logs[1].args;

      const balanceAfterApproval = await fltToken.balanceOf(writer);


      assert.equal(articleApprovedEvent.status, "4");
      assert.equal(web3.utils.fromWei(balanceAfterApproval), +web3.utils.fromWei(balanceBeforeApproval) + reward);
    });
  });

  describe("purchaseFLT()", async () => {
    it("fails when ether amount is 0", async () => {
      await freelanceMarketplace.purchaseFLT(0, { from: client }).should.be.rejected;
    });

    it(`fails when ether amount exceeds user balance or user has not approved the marketplace
      contract to make transactions on their behalf`, async () => {
      await freelanceMarketplace.purchaseFLT(10, { from: client }).should.be.rejected;
    });

    it("purchases FLT using user's ETH balance", async () => {
      // Approve the marketplace contract to make transactions on the client's behalf
      await etherToken.transfer(client, String(100 * (10**18)));
      await etherToken.approve(freelanceMarketplace.address, String(100 * (10**18)), { from: client });

      const etherBalanceBeforePurchase = await etherToken.balanceOf(client);
      const fltBalanceBeforePurchase = await fltToken.balanceOf(client);

      const etherAmount = 10;
      const FLTAmount = 1000; 

      // await fltToken.approve(freelanceMarketplace.address, allowance, { from: client });
      await freelanceMarketplace.purchaseFLT(10, { from: client });

      const etherBalanceAfterPurchase = await etherToken.balanceOf(client);
      const fltBalanceAfterPurchase = await fltToken.balanceOf(client);

      // Assert that the user's balances have changed
      assert.equal(web3.utils.fromWei(etherBalanceAfterPurchase), +web3.utils.fromWei(etherBalanceBeforePurchase) - etherAmount);
      assert.equal(web3.utils.fromWei(fltBalanceAfterPurchase), +web3.utils.fromWei(fltBalanceBeforePurchase) + FLTAmount);
    });
  })
})