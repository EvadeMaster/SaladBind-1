## ⚠️ Notice
### When will UnstableBind reach end-of-life?
UnstableBind will reach a maturity state and will be archived on January 1st, 2023.


### SaladBind Wiki is revived for historical purposes under CC-BY-SA 4.0 (same as WikiLit)

***This application is retired and not affiliated with Salad Technologies.***

This repo will occasionally receive updates to the list of miners so they aren't too out-of-date. **You can do this yourself, too. Just go to /internal/miners.json, update the download link and variable "version" for the miner you want to update and submit a pull request. I will probably approve it within the day.**

Support for this software is virtually non-existant at this point. You can use '-d' as a command line argument to debug independently.

*I* did **not** create this application, do not contact me for support (besides making minor tweaks)!

The little support there is can be found at the [FAQ](https://github.com/EvadeMaster/UnstableBind/wiki/FAQ).

# SaladBind

#### This branch is Short-Term-Support (Maintanances, Pools, Miners, Support Services) until January 1st 2023

If you want to contribute to UnstableBind, please read the [contributing guide](https://github.com/EvadeMaster/UnstableBind/wiki/Contributing). Do **NOT** make your own UnstableBind version unless you have a good reason to!

SaladBind & UnstableBind is pretty much abandoned, nobody really works on it.

## Table of Contents

[Features](#Features) <br>
[Installation](#Installation) <br>
[Configuration](#Configuration) <br>
[Miner Setup Guide](#Miner-Setup-Guide) <br>
[Compiling](#Compiling)

SaladBind is no longer made by LIT Devs, or associated with LIT Devs. Don't bother them about it, this is a fork by a 3rd party.

If you need support, see the [SaladBind FAQ](https://github.com/EvadeMaster/UnstableBind/wiki/FAQ).

## Features

- Switch between miners, pools, and algorithms
- Shows only miners and algorithms that are supported by your GPU
- Easy to use interface
- Built-in configuration editor
- Automatic updates for the miners and the app itself
- Three methods of setting up UnstableBind: scanning for the Rig ID, getting it from your Salad Auth token, and entering your Rig ID manually
- Discord Rich Presence
- No extra programs needed
- Set advanced miner arguments
- Save your advanced miner arguments
- Immediately restart mining with old settings using a command line argument.

## Installation

If my pre-compiled exe's don't work for whatever reason, compile the repo yourself.
If they do work, you should probably compile it yourself anyway.

### Windows

Download the `saladbind-win.exe` from [GitHub Releases](https://github.com/EvadeMaster/UnstableBind/releases/latest).

### macOS and Linux

Download the `saladbind-macos`/`saladbind-linux` file from [GitHub Releases](https://github.com/EvadeMaster/UnstableBind/releases/latest). For these platforms, you'll need to run UnstableBind from the terminal, due to how UnstableBind works. If you need help with using the terminal, don't be afraid to Google a bit - you'll have to use `cd` to be in the same folder that UnstableBind is in.

Use these commands to start UnstableBind, for macOS or Linux respectively:

```bash
chmod +x ./saladbind-macos # You only need to run this once
./saladbind-macos
```

```bash
chmod +x ./saladbind-linux # You only need to run this once
./saladbind-linux
```

## Configuration

Once you start UnstableBind for the first time, it will ask you if you want to enable Discord Rich Presence.

Then, it'll prompt you to enter your mining details.

You can do this by letting UnstableBind search your log file, entering your Salad Auth token, or enter your Rig ID manually.

### Automatic (Read from Salad logs) (Recommended)

This method is the most convenient.
UnstableBindwill search your Salad's log file for your Rig ID and save it automatically.

1. Make sure that "Override GPU Compatibility Detection" is enabled in your Salad settings. If this is disabled, Salad might not log your Prohashing details.
2. Start mining with the Salad app normally for 5-15 minutes (the "Chopping" stage)
3. Choose Automatic on UnstableBind (Read from Salad logs)

### Automatic (Get with Salad Auth token)

You will be prompted to enter your access token.
To get your access token, log in to [https://salad.com/store](https://salad.com/storeo) and follow these steps depending on your browser:

#### Chromium and derivatives

1. Click the lock symbol in the address bar
2. Open `Cookies` and uncollapse `app-api.salad.io`
3. Look for `sAccessToken` and copy it (right click and click `Select all` as it is very long)
  ![image](https://user-images.githubusercontent.com/93124920/202850854-4133c465-f50c-45a8-8c65-c2b4b7199a76.png)
4. Paste the token into the terminal (on Windows, right-click in the UnstableBind window to paste)

#### Firefox

This method will not work at all if `Total Cookie Protection` is enabled, [Learn about it here!](https://support.mozilla.org/en-US/kb/introducing-total-cookie-protection-standard-mode)

1. Go to [browser privacy settings](about:preferences#privacy)
2. Set Browser Privacy to `Custom` and set Cookies to `Cross-site tracking cookies` [⚠️ You may need to log in to Salad again!](https://salad.com/store)
  ![image](https://user-images.githubusercontent.com/93124920/202851351-a20ab4ef-207a-4ef5-bd74-00034aefc973.png)
3. Go to [app-api.salad.io/api/v1/profile/referral-code](https://app-api.salad.io/api/v1/profile/referral-code)
4. Open the devtools by pressing F12 or right-click and select `Inspect`
5. Click on `Storage` and make sure that `Cookies` is uncollapsed
  ![image](https://user-images.githubusercontent.com/93124920/202851412-0d259fd4-1928-4b59-8d7a-0fec05285a9f.png)
6. Double click the value box next to `sAccessToken` and copy it
7. Paste the token into the terminal (on Windows, right-click in the UnstableBind window to paste)
8. Go to [browser privacy settings](about:preferences#privacy) and set Browser Privacy to `Standard`

### Manual

⚠️ Salad 1.0 no longer gives the required IDs to mine with Nicehash and Ethermine in the logs, you'll have to use Salad [0.5.6](https://github.com/SaladTechnologies/salad-applications/releases/tag/0.5.6) to get the IDs required for these pools.

This method is the most consistent and reliable.

1. Start mining with the Salad app normally, if you have already been mining for over ~3h you need to restart Salad
2. Mine for around 5-15 minutes (the "Chopping" stage)
3. Find your Salad logs. A guide can be found [here](https://support.salad.com/hc/en-us/articles/360042215512-How-To-Find-Your-Salad-Log-Files)
4. Search for "rig ID" in the main.log file and copy it. Both the Ethermine worker ID and NiceHash rig ID are supported
5. Paste the Rig ID into the terminal (on Windows, right-click in the UnstableBind window to paste) Next, look for a line in the logs that looks like <br>`PhoenixMiner.exe -rmode 0 -rvram 1 -log 0 -pool stratum+tcp://prohashing.com:3339 -pool2 stratum+tcp://eu.prohashing.com:3339 -wal salad -pass o=006a68e5-c33c-40f0-9531-fb216829612f,n=006a68e5-c33c-40f0-9531-fb216829612f` <br>
  Copy the part after `o=` until the `,n=` as demonstrated here: `006a68e5-c33c-40f0-9531-fb216829612f`
6. Paste the Prohashing id into the terminal (on Windows, right-click in the UnstableBind window to paste)

**If you don’t want to use the Prohashing pool, you can skip steps 6 & 7**<br>
However, using the Prohashing pool is recommended when possible.

You are now ready to go!

### Miner Setup Guide

If you don't know what miner, algorithm or pool to pick, see the [handy guide](https://web.archive.org/web/20220216041732/https://wiki.litdevs.org/wiki/SaladBind/Miner_guide).

## Command line arguments

UnstableBind offers some command line arguments.

- `-d` for dumping debug data
- `-l` for starting mining with the latest settings

## Compiling

You can and probably should compile UnstableBind yourself. You'll need to install [Node.js](https://nodejs.org/).

1. Clone the repository
2. Open a terminal in the folder and run `npm install`
3. Run `npm run compile` (This may display a warning, but it's safe to ignore it)
4. Your compiled binaries will be in the `bin` folder
