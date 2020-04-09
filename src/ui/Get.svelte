<script>
  import { status } from "../store/network";
  import { getNotificationsContext } from "svelte-notifications";
  import decode_pin from "../helper/decode_pin";
  import validate_ipv4 from "../helper/validate_ipv4";
  const { addNotification } = getNotificationsContext();
  let pin;
  const formOnSubmit = event => {
    event.preventDefault();
    const target_ip = decode_pin(pin);
    if (validate_ipv4(target_ip)) {
    } else {
      addNotification({
        text: "PIN is wrong",
        type: "danger",
        position: "bottom-left"
      });
    }
  };
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
  <form on:submit={formOnSubmit}>
    <input
      bind:value={pin}
      type="text"
      class="form-control"
      placeholder="Connection PIN"
      required />
    {#if $status == 'online'}
      <button class="btn">Connect</button>
    {:else}
      <button class="btn" disabled>Connect</button>
    {/if}
  </form>
</div>
