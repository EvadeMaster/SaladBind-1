const ora = require('ora');
const chalk = require('chalk');
const inquirer = require('inquirer');
const fs = require('fs');
const fetch = require("node-fetch");
const si = require("systeminformation");
const https = require('https');
const path = require('path');
const decompress = require('decompress');
const decompressTargz = require('decompress-targz');
const decompressUnzip = require('decompress-unzip');
const mv = require('mv'); // bukky 
const { menu } = require('./index');
const { configFile, dataDirectory} = require("./setup");
let rawdata = fs.readFileSync(configFile);
const config = JSON.parse(rawdata);
const { spawn, execSync } = require("child_process");
const presence = require('./presence');
const cache = require("./getMachine.js"); // wtf how is this cache haha
let spinner;
let isDev = config.dev != undefined && config.dev == true;
let lastMiner = {}

function moveDupeFolder(folderName) {
	let folderData = fs.readdirSync(`${dataDirectory}/temp/${folderName}`)
	if (folderData.length == 1) {
		mv(`${dataDirectory}/temp/${folderName}/${folderData[0]}`, `${dataDirectory}/miners/${folderName}`, { clobber: false }, function(err) { //oh okers
			// done. it tried fs.rename first, and then falls ba	ck to
			// piping the source file to the dest file and then unlinking
			// the source file. (docs lol) lol
			if (err) {
				console.log(chalk.bold.red(err));
				spinner.fail();
			}
		});
	} else {
		mv(`${dataDirectory}/temp/${folderName}/`, `${dataDirectory}/miners/${folderName}`, { clobber: false }, function(err) { //oh okers
			if (err) {
				console.log(chalk.bold.red(err));
				spinner.fail();
			}
		})
	}
}

async function extractFile(location, folderName, fileExtension) {
	if (!fs.existsSync(`${dataDirectory}/temp/${folderName}`)) {
		fs.mkdirSync(`${dataDirectory}/temp/${folderName}`); // me too
	}
	if (!fs.existsSync(`${dataDirectory}/miners/`)) {
		fs.mkdirSync(`${dataDirectory}/miners/`); // me too
	}
	await decompress(location, `${dataDirectory}/temp/${folderName}`, {
		plugins: [
			decompressTargz(),
			decompressUnzip()
		],
		map: (file) => {
			if (file.type === 'file' && file.path.endsWith('/')) {
				file.type = 'directory'
			}
			return file
		}
	}).then(() => {
		fs.unlinkSync(location);
		moveDupeFolder(folderName);
	})
	spinner.succeed(chalk.bold.green(`Extracted ${folderName}`));
}

const downloadFile = async function(url, location, name) {
	return new Promise(async(resolve, reject) => {
		const stream = fs.createWriteStream(location);
		https.get(url, function(response) {
			if (parseInt(response.statusCode) >= 200 && parseInt(response.statusCode) < 300) {
				response.pipe(stream);
				stream.on('finish', function() {
					stream.close(function() {
						spinner.succeed(chalk.bold.green(`Downloaded ${name}`));
						resolve();
					});
				});
			} else {
				downloadFile(response.headers.location, location, name).then(() => {
					resolve();
				});
			}
		});
	});
}

async function run() {
	spinner = ora("Checking system specs...").start();
	if (!fs.existsSync(`${dataDirectory}/temp`)) {
		fs.mkdirSync(`${dataDirectory}/temp`);
	}
	if (!fs.existsSync(`${dataDirectory}/cache.json`)) {
		spinner.text = "Saving system specs...";
		cache.updateCache().then(() => {
			spinner.succeed(chalk.green.bold("System specs saved!"))
			continueMiner();
		})
	} else {
		spinner.succeed(chalk.green.bold("Loaded system specs!"))
		continueMiner();
	}
}


