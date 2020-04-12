<script>
  const { shell } = require("electron");
  const app = require("electron").remote.app;
  const path = require("path");
  export let pin;
  const { ipcRenderer } = require("electron");
  import FileGet from "./FileGet.svelte";
  import {
    downloads_listing,
    downloads_data,
    target_ip
  } from "../store/dowloads";
  import { Confirm } from "svelte-confirm";
  import { scale } from "svelte/transition";
  const onClickCancel = () => {
    downloads_listing.set(false);
    downloads_data.set([]);
  };
  const onClickDownloadsFolder = () => {
    shell.openItem(path.join(app.getAppPath(), "/downloads"));
  };
  const onClickDownloadAll = () => {
    let clone_downloads_data = JSON.parse(JSON.stringify($downloads_data));
    let only_not_downloads = clone_downloads_data.filter(
      file => file.status === 0
    );
    clone_downloads_data.map((item, index) => {
      if (clone_downloads_data[index].status === 0) {
        clone_downloads_data[index].status = 1;
        downloads_data.set(clone_downloads_data);
      }
    });
    ipcRenderer.send("download-file", {
      ip: $target_ip,
      files: only_not_downloads
    });
  };
  ipcRenderer.on("download-file-status", (event, args) => {
    let clone_downloads_data = JSON.parse(JSON.stringify($downloads_data));
    clone_downloads_data.forEach((item, index) => {
      if (item.name === args.name) {
        clone_downloads_data[index].status = args.status;
        clone_downloads_data[index].saved_path = args.saved_path
          ? args.saved_path
          : null;
        downloads_data.set(clone_downloads_data);
      }
    });
  });
</script>

<style>
  .box {
    width: 75%;
    display: flex;
    flex-direction: column;
  }
  .header {
    height: 50px;
    background-color: #f6f6f6;
    border-top-left-radius: 6px;
    border-top-right-radius: 6px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 15px 0 25px;
    border: none;
    margin-top: 40px;
  }
  .header p {
    margin: 0;
    padding: 0;
    color: #000;
    font-weight: 600;
    font-size: 15px;
    line-height: 1;
  }
  .header span {
    letter-spacing: 1px;
    font-weight: 500;
  }
  .header button {
    background: #ff8364;
    padding: 5px 12px;
    border-radius: 6px;
    color: #fff;
    border: none;
    font-size: 13px;
    cursor: pointer;
  }
  .header button img {
    cursor: pointer;
  }
  .header button.folder {
    background: #666;
  }
  .header button:focus {
    outline: 0;
  }
  .downloads {
    background: #fff;
    border: 1px solid #ddd;
    padding: 20px 15px;
    border-bottom-left-radius: 6px;
    border-bottom-right-radius: 6px;
    overflow-y: auto;
    max-height: 230px;
  }
  .cancel {
    color: #fff;
    font-size: 13px;
    text-align: center;
    cursor: pointer;
    margin: 20px 0 0;
  }
</style>

<div class="box" transition:scale>
  <div class="header">
    <p>
      PIN:
      <span>{pin}</span>
    </p>
    <div>
      <button title="Open downloads folder" class="folder" on:click={onClickDownloadsFolder}>
        <img
          src="img/folder-white.svg"
          alt="downloads folder"
          width="14"
          height="14" />
      </button>
      <button on:click={onClickDownloadAll}>Download All</button>
    </div>
  </div>
  <div class="downloads scrollbar">
    {#each $downloads_data as file_data}
      <FileGet data={file_data} />
    {/each}
  </div>
  <Confirm
    let:confirm={confirmCancel}
    confirmTitle="End the Connection"
    cancelTitle="Keep">
    <p class="cancel" on:click={confirmCancel(onClickCancel)}>
      End the Connection
    </p>
    <span slot="title">Are you sure?</span>
    <span slot="description">
      If you confirm the connection will be canceled and the files will be lost.
    </span>
  </Confirm>
</div>
