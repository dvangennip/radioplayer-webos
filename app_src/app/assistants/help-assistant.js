function HelpAssistant(args) {
	
	// reference to StageAssistant instance
	this.currentStageControl = args;
}

HelpAssistant.prototype.setup = function() {
	
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
	
	// Set title
	this.controller.get('main_header_title').update(Mojo.Controller.appInfo.title);
	this.controller.get('version_info').update('<em>' + $L('Version ') + Mojo.Controller.appInfo.version + ' (BETA)</em>');
};

HelpAssistant.prototype.activate = function(event) {
	StageAssistant.helpOpen = true;
};

HelpAssistant.prototype.deactivate = function(event) {};

HelpAssistant.prototype.cleanup = function(event) {
	StageAssistant.helpOpen = false;
};