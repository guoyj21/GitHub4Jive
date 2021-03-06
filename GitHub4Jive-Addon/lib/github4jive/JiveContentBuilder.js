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


/**
 * The content builder encapsulates Jive Content. Calls to the builder may not throw errors if it
 * would put the result of build in a state that would be rejected from a POST/PUT due to formatting
 * or data integrity rules. IT DOES NOT, verify external references for parents or similar.
 *
 * Instead verification is generally meant to be done on build. This is due to some dependence
 * between calls.
 */
function JiveContentBuilder(source){
    if(!source) {
        this.content = {content: {type: "text/html"}};
    }else{
        verify(source);
        this.content = source;
    }
}

var MISSING_TYPE = JiveContentBuilder.prototype.MISSING_TYPE = "Missing type";
var MISSING_SUBJECT = JiveContentBuilder.prototype.MISSING_SUBJECT = "Missing subject";
var MISSING_BODY = JiveContentBuilder.prototype.MISSING_BODY = "Content text missing";
var INVALID_BODY_TYPE = JiveContentBuilder.prototype.INVALID_BODY_TYPE = "Invalid content type";
var MISSING_USERS = JiveContentBuilder.prototype.MISSING_USERS = "Missing user list.";
var MISSING_PARENT = JiveContentBuilder.prototype.MISSING_PARENT = "Missing parent URI";
var INVALID_PARENT = JiveContentBuilder.prototype.INVALID_PARENT = "Parent URI is not in a correct format";
var INVALID_TYPE = JiveContentBuilder.prototype.INVALID_TYPE = "Invalid Type";
var INVALID_TAGS = JiveContentBuilder.prototype.INVALID_TAGS = "Invalid Tags";
var EMPTY_BODY = JiveContentBuilder.prototype.EMPTY_BODY = "Empty Body";
var INVALID_BODY = JiveContentBuilder.prototype.INVALID_BODY = "Invalid Body. It must be a string.";

function verify(content) {
    if(!content.type){
        throw Error(MISSING_TYPE);
    }
    if(content.subject == null && content.type != "comment" && content.type != "message"){
        throw Error(MISSING_SUBJECT);
    }
    if(content.content.text == null){
        throw Error(MISSING_BODY);
    }
}

/**
 * Double check verify and create the content object. Has optional callback function to make chaining similar objects easier.
 * @param function onBuild Callback to send created object to facilitate easier chaining
 * @return object if onBuild is supplied the builder is returned to facilitate chaining. Else
 * created object is returned.
 */
JiveContentBuilder.prototype.build = function(onBuild){
    verify(this.content);
    if(onBuild && onBuild instanceof Function ){
        onBuild(JSON.parse(JSON.stringify(this.content)));
        return this;
    }else{
        return this.content;
    }
};

/**
 * Reset the builder to its default state clearing all changes.
 * @return object the builder in its default state
 */
JiveContentBuilder.prototype.reset = function () {
    this.content = {content:{type:"text/html"}};
    return this;
}

/**
 * Sets the content type to discussion
 * @return object JiveContentBuilder
 */
JiveContentBuilder.prototype.discussion = function(){
    this.content.type = "discussion";
    return this;
};

/**
 * Sets the content type to message
 * @return object JiveContentBuilder
 */
JiveContentBuilder.prototype.message = function(){
    this.content.type = "message";
    return this;
};

/**
 * The following block does not have verification in place
 */

/*
 * Set the content type to document
 * @return object JiveContentBuilder
 */
//JiveContentBuilder.prototype.document = function(){
//    this.content.type = "document";
//    return this;
//};

/*
 * Sets the content type to comment
 * @return object JiveContentBuilder
 */
//JiveContentBuilder.prototype.comment = function(){
//    this.content.type = "comment";
//    return this;
//};
//
///*
// * Sets the content type to file
// * @return object JiveContentBuilder
// */
//JiveContentBuilder.prototype.file = function(){
//    this.content.type = "file";
//    return this;
//};
//
///*
// * Sets the content type to poll
// * @return object JiveContentBuilder
// */
//JiveContentBuilder.prototype.poll = function(){
//    this.content.type = "poll";
//    return this;
//};
//
///*
// * Sets the content type to post
// * @return object JiveContentBuilder
// */
//JiveContentBuilder.prototype.post = function(){
//    this.content.type = "post";
//    return this;
//};
//
///*
// * Sets the content type to favorite
// * @return object JiveContentBuilder
// */
//JiveContentBuilder.prototype.favorite = function(){
//    this.content.type = "favorite";
//    return this;
//};
//
///*
// * Sets the content type to type
// * @return object JiveContentBuilder
// */
//JiveContentBuilder.prototype.task = function(){
//    this.content.type = "task";
//    return this;
//};
//
///*
// * Sets the content type to update
// * @return object JiveContentBuilder
// */
//JiveContentBuilder.prototype.update = function(){
//    this.content.type = "update";
//    return this;
//};

