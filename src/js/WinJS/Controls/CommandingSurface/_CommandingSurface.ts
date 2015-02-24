// Copyright (c) Microsoft Open Technologies, Inc.  All Rights Reserved. Licensed under the Apache License, Version 2.0. See License.txt in the project root for license information.
/// <reference path="../../Core.d.ts" />
import Animations = require("../../Animations");
import _Base = require("../../Core/_Base");
import _BaseUtils = require("../../Core/_BaseUtils");
import BindingList = require("../../BindingList");
import ControlProcessor = require("../../ControlProcessor");
import _Constants = require("../CommandingSurface/_Constants");
import _Command = require("../AppBar/_Command");
import _Control = require("../../Utilities/_Control");
import _Dispose = require("../../Utilities/_Dispose");
import _ElementUtilities = require("../../Utilities/_ElementUtilities");
import _ErrorFromName = require("../../Core/_ErrorFromName");
import _Flyout = require("../../Controls/Flyout");
import _Global = require("../../Core/_Global");
import _Hoverable = require("../../Utilities/_Hoverable");
import _KeyboardBehavior = require("../../Utilities/_KeyboardBehavior");
import Menu = require("../../Controls/Menu");
import _MenuCommand = require("../Menu/_Command");
import _Resources = require("../../Core/_Resources");
import Scheduler = require("../../Scheduler");
import _CommandingSurfaceMenuCommand = require("../CommandingSurface/_MenuCommand");
import _WriteProfilerMark = require("../../Core/_WriteProfilerMark");
import _ShowHideMachine = require('../../Utilities/_ShowHideMachine');
import _Events = require('../../Core/_Events');
import Promise = require('../../Promise');

require(["require-style!less/styles-commandingsurface"]);
require(["require-style!less/colors-commandingsurface"]);

"use strict";

interface ICommandInfo {
    command: _Command.ICommand;
    width: number;
    priority: number;
}

interface ICommandWithType {
    element: HTMLElement;
    type: string;
}

interface IFocusableElementsInfo {
    elements: HTMLElement[];
    focusedIndex: number;
}

interface IDataChangeInfo {
    newElements: HTMLElement[];
    currentElements: HTMLElement[];
    added: HTMLElement[];
    deleted: HTMLElement[];
    affected: HTMLElement[];
}

var strings = {
    get ariaLabel() { return _Resources._getWinJSString("ui/commandingSurfaceAriaLabel").value; },
    get overflowButtonAriaLabel() { return _Resources._getWinJSString("ui/commandingSurfaceOverflowButtonAriaLabel").value; },
    get badData() { return "Invalid argument: The data property must an instance of a WinJS.Binding.List"; },
    get mustContainCommands() { return "The commandingSurface can only contain WinJS.UI.Command or WinJS.UI.AppBarCommand controls"; },
    get duplicateConstruction() { return "Invalid argument: Controls may only be instantiated one time for each DOM element"; }
};

var EventNames = {
    beforeOpen: "beforeopen",
    afterOpen: "afteropen",
    beforeClose: "beforeclose",
    afterClose: "afterclose"
};

var ClosedDisplayMode = {
    /// <field locid="WinJS.UI._CommandingSurface.ClosedDisplayMode.none" helpKeyword="WinJS.UI._CommandingSurface.ClosedDisplayMode.none">
    /// When the _CommandingSurface is closed, the actionarea is not visible and doesn't take up any space.
    /// </field>
    none: "none",
    /// <field locid="WinJS.UI._CommandingSurface.ClosedDisplayMode.minimal" helpKeyword="WinJS.UI._CommandingSurface.ClosedDisplayMode.minimal">
    /// When the _CommandingSurface is closed, the height of the actionarea is reduced to the minimal height required to display only the actionarea overflowbutton. All other content in the actionarea is not displayed.
    /// </field>
    minimal: "minimal",
    /// <field locid="WinJS.UI._CommandingSurface.ClosedDisplayMode.compact" helpKeyword="WinJS.UI._CommandingSurface.ClosedDisplayMode.compact">
    /// When the _CommandingSurface is closed, the height of the actionarea is reduced such that button commands are still visible, but their labels are hidden.
    /// </field>
    compact: "compact",
    /// <field locid="WinJS.UI._CommandingSurface.ClosedDisplayMode.full" helpKeyword="WinJS.UI._CommandingSurface.ClosedDisplayMode.full">
    /// When the _CommandingSurface is closed, the height of the actionarea is always sized to content and does not change between opened and closed states.
    /// </field>
    full: "full",
};

