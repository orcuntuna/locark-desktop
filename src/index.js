const { app, BrowserWindow, ipcMain, ipcRenderer } = require('electron');
const path = require('path');
const localIpV4Address = require("local-ipv4-address");
const express = require('express')
const expressApp = express()
const fs = require('fs')

require('electron-reload')(__dirname, {
  electron: path.join(__dirname, '../node_modules', '.bin', 'electron'),
  awaitWriteFinish: true
});

if (require('electron-squirrel-startup')) {
  app.quit();
}

const checkInternetConnection = (window) => {
  localIpV4Address().then(ipAddress => {
    window.webContents.send("network-status", { status: 'online', ipAddress });
  }).catch(err => {
    window.webContents.send("network-status", { status: 'offline' });
  });
}

const createServer = () => {
  const filesPath = path.join(app.getPath("home"), ".locark/files/")
  expressApp.use(express.static(filesPath))
  expressApp.get('/files', (req, res) => {
    fs.readdir(filesPath, async (err, files) => {
      if (err) {
        console.log("Error getting directory information.")
        res.sendStatus(403)
      } else {
        const responseFiles = []
        if (files.length > 0) {
          files.forEach((file, key) => {
            fs.stat(filesPath + file, (err, stat) => {
              if (stat.isFile()) {
                responseFiles.push({ name: files[key], size: stat.size })
                if (files.length == (key + 1)) {
                  res.json(
                    responseFiles
                  )
                }
              }
            })
          })
        } else {
          res.json(
            []
          )
        }
      }
    })
  })
  expressApp.listen(21249);
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
    createServer();
    ipcMain.on('add-upload-file', (fullPath) => {

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