const ora = require('ora');
const chalk = require('chalk');
const inquirer = require('inquirer');
const fs = require('fs');
const path = require('path');
var firstTime = false;
const envPaths = require('env-paths');
const saladbind_directory = (__dirname.startsWith("/snapshot") || __dirname.startsWith("C:\\snapshot")) ? process.execPath.substring(0, process.execPath.lastIndexOf(path.sep)) : __dirname;
const dataDirectory = envPaths('SaladBind', { suffix: "" }).data;
const configFile = `${envPaths('SaladBind', { suffix: "" }).config}/config.json`;

if (!fs.existsSync(envPaths('SaladBind', { suffix: "" }).config)) {
	fs.mkdirSync(envPaths('SaladBind', { suffix: "" }).config, { recursive: true });
}

async function run(clear = false) {
	let configData;
	if (clear) console.clear();
	if (!fs.existsSync(configFile)){
		firstTime = true;
	} else{
		configData = await JSON.parse(fs.readFileSync(configFile))
	}
	main(configData);
}

async function main(configData = {}) {
	console.clear()
	if (firstTime) {
		console.log(`${chalk.greenBright.bold("Welcome to SaladBind!")}
This is a program that makes it easier to select a miner, algorithm, and pool for Salad! 
All of the money you mine using SaladBind goes to Salad, and all Salad boosts and XP will work in SaladBind.
\n${chalk.yellow("Note that there is no support for SaladBind. Use at your own risk")}
		`);
		firstTime = false
		await miner()
		return
	}
	const prompt = await inquirer.prompt([{
		type: 'list',
		name: "settings",
		message: chalk.bold.cyan(`Configure SaladBind`),
		choices: [{
				name: `Update Miner Details ${configData.id != undefined || configData.minerId != undefined ? "" : chalk.bold.red("(Must be configured)")}`,
				value: "miner"
			},
			{
				name: `Discord RPC ${configData.discordPresence ? chalk.green("(Enabled)") : chalk.redBright("(Disabled)")}`,
				value: "discord"
			},
			{
				name: `Debug Settings`,
				value: "debug"
			},
			{
				name: `${firstTime ? chalk.greenBright("Finish") : chalk.redBright("Go Back")}`,
				value: "back"
			}
		]
	}]);
	if (prompt.settings == "back") {
		if(configData.minerId != undefined ){
			require("./index.js").menu(true);
		}
		else{
			run(true);
		}
	} 
	if (prompt.settings == "discord") {
		await toggleDiscord()
		return await run();
	} else if (prompt.settings == "debug") {
		debugMenu()
	} else if (prompt.settings == "miner") {
		miner()
	}
}

