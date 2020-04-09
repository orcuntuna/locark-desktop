const { app, BrowserWindow, ipcMain, ipcRenderer } = require('electron');
const path = require('path');
const localIpV4Address = require("local-ipv4-address");

require('electron-reload')(__dirname, {
  electron: path.join(__dirname, '../node_modules', '.bin', 'electron'),
  awaitWriteFinish: true
});

if (require('electron-squirrel-startup')) {
  app.quit();
}

const checkInternetConnection = (window) => {
  localIpV4Address().then(ipAddress => {
    window.webContents.send("network-status", {status: 'online', ipAddress});
  }).catch(err => {
    window.webContents.send("network-status", {status: 'offline'});
  });
}

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true
    }
  });
  mainWindow.loadFile(path.join(__dirname, '../public/index.html'));
  mainWindow.webContents.on('did-finish-load', () => {
    checkInternetConnection(mainWindow);
    ipcMain.on('network-status-check', () => {
      checkInternetConnection(mainWindow);
    })
  });
};

app.allowRendererProcessReuse = false;

app.on('ready', createWindow);

app.whenReady().then(() => {
  
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});