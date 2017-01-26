var _ = require("lodash");
var Card = require("../src/js/card.js").Card;

describe('Card', function() {

    var blank = _.map(["2 of clubs", "5 of diamonds", "6 of clubs", "10 of hearts", "queen of spades"], Card.fromName);
    var onePair = _.map(["3 of clubs", "3 of hearts", "queen of hearts", "king of spaces", "ace of spades"], Card.fromName);
    var flush = _.map(["4 of clubs", "7 of clubs", "10 of clubs ", "jack of clubs", "ace of clubs"], Card.fromName);
    var straightStart = _.map(["ace of hearts", "2 of clubs", "3 of hearts", "4 of diamonds", "5 of diamonds"], Card.fromName);
    var straightMiddle = _.map(["9 of spades", "6 of spades", "7 of spades", "8 of diamonds", "10 of clubs"], Card.fromName);
    var straightEnd = _.map(["ace of hearts", "jack of diamonds", "10 of diamonds", "queen of clubs", "king of spades"], Card.fromName);

    it('can serialize and deserialize from a name', function() {
        Card.orderedDeck.forEach(function(card) {
            var other = Card.fromName(card.toName());
            expect(other.number).toBe(card.number);
            expect(other.suit).toBe(card.suit);
        });
    });

    it('can identify N-of-a-kinds', function() {
        expect(Card.hasMultiples(blank, 1)).toBeTruthy();
        expect(Card.hasMultiples(blank, 2)).toBe(false);
        expect(Card.hasMultiples(onePair, 2)).toBeTruthy();
        expect(Card.hasMultiples(onePair, 3)).toBe(false);
    });

    it('can identify flushes', function() {
        expect(Card.isFlush(blank)).toBe(false);
        expect(Card.isFlush(flush)).toBeTruthy();
    });

    it('can identify straights', function() {
        expect(Card.isStraight(blank)).toBe(false);
        expect(Card.isStraight(straightStart)).toBeTruthy();
        expect(Card.isStraight(straightMiddle)).toBeTruthy();
        expect(Card.isStraight(straightEnd)).toBeTruthy();
    });
});
