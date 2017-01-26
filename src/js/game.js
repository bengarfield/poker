function Game() {
    this.players = [];
    this.dealingOrder = [];
    this.bettingOrder = [];
    this.dealer = 0;
    this.better = 0;
    this.smallBlind = 5;
    this.deck = {};
    this.locked = false;
    this.firstRefusal = false;    //whether or not we've let the big blind check yet
    this.step = -1;
    this.judge = Ruleset.main;
    //whoever can deal cards
    this.currentAuthority;
    this.timeBetweenBlinds = 600000;//10 minutes for game 60000; //1 minute for testing
    this.timeBlindStarted = 0;

    this.sharedCards = {
        cards:[]
    };
    this.currentBet = 0;
    this.minRaise = 0;
    this.bettingPots = [new Pot()];
    this.roundRecord = [];

    this.nudged = false;

    this.sharedCardContainer = new THREE.Object3D();
    this.headOffset = new THREE.Vector3(0, 300, 0);
    this.headPosition = new THREE.Vector3();
    sim.scene.add(this.sharedCardContainer);
}

Game.prototype.newPot = function() {
    this.bettingPots[0].locked = true;
    //this.bettingPots.push(this.bettingPot);
    var newpot = new Pot();
    this.bettingPots.unshift(newpot);
};

Game.prototype.start = function() {
    this.step = 1;
    this.better = 0;
    this.runStep();
};

Game.prototype.resetCards = function() {

    var player;
    for (var i = 0; i < this.players.length; i++) {
        player = this.players[i];
        for (var j = 0; j < player.cards.length; j++) {
            cardToDeck(player.cards[j]);
            delete player.cards[j].geom;
        }
        player.cards = [];
        Utils.toggleVisible(player.bettingui.mesh, false);
    }

    for (var i = 0; i < Card.orderedDeck.length; i++) {
        cardToDeck(Card.orderedDeck[i]);
        delete Card.orderedDeck[i].geom;
    }
    this.sharedCards.cards = [];
};

Game.prototype.resetBetters = function() {

    //sets the betting order to a list of the players that should be given the option to bet this round

    var bettingOrder = [];
    for (var j = 1; j < this.dealingOrder.length; j++) {
        var i = (this.dealer + j) % this.dealingOrder.length;
        if (this.dealingOrder[i].state === 2 && this.dealingOrder[i].money > 0) {// > 0 && this.dealingOrder[i].state <= 3){    //they're still in the game, but waiting
            this.dealingOrder[i].betThisRound = 0;
            bettingOrder.push(i);
        }
    }

    //now try to add the dealer
    if (this.dealingOrder[this.dealer].state === 2 && this.dealingOrder[this.dealer].money > 0) { //they're still in the game, but waiting
        this.dealingOrder[this.dealer].betThisRound = 0;
        bettingOrder.push(this.dealer);
    }

    /*if(bettingOrder.length > 1){  //if there's only one person to bet, don't need to shift the array
     for(var i=0; i<this.dealer; i++){
     //bettingOrder.push(bettingOrder.shift());
     }
     }*/
    this.bettingOrder = bettingOrder;
};

Game.prototype.playersThatNeedToBet = function(fromIndex){
    var players = [];
    for(var j=fromIndex; j<this.dealingOrder.length+fromIndex; j++){
        var i = j%this.dealingOrder.length;
        if (this.dealingOrder[i].state === 2 && this.dealingOrder[i].money > 0 && this.dealingOrder[i].betThisRound < this.currentBet) {
            players.push(i);
        }
    }
    if (this.step === 2) {
        if (this.firstRefusal !== false && players.indexOf(this.dealingOrder.indexOf(this.firstRefusal)) === -1 && this.firstRefusal.money > 0) {
            players.push(this.dealingOrder.indexOf(this.firstRefusal));
        }
        this.firstRefusal = false;
    }
    return players;
};

Game.prototype.resetDealers = function() {
    console.log('reseting dealers');
    var prevDealer = this.dealingOrder[this.dealer];
    var order = this.players.slice();
    this.dealingOrder = [];

    //get the dealing order

    for (var i = 0; i < order.length; i++) {
        if(order[i].state > -1){
            this.dealingOrder.push(order[i]);
        }
    }
    if (prevDealer !== this.dealingOrder[this.dealer]) {
        this.dealer = this.dealingOrder.indexOf(prevDealer);
    }
};

Game.prototype.rotateDealers = function() {
    this.resetDealers();

    //increment the dealer index

    this.dealer = (this.dealer+1)%this.dealingOrder.length;
};

Game.prototype.runClientStep = function() {
    if (typeof this.logic.steps[this.step].execClient !== "undefined") {
        this.logic.steps[this.step].execClient(this);
    }
};

Game.prototype.runStep = function() {
    this.logic.steps[this.step].exec(this);
};

