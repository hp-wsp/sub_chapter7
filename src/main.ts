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

const subscribeEvent = async (api:ApiPromise) => {
    api.query.system.events((events) => {
        console.log(`Received ${events.length} events`);
        events.forEach(e => {
            const {event, phase} = e;
            const types = event.typeDef;

            console.log(`${event.section}:${event.method}:: (phase = ${phase.toString()})`);
            console.log(`${event.meta.docs.toString()}`);

            event.data.forEach((e, i) => {
                console.log(`${types[i].type}: ${e.toString()}`)
            });
        })
    });
}

const main = async () => {
   const api = await connectSubstrate();
   console.log("Start listener substrate...");

   await subscribeEvent(api);
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