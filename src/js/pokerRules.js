var betStep = function(game) {
    Utils.toggleVisible(game.betCube, true);// game.betCube.visible = true;
    game.resetDealers();
    game.resetBetters();
    game.better = 0;
    game.currentBet = 0;
    game.minRaise = game.smallBlind * 2;
    game.nudged = false;
    if (game.bettingOrder.length === 0) {
        //do nothing, wait for authority to tell us to go to the next step
    } else {
        if (game.step === 2) {
            var firstPlayer = game.dealingOrder[game.bettingOrder[game.better]];
            var firstMoney = Math.min(firstPlayer.money, game.smallBlind);
            game.dealingOrder[game.bettingOrder[game.better]].bet(firstMoney);
            game.dealingOrder[game.bettingOrder[game.better]].renderChips();
            game.nextBet();
            var secondPlayer = game.dealingOrder[game.bettingOrder[game.better]];
            var secondMoney = Math.min(secondPlayer.money, game.smallBlind * 2);
            game.dealingOrder[game.bettingOrder[game.better]].bet(secondMoney);
            game.dealingOrder[game.bettingOrder[game.better]].renderChips();
            displayBlindMessages(firstMoney, secondMoney, [firstPlayer, secondPlayer]);
            game.currentBet = game.smallBlind * 2;
            game.firstRefusal = secondPlayer;
            game.nextBet();
            makePot();
        } else {
            game.startBetting();
        }
    }

    //this.better === this.bettingOrder.length;
};

function checkForDoneBetting() {
    _checkForDoneBetting();
    setTimeout(checkForDoneBetting, 1000);
}

function _checkForDoneBetting() {
    if (theGame.better === theGame.bettingOrder.length) {        //should calculate 'active' players
        if (theGame.step !== -1 && theGame.logic.steps[theGame.step].execClient === betStep) {
            /*if(theGame.currentAuthority === globalUserId){
             theGame.better = 0;
             theGame.step++;
             theGame.runStep();
             }*/
            Utils.toggleVisible(theGame.betCube, false);
            if (globalUserId === theGame.dealingOrder[theGame.dealer].userId && theGame.nudged === false) {
                //show the step change UI
                Utils.toggleVisible(theGame.dealingOrder[theGame.dealer].dealerChip.mesh, true);
                window.setTimeout(function(){
                    var dealMessage = new errorMessage({timeToDisappear:2000, messageType:1, message:"Click me to continue!",scale:0.4,pos:theGame.dealingOrder[theGame.dealer].dealerUI.mesh.getWorldPosition()});
                }, 10);
                theGame.nudged = true;
            }
            return true;
        }
    }
    return false;
}

var getSharedCardPosition = function(i) {
    var padding = 20;
    return {x:(90-(cardTemplate.width+padding)*i), y: -120, z: 0};
};

