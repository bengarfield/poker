function Ruleset(handRanking) {
    this.handRanking = handRanking;
}

function sortDescending(cards) {
    return _.sortBy(cards, Card.comparingAceHigh).reverse();
}

Ruleset.prototype.judge = function(cards) {
    var hand = {
        name: "",
        value: -1
    };
    for (var i = 0; i < this.handRanking.length; i++) {
        //should sort cards here
        var thesecards = this.handRanking[i].isHand(cards);
        if (thesecards != false) {
            hand.name = this.handRanking[i].name;
            hand.cards = thesecards.cards;
            hand.value = this.handRanking.length - i;
            hand.subValue = thesecards.subVal;  //when comparing hands to see who has the higher pair (for instance), use this value, if value is the same the players tie
            console.log(hand);
            break;
        }
    }
    return hand;
};

Ruleset.main = new Ruleset([
    {
        name: "Straight Flush",
        isHand: function(cards) {
            var straightCards = Card.isStraight(cards);
            var flushCards = Card.isFlush(cards);
            if (straightCards !== false && flushCards !== false && Card.sameCards(straightCards, flushCards)) {
                return {
                    cards: straightCards,
                    subVal: [Card.max(straightCards)]
                };
            } else {
                return false;
            }
        }
    },
    {
        name: "Four of a kind",
        isHand: function(cards) {
            var multiples = Card.hasMultiples(cards, 4);
            if (multiples === false) {
                return false;
            }

            var sortedCards = sortDescending(cards);
            sortedCards = sortedCards.filter(function(obj) {
                return obj.number !== multiples[0].number;
            });

            return {
                cards: multiples.concat(sortedCards[0]),
                subVal: [multiples[0].number, sortedCards[0].number]
            };
        }
    },
    {
        name: "Full House",
        isHand: function(cards) {
            var multiples = Card.hasMultiples(cards, 3);
            if (multiples.length !== 3) {
                return false;
            } else {
                var newCards = cards.slice();
                newCards = newCards.filter(function(obj) {
                    return (multiples.indexOf(obj) !== -1);
                });
                var secondMultiples = Card.hasMultiples(newCards, 2);
                if(secondMultiples.length !== 2){
                    return false;
                } else {
                    return {
                        cards: multiples.concat(secondMultiples),
                        subVal: [Math.max(parseInt(multiples[0].number), parseInt(secondMultiples[0].number)), Math.min(parseInt(multiples[0].number), parseInt(secondMultiples[0].number))]
                    };
                }
            }
        }
    },
    {
        name: "Flush",
        isHand: function(cards) {
            var flushCards = Card.isFlush(cards);
            if (flushCards === false) {
                return false;
            }
            return {
                cards: flushCards,
                subVal: [Card.max(flushCards)]
            };
        }
    },
    {
        name: "Straight",
        isHand: function(cards) {
            var straightCards = Card.isStraight(cards);
            if (straightCards === false) {
                return false;
            } else {
                return {
                    cards: straightCards,
                    subVal: [Card.max(straightCards)]
                };
            }
        }
    },
    {
        name: "Three of a kind",
        isHand: function(cards) {
            var threeCards = Card.hasMultiples(cards, 3);
            if (threeCards === false) {
                return false;
            }

            var sortedCards = sortDescending(cards);
            sortedCards = sortedCards.filter(function(obj) {
                return obj.number !== threeCards[0].number;
            });

            return {
                cards: threeCards.concat(sortedCards.slice(0, 2)),
                subVal: [threeCards[0].number].concat(sortedCards.slice(0, 2).map(function(obj){return obj.number}))
            };
        }
    },
    {
        name: "Two pair",
        isHand: function(cards) {
            var multiples = Card.hasMultiples(cards, 2);
            if (multiples.length !== 2) {
                return false;
            } else {
                var newCards = cards.slice();
                newCards = newCards.filter(function(obj) {
                    return obj.number !== multiples[0].number;
                });
                var secondMultiples = Card.hasMultiples(newCards, 2);
                if (secondMultiples.length !== 2) {
                    return false;
                } else {
                    var subValCards = sortDescending(cards);
                    subValCards = subValCards.filter(function(obj){
                        return obj.number !== multiples[0].number && obj.number !== secondMultiples[0].number;
                    });

                    var subValTest = [Math.max(multiples[0].number, secondMultiples[0].number), Math.min(multiples[0].number, secondMultiples[0].number)];
                    subValTest.concat(subValCards[0]);

                    var retMultiples = multiples.concat(secondMultiples);
                    return {
                        cards: retMultiples.concat(subValCards[0]),
                        subVal: subValTest
                    };
                }
            }
        }
    },
    {
        name: "One pair",
        isHand: function(cards) {
            var pairCards = Card.hasMultiples(cards, 2);
            if (pairCards === false) {
                return false;
            }
            var sorted = sortDescending(cards);
            //remove the multiples
            sorted = sorted.filter(function(obj) {
                return obj.number !== pairCards[0].number;
            });
            //get the top three cards
            return {
                cards: pairCards.concat(sorted.slice(0, 3)),
                subVal: [pairCards[0].number].concat(sorted.slice(0, 3).map(function(obj){return obj.number;}))
            };
        }
    },
    {
        name: "High card",
        isHand: function(cards) {
            cards = sortDescending(cards);
            return {
                cards: cards,
                subVal: cards.map(function(obj){return obj.number;})
            };
        }
    }
]);