async function continueMiner() {
	console.clear();
	console.log(chalk.bold.cyan(`Configure your miner`))
	presence.configuring("Selecting miner");
	spinner = ora("Loading miner list").start();
	fetch(`https://raw.githubusercontent.com/EvadeMaster/UnstableBind/${isDev ? "dev" : "Vanilla"}/internal/miners.json`)
		.then(res => res.json())
		.then(async data => {
			spinner.text = "Checking your specs";
			try {
				var systemCache = JSON.parse(fs.readFileSync(`${dataDirectory}/cache.json`))
			} catch {
				console.log(chalk.bold.red("\nFailed to load cache! Trying to recover. Please allow up to 30 seconds.\n"))
				systemCache = {};
				fs.rmSync(`${dataDirectory}/cache.json`);
				spinner.stop();
				return await run(); // Restart from the beginning if cache is corrupted.
			}
			cache.updateCache()
			let minerList = [];
			let temp = systemCache.os
			let temp2 = systemCache.graphics
			let userPlatform = temp.platform;
			if(userPlatform == "Windows") userPlatform = "win32";
			let GPUs = [];
			for (let i = 0; i < temp2.controllers.length; i++) {
				let compatibleAlgos = []
				for (let j = 0; j < Object.keys(data.algos).length; j++) {
					if (temp2.controllers[i].vendor == "Advanced Micro Devices, Inc.") temp2.controllers[i].vendor = "AMD";
					if (temp2.controllers[i].vendor == "NVIDIA Corporation") temp2.controllers[i].vendor = "NVIDIA";
					if (temp2.controllers[i].vram > data.algos[Object.keys(data.algos)[j]] || data.algos[Object.keys(data.algos)[j]] == null) {
						compatibleAlgos.push(Object.keys(data.algos)[j])
					}
				}
				if (compatibleAlgos.length > 0) {
					if (!temp2.controllers[i].vendor.includes("Intel")) {
						GPUs.push({ "algos": compatibleAlgos, "vendor": temp2.controllers[i].vendor.toLowerCase() });
					}
				} else {
					if (temp2.controllers[i].vendor.includes("Advanced Micro Devices, Inc.")) {
						GPUs.push({ "algos": Object.keys(data.algos), "vendor": "BYPASS" })
					}
				}
			}
			if (JSON.parse(fs.readFileSync(configFile)).bypassGPUChecks == true) {
				GPUs.push({
					"algos": Object.keys(data.algos),
					"vendor": "BYPASS"
				})
			}
			for (let i = 0; i < Object.keys(data.miners).length; i++) {
				let minerData = data.miners[Object.keys(data.miners)[i]];
				const minerSupportsOS = minerData.supported_os.includes(userPlatform)
				const algosSupportsGPU = minerData.algos.filter(algo => GPUs.filter(gpu => gpu.algos.includes(algo)).length > 0).length > 0
				const minerSupportsGPU = GPUs.filter(gpu => minerData.supported_gpus.includes(gpu.vendor) || gpu.vendor == "BYPASS").length > 0
				const minerSupportsCPU = minerData.supports_cpu;
				if (minerSupportsCPU) {
					minerList.push({
						name: `${minerData.miner}${minerData.supported_gpus.length == 0 ? chalk.yellow(" (CPU only)") : ""}`,
						value: minerData
					});
				} else if (minerSupportsOS && minerSupportsGPU && algosSupportsGPU) {
					if (GPUs.filter(gpu => minerData.algos.filter(algo => gpu.algos.includes(algo)).length > 0).length != GPUs.length) {
						minerList.push({
							name: `${minerData.miner} ${chalk.yellow("(Not supported by some of your GPUs)")}`,
							value: minerData
						});
					} else {
						minerList.push({
							name: minerData.miner,
							value: minerData
						});
					}
				}
				
			}
			spinner.stop();
			if (minerList.length == 0 && temp2.controllers.length != 0) {
				spinner.stop();
				console.log(chalk.bold.red("No miners are available for your machine D:\nYou can also enable bypassing GPU checks if you are sure your GPU supports mining. (youre probably wrong)"));
				setTimeout(() => {
					require("./index").menu();
				}, 6000);
			} else {
				const miner = await inquirer.prompt({
					type: "list",
					name: "miner",
					message: "Choose a miner",
					choices: [...minerList, {
						name: chalk.bold.redBright("Go back"),
						value: "go_back"
					}]
				});
				if (miner.miner == "go_back") {
					presence.mainmenu()
					menu(true);
					return;
				}
				lastMiner.data = miner.miner;
				if (fs.existsSync(`${dataDirectory}/miners/${miner.miner.miner}-${miner.miner.version}`)) {
					let minerFolder = fs.readdirSync(`${dataDirectory}/miners/${miner.miner.miner}-${miner.miner.version}`);
					if (minerFolder.filter(file => file.startsWith(miner.miner.parameters.fileName)).length == 0) {
						fs.rmSync(`${dataDirectory}/miners/${miner.miner.miner}-${miner.miner.version}`, { recursive: true });
					}
				}
				if (!fs.existsSync(`${dataDirectory}/miners/${miner.miner.miner}-${miner.miner.version}`)) {
					let miners = null;
					if (fs.existsSync(`${dataDirectory}/miners`)) {
						miners = fs.readdirSync(`${dataDirectory}/miners`);
					} else {
						miners = []
					}
					let oldMiners = miners.filter(minery => minery.startsWith(miner.miner.miner));
					if (oldMiners.length > 0) { //woo! time for pools.json (and more fucking tokens) oh piss
						console.log(chalk.yellow(`Updating ${miner.miner.miner} to ${miner.miner.version}...`));
						oldMiners.forEach(miner => fs.rmSync(`${dataDirectory}/miners/${miner}`, { recursive: true }));
					}
					spinner = ora(`Downloading ${miner.miner.miner}-${miner.miner.version}`).start();
					var downloadURL = miner.miner.download[userPlatform];
					var fileExtension = path.extname(downloadURL); //time for a really hacky solution. this 
					if (fileExtension == ".gz") {
						fileExtension = ".tar.gz" //wow lazy solution
					}
					const fileName = `${miner.miner.miner}-${miner.miner.version}`
					const fileLocation = `${dataDirectory}/temp/${fileName}${fileExtension}`;
					downloadFile(downloadURL, fileLocation, fileName).then(async() => {
						spinner = ora(`Extracting ${miner.miner.miner}-${miner.miner.version}`).start();
						await extractFile(fileLocation, fileName, fileExtension)
						selectAlgo(miner.miner, GPUs);
					});
				} else {
					selectAlgo(miner.miner, GPUs);
				}
			}
		}).catch(err => {
			spinner.fail(chalk.bold.red(`Could not start the miner, please try again later.`)); // haha screw you
			console.log(err);
			setTimeout(() => {
				require("./index").menu();
			}, 3500);
		});
}



