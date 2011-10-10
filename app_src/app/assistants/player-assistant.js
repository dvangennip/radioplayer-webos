function PlayerAssistant (stagecontrolreference) {
    currentStageControl = stagecontrolreference; // 'this' from StageAssistant
}

PlayerAssistant.prototype.setup = function () {
    
    // init status variables
    this.playing = false;
    this.stopped = false;
    this.isPending = false;
    
    // load MediaExtension library
    try {
        this.libs = MojoLoader.require({ name: "mediaextension", version: "1.0"});
    } catch(e) {
        // Prior to 1.4 MojoLoader.require() was restricted to palm apps.  Calling it on 
        // older builds will result in an exception.
        Mojo.Log.error("Cannot load mediaextension library: "+e.message);
    }
    // get a reference to audio element
    try {
        if (this.libs && this.libs.mediaextension){
            
            this.myAudioObj = new Audio();
            // get the extension API for the audio object in the scene.
            this.audioExt = this.libs.mediaextension.MediaExtension.getInstance(this.myAudioObj);
            // set media class
            this.audioExt.audioClass = 'media';
            
            // media setup can continue immediately (no 'x-palm-connect' required) as element is part of browser.
            this.mediaHandleEventBound = this.mediaHandleEvent.bind(this);
            this.myAudioObj.addEventListener('play', this.mediaHandleEventBound, false);
            this.myAudioObj.addEventListener('ended', this.mediaHandleEventBound, false); 
            this.myAudioObj.addEventListener('pause', this.mediaHandleEventBound, false);
            this.myAudioObj.addEventListener('error', this.mediaHandleEventBound, false);
            this.myAudioObj.addEventListener('canplay', this.mediaHandleEventBound, false);
        
            this.myAudioObj.src = null;
            this.myAudioObj.autoplay = false;
            this.stopped = true;
        }
    } catch(e) {
	Mojo.Log.error("PlayerAssistant::setup threw: ", Object.toJSON(e));
    }
        
    // Setup application menu
    this.controller.setupWidget(Mojo.Menu.appMenu, StageAssistant.appMenuAttr, StageAssistant.appMenuModel);
    
    // Setup command menu
    this.controller.setupWidget(Mojo.Menu.commandMenu,
        this.attributes = {
            menuClass: 'no-fade'
        },
        {
            items: [
                { icon: 'new', command: 'do-addStream' }
            ]
        }
    );
    
    // Accommodate for tablets
    currentStageControl.adjustForTablet(this);
    
    // setup header
    this.updateHeader();
    this.playElement = this.controller.get('main_header');
    this.playTapHandler = this.streamToggler.bindAsEventListener(this);
    Mojo.Event.listen(this.playElement, Mojo.Event.tap, this.playTapHandler);
    
    // hide current stream area if none selected
    if (StageAssistant.activeStream === -1) {
        this.controller.get('stream_current').hide();
    } else {
        this.updateCurrentStreamInfo();
    }

    // setup stream list model
    this.streamListModel = {
	listTitle:'Streams',
	items: StageAssistant.streamsList
    };
    // setup forecast list
    this.controller.setupWidget('streams_list',
	{
	    listTemplate:'player/streamListContainer',
	    itemTemplate: 'player/streamRowTemplate',
	    reorderable: true,
	    swipeToDelete: true
	},
	this.streamListModel
    );
    
    // add list handlers
    this.streamList = this.controller.get('streams_list');
    this.listClickHandler = this.listClickHandler.bind(this);
    this.listReorderHandler = this.listReorderHandler.bind(this);
    this.listDeleteHandler = this.listDeleteHandler.bind(this);
    Mojo.Event.listen(this.streamList,Mojo.Event.listTap, this.listClickHandler);
    Mojo.Event.listen(this.streamList,Mojo.Event.listReorder, this.listReorderHandler);
    Mojo.Event.listen(this.streamList,Mojo.Event.listDelete, this.listDeleteHandler);
};

