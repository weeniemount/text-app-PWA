/**
 * @constructor
 */
function Tab(id, session, lineEndings, fileHandle, dialogController) {
  this.id_ = id;
  this.session_ = session;
  this.lineEndings_ = lineEndings;
  this.fileHandle_ = fileHandle;
  this.saved_ = true;
  this.path_ = null;
  this.dialogController_ = dialogController;
  if (this.fileHandle_)
    this.updatePath_();
}

Tab.prototype.getId = function() {
  return this.id_;
};

Tab.prototype.getName = function() {
  if (this.fileHandle_) {
    return this.fileHandle_.name;
  } else {
    return 'Untitled ' + this.id_;
  }
};

Tab.prototype.getExtension = function() {
  if (!this.fileHandle_)
    return null;
  return util.getExtension(this.getName());
};

Tab.prototype.getSession = function() {
  return this.session_;
};

Tab.prototype.setSession = function(session) {
  return this.session_ = session;
};

Tab.prototype.setFileHandle = function(fileHandle) {
  var nameChanged = this.getName() != fileHandle.name;
  this.fileHandle_ = fileHandle;
  if (nameChanged)
    $.event.trigger('tabrenamed', this);
  this.updatePath_();
};

Tab.prototype.getFileHandle = function() {
  return this.fileHandle_;
};

Tab.prototype.getPath = function() {
  return this.path_;
};

Tab.prototype.updatePath_ = function() {
  this.path_ = this.fileHandle_.name;
  $.event.trigger('tabpathchange', this);
};

Tab.prototype.getContent_ = function() {
  return this.session_.doc.toString().split('\n').join(this.lineEndings_);
};

Tab.prototype.save = async function(opt_callbackDone) {
  try {
    const writable = await this.fileHandle_.createWritable();
    await writable.write(this.getContent_());
    await writable.close();
    this.saved_ = true;
    $.event.trigger('tabsave', this);
    if (opt_callbackDone)
      opt_callbackDone();
  } catch (e) {
    this.reportWriteError_(e);
  }
};

Tab.prototype.reportWriteError_ = function(e) {
  this.dialogController_.setText('Error saving file: ' + e.message);
  this.dialogController_.resetButtons();
  this.dialogController_.addButton('ok', 'OK');
  this.dialogController_.show();
};

Tab.prototype.isSaved = function() {
  return this.saved_;
};

Tab.prototype.changed = function() {
  if (this.saved_) {
    this.saved_ = false;
    $.event.trigger('tabchange', this);
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Tab };
}