var closedDisplayModeClassMap = {};
closedDisplayModeClassMap[ClosedDisplayMode.none] = "win-commandingsurface-closeddisplaynone";
closedDisplayModeClassMap[ClosedDisplayMode.minimal] = "win-commandingsurface-closeddisplayminimal";
closedDisplayModeClassMap[ClosedDisplayMode.compact] = "win-commandingsurface-closeddisplaycompact";
closedDisplayModeClassMap[ClosedDisplayMode.full] = "win-commandingsurface-closeddisplayfull";

// Versions of add/removeClass that are no ops when called with falsy class names.
function addClass(element: HTMLElement, className: string): void {
    className && _ElementUtilities.addClass(element, className);
}
function removeClass(element: HTMLElement, className: string): void {
    className && _ElementUtilities.removeClass(element, className);
}

function diffElements(lhs: Array<HTMLElement>, rhs: Array<HTMLElement>): Array<HTMLElement> {
    // Subtract array rhs from array lhs.
    // Returns a new Array containing the subset of elements in lhs that are not also in rhs.
    return lhs.filter((commandElement) => { return rhs.indexOf(commandElement) < 0 })
}

/// <field>
/// <summary locid="WinJS.UI._CommandingSurface">
/// Represents an apaptive commandingSurface for displaying commands.
/// </summary>
/// </field>
/// <htmlSnippet supportsContent="true"><![CDATA[<div data-win-control="WinJS.UI._CommandingSurface">
/// <button data-win-control="WinJS.UI.Command" data-win-options="{id:'',label:'example',icon:'back',type:'button',onclick:null,section:'primary'}"></button>
/// </div>]]></htmlSnippet>
/// <part name="commandingSurface" class="win-commandingSurface" locid="WinJS.UI._CommandingSurface_part:commandingSurface">The entire CommandingSurface control.</part>
/// <part name="commandingSurface-overflowbutton" class="win-commandingSurface-overflowbutton" locid="WinJS.UI._CommandingSurface_part:CommandingSurface-overflowbutton">The commandingSurface overflow button.</part>
/// <part name="commandingSurface-overflowarea" class="win-commandingsurface-overflowarea" locid="WinJS.UI._CommandingSurface_part:CommandingSurface-overflowarea">The container for commands that overflow.</part>
/// <resource type="javascript" src="//$(TARGET_DESTINATION)/js/WinJS.js" shared="true" />
/// <resource type="css" src="//$(TARGET_DESTINATION)/css/ui-dark.css" shared="true" />
export class _CommandingSurface {
    private _id: string;
    private _disposed: boolean;
    private _separatorWidth: number;
    private _standardCommandWidth: number;
    private _contentCommandWidths: { [uniqueID: string]: number };
    private _overflowButtonWidth: number;
    private _data: BindingList.List<_Command.ICommand>;
    private _closedDisplayMode: string;
    private _primaryCommands: _Command.ICommand[];
    private _secondaryCommands: _Command.ICommand[];
    private _contentFlyoutInterior: HTMLElement;
    private _contentFlyout: _Flyout.Flyout;
    private _chosenCommand: _Command.ICommand;
    private _measured = false;
    private _initializingState = true;
    private _hoverable = _Hoverable.isHoverable; /* force dependency on hoverable module */
    private _winKeyboard: _KeyboardBehavior._WinKeyboard;
    private _refreshPending: boolean;
    private _refreshBound: Function;
    private _resizeHandlerBound: (ev: any) => any;
    private _dataChangedEvents = ["itemchanged", "iteminserted", "itemmoved", "itemremoved", "reload"];
    private _machine: _ShowHideMachine.ShowHideMachine;
    private _rtl = false;

    // Dom elements
    private _dom: {
        root: HTMLElement;
        actionArea: HTMLElement;
        spacer: HTMLDivElement;
        overflowButton: HTMLButtonElement;
        overflowArea: HTMLElement;
    };

    /// <field locid="WinJS.UI._CommandingSurface.ClosedDisplayMode" helpKeyword="WinJS.UI._CommandingSurface.ClosedDisplayMode">
    /// Display options for the actionarea when the _CommandingSurface is closed.
    /// </field>
    static ClosedDisplayMode = ClosedDisplayMode;

    static supportedForProcessing: boolean = true;

    /// <field type="HTMLElement" domElement="true" hidden="true" locid="WinJS.UI._CommandingSurface.element" helpKeyword="WinJS.UI._CommandingSurface.element">
    /// Gets the DOM element that hosts the CommandingSurface.
    /// </field>
    get element() {
        return this._dom.root;
    }

    /// <field type="WinJS.Binding.List" locid="WinJS.UI._CommandingSurface.data" helpKeyword="WinJS.UI._CommandingSurface.data">
    /// Gets or sets the Binding List of WinJS.UI.Command for the CommandingSurface.
    /// </field>
    get data() {
        return this._data;
    }
    set data(value: BindingList.List<_Command.ICommand>) {
        this._writeProfilerMark("set_data,info");

        if (value === this.data) {
            return;
        }
        if (!(value instanceof BindingList.List)) {
            throw new _ErrorFromName("WinJS.UI._CommandingSurface.BadData", strings.badData);
        }

        if (this._data) {
            this._removeDataListeners();
        }
        this._data = value;
        this._addDataListeners();
        this._dataUpdated();
    }

