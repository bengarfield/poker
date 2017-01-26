function getSafeGameObj(extradata){
    var thisGame = Object.assign({}, theGame);
    thisGame = Object.assign(thisGame, extradata);
    thisGame.players = null;
    thisGame.players = [];
    for (var i = 0; i < theGame.players.length; i++) {
        if (theGame.players[i].prevState > theGame.players[i].state) {
            thisGame.players[i] = getSafePlayer(theGame.players[i], true);
        } else {
            thisGame.players[i] = getSafePlayer(theGame.players[i]);
        }
    }

    if (globalPlayerIndex != -1) {
        thisGame.playerUpdate = getSafePlayer(theGame.players[globalPlayerIndex]);
    }
    thisGame.judge = null;
    thisGame.syncInstance = null;
    thisGame.betCube = null;
    thisGame.potHolder = null;
    thisGame.logic = null;
    thisGame.startGameButton = null;
    thisGame.winCube = null;
    thisGame.dealingOrder = null;
    thisGame.sharedCards = {cards:getSafeCards(theGame.sharedCards)};
    if (theGame.deck instanceof deck) {
        thisGame.cards = {cards:getSafeCards({cards: theGame.deck.cards})};
    }
    thisGame.deck = null;

    console.log(thisGame);
    return JSON.parse(JSON.stringify(thisGame));
}

function getSafePlayer(thePlayer, important) {
    var player = Object.assign({}, thePlayer);
    player.joinButton = null;
    player.bettingui = null;
    player.optionsui = null;
    player.chipCount = null;
    player.chipStack = null;
    player.joinButton = null;
    player.dealerChip = null;
    player.dealerUI = null;
    player.hand = null;
    player.startGame = null;
    player.prevState = null;
    if (important) {
        player.importantUpdate = true;
    }
    player.updateFunction = null;
    player.cards = getSafeCards(thePlayer);

    return player;
}

function getSafeCards(player) {
    var cards = [];
    if (player.cards.length === 0) {
        return player.cards;
    }

    for (var i = 0; i < player.cards.length; i++) {
        var card = Object.assign({}, player.cards[i]);
        card.geom = null;
        card.movementTween = null;
        card.image = null;
        cards[i] = card;
    }

    return cards;
}

