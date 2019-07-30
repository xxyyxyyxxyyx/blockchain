const Blockcchain = require("./blockchain");
const bitcoin = new Blockcchain();

const blockchain = {
  chain: [
    {
      index: 1,
      timestamp: 1564469722111,
      transactions: [],
      nonce: 0,
      previousBlockHash: "Satoshi",
      hash: "Nakamoto"
    },
    {
      index: 2,
      timestamp: 1564469763857,
      transactions: [],
      nonce: 377606,
      previousBlockHash: "Nakamoto",
      hash: "0000fb766402051d5aca4b1037eac9a504e1ab8a89fd72db246168fd0106d538"
    },
    {
      index: 3,
      timestamp: 1564469802735,
      transactions: [
        {
          amount: 12.5,
          sender: "00",
          recipient: "00bb46f0b29711e9920403f43360b85a",
          transactionId: "18e9c490b29711e9920403f43360b85a"
        }
      ],
      nonce: 69857,
      previousBlockHash:
        "0000fb766402051d5aca4b1037eac9a504e1ab8a89fd72db246168fd0106d538",
      hash: "000092f86134802717df95a95c52933b17068e325302138523f2324102b9214b"
    },
    {
      index: 4,
      timestamp: 1564469833215,
      transactions: [
        {
          amount: 12.5,
          sender: "00",
          recipient: "00bb46f0b29711e9920403f43360b85a",
          transactionId: "300c2960b29711e9920403f43360b85a"
        }
      ],
      nonce: 27610,
      previousBlockHash:
        "000092f86134802717df95a95c52933b17068e325302138523f2324102b9214b",
      hash: "00004781ea844c07c550f75ff7cbac0cce05f7f7177cd9b3af762f7d3ae434b5"
    }
  ],
  pendingTransactions: [
    {
      amount: 12.5,
      sender: "00",
      recipient: "00bb46f0b29711e9920403f43360b85a",
      transactionId: "423842e0b29711e9920403f43360b85a"
    }
  ],
  currentNodeUrl: "http://localhost:3001",
  networkNodes: []
};
console.log(bitcoin.chainIsValid(blockchain.chain));
