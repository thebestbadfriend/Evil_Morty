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
                //I should add a 'help' case which lists all available commands, each with a brief summary
                //Maybe also a 'help' case for each command to give a description of the command, its usage,
                //and if applicable, any arguments which can be passed to it.
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
                                        responseType: 'edit joke',
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
        //for now the .then and the .catch here do the same thing, but
        //I'm leaving them separate, because I expect I will have
        //reasons to handle them differently in the near future.
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
                    try {
                        msg.delete(5000);
                        d_msg.delete(5000);
                    }
                    catch{
                        console.log('Could not successfully delete messages');
                    }
                }
            });
        });

    }

});

client.login(auth.token);
