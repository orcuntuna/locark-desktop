<script>
  const { dialog } = require("electron").remote;
  const { ipcRenderer } = require("electron");
  import FileSend from "./FileSend.svelte";
  import { file_list } from "../store/uploads";
  import { Confirm } from "svelte-confirm";
  import { scale } from "svelte/transition";
  import { getNotificationsContext } from "svelte-notifications";
  const { addNotification } = getNotificationsContext();
  const onClickAddFile = () => {
    dialog
      .showOpenDialog({
        properties: ["openFile", "multiSelections"]
      })
      .then(result => {
        if (result.filePaths.length) {
          result.filePaths.forEach(file_path => {
            file_path = file_path.replace(/\\/g, "/");
            const parts = file_path.split("/");
            const file_name = parts[parts.length - 1];
            const exists = $file_list.filter(file => file.name == file_name);
            if (exists.length == 0) {
              file_list.update(files => [
                ...files,
                { name: file_name, size: null, status: 0 }
              ]);
            } else {
              addNotification({
                text: "file name already exists (" + file_name + ")",
                type: "danger",
                position: "bottom-left"
              });
            }
          });
          ipcRenderer.send("add-upload-file", result.filePaths);
        }
      });
  };
  ipcRenderer.on("copy-upload-file", (event, args) => {
    let clone_file_list = JSON.parse(JSON.stringify($file_list));
    clone_file_list.forEach((item, index) => {
      if(item.name === args.name){
        clone_file_list[index].size = args.size;
        clone_file_list[index].status = args.status;
        file_list.set(clone_file_list);
      }
    })
  })
</script>

<style>
  .box {
    width: 75%;
    display: flex;
    flex-direction: column;
  }
  .header {
    height: 50px;
    background-color: #4d4d4d;
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
    color: #fff;
    font-weight: 600;
    font-size: 15px;
    line-height: 1;
  }
  .header button {
    background: #fff;
    padding: 5px 12px;
    border-radius: 6px;
    color: #333;
    border: none;
    font-size: 13px;
    cursor: pointer;
    font-weight: 500;
  }
  .header button:focus {
    outline: 0;
  }
  .uploads {
    background: #fff;
    border: 1px solid #eaeaea;
    padding: 20px 15px;
    border-bottom-left-radius: 6px;
    border-bottom-right-radius: 6px;
  }
  .info {
    margin: 0;
    font-size: 14px;
  }
</style>

<div class="box" transition:scale>
  <div class="header">
    <p>Your shared files</p>
    <button on:click={onClickAddFile}>Add file</button>
  </div>
  <div class="uploads">
    {#if $file_list.length > 0}
      {#each $file_list as file}
        <FileSend data={file} />
      {/each}
    {:else}
      <p class="info">You haven't added a file yet.</p>
    {/if}
  </div>
</div>
