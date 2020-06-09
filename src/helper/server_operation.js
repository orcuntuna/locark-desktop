const { app,dialog } = require("electron");
const localIpV4Address = require("local-ipv4-address"); //
const express = require("express");
const expressApp = express();
const port = 21249;
const fs = require("fs");
const path = require("path");
const filesPath = path.join(app.getPath("home"), "files/");
const axios = require("axios");

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

module.exports = { checkInternetConnection, createServer, fileList };