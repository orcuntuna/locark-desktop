const { app, BrowserWindow, ipcMain, ipcRenderer } = require('electron');
const path = require('path');
const localIpV4Address = require("local-ipv4-address");
const express = require('express')
const expressApp = express()
const fs = require('fs')
const filesPath = path.join(app.getAppPath(), "files/")
var server;

require('electron-reload')(__dirname, {
  electron: path.join(__dirname, '../node_modules', '.bin', 'electron'),
  awaitWriteFinish: true
});

if (require('electron-squirrel-startup')) {
  app.quit();
}

asyncForEach = async (array, callback) => {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

const checkInternetConnection = (window) => {
  localIpV4Address().then(ipAddress => {
    window.webContents.send("network-status", { status: 'online', ipAddress });
  }).catch(err => {
    window.webContents.send("network-status", { status: 'offline' });
  });
}

const createServer = () => {
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
  server = expressApp.listen(21249);
}

const copyFiles = async (filesFullPath, window) => {
  await asyncForEach(filesFullPath, async (file) => {
    const { COPYFILE_EXCL } = fs.constants;
    file = file.replace(/\\/g, "/");
    name = file.split('/')
    name = name[name.length - 1]
    if (checkFile(name)) {
      fs.copyFileSync(path.join(file), path.join(app.getAppPath(), "files/", name), COPYFILE_EXCL, (err) => {
        window.webContents.send('copy-upload-file', { name, status: 2 })
      });
      const stat = fs.statSync(path.join(file), (err) => {
        window.webContents.send('copy-upload-file', { name, size: stat.size, status: 2 })
      })
      window.webContents.send('copy-upload-file', { name, size: stat.size, status: 1 })
    }
  })
}

const checkFile = (name) => {
  staticPath = path.join(app.getAppPath(), "files/", name)
  try {
    fs.accessSync(staticPath, fs.constants.F_OK | fs.constants.W_OK);
    return false
  } catch (err) {
    return true
  }
}

const deleteFiles = () => {
  fs.readdirSync(path.join(app.getAppPath(), "files/"), (err, files) => {
    if (err) throw err;

    for (const file of files) {
      fs.unlinkSync(path.join(path.join(app.getAppPath(), "files/"), file), err => {
        if (err) throw err;
      });
    }
  });
}

const deleteFile = (fileName) => {
  fs.readdir(path.join(app.getAppPath(), "files/"), (err, files) => {
    if (err) throw err
    try {
      fs.unlinkSync(path.join(app.getAppPath(), "files/", fileName))
    } catch (error) {
      console.log(error);
    }
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
    ipcMain.on('add-upload-file', (event, filesPath) => {
      copyFiles(filesPath, mainWindow)
    })
    ipcMain.on('delete-upload-file', (event, fileName) => {
      deleteFile(fileName)
    })
  });
};

app.allowRendererProcessReuse = false;

app.on('ready', createWindow);

app.whenReady().then(() => {
  deleteFiles()
  createServer();
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
    server.close()
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});