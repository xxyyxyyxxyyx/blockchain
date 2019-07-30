var express = require("express");
var app = express();
const bodyParser = require("body-parser");
const blockchain = require("./blockchain");
const bitcoin = new blockchain();
const uuid = require("uuid/v1");
const port = process.argv[2];
const rp = require("request-promise");

const nodeAddress = uuid()
  .split("-")
  .join("");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.get("/blockchain", function(req, res) {
  res.send(bitcoin);
});

app.post("/transaction", function(req, res) {
  const newTransaction = req.body;
  const blockIndex = bitcoin.addTransactiontoPendingTransactions(
    newTransaction
  );
  res.json({
    note: `Transaction will be added in block ${blockIndex}.`
  });
});

app.post("/transaction/broadcast", function(req, res) {
  const newTransaction = bitcoin.createNewTransaction(
    req.body.amount,
    req.body.sender,
    req.body.recipient
  );

  bitcoin.addTransactiontoPendingTransactions(newTransaction);
  const requestPromises = [];
  bitcoin.networkNodes.forEach(networkNodeUrl => {
    const requestOptions = {
      uri: networkNodeUrl + "/transaction",
      method: "POST",
      body: newTransaction,
      json: true
    };
    console.log(requestOptions);
    rp(requestOptions);
  });
  Promise.all(requestPromises).then(data => {
    res.json({
      note: "Transaction created and boradcasted successfully."
    });
  });
});
app.get("/mine", function(req, res) {
  const lastBlock = bitcoin.getLastBlock();
  const previousBlockHash = lastBlock["hash"];
  const currentBlockData = {
    transactions: bitcoin.pendingTransactions,
    index: lastBlock["index"] + 1
  };
  const nonce = bitcoin.proofOfWork(previousBlockHash, currentBlockData);
  const blockHash = bitcoin.hashBlock(
    previousBlockHash,
    currentBlockData,
    nonce
  );
  const newBlock = bitcoin.createNewBlock(nonce, previousBlockHash, blockHash);
  bitcoin.networkNodes.forEach(networkNodeUrl => {
    const requestOptions = {
      uri: networkNodeUrl + "/receive-new-block",
      method: "POST",
      body: newBlock,
      json: true
    };

    rp(requestOptions);
  });
  const requestOptions = {
    uri: bitcoin.currentNodeUrl + "/transaction/broadcast",
    method: "POST",
    body: {
      amount: 12.5,
      sender: "00",
      recipient: nodeAddress
    },
    json: true
  };
  rp(requestOptions);
  res.json({
    note: "New block has been mined and broadcasted successfully",
    block: newBlock
  });
});

app.post("/receive-new-block", function(req, res) {
  const newBlock = req.body;
  console.log(req.body);
  // Check if the block is legitimate
  const lastBlock = bitcoin.getLastBlock();
  const correctHash = lastBlock.hash === newBlock.previousBlockHash;
  const correctIndex = lastBlock["index"] + 1 === newBlock["index"];
  if (correctHash && correctIndex) {
    bitcoin.pendingTransactions = [];
    bitcoin.chain.push(newBlock);
    res.json({
      note: "New block received and accepted",
      newBlock: newBlock
    });
  } else {
    res.json({
      note: "New block rejected",
      newBlock: newBlock
    });
  }
});
// Registers a node and broadcasts to the network
app.post("/register-and-broadcast-node", function(req, res) {
  const newNodeUrl = req.body.newNodeUrl;

  if (bitcoin.networkNodes.indexOf(newNodeUrl) == -1) {
    bitcoin.networkNodes.push(newNodeUrl);
  }

  const registerNodes = [];
  bitcoin.networkNodes.forEach(networkNodeUrl => {
    const requestOptions = {
      uri: networkNodeUrl + "/register-node",
      method: "POST",
      body: { newNodeUrl: newNodeUrl },
      json: true
    };

    rp(requestOptions);
  });
  Promise.all(registerNodes)
    .then(data => {
      const bulkRegisterOptions = {
        uri: newNodeUrl + "/register-nodes-bulk",
        method: "POST",
        body: {
          allNetworkNodes: [...bitcoin.networkNodes, bitcoin.currentNodeUrl]
        },
        json: true
      };
      return rp(bulkRegisterOptions);
    })
    .then(data => {
      res.json({
        message: "A node registers with network successfully!"
      });
    })
    .catch(error => {
      console.log(error);
    });
});

// Registers a node with the network
app.post("/register-node", function(req, res) {
  const newNodeUrl = req.body.newNodeUrl;
  if (
    bitcoin.networkNodes.indexOf(newNodeUrl) == -1 &&
    bitcoin.currentNodeUrl !== newNodeUrl
  ) {
    bitcoin.networkNodes.push(newNodeUrl);
    res.json({
      note: "New node registered successfully."
    });
  }
});

// Registers multiple nodes with the network
app.post("/register-nodes-bulk", function(req, res) {
  const allNetworkNodes = req.body.allNetworkNodes;
  allNetworkNodes.forEach(networkNodeUrl => {
    if (
      bitcoin.networkNodes.indexOf(networkNodeUrl) == -1 &&
      bitcoin.currentNodeUrl !== networkNodeUrl
    ) {
      bitcoin.networkNodes.push(networkNodeUrl);
    }
  });
  res.json({
    note: "Bulk registration successfull."
  });
});

// Consensus for longest chain rule
app.get("/consensus", function(req, res) {
  const requestPromises = [];
  bitcoin.networkNodes.forEach(networkNodeUrl => {
    const requestOptions = {
      uri: networkNodeUrl + "/blockchain",
      method: "GET",
      json: true
    };

    requestPromises.push(rp(requestOptions));
  });

  Promise.all(requestPromises).then(blockchains => {
    const currentChainLength = bitcoin.chain.length;
    let maxChainLength = currentChainLength;
    let newLongestChain = null;
    let newPendingTransactions = null;
    blockchains.forEach(blockchain => {
      if (blockchain.chain.length > maxChainLength) {
        maxChainLength = blockchain.chain.length;
        newLongestChain = blockchain.chain;
        newPendingTransactions = blockchain.pendingTransactions;
      }
    });

    if (
      !newLongestChain ||
      (newLongestChain && !bitcoin.chainIsValid(newLongestChain))
    ) {
      res.json({
        note: "Current chain has not been replaced",
        chain: bitcoin.chain
      });
    } else {
      bitcoin.chain = newLongestChain;
      bitcoin.pendingTransactions = newPendingTransactions;
      res.json({
        note: "This chain has been replaced",
        chain: bitcoin.chain
      });
    }
  });
});

app.get("/block/:blockHash", function(req, res) {
  const blockHash = req.params.blockHash;
  const correctBlock = bitcoin.getBlock(blockHash);
  res.json({
    block: correctBlock
  });
});

app.get("/transaction/:transactionId", function(req, res) {
  const transactionId = req.params.transactionId;
  const correctTransactionAndBlock = bitcoin.getTransaction(transactionId);
  res.json({
    transaction: correctTransactionAndBlock.transaction,
    block: correctTransactionAndBlock.block
  });
});
// Gets transaction data for an addres
app.get("/address/:address", function(req, res) {
  const address = req.params.address;
  const addressData = bitcoin.getAddressData(address);
  res.json({
    addressData: addressData
  });
});

// Loads the block explorer front end
app.get("/block-explorer", function(req, res) {
  res.sendFile("/block-explorer/index.html", { root: __dirname });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}...`);
});
