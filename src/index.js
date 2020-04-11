const { app, BrowserWindow, ipcMain, ipcRenderer } = require("electron");
const path = require("path");
const localIpV4Address = require("local-ipv4-address");
const express = require("express");
const expressApp = express();
const fs = require("fs");
const axios = require("axios");
const filesPath = path.join(app.getAppPath(), "files/");
const downloadPath = path.join(app.getAppPath(), "downloads/");
var server;
const port = 21249;

require("electron-reload")(__dirname, {
  electron: path.join(__dirname, "../node_modules", ".bin", "electron"),
  awaitWriteFinish: true,
});

if (require("electron-squirrel-startup")) {
  app.quit();
}

asyncForEach = async (array, callback) => {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
};

const checkInternetConnection = (window) => {
  localIpV4Address()
    .then((ipAddress) => {
      window.webContents.send("network-status", {
        status: "online",
        ipAddress,
      });
    })
    .catch((err) => {
      window.webContents.send("network-status", { status: "offline" });
    });
};

const createServer = () => {
  expressApp.use(express.static(filesPath));
  expressApp.get("/files", (req, res) => {
    const responseFiles = [];
    try {
      filesName = fs.readdirSync(filesPath);
      filesName.forEach(async (file) => {
        stat = fs.statSync(filesPath + file);
        if (stat.isFile()) {
          await responseFiles.push({ name: file, size: stat.size, status: 0 });
        }
      });
    } catch (error) {
      console.log("Error getting directory information.");
      res.sendStatus(403);
    }
    res.json(responseFiles);
  });
  server = expressApp.listen(port);
};

const copyFiles = (filesFullPath, window) => {
  filesFullPath.forEach((file) => {
    const { COPYFILE_EXCL } = fs.constants;
    file = file.replace(/\\/g, "/");
    let name = file.split("/");
    name = name[name.length - 1];
    if (checkFile("files", name)) {
      fs.copyFile(path.join(file), path.join(app.getAppPath(), "files/", name), COPYFILE_EXCL, (err) => {
        if (err) {
          window.webContents.send("copy-upload-file", { name, status: 2 });
        } else {
          fs.stat(path.join(file), async (err, stat) => {
            if (err) {
              window.webContents.send("copy-upload-file", { name, status: 2, });
            } else {
              await window.webContents.send("copy-upload-file", { name, size: stat.size, status: 1, });
            }
          });
        }
      }
      );
    }
  });
};

const checkFile = async (dir, name) => {
  staticPath = path.join(app.getAppPath(), dir, "/", name);
  try {
    await fs.accessSync(staticPath, fs.constants.F_OK | fs.constants.W_OK);
    return false;
  } catch (err) {
    return true;
  }
};

const deleteFiles = () => {
  fs.readdir(path.join(app.getAppPath(), "files/"), (err, files) => {
    if (err) throw err;

    for (const file of files) {
      fs.unlinkSync(
        path.join(path.join(app.getAppPath(), "files/"), file),
        (err) => {
          if (err) throw err;
        }
      );
    }
  });
};

const deleteFile = (fileName) => {
  fs.readdir(path.join(app.getAppPath(), "files/"), (err, files) => {
    if (err) throw err;
    try {
      fs.unlinkSync(path.join(app.getAppPath(), "files/", fileName));
    } catch (error) {
      console.log(error);
    }
  });
};

const fileExists = () => {
  if (!fs.existsSync(filesPath)) {
    fs.mkdirSync(filesPath);
  }
  if (!fs.existsSync(downloadPath)) {
    fs.mkdirSync(downloadPath);
  }
};

const downloadFilePath = async (fileName) => {
  if (!(await checkFile("downloads", fileName))) {
    let temp = 0;
    let tempFileName = fileName;
    let tempFileExtension = fileName.split(".")[1];
    while (true) {
      temp++;
      if (!(await checkFile("downloads", tempFileName))) {
        tempFileName =
          fileName.split(".")[0] + "(" + temp + ")" + "." + tempFileExtension;
      } else {
        return await path.join(app.getAppPath(), "downloads/", tempFileName);
      }
    }
  } else {
    return await path.join(app.getAppPath(), "downloads/", fileName);
  }
};

const downloadFile = (data, window) => {
  data.files.forEach(async (fileName) => {
    var filePath = await downloadFilePath(fileName);
    const url = "http://" + data.ip + ":" + port + "/" + fileName;
    const writer = fs.createWriteStream(filePath);
    axios({
      url,
      method: "GET",
      responseType: "stream",
    })
      .then((response) => {
        response.data.pipe(writer);
        window.webContents.send('download-file-status', {
          name: fileName,
          saved_path: filePath,
          status: 1,
        })
      })
      .catch((err) => {
        window.webContents.send('download-file-status', {
          name: fileName,
          status: 2,
        })
      })
  });
};

const fileList = (ip, window) => {
  url = "http://" + ip + ":" + port + "/files";
  axios
    .get(url)
    .then((response) => {
      window.webContents.send("send-list-file", {
        success: true,
        data: response.data,
      });
    })
    .catch((error) => {
      window.webContents.send("send-list-file", {
        success: false,
        error: "Link not reached. Please check link",
      });
    });
};

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
    },
  });
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
      downloadFile(data);
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
