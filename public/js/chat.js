const ws = io();

// Elements
const form = document.querySelector('#messageForm');
const messageInput = document.querySelector('#messageInput');
const sendButton = document.querySelector('#sendButton');
const locationButton = document.querySelector('#shareLocation');
const messages = document.querySelector('#messages');

// Templates
const messageTemplate = document.querySelector('#messageTemplate').innerHTML;
const locationTemplate = document.querySelector('#locationTemplate').innerHTML;
const sidebarTemplate = document.querySelector('#sidebarTemplate').innerHTML;

// Options
const { username, room} = Qs.parse(location.search, { ignoreQueryPrefix: true } );

const autoscroll = () => {
    const newMessage = messages.lastElementChild;
    const newMessageStyles = getComputedStyle(newMessage);
    const newMessageMargin = parseInt(newMessageStyles.marginBottom);
    const newMessageHeight = newMessage.offsetHeight + newMessageMargin;

    const visibleHeight = messages.offsetHeight;
    const contentHeight = messages.scrollHeight;

    const scrollOfset = messages.scrollTop + visibleHeight;

    if (contentHeight - newMessageHeight <= scrollOfset) {
        console.log('HERE');
        messages.scrollTop = messages.scrollHeight;
    }
}

ws.on('message', (data) => {
    const html = Mustache.render(messageTemplate, {
        message: data.text,
        createdAt: moment(data.createdAt).format('H:mm'),
        createdFrom: data.createdFrom
    });
    messages.insertAdjacentHTML('beforeend', html);
    autoscroll();
});

ws.on('locationMessage', (data) => {
    const html = Mustache.render(locationTemplate, {
        location,
        createdAt: moment(data.createdAt).format('H:mm'),
        createdFrom: data.createdFrom
    });
    messages.insertAdjacentHTML('beforeend', html);
    autoscroll();
});

ws.on('roomData', ({room, users}) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    });
    document.querySelector('#sidebar').innerHTML = html;
});

form.addEventListener('submit', (event) => {
    event.preventDefault();
    sendButton.setAttribute('disabled', 'disabled');

    ws.emit('sendMessage', messageInput.value, (error) => {
        sendButton.removeAttribute('disabled');
        if (!error) {
            console.log('Message was sent');
        } else {
            console.log(error);
        }
        messageInput.value = '';
        messageInput.focus();
    });
    
});

locationButton.addEventListener('click', () => {
    if(!navigator.geolocation) {
        return alert('Your browser does not support location!');
    }
    locationButton.setAttribute('disabled', 'disabled');

    navigator.geolocation.getCurrentPosition( (position) => {
        const positionString = `https://google.com/maps?q=${position.coords.latitude},${position.coords.longitude}`;
        ws.emit('sendLocation', positionString, (error) => {
            if (!error) {
                console.log('Location was sent');
            }
            locationButton.removeAttribute('disabled');
        });
    });
});

ws.emit('join', { username, room }, (error) => {
    if(error) {
        alert(error);
        location.href = '/';
    }
});