async function selectAlgo(minerData, GPUs) {
	console.clear();
	console.log(chalk.bold.cyan(`Configure your miner`))
	presence.configuring("Selecting algorithm");
	let algoList = [];
	if (minerData.algos.includes("randomx")) algoList.push({ name: "randomx", value: "randomx" });
	const gpuSupportsAlgo = minerData.algos.filter(algo => GPUs.filter(gpu => gpu.algos.includes(algo)).length > 0)
	for (let i = 0; i < gpuSupportsAlgo.length; i++) {
		if (gpuSupportsAlgo[i] == "randomx") continue;
		let notSupportedByAll;
		for (let j = 0; j < GPUs.length; j++) {
			if (!GPUs[j].algos.includes(gpuSupportsAlgo[i])) {
				notSupportedByAll = true;
			}
		}
		if (notSupportedByAll == true) {
			algoList.push({ name: `${gpuSupportsAlgo[i]} ${chalk.yellow("(Not supported by some of your GPUs)")}`, value: gpuSupportsAlgo[i] });
		} else {
			algoList.push({ name: gpuSupportsAlgo[i], value: gpuSupportsAlgo[i] });
		}
	}
	const algo = await inquirer.prompt({
		type: "list",
		name: "algo",
		message: "Choose an algorithm",
		choices: [...algoList, {
			name: chalk.bold.redBright("Go back"),
			value: "go_back"
		}]
	});
	if (algo.algo == "go_back") {
		console.clear();
		return run();
	}
	lastMiner.algo = algo.algo

	selectPool(minerData, algo.algo);
}

