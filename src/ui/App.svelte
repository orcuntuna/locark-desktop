<script>
  import Notifications from "svelte-notifications";
  import Get from "./Get.svelte";
  import Send from "./Send.svelte";
  import Error from "./Error.svelte";
</script>

<style>
  .page {
    display: flex;
    width: 100%;
    height: 100vh;
  }
</style>

<Notifications>
  <div class="page">
    <Error message={'no network connection available'} />
    <Get />
    <Send />
  </div>
</Notifications>