    /// <field type="String" locid="WinJS.UI._CommandingSurface.closedDisplayMode" helpKeyword="WinJS.UI._CommandingSurface.closedDisplayMode">
    /// Gets or sets the closedDisplayMode for the CommandingSurface.
    /// </field>
    get closedDisplayMode() {
        return this._closedDisplayMode;
    }
    set closedDisplayMode(value: string) {
        this._writeProfilerMark("set_closedDisplayMode,info");

        var isChangingState = (value !== this._closedDisplayMode);
        if (ClosedDisplayMode[value] && isChangingState) {
            this._closedDisplayMode = value;
            this._machine.updateDom();
        }
    }

    constructor(element?: HTMLElement, options: any = {}) {
        /// <signature helpKeyword="WinJS.UI._CommandingSurface._CommandingSurface">
        /// <summary locid="WinJS.UI._CommandingSurface.constructor">
        /// Creates a new CommandingSurface control.
        /// </summary>
        /// <param name="element" type="HTMLElement" domElement="true" locid="WinJS.UI._CommandingSurface.constructor_p:element">
        /// The DOM element that will host the control.
        /// </param>
        /// <param name="options" type="Object" locid="WinJS.UI._CommandingSurface.constructor_p:options">
        /// The set of properties and values to apply to the new CommandingSurface control.
        /// </param>
        /// <returns type="WinJS.UI._CommandingSurface" locid="WinJS.UI._CommandingSurface.constructor_returnValue">
        /// The new CommandingSurface control.
        /// </returns>
        /// </signature>

        this._writeProfilerMark("constructor,StartTM");

        // Check to make sure we weren't duplicated
        if (element && element["winControl"]) {
            throw new _ErrorFromName("WinJS.UI._CommandingSurface.DuplicateConstruction", strings.duplicateConstruction);
        }

        this._initializeDom(element || _Global.document.createElement("div"));
        this._machine = new _ShowHideMachine.ShowHideMachine({
            eventElement: this._dom.root,
            onShow: () => {
                //this._cachedHiddenPaneThickness = null;
                //var hiddenPaneThickness = this._getHiddenPaneThickness();

                //this._isShownMode = true;
                //this._updateDomImpl();

                //return this._playShowAnimation(hiddenPaneThickness);
                return Promise.wrap();
            },
            onHide: () => {
                //return this._playHideAnimation(this._getHiddenPaneThickness()).then(() => {
                //    this._isShownMode = false;
                //    this._updateDomImpl();
                //});

                return Promise.wrap();
            },
            onUpdateDom: () => {
                this._updateDomImpl();
            },
            onUpdateDomWithIsShown: (isShown: boolean) => {
                //this._isShownMode = isShown;
                this._updateDomImpl();
            }
        });

        // Initialize private state.
        this._contentCommandWidths = {};
        this._separatorWidth = 0;
        this._standardCommandWidth = 0;
        this._disposed = false;
        this._primaryCommands = [];
        this._secondaryCommands = [];
        this._refreshBound = this._refresh.bind(this);
        this._resizeHandlerBound = this._resizeHandler.bind(this);
        this._winKeyboard = new _KeyboardBehavior._WinKeyboard(this._dom.root);

        // Initialize public properties.
        this.closedDisplayMode = _Constants.defaultClosedDisplayMode;
        if (!options.data) {
            // Shallow copy object so we can modify it.
            options = _BaseUtils._shallowCopy(options);

            // Set default data
            options.data = options.data || this._getDataFromDOMElements();
        }
        _Control.setOptions(this, options);

        // Event handlers
        _ElementUtilities._resizeNotifier.subscribe(this._dom.root, this._resizeHandlerBound);
        this._dom.root.addEventListener('keydown', this._keyDownHandler.bind(this));

        // Exit the Init state.
        _ElementUtilities._inDom(this._dom.root).then(() => {
            this._measureCommands();
            this._positionCommands();
            this._rtl = _Global.getComputedStyle(this._dom.root).direction === 'rtl';
            this._initializingState = false;
            this._machine.initialized();
            this._writeProfilerMark("constructor,StopTM");
        });
    }

