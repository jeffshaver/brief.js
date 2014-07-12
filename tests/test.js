var assert = chai.assert;
describe('brief', function() {
  describe('can create brief object', function() {
    it ('should return true if the object is a brief object', function() {
      assert.equal(true, brief().isBrief);
    });
  });
  describe('brief function prototype should be accessible', function() {
    it ('should return true if the brief function prototype exists', function() {
      assert.equal(true, !!brief.prototype);
    });
  });
  describe('brief().on should be equal to brief.prototype.on', function() {
    it('should return true if the brief function prototype on method is the same as the brief object on method', function() {
      assert.equal(true, brief.prototype.on === brief().on);
    });
  });
  describe('brief().off should be equal to brief.prototype.off', function() {
    it('should return true if the brief function prototype off method is the same as the brief object off method', function() {
      assert.equal(true, brief.prototype.off === brief().off);
    });
  });
  describe('brief().once should be equal to brief.prototype.once', function() {
    it('should return true if the brief function prototype once method is the same as the brief object once method', function() {
      assert.equal(true, brief.prototype.once === brief().once);
    });
  });
  describe('brief().forEach should iterate over all elements', function() {
    it('should return true if an iteration variable equals the number of elements in the object', function() {
      var i = 0;
      var a = brief('#elementssContainer a');
      var length = a.length;
      a.forEach(function() {
        i++;
      });
      assert.equal(true, i == length);
    });
  });
  describe('brief().remove should remove last element', function() {
    it('should return true if the new length is the original length - 1', function() {
      var a = brief('#elementsContainer a');
      var length = a.length;
      var lastElement = a.get(a.length-1);
      a.remove();
      assert.equal(true, a.length == length - 1 && lastElement !== a.get(a.length-1));
    });
  });
  describe('brief().add should add an element to the end of the object', function() {
    it('should return true if the new length is the original length + 1', function() {
      var a = brief('#elementsContainer a');
      var container = brief('#elementsContainer');
      var length = a.length;
      var lastElement = a.get(a.length-1);
      a.add(container);
      assert.equal(true, a.length == length+1 && lastElement !== a.get(a.length-1));
    });
  });
  describe('brief().toArray should change the object to an array', function() {
    it ('should return true if the object is now an array', function() {
      var a = brief('a');
      var arr = a.toArray();
      assert.equal(true, arr.constructor == Array);
    });
  });
  describe('brief().empty should remove all elements in the array', function() {
    it ('should return true if the object is now empty', function() {
      var a = brief('a');
      var length = a.length;
      a.empty();
      assert.equal(true, length > 0 && a.length === 0);
    });
  });
});