var chai = require('chai'),
    sinon = require('sinon'),
    sinonChai = require('sinon-chai'),
    lib = require('../src/lib');

chai.should();
chai.use(sinonChai);

describe('Data', function() {

    var example;

    beforeEach(function() {
        example = lib.data('foo');
    });

    it('should initially equal the value it is initialised with', function() {
        example().should.equal('foo');
    });

    it('should be updateable', function() {

        /* Act */
        example('bar');

        /* Assert */
        example().should.equal('bar');

    });

    it('should return itself when being updated', function() {

        /* Act */
        var result = example('bar');

        /* Assert */
        result.should.equal( example );

    });

    describe('.watch()', function() {

        it('should send updates to the watcher', function() {

            /* Arrange */
            var spyA = sinon.spy(),
                spyB = sinon.spy();

            example.watch(spyA);
            example.watch(spyB);

            /* Act */
            example('bar');

            /* Assert */
            spyA.firstCall.should.have.been.calledWithExactly('foo');
            spyA.secondCall.should.have.been.calledWithExactly('bar');

            spyB.firstCall.should.have.been.calledWithExactly('foo');
            spyB.secondCall.should.have.been.calledWithExactly('bar');

        });

    });

    describe('-> unwatch()', function() {

        it('should stop the watcher receiving updates', function() {

            /* Arrange */
            var spyA = sinon.spy(),
                unwatch = example.watch(spyA);

            unwatch();

            /* Act */
            example('bar');

            /* Assert */
            spyA.should.have.been.calledWithExactly('foo');
            spyA.callCount.should.equal(1);

        });

        it('should not affect other watchers', function() {

            /* Arrange */
            var spyA = sinon.spy(),
                spyB = sinon.spy(),
                unwatch = example.watch(spyA);

            example.watch(spyB);

            unwatch();

            // An additional call should do nothing
            unwatch();

            /* Act */
            example('bar');

            /* Assert */
            spyA.should.have.been.calledWithExactly('foo');
            spyA.callCount.should.equal(1);

            spyB.firstCall.should.have.been.calledWithExactly('foo');
            spyB.secondCall.should.have.been.calledWithExactly('bar');

        });

        it('should even work when watchers are currently being notified', function() {

            /* Arrange */
            var spyA = sinon.spy(),
                unwatch = function() {};

            example.watch(function() {
                unwatch();
            });

            unwatch = example.watch(spyA);

            /* Act */
            example('bar');

            /* Assert */
            spyA.should.have.been.calledWithExactly('foo');
            spyA.callCount.should.equal(1);

        });

    });

});
