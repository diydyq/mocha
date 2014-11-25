/**
 * Extend Mocha.Runner to enable log feature.
 * Because in current version of Mocha, it does not support multiple reporters, so I overrides Runner for convenience.
 * @author yongqingdong
 * @date 2014-11-18
 */
/* global Mocha */
/* jshint -W116, -W110 */
;(function(global){
    "use strict";

    /* code: ready */
    Mocha.Runner.prototype.CODE_READY = 0;
    /* code: running */
    Mocha.Runner.prototype.CODE_RUNNING = 1;
    /* code: ended */
    Mocha.Runner.prototype.CODE_ENDED = 2;


    var logList = global.logList = [];

    // Log function.
    function recordLog(msg){
        logList.push(msg);
        console.log(msg);
    }


    /**
     * Extends Mocha.Runner to add log information.
     * @constructor
     */
    function RunnerWrap(){
        RunnerOld.apply(this, arguments);

        var self = this;
        global.mocha.runner = this;

        /**
         * Current status of test running.
         */
        this.code = this.CODE_READY;

        this.on('start', function(){
            this.code = self.CODE_RUNNING;
            recordLog("##Test started");
        });
        this.on('end', function(){
            this.code = self.CODE_ENDED;
            recordLog("##Test ended");
        });
        this.on("suite", function(suite){
            if (suite.root) return;

            if(suite.parent.root){
                recordLog("Suite: " + suite.title);
            }else{
                recordLog("\t Suite: " + suite.title);
            }
        });
        this.on("suite end", function(suite){
            if (suite.root) return;
        });
        this.on('test end', function(test) {
            if ('passed' == test.state) {
                recordLog("\t PASS: " + test.title + test.duration);
            } else if (test.pending) {
                recordLog("\t PEND: " + test.title + test.duration);
            } else {
                recordLog("\t FAIL: " + test.title + test.duration);
            }
        });

        // Copy from reporter/json
        var tests = [];
        var pending = [];
        var failures = [];
        var passes = [];
        this.testResults = {
            code: self.code,
            stats: self.stats,
            tests: tests.map(clean),
            passes: passes.map(clean),
            failures: failures.map(clean),
            pending: pending.map(clean)
        };

        function update(){
            self.testResults.code = self.code;
            self.testResults.stats = self.stats;
            self.testResults.tests = tests.map(clean);
            self.testResults.passes = passes.map(clean);
            self.testResults.failures = failures.map(clean);
            self.testResults.pending = pending.map(clean);
        }

        this.on('test end', function(test){
            tests.push(test);
            update();
        });
        this.on('pass', function(test){
            passes.push(test);
            update();
        });
        this.on('fail', function(test){
            failures.push(test);
            update();
        });
        this.on('pending', function(test){
            pending.push(test);
            update();
        });
        this.on('end', function(){
            update();
        });

    }

    // Copy from reporter/json.
    function clean(test) {
        return {
            title: test.title,
            fullTitle: test.fullTitle(),
            duration: test.duration,
            err: errorJSON(test.err || {})
        };
    }
    function errorJSON(err) {
        var res = {};
        Object.getOwnPropertyNames(err).forEach(function(key) {
            res[key] = err[key];
        }, err);
        return res;
    }


    // Integrate Mocha.Runner to add some log information.
    var RunnerOld = Mocha.Runner;
    RunnerWrap.prototype = RunnerOld.prototype;
    Mocha.Runner = RunnerWrap;
    for(var prop in RunnerOld){
        Mocha.Runner.prop = RunnerOld[prop];
    }
})(this);