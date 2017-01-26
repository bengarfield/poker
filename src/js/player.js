function Player(whichPlayer) {
    this.cards = [];
    this.spot = whichPlayer;
    this.state = -2;
    this.prevState;
    this.updateFunction = this.renderVisuals;

    //TODO: Make sure these are synced

    this.betThisRound = 0;  //how much player has put in the pot total this betting round
    this.currentBet = 0;  //how much the player wants to put in the pot right now
    this.totalBet = 0; //how much the player has put into the pot in total

    //defined later
    this.userId = null;
    this.money = 0;
    this.hand = {};
    this.chipStack = {};
    this.joinButton;
    this.name = "Unknown";

    //set to 'true' first time they try to raise
    //so we can increment it by the minimum bet
    this.raised = false;
}

Player.prototype.myCardsFriendly = function() {
    var retArray = [];
    for (var i = 0; i < this.cards.length; i++) {
        retArray.push(Card.numArray[this.cards[i].number]+" of "+this.cards[i].suit);
    }
    return retArray;
};

Player.prototype.renderVisuals = function(timeSince) {
    if (this.prevState !== this.state) {
        console.group('player'+this.spot+' moved from ', this.prevState, this.state);

        //state init
        switch(this.state) {
        case -3:
            //spot is locked
            //hide everything
            Utils.toggleVisible(this.bettingui.mesh, false);
            //Utils.toggleVisible(this.optionsui.mesh, false);
            Utils.toggleVisible(this.hand, false);
            Utils.toggleVisible(this.chipCount.mesh, false);
            Utils.toggleVisible(this.dealerChip.mesh, false);
            Utils.toggleVisible(this.dealerUI.mesh, false);
            Utils.toggleVisible(this.joinButton.mesh, false);
            break;
        case -2:

            this.hand = new THREE.Object3D();

            //var hideButton = this.createHideButton();
            //hideButton.position.z = 50;
            //this.hand.add(hideButton);

            this.chipStack = new THREE.Object3D();
            this.hand.add(this.chipStack);
            this.chipCount = new chipCount(this);
            this.bettingui = new bettingUI(this);
            this.dealerChip = new dealerChip(this);
            //this.bettingui.mesh.rotation.y = -Math.PI/8;
            this.bettingui.mesh.rotation.x = -Math.PI/2 + Math.PI/4;

            this.optionsui = new optionsUI(this, theGame);

            this.hand.add(this.optionsui.mesh);
            this.hand.add(this.bettingui.mesh);

            //this.renderChips();

            arrangeHand(this.hand, this.spot);
            sim.scene.add(this.hand);
            if(typeof this.joinButton === "undefined"){
                this.joinButton = new makeJoinButton(this.spot);
                sim.scene.add(this.joinButton.mesh);
            }else{
                this.joinButton.mesh.visible = true;
            }
            this.state = -1;
            this.renderVisuals(0);
            break;
        case -1:
            //no one playing
            if (this.money === 0) {
                this.money = startingMoney;
            }
            Utils.toggleVisible(this.hand, true);
            Utils.toggleVisible(this.dealerChip.mesh, false);
            Utils.toggleVisible(this.dealerUI.mesh, false);
            Utils.toggleVisible(this.joinButton.mesh, true);
            Utils.toggleVisible(this.chipCount.mesh, false);
            Utils.toggleVisible(this.bettingui.mesh, false);
            Utils.toggleVisible(this.optionsui.mesh, false);
            break;
        case 0:
            //someone playing, they haven't started yet
            //make buttons and UI

            Utils.toggleVisible(this.joinButton.mesh, false);
            Utils.toggleVisible(this.chipCount.mesh, true);
            this.renderChips();


            var numPlayers = 0;
            for(var i=0; i<theGame.players.length; i++){
                if(theGame.players[i].state != -1){
                    numPlayers++;
                }
            }

            if(numPlayers === 1) { //first player
                this.startGame = new makeStartGameButton(this);
                this.hand.add(this.startGame.mesh);
                this.startGame.mesh.position.z = 10;
                this.startGame.mesh.position.y -= 125;
                this.startGame.mesh.position.x = -50;
                this.startGame.mesh.rotation.y = Math.PI/8;
                theGame.startGameButton = this.startGame.mesh;
                if(this.userId !== globalUserId){
                    Utils.toggleVisible(theGame.startGameButton, false);
                }else{
                    Utils.toggleVisible(this.optionsui.mesh, true);
                }
            }

            break;
        case 1:
            Utils.toggleVisible(theGame.startGameButton, false);
            //give cards to player
            var offset = 0;
            for (var i = 0; i < this.cards.length; i++) {

                //if this is the correct player, get correct card
                this.cards[i] = theGame.deck.getCard(this.cards[i], false, globalUserId === this.userId);
                //otherwise, get a blank card
                this.cards[i].geom.position.y += offset;
                giveCard(this.cards, this.hand, i);
                window.setTimeout((function(that){
                    return function(){
                        if(that.state === 1){   //only do this if our state hasn't been changed by an update
                            that.state = 2;
                        }
                    };
                })(this), 4000);
                offset+=0.1;
            }
            this.state = 2;

            break;
        case 2:
            //waiting
            Utils.toggleVisible(this.bettingui.mesh, false);
            //move the cube to someone else

            break;
        case 3:
            //this players turn to bet
            //put the bet cube over this player
            Utils.toggleVisible(this.bettingui.mesh, true);
            Utils.toggleVisible(theGame.betCube, true);

            //make sure we have enough money
            if((theGame.currentBet - this.betThisRound) <= this.money){
                this.currentBet = theGame.currentBet - this.betThisRound;
            }else{
                this.currentBet = this.money;
            }
            if(this.currentBet > 0){
                this.bettingui.toggleBetUI(this.bettingui.callMesh);
            }else{
                this.bettingui.toggleBetUI(this.bettingui.betMesh);
            }
            this.raised = false;
            this.bettingui.updateBet(this.currentBet);
            this.chipCount.updateMoney(this.money);     //to show the current bet amount

            //theGame.betCube.visible = true;
            theGame.betCube.position.copy(this.hand.position);
            theGame.betCube.position.setY(this.hand.position.y + 150);

            break;
        case 4:
            //folded, out for this round
            Utils.toggleVisible(this.bettingui.mesh, false);

            break;
        }
        //console.log(getSafeGameObj());
        //theGame.syncInstance.update(getSafeGameObj());     //going to move this to the actual player functions, so we can be more specific about when we send things and don't send crap data.

        console.groupEnd();
        this.prevState = this.state;
    }

    //state update
    for (var i = 0; i < this.cards.length; i++) {
        if(this.cards[i].movementTween){
            //this.cards[i].geom.updateBehaviors(timeSince);
        }
    }
};


