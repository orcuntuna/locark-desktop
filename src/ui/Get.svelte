<script>
  const { ipcRenderer } = require("electron");
  import { status } from "../store/network";
  import {
    downloads_listing,
    downloads_data,
    target_ip
  } from "../store/dowloads";
  import { getNotificationsContext } from "svelte-notifications";
  const { addNotification } = getNotificationsContext();
  import decode_pin from "../helper/decode_pin";
  import validate_ipv4 from "../helper/validate_ipv4";
  import Downloads from "./Downloads.svelte";
  import Spinner from "svelte-spinner";
  let pin;
  let waiting = false;
  const formOnSubmit = event => {
    event.preventDefault();
    if (waiting === false) {
      const temp_target_ip = decode_pin(pin);
      if (validate_ipv4(temp_target_ip)) {
        waiting = true;
        target_ip.set(temp_target_ip);
        ipcRenderer.send("list-files", temp_target_ip);
      } else {
        addNotification({
          text: "PIN is wrong",
          type: "danger",
          position: "bottom-left"
        });
      }
    } else {
      addNotification({
        text: "Please wait, loading",
        type: "warning",
        position: "bottom-left"
      });
    }
  };
  ipcRenderer.on("send-list-file", (event, args) => {
    if (args.success === true) {
      downloads_listing.set(true);
      downloads_data.set(args.data);
      waiting = false;
    } else {
      waiting = false;
      addNotification({
        text: "Connection could not be established",
        type: "danger",
        position: "bottom-left"
      });
    }
  });
</script>

<style>
  .box {
    background: #333;
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    color: #fff;
    flex-direction: column;
  }
  .title {
    font-weight: bold;
    font-size: 48px;
    line-height: 60px;
    text-align: center;
    color: #fff;
  }
  h3 {
    font-size: 24px;
    font-weight: 300;
  }
  form {
    margin-top: 35px;
    display: flex;
  }
  form input {
    margin-right: 10px;
    text-align: center;
  }
  p.info{
    color: #EEE;
    margin-top: 35px;
    font-size: 14px;
    text-align: center;
    padding-left: 25px;
    padding-right: 25px;
  }
</style>

<div class="box">
  <h2 class="title">Get Files</h2>
  <h3>on computers or phones</h3>
  {#if $downloads_listing}
    <Downloads {pin} />
  {:else}
    <form on:submit={formOnSubmit}>
      <input
        bind:value={pin}
        type="text"
        class="form-control"
        placeholder="Connection PIN"
        required />
      {#if $status == 'online'}
        {#if waiting}
          <button class="btn">
            <Spinner
              size="24"
              speed="750"
              color="#AAA"
              thickness="2"
              gap="40" />
          </button>
        {:else}
          <button class="btn">Connect</button>
        {/if}
      {:else}
        <button class="btn" disabled>Connect</button>
      {/if}
    </form>
    <p class="info">To transfer files, you must be connected to the same network.</p>
  {/if}
</div>
