<script>
  export let data;
  import file_icon from "../helper/file_icon";
  const { ipcRenderer } = require("electron");
  import { file_list } from "../store/uploads";
  import { Confirm } from "svelte-confirm";
  import Spinner from "svelte-spinner";
  import { getNotificationsContext } from "svelte-notifications";
  const { addNotification } = getNotificationsContext();
  const onClickDelete = () => {
    if (data.status === 1) {
      ipcRenderer.send("delete-upload-file", data.name);
      let clone_file_list = JSON.parse(JSON.stringify($file_list));
      clone_file_list.forEach((item, index) => {
        if (item.name === data.name) {
          clone_file_list.splice(index, 1);
        }
      });
      file_list.set(clone_file_list);
    } else {
      addNotification({
        text: "Wait until the file is uploaded",
        type: "warning",
        position: "bottom-left"
      });
    }
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
  .delete-icon {
    margin-left: auto;
    width: 12px;
    height: 12px;
  }
  img {
    cursor: pointer;
  }
  .spinner {
    margin-left: auto;
  }
</style>

<Confirm let:confirm={confirmDelete} confirmTitle="Delete" cancelTitle="Cancel">
  <div class="item" on:click={confirmDelete(onClickDelete)}>
    <img
      class="file-icon"
      src="img/file-icons/{file_icon(data.name)}"
      alt="file-icon" />
    <div>
      <p class="name">{data.name}</p>
      {#if data.status == 1}
        <p class="size">{(data.size/1048576).toFixed(2)} mb</p>
      {/if}
    </div>
    {#if data.status == 1}
      <img class="delete-icon" src="img/close.svg" alt="delete file" />
    {:else}
      <div class="spinner">
        <Spinner size="24" speed="750" color="#AAA" thickness="2" gap="40" />
      </div>
    {/if}

  </div>
  <span slot="title">Are you sure?</span>
  <span slot="description">
    Do you want to remove this file from the uploaded list?
  </span>
</Confirm>
