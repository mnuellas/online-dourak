<template>
<div id="app">
  <select-room 
  v-if="!room_idAlreadySelected"
  @input="onRoomSelection" />
  <room v-else />
  <button v-on:click="ready">Click me</button>
</div>
</template>

<script>
import SelectRoom from "./components/SelectRoom";
import Room from "./components/Room";
import socket from "./socket";

export default {
  name: 'App',
  components: {
    SelectRoom,
    Room
  },
  data() {
    return {
      room_idAlreadySelected: false,
      playerData : {}
    };
  },
  methods: {
    onRoomSelection(username) {
      this.room_idAlreadySelected = true;
      socket.auth = { id : username['data'] };
      socket.connect();
    },
    ready() {
      console.log('roro')
      socket.emit('game_ready')
    }
  },
  mounted() {
    socket.on("connect_error", (err) => {
      if (err.message === "invalid username") {
        this.usernameAlreadySelected = false;
      }
    });
    socket.on('Join Room', () => {
      console.log('room_joined')
    });
    socket.on('game_ready', (data) => {
      console.log(data)
      this.playerData = data.jeu
    });
    socket.on('role_distribution', (data) => {
      if (data.attaquant == this.playerData.id) {
        this.playerData.role = false
        // Ici mettre qui est attaquant ou defenseur
      }
    })
  },

}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