async function toggleDiscord() {
	let discordPresence;
	try {
		discordPresence = await JSON.parse(fs.readFileSync(configFile)).discordPresence;
	} catch {
		discordPresence = false;
	}
	await save("discordPresence", !discordPresence);
}
async function toggleBypassGpu() {
	let bypassGPUChecks;
	try {
		bypassGPUChecks = await JSON.parse(fs.readFileSync(configFile)).bypassGPUChecks;
	} catch {
		bypassGPUChecks = false;
	}
	await save("bypassGPUChecks", !bypassGPUChecks);
}
async function toggleSBbranch() {
	let dev;
	try {
		dev = await JSON.parse(fs.readFileSync(configFile)).dev;
	} catch {
		dev = false;
	}
	await save("dev", !dev);
}
async function miner(){
	const promptResult = await inquirer.prompt([{
		type: 'list',
		name: "useapi",
		message: "How would you like to provide your mining details? Recommend that you use (Get with Salad Auth token) option",
		choices: [{
				name: `Automatic ${chalk.yellow("(Read from Salad logs)")}`,
				value: "auto"
			},
			{
				name: `Automatic ${chalk.yellow("(Get with Salad Auth token)")}`,
				value: "api"
			}, {
				name: `Manual ${chalk.yellow("(Input worker ID manually)")}`,
				value: "manual"
			}, {
				name: `${chalk.redBright("Go Back")}`,
				value: "back"
			}
		]
	}]);
	if (promptResult.useapi == "back") {
		return run();
	}
	if (promptResult.useapi == "auto") {
		console.clear();
		function getIDFromLogs(filename) {
			let logPath;
			if (process.platform == "win32") {
				logPath = path.join(process.env.APPDATA, "Salad", "logs", filename);
			} else if (process.platform == "linux") {
				logPath = path.join(process.env.HOME, ".config", "Salad", "logs", filename);
			} else if (process.platform == "darwin") {
				logPath = path.join(process.env.HOME, "Library", "Logs", "Salad", filename);
			}
			let logFileContent;
			try {
				logFileContent = fs.readFileSync(logPath).toString();
			} catch (err) {
				console.log(chalk.bold.red(`An error occurred while reading the log file ${filename}, make sure that you have ran Salad and that SaladBind has permission to access it.`))
				return;
			}
			const rigIDRegex = /^NiceHash rig ID: [a-z0-9]{15}$/m;
			const idRegex = /o=[a-z0-9]{8}\-[a-z0-9]{4}\-[a-z0-9]{4}\-[a-z0-9]{4}\-[a-z0-9]{12}/
			let rigID = logFileContent.match(rigIDRegex);
			if (rigID) rigID = rigID.join(" ");
			if (rigID) rigID = rigID.split(": ")[1];
			let id = logFileContent.match(idRegex);
			if (id) id = id[0].split("=")[1];
			return {rigID, id};
		}
		let spinner = ora("Searching...").start();
		let idJSON = getIDFromLogs("main.log") ?? getIDFromLogs("main.old.log")
		let rigID = idJSON?.rigID;
		let id = idJSON?.id;
		if (!rigID) {
			spinner.fail()
			console.log(chalk.bold.red("Could not find your Rig ID! Please make sure that you have mined for at least 5 minutes using Salad's official application version 0.5.8 after restarting it."));
			setTimeout(() => {
				run(true)
			}, 3500);
			return;
		}
		if (!id) {
			spinner.fail()
			console.log(chalk.bold.red("Could not find your Prohashing ID! You can use the Automatic (Auth Token) method or manual instead."));
			let skipProhashing = await inquirer.prompt([{
				type: 'confirm',
				name: 'skipProhashing',
				message: `Continue without your Prohashing ID? ${chalk.yellow.bold("If you say yes, you cannot use the Prohashing pool which has several advantages.")}`,
				default: false
			}])
			if(skipProhashing.skipProhashing == false) {
				return await run(true);
			}
		}
		spinner.succeed();
		await save("id",id)
		await save("minerId",rigID)
		run(true)
	} else if (promptResult.useapi == "api") {
		console.clear();
		//auth
		console.log(chalk.green("We need the token to get your Wallet, Rig, and Prohashing ID automatically.\nThey will not be stored!\n\nIf you do not know how to find your token, please read this:\nhttps://bit.ly/saladbindconfig (copy this to read it)"))
		const auth = await inquirer.prompt([{
			type: 'input',
			name: 'auth',
			message: 'What is your Salad Access Token?',
			validate: function(input) {
				if (input.length == 778 || input == "cancel") {
					return true;
				}
				return `Your Salad Access Token is required for automatic mode. If you don't want this, type "${chalk.yellowBright("cancel")}" and select manual\nor select to get them automatically from the logs of Salad. ${chalk.yellow.bold("\nYou may be seeing this if you entered the token incorrectly, the token is 778 chars long!\nIf you do not know how to configure read this\nhttps://github.com/UhhhAaron/SaladBind#automatic-get-with-salad-auth-token (copy this to read it)")}`;
			}
		}]);
		if(auth.auth == "cancel") {
			return await run(true);
		}
		const spinner = ora("Getting miner details...").start();
		try {
			let minerDetails = await require("./getMachine").getInfo(auth.auth);
			spinner.succeed()
			await save("id",minerDetails.id)
			await save("minerId",minerDetails.minerId)
			console.clear();
			run(true)
		} catch (e) {
			spinner.fail();
			console.log(e);
			console.log(chalk.bold.red("Failed to get your Rig ID! This is most likely your auth code being expired, try refreshing app.salad.io in your browser and getting the token again."));
			console.log("Going back in 20 seconds");
			setTimeout(() => {
				run(true);
			}, 20000);
		}
	} else {
		console.clear();
		if(firstTime) {
			console.clear();
			console.log(chalk.greenBright.bold("Welcome to SaladBind!"));
		}
		console.log("You can enter NiceHash's Rig ID or Ethermine's Worker ID, both are the same.")
		const worker = await inquirer.prompt([{
			type: 'input',
			name: 'id',
			message: 'What is your Salad worker ID?',
			validate: function(input) {
				if (input.length == 15 || input == "cancel") {
					return true;
				}
				return `If you don't want to manually enter your Worker ID, type "${chalk.yellowBright("cancel")}" and select an automatic mode. ${chalk.yellow.bold("You may be seeing this if you entered the Worker ID incorrectly!")}`;
			}
		}]);
		console.clear();
		console.log(`You need to find a line similar to this in your logs: PhoenixMiner.exe -pool stratum+tcp://prohashing.com:3339 -wal salad -pass o=${chalk.red("e1660ed0-987f-43da-b973-840364455d94")},n=e1660ed0-987f-43da-b973-840364455d94`)
		console.log(`Copy the part shown in red from ${chalk.bold("your")} logs.\nIf you do not wish to use Prohashing or couldn't find it, just press Enter.`)
		const idPrompt = await inquirer.prompt([{
			type: 'input',
			name: 'id',
			message: 'What is your Prohashing ID?',
			validate: function(input) {
				if (input.length == 0 || input == "cancel" || input.match(/[a-z0-9]{8}\-[a-z0-9]{4}\-[a-z0-9]{4}\-[a-z0-9]{4}\-[a-z0-9]{12}/)) {
					return true;
				}
				return `If you don't want to manually enter your Worker ID, type "${chalk.yellowBright("cancel")}" and select an automatic mode. ${chalk.yellow.bold("You may be seeing this if you entered the Worker ID incorrectly!")}`;
			}
		}]);
		if(worker.id == "cancel") {
			return await run(true);
		}
		await save("id",idPrompt.id)
		await save("minerId",worker.id)
		run(true)
	}
}

