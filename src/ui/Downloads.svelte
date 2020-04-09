<script>
  export let pin;
  import FileGet from "./FileGet.svelte";
  import { downloads_listing, downloads_data } from "../store/dowloads";
  import { scale } from "svelte/transition";
  const onClickCancel = () => {
    console.log("click");
    downloads_listing.set(false);
    downloads_data.set([]);
  };
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
  .header button:focus {
    outline: 0;
  }
  .downloads {
    background: #fff;
    border: 1px solid #ddd;
    padding: 20px 15px;
    border-bottom-left-radius: 6px;
    border-bottom-right-radius: 6px;
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
    <button>Download All</button>
  </div>
  <div class="downloads">
    {#each $downloads_data as file_data}
      <FileGet data={file_data} />
    {/each}
  </div>
  <p class="cancel" on:click={onClickCancel}>End the Connection</p>
</div>


