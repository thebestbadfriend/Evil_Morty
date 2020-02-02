const Discord = require('discord.js');
const client = new Discord.Client();
const auth = require('./auth.json');
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const fetchData = url => {
    axios.get(url)
        .then(response => {
            console.log(response.data);
        })
};

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});


client.on('message', msg => {

    const channel = msg.channel;

    function processMessage() {

        return new Promise((resolve, reject) => {
            const command = msg.content.substring(2, msg.content.length);

            switch (command) {
                case 'tell me a joke':
                    resolve({
                        name: 'joke',
                        message: 'your face',
                        doDelete: false
                    });
                    break;
                default:
                    reject({
                        name: 'fail',
                        message: 'Sorry. I don\'t recognize that command',
                        doDelete: true
                    });
                    break;
            }
        });

    }

    if (msg.content.startsWith('$:')) {

        var reply;
        processMessage().then((response) => {
            reply = channel.send(response.message).then(d_msg => {
                if (response.doDelete) {
                    msg.delete(5000);
                    d_msg.delete(5000);
                }
            });
        }).catch((response) => {
            reply = channel.send(response.message).then(d_msg => {
                if (response.doDelete) {
                    msg.delete(5000);
                    d_msg.delete(5000);
                }
            });
        });

    }

});

client.login(auth.token);