async function selectPool(minerData, algo) {
	console.clear();
	console.log(chalk.bold.cyan(`Configure your miner`))
	presence.configuring("Selecting pool");
	spinner = ora("Loading pool list").start();
	fetch(`https://raw.githubusercontent.com/EvadeMaster/UnstableBind/${isDev ? "dev" : "Vanilla"}/internal/pools.json`)
		.then(res => res.json())
		.then(async poolData => {
				spinner.stop();
				const poolList = [];
				for (let i = 0; i < Object.keys(poolData).length; i++) {
					let pooly = poolData[Object.keys(poolData)[i]];
					if (Object.keys(pooly.algos).includes(algo)) {
						if (pooly.name != "Prohashing") {
							poolList.push({ name: pooly.name, value: pooly });
						} else if (config.id && config.id.length > 1) {
							poolList.push({ name: pooly.name, value: pooly });
						}
					}
				}
				var pool;
				if (poolList.length > 1) {
					console.log(`Don't know which one to pick? Read ${chalk.bold(`MINERS.md`)} on the GitHub!`)
				pool = await inquirer.prompt({
					type: "list",
					name: "pool",
					message: "Choose a pool",
					choices: poolList
				});
			} else {
				console.log(chalk.green(`Only one pool available with these settings, using ${poolList[0].name}`))
			}
			presence.configuring("Selecting pool region (just pick the closest one)");
			const regionList = [];
			const poolsy = poolList.length > 1 ? pool.pool : poolList[0].value;
			for (let i = 0; i < poolsy.regions.length; i++) {
				regionList.push({ name: poolsy.regions[i], value: poolsy.regions[i] });
			}
			var region
			lastMiner.pool = poolsy
			if(poolsy.name == "NiceHash") {
				region = await inquirer.prompt({
					type: "list",
					name: "region",
					message: "Choose a region",
					choices: [{
						"name": chalk.yellow.bold("Automatic"),
						"value": "automatic"
					}, ...regionList]
				});
			} else {
				region = await inquirer.prompt({
					type: "list",
					name: "region",
					message: "Choose a region",
					choices: [...regionList]
				});
			}
			if(region.region == "automatic") {
				let autoRegionCacheData;
				try {
					autoRegionCacheData = JSON.parse(fs.readFileSync(`${dataDirectory}/autoregion-cache.json`));
				} catch {
					fs.writeFileSync(`${dataDirectory}/autoregion-cache.json`, JSON.stringify({}));
					autoRegionCacheData = {};
				}
				async function calculateBestRegion(silent = false) {
					if(!silent) var spinner = ora("Calculating ping").start();
					let pings = [];
					let borkedRegion = false;
					for await(regionToTest of regionList) {
						var totalPing = 0;
						var failedAttempts = 0;
						for(let i=0;i<5;i++){
							let domain = poolsy.algos[algo].host.split("://")[1].split(":")[0].replace("REGION", regionToTest.value);
							if(!silent) spinner.text = `Pinging ${domain} (${i+1}/5)`
							let timeStarted = Date.now();
							try {
								await fetch("http://" + domain);
							} catch (e) {
								if(e.code == "ECONNRESET" || e.code == "ECONNCLOSED") {} else {
									failedAttempts += 1;
									if(failedAttempts == 5) {
										borkedRegion = true;
										break;
									} else {
										borkedRegion = false;
									}
								}
							}
							totalPing += Date.now() - timeStarted
						}
						if(borkedRegion == true) continue;
						pings.push({
							region: regionToTest.value,
							ping: Math.round(totalPing/5)
						})
					}
					if(pings.length != 0) {
						region.region = pings.sort((a, b) => a.ping - b.ping)[0].region;
						if(!silent) spinner.succeed("Using " + region.region + " (" + pings.sort((a, b) => a.ping - b.ping)[0].ping + "ms)");
						fs.writeFileSync(`${dataDirectory}/autoregion-cache.json`, JSON.stringify({
							...autoRegionCacheData,
							[poolsy.name]: region.region
						}));
						if(!silent) await (new Promise((res) => setTimeout(res, 1500)));
					} else if(!silent) {
						console.log(pings)
						spinner.stop();
						console.log("It seems like no regions are available right now.\nTry using a different configuration, or try again later.");
						setTimeout(() => {
							require("./index").menu();
						}, 3500);
					}
				}
				if(fs.existsSync(`${dataDirectory}/autoregion-cache.json`) && autoRegionCacheData[poolsy.name]) {
					region.region = autoRegionCacheData[poolsy.name];
					lastMiner.region = region.region
					calculateBestRegion(true);
				} else {
					await calculateBestRegion();
				}
				lastMiner.region = region.region;
				prepStart(minerData, algo, poolsy, region.region);
			} else {
				lastMiner.region = region.region;
				prepStart(minerData, algo, poolsy, region.region);
			}
		}).catch(err => {
			spinner.fail(chalk.bold.red(`Could not select a pool, please try again later.`));
			console.log(err);
			setTimeout(() => {
				require("./index").menu();
			}, 3500);
		});
}

