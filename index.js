const express = require('express');
const app = express()
require('express-ws')(app)

app.use(express.static(__dirname + '/views'));

var player_max_id = 0
var playerlist = {}

app.ws('/ws', (ws, req) => {    
    var player_id = player_max_id++

    var player = new Player(ws)

    console.log("join player "+player_id)

    // send to self
    ws.send(JSON.stringify({
        action: "join",
        id: player_id,
        others: Object.keys(playerlist)
    }))

    // announce to others
    for( key in playerlist ) {
        var player_ws = playerlist[key]
        player_ws.send(JSON.stringify({
            action: "announce",
            id: player_id
        }))
    }

    // add player to list
    playerlist[player_id] = ws
    
    ws.on('message', (msg) => {
        for( key in playerlist ) {
            var player_ws = playerlist[key]
            player_ws.send(msg)
        }
    })

    ws.on('close', (req) => {
        console.log("leaving player "+player_id)
        delete playerlist[player_id]

        for( key in playerlist ) {
            var player_ws = playerlist[key]
            player_ws.send(JSON.stringify({
                action: "leave",
                id: player_id
            }))
        }
    })
})

app.listen(8888,null,()=>{
    console.log("Server started at localhost:8888")
})