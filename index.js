const { app, BrowserWindow, ipcMain } = require('electron/main')
const path = require('path')


ipcMain.handle('clocks:get', async () => { 
    try {
    const time = new Date().toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    }).replace(/\s+/g, '');
    const response = await fetch(`https://clocks.brianmoore.com/api/clocks?time=${time}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    return(data);
  } catch (error) {
    return('Error fetching data');
  }
 })

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
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
