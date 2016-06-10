'use strict';

var
	ko = require('knockout'),
	
	TextUtils = require('modules/CoreClient/js/utils/Text.js'),
	
	Ajax = require('modules/CoreClient/js/Ajax.js'),
	App = require('modules/CoreClient/js/App.js'),
	Api = require('modules/CoreClient/js/Api.js'),
	Screens = require('modules/CoreClient/js/Screens.js'),
	Routing = require('modules/CoreClient/js/Routing.js'),
	ModulesManager = require('modules/CoreClient/js/ModulesManager.js'),
	
	Popups = require('modules/CoreClient/js/Popups.js'),
	ConfirmPopup = require('modules/CoreClient/js/popups/ConfirmPopup.js'),
	ChangePasswordPopup = ModulesManager.run('ChangePasswordClient', 'getChangePasswordPopup'),
	CreateAccountPopup = ModulesManager.run('MailClient', 'getCreateAccountPopup'),
	
	Settings = require('modules/%ModuleName%/js/Settings.js')
;

/**
 * @constructor
 */
function CResetPasswordView()
{
	this.oDefaultAccount = App.defaultAccount();
	this.showResetPasswordButton = ko.computed(function () {
		return this.oDefaultAccount && !this.oDefaultAccount.allowMail();
	}, this);
	this.resetPasswordButtonText = ko.computed(function () {
		if (this.oDefaultAccount)
		{
			if (this.oDefaultAccount.passwordSpecified())
			{
				return TextUtils.i18n('CORECLIENT/ACTION_RESET_PASSWORD');
			}
			else
			{
				return TextUtils.i18n('%MODULENAME%/ACTION_SET_PASSWORD');
			}
		}
		return ''
	}, this);
	var aHintSetPassword = TextUtils.i18n('%MODULENAME%/INFO_SET_PASSWORD').split(/%STARTLINK%|%ENDLINK%/);
	this.sHintSetPassword1 = aHintSetPassword.length > 0 ? aHintSetPassword[0] : '';
	this.sHintSetPassword2 = aHintSetPassword.length > 1 ? aHintSetPassword[1] : '';
	this.sHintSetPassword3 = aHintSetPassword.length > 2 ? aHintSetPassword[2] : '';
}

CResetPasswordView.prototype.ViewTemplate = '%ModuleName%_ResetPasswordView';

CResetPasswordView.prototype.configureMail = function ()
{
	if (this.oDefaultAccount && !this.oDefaultAccount.allowMail() && CreateAccountPopup)
	{
		Popups.showPopup(CreateAccountPopup, [Enums.AccountCreationPopupType.ConnectToMail, this.oDefaultAccount.email()]);
	}
};

CResetPasswordView.prototype.resetPassword = function ()
{
	if (this.oDefaultAccount)
	{
		if (Settings.ResetPassHash === '' && !this.oDefaultAccount.passwordSpecified())
		{
			Popups.showPopup(ConfirmPopup, [
				TextUtils.i18n('%MODULENAME%/CONFIRM_SEND_RESET_INSTRUCTIONS', {'EMAIL': this.oDefaultAccount.email()}),
				_.bind(this.onResetPasswordPopupAnswer, this),
				this.oDefaultAccount.passwordSpecified() ? TextUtils.i18n('%MODULENAME%/HEADING_RESET_PASSWORD') : TextUtils.i18n('%MODULENAME%/HEADING_SET_PASSWORD'),
				TextUtils.i18n('CORECLIENT/ACTION_SEND'),
				TextUtils.i18n('CORECLIENT/ACTION_CANCEL')
			]);
		}
		else
		{
			Popups.showPopup(ChangePasswordPopup, [false, this.oDefaultAccount.passwordSpecified(), function () { 
				this.oDefaultAccount.passwordSpecified(true); 
	//			if (AfterLogicApi.runPluginHook)
	//			{
	//				AfterLogicApi.runPluginHook('api-mail-on-password-specified-success', [this.__name, this]);
	//			}	
			}]);
		}
	}
};

/**
 * @param {boolean} bReset
 */
CResetPasswordView.prototype.onResetPasswordPopupAnswer = function (bReset)
{
	if (bReset)
	{
		Screens.showLoading(TextUtils.i18n('CORECLIENT/INFO_SENDING'));
		Ajax.send('Mail', 'ResetPassword', {'UrlHash': Routing.currentHash()}, this.onResetPassword, this);
	}
};

/**
 * @param {Object} oResponse
 * @param {Object} oRequest
 */
CResetPasswordView.prototype.onResetPassword = function (oResponse, oRequest)
{
	Screens.hideLoading();
	if (!oResponse.Result)
	{
		Api.showErrorByCode(oResponse);
	}
	else
	{
		Screens.showReport(TextUtils.i18n('%MODULENAME%/REPORT_INSTRUCTIONS_SENT'));
	}
};

module.exports = new CResetPasswordView();
