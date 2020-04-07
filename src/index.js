const express = require('express');
const http = require('http');
const path = require('path');
const socketio = require('socket.io');
const Filter = require('bad-words');

const { generateMessage, generateLocationMessage } = require('./utils/messages');
const {
    addUser,
    removeUser,
    getUser,
    getUsersInRooms
} = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT;
const publicDirecthoryPath = path.join(__dirname, './../public');

app.use(express.static(publicDirecthoryPath));

io.on('connection', (ws) => {
    
    ws.on('join', ({username, room}, callback) => {
        const { error, user } = addUser({ id: ws.id, username, room });

        if (error) {
            return callback(error);
        }

        ws.join(user.room);

        ws.emit('message', generateMessage('Welcome!', 'System'));
        ws.broadcast.to(user.room).emit('message', generateMessage(`${user.username} has joined!`, 'System'));
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRooms(user.room)
        });

        callback();
    });

    ws.on('sendMessage', (msg, callback) => {
        const user = getUser(ws.id);

        if (!user) {
            return callback('Something went wrong!');
        }

        const filter = new Filter();

        if (filter.isProfane(msg)) {
            return callback('Profanity is not allowed!');
        }

        io.to(user.room).emit('message', generateMessage(msg, user.username));
        callback();
    });

    ws.on('sendLocation', (loc, callback) => {
        const user = getUser(ws.id);

        if (!user) {
            return callback('Something went wrong!');
        }

        io.to(user.room).emit('locationMessage', generateLocationMessage(loc, user.username));
        callback();
    });

    ws.on('disconnect', () => {
        const user = removeUser(ws.id);

        if (user) {
            io.to(user.room).emit('message', generateMessage(`${user.username} has left`, 'System'));
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRooms(user.room)
            });
        }
    });
});


server.listen(port, () => {
    console.log(`App is up and running on port ${port}`);
});