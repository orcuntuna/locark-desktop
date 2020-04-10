<script>
  import { status, local_ip, local_pin } from "../store/network";
  import { getNotificationsContext } from "svelte-notifications";
  import { getContext } from "svelte";
  import Downloads from "./Downloads.svelte";
  const { addNotification } = getNotificationsContext();
  import QrCode from "./QrCode.svelte";
  const { open } = getContext("simple-modal");
  const showQrCode = event => {
    event.preventDefault();
    open(QrCode, { code: $local_pin });
  };
</script>

<style>
  .box {
    background: #f9f9f9;
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    color: #333;
    flex-direction: column;
  }
  .title {
    font-weight: bold;
    font-size: 48px;
    line-height: 60px;
    text-align: center;
  }
  h3 {
    font-size: 24px;
    font-weight: 300;
  }
  .form {
    margin-top: 35px;
    display: flex;
    align-items: center;
  }
  .form input {
    margin-right: 10px;
    text-align: center;
    background: #333;
    color: #fff;
  }
  .form img {
    width: 20px;
    height: 20px;
    cursor: pointer;
  }
</style>

<div class="box">
  <h2 class="title">Send Files</h2>
  <h3>to computers or phones</h3>
  <div class="form">
    <input
      bind:value={$local_pin}
      type="text"
      readonly
      class="form-control"
      placeholder="Your PIN"
      required />
    {#if $local_pin}
      <button type="button" class="btn" on:click={showQrCode}>
        <img src="img/camera.svg" alt="QR Code" />
      </button>
    {:else}
      <button type="button" class="btn" disabled>
        <img src="img/camera.svg" alt="QR Code" />
      </button>
    {/if}
  </div>
</div>