PlayerAssistant.prototype.activate = function (event) {
    
    // setup the volume keys for expected functioning
    if (!StageAssistant.volumeKeysAreSet) {
        currentStageControl.setupVolumeKeys(function () {
            //Mojo.Log.info("*** Successfully setup volume keys");
            StageAssistant.volumeKeysAreSet = true;
        });
    }
    
    Mojo.Event.listen(this.playElement, Mojo.Event.tap, this.playTapHandler);
    Mojo.Event.listen(this.streamList,Mojo.Event.listTap, this.listClickHandler);
    Mojo.Event.listen(this.streamList,Mojo.Event.listReorder, this.listReorderHandler);
    Mojo.Event.listen(this.streamList,Mojo.Event.listDelete, this.listDeleteHandler);
    
    // model may be adjusted elsewhere - update just in case
    this.controller.modelChanged(this.streamListModel);
    this.updateStreamsInfo();
};

PlayerAssistant.prototype.deactivate = function (event) {
    Mojo.Event.stopListening(this.playElement, Mojo.Event.tap, this.playTapHandler);
    Mojo.Event.stopListening(this.streamList,Mojo.Event.listTap, this.listClickHandler);
    Mojo.Event.stopListening(this.streamList,Mojo.Event.listReorder, this.listReorderHandler);
    Mojo.Event.stopListening(this.streamList,Mojo.Event.listDelete, this.listDeleteHandler);
};

PlayerAssistant.prototype.cleanup = function (event) {
    Mojo.Event.stopListening(this.playElement, Mojo.Event.tap, this.playTapHandler);
    Mojo.Event.stopListening(this.streamList,Mojo.Event.listTap, this.listClickHandler);
    Mojo.Event.stopListening(this.streamList,Mojo.Event.listReorder, this.listReorderHandler);
    Mojo.Event.stopListening(this.streamList,Mojo.Event.listDelete, this.listDeleteHandler);
    
    // audio object event listeners
    try {
        this.myAudioObj.removeEventListener('play', this.mediaHandleEventBound, false);
        this.myAudioObj.removeEventListener('ended', this.mediaHandleEventBound, false); 
        this.myAudioObj.removeEventListener('pause', this.mediaHandleEventBound, false);
        this.myAudioObj.removeEventListener('error', this.mediaHandleEventBound, false);
        this.myAudioObj.removeEventListener('canplay', this.mediaHandleEventBound, false);
    }
    catch (e) {
        Mojo.Log.error("PlayerAssistant::cleanup threw: ", Object.toJSON(e));
    }
};

//
// EVENT HANDLERS
//

/**
 * Function handles events emitted by the audio object
 */
PlayerAssistant.prototype.mediaHandleEvent = function(event){
    //this.playButton.mojo.deactivate();
    try{
        //Mojo.Log.info("*** eventHandlerMedia: ", event.type);
        switch (event.type)
        {
            case 'canplay':
                //this.playButton.mojo.activate();
                event.target.play();
                break;
            case 'ended':
                // should not occur if streams are continuous, if so set program correctly
                this.streamStop();
                break;
            case 'error':
                Mojo.Log.info("Error occured on media element: ", JSON.stringify(event.target.error));
                // give feedback if relevant (e.g. in playing state)
                if (event.target.error.code >= 0 && (this.isPending || this.playing)) {
                    this.streamStop();
                    this.showDialogBox('error', 'No stream was found or no internet connection was available.');
                }
                break;
            case 'pause':
                // do nothing
                break;
            case 'play':
                // no longer pending to play - reflect in UI
                this.isPending = false;
                this.updateHeader();
                break;
            case 'stop':
                // do nothing / does not occur (?)
                break;
            default:
                Mojo.Log.warn("*** eventHandlerMedia: Need a handler for ", event.type);
                break;
        }
    } catch (e) {
            Mojo.Log.error("*** eventHandlerMedia threw: ", Object.toJSON(e));
    }
}

