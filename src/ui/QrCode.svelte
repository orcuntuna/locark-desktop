<script>
  import { onMount, onDestroy } from "svelte";
  export let code;
  let qr_data;
  var QRCode = require("qrcode");
  onMount(() => {
    QRCode.toString(code, { quality: 1, type: "svg" }, function(err, string) {
      qr_data = string;
    });
  });
</script>

<style>
  .qr {
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .svg {
    width: 50%;
    height: auto;
    margin-top: 10px;
  }
</style>

<div class="qr">
  {#if qr_data}
    <div class="svg">
      {@html qr_data}
    </div>
  {:else}
    <p>Please wait, creating qr code</p>
  {/if}
</div>
