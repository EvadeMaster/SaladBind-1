# SaladBind

<a href="https://gitmoji.dev">
  <img src="https://img.shields.io/badge/gitmoji-%20😜%20😍-FFDD67.svg?style=flat-square" alt="Gitmoji">
</a>

## ⚠️ Notice
This repository will be reaching End-of-Life, (DAG, Security fixes until Jan 1st 2024)

***This application is retired and not affiliated with Salad Technologies.***

The little support there is can be found at the [FAQ](https://github.com/EvadeMaster/UnstableBind/wiki/FAQ).

#### This branch is LTS (Maintanances, DAG, Security) until January 1st 2024

- Latest stable version: <img alt="GitHub release (latest SemVer)" src="https://img.shields.io/github/v/release/EvadeMaster/UnstableBind?style=flat-square">
- Latest unstable version: <img alt="GitHub release (latest SemVer including pre-releases)" src="https://img.shields.io/github/v/release/EvadeMaster/UnstableBind?include_prereleases&style=flat-square">
- Latest development version: https://github.com/EvadeMaster/UnstableBind/actions

If you want to contribute to UnstableBind, please read the [contributing guide](https://github.com/EvadeMaster/UnstableBind/wiki/Contributing). Do **NOT** make your own UnstableBind version unless you have a good reason to!

## Table of Contents

[Features](#Features) <br>
[Installation](#Installation) <br>
[Configuration](#Configuration) <br>
[Miner Setup Guide](#Miner-Setup-Guide) <br>
[Compiling](#Compiling)

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

## Operating System requirement
<details>
<summary>Operating System</summary>

 > Windows: Compatible with 64-bits
 > Linux: Compatible with 64-bits
 > macOS: Compatible with ARM64 or 64-bits
 
* Windows
  * ⚠️ Windows 7, Support dropped in January 2020
  * ⚠️ Windows 8 & 8.1 (excluding Windows 8 RT & Windows 8.1 RT), Support dropped in January 2023
  * ✅ Windows 10 & 11
  * ⚠️ Windows Server 2012 R2, Support will end in October 2023
  * ✅ Windows Server 2016
  * ✅ Windows Server 2019
  * ✅ Windows Server 2022
  
* Linux
  * Any Linux distribution with that's compatible with Node.js 18 or above

* macOS
  * ✅ macOS 13 Ventura
  * ✅ macOS 12 Monterey
  * ❓ macOS 11 Big Sur
  * ❓ macOS 10.15 Catalina

</details>


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

Moved to https://github.com/EvadeMaster/UnstableBind/wiki/Miner-Details-Configuration

### Miner Setup Guide

If you don't know what miner, algorithm or pool to pick, see the [handy guide](https://github.com/EvadeMaster/UnstableBind/wiki/Miner-guide).

## Command line arguments

UnstableBind offers some command line arguments.

- `-d` for dumping debug data
- `-l` for starting mining with the latest settings

## Compiling

You can and probably should compile UnstableBind yourself. You'll need to install [Node.js](https://nodejs.org/). Highly recommended that you read [Contributing guide](https://github.com/EvadeMaster/UnstableBind/wiki/Contributing) before contributing

1. Clone the repository
2. Open a terminal in the folder and run `npm install`
3. Run `npm run compile` (This may display a warning, but it's safe to ignore it)
4. Your compiled binaries will be in the `bin` folder