/**
 * Sets the content's subject line. Not required for all content types.
 * @param string subject The subject line
 * @return object JiveContentBuilder
 */
JiveContentBuilder.prototype.subject = function(subject){
    this.content.subject = subject;
    return this;
};

/**
 * Sets the content's text body.
 * @param string body The body of the content
 * @return object JiveContentBuilder
 */
JiveContentBuilder.prototype.body = function(body){
    if(body && typeof body !== "string"){
        throw Error(INVALID_BODY);
    }
    this.content.content.text = body;
    return this;
};

/**
 * Sets the content's body type. Defaults to text/html.
 * @param string type The MIME type of the body
 * @return object JiveContentBuilder
 */
JiveContentBuilder.prototype.bodyType = function(type){
    if(!type){
        throw Error(INVALID_BODY_TYPE);
    }

    this.content.content.type = type;
    return this;
};

/**
 * Sets the parent reference to create object in hierarchy.
 * @return object JiveContentBuilder
 */
JiveContentBuilder.prototype.parent = function(parentURI){


    if(!parentURI){
        throw Error(MISSING_PARENT);
    }
    if(parentURI.indexOf("/") != 0  || parentURI.match(/\s/)){//not a uri
        throw Error(INVALID_PARENT);
    }
    var valid = false;
    var JIVE_URIS = ["places","contents","people"];
    JIVE_URIS.forEach(function (uri) {
        if(parentURI.indexOf(uri) === 1){//found right after "/"
            valid = true;
            return false; //break out of foreach
        }
    });
    if(!valid){
        throw Error(INVALID_PARENT);
    }

    //done with sanity checks
    this.content.parent = parentURI;
    return this;
};

/**
 * Sets the parent reference to create object in hierarchy. Helper for Content items. Include id only.
 * @return object JiveContentBuilder
 */
JiveContentBuilder.prototype.parentContent = function (parentID) {
   return this.parent("/contents/"+parentID);
};

/**
 * Sets the parent reference to create object in hierarchy. Helper for items in a place. Include id only.
 * @return object JiveContentBuilder
 */
JiveContentBuilder.prototype.parentPlace = function (parentID) {
    return this.parent( "/places/"+parentID);
};

/**
 * Sets the visibility of the object to all. This is the default.
 * @return object JiveContentBuilder
 */
JiveContentBuilder.prototype.all = function(){
    this.content.visibility = "all";
    return this;
};

///**
// * Sets the visibility of the object to people. A list of users is required. NOT TESTED
// * @param array users Array of usernames to allow access
// * @return object JiveContentBuilder
// */
//JiveContentBuilder.prototype.people = function(users){
//    if(!users || users.length < 1){
//        throw Error(MISSING_USERS);
//    }
//    this.content.visibility = "people";
//    this.content.users = users;
//    return this;
//};

/**
 * Sets the visibility of the object to a place. the uri of that place is required
 * @param string placeURI The uri of the place that should have access
 * @return object JiveContentBuilder
 */
JiveContentBuilder.prototype.place = function (placeURI) {
    if(!placeURI || placeURI.length < 1){
        throw Error(MISSING_PARENT);
    }
    this.parent(placeURI);
    this.content.visibility = "place";
    return this;
};

JiveContentBuilder.prototype.onBehalfOf = function(email, name){
    if(this.content.type != "discussion" && this.content.type != "message"){
        throw INVALID_TYPE;
    }
    this.content.onBehalfOf = {};
    if(email) {
        this.content.onBehalfOf.email = email;
    }
    if(name) {
        this.content.onBehalfOf.name = name;
    }
    return this;
};

JiveContentBuilder.prototype.tags = function (tags) {
    if(tags == null){
        tags = [];
    }
    if(!( tags instanceof Array) || (tags.length > 0 && typeof tags[0] !== "string")){
        throw INVALID_TAGS;
    }
    this.content.tags = tags;
    return this;
}

module.exports = JiveContentBuilder;