function processUpdates(newUpdates) {
    var logstring = newUpdates.map(function(elem){return elem.title;}).join('\n');
    console.log('processing', logstring);

    var updateType, data;
    var authority;

    newUpdates.sort(function(x, y) {
        return parseInt(x.timestamp) - parseInt(y.timestamp);
    });

    console.log("apply these updates", newUpdates);
    var indexOfError = 0;
    try {
        for (var x = 0; x < newUpdates.length; x++) {
            indexOfError = x;
            updateType = newUpdates[x].title;
            data = newUpdates[x].data;
            console.log("processing update", newUpdates[x]);
            theGame.roundRecord.push(newUpdates[x]);
            switch(updateType){
            case "startedLevel":
                cutoffTime = newUpdates[x].timestamp;
                theGame.roundRecord = [];
                theGame.roundRecord.push(newUpdates[x]);
                break;
            case "unlockGame":
                for (var i = 0; i < theGame.players.length; i++) {
                    if (theGame.players[i].state === -3) {
                        theGame.players[i].state = -1;     //set them back to not joined
                    }
                }
                break;
            case "lockGame":
                //data.playerIndexes will store the players we don't set to -3;
                for (var i = 0; i < theGame.players.length; i++) {
                    if (data.playerIndexes.indexOf(i) === -1) {   //set any not joined to 'locked'
                        theGame.players[i].state = -3;
                    }
                }
                break;
            case "registerPlayer":
                theGame.players[data.registerIndex].userId = data.userId;
                theGame.players[data.registerIndex].state = 0;
                theGame.players[data.registerIndex].renderVisuals(0);
                theGame.players[data.registerIndex].money = data.money;
                theGame.players[data.registerIndex].name = data.name;

                if (data.userId === globalUserId) {
                    globalPlayerIndex = data.registerIndex;
                }

                /*var forwardDirection = new THREE.Vector3(0, 0, 1);
                 var matrix = new THREE.Matrix4();
                 matrix.extractRotation(handObj.matrix);
                 forwardDirection.applyMatrix4(matrix);
                 */

                var handObj = theGame.players[data.registerIndex].hand;
                var pos = new THREE.Vector3();
                pos.copy(handObj.position);
                var winMessage = new errorMessage({
                    timeToDisappear: 2000,
                    messageType: 1,
                    message: data.name+" joined!",
                    pos: pos,
                    rot: handObj.quaternion
                });

                break;
            case "dealingCards":

                for (var i = 0; i < data.player.cards.length; i++) {
                    theGame.players[data.index].cards[i] = data.player.cards[i];
                    //remove a card from the deck, so if the host refreshes their deck is still at the same state
                    theGame.deck.cards.pop();
                }
                theGame.players[data.index].state = 1;
                theGame.players[data.index].renderVisuals(0);
                theGame.players[data.index].state = 2;


                //theGame.players[data.index]

                break;
            case "startHand":
                //theGame.currentAuthority = data.authority;
                authority = data.authority;
                theGame.resetCards();

                theGame.resetSharedRotation();

                if (data.blind !== theGame.smallBlind) {
                    theGame.smallBlind = data.blind;
                    theGame.timeBlindStarted = data.blindStartTime;
                    //display message notifying that the blinds went up
                    displayMessageSingle({
                        message: "Blinds are now $"+theGame.smallBlind+" and $"+(theGame.smallBlind*2)+"!",
                        messageType: 3,
                        messagePos: new THREE.Vector3(0, -20, 0),
                        messageRot: new THREE.Quaternion(),
                        moveDirection: new THREE.Vector3(0, 0, 0),
                        scale: new THREE.Vector3(1, 1, 1),
                        arrowSide: "down",
                        timeToDisappear: 4000
                    });
                }

                theGame.deck.arrange(data.deck);
                for (var i = 0; i < theGame.players.length; i++) {
                    if (theGame.players[i].state === 0) {    //they're  waiting
                        theGame.players[i].state = 2;
                    }
                    theGame.players[i].betThisRound = 0;
                    theGame.players[i].totalBet = 0;
                    theGame.players[i].cards = [];
                }
                theGame.resetDealers();
                theGame.bettingPots = [];
                theGame.bettingPots.push(new Pot());
                //theGame.step = 1;
                theGame.dealer = data.dealer;
                for (var i = 0; i < theGame.players.length; i++) {
                    Utils.toggleVisible(theGame.players[i].dealerChip.mesh, false);
                }

                Utils.toggleVisible(theGame.dealingOrder[theGame.dealer].dealerChip.mesh, true);
                Utils.toggleVisible(theGame.dealingOrder[theGame.dealer].dealerUI.mesh, false);

                /*
                 var words = theGame.players[theGame.dealer].name + " dealt a new hand!";
                 var pos = new THREE.Vector3();
                 pos.copy(theGame.players[theGame.dealer].hand.position);
                 var rot = theGame.players[theGame.dealer].hand.quaternion;

                 var handMessage = new errorMessage({
                 timeToDisappear: 2000,
                 messageType: 1,
                 message: words,
                 pos: pos,
                 rot: rot
                 });*/
                // theGame.runClientStep();

                break;
            case "changeGameStep":
                console.log(data);
                theGame.step = data.toStep;
                theGame.runClientStep();
                break;
                /* case "waitingFor":
                 //data.toPlayer
                 break;*/
            case "requestFinishBetting":
                if (data.authority === globalUserId && x === (newUpdates.length-1)) {
                    //only act if we're the authority and it's the last step
                    theGame.better = 0;
                    theGame.step++;
                    theGame.runStep();
                }
                break;
            case "playerBet":

                theGame.players[data.i].bet(data.amount);
                theGame.players[data.i].renderChips();
                makePot();
                theGame.nextBet();
                var name = theGame.players[data.i].name;
                var handObj = theGame.players[data.i].hand;
                var pos = new THREE.Vector3();
                pos.copy(handObj.position);

                var message;
                if (data.amount === 0) {
                    message = name+" checked!";
                } else if (theGame.players[data.i].money === 0) {
                    message = name+" went all-in with $"+data.amount+"!";
                } else {
                    message = name+" bet $"+data.amount+"!";
                }
                var winMessage = new errorMessage({
                    timeToDisappear: 3000,
                    messageType: 2,
                    message: message,
                    pos: pos,
                    rot: handObj.quaternion
                });
                break;
            case "playerFold":

                theGame.players[data.i].fold();
                var name = theGame.players[data.i].name;
                var handObj = theGame.players[data.i].hand;
                var pos = new THREE.Vector3();
                pos.copy(handObj.position);

                var message = name+" folded...";
                var winMessage = new errorMessage({
                    timeToDisappear: 3000,
                    messageType: 0,
                    message: message,
                    pos: pos,
                    rot: handObj.quaternion
                });

                break;
            case "playerWinByForfeit":

                var thisPlayer = theGame.players[data.winnerByForfeit.spot];
                theGame.resetCards();
                Utils.toggleVisible(theGame.winCube, false);
                Utils.toggleVisible(theGame.betCube, false);

                var handObj = thisPlayer.hand;
                var pos = new THREE.Vector3();
                pos.copy(handObj.position);

                var message = thisPlayer.name+" won by forfeit!";
                var winMessage = new errorMessage({
                    timeToDisappear: 10000,
                    messageType: 2,
                    message: message,
                    pos: pos,
                    rot: handObj.quaternion
                });
                var totalMoney = 0;
                for (var i = 0; i < theGame.bettingPots.length; i++) {
                    totalMoney += theGame.bettingPots[i].amount;
                }
                thisPlayer.money += totalMoney;
                thisPlayer.renderChips();
                theGame.bettingPots = [];

                break;
            case "totalVictory":
                var player = theGame.players[data.index];
                var name = data.name;


                var handObj = player.hand;
                var pos = new THREE.Vector3();
                pos.copy(handObj.position);

                pos.y += 180;


                var message = name + " won the tournament!";
                var winMessage = new errorMessage({
                    timeToDisappear: 15000,
                    messageType: 2,
                    message: message,
                    pos: pos,
                    rot: handObj.quaternion,
                    scale: 2,
                });

                //set every spot state to -3
                //disable the lock mechanism
                //keep refresh button

                for (var i = 0; i < theGame.players.length; i++) {
                    theGame.players[i].state = -3;
                    Utils.toggleVisible(theGame.players[i].optionsui.mesh, true);
                    Utils.toggleVisible(theGame.players[i].optionsui.lockButton, false);
                    Utils.toggleVisible(theGame.players[i].optionsui.refreshButton, true);
                }
                Utils.toggleVisible(theGame.startGameButton, false);
                setTimeout(function(){
                    theGame.resetCards();
                    document.querySelector("svg .winner").textContent = "Congratulations "+name+"!";
                    document.querySelector("svg .winner").style.display = "block";
                    // document.querySelector("#newGameButton").classList.add("visible");
                }, 5000);

                break;
            case "playerWin":

                Utils.toggleVisible(theGame.betCube, false);
                var highestHands = data.hands;
                var handOrder = Object.keys(highestHands).map(function(val){return parseInt(val);});
                handOrder.sort(function(a, b) { //sorting in reverse order
                    return b-a;
                });

                var playerWins = [];

                /*
                 *   {player: theplayer,
                 *   amount: amount,
                 *   hand: hand}
                 */

                var winners = [];

                for (var i = 0; i < handOrder.length; i++) {
                    var hand = highestHands[handOrder[i]];
                    for(var j = 0; j < hand.players.length; j++) {
                        winners.push({
                            players: hand.players[j].players,
                            hands: hand.players[j].hands
                        });
                    }
                }

                var handIndex = 0;
                for (var i = theGame.bettingPots.length - 1; i >= 0; i--) {
                    var thisPot = theGame.bettingPots[i];
                    var splitAmount = 0;
                    if(winners[handIndex].players.length === 1) {
                        var winningPlayer = theGame.players[winners[handIndex].players[0].spot];
                        if (winningPlayer.totalBet >= thisPot.amountToContribute) {
                            splitAmount = thisPot.amount;
                            winningPlayer.money += splitAmount;
                            winningPlayer.renderChips();
                            thisPot.amount = 0;

                            playerWins.push({
                                player: winningPlayer,
                                amount: splitAmount,
                                hand: winners[handIndex].hands[0]
                            });

                        } else {
                            //not qualified for this hand, let's go to the next biggest hand
                            handIndex++;
                            i++;
                        }

                    } else {

                        //split this pot amoungst these players

                        var thisPotAmount = thisPot.amount;
                        var qualifiedHands = winners[handIndex].hands.slice(0);
                        //remove any players not qualified for this pot
                        var qualifiedPlayers = winners[handIndex].players.filter(function(elem, index){
                            //also remove their hand
                            if (theGame.players[elem.spot].totalBet >= thisPot.amountToContribute) {
                                return true;
                            } else {
                                qualifiedHands.splice(index, 1);
                                return false;
                            }
                        });

                        for (var j = 0; j < qualifiedPlayers.length; j++) {
                            var winningPlayer = theGame.players[qualifiedPlayers[j].spot];
                            splitAmount = Math.floor(thisPotAmount/qualifiedPlayers.length);
                            winningPlayer.money += splitAmount;
                            thisPot.amount -= splitAmount;
                            winningPlayer.renderChips();
                            playerWins.push({
                                player: winningPlayer,
                                amount: splitAmount,
                                hand: qualifiedHands[j]
                            });
                        }
                    }
                }

                var sendingMessages = [];
                var didWin = 0;     //0 is defeat, 1 is defeat at showdown, 2 is victory
                for (var i = 0; i < playerWins.length; i++) {

                    //go through the rest of the playerWins array
                    //merge any duplicates
                    //credit the highest hand

                    for (var j = i + 1; j < playerWins.length; j++) {
                        if (playerWins[i].player.spot === playerWins[j].player.spot) {
                            playerWins[i].amount += playerWins[j].amount;
                            if (playerWins[j].hand.value > playerWins[i].hand.value || (playerWins[j].hand.value === playerWins[i].hand.value && playerWins[j].hand.subValue > playerWins[i].hand.subValue)) {
                                playerWins[i].hand = playerWins[j].hand;
                            }
                            playerWins.splice(j--, 1);
                        }
                    }

                    var winningPlayer = playerWins[i].player;
                    var splitAmount = playerWins[i].amount;

                    var handObj = playerWins[i].player.hand;
                    var pos = new THREE.Vector3();
                    pos.copy(handObj.position);

                    if (playerWins.length === 1) {
                        var message = winningPlayer.name + " won $" + splitAmount + " with " + playerWins[i].hand.name + "!";
                    } else {
                        var message = winningPlayer.name + " split the pot for $" + splitAmount + " with " + playerWins[i].hand.name + "!";
                    }

                    //are we this player? if so, play sound.
                    //if not, also play sound
                    if (winningPlayer.spot === globalPlayerIndex) {
                        didWin = 2;
                    }
                    sendingMessages.push({
                        timeToDisappear: 10000,
                        messageType: 2,
                        message: message,
                        messagePos: pos,
                        messageRot: handObj.quaternion
                    });
                }

                for (var i = 0; i < winners.length; i++) {
                    for (var j = 0; j < winners[i].players.length; j++) {
                        var handObj = theGame.players[winners[i].players[j].spot].hand;
                        var pos = new THREE.Vector3();
                        pos.copy(handObj.position);

                        var cardMessage = "";
                        for (var k = 0; k < winners[i].hands[j].cards.length; k++) {
                            if (k !== 0) {
                                cardMessage += ", ";
                            }
                            cardMessage += Card.prototype.friendlyRepresentation.apply(winners[i].hands[j].cards[k]);
                        }
                        if (winners[i].players[j].spot === globalPlayerIndex && didWin === 0) {
                            didWin = 1;
                        }
                        var pos2 = new THREE.Vector3();
                        pos2.copy(pos);
                        pos2.y += 50;
                        sendingMessages.push({
                            timeToDisappear: 10000,
                            messageType: 3,
                            message: cardMessage,
                            messagePos: pos2,
                            messageRot: handObj.quaternion
                        });
                    }
                }

                //0 is defeat, 1 is defeat at showdown, 2 is victory
                switch(didWin) {
                case 0:
                    soundEngine.playSound("loseHand");
                    break;
                case 1:
                    soundEngine.playSound("loseShowdown");
                    break;
                case 2:
                    soundEngine.playSound("winHand");
                    break;
                }

                //condense any straggler chips to one pot

                makePot();
                theGame.step = 9;
                displayMessage(sendingMessages);
                //theGame.resetCards();
                if(globalUserId === theGame.dealingOrder[theGame.dealer].userId){
                    //show the step change UI
                    Utils.toggleVisible(theGame.dealingOrder[theGame.dealer].dealerChip.mesh, true);
                    window.setTimeout(function(){
                        displayMessageSingle({
                            timeToDisappear:3000,
                            scale:new THREE.Vector3(0.4, 0.4, 0.4),
                            messageType:1,
                            message:"Click to start next hand!",
                            messagePos:theGame.dealingOrder[theGame.dealer].dealerUI.mesh.getWorldPosition(),
                            arrowSide: "down",
                            moveDirection: new THREE.Vector3(0, 50, 0)
                        });
                    }, 10);

                }
                break;
            case "dealSharedCards":
                Array.prototype.push.apply(theGame.sharedCards.cards, data.sharedCards);
                for (var i = 0; i < data.sharedCards.length; i++) {
                    theGame.deck.cards.pop();
                }
                break;
            case "transferControl":
                for (var i = 0; i < theGame.players.length; i++) {
                    theGame.players[i].state = data.endstatePlayers[i].state;
                    theGame.players[i].money = data.endstatePlayers[i].money;
                    Utils.toggleVisible(theGame.players[i].optionsui.mesh, false);
                }
                theGame.resetCards();
                cutoffTime = newUpdates[x].timestamp;

                theGame.roundRecord = [];

                //we're about to get a hell of a lot of new updates
                authority = theGame.players[data.transferControl].userId;

                Utils.toggleVisible(theGame.players[data.transferControl].optionsui.mesh, true);

                if (theGame.players[data.transferControl].userId === globalUserId) {

                    console.log("WE ARE NOW AUTHORITY");
                    //we are now the dealer!
                    //apply the money and spots from the previous dealer

                    theGame.nextHand();
                }
                break;
            default:
                console.log("No action specified for update", updateType, data);
                break;
            }
        }
    }
    catch(e) {
        console.log('error while processing message', newUpdates[indexOfError]);
        console.log(e, e.message);
    }
    if (typeof authority !== 'undefined') {
        //prevents the host from taking any actions until they've applied all the updates
        theGame.currentAuthority = authority;
    }
    //Array.prototype.push.apply(theGame.roundRecord, newUpdates);
    console.log("updates are now", theGame.roundRecord, newUpdates);

    var logstring = theGame.roundRecord.map(function(elem){return elem.title}).join('\n');
    console.log('updates are now', logstring);
}

var prevUpdate;
var cutoffTime; //if we recieve an update earlier than this, ignore it

function onUpdateRecieved(newVal) {
    var response = newVal.val();
    console.log(response);

    altspace.getUser().then(function(result) {
        //console.log(result);
        globalUserId = result.userId;
        console.group("Recieved update '"+response.data.length+"'");
        // if(theGame.roundRecord.length != response.data.length){

        //remove any updates from newupdates that already exist in theGame.roundRecord

        var newUpdates = response.data.filter(function(element){
            for (var i=0; i<theGame.roundRecord.length; i++) {
                if(cutoffTime > element.timestamp || element.timestamp === theGame.roundRecord[i].timestamp){
                    return false;
                }
            }
            return true;
        });

        processUpdates(newUpdates);

        console.groupEnd();
    });
}
