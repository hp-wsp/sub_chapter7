import '@polkadot/api-augment';

import {ApiPromise, WsProvider, Keyring} from '@polkadot/api';


const WEB_SOCKET = 'ws://localhost:9944';
const sleep = (ms:number) => new Promise(resolve => setTimeout(resolve, ms));

const connectSubstrate =async () => {
    const wsProvider = new WsProvider(WEB_SOCKET);
    const api = await ApiPromise.create({provider: wsProvider, types:{}});
    await api.isReady;
    console.log('Connection substrate success...');
    return api;
}

const getConst = async (api: ApiPromise) => {
    const e = api.consts.balances.existentialDeposit.toHuman();
    return e;
}

const subscribeNewHeads =async (api: ApiPromise) => {
    let count = 0;
    const unsubscribe = await api.rpc.chain.subscribeNewHeads((header) => {
        console.log(`Chain is at block: #${header.number}`);
        if(++count == 256){
            unsubscribe();
            process.exit(0);
        }
    });
}

const transferFromAliceToBob = async (api:ApiPromise, amount: number) => {
    const keyring = new Keyring({type: 'sr25519'});
    const alice = keyring.addFromUri('//Alice');
    const bob = keyring.addFromUri('//bob');

    await api.tx.balances.transfer(bob.address, amount)
             .signAndSend(alice, res => {
                 console.log(`Tx status: ${res.status}`);
             });
}

const subscribeBalances = async (api:ApiPromise) => {
    const keyring = new Keyring({type: 'sr25519'});
    const alice = keyring.addFromUri('//Alice');
    const bob = keyring.addFromUri('//Bob');
    const unsubscribe = await api.query.system.account.multi([alice.address, bob.address], balances =>{
        console.log("Subscribe to alice and bob account.");
        const [{data: aliceBalance}, {data: bobBalance}] = balances;
        console.log(`The balances are ${aliceBalance.free} and ${bobBalance.free}`);
    });
}

const main = async () => {
   const api = await connectSubstrate();
   console.log("const value existenialDeposit is:", await getConst(api));

   await subscribeNewHeads(api);
   subscribeBalances(api);
   transferFromAliceToBob(api, 10 ** 12);
   await sleep(60000);


   console.log('game over');
};

main().then(() => {
    console.log('successfully exited.');
    process.exit(0);
}).catch(err => {
    console.log('error occur', err);
    process.exit(1);
})