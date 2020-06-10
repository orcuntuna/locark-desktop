const { app, dialog } = require("electron");
const localIpV4Address = require("local-ipv4-address");
const express = require("express");
const expressApp = express();
const port = 21249;
const fs = require("fs");
const path = require("path");
const filesPath = path.join(app.getPath("home"), "files/");


const checkInternetConnection = (window) => {
  localIpV4Address()
    .then((ipAddress) => {
      window.webContents.send("network-status", {
        status: "online",
        ipAddress,
      });
      return true;
    })
    .catch((err) => {
      window.webContents.send("network-status", { status: "offline" });
      return false;
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

module.exports = { checkInternetConnection, createServer };