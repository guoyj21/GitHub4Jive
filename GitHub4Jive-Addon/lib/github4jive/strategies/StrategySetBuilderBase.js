/*
 * Copyright 2014 Jive Software
 *
 *    Licensed under the Apache License, Version 2.0 (the "License");
 *    you may not use this file except in compliance with the License.
 *    You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 *    Unless required by applicable law or agreed to in writing, software
 *    distributed under the License is distributed on an "AS IS" BASIS,
 *    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *    See the License for the specific language governing permissions and
 *    limitations under the License.
 */
var jive = require('jive-sdk');
var q = require("q");

var TokenPool = require("./EventTokenPool");

/**
 * The StrategySetBuilder encapsulates The GitHubFacade Event Handling setup and teardown as well as token management.
 * When registering for a GitHub Event a token is returned. This is stored in an instance of
 * EventTokenPool. There is an instance for each strategy set. A strategy set is created when build
 * is called. The Strategy set returns an object that has setup and teardown functions that accept
 * one object called setup/teardown options. Client code needs to hydrate that object with the members
 * required for all of the strategies in the set. When setup and teardown are called the strategies
 * are processed in the order of the functions on the builder object.
 *
 * EX: builder.issue().issueComments().build().setup({}); would execute the issue strategy before the
 * issueComment strategy.
 *
 * Errors in either setup or teardown of a particular strategy are caught and logged but not retried.
 * The builder simply moves on to the next strategy.
 *
 * This is an abstract class if you will. It does not provide any strategies by itself. It is designed
 * to have the strategy functions added later by prototyping/inheritance for individual implementations
 * of common GitHub Events
 *
 * EX: GitHub Service does not care about posting to tile stream entry. But Github-issues-active tile
 * does and does not care about changing state of discussion.
 *
 */

function StrategySetBuilder() {
    this.strategies = [];
}

function tokenKey(strategy,options){
    return options.placeUrl + "_" + strategy.name;
}

/**
 * The setup/teardown strategy functions below simply iterate over the list of strategies in order
 * teardown does not go in reverse order because there is currently no support for dependant strategies.
 */
function setupStrategies(strategies,index, options, tokenPool){
  
    if(index < strategies.length) {
        var strategy = strategies[index];
      
  
        return strategy.setup(options)
            .then(function (token) {
                tokenPool.addToken(tokenKey(strategy, options), token);
                return setupStrategies(strategies,++index, options, tokenPool);
            })
            .catch(function (error) {
                jive.logger.error(error);
                return setupStrategies(strategies,++index, options, tokenPool);
            });
    }
    return q();
}

function teardownStrategies(strategies,index, options, tokenPool){

    if(index < strategies.length) {
        var strategy = strategies[index];
        options.eventToken = tokenPool.getByKey(tokenKey(strategy, options));
        return strategy.teardown(options)
            .then(function () {
                    tokenPool.removeTokenByKey(tokenKey(strategy,options));
                    return teardownStrategies(strategies,++index, options, tokenPool);
            })
            .catch(function (error) {
                jive.logger.error(error);
                return teardownStrategies(strategies,++index, options, tokenPool);
            });
    }
    return q();
}

StrategySetBuilder.prototype.EMPTY_SET = "Cannot build an empty strategy set.";

/**
 * Build the strategy set and return the interface to setup and teardown that set for a given place.
 * The order of the calls leading up to build will determine the order of setup and teardown function.
 * This contains two functions. A setup and a teardown function.  Each accepts one argument which
 * should contain necessary information to set up the github webhook for the place.
 * @return {object} {setup: function(setupOptions){}, teardown: function(teardownOptions){}}
 */
StrategySetBuilder.prototype.build = function () {
    if(this.strategies.length == 0){
        throw Error(this.EMPTY_SET);
    }
    var strategies = [];
    this.strategies.forEach(function (strat) {
        strategies.push(strat);
    });
    var tokenPool = new TokenPool();
    var obj = {
      setup: function(options){
        return setupStrategies(strategies,0, options, tokenPool);
      },
      teardown: function (options) {
        return teardownStrategies(strategies,0, options, tokenPool);
      }
    };
    return obj;
};

/**
 * Reset the builder to its original state. Clearing all strategies in the array.
 * avoids calling new to create another strategy set.
 * @return {object} the builder in its original state
 */
StrategySetBuilder.prototype.reset = function () {
    this.strategies = [];
    return this;
};

/*
 * Add the Strategy to the set that will be built from the builder
 * @return {object} the same builder to support chaining
 */
StrategySetBuilder.prototype.addStrategy = function(strategy){
    this.strategies.push(strategy);
    return this;
};

module.exports = StrategySetBuilder;