    dispose(): void {
        /// <signature helpKeyword="WinJS.UI._CommandingSurface.dispose">
        /// <summary locid="WinJS.UI._CommandingSurface.dispose">
        /// Disposes this CommandingSurface.
        /// </summary>
        /// </signature>
        if (this._disposed) {
            return;
        }

        this._disposed = true;
        this._machine.dispose();

        _ElementUtilities._resizeNotifier.unsubscribe(this._dom.root, this._resizeHandlerBound);

        if (this._contentFlyout) {
            this._contentFlyout.dispose();
            this._contentFlyout.element.parentNode.removeChild(this._contentFlyout.element);
        }

        _Dispose.disposeSubTree(this.element);
    }

    forceLayout(): void {
        /// <signature helpKeyword="WinJS.UI._CommandingSurface.forceLayout">
        /// <summary locid="WinJS.UI._CommandingSurface.forceLayout">
        /// Forces the CommandingSurface to update its layout. Use this function when the window did not change size, but the container of the CommandingSurface changed size.
        /// </summary>
        /// </signature>
        this._measureCommands();
        this._positionCommands();
    }

    private _writeProfilerMark(text: string) {
        _WriteProfilerMark("WinJS.UI._CommandingSurface:" + this._id + ":" + text);
    }

    private _initializeDom(root: HTMLElement): void {

        this._writeProfilerMark("_intializeDom,info");

        // Attaching JS control to DOM element
        root["winControl"] = this;

        this._id = root.id || _ElementUtilities._uniqueID(root);

        if (!root.hasAttribute("tabIndex")) {
            root.tabIndex = -1;
        }

        _ElementUtilities.addClass(root, _Constants.controlCssClass);
        _ElementUtilities.addClass(root, "win-disposable");

        // Make sure we have an ARIA role
        var role = root.getAttribute("role");
        if (!role) {
            root.setAttribute("role", "menubar");
        }

        var label = root.getAttribute("aria-label");
        if (!label) {
            root.setAttribute("aria-label", strings.ariaLabel);
        }

        var actionArea = _Global.document.createElement("div");
        _ElementUtilities.addClass(actionArea, _Constants.actionAreaCssClass);
        _ElementUtilities._reparentChildren(root, actionArea);
        root.appendChild(actionArea);

        var spacer = _Global.document.createElement("div");
        _ElementUtilities.addClass(spacer, _Constants.spacerCssClass);
        actionArea.appendChild(spacer);

        var overflowButton = _Global.document.createElement("button");
        overflowButton.tabIndex = 0;
        overflowButton.innerHTML = "<span class='" + _Constants.ellipsisCssClass + "'></span>";
        _ElementUtilities.addClass(overflowButton, _Constants.overflowButtonCssClass);
        actionArea.appendChild(overflowButton);
        overflowButton.addEventListener("click", () => {
            overflowArea.style.display = (overflowArea.style.display === "none") ? "block" : "none";
        });
        this._overflowButtonWidth = _ElementUtilities.getTotalWidth(overflowButton);

        var overflowArea = _Global.document.createElement("div");
        overflowArea.style.display = "none";
        _ElementUtilities.addClass(overflowArea, _Constants.overflowAreaCssClass);
        _ElementUtilities.addClass(overflowArea, _Constants.menuCssClass);
        root.appendChild(overflowArea);

        this._dom = {
            root: root,
            actionArea: actionArea,
            spacer: spacer,
            overflowButton: overflowButton,
            overflowArea: overflowArea,
        };
    }


    // State private to _updateDomImpl. No other method should make use of it.
    //
    // Nothing has been rendered yet so these are all initialized to undefined. Because
    // they are undefined, the first time _updateDomImpl is called, they will all be
    // rendered.
    private _updateDomImpl_rendered = {
        closedDisplayMode: <string>undefined,
    };
    private _updateDomImpl(): void {
        var rendered = this._updateDomImpl_rendered;

        if (rendered.closedDisplayMode !== this.closedDisplayMode) {
            removeClass(this._dom.root, closedDisplayModeClassMap[rendered.closedDisplayMode]);
            addClass(this._dom.root, closedDisplayModeClassMap[this.closedDisplayMode]);
            rendered.closedDisplayMode = this.closedDisplayMode;
        }
    }

    private _getFocusableElementsInfo(): IFocusableElementsInfo {
        var focusableCommandsInfo: IFocusableElementsInfo = {
            elements: [],
            focusedIndex: -1
        };
        var elementsInReach = Array.prototype.slice.call(this._dom.actionArea.children);

        var elementsInReach = Array.prototype.slice.call(this._dom.actionArea.children);
        if (this._dom.overflowArea.style.display !== "none") {
            elementsInReach = elementsInReach.concat(Array.prototype.slice.call(this._dom.overflowArea.children));
        }

        elementsInReach.forEach((element: HTMLElement) => {
            if (this._isElementFocusable(element)) {
                focusableCommandsInfo.elements.push(element);
                if (element.contains(<HTMLElement>_Global.document.activeElement)) {
                    focusableCommandsInfo.focusedIndex = focusableCommandsInfo.elements.length - 1;
                }
            }
        });

        return focusableCommandsInfo;
    }