PlayerAssistant.prototype.listClickHandler = function (event) {
    //Mojo.Log.info("*** Stream "+event.item.name+" clicked, at index "+event.index);
    
    // first check specific target element
    // if it is the (i) sign the user wants to edit the stream
    // NOTE: event.originalEvent.target.tagName is e.g. DIV or LABEL
    //       event.originalEvent.target.className
    if (event.originalEvent.target.className.indexOf('stream-details-link') !== -1) {
        // push edit-stream scene with selected object
        currentStageControl.controller.pushScene(
            {name:'edit-stream'},
            currentStageControl,
            StageAssistant.streamsList[event.index]
        );
    }
    // assign stream if not selected yet
    else {
        if (event.index !== StageAssistant.activeStream) {
            
            // when playing stop the current stream
            if (this.isPending || this.playing) {
                this.streamStop();
            }
            
            // assign new selection
            StageAssistant.activeStream = event.index;
            this.updateCurrentStreamInfo();
            // something is selected, so it should be shown if this was not the case
            this.controller.get('stream_current').show();
            
            // start playing the selected stream
            this.streamPlay();
            
            // also save to depot to remember last selected station upon next launch
            // check if preferred stream was altered, if so save
            currentStageControl.storageSaveData();
        }
    }
};

PlayerAssistant.prototype.listReorderHandler = function (event) {
    //Mojo.Log.info("*** Stream "+event.item.name+" moved, from "+event.fromIndex+" to "+event.toIndex);
    
    var fromIndex, toIndex, activeIndex;
    
    // reorder item
    fromIndex = event.fromIndex;
    toIndex = event.toIndex;
    StageAssistant.streamsList.splice(fromIndex, 1);
    StageAssistant.streamsList.splice(toIndex, 0, event.item);
    // update model
    this.streamListModel.items = StageAssistant.streamsList;
    //this.controller.modelChanged(this.streamListModel, this);
    
    // update focused location index in case it was changed
    activeIndex = StageAssistant.activeStream;
    if (fromIndex === activeIndex) {
	activeIndex = toIndex;
    } else if (fromIndex < activeIndex && toIndex >= activeIndex) {
	// one element below it has been moved away from that position
	activeIndex = activeIndex - 1;
    } else if (fromIndex > activeIndex && toIndex <= activeIndex) {
	// one higher element was squeezed in
	activeIndex = activeIndex + 1;
    }
    StageAssistant.activeStream = activeIndex;
    
    // save to depot
    currentStageControl.storageSaveData();
};

PlayerAssistant.prototype.listDeleteHandler = function (event) {
    //Mojo.Log.info("*** Stream "+event.item.name+" deleted");
	
    var deleteIndex = event.index;
    
    // update focused location index in case it was changed
    if (deleteIndex <= StageAssistant.activeStream) {
        
        if (deleteIndex === StageAssistant.activeStream) {
            // stop playing the current stream as it is deleted (would be confusing otherwise)
            this.streamStop();
        }
        
	StageAssistant.activeStream--;
	// check for change of going below 0
	if (StageAssistant.activeStream < 0) {
	    StageAssistant.activeStream = 0;
	}
    }
    
    // delete item
    StageAssistant.streamsList.splice(deleteIndex, 1);
     // update model
    this.streamListModel.items = StageAssistant.streamsList;
    //this.controller.modelChanged(this.streamListModel, this);
    
    //Mojo.Log.info('*** num of streams: '+StageAssistant.streamsList.length);
    // if no more streams are available set active stream to -1
    if (StageAssistant.streamsList.length === 0) {
        //Mojo.Log.info('*** no more streams');
        StageAssistant.activeStream = -1;
    }
    
    // update the onscreen info, e.g. in case the current stream is removed
    this.updateCurrentStreamInfo();
    this.updateStreamsInfo();
    
    // save to depot
    currentStageControl.storageSaveData();
};

