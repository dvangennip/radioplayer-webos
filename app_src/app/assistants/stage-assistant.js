function StageAssistant() {
	/* this is the creator function for your stage assistant object */
}

/**
 * this function is for setup tasks that have to happen when the stage is first created.
 */
StageAssistant.prototype.setup = function() {
    // free as in 'a square has four sides to choose from'
    this.controller.setWindowOrientation('free');
    
    // set locale if possible
    /*
    if (Mojo.Locale.getCurrentFormatRegion() === 'nl') {
	Mojo.Locale.set('nl_nl');	
    }
    */
    
    // Get stored data
    this.storageInit(function () {
        // on callback
        // push the first scene, including a reference to this stage controller
        this.controller.pushScene({name: 'player'}, this);
    }.bind(this));
};

//
//  MENU AND COMMAND HANDLERS ETC. GO HERE
//

/**
 * Handles commands that have bubbled up throught the command chain.
 * Commands that are not handled within a scene are caught here.
 */
StageAssistant.prototype.handleCommand = function(event) {
    var currentStageControl = Mojo.Controller.appController.getActiveStageController();
    var currentScene = this.controller.activeScene();
    //Mojo.Log.info("*** event.type: " + event.type + ", command: " + event.command);
    
    // handle command menu taps
    if (event.type === Mojo.Event.command) {
	switch(event.command)
	{
            case 'do-appPopScene':
                this.controller.popScene();
                break;
	    case 'do-appHelp':
		if (!StageAssistant.helpOpen) {
		    this.controller.pushScene({'name': 'help'}, this);
		} else {
                    this.controller.popToScene({'name': 'help'});
                }
                break;
            case 'do-addStream':
                this.controller.pushScene({'name': 'edit-stream'}, this);
                break;
	    default:
		Mojo.Log.error("Got command " + event.command);
                break;
	}
    }
};

//
// FUNCTIONS GO BELOW HERE
//

/**
 * Function returns an integer that is unique among the current set of
 * stream ID's, hence can be assigned to a newly added stream.
 */
StageAssistant.prototype.getNewStreamID = function() {
	
    var i, l = 0, noIDfound = true;
    
    // loop over the ID list with a possible ID to see if it is available
    while (noIDfound) {
        noIDfound = false;
        for (i = 0; i < StageAssistant.streamsList.length; i++) {
            if (l === StageAssistant.streamsList[i].id) {
                // value not usable, move on to next one
                l++;
                noIDfound = true;
                continue;
            }
        }
    }
    
    // return usable stream ID
    return l;
};

/**
 * Function iterates over stream list and returns index of an item
 * when it is found or -1 if no match was found
 *
 * @param input Value to check for
 * @param inputType specifies the kind of input that is given:
 *     currently supported:
 *       0 - stream ID
 *       1 - stream name
 *       2 - stream URL
 */
StageAssistant.prototype.streamFindInList = function(input, inputType) {
	
    var i, foundAtIndex = -1; // default if not found
    
    // looking for streamID (does include current stream)
    if (inputType === 0) {
        // check if ID exists already
        for (i = 0; i < StageAssistant.streamsList.length; i++) {
            // actual comparison
            if (StageAssistant.streamsList[i].id === input) {
                foundAtIndex = i;
                break;
            }
        }
    }
    // looking for stream name
    else if (inputType === 1) {
        // check if name exists already
        for (i = 0; i < StageAssistant.streamsList.length; i++) {
            // actual comparison
            if (StageAssistant.streamsList[i].name === input) {
                foundAtIndex = i;
                break;
            }
        }
    }
    // looking for stream URL
    else if (inputType === 2) {
        // check if URL exists already
        for (i = 0; i < StageAssistant.streamsList.length; i++) {
            // actual comparison
            if (StageAssistant.streamsList[i].url === input) {
                foundAtIndex = i;
                break;
            }
        }
    }
    
    //Mojo.Log.info("*** Stream was found at: "+foundAtIndex);
    return foundAtIndex;
};

/**
 * Function is a wrapper for a regex match to validate a stream URL
 * No check is performed on the actual contents of the URL.
 *
 * @param {String} url The URL to test.
 * @returns {Boolean} True if URL is valid, false otherwise.
 */
