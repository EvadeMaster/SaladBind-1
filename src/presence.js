const RPC = require('discord-rpc');
let client = new RPC.Client({ transport: 'ipc' })
const fs = require("fs");
var presenceEnabled = false;
const { configFile } = require("./setup");
const pjson = require('../package.json');

if (!fs.existsSync(configFile)) {
	config = { presenceEnabled: false }
} else {
	let rawdata = fs.readFileSync(configFile);
	config = JSON.parse(rawdata)
}


if (config.discordPresence == true) { //If the user opts-in to having the Rich Presence then try connent to the rich presence application
	try {
		client.login({
			clientId: '1002648284185243758'
		});
	} catch (error) { // Ignoring the error since we dont want SaladBind dying when the user doesn't have Discord open
	}
}

function presence(details, state, time, large_image, large_text, small_image, small_text) {
	if (presenceEnabled == true) {
		activity = {
			pid: process.pid,
			activity: {
				details: details,
				state: state,
				timestamps: {},
				assets: {
					large_image: large_image,
					large_text: large_text,
					small_image: small_image,
					small_text: small_text
				},
				buttons: [
					{ label: "Download SaladBind", url: "https://github.com/EvadeMaster/UnstableBind/releases" },
				]
			}
		}
		if (time != undefined && time != null) {
			activity.activity.timestamps = { start: time }
		}
		try {
			client.request('SET_ACTIVITY', activity);
		} catch {
			
		}

	}
}

module.exports = {
	disconnect: function() {
		if (config.presenceEnabled == true) {
			client.clearActivity();
			presenceEnabled = false;
		}
	}, //Not technically disconnecting but idfk its basically the same
	enable: function() { presenceEnabled = true; },
	mainmenu: function() { presence("In main menu", "   ", null, "icon", `v${pjson.version}`, "idle", "Not mining") },
	configuring: function(state) { presence("Configuring miner", state, null, "icon", `v${pjson.version}`, "idle", "Not mining") },
	mine: function(miner, algo, pool) { presence(`Mining with ${miner}`, `Using ${algo} on ${pool}`, Date.now(), "icon", `v${pjson.version}`, "mining", "Mining") },
	state: client
}