/**
 * NOTE: currently not used
 */
PlayerAssistant.prototype.listAddHandler = function (event) {
    Mojo.Log.info("*** Add stream clicked");
};

//
// FUNCTIONS
//

PlayerAssistant.prototype.streamToggler = function () {
    //Mojo.Log.info('*** Stream will toggle');
    
    // something has to be selected before it can be stopped or played
    if (StageAssistant.activeStream !== -1) {
        if (!this.isPending && !this.playing) {
            // not playing, so begin
            this.streamPlay();
        } else {
            // stop playing
            this.streamStop();
        }
    }
};

PlayerAssistant.prototype.streamPlay = function () {
    //Mojo.Log.info("*** Stream will play");
    
    // only act if stream is not yet playing
    if (!this.isPending && !this.playing) {
        try {
	    if (this.stopped) {
                // first set src to stream url
                this.myAudioObj.src = StageAssistant.streamsList[StageAssistant.activeStream].url;
                // let it play
                // upon being loaded it triggers the 'canplay' event, which will call obj.play()
		this.myAudioObj.load();
                this.isPending = true;
            }
	} catch (err) {
	    this.showDialogBox('error', err); 
	}
	this.stopped = false;
	this.playing = true;
        this.updateHeader();
    }
};

PlayerAssistant.prototype.streamStop = function () {
    //Mojo.Log.info("*** Stream will stop");
    
    // only act if stream is indeed playing
    if (this.isPending || this.playing) {
        this.myAudioObj.pause(); // equals stop() for streams (?)
	this.stopped = true;
	this.playing = false;
        this.isPending = false;
        this.updateHeader();
    }
};

PlayerAssistant.prototype.updateHeader = function (specialString) {
    // either update with string or regular text
    if (specialString !== undefined) {
        this.controller.get('main_header_title').update(Mojo.Controller.appInfo.title + ' (' + specialString + ')');
    } else if (StageAssistant.activeStream < 0 || StageAssistant.streamsList.length === 0) {
        // no stream selected or no streams available
        this.controller.get('main_header_title').update(Mojo.Controller.appInfo.title);
    } else {
        // update based on stream name
        this.controller.get('main_header_title').update(StageAssistant.streamsList[StageAssistant.activeStream].name);
    }
    
    // update icon
    if (StageAssistant.activeStream === -1) {
        this.controller.get('play_button').className = '';
    } else if (this.stopped) {
        this.controller.get('play_button').className = 'icon play';
    } else if (this.isPending) {
        this.controller.get('play_button').className = 'icon pending';
    } else if (this.playing) {
        this.controller.get('play_button').className = 'icon stop';
    } else if (false) {
        // TODO
        this.controller.get('play_button').className = 'icon error';
    }
};

PlayerAssistant.prototype.updateCurrentStreamInfo = function () {
    
    var streamObj = StageAssistant.streamsList[StageAssistant.activeStream];
    
    if (streamObj !== undefined) {
        // fill in fields with info of current stream
        this.controller.get('stream_artist').update( streamObj.curArtist );
        this.controller.get('stream_song').update( streamObj.curSong );
    } else {
        this.controller.get('stream_current').hide();
    }
    
    // always update the header
    this.updateHeader();
};

/**
 * Fnction checks whether streams list has any elements.
 * If not, a message is shown.
 */
PlayerAssistant.prototype.updateStreamsInfo = function () {
    if (StageAssistant.streamsList.length === 0) {
        this.controller.get('streams_info_message').show();
    } else {
        this.controller.get('streams_info_message').hide();
    }
    
};

PlayerAssistant.prototype.showDialogBox = function (title, message) {
    this.controller.showAlertDialog({
	onChoose: function (value) {},
	title: title,
	message: message,
	choices: [ {label: 'OK', value: 'OK', type: 'color'} ]
    });
};

//
// VARIABLES
//