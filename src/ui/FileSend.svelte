<script>
  export let data;
  import file_icon from "../helper/file_icon";
  import { Confirm } from "svelte-confirm";
  const onClickDelete = () => {
    alert("11");
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
  }
  .size {
    color: #666;
    font-size: 12px;
  }
  .delete-icon {
    margin-left: auto;
    width: 12px;
    height: 12px;
  }
  img {
    cursor: pointer;
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
      <p class="size">{data.size} kb</p>
    </div>
    <img class="delete-icon" src="img/close.svg" alt="delete file" />

  </div>
  <span slot="title">Are you sure?</span>
  <span slot="description">
    Do you want to remove this file from the uploaded list?
  </span>
</Confirm>
