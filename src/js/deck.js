function Deck(cards) {
    this.cards = cards || Card.orderedDeck.slice();
}

Deck.prototype.shuffle = function() {
    this.cards = _.shuffle(Card.orderedDeck);
};

Deck.prototype.arrange = function(arrangement) {
    for (var i = 0; i < arrangement.length; i++) {
        for (var j = 0; j < Card.orderedDeck.length; j++) {
            if (Card.orderedDeck[j].number === arrangement[i].number && Card.orderedDeck[j].suit === arrangement[i].suit) {
                this.cards[i] = Card.orderedDeck[j];
                break;
            }
        }
    }
};

Deck.prototype.dealTo = function(players, numCards) {
    if (typeof(players.length) == "undefined") {
        players = [players];
    }
    for (var i = 0; i < numCards; i++) {
        var thiscard = this.cards.pop();
        for (var j = 0; j < players.length; j++) {
            players[j].cards.push(thiscard);
        }
    }
};

Deck.prototype.revealCard = function(theCard) {
    if (!theCard.geom.userData.hidden) {
        console.log("this card is already visible!");
        return;
    }

    // var parent = theCard.parent;
};

Deck.prototype.getCard = function(theCard, large, visible) {
    large = large || false;
    visible = visible || false;
    console.log(theCard, large, visible);

    //console.log(theCard, (theCard instanceof Card));

    var thisCard;
    if (theCard instanceof Card) {
        thisCard = theCard;
    } else {
        thisCard = _.find(Card.orderedDeck, function(card) { return card.number === theCard.number && card.suit === theCard.suit; });
    }

    if (!visible) {
        thisCard.geom = createHiddenCardGeom();
        thisCard.geom.position.set(0, tableOffset.y - cardTemplate.height/2 + 10, 0);
        thisCard.geom.rotation.set(Math.PI/2, 0, 0);
        thisCard.geom.scale.set(1, 1, 1);
    } else {
        createCardGeom(thisCard, large, true);
        thisCard.geom.userData.large = large;
        if (large) {
            thisCard.geom.scale.set(1.5, 1.5, 1);
            Utils.toggleVisible(thisCard.geom, true);
            thisCard.movementTween.rotation.copy(thisCard.geom.rotation);
            thisCard.movementTween.position.copy(thisCard.geom.position);
        } else {
            thisCard.geom.position.set(0, tableOffset.y - cardTemplate.height/2 + 10, 0);
            thisCard.geom.rotation.set(Math.PI/2, 0, 0);
            thisCard.geom.scale.set(1, 1, 1);
            Utils.toggleVisible(thisCard.geom, true);
        }
    }
    return thisCard;
};

function createHiddenCardGeom() {
    return createCardGeom({}, false, false);
}

function createCardGeom(theCard, doubleSided, visible) {
    doubleSided = doubleSided || false;
    if (typeof theCard.geom !== "undefined") {
        //theCard.geom.parent.remove(theCard.geom);
        //delete theCard.geom;
        return theCard.geom;
    }

    console.log('cloning the card models');

    if (visible && !theCard.image) {
        theCard.image = document.createElement('img');
        theCard.image.src = theCard.filename();
    }

    var cardfront = theGame.models.CardFront.clone();
    cardfront.scale.set(300, 300, 300);
    var material;
    if (!visible) {
        material = new THREE.MeshBasicMaterial({color:'#000000'});
        material.side = THREE.DoubleSide;
    } else {
        cardfront.scale.setX(-cardfront.scale.x);
        material = new THREE.MeshBasicMaterial({color:'#FFFFFF', map: new THREE.Texture(theCard.image)});
        material.side = THREE.BackSide;
    }
    //var material = new THREE.MeshBasicMaterial({color:'#FFFFFF', map: new THREE.Texture(theCard.image)});
    for (var j = 0; j < cardfront.children.length; j++) {
        var mesh = cardfront.children[j];
        mesh.material = material;
    }
    var card = new THREE.Object3D();

    card.add(cardfront);

    if (doubleSided) {
        var othercardfront = cardfront.clone();
        othercardfront.rotation.y = Math.PI;
        card.add(othercardfront);
        theGame.sharedCardContainer.add(card);
    } else {
        var cardback = theGame.models.CardBack.clone();
        card.add(cardback);
        sim.scene.add(card);
    }

    card.position.copy(tableOffset);
    card.position.y += cardTemplate.height/2;

    //sim.scene.add(card);
    theCard.geom = card;
    return card;
}

/*deck.prototype.makeGenericCard = function(){
 var manager = new THREE.LoadingManager();
 var loader = new THREE.AltOBJMTLLoader(manager);
 var backFilename = "assets/Models/CardBack.obj";
 var frontFilename = "assets/Models/CardFront.obj";
 var cardTexImg = document.createElement('img');
 cardTexImg.src = "assets/Models/CardTexture.png";
 var cardMat = new THREE.MeshBasicMaterial({map:new THREE.Texture(cardTexImg)});
 var tempMat = new THREE.MeshBasicMaterial({color: "#FFFFFF"});
 var scope = this;
 loader.load(backFilename, function ( card ) {
 console.log('generic card loaded!', card);

 card.scale.set(300, 300, 300);
 for(var i=0; i<card.children.length; i++){
 var group = card.children[i];
 group.material = cardMat;

 }


 loader.load(frontFilename, function(cardfront){

 for(var i=0; i<cardfront.children.length; i++){
 var group = cardfront.children[i];
 group.material = tempMat;

 }
 card.userData.cardFace = cardfront.children[0];
 card.add(cardfront);
 //sim.scene.add(card);
 scope.genericCard = card;
 })


 } );

 }*/
