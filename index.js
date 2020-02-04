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

const listDir = path => {
    return fs.readdirSync(path);
};

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});


client.on('message', msg => {

    const channel = msg.channel;

    function processMessage() {

        return new Promise((resolve, reject) => {
            const commandStringStart = 2;
            var commandStringStop;

            if (msg.content.substring(commandStringStart).includes(':')) {
                commandStringStop = msg.content.lastIndexOf(':');
            }
            else {
                commandStringStop = msg.content.length;
            }

            const command = msg.content.substring(commandStringStart, commandStringStop);
            console.log(command);
            switch (command) {
                case 'joke':
                    try {
                        const jokeDir = 'resources/jokes/';
                        const jokeFiles = listDir(jokeDir);
                        const fileSelector = Math.round(Math.random() * (jokeFiles.length - 1));
                        const jokeFile = jokeFiles[fileSelector];
                        const fileContents = fs.readFileSync(jokeDir + jokeFile);
                        const fileContentsJSON = JSON.parse(fileContents);
                        var jokeSelector;
                        var joke;
                        var validJoke = false;

                        while (!validJoke) {
                            jokeSelector = Math.round(Math.random() * (fileContentsJSON.length - 1));
                            joke = fileContentsJSON[jokeSelector];

                            if (joke.body != '' && joke.body.length < 500) {
                                validJoke = true;
                            }
                        }

                        resolve({
                            responseType: 'joke',
                            file: jokeFile,
                            id: joke.id,
                            message: `${jokeFile}/${joke.id}\n${joke.body}`,
                            doDelete: false
                        });
                    }
                    catch{
                        reject({
                            responseType: 'failure',
                            message: 'Well... this is awkward. Apparently my maker fucked something up. Try again, maybe?',
                            doDelete: true
                        });
                    }
                    break;
                case 'ban joke':
                    resolve({
                        responseType: 'edit joke',
                        message: 'success. Joke is still active, but still... resolve procd',
                        doDelete: false
                    });
                    break;;
                default:
                    reject({
                        responseType: 'invalid command',
                        message: "Sorry. I don't recognize that command",
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