StageAssistant.prototype.streamValidateURL = function (url) {
    
    var urlIsValid = false;
    
    // match(/regex/) method returns an array of matches, or null if no match is found.
    // TODO improve matching (also matches nu.l which is not valid)
    if ( url.match(/^(http:\/\/)?[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?^=%&amp;:/~\+#]*[\w\-\@?^=%&amp;/~\+#])?/) !== null) {
        urlIsValid = true;
    }
    
    return urlIsValid;
};

/**
 * Service request to let volume keys adjust media volume rather than ringtone volume.
 * 
 * FROM PALM SDK INFO:
 * The typical use case would be when a media-based application is active,
 * but media is not currently playing. In this case, the user expects volume keys to
 * control the media volume setting. However by default, if media is not playing,
 * the volume keys still control the ringer volume.
 */
StageAssistant.prototype.setupVolumeKeys = function (callback) {
  
    var currentScene = this.controller.activeScene(),
        parameters = {},
        vkeysRequest;
  
    parameters.subscribe = true;
    parameters.foregroundApp = true;
  
    vkeysRequest = currentScene.serviceRequest("palm://com.palm.audio/media",
        {
            method: 'lockVolumeKeys',
            onSuccess: callback,
            parameters: parameters
        }
    );
};

/**
 * Function adds 'tablet' classes if the device is a tablet
 * Essentially the header gets adjusted if it has the correct id's
 * and content that is wrapped within a container with id 'content_wrapper'
 * gets its width maximized at 510px, similar to single pane Enyo views.
 */
StageAssistant.prototype.adjustForTablet = function(sceneRef) {
    if (StageAssistant.isTablet) {
        sceneRef.controller.get('body-radio').addClassName('tablet');
        // these elements might not be present at all times
        try {
                sceneRef.controller.get('the_header').className = '';
                sceneRef.controller.get('the_header').addClassName('palm-page-header-tablet');
                sceneRef.controller.get('the_header_wrapper').className = '';
                sceneRef.controller.get('the_header_wrapper').addClassName('palm-page-header-wrapper-tablet');
        } catch (e1) {
                // do nothing as there was nothing to adjust
        }
        try {
                sceneRef.controller.get('main_header').removeClassName('left');
        } catch (e2) { }
        try {
                sceneRef.controller.get('content_wrapper').addClassName('tablet');
        } catch (e3) {}
    }
};

//
// STORAGE RELATED FUNCTIONS
//

StageAssistant.prototype.storageInit = function (callback) {
	
    var onSuccess, onFailure;
    
    // callback functions
    onSuccess = function () {
        //Mojo.Log.info("*** depot was created");
        // continue to get data
        this.storageGetData(callback);
    }.bind(this);
    onFailure = function (error) {
        Mojo.Log.error("*** depot could not be created: "+error);
        if (callback) {
            callback();
        }
    };
    
    // create Mojo.Depot
    this.db = new Mojo.Depot({
        'name': 'radioDB',
        'version': 1
        },
        onSuccess.bind(this),
        onFailure
    );
};

StageAssistant.prototype.storageGetData = function (callback) {
	
    // try to get data
    if (this.db) {
        // getting an existing key
        this.db.get(StageAssistant.kDepotKey,
        function (object) {
            if (object !== null) {
                //Mojo.Log.info("*** depot was retrieved");
                // set it
                StageAssistant.streamsList = object.list;
                StageAssistant.activeStream = object.aStream;
            } else {
                Mojo.Log.error("*** depot not retrieved (no such object available)");
                // set default list
                StageAssistant.streamsList = StageAssistant.defaultStreamsList;
                StageAssistant.activeStream = -1;
            }
            
            if (callback) {
                callback();
            }
        },
        function (error) {
            Mojo.Log.error("*** depot not retrieved: "+error);
            // set default list
            StageAssistant.streamsList = StageAssistant.defaultStreamsList;
            StageAssistant.activeStream = -1;
                
            if (callback) {
                callback();
            }
        });
    }
};

StageAssistant.prototype.storageSaveData = function () {
    if (this.db) {
        var storageObj = {};
        storageObj.list = StageAssistant.streamsList;
        storageObj.aStream = StageAssistant.activeStream;
        // adding an existing key replaces it
        this.db.add(
            StageAssistant.kDepotKey,
            storageObj,
            function () {
                //Mojo.Log.info("*** depot was stored");
            },
            function (error) {
                Mojo.Log.error("*** depot could not be stored: "+error);
            }
        );
    }
};

//
// MODELS GO BELOW HERE
//

StageAssistant.appMenuAttr = {omitDefaultItems: true};

StageAssistant.appMenuModel = {
    visible: true,
    items: [ 
        Mojo.Menu.editItem,
        { label: $L('Help'), command: 'do-appHelp', disabled: false }
    ]
};

StageAssistant.cmdMenuModel = {
    items: [
        {icon: 'back', command: 'do-appPopScene'}
        //{visible: false, disabled: true}
    ]
};

StageAssistant.streamsList = [];

StageAssistant.defaultStreamsList = [
    {
        id: 0,
        name: 'Studio Brussel',
        genre: 'alt',
        url: 'http://mp3.streampower.be/stubru-low.mp3', // opties: -mid, -high
        curArtist: 'No track info available',
        curSong: ''
    },
    {
        id: 1,
        name: 'Pinguin Radio',
        genre: 'alt',
        url: 'http://81.173.3.20:80/',
        curArtist: 'No track info available',
        curSong: ''
    },
    {
        id: 2,
        name: '3FM',
        genre: 'pop',
        url: 'http://ics2ess.omroep.nl:80/3fm-bb.mp3?q=/npo/mp3/3fm-bb.pls&stream=ok',
        curArtist: 'No track info available',
        curSong: ''
    },
    {
        id: 3,
        name: 'Concertzender',
        genre: 'alt',
        url: 'http://streams.greenhost.nl:8080/live', // aac 64kbps werkt niet
        curArtist: 'No track info available',
        curSong: ''
    }
];

// selection of http://en.wikipedia.org/wiki/List_of_popular_music_genres
StageAssistant.genreList = [
    { label: 'Alternative', value: 'alt' },
    { label: 'Ambient', value: 'ambient' },
    { label: 'Blues', value: 'blues' },
    { label: 'Classic', value: 'classic' },
    { label: 'Country', value: 'country' },
    { label: 'Dance', value: 'dance' },
    { label: 'Dubstep', value: 'dubstep' },
    { label: 'Electronica', value: 'elec' },
    { label: 'Folk', value: 'folk' },
    { label: 'Hip hop', value: 'hiphop' },
    { label: 'Indie', value: 'indie' },
    { label: 'Jazz', value: 'jazz' },
    { label: 'Latin', value: 'latin' },
    { label: 'Metal', value: 'metal' },
    { label: 'Minimal', value: 'minim' },
    { label: 'Pop', value: 'pop' },
    { label: 'Progressive', value: 'prog' },
    { label: 'Punk', value: 'punk' },
    { label: 'R & B', value: 'r&b' },
    { label: 'Rap', value: 'rap' },
    { label: 'Reggae', value: 'reggae' },
    { label: 'Rock', value: 'rock' },
    { label: 'Schlager', value: 'schlager' },
    { label: 'Ska', value: 'ska' },
    { label: 'Talk', value: 'talk' },
    { label: 'Trance', value: 'trance' },
    { label: 'World', value: 'world' }
];

//
// VARIABLES BELOW HERE
//

StageAssistant.kDepotKey = "radiodepot";

StageAssistant.volumeKeysAreSet = false;

StageAssistant.activeStream = -1;

StageAssistant.helpOpen = false;

/**
 * Variable is true if device is a tablet
 * Works by using a function that executes once upon launch to set the variable.
 */
StageAssistant.isTablet = (function() {
    // decision is for now based on webOS version number (touchpad is on v3, smartphones v1 or v2)
    if (Mojo.Environment.DeviceInfo.platformVersionMajor < 3) {
            return false;
    } else {
            return true;
    }
})();