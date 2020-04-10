<script>
  import Notifications from "svelte-notifications";
  import Modal from "svelte-simple-modal";
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

<Modal>
  <Notifications>
    <div class="page">
      <Error message={'no network connection available'} />
      <Get />
      <Send />
    </div>
  </Notifications>
</Modal>
