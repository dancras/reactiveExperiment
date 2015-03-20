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

describe('Junction', function() {

    it('should equal the value returned by its evaluator', function() {

        /* Arrange */
        var example = lib.junction(function() {
                return 'foo';
            }),
            result;

        /* Act */
        result = example();

        /* Assert */
        result.should.equal('foo');

    });

    describe('.watch()', function() {

        it('should send its value its watchers', function() {

            /* Arrange */
            var example = lib.junction(function() {
                    return 'foo';
                }),
                spyA = sinon.spy(),
                spyB = sinon.spy();

            /* Act */
            example.watch(spyA);
            example.watch(spyB);

            /* Assert */
            spyA.firstCall.should.have.been.calledWithExactly('foo');
            spyB.firstCall.should.have.been.calledWithExactly('foo');

        });

        it('should re-evaluate when data it depends on changes', function() {

            /* Arrange */
            var data = lib.data('foo'),
                example = lib.junction(function() {
                    return data();
                }),
                spyA = sinon.spy();

            example.watch(spyA);

            /* Act */
            data('bar');

            /* Assert */
            spyA.secondCall.should.have.been.calledWithExactly('bar');

        });

        it('should re-evaluate when a junction it depends on changes', function() {

            /* Arrange */
            var data = lib.data('foo'),
                junction = lib.junction(function() {
                    return data() + 'bar';
                }),
                example = lib.junction(function() {
                    return junction();
                }),
                spyA = sinon.spy();

            example.watch(spyA);

            /* Act */
            data('bar');

            /* Assert */
            spyA.secondCall.should.have.been.calledWithExactly('barbar');

        });

        it('should optimise a simple dependency conflict', function() {

            /* Arrange */
            var data = lib.data('foo'),
                junction = lib.junction(function() {
                    return data() + 'bar';
                }),
                example = lib.junction(function() {
                    return data() + junction();
                }),
                spyA = sinon.spy();

            example.watch(spyA);

            /* Act */
            data('bar');

            /* Assert */
            spyA.secondCall.should.have.been.calledWithExactly('barbarbar');
            spyA.callCount.should.equal(2);

        });

        it('should optimise a more complicated dependency conflict', function() {

            /* Arrange */
            var a = lib.data('a'),
                b = lib.junction(function() {
                    return a() + 'b';
                }),
                c = lib.junction(function() {
                    return a() + 'c';
                }),
                d = lib.junction(function() {
                    return a() + 'd';
                }),
                example = lib.junction(function() {
                    return a() + b() + c() + d() + 'e';
                }),
                spyA = sinon.spy();

            example.watch(spyA);

            /* Act */
            a('aa');

            /* Assert */
            spyA.secondCall.should.have.been.calledWithExactly('aaaabaacaade');
            spyA.callCount.should.equal(2);

        });

        it('should optimise an insane dependency graph', function() {

            /* Arrange */
            var a = lib.data('a'),
                b = lib.junction(function() {
                    return a() + 'b';
                }),
                c = lib.junction(function() {
                    return a() + 'c';
                }),
                d = lib.junction(function() {
                    return b() + c() + 'd';
                }),
                e = lib.junction(function() {
                    return a() + 'e';
                }),
                f = lib.junction(function() {
                    return a() + 'f';
                }),
                g = lib.junction(function() {
                    return e() + f() + 'g';
                }),
                h = lib.junction(function() {
                    return c() + g() + d() + 'h';
                }),
                example = lib.junction(function() {
                    return a() + h() + b() + f();
                }),
                spyA = sinon.spy();

            example.watch(spyA);

            /* Act */
            a('aa');

            /* Assert */
            spyA.secondCall.should.have.been.calledWithExactly('aaaacaaeaafgaabaacdhaabaaf');
            spyA.callCount.should.equal(2);

        });

    });

});

describe('bufferedUpdate', function() {

    it('should make it possible to update multiple datas at once', function() {

        /* Arrange */
        var a = lib.data('a'),
            b = lib.data('b'),
            c = lib.data('c'),
            example = lib.junction(function() {
                return a() + b() + c();
            }),
            spyA = sinon.spy();

        example.watch(spyA);

        /* Act */
        lib.bufferedUpdate(function() {

            a('aa');
            b('bb');
            c('cc');

        });

        /* Assert */
        spyA.secondCall.should.have.been.calledWithExactly('aabbcc');
        spyA.callCount.should.equal(2);

    });

});
