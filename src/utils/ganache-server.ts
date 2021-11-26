import ganache from 'ganache-cli'
import * as ethers from 'ethers'
const testToken = require('@servichain/files/test-token.json')

export async function deployTestContract(provider: any) {
  const webProvider = new ethers.providers.Web3Provider(provider)
  let wallet = new ethers.Wallet("0x328d070627f302c4e11c64c298bd6609d1cb77d4e3ac8aea9ecf1916b0e5f948", webProvider)
  try {
    const factory = new ethers.ContractFactory(testToken.abi, testToken.bytecode, wallet)
    const contract = await factory.deploy({gasLimit: '0xBA947'})
    const tx = await contract.deployTransaction.wait()
  } catch(err) {
    throw err
  }
}

const options = {
  _chainId: 1337,
  network_id: 1337,
  accounts: [
    {
      secretKey: "0x328d070627f302c4e11c64c298bd6609d1cb77d4e3ac8aea9ecf1916b0e5f948",
      balance: "0x4563918244F40000"
    }
  ]
};
const server = ganache.server(options);
const PORT = 8545;

server.listen(PORT, async (err, blockchain) => {
  if (err) {
    throw err;
  }
  const provider = server.provider
  await deployTestContract(provider)
});


module.exports = server