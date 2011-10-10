function EditStreamAssistant (stagecontrolreference, streamObject) {
    currentStageControl = stagecontrolreference; // 'this' from StageAssistant
    this.streamObj = streamObject;
}

EditStreamAssistant.prototype.setup = function () {
    // Setup application menu
    this.controller.setupWidget(Mojo.Menu.appMenu, StageAssistant.appMenuAttr, StageAssistant.appMenuModel);
    
    // tablets get back button and other adjustments
    if (StageAssistant.isTablet) {
        // Setup command menu
        this.controller.setupWidget(Mojo.Menu.commandMenu, this.attributes = {
            menuClass: 'no-fade'
        }, StageAssistant.cmdMenuModel);
        
        // accommodate wider tablet screens
        currentStageControl.adjustForTablet(this);
    }
    
    // true if edited stream is a new item
    this.isNew = true;
    // not true if an existing object was passed in
    if (this.streamObj !== undefined && this.streamObj !== null) {
	this.isNew = false;
    }
    
    // flag to check if data is manipulated (should be saved if true)
    this.dirty = false;
    
    // Set title
    if (this.isNew) {
	this.controller.get('main_header_title').update('Add a new stream');
    } else {
	this.controller.get('main_header_title').update('Edit stream');
    }
    
    // Make sure data check info message element is hidden
    this.controller.get('stream_info_message').hide();
    
    // Create a dummy model for a stream
    if (this.isNew) {
	this.myStreamModel = {
	    id: currentStageControl.getNewStreamID(),
	    name: '',
	    genre: 'pop',
	    url: '',
	    curArtist: 'No track info available',
	    curSong: ''
	};
    } else {
	// copy (not reference) the passed in object as model
	 // NOTE: according to Protoype API clone() returns a shallow copy (nested obj's retain references)
	this.myStreamModel = Object.clone(this.streamObj);
    }
    
    // setup name field
    this.textFieldNameAttr = {
        //label: $L('Name'),
        hintText: 'Enter a name', 
        modelProperty: 'name',
        multiline: false,
        autoFocus: false,
        focusMode: Mojo.Widget.focusInsertMode
    };
    this.controller.setupWidget('stream_name', this.textFieldNameAttr, this.myStreamModel);
    
    // setup URL field
    this.textFieldURLAttr = {
        //label: $L('URL'),
        hintText: 'Enter an URL',
        modelProperty: 'url',
        multiline: false,
        autoFocus: false,
        //modifierState: Mojo.Widget.capsLock,
        focusMode: Mojo.Widget.focusInsertMode
    };
    this.controller.setupWidget('stream_url', this.textFieldURLAttr, this.myStreamModel);
    
    // setup genre selector 
    this.genreListModel = {
        choices: StageAssistant.genreList,
        value: this.myStreamModel.genre,
        disabled: false
    };
    this.controller.setupWidget('stream_genre',
	this.attributes = {
            label: $L('Genre')
	},
	this.genreListModel
    );
    
    // setup start game button
    this.buttonModelSave = {
	buttonLabel : $L('Save stream'),
	buttonClass : 'affirmative',
	disabled: this.isNew	// disabled when new, enabled if item existed
    };
    this.buttonAttrSave = {
	//type : 'Activity'
    };
    this.controller.setupWidget('save_stream_button', this.buttonAttrSave, this.buttonModelSave);
    
    // setup start game button
    this.buttonModelCancel = {
	buttonLabel : $L('Cancel'),
	disabled: false
    };
    this.buttonAttrCancel = {
	//type : 'Activity'
    };
    this.controller.setupWidget('cancel_stream_button', this.buttonAttrCancel, this.buttonModelCancel);
    
    // setup event listeners
    this.nameField = this.controller.get('stream_name');
    this.nameChangeBinder = this.handleNameChange.bind(this);
    Mojo.Event.listen(this.nameField, Mojo.Event.propertyChange, this.nameChangeBinder);
    
    this.urlField = this.controller.get('stream_url');
    this.urlChangeBinder = this.handleURLChange.bind(this);
    Mojo.Event.listen(this.urlField, Mojo.Event.propertyChange, this.urlChangeBinder);
    
    this.genreSelector = this.controller.get('stream_genre');
    this.genreChangeBinder = this.handleGenreChange.bind(this);
    Mojo.Event.listen(this.genreSelector, Mojo.Event.propertyChange, this.genreChangeBinder);
    
    this.handleSaveButtonBinder = this.handleSaveButton.bind(this);
    this.handleCancelButtonBinder = this.handleCancelButton.bind(this);
    Mojo.Event.listen(this.controller.get('save_stream_button'), Mojo.Event.tap, this.handleSaveButtonBinder);
    Mojo.Event.listen(this.controller.get('cancel_stream_button'), Mojo.Event.tap, this.handleCancelButtonBinder);
};

EditStreamAssistant.prototype.activate = function (event) {
    Mojo.Event.listen(this.nameField, Mojo.Event.propertyChange, this.nameChangeBinder);
    Mojo.Event.listen(this.urlField, Mojo.Event.propertyChange, this.urlChangeBinder);
    Mojo.Event.listen(this.genreSelector, Mojo.Event.propertyChange, this.genreChangeBinder);
    Mojo.Event.listen(this.controller.get('save_stream_button'), Mojo.Event.tap, this.handleSaveButtonBinder);
    Mojo.Event.listen(this.controller.get('cancel_stream_button'), Mojo.Event.tap, this.handleCancelButtonBinder);
};

