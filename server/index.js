const httpServer = require("http").createServer();
const io = require("socket.io")(httpServer, {
  cors: {
    origin: "http://localhost:8080",
  },
});
const colors = ['coeur', 'carreau', 'pique', 'trèfle'];
Array.prototype.sample = function(){
  return this[Math.floor(Math.random()*this.length)];
}

function Card(value, family) {
  this.value = value;
  this.family = family;
  this.selected = false;

  this.isAtout = function(atout) {
      return this.family == atout 
  }
}

function composePlayerHand(game) {
  let hand = []
  for (let i = 0; i < 6; i++) {
      hand.push(game.deck.DrewACard())
  }
  return hand;
}

function Player(id, game) {
  this.id = id;
  this.cards = composePlayerHand(game);
  this.role = true;//de base ce sont des attaquant

  // this.showCards = function() {
  //     $('#playerHandDiv').empty()
  //     this.cards.forEach(function(card, index) {
  //         var button = jQuery('<button></button>');
  //         button.text(card.value + " de " + card.family);
  //         button.click(function() {playThisCard(this, index, card)})
  //         $('#playerHandDiv').append(button);
  //     })
  // }
  this.getMinAtout = function(atout) {
    let min = 12;
    for (let card of this.cards) {
      if (card.isAtout(atout) && card.value < min) {
        min = card.value
      }
    }
    return min
  }
}

function composeDeck() {
  let deck = [];
  colors.forEach(function(family)
  {    
      for (let i = 6; i <= 13; i++) {
          deck.push(new Card(i, family))
      }
  }) 
  return deck;
}

function Deck() {
  this.cards = composeDeck()

  this.DrewACard = function() {
      return this.cards.splice(Math.floor(Math.random()*this.cards.length), 1)[0];
  }
}

function Game() {
  this.deck = new Deck();
  this.atout = colors.sample();
  // this.playingCards = [];
  this.attaquant = "";
  this.defenseur = "";
  this.cardsOnTable = [];

  this.canThisCardAttack = function(card) {
    for (let cardOnTable in this.cardsOnTable) {
      if (cardOnTable.value == card.value) {
        return true
      }
    }
    return false
  }
  this.canThisCardDefend = function(card, cible) {
    if (this.cardsOnTable.includes(cible)) {
      if (card.family == cible.family && card.value > cible.value) {
        return true
      }
      if (card.isAtout(this.atout) && !cible.isAtout(this.atout)) {
        return true
      }
    }
    return false
  }
}

const chambers = [
  {
    title: "chamber1",
    id: 0,
    number_max_player: 4,
    current_member: 0,
  },
  {
    title: "chamber2",
    id: 1,
    number_max_player: 4,
    current_member: 0
  },
]

function ResetChamber(chamber_id) {
  let chamber = getChamber(chamber_id);
  if (chamber != undefined) {
    chamber.current_member = 0
  }
}

function getChamber(chamber_id) {
  for (let i of chambers) {
    if (i.id == chamber_id) {
      return i;
    }
  } //TODO lors de la recherche db faire une recherche WHERE id == username
  return undefined;
}

io.use((socket, next) => {
  const username = socket.handshake.auth.id;
  if (!username) {
    return next(new Error("invalid username"));
  }
  socket.username = username;
  next();
});



io.on("connection", (socket) => {
  // fetch existing users
  let chamber = getChamber(socket.username);


  if (chamber != undefined) {
    chamber.current_member++;
    socket.join(chamber['title']);
    console.log('totot')
    io.to(chamber['title']).emit("Join Room", {id : chamber.id})
  }

  socket.on('game_ready', () => {
    //Créer le deck
    //Distribuer le deck
    //Envoyer le deck
    let players = io.sockets.adapter.rooms.get(chamber['title'])
    console.log(players)
    
    chamber['game'] = new Game(); 
    chamber.players = []
    let mins = []
    for (let player of players) {
      new_player = new Player(player, chamber.game)
      chamber.players.push(new_player)
      mins.push(new_player.getMinAtout(chamber.game.atout))
      io.to(player).emit('game_ready', {'jeu' : new_player})
    }
    let min = 0
    for (let i = 0; i < mins.length; i++) {
      if (mins[i] < mins[min]) {
        min = i
      }
    }
    chamber.game.attaquant = chamber.players[min].id
    chamber.game.defenseur = chamber.players[(min + 1) % (chamber.players.length)].id
    io.to(chamber['title']).emit('role_distribution', {
      "attaquant" : chamber.game.attaquant, 
      "defenseur" : chamber.game.defenseur
    })
  });

  
  socket.on('attack', (card) => {
    if (socket.id == chamber.game.attaquant) {

    }
  })
  // socket.on("disconnect", () => {
  //   ResetChamber()
  //   socket.to(chamber['title']).emit("disconnect")
  // })
});

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () =>
  console.log(`server listening at http://localhost:${PORT}`)
);