    private _dataUpdated() {
        this._writeProfilerMark("_dataUpdated,info");

        var changeInfo = this._getDataChangeInfo();

        // Take a snapshot of the current state
        var updateCommandAnimation = Animations._createUpdateListAnimation(changeInfo.added, changeInfo.deleted, changeInfo.affected);

        // Remove current elements
        changeInfo.currentElements.forEach((element) => {
            if (element.parentElement) {
                element.parentElement.removeChild(element);
            }
        });

        // Add new elements in the right order.
        changeInfo.newElements.forEach((element) => {
            this._dom.actionArea.appendChild(element);
        });

        if (this._dom.overflowButton) {
            // Ensure that the overflow button is the last element in the actionarea
            this._dom.actionArea.appendChild(this._dom.overflowButton);
        }

        this._primaryCommands = [];
        this._secondaryCommands = [];

        if (this.data.length > 0) {
            _ElementUtilities.removeClass(this.element, _Constants.emptyCommandingSurfaceCssClass);
            this.data.forEach((command) => {
                if (command.section === "secondary") {
                    this._secondaryCommands.push(command);
                } else {
                    this._primaryCommands.push(command);
                }
            });

            if (!this._initializingState) {
                this._measureCommands();
                this._positionCommands();
            }
        } else {
            this._setupOverflowArea([]);
            _ElementUtilities.addClass(this.element, _Constants.emptyCommandingSurfaceCssClass);
        }

        // Execute the animation.
        updateCommandAnimation.execute();
    }

    private _getDataChangeInfo(): IDataChangeInfo {
        var i = 0, len = 0;
        var added: HTMLElement[] = [];
        var deleted: HTMLElement[] = [];
        var affected: HTMLElement[] = [];
        var currentShown: HTMLElement[] = [];
        var currentElements: HTMLElement[] = [];
        var newShown: HTMLElement[] = [];
        var newHidden: HTMLElement[] = [];
        var newElements: HTMLElement[] = [];

        Array.prototype.forEach.call(this._dom.actionArea.querySelectorAll(".win-command"), (commandElement: HTMLElement) => {
            if (commandElement.style.display !== "none") {
                currentShown.push(commandElement);
            }
            currentElements.push(commandElement);
        });

        this.data.forEach((command) => {
            if (command.element.style.display !== "none") {
                newShown.push(command.element);
            } else {
                newHidden.push(command.element);
            }
            newElements.push(command.element);
        });

        deleted = diffElements(currentShown, newShown);
        affected = diffElements(currentShown, deleted);
        // "added" must also include the elements from "newHidden" to ensure that we continue 
        // to animate any command elements that have underflowed back into the actionarea 
        // as a part of this data change.
        added = diffElements(newShown, currentShown).concat(newHidden);

        return {
            newElements: newElements,
            currentElements: currentElements,
            added: added,
            deleted: deleted,
            affected: affected,
        };
    }

    private _refresh() {
        if (!this._refreshPending) {
            this._refreshPending = true;

            // Batch calls to _dataUpdated
            Scheduler.schedule(() => {
                if (this._refreshPending && !this._disposed) {
                    this._dataUpdated();
                    this._refreshPending = false;
                }
            }, Scheduler.Priority.high, null, "WinJS.UI._CommandingSurface._refresh");
        }
    }

    private _addDataListeners() {
        this._dataChangedEvents.forEach((eventName) => {
            this._data.addEventListener(eventName, this._refreshBound, false);
        });
    }

    private _removeDataListeners() {
        this._dataChangedEvents.forEach((eventName) => {
            this._data.removeEventListener(eventName, this._refreshBound, false);
        });
    }

    private _isElementFocusable(element: HTMLElement): boolean {
        var focusable = false;
        if (element) {
            var command = element["winControl"];
            if (command) {
                focusable = command.element.style.display !== "none" &&
                command.type !== _Constants.typeSeparator &&
                !command.hidden &&
                !command.disabled &&
                (!command.firstElementFocus || command.firstElementFocus.tabIndex >= 0 || command.lastElementFocus.tabIndex >= 0);
            } else {
                // e.g. the overflow button
                focusable = element.style.display !== "none" &&
                getComputedStyle(element).visibility !== "hidden" &&
                element.tabIndex >= 0;
            }
        }
        return focusable;
    }

    private _isCommandInActionArea(element: HTMLElement) {
        // Returns true if the element is a command in the actionarea, false otherwise
        return element && element["winControl"] && element.parentElement === this._dom.actionArea;
    }

    private _getLastElementFocus(element: HTMLElement) {
        if (this._isCommandInActionArea(element)) {
            // Only commands in the actionarea support lastElementFocus
            return element["winControl"].lastElementFocus;
        } else {
            return element;
        }
    }