Player.prototype.chipColors = {
    "white": 1,
    "red": 5,
    "blue": 10,
    "green": 25,
    "black": 100
};

/*

 white - 1
 red - 5
 blue - 10
 green - 25
 black - 100

 */

Player.prototype.renderChips = function() {
    renderChips(this.chipStack, this.money);

    //Update the canvas with the new amount
    this.chipCount.updateMoney(this.money);

    this.chipStack.position.copy(tableOffset);
};

Player.prototype.moveChipsFrom = function(amount, where) {
    //where is a Vector3
    var trackingVector = new THREE.Vector3();
    trackingVector.setFromMatrixPosition(theGame.potHolder.matrixWorld);
    //trackingVector.y = tableOffset.y;

    var toVector = new THREE.Vector3();
    toVector.setFromMatrixPosition(where.matrixWorld);

    var theseChips = makeChipStack(amount);
    sim.scene.add(theseChips);
    theseChips.position.copy(trackingVector);

    var toHolderTween = new TWEEN.Tween(trackingVector).to(toVector, 2000);
    toHolderTween.onUpdate(function() {
        theseChips.position.copy(trackingVector);
    });

    var self = this;
    toHolderTween.onComplete(function() {
        //delete the moving chips, update the world chip pot
        sim.scene.remove(theseChips);
        self.renderChips();
    });
    toHolderTween.start();
    renderChips(theGame.potHolder, 0);
};

//disabling chip animation for now until it's consistent
Player.prototype.moveChipsTo = function(amount, where) {
    //where is a Vector3
    var trackingVector = new THREE.Vector3();
    trackingVector.setFromMatrixPosition(this.chipStack.matrixWorld);
    trackingVector.y = tableOffset.y;

    var toVector = new THREE.Vector3();
    toVector.setFromMatrixPosition(where.matrixWorld);

    var theseChips = makeChipStack(amount);
    sim.scene.add(theseChips);
    theseChips.position.copy(trackingVector);

    var toHolderTween = new TWEEN.Tween(trackingVector).to(toVector, 2000);
    toHolderTween.onUpdate((function(chips) {
        return function(value1) {
            //move the cards to the player
            chips.position.copy(trackingVector);
        };
    }(theseChips)));

    toHolderTween.onComplete((function(movingChips) {
        return function(value1) {
            //delete the moving chips, update the world chip pot
            sim.scene.remove(movingChips);
            makePot();
        };
    }(theseChips)));
    toHolderTween.start();
};

