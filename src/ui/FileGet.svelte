<script>
  export let data;
  const { ipcRenderer } = require("electron");
  import file_icon from "../helper/file_icon";
  import { target_ip, downloads_data } from "../store/dowloads";
  import Spinner from "svelte-spinner";
  import { getNotificationsContext } from "svelte-notifications";
  const { addNotification } = getNotificationsContext();
  const onClickItem = () => {
    if (data.status === 0) {
      downloadFile();
    } else if (data.status === 1) {
      addNotification({
        text: "wait until download is complete",
        type: "warning",
        position: "bottom-left"
      });
    } else if (data.status === 2) {
      openFile();
    }
  };
  const downloadFile = () => {
    let clone_downloads_data = JSON.parse(JSON.stringify($downloads_data));
    clone_downloads_data.map((item, index) => {
      if (clone_downloads_data[index].name === data.name) {
        downloads_data.set(clone_downloads_data);
        ipcRenderer.send("download-file", { ip: $target_ip, files: [data] });
      }
    });
  };
  const openFile = () => {
    alert("open");
  };
</script>

<style>
  .item {
    display: flex;
    align-items: center;
    padding: 10px;
    border-radius: 6px;
    cursor: pointer;
  }
  .item:hover {
    background-color: #f9f9f9;
    transition: 0.19s;
  }
  .file-icon {
    width: 32px;
    height: 32px;
    margin-right: 15px;
  }
  p {
    padding: 0;
    margin: 0;
  }
  .name {
    color: #333;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
  }
  .size {
    color: #666;
    font-size: 12px;
    cursor: pointer;
  }
  .right-icon {
    margin-left: auto;
    width: 16px;
    height: 16px;
  }
  img {
    cursor: pointer;
  }
  .spinner {
    margin-left: auto;
  }
</style>

<div class="item" on:click={onClickItem}>
  <img
    class="file-icon"
    src="img/file-icons/{file_icon(data.name)}"
    alt="file-icon" />
  <div>
    <p class="name">{data.name}</p>
    <p class="size">{(data.size / 1048576).toFixed(2)} mb</p>
  </div>
  {#if data.status === 0}
    <img class="right-icon" src="img/download.svg" alt="download" />
  {:else if data.status === 1}
    <div class="spinner">
      <Spinner size="24" speed="750" color="#AAA" thickness="2" gap="40" />
    </div>
  {:else if data.status === 2}
    <img class="right-icon" src="img/folder.svg" alt="open file" />
  {/if}
</div>
