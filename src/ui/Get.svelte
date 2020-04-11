<script>
  const { ipcRenderer } = require("electron");
  import { status } from "../store/network";
  import { downloads_listing, downloads_data } from "../store/dowloads";
  import { getNotificationsContext } from "svelte-notifications";
  import decode_pin from "../helper/decode_pin";
  import validate_ipv4 from "../helper/validate_ipv4";
  import Downloads from "./Downloads.svelte";
  import Spinner from "svelte-spinner";
  const { addNotification } = getNotificationsContext();
  let pin;
  let waiting = false;
  const formOnSubmit = event => {
    event.preventDefault();
    if (waiting === false) {
      const target_ip = decode_pin(pin);
      if (validate_ipv4(target_ip)) {
        waiting = true;
        ipcRenderer.send("list-files", target_ip);
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
      downloads_data.set(args.data)
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
  {/if}
</div>
