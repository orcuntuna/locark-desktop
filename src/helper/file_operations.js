const { app, dialog } = require("electron");
const fs = require("fs");
const axios = require("axios");
const path = require("path");
const port = 21249;
const download = "Downloads";
const files = "files"
const filesPath = path.join(app.getPath("home"), `${files}/`);
const downloadsPath = path.join(app.getPath("home"), `${download}/`);

const copyFiles = (filesFullPath, window) => {
  filesFullPath.forEach((file) => {
    const { COPYFILE_EXCL } = fs.constants;
    file = file.replace(/\\/g, "/");
    let name = file.split("/");
    name = name[name.length - 1];
    if (checkFile(files, name)) {
      fs.copyFile(
        path.join(file),
        path.join(filesPath, name),
        COPYFILE_EXCL,
        (err) => {
          if (err) {
            window.webContents.send("copy-upload-file", { name, status: 2 });
          } else {
            fs.stat(path.join(file), async (err, stat) => {
              if (err) {
                window.webContents.send("copy-upload-file", {
                  name,
                  status: 2,
                });
              } else {
                await window.webContents.send("copy-upload-file", {
                  name,
                  size: stat.size,
                  status: 1,
                });
              }
            });
          }
        }
      );
    }
  });
};

const checkFile = async (dir, name) => {
  staticPath = path.join(app.getPath("home"), dir, "/", name);
  try {
    await fs.accessSync(staticPath, fs.constants.F_OK | fs.constants.W_OK);
    return false;
  } catch (err) {
    return true;
  }
};

const deleteFiles = () => {
  fs.readdir(filesPath, (err, files) => {
    if (err) throw err;
    for (const file of files) {
      fs.unlinkSync(path.join(filesPath, file), (err) => {
        if (err) throw err;
      });
    }
  });
};

const deleteFile = (fileName) => {
  fs.readdir(filesPath, (err, files) => {
    if (err) throw err;
    try {
      fs.unlinkSync(path.join(filesPath, fileName));
    } catch (error) {
      console.log(error);
    }
  });
};

const fileExists = () => {
  if (!fs.existsSync(filesPath)) {
    fs.mkdirSync(filesPath);
  }
  if (!fs.existsSync(downloadsPath)) {
    fs.mkdirSync(downloadsPath);
  }
};

const downloadFilePath = async (fileName) => {
  if (!(await checkFile(download, fileName))) {
    let temp = 0;
    let tempFileName = fileName;
    let tempFileExtension = fileName.split(".")[1];
    while (true) {
      temp++;
      if (!(await checkFile(download, tempFileName))) {
        tempFileName =
          fileName.split(".")[0] + "(" + temp + ")" + "." + tempFileExtension;

      } else {
        return path.join(downloadsPath, tempFileName);
      }
    }
  } else {
    return path.join(downloadsPath, fileName);
  }

};

const downloadFile = (data, window) => {
  data.files.forEach(async (file) => {
    let fileName = file.name;
    const filePath = await downloadFilePath(fileName);
    const url = "http://" + data.ip + ":" + port + "/" + fileName;
    const writer = fs.createWriteStream(filePath);
    axios({
      url,
      method: "GET",
      responseType: "stream",
    })
      .then((response) => {
        response.data
          .pipe(writer)
          .on("finish", () => {
            window.webContents.send("download-file-status", {
              name: fileName,
              saved_path: filePath,
              status: 2,
            });
          })
          .on("error", () => {
            window.webContents.send("download-file-status", {
              name: fileName,
              status: 3,
            });
          });
      })
      .catch((err) => {
        window.webContents.send("download-file-status", {
          name: fileName,
          status: 3,
        });
      });
  });
};

module.exports = { copyFiles, deleteFiles, deleteFile, fileExists, downloadFile }