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
            const commandParameters = msg.content.substring(commandStringStop + 1);
            switch (command) {
                case 'help':
                    var helpResponse = `
`+                  `Evil Morty help:
`+                  `$:joke
`+                  `    tells a randomly selected joke
`+                  `$:ban joke: filename/jokeID
`+                  `    bans specified joke in the specified file
`
                    resolve({
                        responseType: 'help',
                        message: helpResponse,
                        doDelete: false
                    });
                    break;
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
                            
                            if (joke.body != '' && joke.body.length < 500 && !joke.banned) {
                                validJoke = true;
                            }
                        }

                        resolve({
                            responseType: 'tell',
                            file: jokeFile,
                            id: joke.id,
                            message: `${jokeFile}/${jokeSelector}\n${joke.body}`,
                            doDelete: false
                        });
                    }
                    catch (err) {
                        console.log(err);
                        reject({
                            responseType: 'error',
                            message: 'Well... this is awkward. Apparently my maker fucked something up. Try again, maybe?',
                            doDelete: true
                        });
                    }
                    break;
                case 'ban joke':
                    if (commandParameters.trim() != '') {
                        try {
                            const jokeDir = 'resources/jokes/';
                            var jokeFile = commandParameters.substring(0, commandParameters.indexOf('/')).trim();
                            var jokeFilePath = jokeDir + jokeFile;
                            var banID = commandParameters.substring(commandParameters.indexOf('/') + 1).trim();

                            if (fs.existsSync(jokeFilePath)) {
                                var jokeFileContents = fs.readFileSync(jokeFilePath);
                                jokeFileContents = JSON.parse(jokeFileContents);

                                if (banID >= 0 && banID < jokeFileContents.length) {
                                    jokeFileContents[banID].banned = true;
                                    fs.writeFileSync(jokeFilePath, JSON.stringify(jokeFileContents, null, 2));
                                    resolve({
                                        responseType: 'edit',
                                        message: commandParameters + ' banned.',
                                        doDelete: false
                                    });
                                }
                                else {
                                    console.log(jokeFileContents.length - 1);
                                    reject({
                                        responseType: 'failure',
                                        message: 'Invalid joke ID. Please provide joke ID between 0 and ' + (jokeFileContents.length - 1) + ' to ban a joke from ' + jokeFile,
                                        doDelete: false
                                    });
                                }
                            }
                            else {
                                var jokeFiles = listDir(jokeDir);
                                var jokeFilesString = '';
                                for (var i = 0; i < jokeFiles.length; i++) {
                                    jokeFilesString += jokeFiles[i] + '\n';
                                }
                                reject({
                                    responseType: 'failure',
                                    message: 'that file does not exist, available joke files are \n' + jokeFilesString,
                                    doDelete: false
                                });
                            }
                        }
                        catch (err) {
                            console.log(err);
                            reject({
                                responseType: 'error',
                                message: 'Well... this is awkward. Apparently my maker fucked something up. Try again, maybe?',
                                doDelete: true
                            });
                        }
                    }
                    else {
                        reject({
                            responseType: 'failure',
                            message: 'USAGE: $:ban joke: <joke_file>/<joke_id>',
                            doDelete: true
                        });
                    }
                    break;
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

        async function respondToMessage() {
            try {
                const reply = await processMessage();
                channel.send(reply.message);
                if (reply.doDelete) {
                    msg.delete(5000);
                    reply.delete(5000);
                }
            } catch (rejection) {
                channel.send(rejection.message);
            }
        }

        respondToMessage();
    }

});

client.login(auth.token);