async function prepStart(minerData, algo, pool, region, advancedCommands, quick=false) {
	if (advancedCommands == undefined) advancedCommands = ""
	console.clear();
	let saladMining = new Promise((resolve, reject) => {
		if (process.platform == "win32") {
			try {

				let processes = execSync("tasklist").toString();
				const saladMiners = [
					"xmrig",
					"t-rex",
					"ccminer",
					"PhoenixMiner",
					"miner.exe"
				];
				resolve(saladMiners.some(saladMiner => {
					if (processes.includes(saladMiner)) {
						return true;
					} return false;
				}));
			} catch {
				resolve(false);
			}

	} else {
		resolve(false);
	}});
	console.log(chalk.bold.cyan(`Configure your miner`))
	presence.configuring("About to start!");
	if (advancedCommands.length > 0) {
		console.log("Current Advanced Commands:")
		console.log(advancedCommands)
	}
	const startNow = await inquirer.prompt({
		type: "list",
		name: "startNow",
		message: "Start miner now?",
		choices: [{
				name: "Yes",
				value: "y"
			},
			{
				name: "No",
				value: "n"
			},
			{
				name: "Set advanced commands",
				value: "advanced"
			}
		]
	});
	switch (startNow.startNow) {
		case "y":
			if(!quick) saveLast({
				...lastMiner,
				"advancedCommands": advancedCommands
			});
			presence.mine(minerData.miner, algo, pool.name)
			// Check if miner is already running in salad using child processes to run "tasklist" if on windows.
			if(await saladMining) {
				console.log(chalk.bold.red(`It seems like you are mining using a miner already! It is not recommended to use 2 miners at once.`));
				await inquirer.prompt({
					type: "input",
					name: "done",
					message: "Press enter when you have stopped mining in another miner, or if you just want to proceed."
				});
			}

			startMiner(minerData, algo, pool, region, advancedCommands);
			break;
		case "n":
			require("./index").menu();
			break;
		case "advanced":
			let args = "";
			async function promptForAdvancedArgs() {
				console.log("To exit, just press enter without typing anything.");
				const advancedCommandsy = await inquirer.prompt({
					type: "input",
					name: "advancedCommands",
					message: "Enter arguments for miner",
				});
				if (advancedCommandsy.advancedCommands != "") {
					let saveCommand = await inquirer.prompt({
						type: "confirm",
						default: "Y",
						name: "saveArgs",
						message: "Would you like to save the advanced args?"
					});
					if (saveCommand.saveArgs) {
						let name;
						async function askName() {
							name = await inquirer.prompt({
								type: "input",
								message: "What name would you like to use?",
								name: "name",
							});
							if (data[name.name]) {
								if (!(await inquirer.prompt({
										type: "confirm",
										message: "This name already exists, do you want to overwrite it?",
										name: "overwrite",
										default: false
									})).overwrite) return await askName();
							}
						}
						await askName();

						if (name.name != "") fs.writeFileSync(`${dataDirectory}/saved-args.json`, JSON.stringify({
							...data,
							[name.name]: {
								data: advancedCommandsy.advancedCommands
							}
						}))
					}
					args = advancedCommandsy.advancedCommands;
				} else args = "";
			}
			if (!fs.existsSync(`${dataDirectory}/saved-args.json`)) fs.writeFileSync(`${dataDirectory}/saved-args.json`, JSON.stringify({}));
			let data;
			try {
				data = JSON.parse(fs.readFileSync(`${dataDirectory}/saved-args.json`))
			} catch (err) {
				let resetArgs = await inquirer.prompt({
					type: "confirm",
					name: "resetSavedArgs",
					message: "The saved-args.json seems to be corrupted! If you have edited this please confirm that it is valid JSON. Would you like to reset the saved args? Please note that all of your saved advanced args will be lost!",
					default: "y"
				});
				if (resetArgs.resetSavedArgs) {
					fs.writeFileSync(`${dataDirectory}/saved-args.json`, JSON.stringify({}));
					console.log(chalk.bold.green("Successfully reset!"));
					data = JSON.parse(fs.readFileSync(`${dataDirectory}/saved-args.json`))
				}
			}
			if (Object.keys(data).length != 0) {
					let arg = await inquirer.prompt({
						type: "list",
						choices: [...Object.keys(data).map((arg) => {
							return {
								name: arg,
								value: arg
							}
						}), {
							"name": chalk.bold.greenBright("Other"),
							"value": "_saladbind_other"
						}],
						name: "argName",
						message: "Which saved arg do you want to use?"
					});
					if(arg.argName == "_saladbind_other") {
						await promptForAdvancedArgs();
					} else args = data[arg.argName].data;
			} else await promptForAdvancedArgs();
			prepStart(minerData, algo, pool, region, args);
			break;
	}
}

