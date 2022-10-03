const miners = require("./miners.json");
const fetch = require("node-fetch");
const fs = require("fs");

// this uses the minerstat "api", kind of bad but it works! :)
async function getDag(coin) {
    const params = new URLSearchParams();
    params.append('coin', coin);
    const response = await fetch('https://minerstat.com/dag-size-calculator', {method: 'POST', body: params});
    const woop = await response.json();
    return woop[2];
}

async function doTheStuff(){
    //const ethDag = Math.round(await getDag("ETH") * 1000);
    const ethDag = 2147483647;
    const etcDag = Math.round(await getDag("ETC") * 1000);
    const rvnDag = Math.round(await getDag("RVN") * 1000);
    const ergDag = Math.round(await getDag("ERG") * 1000);
    //miners.algos.ethash = ethDag;
    miners.algos.ethash = ethDag;
    miners.algos.etchash = etcDag;
    miners.algos.kawpow = rvnDag;
    miners.algos.autolykos2 = ergDag;
    console.log(`

Algorithm overview:

    Ethash      will work when VRAM is higher than   ${ethDag}
    Etchash     will work when VRAM is higher than   ${etcDag}
    Kawpow      will work when VRAM is higher than   ${rvnDag}
    Autolykos2  will work when VRAM is higher than   ${ergDag}

Please check if the result

    `)
    fs.writeFileSync("./internal/miners.json", JSON.stringify(miners, null, 4));
    console.log(`
    Update DAG complete!
    `)
}
doTheStuff();
