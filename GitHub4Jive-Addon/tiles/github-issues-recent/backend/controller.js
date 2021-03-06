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

var jive = require("jive-sdk");
var q = require("q");

var libDir = process.cwd() + "/lib/";
var tileInstanceProcessor = require("./tileInstanceProcessor");
var gitHubWebhooks = require("./webhooks/webhookBuilder");

var GITHUB_RECENT_ISSUES_TILE_NAME = "github-issues-recent";
////////////////////////////////////////
var pushData = function () {
    jive.tiles.findByDefinitionName( GITHUB_RECENT_ISSUES_TILE_NAME ).then( function(tiles) {
        return q.all(tiles.map(tileInstanceProcessor.processTileInstance)) ;
    });
};

exports.onBootstrap = function(){
    jive.tiles.findByDefinitionName( GITHUB_RECENT_ISSUES_TILE_NAME ).then( function(tiles) {
        return q.all(tiles.map(updateTileInstance));
    });
};

exports.task = [
    {
        'interval' : 60000,
        'handler' : pushData
    }
];

// handle tile instance registration call from Jive (on place save)
var updateTileInstance = function (newTile) {
    if ( newTile.name === GITHUB_RECENT_ISSUES_TILE_NAME ) {
        gitHubWebhooks.setup(newTile).then(function () {                // setup github webhook + handler
            return tileInstanceProcessor.processTileInstance(newTile);  // push a recent issues tile update right away
        });
    }
};

exports.eventHandlers = [

    {
        'event': 'activityUpdateInstance',
        'handler' : tileInstanceProcessor.processTileInstance
    },
    {
        'event': jive.constants.globalEventNames.NEW_INSTANCE,
        'handler' : updateTileInstance
    },
    {
        'event': jive.constants.globalEventNames.INSTANCE_UPDATED,
        'handler' : updateTileInstance
    }
];

// sample tile registration data
/**
 {
    "id": "3f2dbd48-746f-41cc-a893-d2b96eeaa887",
    "url": "https://sandbox.jiveon.com/api/jivelinks/v1/tiles/3306/data",
    "config": {
      "parent": "https://sandbox.jiveon.com/api/core/v3/places/95698"
    },
    "name": "github-issues-recent",
    ..
 }
**/