EditStreamAssistant.prototype.deactivate = function (event) {
    
    // call for save of depot if changed were made
    if (this.dirty) {
	currentStageControl.storageSaveData();
	this.dirty = false;
    }
    Mojo.Event.stopListening(this.nameField, Mojo.Event.propertyChange, this.nameChangeBinder);
    Mojo.Event.stopListening(this.urlField, Mojo.Event.propertyChange, this.urlChangeBinder);
    Mojo.Event.stopListening(this.genreSelector, Mojo.Event.propertyChange, this.genreChangeBinder);
    Mojo.Event.stopListening(this.controller.get('save_stream_button'), Mojo.Event.tap, this.handleSaveButtonBinder);
    Mojo.Event.stopListening(this.controller.get('cancel_stream_button'), Mojo.Event.tap, this.handleCancelButtonBinder);
};

EditStreamAssistant.prototype.cleanup = function (event) {
    Mojo.Event.stopListening(this.nameField, Mojo.Event.propertyChange, this.nameChangeBinder);
    Mojo.Event.stopListening(this.urlField, Mojo.Event.propertyChange, this.urlChangeBinder);
    Mojo.Event.stopListening(this.genreSelector, Mojo.Event.propertyChange, this.genreChangeBinder);
    Mojo.Event.stopListening(this.controller.get('save_stream_button'), Mojo.Event.tap, this.handleSaveButtonBinder);
    Mojo.Event.stopListening(this.controller.get('cancel_stream_button'), Mojo.Event.tap, this.handleCancelButtonBinder);
};

//
// EVENT HANDLERS
//

EditStreamAssistant.prototype.handleNameChange = function (event) {
    //Mojo.Log.info("*** name change event");
    // have data checked (value already in model)
    if (this.checkStreamData()) {
	this.dirty = true;
    }
};

EditStreamAssistant.prototype.handleURLChange = function (event) {
    //Mojo.Log.info("*** url change event");
    // have data checked (value already in model)
    if (this.checkStreamData()) {
	this.dirty = true;
    }
};

EditStreamAssistant.prototype.handleGenreChange = function (event) {
    //Mojo.Log.info("*** genre change event: ", event.value);
    // set genre in model
    this.myStreamModel.genre = event.value;
    this.dirty = true;
};

EditStreamAssistant.prototype.handleCancelButton = function (event) {
    // just pop me
    this.dirty = false; // without saving anything
    currentStageControl.controller.popScene();
};

EditStreamAssistant.prototype.handleSaveButton = function (event) {
    //Mojo.Log.info("*** stream model: "+JSON.stringify(this.myStreamModel));
    // check first
    if (this.checkStreamData()) {
        // then save / append in StageAssistant.streamsList
        // NOTE: should use a cloned copy to avoid issues with references and such
	if (this.isNew) {
	    StageAssistant.streamsList.push( this.myStreamModel );
	} else {
	    // replace old object with edited one
	    var atIndex = currentStageControl.streamFindInList(this.myStreamModel.id, 0);
	    StageAssistant.streamsList[atIndex] = this.myStreamModel;
	}

        // then pop me
	this.dirty = true; // ow filty me, I should be saved!
        currentStageControl.controller.popScene();
    }
};

//
// FUNCTIONS
//

EditStreamAssistant.prototype.checkStreamData = function () {
  
  var correctName = false,
      correctURL = false,
      infoMessage= '';
  
  // check if there is a name
  if (this.myStreamModel.name.length > 0) {
    // check if it is unique (or already existed)
    if ( !this.isNew || currentStageControl.streamFindInList(this.myStreamModel.name, 1) === -1) {
        correctName = true;
    } else {
        infoMessage += ' This stream name is already in use.<br/>';
    }
  } else {
    infoMessage += ' This stream has no name yet.<br/>';
  }
  
  // check URL
  if (this.myStreamModel.url.length > 0) {
    // check if it is unique (or already existed)
    if ( !this.isNew || currentStageControl.streamFindInList(this.myStreamModel.url, 2) === -1) {
        // check if it is a valid URL
        if ( currentStageControl.streamValidateURL(this.myStreamModel.url) ) {
            correctURL = true;
        } else {
            infoMessage += ' The stream URL is not a correct URL (perhaps due to a typo).<br/>';
        }
    } else {
        infoMessage += ' The stream URL is already in use.<br/>';
    }
  } else {
    infoMessage += ' This stream has no URL yet.<br/>';
  }
  
  // act on results
  if (correctName && correctURL) {
    // enable save button
    this.buttonModelSave.disabled = false;
    this.controller.modelChanged(this.buttonModelSave);
    // hide any messages
    this.controller.get('stream_info_message').hide();
    
    // return positively
    return true;
  } else {
    // disable save button
    this.buttonModelSave.disabled = true;
    this.controller.modelChanged(this.buttonModelSave);
    // show info message
    this.controller.get('stream_info_message').update(infoMessage);
    this.controller.get('stream_info_message').show();
  }
  
  return false;
};