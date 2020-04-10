<script>
  import { status, local_ip, local_pin } from "../store/network";
  import { getNotificationsContext } from "svelte-notifications";
  const { addNotification } = getNotificationsContext();
  import encode_pin from "../helper/encode_pin";
  import validate_ipv4 from "../helper/validate_ipv4";
  export let message;
  const { ipcRenderer } = require("electron");
  ipcRenderer.on("network-status", (event, arg) => {
    status.set(arg.status);
    if (arg.ipAddress) {
      if (validate_ipv4(arg.ipAddress)) {
        local_ip.set(arg.ipAddress);
        const pin_code = encode_pin(arg.ipAddress);
        local_pin.set(pin_code);
      } else {
        addNotification({
          text: "Your local IP is wrong",
          type: "danger",
          position: "bottom-left"
        });
      }
    }
  });
  const tryAgain = () => {
    ipcRenderer.send("network-status-check");
  };
</script>

<style>
  .error {
    width: 100%;
    height: 35px;
    background: #e74c3c;
    position: absolute;
    top: 0;
    left: 0;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  p {
    margin: 0;
    padding: 0;
    font-size: 15px;
    color: #fff;
  }
  span {
    text-decoration: underline;
    cursor: pointer;
    margin-left: 5px;
  }
</style>

{#if $status == 'offline'}
  <div class="error">
    <p>
      {message}
      <span on:click={tryAgain}>try again</span>
    </p>
  </div>
{/if}
