# TarkovPilot



TarkovPilot is an Escape from Tarkov companion application that watches your game logs and screenshots and shows your position on a local web map.

## Features

- Maps
    - Show your position on a local map (from screenshots)
    - Map change (if possible to determine from logs)
    - Quests complete (if possible to determine from logs)
- Built-in local web UI
    - Opens at http://localhost:5124 and serves static assets directly from the app bundle
    - Ships with placeholder map art; drop your own map images into `web/maps` to replace them
- Automatic updates
    - Press the update button in the local UI to refresh the agent

## UI

The Windows tray icon opens the local website. All configuration details and recent events are shown in the browser instead of relying on tarkov-market.com.

<img src="https://github.com/ggdiam/TarkovPilot/blob/master/images/TarkovPilot%20page.png"/>

## Installation

- Latest version you can find here on GitHub in [latest release](https://github.com/ggdiam/TarkovPilot/releases)

Downloaded, extract the zip and run the `TarkovPilot.exe` executable. Open http://localhost:5124 to see the map UI.

## FAQ

### How does TarkovPilot work?

- TarkovPilot watches the log files that the game creates as it's running.  
  From some log messages possible to determine map, you are loading in.

- TarkovPilot watches the screenshot files that you make.  
  In every screenshot file name coded info about position, where it was created.  
  TarkovPilot just get this position and upload to TM website and show your position on map.

### Is TarkovPilot a cheat?

No.  
TarkovPilot just reading game logs, and your game screenshots.  
Thats all.  
There is no direct interaction with the game or game memory.  
Also BSG or BattleEye devs always can check source code here to be sure app is purely safe and doesn't break TOS.