async function startMiner(minerData, algo, pool, region, advancedCommands) {
	console.clear();
	console.log(`${chalk.bold.greenBright(`Starting ${minerData.miner}!`)}\nThe miner might take a few seconds to start, so please wait.\nPress CTRL+C to stop the miner and return to the main menu at any time.\n`);
	console.log(`Miner version: ${minerData.version}\nAlgorithm: ${algo}\nPool: ${pool.name} (${region})\nFacts: You are cool!\n`);
	let temp = await si.osInfo();
	let temp2 = await si.graphics();
	let hasAMD = false;
	for(let o = 0; o < temp2.controllers.length;o++) {
		if (temp2.controllers[o].vendor == "AMD" || temp2.controllers[o].vendor == "Advanced Micro Devices, Inc.") {
			if(temp2.controllers[o].vram > 2000) hasAMD = true;
		}
	}
	let userPlatform = temp.platform;
	if (userPlatform == "Windows") userPlatform = "win32";
	let wallet
	switch(pool.name) {
		case "Ethermine":
			wallet = "0x6ff85749ffac2d3a36efa2bc916305433fa93731" // i swear if this isnt the right address i will kill bob's mother update: bob your mother is safe.
		break;
		case "NiceHash":
			wallet = "33kJvAUL3Na2ifFDGmUPsZLTyDUBGZLhAi" // tested to work i swear
		break;
		case "Prohashing":
			wallet = "salad" //seems to be the username atleast currently
			if (region == "europe") {
				region = "eu.";
			} else if (region == "us") {
				region = "";
			}
		break;
	}
	let defaultArgs = {}
	if(minerData.miner == "TeamRedMiner" && pool.name == "Ethermine") {
		pool.algos[algo].host = pool.algos[algo].host.replace("ethproxy+ssl", "stratum+ssl");
	}
	if(minerData.miner == "lolMiner" && pool.name == "Ethermine") {
		pool.algos[algo].host = pool.algos[algo].host.replace("ethproxy+ssl://", "");
	} else {
		pool.algos[algo].host = pool.algos[algo].host.replace("--tls on", "");
	}
	if(pool.name == "Prohashing") {
		if(minerData.parameters.wallet == "PHOENIX") {
			if(algo == "ethash") {
				defaultArgs.wallet = `-wal ${wallet}`
				defaultArgs.algo = `-coin eth`
				defaultArgs.pass = `-pass o=${config.id},n=${config.id}`
				defaultArgs.pool = `${minerData.parameters.pool} ${pool.algos[algo].host.replace("REGION", region)}${minerData.miner == "PhoenixMiner" && hasAMD ? " -clKernel 0 " : ""}${minerData.miner == "lolMiner" ? " --pers BgoldPoW " : ""}`
			} else if(algo == "etchash") {
				defaultArgs.wallet = `-wal ${wallet}`
				defaultArgs.algo = `-coin etc`
				defaultArgs.pass = `-pass o=${config.id},n=${config.id}`
				defaultArgs.pool = `${minerData.parameters.pool} ${pool.algos[algo].host.replace("REGION", region)}${minerData.miner == "PhoenixMiner" && hasAMD ? " -clKernel 0 " : ""}${minerData.miner == "lolMiner" ? " --pers BgoldPoW " : ""}`
			}
		} else {
			defaultArgs.wallet = `${minerData.parameters.wallet} ${wallet}`
			if (minerData.parameters.algo != "") {
				defaultArgs.algo = `${minerData.parameters.algo} ${minerData.miner == "lolMiner" ? algo == "beamv3" ? "BEAM-III" : algo.toUpperCase() : algo}`
			} else {
				defaultArgs.algo = ""
			}
			defaultArgs.pool = `${minerData.parameters.pool} ${pool.algos[algo].host.replace("REGION", region)}${minerData.miner == "lolMiner" && algo == "EQUI144_5" ? " --pers BgoldPoW " : ""}${minerData.miner == "xmrig" && algo == "kawpow" ? " --no-cpu --opencl " : ""}`
			defaultArgs.pass = `${minerData.parameters.pass} o=${config.id},n=${config.id}`
		}
	} else {
	defaultArgs.pass = ""
	if (minerData.parameters.wallet != "") { // poo
		if(minerData.parameters.wallet == "PHOENIX") {
			if(algo == "ethash") {
				defaultArgs.wallet = `-wal ${wallet}.${config.minerId}`
				defaultArgs.algo = `-coin eth`
				defaultArgs.pool = `${minerData.parameters.pool} ${pool.algos[algo].host.replace("REGION", region)}${minerData.miner == "PhoenixMiner" && pool.name == "NiceHash" ? " -proto 4 " : ""}${minerData.miner == "PhoenixMiner" && hasAMD ? " -clKernel 0 " : ""}${minerData.miner == "lolMiner" ? " --pers BgoldPoW " : ""}`
			} else if(algo == "etchash") {
				defaultArgs.wallet = `-wal ${wallet}.${config.minerId}`
				defaultArgs.algo = `-coin etc`
				defaultArgs.pool = `${minerData.parameters.pool} ${pool.algos[algo].host.replace("REGION", region)}${minerData.miner == "PhoenixMiner" && pool.name == "NiceHash" ? " -proto 4 " : ""}${minerData.miner == "PhoenixMiner" && hasAMD ? " -clKernel 0 " : ""}${minerData.miner == "lolMiner" ? " --pers BgoldPoW " : ""}`
			}
		} else {
			defaultArgs.wallet = `${minerData.parameters.wallet} ${wallet}.${config.minerId}${minerData.miner == "T-Rex" ? ` -w ${config.minerId} ` : ""}`
			if (minerData.parameters.algo != "") {
				defaultArgs.algo = `${minerData.parameters.algo} ${minerData.miner == "lolMiner" ? algo == "beamv3" ? "BEAM-III" : algo.toUpperCase() : algo}`
			} else {
				defaultArgs.algo = ""
			}
			defaultArgs.pool = `${minerData.parameters.pool} ${pool.algos[algo].host.replace("REGION", region)}${minerData.miner == "PhoenixMiner" && pool.name == "NiceHash" ? " -proto 4 " : ""}${minerData.miner == "PhoenixMiner" && hasAMD ? " -clKernel 0 " : ""}${minerData.miner == "lolMiner" && algo == "EQUI144_5" ? " --pers BgoldPoW " : ""}${minerData.miner == "xmrig" && algo == "kawpow" ? " --no-cpu --opencl " : ""}`
		} //i grabbed this from an older build because i accidentally removed a part so it didnt have it yet im a idiot
	} else {
		let poolUrl = pool.algos[algo].host
		let poolScheme = poolUrl.split("://")[0]
		poolScheme = poolScheme.replace("stratum", "stratum2")
		poolScheme = poolScheme.replace("ethproxy", "stratum1")
		let restOfPool = poolUrl.split("://")[1].replace("REGION", region)
		defaultArgs = {
			"algo": "",
			"pool": `${minerData.parameters.pool} ${poolScheme}://${wallet}.${config.minerId}@${restOfPool}`,
			"wallet": "",
			"pass": ""
		} //thats behind the if statement
		if (minerData.parameters.algo != "") {
			defaultArgs.algo = `${minerData.parameters.algo} ${algo}`
		}
	}
}
	let timeStarted = Date.now();
	function stopped() {
		let currentTime = Date.now();
		if((timeStarted + 10000) > currentTime) { // miner stopped within 10 seconds of starting
			console.log(chalk.blueBright.bold(`If you did not stop the miner, it ${chalk.bold("MIGHT")} be your AntiVirus. Please whitelist the data folder located in ${dataDirectory}.\n`))
		}
	}
	if(advancedCommands.length > 0) { // didnt workkkk
		// i turned them into a string, it's because of inquirer remember, like when we have to do pool.pool
		// *****user has set advanced commands*****					ok then???
		let finalArguments = []
		//console.log(advancedCommands, minerData.parameters.pass)
		if(!advancedCommands.includes(minerData.parameters.pool)) {
			finalArguments.push(defaultArgs.pool)
		}
		if(!advancedCommands.includes(minerData.parameters.wallet)) {
			finalArguments.push(defaultArgs.wallet) //why null WHY NULL TELLL MMEEE
		}
		if(!advancedCommands.includes(minerData.parameters.algo)) {
			finalArguments.push(defaultArgs.algo)
		}
		if(!advancedCommands.includes(` ${minerData.parameters.pass}`)) {
			finalArguments.push(defaultArgs.pass)
		}
		//advancedCommands.split(" ").forEach(arg => {
		//	finalArguments.push(arg);
		//}); time for a hacky fix!

		finalArguments.push(advancedCommands)
		let miner = spawn(`cd ${userPlatform == "win32" ? "/D " : ""}"${dataDirectory}/miners/${minerData.miner}-${minerData.version}" && ${userPlatform == "linux" || userPlatform == "darwin" ? "./" : ""}${minerData.parameters.fileName}`, finalArguments, {stdio: 'inherit', shell: true, env : { FORCE_COLOR: true }}) //its an array dumbass
		miner.once('close', (code) => {
			console.log(`\nMiner stopped!\n`);
			stopped();
			// this is here to prevent a shit ton of listeners being added
			// which in turn would cause a memory leak (sort of)
			miner.removeAllListeners() 
			require("./index").menu(false);
		});
		miner.once('SIGINT', () => {
			console.log(`\nMiner stopped!\n`);
			stopped();
			miner.removeAllListeners()
			require("./index").menu(false);
		});
		process.once('SIGINT', () => {
			console.log(chalk.yellow("Returning to SaladBind menu..."));
		});
	} else {
		
		let miner = spawn(`cd ${userPlatform == "win32" ? "/D " : ""}"${dataDirectory}/miners/${minerData.miner}-${minerData.version}" && ${userPlatform == "linux" || userPlatform == "darwin" ? "./" : ""}${minerData.parameters.fileName}`, [defaultArgs.pool, defaultArgs.algo, defaultArgs.wallet, defaultArgs.pass], {stdio: 'inherit', shell: true, env : { FORCE_COLOR: true }})
		miner.once('close', (code) => {
			console.log(`\nMiner stopped!\n`);
			stopped();
			miner.removeAllListeners()
			require("./index").menu(false);
		});
		miner.once('SIGINT', () => { // Bukky be Stupid
			console.log(`\nMiner stopped!\n`);
			stopped();
			miner.removeAllListeners()
			require("./index").menu(false);
		});// nvm
		process.once('SIGINT', () => {
			console.log(chalk.yellow("Returning to SaladBind menu...")); // hadnt saved lol
			
		}) 
		// This spaghetti is powered by https://stackoverflow.com/a/44851254
	}
} 