    private _getFirstElementFocus(element: HTMLElement) {
        if (this._isCommandInActionArea(element)) {
            // Only commands in the actionarea support firstElementFocus
            return element["winControl"].firstElementFocus;
        } else {
            return element;
        }
    }

    private _keyDownHandler(ev: any) {
        if (!ev.altKey) {
            if (_ElementUtilities._matchesSelector(ev.target, ".win-interactive, .win-interactive *")) {
                return;
            }
            var Key = _ElementUtilities.Key;
            var focusableElementsInfo = this._getFocusableElementsInfo();
            var targetCommand: HTMLElement;

            if (focusableElementsInfo.elements.length) {
                switch (ev.keyCode) {
                    case (this._rtl ? Key.rightArrow : Key.leftArrow):
                    case Key.upArrow:
                        var index = Math.max(0, focusableElementsInfo.focusedIndex - 1);
                        targetCommand = this._getLastElementFocus(focusableElementsInfo.elements[index % focusableElementsInfo.elements.length]);
                        break;

                    case (this._rtl ? Key.leftArrow : Key.rightArrow):
                    case Key.downArrow:
                        var index = Math.min(focusableElementsInfo.focusedIndex + 1, focusableElementsInfo.elements.length - 1);
                        targetCommand = this._getFirstElementFocus(focusableElementsInfo.elements[index]);
                        break;

                    case Key.home:
                        var index = 0;
                        targetCommand = this._getFirstElementFocus(focusableElementsInfo.elements[index]);
                        break;

                    case Key.end:
                        var index = focusableElementsInfo.elements.length - 1;
                        targetCommand = this._getLastElementFocus(focusableElementsInfo.elements[index]);
                        break;
                }
            }

            if (targetCommand && targetCommand !== _Global.document.activeElement) {
                targetCommand.focus();
                ev.preventDefault();
            }
        }
    }

    private _getDataFromDOMElements(): BindingList.List<_Command.ICommand> {
        this._writeProfilerMark("_getDataFromDOMElements,info");

        ControlProcessor.processAll(this._dom.actionArea, /*skip root*/ true);

        var commands: _Command.ICommand[] = [];
        var childrenLength = this._dom.actionArea.children.length;
        var child: Element;
        for (var i = 0; i < childrenLength; i++) {
            child = this._dom.actionArea.children[i];
            if (child["winControl"] && child["winControl"] instanceof _Command.AppBarCommand) {
                commands.push(child["winControl"]);
            } else if (!this._dom.overflowButton) {
                throw new _ErrorFromName("WinJS.UI._CommandingSurface.MustContainCommands", strings.mustContainCommands);
            }
        }
        return new BindingList.List(commands);
    }

    private _resizeHandler() {
        if (this.element.offsetWidth > 0) {
            this._measureCommands(/* skipIfMeasured: */ true);
            this._positionCommands();
        }
    }

    private _commandUniqueId(command: _Command.ICommand): string {
        return _ElementUtilities._uniqueID(command.element);
    }

    private _getCommandsInfo(): ICommandInfo[] {
        var width = 0;
        var commands: ICommandInfo[] = [];
        var priority = 0;
        var currentAssignedPriority = 0;

        for (var i = this._primaryCommands.length - 1; i >= 0; i--) {
            var command = this._primaryCommands[i];
            if (command.priority === undefined) {
                priority = currentAssignedPriority--;
            } else {
                priority = command.priority;
            }
            width = (command.element.style.display === "none" ? 0 : this._getCommandWidth(command));

            commands.unshift({
                command: command,
                width: width,
                priority: priority
            });
        }

        return commands;
    }

    private _getPrimaryCommandsLocation(actionAreaWidth: number) {
        this._writeProfilerMark("_getCommandsLocation,info");

        var actionAreaCommands: _Command.ICommand[] = [];
        var overflowAreaCommands: _Command.ICommand[] = [];
        var spaceLeft = actionAreaWidth;
        var overflowButtonSpace = 0;
        var hasSecondaryCommands = this._secondaryCommands.length > 0;

        var commandsInfo = this._getCommandsInfo();
        var sortedCommandsInfo = commandsInfo.slice(0).sort((commandInfo1: ICommandInfo, commandInfo2: ICommandInfo) => {
            return commandInfo1.priority - commandInfo2.priority;
        });

        var maxPriority = Number.MAX_VALUE;
        var availableWidth = actionAreaWidth;

        for (var i = 0, len = sortedCommandsInfo.length; i < len; i++) {
            availableWidth -= sortedCommandsInfo[i].width;

            // The overflow button needs space if there are secondary commands, or we are not evaluating the last command.
            overflowButtonSpace = (hasSecondaryCommands || (i < len - 1) ? this._overflowButtonWidth : 0)

            if (availableWidth - overflowButtonSpace < 0) {
                maxPriority = sortedCommandsInfo[i].priority - 1;
                break;
            }
        }

        commandsInfo.forEach((commandInfo) => {
            if (commandInfo.priority <= maxPriority) {
                actionAreaCommands.push(commandInfo.command);
            } else {
                overflowAreaCommands.push(commandInfo.command);
            }
        });

        return {
            actionArea: actionAreaCommands,
            overflowArea: overflowAreaCommands
        }
    }

