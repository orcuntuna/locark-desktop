const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const { checkInternetConnection, createServer } = require("./helper/server_operation");
const { copyFiles, deleteFiles, deleteFile, fileExists, downloadFile, fileList } = require("./helper/file_operations")
var server;

require("electron-reload")(__dirname, {
  electron: path.join(__dirname, "../node_modules", ".bin", "electron"),
  awaitWriteFinish: true,
});

if (require("electron-squirrel-startup")) {
  app.quit();
}

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
    },
    show: false
  });
  mainWindow.maximize()
  mainWindow.show()
  mainWindow.loadFile(path.join(__dirname, "../public/index.html"));
  mainWindow.webContents.on("did-finish-load", () => {
    ipcMain.removeAllListeners();
    deleteFiles();
    checkInternetConnection(mainWindow);
    ipcMain.on("network-status-check", () => {
      checkInternetConnection(mainWindow);
    });
    ipcMain.on("add-upload-file", (event, filesPath) => {
      copyFiles(filesPath, mainWindow);
    });
    ipcMain.on("delete-upload-file", (event, fileName) => {
      deleteFile(fileName);
    });
    ipcMain.on("download-file", (event, data) => {
      downloadFile(data, mainWindow);
    });
    ipcMain.on("list-files", (event, ip) => {
      fileList(ip, mainWindow);
    });
  });
};

app.allowRendererProcessReuse = false;

app.on("ready", createWindow);

app.whenReady().then(() => {
  fileExists();
  deleteFiles();
  createServer();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    server.close();
    deleteFiles();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
