const sha256 = require("sha256");
const currentNodeUrl = process.argv[3];
const uuid = require("uuid/v1");

function Blockchain() {
  this.chain = [];
  this.pendingTransactions = [];
  this.currentNodeUrl = currentNodeUrl;
  this.networkNodes = [];

  // Create genesis block
  this.createNewBlock(0, "Satoshi", "Nakamoto");
}
// Creates new block
Blockchain.prototype.createNewBlock = function(
  nonce,
  previousBloackHash,
  hash
) {
  const newBlock = {
    index: this.chain.length + 1,
    timestamp: Date.now(),
    transactions: this.pendingTransactions,
    nonce: nonce,
    previousBlockHash: previousBloackHash,
    hash: hash
  };
  this.pendingTransactions = [];
  this.chain.push(newBlock);
  return newBlock;
};

Blockchain.prototype.getLastBlock = function() {
  return this.chain[this.chain.length - 1];
};
// Creates new transactions
Blockchain.prototype.createNewTransaction = function(
  amount,
  sender,
  recipient
) {
  const newTransaction = {
    amount: amount,
    sender: sender,
    recipient: recipient,
    transactionId: uuid()
      .split("-")
      .join("")
  };

  return newTransaction;
};

Blockchain.prototype.addTransactiontoPendingTransactions = function(
  transactionObj
) {
  this.pendingTransactions.push(transactionObj);
  return this.getLastBlock()["index"] + 1;
};

// Hashes the data
Blockchain.prototype.hashBlock = function(
  previousBlockHash,
  currentBlockData,
  nonce
) {
  return sha256(
    previousBlockHash + JSON.stringify(currentBlockData) + nonce.toString()
  );
};

// Proof of Work
Blockchain.prototype.proofOfWork = function(
  previousBloackHash,
  currentBlockData
) {
  let nonce = 0;
  let hash = this.hashBlock(previousBloackHash, currentBlockData, nonce);
  while (hash.substring(0, 4) !== "0000") {
    nonce++;
    hash = this.hashBlock(previousBloackHash, currentBlockData, nonce);
  }
  return nonce;
};

Blockchain.prototype.chainIsValid = function(blockchain) {
  for (var i = 1; i < blockchain.length; i++) {
    const currentBlock = blockchain[i];
    const previousBlock = blockchain[i - 1];
    const blockHash = this.hashBlock(
      previousBlock["hash"],
      {
        transactions: currentBlock["transactions"],
        index: currentBlock["index"]
      },
      currentBlock["nonce"]
    );
    if (
      currentBlock["previousBlockHash"] !== previousBlock["hash"] &&
      blockHash.substring(0, 4) !== "0000"
    )
      return false;
  }
  return true;
};
// Gets block from block hash
Blockchain.prototype.getBlock = function(blockHash) {
  let correctBlock = null;
  this.chain.forEach(block => {
    if (block.hash === blockHash) correctBlock = block;
  });
  return correctBlock;
};

// Gets transaction from transaction id
Blockchain.prototype.getTransaction = function(transactionId) {
  let correctTransaction = null;
  let correctBlock = null;
  this.chain.forEach(block => {
    const currentTransactions = block.transactions;
    currentTransactions.forEach(transaction => {
      if (transaction.transactionId === transactionId) {
        correctTransaction = transaction;
        correctBlock = block;
      }
    });
  });
  return {
    transaction: correctTransaction,
    block: correctBlock
  };
};

// Get all transactions for a given address
Blockchain.prototype.getAddressData = function(address) {
  const addressTransactions = [];
  this.chain.forEach(block => {
    const currentTransactions = block.transactions;
    currentTransactions.forEach(transaction => {
      if (transaction.sender === address || transaction.recipient === address) {
        addressTransactions.push(transaction);
      }
    });
  });
  let balance = 0;
  addressTransactions.forEach(transaction => {
    if (transaction.recipient === address) balance += transaction.amount;
    else if (transaction.sender === address) balance -= transaction.amount;
  });
  return { addressTransactions: addressTransactions, addressBalance: balance };
};
module.exports = Blockchain;