    private _getCommandWidth(command: _Command.ICommand): number {
        if (command.type === _Constants.typeContent) {
            return this._contentCommandWidths[this._commandUniqueId(command)];
        } else if (command.type === _Constants.typeSeparator) {
            return this._separatorWidth;
        } else {
            return this._standardCommandWidth;
        }
    }

    private _measureCommands(skipIfMeasured: boolean = false) {
        this._writeProfilerMark("_measureCommands,info");

        if (this._disposed || !_Global.document.body.contains(this._dom.root) || this.element.offsetWidth === 0) {
            return;
        }

        if (!skipIfMeasured) {
            this._contentCommandWidths = {};
            this._separatorWidth = 0;
            this._standardCommandWidth = 0;
        }
        this._primaryCommands.forEach((command) => {
            if (!command.element.parentElement) {
                this._dom.actionArea.appendChild(command.element);
            }

            // Ensure that the element we are measuring does not have display: none (e.g. it was just added, and it
            // will be animated in)
            var originalDisplayStyle = command.element.style.display;
            command.element.style.display = "";

            if (command.type === _Constants.typeContent && !this._contentCommandWidths[this._commandUniqueId(command)]) {
                this._contentCommandWidths[this._commandUniqueId(command)] = _ElementUtilities.getTotalWidth(command.element);
            } else if (command.type === _Constants.typeSeparator) {
                if (!this._separatorWidth) {
                    this._separatorWidth = _ElementUtilities.getTotalWidth(command.element);
                }
            } else {
                // Button, toggle, flyout command types have the same width
                if (!this._standardCommandWidth) {
                    this._standardCommandWidth = _ElementUtilities.getTotalWidth(command.element);
                }
            }

            // Restore the original display style
            command.element.style.display = originalDisplayStyle;
        });

        if (this._dom.overflowButton && !this._overflowButtonWidth) {
            this._overflowButtonWidth = _ElementUtilities.getTotalWidth(this._dom.overflowButton);
        }

        this._measured = true;
    }

    private _positionCommands() {
        this._writeProfilerMark("_positionCommands,StartTM");

        if (this._disposed || !this._measured) {
            this._writeProfilerMark("_positionCommands,StopTM");
            return;
        }

        if (this._dom.overflowButton) {
            // Ensure that the overflow button is the last element in the actionarea
            this._dom.actionArea.appendChild(this._dom.overflowButton);
        }

        this._primaryCommands.forEach((command) => {
            command.element.style.display = (command.hidden ? "none" : "");
        })

        var actionAreaWidth = _ElementUtilities.getContentWidth(this.element);

        var commandsLocation = this._getPrimaryCommandsLocation(actionAreaWidth);

        this._hideSeparatorsIfNeeded(commandsLocation.actionArea);

        // Primary commands that will be mirrored in the overflowarea should be hidden so
        // that they are not visible in the actionarea.
        commandsLocation.overflowArea.forEach((command) => {
            command.element.style.display = "none";
        });

        // The secondary commands in the the actionarea should be hidden since they are always
        // mirrored as new elements in the overflowarea.
        this._secondaryCommands.forEach((command) => {
            command.element.style.display = "none";
        });

        this._setupOverflowArea(commandsLocation.overflowArea);

        this._writeProfilerMark("_positionCommands,StopTM");
    }

    private _getMenuCommand(command: _Command.ICommand): _MenuCommand.MenuCommand {
        var menuCommand = new _CommandingSurfaceMenuCommand._MenuCommand(null, {
            label: command.label,
            type: (command.type === _Constants.typeContent ? _Constants.typeFlyout : command.type) || _Constants.typeButton,
            disabled: command.disabled,
            flyout: command.flyout,
            beforeInvoke: () => {
                // Save the command that was selected
                this._chosenCommand = <_Command.ICommand>(menuCommand["_originalCommandingSurfaceCommand"]);

                // If this WinJS.UI.MenuCommand has type: toggle, we should also toggle the value of the original WinJS.UI.Command
                if (this._chosenCommand.type === _Constants.typeToggle) {
                    this._chosenCommand.selected = !this._chosenCommand.selected;
                }
            }
        });

        if (command.selected) {
            menuCommand.selected = true;
        }

        if (command.extraClass) {
            menuCommand.extraClass = command.extraClass;
        }

        if (command.type === _Constants.typeContent) {
            if (!menuCommand.label) {
                menuCommand.label = _Constants.contentMenuCommandDefaultLabel;
            }
            menuCommand.flyout = this._contentFlyout;
        } else {
            menuCommand.onclick = command.onclick;
        }
        menuCommand["_originalCommandingSurfaceCommand"] = command;
        return menuCommand;
    }

