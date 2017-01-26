if (typeof require != "undefined") {
    _ = require("lodash");
}

Card = this.Card = function(number, suit) {
    this.number = number;
    this.suit = suit;
    this.movementTween = {
        position: new THREE.Vector3(0, 0, 0),
        rotation: new THREE.Vector3(0, 0, 0)
    };
};

Card.numArray = [2, 3, 4, 5, 6, 7, 8, 9, 10, "jack", "queen", "king", "ace"];
Card.suitArray = ["clubs", "diamonds", "hearts", "spades"];
Card.suitSymbols = ["♣", "♦", "♥", "♠"];
Card.orderedDeck = (function() {
    var cards = [];
    for (var i = 0; i < Card.numArray.length; i++) {
        for (var j = 0; j < Card.suitArray.length; j++) {
            cards.push(new Card(i, Card.suitArray[j]));
        }
    }
    return cards;
}());

Card.fromName = function(name) {
    var match = name.match(/(\w+) of (\w+)/);
    if (match) {
        var number = _.findIndex(Card.numArray, function(x) { return x.toString() === match[1]; });
        var suit = _.findIndex(Card.suitArray, function(x) { return x.toString() === match[2]; });
        if (number != null && suit != null) {
            return new Card(number, Card.suitArray[suit]);
        }
    }
    throw new Error(name + " is not the name of a card.");
};

Card.prototype.toName = function() {
    return Card.numArray[this.number].toString() + " of " + this.suit;
};

Card.prototype.friendlyRepresentation = function() {
    return Card.suitSymbols[Card.suitArray.indexOf(this.suit)] + " " + Card.numArray[this.number];
};

Card.prototype.friendlynumber = function() {
    return Card.numArray[this.number];
};

Card.prototype.texturePrefix = "assets/Cards/";

Card.prototype.filename = function() {
    return this.texturePrefix + Card.numArray[this.number] + "_of_" + this.suit + ".png";
};


Card.hasMultiples = function(cards, numberOfMultiples) {
    var sortedCards = [];
    for (var i = 0; i < cards.length; i++) {
        if (typeof(sortedCards[cards[i].number]) == "undefined") {
            sortedCards[cards[i].number] = {
                cards: [cards[i]],
                num: 0
            };
        } else {
            sortedCards[cards[i].number].cards.push(cards[i]);
        }
        sortedCards[cards[i].number].num++;
    }

    var findThem = false;

    sortedCards.forEach(function(obj) {
        if (parseInt(obj.num) === parseInt(numberOfMultiples)) {
            findThem = obj.cards;
        }
    });

    return findThem;
};

Card.isFlush = function(cards) {
    if (cards.length < 5) {
        return false;
    }
    var suits = {};
    for (var i = 0; i < cards.length; i++) {
        if (typeof suits[cards[i].suit] === "undefined") {
            suits[cards[i].suit] = {
                cards: [cards[i]],
                num: 0
            };
        } else {
            suits[cards[i].suit].cards.push(cards[i]);
        }
        suits[cards[i].suit].num++;
    }
    var isFlush = false;

    for (var propertyName in suits) {
        if (suits.hasOwnProperty(propertyName) && suits[propertyName].num>=5) {
            isFlush = suits[propertyName].cards;
        }
    }
    return isFlush;
};

Card.isStraight = function(cards) {
    var possibilities = [
        _.sortBy(cards, Card.comparingAceLow),
        _.sortBy(cards, Card.comparingAceHigh)
    ];

    return _.some(possibilities, function(cards) {
        for (var i = 0; i < cards.length - 1; i++) {
            var first = cards[i].number, second = cards[i + 1].number;
            if (first == 12 && second == 0) {
                continue;
            }
            if (first + 1 !== second) {
                return false;
            }
        }
        return true;
    });
};

Card.sameCards = function(setOne, setTwo) {
    //assuming the cards are in the correct order
    if(setOne.length !== setTwo.length || setOne.length === 0 || !setOne.length){
        return false;
    }

    for(var i=0; i<setOne.length; i++){
        if(setOne[i].number !== setTwo[i].number || setOne[i].suit !== setTwo[i].suit){
            return false;
        }
    }
    return true;
};

Card.max = function(cards) {
    return Math.max.apply(null, cards.map(function(val){return val.number;}));
};

Card.comparingAceLow = function(card) { return card.number == 12 ? -1 : card.number; };
Card.comparingAceHigh = function(card) { return card.number; };
