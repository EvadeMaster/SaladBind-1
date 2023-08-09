# SaladBind

<a href="https://gitmoji.dev">
  <img src="https://img.shields.io/badge/gitmoji-%20😜%20😍-FFDD67.svg?style=flat-square" alt="Gitmoji">
</a>

## ⚠️ Notice

This repository is maintained by 👷 CI/CD, meaning only dependencies, minor features, or minor bug fixes will be made.

***This application is retired and not affiliated with Salad Technologies.***

The little support there is can be found at the [FAQ](https://github.com/validcube/UnstableBind/wiki/FAQ).

If you want to contribute to UnstableBind, please read the [contributing guide](https://github.com/validcube/UnstableBind/wiki/Contributing). Do **NOT** make your own UnstableBind version unless you have a good reason to!

## Table of Contents

[Features](#Features) <br>
[Installation](#Installation) <br>
[Configuration](#Configuration) <br>
[Miner Setup Guide](#Miner-Setup-Guide) <br>
[Compiling](#Compiling)

If you need support, see the [SaladBind FAQ](https://github.com/validcube/UnstableBind/wiki/FAQ).

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
- Immediately restart mining with old settings using a command line argument

## Installation

If my pre-compiled exe's don't work for whatever reason, compile the repo yourself.
If they do work, you should probably compile it yourself anyway.

### Windows

Download the `saladbind-win.exe` from [GitHub Releases](https://github.com/validcube/UnstableBind/releases/latest).

### macOS and Linux

Download the `saladbind-macos`/`saladbind-linux` file from [GitHub Releases](https://github.com/validcube/UnstableBind/releases/latest). For these platforms, you'll need to run UnstableBind from the terminal, due to how UnstableBind works. If you need help with using the terminal, don't be afraid to Google a bit - you'll have to use `cd` to be in the same folder that UnstableBind is in.

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

Moved to https://github.com/validcube/UnstableBind/wiki/Miner-Details-Configuration

### Miner Setup Guide

If you don't know what miner, algorithm or pool to pick, see the [handy guide](https://github.com/validcube/UnstableBind/wiki/Miner-guide).

## Command line arguments

UnstableBind offers some command line arguments.

- `-d` for dumping debug data
- `-l` for starting mining with the latest settings

## Compiling

You can and probably should compile UnstableBind yourself. You'll need to install [Node.js](https://nodejs.org/). Highly recommended that you read [Contributing guide](https://github.com/validcube/UnstableBind/wiki/Contributing) before contributing

1. Clone the repository
2. Open a terminal in the folder and run `npm install`
3. Run `npm run compile` (This may display a warning, but it's safe to ignore it)
4. Your compiled binaries will be in the `bin` folder
