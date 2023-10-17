tinymce.PluginManager.add('pluginId', (editor, url) => {
    debugger
    // editor.on('click', function (event) {
    //     alert("hi")
    // })

    editor.ice_loaded_externally = true;
    editor.path_to_ice_js = ''; // required if loading ice.js via plugin; i.e. ice_loaded_externally is false
    editor.deleteTag = 'span';
    editor.insertTag = 'span';
    editor.deleteClass = 'del';
    editor.insertClass = 'ins';
    editor.changeIdAttribute = 'data-cid';
    editor.userIdAttribute = 'data-userid';
    editor.userNameAttribute = 'data-username';
    editor.timeAttribute = 'data-time';
    editor.stageAttribute = 'data-stage';
    editor.preserveOnPaste = 'p';
    editor.user = { name: 'Unknown User', id: Math.random() },
        editor.isTracking = true;
    editor.contentEditable = true;
    editor.css = 'css/ice.css';
    editor.mergeBlocks = true;
    editor.titleDateFormat = 'm/d/Y h:ia';
    editor.afterInit = function () { }
    editor.afterClean = function (body) {
        return body;
    }
    editor.beforePasteClean = function (body) {
        return body;
    }
    editor.afterPasteClean = function (body) {
        return body;
    }
    editor.trackChangesButton = function () { }
    editor.showChangesButton = function () { }
    editor.acceptButton = function () { }
    editor.rejectButton = function () { }
    editor.acceptAllButton = function () { }
    editor.rejectAllButton = function () { }

    editor.trackChangesButton.disabled = function () {return false}
    editor.trackChangesButton.active = function () {return true}
    editor.showChangesButton.disabled = function () {return false}
    editor.showChangesButton.active = function () {return true}
    editor.acceptButton.disabled = function () {return false}
    editor.rejectButton.disabled = function () {return false}
    editor.acceptAllButton.disabled = function () {return false}
    editor.rejectAllButton.disabled = function () {return false}
    /**
     * Plugin initialization - register buttons, commands, and take care of setup.
     */
    editor.init = function (editor, url) {
        var self = this, changeEditor = null;

        editor.handleEvents = function (e) {
            if (editor.changeEditor !== undefined) {
                return editor.changeEditor.handleEvent(e);
            }
        };

        editor.on('mouseup mousedown keydown keyup keypress', function (e) {

            var evtobj = window.event ? event : e
            if (evtobj.ctrlKey) {
                if (evtobj.keyCode != 32) {
                    return editor.handleEvents(e);
                }
            }
            else {

                return editor.handleEvents(e);
            }
        });

        /**
         * After the editor renders, initialize ice.
         */
        editor.on('postrender', function (e) {
            var dom = editor.dom;


            tinymce.extend(self, editor.getParam('ice'));
            editor.insertSelector = '.' + editor.insertClass;
            editor.deleteSelector = '.' + editor.deleteClass;

            // Add insert and delete tag/attribute rules.
            // Important: keep `id` in attributes list in case `insertTag` is a `span` - tinymce uses temporary spans with ids.
            editor.serializer.addRules(editor.insertTag + '[id|class|title|' + editor.changeIdAttribute + '|' + editor.userIdAttribute + '|' + editor.userNameAttribute + '|' + editor.timeAttribute + '|' + editor.stageAttribute + ']');
            editor.serializer.addRules(editor.deleteTag + '[id|class|title|' + editor.changeIdAttribute + '|' + editor.userIdAttribute + '|' + editor.userNameAttribute + '|' + editor.timeAttribute + '|' + editor.stageAttribute + ']');
            // Temporary tags to act as placeholders for deletes.
            editor.serializer.addRules('tempdel[data-allocation]');

            if (!editor.ice_loaded_externally) {
                tinymce.ScriptLoader.load(url + editor.path_to_ice_js, editor.execCommand('initializeice'));
            } else {
                editor.execCommand('initializeice');
            }

            // Setting the trackChanges button to whatever isTracking was set on initialisation
            editor.trackChangesButton.active(editor.isTracking);
            // always show changes on startup in case there was previous changeds
            editor.showChangesButton.active(true);
        });

        /**
         * Instantiates a new ice instance using the given `editor` or the current editor body.
         * TODO/FIXME: There is some timing conflict that forces us to initialize ice after a
         * timeout (maybe mce isn't completely initialized???). Research further...
         */
        editor.addCommand('initializeice', function (editor1) {

            editor = editor1 || editor;
            tinymce.DOM.win.setTimeout(function () {
                // Protect against leaving the page before the timeout fires. Happens in automated testing.
                if (!(editor.getDoc()) || editor.getDoc() === null) {
                    return;
                }

                //nagarajbabu added this for username and userid get it from query string
                var qs_stage = 'First proof';
                var qs_username = 'Ghaudham M';
                var qs_userid = 'emp_101';

debugger
                editor.changeEditor = new ice.InlineChangeEditor({
                    element: editor.getBody(),
                    isTracking: editor.isTracking,
                    contentEditable: editor.contentEditable,
                    changeIdAttribute: editor.changeIdAttribute,
                    userIdAttribute: editor.userIdAttribute,
                    userNameAttribute: editor.userNameAttribute,
                    timeAttribute: editor.timeAttribute,
                    stageAttribute: editor.stageAttribute,
                    titleDateFormat: editor.titleDateFormat,
                    mergeBlocks: editor.mergeBlocks,
                    currentUser: {
                        id: editor.user.id,
                        name: editor.user.name
                        // id: qs_userid,
                        // name: qs_username
                    },
                    plugins: [
                        'IceEmdashPlugin',
                        'IceAddTitlePlugin',
                        'IceSmartQuotesPlugin',
                        {
                            name: 'IceCopyPastePlugin',
                            settings: {
                                pasteType: 'formattedClean',
                                preserve: editor.preserveOnPaste,
                                beforePasteClean: editor.beforePasteClean,
                                afterPasteClean: editor.afterPasteClean
                            }
                        }
                    ],
                    changeTypes: {
                        insertType: { tag: editor.insertTag, alias: editor.insertClass },
                        deleteType: { tag: editor.deleteTag, alias: editor.deleteClass }
                    }
                }).startTracking();

                setTimeout(function () {
                    editor.afterInit.call(self);
                    debugger
                }, 10);
            }, 500);
        });

        /**
         * Re-initializes ice's environment - resets the environment variables for the current page
         * and re-initializes the internal ice range. This is useful after tinymce hides/switches
         * the current editor, like when toggling to the html source view and back.
         */
        editor.addCommand('ice_initenv', function () {
            editor.changeEditor.initializeEnvironment();
            editor.changeEditor.initializeRange();
        });

        /**
         * Cleans change tracking tags out of the given, or editor, body. Removes deletes and their
         * inner contents; removes insert tags, keeping their inner content in place.
         * @param el optional html string or node body.
         * @return clean body, void of change tracking tags.
         */
        editor.addCommand('icecleanbody', function (el) {
            return editor.changeEditor.getCleanContent(el || editor.getContent(), editor.afterClean, editor.beforeClean);
        });

        /**
         * Returns true if delete placeholders are in place; otherwise, false.
         */
        editor.addCommand('ice_hasDeletePlaceholders', function () {
            return editor.changeEditor.isPlaceholdingDeletes;
        });

        /**
         * This command will drop placeholders in place of delete tags in the editor body and
         * store away the references which can be reverted back with the `ice_removeDeletePlaceholders`.
         */
        editor.addCommand('ice_addDeletePlaceholders', function () {
            return editor.changeEditor.placeholdDeletes();
        });

        /**
         * Replaces delete placeholders with their respective delete nodes.
         */
        editor.addCommand('ice_removeDeletePlaceholders', function () {
            return editor.changeEditor.revertDeletePlaceholders();
        });

        /**
         * Insert content with change tracking tags.
         *
         * The `insert` object parameter can contain the following properties:
         *   { `item`, `range` }
         * Where `item` is the item to insert (string, or textnode)
         * and `range` is an optional range to insert into.
         */
        editor.addCommand('iceinsert', function (insert) {

            insert = insert || {};
            editor.changeEditor.insert(insert.item, insert.range);
        });

        /**
         * Deletes content with change tracking tags.
         *
         * The `del` object parameter can contain the following properties:
         *   { `right`, `range` }
         * Where `right` is an optional boolean parameter, where true deletes to the right, false to the left
         * and `range` is an optional range to delete in.
         *
         * If the current Selection isn't collapsed then the `right` param is ignored
         * and a selection delete is performed.
         */
        editor.addCommand('icedelete', function (del) {
            del = del || {};
            editor.changeEditor.deleteContents(del.right, del.range);
        });

        /**
         * Set the current ice user with the incoming `user`.
         */
        editor.addCommand('ice_changeuser', function (user) {
            editor.changeEditor.setCurrentUser(user);
        });

        /**
         * Uses the given `node` or finds the current node where the selection resides, and in the
         * case of a delete tag, removes the node, or in the case of an insert, removes the outer
         * insert tag and keeps the contents in place.
         */
        editor.addCommand('iceaccept', function (node) {
            editor.undoManager.add();
            tinyMCE.activeEditor.undoManager.redo();
            editor.changeEditor.acceptChange(node || editor.selection.getNode());
            var node = editor.selection.getNode();
            console.log($(node).closest('p'));
            console.log($('delete').eq(0).closest('p').next());

            cleanup();
        });

        /**
         * Uses the given `node` or finds the current node where the selection resides, and in the
         * case of a delete tag, removes the outer delete tag and keeps the contents in place, or
         * in the case of an insert, removes the node.
         */
        editor.addCommand('icereject', function (node) {
            editor.undoManager.add();
            tinyMCE.activeEditor.undoManager.redo();
            editor.changeEditor.rejectChange(node || editor.selection.getNode());
            cleanup();
        });

        /**
         * Cleans the editor body of change tags - removes delete nodes, and removes outer insert
         * tags keeping the inner content in place. Defers to cleaning technique.
         */
        editor.addCommand('iceacceptall', function () {
            editor.undoManager.add();
            tinyMCE.activeEditor.undoManager.redo();
            editor.changeEditor.acceptAll();
            cleanup();
        });

        /**
         * Cleans the editor body of change tags - removes inserts, and removes outer delete tags,
         * keeping the inner content in place.
         */
        editor.addCommand('icerejectall', function () {
            editor.undoManager.add();
            tinyMCE.activeEditor.undoManager.redo();
            editor.changeEditor.rejectAll();
            cleanup();
        });

        /**
         * Adds a class to the editor body which will toggle, hide or show, track change styling.
         */
        editor.addCommand('ice_toggleshowchanges', function () {
            var body = editor.getBody(), disabled = true;

            if (editor.dom.hasClass(body, 'CT-hide')) {
                //activate show changes button
                editor.showChangesButton.active(true);
                editor.dom.removeClass(body, 'CT-hide');
                disabled = false;
            } else {
                //deactivate show changes button
                editor.showChangesButton.active(false);
                editor.dom.addClass(body, 'CT-hide');
            }

            //toggle button disabling
            editor.acceptAllButton.disabled(disabled);
            editor.rejectAllButton.disabled(disabled);
            editor.acceptButton.disabled(disabled);
            editor.rejectButton.disabled(disabled);

            editor.execCommand('mceRepaint');
        });

        /**
         * Calls the ice smart quotes plugin to convert regular quotes to smart quotes.
         */
        editor.addCommand('ice_smartquotes', function (quiet) {
            editor.changeEditor.pluginsManager.plugins['IceSmartQuotesPlugin'].convert(editor.getBody());
            if (!quiet) editor.windowManager.alert('Regular quotes have been converted into smart quotes.');
        });

        /**
         * Toggle change tracking on or off. Delegates to ice_enable or ice_disable.
         */

        editor.addCommand('ice_togglechanges', function () {
            if (editor.changeEditor.isTracking) {
                editor.execCommand('ice_disable');
            } else {
                editor.execCommand('ice_enable');
            }
        });

        /**
         * Turns change tracking on - ice will handle incoming key events.
         */
        editor.addCommand('ice_enable', function () {
            editor.changeEditor.enableChangeTracking();
            //toggle buttons and call show changes
            editor.trackChangesButton.active(true);
            editor.isTracking = true;
        });

        /**
         * Turns change tracking off - ice will be present but it won't listen
         * or act on events.
         */
        editor.addCommand('ice_disable', function () {
            //hide changes and toggle buttons
            editor.changeEditor.disableChangeTracking();
            editor.trackChangesButton.active(false);
            editor.isTracking = false;
        });

        /**
         * Returns 1 if ice is handling events and tracking changes; otherwise, 0.
         */
        editor.addCommand('ice_isTracking', function () {
            return editor.changeEditor.isTracking ? 1 : 0;
        });

        /**
         * Calls the copy-paste ice plugin to strip tags and attributes out of the given `html`.
         */
        editor.addCommand('ice_strippaste', function (html) {
            return editor.changeEditor.pluginsManager.plugins['IceCopyPastePlugin'].stripPaste(html);
        });

        /**
         * Makes a manual call to the paste handler - this feature is only useful when `isTracking`
         * is false; otherwise, ice will automatically handle paste events.
         */
        editor.addCommand('ice_handlepaste', function (html) {
            return editor.changeEditor.pluginsManager.plugins['IceCopyPastePlugin'].handlePaste();
        });

        /**
         * Makes a manual call to the emdash handler - this feature is only useful when `isTracking`
         * is false and the emdash plugin is not on; otherwise, ice will handle emdash conversion.
         */
        editor.addCommand('ice_handleemdash', function (html) {
            return editor.changeEditor.pluginsManager.plugins['IceEmdashPlugin'].convertEmdash() ? 1 : 0;
        });

        /**
         * Register Buttons
         */
        editor.ui.registry.addButton('iceaccept', {
            title: 'Accept Change',
            image: url + '/img/accept.gif',
            cmd: 'iceaccept',
            classes: 'accepttrack',
            onPostRender: function () { //assigns button and changes disabled status on node change
                var self = this;
                editor.acceptButton = self;
                editor.acceptButton.disabled = editor.disabled;

                editor.on('NodeChange', function (e) {
                    if (isInsideChangeTag(e.element)) {
                        editor.disabled(false);
                    } else {
                        editor.disabled(true);
                    }
                });
            }
        });

        editor.ui.registry.addButton('icereject', {
            title: 'Reject Change',
            image: url + '/img/reject.gif',
            cmd: 'icereject',
            classes: 'rejecttrack',
            onPostRender: function () {//assigns button and changes disabled status on node change
                var self = this;
                editor.rejectButton = self;
                editor.rejectButton.disabled = editor.disabled;

                editor.on('NodeChange', function (e) {
                    if (isInsideChangeTag(e.element)) {
                        editor.disabled(false);
                    } else {
                        editor.disabled(true);
                    }
                });
            }
        });

        editor.ui.registry.addButton('iceacceptall', {
            title: 'Accept All Changes',
            image: url + '/img/ice-accept.png',
            cmd: 'iceacceptall',
            classes: 'accept_all',
            onPostRender: function () { //assigns button
                var self = this;
                editor.acceptAllButton = self;
                editor.acceptAllButton.disabled = editor.disabled;
            }
        });

        editor.ui.registry.addButton('icerejectall', {
            title: 'Reject All Changes',
            image: url + '/img/ice-reject.png',
            cmd: 'icerejectall',
            onPostRender: function () { //assigns button
                var self = this;
                editor.rejectAllButton = self;
                editor.rejectAllButton.disabled = editor.disabled;
            }
        });

        editor.ui.registry.addButton('ice_toggleshowchanges', {
            title: 'Show/Hide Track Changes',
            image: url + '/img/ice-showchanges.png',
            onclick: function () {
                editor.fire('ice_toggleshowchanges');
                editor.execCommand('ice_toggleshowchanges');
            },
            onPostRender: function () { //assigns button
                var self = this;
                editor.showChangesButton = self;
                editor.showChangesButton.disabled = editor.disabled;
                editor.showChangesButton.active = editor.active;
            }
        });

        editor.ui.registry.addButton('ice_smartquotes', {
            title: 'Convert quotes to smart quotes',
            'class': 'mce_blockquote',
            cmd: 'ice_smartquotes'
        });

        editor.ui.registry.addButton('ice_togglechanges', {
            title: 'Toggle Track Changes ',
            image: url + '/img/ice-togglechanges.png',
            cmd: 'ice_togglechanges',
            classes: 'trackchangesToggle',
            onPostRender: function () { //assigns button
                var self = this;
                editor.trackChangesButton = self;
                editor.trackChangesButton.disabled = self.disabled;
                editor.trackChangesButton.active = self.active;
            }
        });

        editor.on('keydown', function (evt) {
            var evtobj = window.event ? event : evt
            if (evtobj.ctrlKey && evtobj.shiftKey && evtobj.keyCode == 69) {
                editor.execCommand('ice_togglechanges');
            }
        });

        if (editor.plugins.contextmenu) {
            /*   editor.plugins.contextmenu.onContextMenu.add(function (th, menu, node) {
                   if (isInsideChangeTag(node)) {
                       menu.add({
                           title: "Accept Change",
                           icon: 'accept',
                           cmd: 'iceaccept'
                       });
                       menu.add({
                           title: "Reject Change",
                           icon: 'reject',
                           cmd: 'icereject'
                       });
                   }
               });*/
        }

        /**
         * Node Change event - watch for node changes and toggle buttons.
         */
        editor.on('NodeChange', function (e) {
            if (isInsideChangeTag(e.element)) {
                editor.acceptButton.disabled(false);
                editor.rejectButton.disabled(false);
            } else {
                editor.acceptButton.disabled(true);
                editor.rejectButton.disabled(true);
            }
            cleanup();
        });

        /**
         * Private Methods
         */

        function isInsideChangeTag(n) {
            return !!editor.dom.getParent(n, editor.insertSelector + ',' + editor.deleteSelector);
        }

        function cleanup() {
            var empty = editor.dom.select(editor.insertSelector + ':empty,' + editor.deleteSelector + ':empty');
            editor.dom.remove(empty);
            // Browsers insert breaks into empty paragraphs as a space holder - clean that up
            // Not playing nice with Webkit...
            /*tinymce.each(editor.dom.select('br'), function(br, i) {
             var p = editor.dom.getParent(br, 'p');
             if(p && (p.innerText || p.textContent) !== '')
             editor.dom.remove(br);
             });*/
        }

    }
    editor.init(editor, url)

    // return {
    //   getMetadata: () => ({
    //     name: 'Custom plugin',
    //     url: 'https://example.com/docs/customplugin'
    //   })
    // }
});
