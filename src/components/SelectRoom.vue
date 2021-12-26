<template>
  <div class="select-room">
    <form @submit.prevent="onSubmit">
      <input v-model="username" placeholder="Your room id..." />
      <button :disabled="!isValid">Send</button>
    </form>
  </div>
</template>

<script>
export default {
  name: "SelectRoom",
  data() {
    return {
      username: "",
    };
  },
  computed: {
    isValid() {
      return this.username.length > 2;
    },
  },
  methods: {
    onSubmit() {
      this.$emit("input", this.username);
    },
  },
};
</script>

<style scoped>
.select-room {
  width: 300px;
  margin: 200px auto 0;
}
</style>