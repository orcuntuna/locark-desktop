<script>
  export let data;
  import file_icon from "../helper/file_icon";
</script>

<style>
  .item {
    display: flex;
    align-items: center;
    padding: 10px;
    border-radius: 6px;
    cursor: pointer;
  }
  .item:hover{
    background-color: #F9F9F9;
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
  .download-icon {
    margin-left: auto;
    width: 16px;
    height: 16px;
  }
  img{
    cursor: pointer;
  }
</style>

<div class="item">
  <img
    class="file-icon"
    src="img/file-icons/{file_icon(data.name)}"
    alt="file-icon" />
  <div>
    <p class="name">{data.name}</p>
    <p class="size">{data.size} kb</p>
  </div>
  <img class="download-icon" src="img/download.svg" alt="download" />
</div>