function saveLast(args){
fs.writeFileSync(`${dataDirectory}/last.json`, JSON.stringify({
		algo: args.algo,
		pool: args.pool,
		region: args.region,
		data: args.data,
		advancedCommands: args.advancedCommands
	}));
};

async function quick(cli=false){
	let details;
	try{
		details = JSON.parse(fs.readFileSync(`${dataDirectory}/last.json`))
		lastMiner = details;
		presence.mine(details.data.miner, details.algo, details.pool)
		if(!cli) prepStart(details.data, details.algo, details.pool, details.region, details.advancedCommands, true);
		if(cli) startMiner(details.data, details.algo, details.pool, details.region, details.advancedCommands);
	} catch {
		console.log(chalk.red("Error while reading/parsing last.json"));
		await inquirer.prompt([{
			type: 'confirm',
			name: 'delete',
			message: chalk.yellow("Delete the corrupt file?"),
			default: false
		}]).then(function(answers) {
			if (answers.delete) {
				try {
					fs.unlinkSync(`${dataDirectory}/last.json`);
					console.log(chalk.red("File deleted"));
				} catch {
					console.log("Could not delete the file, you may delete 'last.json' manually from the 'data' folder (if it exists).")
				}
			}
		});
		console.log("Returning to menu in 3 seconds")
		setTimeout(function(){
			require("./index").menu(true)
		},3000)
	}

}
module.exports = { 
	run,
	quick
};