    private _setupOverflowArea(additionalCommands: _Command.AppBarCommand[]) {
        this._writeProfilerMark("_setupOverflowArea,info");

        // Set up custom flyout for "content" typed commands in the overflowarea. 
        var isCustomContent = (command: _Command.ICommand) => { return command.type === _Constants.typeContent };
        var hasCustomContent = additionalCommands.some(isCustomContent) || this._secondaryCommands.some(isCustomContent);

        if (hasCustomContent && !this._contentFlyout) {
            this._contentFlyoutInterior = _Global.document.createElement("div");
            _ElementUtilities.addClass(this._contentFlyoutInterior, _Constants.overflowContentFlyoutCssClass);
            this._contentFlyout = new _Flyout.Flyout();
            this._contentFlyout.element.appendChild(this._contentFlyoutInterior);
            _Global.document.body.appendChild(this._contentFlyout.element);
            this._contentFlyout.onbeforeshow = () => {
                _ElementUtilities.empty(this._contentFlyoutInterior);
                _ElementUtilities._reparentChildren(this._chosenCommand.element, this._contentFlyoutInterior);

            };
            this._contentFlyout.onafterhide = () => {
                _ElementUtilities._reparentChildren(this._contentFlyoutInterior, this._chosenCommand.element);
            };
        }

        var showOverflowButton = (additionalCommands.length > 0 || this._secondaryCommands.length > 0);
        this._dom.overflowButton.style.display = showOverflowButton ? "" : "none";


        // Populate the overflowArea with MenuCommands
        _ElementUtilities.empty(this._dom.overflowArea);
        var hasToggleCommands = false,
            hasFlyoutCommands = false,
            menuCommands: _MenuCommand.MenuCommand[] = [];

        // Add primary commands that have overflowed. 
        additionalCommands.forEach((command) => {
            if (command.type === _Constants.typeToggle) {
                hasToggleCommands = true;
            }

            if (command.type === _Constants.typeFlyout) {
                hasFlyoutCommands = true;
            }

            menuCommands.push(this._getMenuCommand(command));
        });

        // Add separator between primary and secondary command if applicable 
        var secondaryCommandsLength = this._secondaryCommands.length;
        if (additionalCommands.length > 0 && secondaryCommandsLength > 0) {
            var separator = new _CommandingSurfaceMenuCommand._MenuCommand(null, {
                type: _Constants.typeSeparator
            });

            menuCommands.push(separator);
        }

        // Add secondary commands 
        this._secondaryCommands.forEach((command) => {
            if (!command.hidden) {
                if (command.type === _Constants.typeToggle) {
                    hasToggleCommands = true;
                }

                if (command.type === _Constants.typeFlyout) {
                    hasFlyoutCommands = true;
                }

                menuCommands.push(this._getMenuCommand(command));
            }
        });

        this._hideSeparatorsIfNeeded(menuCommands);
        menuCommands.forEach((command) => {
            this._dom.overflowArea.appendChild(command.element);
        })

        _ElementUtilities[hasToggleCommands ? "addClass" : "removeClass"](this._dom.overflowArea, _Constants.menuContainsToggleCommandClass);
        _ElementUtilities[hasFlyoutCommands ? "addClass" : "removeClass"](this._dom.overflowArea, _Constants.menuContainsFlyoutCommandClass);
    }

    private _hideSeparatorsIfNeeded(commands: ICommandWithType[]): void {
        var prevType = _Constants.typeSeparator;
        var command: ICommandWithType;

        // Hide all leading or consecutive separators
        var commandsLength = commands.length;
        commands.forEach((command) => {
            if (command.type === _Constants.typeSeparator &&
                prevType === _Constants.typeSeparator) {
                command.element.style.display = "none";
            }
            prevType = command.type;
        });

        // Hide trailing separators
        for (var i = commandsLength - 1; i >= 0; i--) {
            command = commands[i];
            if (command.type === _Constants.typeSeparator) {
                command.element.style.display = "none";
            } else {
                break;
            }
        }
    }
}

// addEventListener, removeEventListener, dispatchEvent
_Base.Class.mix(_CommandingSurface, _Control.DOMEventMixin);

class _ActionArea {

    constructor(element?: HTMLElement, options: any = {}) { }


}