Game.prototype.nextBet = function() {
    //sets the state of the current player back to 'wait' (2) and sets state of next player to 'bet' (3)

    //if this player hasn't folded
    if (this.bettingOrder.length > 0) {
        if (this.dealingOrder[this.bettingOrder[this.better]].state !== 4) {
            //set them back to 'waiting' state
            this.dealingOrder[this.bettingOrder[this.better]].state = 2;
        }
        this.better++;
    } else {
        debugger;
    }

    this.startBetting();
};

Game.prototype.startBetting = function() {

    if (this.better === this.bettingOrder.length) { //&& (game.currentAuthority === globalUserId)){
        //check to see if the pot is light
        if (this.better > 0) {
            this.better -= 1;
        }

        var playersLeft = this.playersThatNeedToBet(this.bettingOrder[this.better]);
        this.bettingOrder = playersLeft;
        this.better = 0;
        if (playersLeft.length != 0) {
            //pot is light, make people bet that still need to

            this.startBetting();
        }
    } else if (this.dealingOrder[this.bettingOrder[this.better]].state !== 3) {
        this.dealingOrder[this.bettingOrder[this.better]].state = 3;

        //also plays a sound to let the user know it's time to do something
        if (typeof this.currentAuthority !== 'undefined') {
            if (this.dealingOrder[this.bettingOrder[this.better]].spot === globalPlayerIndex) {
                if (this.currentBet > 0) {
                    soundEngine.playSound("yourCall");
                } else {
                    soundEngine.playSound("yourCheck");
                }
            }
        }
    }
};

Game.prototype.nextHand = function() {
    //reset the round record
    //send out new update

    this.roundRecord = [{title: "startedLevel", timestamp: Date.now()}];
    cutoffTime = this.roundRecord[0].timestamp;

    //register players

    for (var i = 0; i < this.players.length; i++) {

        if (this.players[i].state > -1) {
            this.players[i].state = 0;
            this.roundRecord.push({data:{registerIndex: i, userId: this.players[i].userId, money: this.players[i].money, name: this.players[i].name}, timestamp: Date.now(), title: "registerPlayer"});
        }
    }

    for (var i = 0; i < this.players.length; i++) {
        if(this.players[i].state === 0) {    //they're  waiting
            this.players[i].state = 2;
        }
    }
    this.resetDealers();

    //consolidate straggler chips in these pots
    //into one new pot

    this.bettingPots = [];
    this.bettingPots.push(new Pot());
    this.deck.shuffle();

    if (Date.now() > this.timeBlindStarted + this.timeBetweenBlinds) {
        this.smallBlind *= 2;
        this.timeBlindStarted = Date.now();

        displayMessageSingle({
            message: "Blinds are now $" + this.smallBlind + " and $" + (this.smallBlind * 2) + "!",
            messageType: 3,
            messagePos: new THREE.Vector3(0, -20, 0),
            messageRot: new THREE.Quaternion(),
            moveDirection: new THREE.Vector3(0, 0, 0),
            scale: new THREE.Vector3(1, 1, 1),
            arrowSide: "down",
            timeToDisappear: 4000
        });
    }

    this.sendUpdate({authority:globalUserId, deck: getSafeCards({cards: this.deck.cards}), dealer: this.dealer, blind: this.smallBlind, blindStartTime: this.timeBlindStarted},"startHand");
    this.resetSharedRotation();

    //this.deck.shuffle();
    authority = globalUserId;
    //create a new round record, send it to everyone
    for (var i = 0; i < this.players.length; i++) {
        Utils.toggleVisible(this.players[i].dealerChip.mesh, false);
    }

    Utils.toggleVisible(this.dealingOrder[this.dealer].dealerChip.mesh, true);
    Utils.toggleVisible(this.dealingOrder[this.dealer].dealerUI.mesh, false);

    //start level
    setTimeout((function(tehGame) {
        tehGame.start();
    })(this), 5000);
};

Game.prototype.winGame = function(index) {
    this.sendUpdate({index: index, name:this.players[index].name},"totalVictory", {thenUpdate:true});
};

Game.prototype.resetSharedRotation = function() {
    this.headPosition.copy(globalPlayerHead.position);
    this.headPosition.add(this.headOffset);
    this.sharedCardContainer.lookAt(this.headPosition);
};

Game.prototype.sendUpdate = function(extraData, title, options) {
    title = title || "";
    options = options || {};
    console.groupCollapsed("Sending update '"+ title + "'");
    // processUpdates([{title:title, timestamp: Date.now(), data:extraData}])
    //this.syncInstance.update({title:title, data:this.roundRecord});
    if (typeof options.thenUpdate === "undefined" || options.thenUpdate === false) {
        this.roundRecord.push({title: title, timestamp: Date.now(), data: extraData});
        this.syncInstance.update({title: title, data: this.roundRecord});
    } else {
        //should process this update immediately
        var time = Date.now();
        var newArr = this.roundRecord.concat([{title: title, timestamp: time, data: extraData}]);
        this.syncInstance.update({title: title, data: newArr});
    }

    console.log(extraData);
    console.groupEnd();
};