async function debugMenu(){
	config = await JSON.parse(fs.readFileSync(configFile))
	if(config.debugWarning != true){
		await inquirer.prompt([
			{
			  name: "confirm",
			  type: "input",
			  message: chalk.green(`Editing debug settings can cause some unwanted behaviour. It is not recommended to change these settings if you don't know what you're doing. To continue please type \"These are advanced settings and I might break SaladBind"\n`),
			  validate: function(input) {
				  if (input.toLowerCase() != "these are advanced settings and i might break saladbind"){
						return `Please type "these are advanced settings and I might break Saladbind"`
		
				  }else{
					return true
				  }
			  } 
			  },
		  ])
  .then(async function(answers){
	  if(answers.confirm.toLowerCase() == "these are advanced settings and i might break saladbind"){
		console.clear()
		save("debugWarning", true)

	} else{
		console.clear()
		return debugMenu()
	}
    })
	}
	configData = await JSON.parse(fs.readFileSync(configFile))
	const prompt = await inquirer.prompt([{
		type: 'list',
		name: "settings",
		message: chalk.bold.cyan(`Debug Settings`),
		choices: [{
				name: `Bypass GPU Checks ${configData.bypassGPUChecks ? chalk.green("(Enabled)") : chalk.redBright("(Disabled)")}`,
				value: "bypass"
			},
			{
				name: `SaladBind Branch ${configData.dev ? chalk.redBright("(dev)") : chalk.green("(main)")}`,
				value: "toggleBranch"
			},
			{
				name: `${firstTime ? chalk.greenBright("Finish") : chalk.redBright("Go Back")}`,
				value: "back"
			}
		]
	}]);
	if (prompt.settings == "back") {
		run(true)
		} else if(prompt.settings == "bypass"){
			await toggleBypassGpu()
			console.clear()
			return debugMenu()
		} else if(prompt.settings == "toggleBranch"){
			await toggleSBbranch()
			console.clear()
			return debugMenu()
		}

}

async function save(setting, value){
		if (!fs.existsSync(dataDirectory)) {
			fs.mkdirSync(dataDirectory);
		}
		let config = {}
		if (fs.existsSync(configFile)){
			try{
				config = await JSON.parse(fs.readFileSync(configFile))
			} catch{
				config = {}
			}
		}
		config[setting] = value;
		fs.writeFileSync(configFile,JSON.stringify(config));
}

module.exports = {
	saladbind_directory, dataDirectory, configFile,
	run
}
