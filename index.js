const { app, globalShortcut, BrowserWindow, ipcMain } = require('electron/main')
const path = require('node:path')

const { readFile, writeFile, rename } = require('node:fs/promises')
const { readFileSync } = require('node:fs')


let cache = {}
const cacheDir = app.getPath('userData')
const cachePath = path.join(cacheDir, "cache.json")
const cachePathTemp = path.join(cacheDir, "temp.json")

let favourites = []
const favouritesPath = path.join(__dirname, "favourites.json")
const favouritesPathTemp = path.join(__dirname, "favourites_temp.json")

const fallbackDefault = readFileSync(path.join(__dirname, 'fallback.html'), 'utf8')
const fallbackDefaultClock = wrapClock('Bob 1.0', fallbackDefault)

let showingNow = {};

function getRandomKey(object) {
  const keys = Object.keys(object)

  if (keys.length === 0) {
    return undefined;
  }

  return keys[Math.floor(Math.random() * keys.length)];
}

function wrapClock(key, value) {
  return {clocks: {[key]: value}}
}

ipcMain.handle('clocks:get', async () => { 
    const time = new Date().toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    }).replace(/\s+/g, '')
    const timeNum = time.slice(0, -2)
    const cacheClock = cache[timeNum]

    try {

    const response = await fetch(`https://clocks.brianmoore.com/api/clocks?time=${time}`)
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }

    const data = await response.json()

    const key = getRandomKey(data.clocks)
    const value = data.clocks[key]


    const clockObj = wrapClock(key, value)
    showingNow = clockObj

    if (!cacheClock) {
      cache[timeNum] = clockObj
      writeCache();
    }
    
    return clockObj
  } catch (error) {
    console.log("Error fetching data: ", error.message)
    console.log("Using fallback option")
    const favouritesWithDefault = [...favourites, fallbackDefaultClock]
    const fallbackOption = cacheClock || favouritesWithDefault[Math.floor(Math.random() * favouritesWithDefault.length)]
    showingNow = fallbackOption

    return(fallbackOption)
  }
 })


const readFavourites = async () => {
  try {
    const data = await readFile(favouritesPath, 'utf8')
    favourites = JSON.parse(data)
  } catch (error) {
    if (error.code === "ENOENT") {
      console.error('Favourites file not found')
    } else {
      console.error('Error reading file:', error.message)
    }
  }
}

const readCache = async () => {
  try {
    const data = await readFile(cachePath, 'utf8')
    cache = JSON.parse(data)
  } catch (error) {
    if (error.code === "ENOENT") {
      console.error('Cache file not found')
    } else {
      console.error('Error reading file:', error.message)
    }
  }
}

const writeCache = async () => {
  try {
    await writeFile(cachePathTemp, JSON.stringify(cache))
    await rename(cachePathTemp, cachePath)
  } catch (error) {
    console.error('Error writing file:', error.message)
  }
}

const writeFavourites = async () => {
  try {
    await writeFile(favouritesPathTemp, JSON.stringify(favourites))
    await rename(favouritesPathTemp, favouritesPath)
  } catch (error) {
    console.error('Error writing file:', error.message)
  }
}

const createWindow = () => {
  const win = new BrowserWindow({
    width: 350,
    height: 350,
    titleBarStyle: 'customButtonsOnHover',
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      backgroundThrottling: false
    }
  })
  win.loadFile('index.html')
  win.webContents.openDevTools({ mode: 'detach' })
}

const registerShortcut = () => {
  const ret = globalShortcut.register('CommandOrControl+E', () => {
    if (!showingNow.clocks) {
      return
    }
    const allFavourites = favourites.flatMap(item => Object.values(item.clocks));
    if (allFavourites.includes(Object.values(showingNow.clocks)[0])) {
      console.log("Already favourite")
    } else {
      console.log("Clock saved")
      favourites.push(showingNow)
      writeFavourites()
    }
  })

  if (!ret) {
    console.log('registration failed')
  }
}

app.whenReady().then(async () => {
  await readCache()
  await readFavourites()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
  registerShortcut()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('will-quit', () => {
  globalShortcut.unregister('CommandOrControl+E')
})