Player.prototype.bet = function(amount) {

    //we may need to split the pot here

    //go through each player, find the person with the lowest money
    //if their money is less than the current amount
    //make the current betting pot the players minimum amount
    //take the leftover, and make a new pot;

    this.contributeToPot(amount);
    this.betThisRound += amount;
    this.totalBet += amount;
    this.money -= amount;
    if (theGame.minRaise < amount) {
        theGame.minRaise = amount;
    }
    if (this.betThisRound > theGame.currentBet) {
        theGame.currentBet = this.betThisRound;
    }
};

Player.prototype.contributeToPot = function(amount) {
    var alreadyBet = this.totalBet;
    var potSoFar = 0;
    var amountToSatisfy;
    for (var i = theGame.bettingPots.length-1; i >= 0; i--) {
        if(amount < 0) {
            return false;
        } else if(amount === 0) {
            return false;
        }
        var thisPot = theGame.bettingPots[i];
        potSoFar += theGame.bettingPots[i].amountToContribute;
        if(thisPot.locked === true) {
            amountToSatisfy = potSoFar - alreadyBet;
            if(amountToSatisfy > 0){
                thisPot.amount += amountToSatisfy;
                alreadyBet += amountToSatisfy;
                amount -= amountToSatisfy;
            }
        } else if(potSoFar >= alreadyBet) {
            //this is the one we need to contribute to

            //This number is not right

            var amountToRaise = (alreadyBet - potSoFar) + amount;
            amountToSatisfy = amount - amountToRaise;
            if(amountToRaise < 0){
                console.log("Should not be negative!");

            }
            console.log('raising', amountToRaise);

            //see if we need to preemptively split the pot
            var lowestPlayer = false;
            for (var j = 0; j < theGame.players.length; j++) {
                var player = theGame.players[j];
                if (player.state > 0 && player.state < 4 && (player.money + player.totalBet) > potSoFar) {
                    //in the round still
                    if (player.money < amountToRaise) {    //they have less than this person is trying to raise
                        if (lowestPlayer !== false && lowestPlayer.money < player.money) {
                            //do nothing
                        } else {
                            lowestPlayer = player;
                        }
                    }
                }
            }

            if (lowestPlayer !== false) {
                var minBet = potSoFar - lowestPlayer.totalBet + lowestPlayer.money;
                thisPot.amount += minBet + amountToSatisfy;
                thisPot.amountToContribute += minBet;
                potSoFar += minBet;
                alreadyBet += minBet + amountToSatisfy;
                theGame.newPot();
                i++;
                amount -= (minBet + amountToSatisfy);
            } else {
                thisPot.amount += amount;
                thisPot.amountToContribute += amountToRaise;
                amount = 0;
            }
        } else {
            //we've already fulfilled this pot
            alreadyBet -= thisPot.amountToContribute;
        }
    }
};

Player.prototype.betUpdate = function(amount) {
    /* var maxAmount = 0;
     for(var i=0; i<theGame.players.length; i++){
     var player = theGame.players[i];
     if(player.spot !== this.spot){
     if(player.money > maxAmount && player.state === 2){
     maxAmount = player.money;
     }
     }
     }
     if(amount > maxAmount){
     amount = maxAmount;
     }*/

    theGame.sendUpdate({i:theGame.players.indexOf(this), amount: amount}, "playerBet");


    this.bet(amount);
    this.renderChips();
    makePot();
    theGame.nextBet();
};

Player.prototype.fold = function() {
    //theGame.bettingOrder.splice(theGame.better, 1);

    for (var i = 0; i < this.cards.length; i++) {
        console.log(this.cards[i]);
        if (this.cards[i].geom.parent.type === "Object3D") {
            THREE.SceneUtils.detach(this.cards[i].geom, this.hand, sim.scene);
            cardToDeck(this.cards[i]);
            delete this.cards[i].geom;
        } else {
            this.cards[i].geom.parent.remove(this.cards[i].geom);
            delete this.cards[i].geom;
        }
    }
    this.cards = [];
    this.state = 4;

    var potentialPlayers = [];
    for (var i = 0; i < theGame.dealingOrder.length; i++) {
        if (theGame.dealingOrder[i].state > 0 && theGame.dealingOrder[i].state < 4) {
            potentialPlayers.push(theGame.dealingOrder[i]);
        }
    }

    if (potentialPlayers.length === 1) {
        theGame.better = 0;
        theGame.step = 10;
        if (theGame.currentAuthority === globalUserId) {
            setTimeout(function() {
                theGame.sendUpdate({winnerByForfeit: getSafePlayer(potentialPlayers[0])}, "playerWinByForfeit", {thenUpdate: true});
                theGame.runStep();
            }, 0);
        }
    } else {
        if (_checkForDoneBetting()) {
            //do nothing, wait for authority to tell us what to do next
        } else {
            theGame.nextBet();
        }
    }
};

Player.prototype.foldUpdate = function() {
    theGame.sendUpdate({i:theGame.players.indexOf(this)}, "playerFold");
    this.fold();
};
