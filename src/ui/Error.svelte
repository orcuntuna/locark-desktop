<script>
  import { status } from "../store/network";
  export let message;
  const { ipcRenderer } = require("electron");
  ipcRenderer.on("network-status", (event, arg) => {
    console.log(arg);
    status.set(arg.status);
  });
  const tryAgain = () => {
    ipcRenderer.send('network-status-check');
  }
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