var texasHoldEm = {
    steps: [
        {   //0
            //this is run on the very first hand only
            exec: function(game) {
                //game.dealer = 0;
                game.deck.shuffle();
                game.currentAuthority = globalUserId;
                game.sendUpdate({authority:globalUserId, dealer: game.dealer, deck: getSafeCards({cards: game.deck.cards}), blind: game.smallBlind, blindStartTime: game.timeBlindStarted}, "startHand");
                game.resetSharedRotation();

                for (var i = 0; i < game.players.length; i++) {
                    Utils.toggleVisible(game.players[i].dealerChip.mesh, false);
                }

                Utils.toggleVisible(game.dealingOrder[game.dealer].dealerChip.mesh, true);
                Utils.toggleVisible(game.dealingOrder[game.dealer].dealerUI.mesh, false);

                game.start();
                //since only the dealer will do this step, we can assume the globalUserId is the dealer

            }
        },
        {   //1
            execClient: function(game) {
                if (typeof game.startGameButton !== 'undefined') {
                    game.startGameButton.visible = false;
                }
                game.step = 2;
                game.runClientStep();
            },
            exec: function(game) {
                //deal 2 to players
                for (var i = 0; i < game.players.length; i++) {
                    console.log("players look like this", game.players[i].state > -1, game.players[i].cards.length);
                    game.players[i].cards = [];
                    if (game.players[i].state > -1 && game.players[i].cards.length === 0) {
                        game.deck.dealTo(game.players[i], 2);
                        game.players[i].state = 1;    //player animates their own cards
                        game.sendUpdate({index: i, player: getSafePlayer(game.players[i])}, "dealingCards");
                    }
                }
                game.sendUpdate({toStep: 1}, "changeGameStep", {thenUpdate: true});
            }
        },
        { //2
            execClient: betStep
        },
        { //3
            execClient: function(game) {

                Utils.toggleVisible(game.betCube, false);

                game.sharedCards.cards.forEach(function(card, i) {
                    card = game.sharedCards.cards[i] = game.deck.getCard(card, true, true);
                    var toSharedTween = new TWEEN.Tween(card.movementTween.position).to(getSharedCardPosition(i), 500);
                    toSharedTween.onUpdate(function() {
                        //move the cards to the player
                        card.geom.position.copy(card.movementTween.position);
                    });
                    toSharedTween.start();
                });
                game.step = 4;
                game.runClientStep();
            },
            exec: function(game) {

                //make a show of discarding a card?
                var dealTo = [];
                dealTo.push(game.sharedCards);
                game.deck.dealTo(dealTo, 3);
                game.sendUpdate({sharedCards: getSafeCards(game.sharedCards)}, "dealSharedCards");
                game.sendUpdate({toStep: 3}, "changeGameStep", {thenUpdate: true});
            }
        },
        { //4
            execClient: betStep
        },
        { //5
            execClient: function(game) {
                Utils.toggleVisible(game.betCube, false);
                var card = game.sharedCards.cards[3] = game.deck.getCard(game.sharedCards.cards[3], true, true);
                var toPlayerTween = new TWEEN.Tween(game.sharedCards.cards[3].movementTween.position).to(getSharedCardPosition(3), 500);
                toPlayerTween.onUpdate(function() {
                    //move the cards to the player
                    card.geom.position.copy(card.movementTween.position);
                });
                toPlayerTween.start();
                game.step = 6;
                game.runClientStep();
            },
            exec: function(game) {
                var dealTo = [];
                dealTo.push(game.sharedCards);
                game.deck.dealTo(dealTo, 1);
                game.sendUpdate({sharedCards:getSafeCards({cards:[game.sharedCards.cards[3]]})}, "dealSharedCards");
                game.sendUpdate({toStep: 5}, "changeGameStep", {thenUpdate: true});
            }
        },
        { //6
            execClient: betStep
        },
        { //7
            execClient: function(game) {
                Utils.toggleVisible(game.betCube, false);
                var card = game.sharedCards.cards[4] = game.deck.getCard(game.sharedCards.cards[4], true, true);
                var toPlayerTween = new TWEEN.Tween(game.sharedCards.cards[4].movementTween.position).to(getSharedCardPosition(4), 500);
                toPlayerTween.onUpdate(function() {
                    //move the cards to the player
                    if (card.geom) {
                        card.geom.position.copy(card.movementTween.position);
                    }
                });
                toPlayerTween.start();
                game.step = 8;
                game.runClientStep();
            },
            exec: function(game) {
                var dealTo = [];
                dealTo.push(game.sharedCards);
                game.deck.dealTo(dealTo, 1);
                game.sendUpdate({sharedCards:getSafeCards({cards:[game.sharedCards.cards[4]]})}, "dealSharedCards");
                game.sendUpdate({toStep: 7}, "changeGameStep", {thenUpdate: true});
            }
        },
        { //8
            execClient: betStep
        },
        { //9
            execClient: function(game) {
            },
            exec: function(game) {

                var highestHand = [];
                var winningPlayer;

                var candidateOrder = game.dealingOrder.filter(function(element) {
                    return (element.state === 2);
                });

                var winnerOrder = [];

                for (var i = 0; i < candidateOrder.length; i++) {
                    var judgeValue = game.judge.judge(candidateOrder[i].cards.concat(game.sharedCards.cards));
                    judgeValue.cards = getSafeCards(judgeValue);
                    if (typeof highestHand[judgeValue.value] === "undefined") {
                        var writeObj = {
                            players: []
                        };
                        writeObj.players.push({
                            hands: [judgeValue],
                            players:[getSafePlayer(candidateOrder[i])],
                            subVals: judgeValue.subValue
                        });
                        highestHand[judgeValue.value] = writeObj;
                    } else {

                        //someone has already scored this hand, see if it's a tie or just another hand

                        var isTie = false;

                        for (var j = 0; j < highestHand[judgeValue.value].players.length; j++) {
                            if (Utils.arraysEqual(judgeValue.subValue, highestHand[judgeValue.value].players[j].subVals)) {
                                isTie = true;
                                console.log('its a tie!');
                                highestHand[judgeValue.value].players[j].players.push(getSafePlayer(candidateOrder[i]));
                                highestHand[judgeValue.value].players[j].hands.push(judgeValue);
                                break;
                            }
                        }

                        if (!isTie) {
                            highestHand[judgeValue.value].players.push({
                                hands: [judgeValue],
                                players:[getSafePlayer(candidateOrder[i])],
                                subVals: judgeValue.subValue
                            });
                            console.log("Close!", highestHand[judgeValue.value].hand, judgeValue);
                        }
                    }

                }

                //hands are auto sorted, now we need to sort tieing players by the subvalues

                highestHand.forEach(function(hand) {

                    //condense players that tie to one hand
                    hand.players.sort(function(first, second) {
                        var leftWinner;
                        for (var i = 0; i < first.subVals.length; i++) {
                            if (first.subVals[i] > second.subVals[i]) {
                                leftWinner = true;
                                break;
                            } else if(second.subVals[i] > first.subVals[i]) {
                                leftWinner = false;
                                break;
                            }
                        }
                        if (typeof leftWinner === "undefined") {
                            return 0;
                        }
                        if (leftWinner) { //we want the winner to be first in the players array, so reverse this
                            return -1;
                        }else{
                            return 11;
                        }
                    });
                });

                game.sendUpdate({hands: highestHand}, "playerWin", {thenUpdate: true});

                /*var handOrder = Object.keys(highestHand).map(function(val){return parseInt(val)});
                 handOrder.sort(function(a, b){ //sorting in reverse order
                 return b-a;
                 });

                 console.log(highestHand[handOrder[0]].players, "wins with", highestHand[handOrder[0]].hand);

                 for(var i=0; i<handOrder.length; i++){
                 //start at the highest hand and award money
                 if(game.bettingPots.length === 0){
                 console.log("Done awarding money!");
                 break;
                 }
                 var winningPlayers = highestHand[handOrder[i]].players;
                 awardMoney(winningPlayers);

                 }*/

                //game.step = 10;

                //game.runStep(); //kick out players without money, transfer control
            }
        },
        { //10

            execClient: function(game) {

            },
            exec: function(game) {

                var activePlayers = 0;
                var activeIndex = -1;
                game.resetCards();

                for (var i = 0; i < game.dealingOrder.length; i++) {
                    //go through every player, if they have no money, they need to leave
                    //broke-ass punks

                    if (game.dealingOrder[i].money === 0 && game.dealingOrder[i].state !== -1) {
                        game.dealingOrder[i].state = -3;
                        if (i === game.dealer) {
                            game.dealer--;  //if this person folds out, pretend like the person right before them was the dealer when we rotate     NOTE: this did not work
                        }
                    }
                }
                for (var i = 0; i < game.players.length; i++) {
                    if (game.players[i].state > 0) {
                        activePlayers++;
                        activeIndex = i;
                    }
                    game.players[i].totalBet = 0;
                    game.players[i].betThisRound = 0;
                }
                game.rotateDealers();

                if (activePlayers > 1) {
                    game.nextHand();
                } else {
                    game.winGame(activeIndex);
                }

                //cutoffTime = Date.now();
                //game.sendUpdate({transferControl: game.dealingOrder[game.dealer].spot, endstatePlayers: playerStates}, "transferControl", {thenUpdate: true});
            }
        }
    ]
};

function awardMoney(playerList) {
    //this is a list of players we need to give money in the betting pot to

    //first lets handle the case of a single player, how much did they win

    var player = playerList[0];
    var threshold = player.totalBet;
}
