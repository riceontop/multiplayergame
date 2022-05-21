const express = require('express');
const app = express()
require('express-ws')(app)

app.use(express.static(__dirname + '/views'));

var player_max_id = 0
var playerlist = {}

class Player {
    constructor(ws) {
        this.ws = ws
        this.id = player_max_id++
    }

    sendMsg( obj ) {
        var msg = JSON.stringify(obj)
        this.ws.send(msg)
    }

    onReceiveMsg( callback ) {
        this.ws.on('message', (msg)=>{
            var obj = JSON.parse(msg)
            callback(obj)
        })
    }

    onDisconnect( callback ) {
        this.ws.on('close', callback)
    }
}

app.ws('/ws', (ws, req) => {    
    var player = new Player(ws)

    console.log("join player "+player.id)

    // send to self
    player.sendMsg({
        action: "join",
        id: player.id,
        others: Object.keys(playerlist)
    })

    // announce to others
    for( key in playerlist ) {
        var p = playerlist[key]
        p.sendMsg({
            action: "announce",
            id: player.id
        })
    }

    // add player to list
    playerlist[player.id] = player

    // distribute incoming messages to all other players
    player.onReceiveMsg( (msg) => {
        for( key in playerlist ) {
            var p = playerlist[key]
            p.sendMsg(msg)
        }
    })

    player.onDisconnect( (req) => {
        console.log("leaving player "+player.id)
        delete playerlist[player.id]

        for( key in playerlist ) {
            var p = playerlist[key]
            p.sendMsg({
                action: "leave",
                id: player.id
            })
        }
    })
})

app.listen(8888,null,()=>{
    console.log("Server started at localhost:8888")
})