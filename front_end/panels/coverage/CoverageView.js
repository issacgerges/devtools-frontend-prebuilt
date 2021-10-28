// Copyright (c) 2016 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as Common from '../../core/common/common.js';
import * as Host from '../../core/host/host.js';
import * as i18n from '../../core/i18n/i18n.js';
import * as Platform from '../../core/platform/platform.js';
import * as SDK from '../../core/sdk/sdk.js';
import * as Bindings from '../../models/bindings/bindings.js';
import * as SourceFrame from '../../ui/legacy/components/source_frame/source_frame.js';
import * as UI from '../../ui/legacy/legacy.js';
import coverageViewStyles from './coverageView.css.js';
import { CoverageDecorationManager, decoratorType } from './CoverageDecorationManager.js';
import { CoverageListView } from './CoverageListView.js';
import { CoverageModel, Events } from './CoverageModel.js';
const UIStrings = {
    /**
    *@description Tooltip in Coverage List View of the Coverage tab for selecting JavaScript coverage mode
    */
    chooseCoverageGranularityPer: 'Choose coverage granularity: Per function has low overhead, per block has significant overhead.',
    /**
    *@description Text in Coverage List View of the Coverage tab
    */
    perFunction: 'Per function',
    /**
    *@description Text in Coverage List View of the Coverage tab
    */
    perBlock: 'Per block',
    /**
    *@description Text to clear everything
    */
    clearAll: 'Clear all',
    /**
    *@description Tooltip text that appears when hovering over the largeicon download button in the Coverage View of the Coverage tab
    */
    export: 'Export...',
    /**
    *@description Text in Coverage View of the Coverage tab
    */
    urlFilter: 'URL filter',
    /**
    *@description Label for the type filter in the Converage Panel
    */
    filterCoverageByType: 'Filter coverage by type',
    /**
    *@description Text for everything
    */
    all: 'All',
    /**
    *@description Text that appears on a button for the css resource type filter.
    */
    css: 'CSS',
    /**
    *@description Text in Timeline Tree View of the Performance panel
    */
    javascript: 'JavaScript',
    /**
    *@description Tooltip text that appears on the setting when hovering over it in Coverage View of the Coverage tab
    */
    includeExtensionContentScripts: 'Include extension content scripts',
    /**
    *@description Title for a type of source files
    */
    contentScripts: 'Content scripts',
    /**
    *@description Message in Coverage View of the Coverage tab
    *@example {record button icon} PH1
    */
    clickTheReloadButtonSToReloadAnd: 'Click the reload button {PH1} to reload and start capturing coverage.',
    /**
    *@description Message in Coverage View of the Coverage tab
    *@example {record button icon} PH1
    */
    clickTheRecordButtonSToStart: 'Click the record button {PH1} to start capturing coverage.',
    /**
    *@description Footer message in Coverage View of the Coverage tab
    *@example {300k used, 600k unused} PH1
    *@example {500k used, 800k unused} PH2
    */
    filteredSTotalS: 'Filtered: {PH1}  Total: {PH2}',
    /**
    *@description Footer message in Coverage View of the Coverage tab
    *@example {1.5 MB} PH1
    *@example {2.1 MB} PH2
    *@example {71%} PH3
    *@example {29%} PH4
    */
    sOfSSUsedSoFarSUnused: '{PH1} of {PH2} ({PH3}%) used so far, {PH4} unused.',
};
const str_ = i18n.i18n.registerUIStrings('panels/coverage/CoverageView.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);
let coverageViewInstance;
export class CoverageView extends UI.Widget.VBox {
    model;
    decorationManager;
    resourceTreeModel;
    coverageTypeComboBox;
    coverageTypeComboBoxSetting;
    toggleRecordAction;
    toggleRecordButton;
    inlineReloadButton;
    startWithReloadButton;
    clearButton;
    saveButton;
    textFilterRegExp;
    filterInput;
    typeFilterValue;
    filterByTypeComboBox;
    showContentScriptsSetting;
    contentScriptsCheckbox;
    coverageResultsElement;
    landingPage;
    listView;
    statusToolbarElement;
    statusMessageElement;
    constructor() {
        super(true);
        this.model = null;
        this.decorationManager = null;
        this.resourceTreeModel = null;
        const toolbarContainer = this.contentElement.createChild('div', 'coverage-toolbar-container');
        const toolbar = new UI.Toolbar.Toolbar('coverage-toolbar', toolbarContainer);
        toolbar.makeWrappable(true);
        this.coverageTypeComboBox = new UI.Toolbar.ToolbarComboBox(this.onCoverageTypeComboBoxSelectionChanged.bind(this), i18nString(UIStrings.chooseCoverageGranularityPer));
        const coverageTypes = [
            {
                label: i18nString(UIStrings.perFunction),
                value: 2 /* JavaScript */ | 4 /* JavaScriptPerFunction */,
            },
            {
                label: i18nString(UIStrings.perBlock),
                value: 2 /* JavaScript */,
            },
        ];
        for (const type of coverageTypes) {
            this.coverageTypeComboBox.addOption(this.coverageTypeComboBox.createOption(type.label, `${type.value}`));
        }
        this.coverageTypeComboBoxSetting = Common.Settings.Settings.instance().createSetting('coverageViewCoverageType', 0);
        this.coverageTypeComboBox.setSelectedIndex(this.coverageTypeComboBoxSetting.get());
        this.coverageTypeComboBox.setEnabled(true);
        toolbar.appendToolbarItem(this.coverageTypeComboBox);
        this.toggleRecordAction =
            UI.ActionRegistry.ActionRegistry.instance().action('coverage.toggle-recording');
        this.toggleRecordButton = UI.Toolbar.Toolbar.createActionButton(this.toggleRecordAction);
        toolbar.appendToolbarItem(this.toggleRecordButton);
        const mainTarget = SDK.TargetManager.TargetManager.instance().mainTarget();
        const mainTargetSupportsRecordOnReload = mainTarget && mainTarget.model(SDK.ResourceTreeModel.ResourceTreeModel);
        this.inlineReloadButton = null;
        if (mainTargetSupportsRecordOnReload) {
            const startWithReloadAction = UI.ActionRegistry.ActionRegistry.instance().action('coverage.start-with-reload');
            this.startWithReloadButton = UI.Toolbar.Toolbar.createActionButton(startWithReloadAction);
            toolbar.appendToolbarItem(this.startWithReloadButton);
            this.toggleRecordButton.setEnabled(false);
            this.toggleRecordButton.setVisible(false);
        }
        this.clearButton = new UI.Toolbar.ToolbarButton(i18nString(UIStrings.clearAll), 'largeicon-clear');
        this.clearButton.addEventListener(UI.Toolbar.ToolbarButton.Events.Click, this.clear.bind(this));
        toolbar.appendToolbarItem(this.clearButton);
        toolbar.appendSeparator();
        this.saveButton = new UI.Toolbar.ToolbarButton(i18nString(UIStrings.export), 'largeicon-download');
        this.saveButton.addEventListener(UI.Toolbar.ToolbarButton.Events.Click, _event => {
            this.exportReport();
        });
        toolbar.appendToolbarItem(this.saveButton);
        this.saveButton.setEnabled(false);
        this.textFilterRegExp = null;
        toolbar.appendSeparator();
        this.filterInput = new UI.Toolbar.ToolbarInput(i18nString(UIStrings.urlFilter), '', 0.4, 1);
        this.filterInput.setEnabled(false);
        this.filterInput.addEventListener(UI.Toolbar.ToolbarInput.Event.TextChanged, this.onFilterChanged, this);
        toolbar.appendToolbarItem(this.filterInput);
        toolbar.appendSeparator();
        this.typeFilterValue = null;
        this.filterByTypeComboBox = new UI.Toolbar.ToolbarComboBox(this.onFilterByTypeChanged.bind(this), i18nString(UIStrings.filterCoverageByType));
        const options = [
            {
                label: i18nString(UIStrings.all),
                value: '',
            },
            {
                label: i18nString(UIStrings.css),
                value: 1 /* CSS */,
            },
            {
                label: i18nString(UIStrings.javascript),
                value: 2 /* JavaScript */ | 4 /* JavaScriptPerFunction */,
            },
        ];
        for (const option of options) {
            this.filterByTypeComboBox.addOption(this.filterByTypeComboBox.createOption(option.label, `${option.value}`));
        }
        this.filterByTypeComboBox.setSelectedIndex(0);
        this.filterByTypeComboBox.setEnabled(false);
        toolbar.appendToolbarItem(this.filterByTypeComboBox);
        toolbar.appendSeparator();
        this.showContentScriptsSetting = Common.Settings.Settings.instance().createSetting('showContentScripts', false);
        this.showContentScriptsSetting.addChangeListener(this.onFilterChanged, this);
        this.contentScriptsCheckbox = new UI.Toolbar.ToolbarSettingCheckbox(this.showContentScriptsSetting, i18nString(UIStrings.includeExtensionContentScripts), i18nString(UIStrings.contentScripts));
        this.contentScriptsCheckbox.setEnabled(false);
        toolbar.appendToolbarItem(this.contentScriptsCheckbox);
        this.coverageResultsElement = this.contentElement.createChild('div', 'coverage-results');
        this.landingPage = this.buildLandingPage();
        this.listView = new CoverageListView(this.isVisible.bind(this, false));
        this.statusToolbarElement = this.contentElement.createChild('div', 'coverage-toolbar-summary');
        this.statusMessageElement = this.statusToolbarElement.createChild('div', 'coverage-message');
        this.landingPage.show(this.coverageResultsElement);
    }
    static instance() {
        if (!coverageViewInstance) {
            coverageViewInstance = new CoverageView();
        }
        return coverageViewInstance;
    }
    buildLandingPage() {
        const widget = new UI.Widget.VBox();
        let message;
        if (this.startWithReloadButton) {
            this.inlineReloadButton =
                UI.UIUtils.createInlineButton(UI.Toolbar.Toolbar.createActionButtonForId('coverage.start-with-reload'));
            message = i18n.i18n.getFormatLocalizedString(str_, UIStrings.clickTheReloadButtonSToReloadAnd, { PH1: this.inlineReloadButton });
        }
        else {
            const recordButton = UI.UIUtils.createInlineButton(UI.Toolbar.Toolbar.createActionButton(this.toggleRecordAction));
            message = i18n.i18n.getFormatLocalizedString(str_, UIStrings.clickTheRecordButtonSToStart, { PH1: recordButton });
        }
        message.classList.add('message');
        widget.contentElement.appendChild(message);
        widget.element.classList.add('landing-page');
        return widget;
    }
    clear() {
        if (this.model) {
            this.model.reset();
        }
        this.reset();
    }
    reset() {
        if (this.decorationManager) {
            this.decorationManager.dispose();
            this.decorationManager = null;
        }
        this.listView.reset();
        this.listView.detach();
        this.landingPage.show(this.coverageResultsElement);
        this.statusMessageElement.textContent = '';
        this.filterInput.setEnabled(false);
        this.filterByTypeComboBox.setEnabled(false);
        this.contentScriptsCheckbox.setEnabled(false);
        this.saveButton.setEnabled(false);
    }
    toggleRecording() {
        const enable = !this.toggleRecordAction.toggled();
        if (enable) {
            this.startRecording({ reload: false, jsCoveragePerBlock: this.isBlockCoverageSelected() });
        }
        else {
            this.stopRecording();
        }
    }
    isBlockCoverageSelected() {
        const option = this.coverageTypeComboBox.selectedOption();
        const coverageType = Number(option ? option.value : Number.NaN);
        // Check that Coverage.CoverageType.JavaScriptPerFunction is not present.
        return coverageType === 2 /* JavaScript */;
    }
    selectCoverageType(jsCoveragePerBlock) {
        const selectedIndex = jsCoveragePerBlock ? 1 : 0;
        this.coverageTypeComboBox.setSelectedIndex(selectedIndex);
    }
    onCoverageTypeComboBoxSelectionChanged() {
        this.coverageTypeComboBoxSetting.set(this.coverageTypeComboBox.selectedIndex());
    }
    async ensureRecordingStarted() {
        const enabled = this.toggleRecordAction.toggled();
        if (enabled) {
            await this.stopRecording();
        }
        await this.startRecording({ reload: false, jsCoveragePerBlock: false });
    }
    async startRecording(options) {
        let hadFocus, reloadButtonFocused;
        if ((this.startWithReloadButton && this.startWithReloadButton.element.hasFocus()) ||
            (this.inlineReloadButton && this.inlineReloadButton.hasFocus())) {
            reloadButtonFocused = true;
        }
        else if (this.hasFocus()) {
            hadFocus = true;
        }
        this.reset();
        const mainTarget = SDK.TargetManager.TargetManager.instance().mainTarget();
        if (!mainTarget) {
            return;
        }
        const { reload, jsCoveragePerBlock } = { reload: false, jsCoveragePerBlock: false, ...options };
        if (!this.model || reload) {
            this.model = mainTarget.model(CoverageModel);
        }
        if (!this.model) {
            return;
        }
        Host.userMetrics.actionTaken(Host.UserMetrics.Action.CoverageStarted);
        if (jsCoveragePerBlock) {
            Host.userMetrics.actionTaken(Host.UserMetrics.Action.CoverageStartedPerBlock);
        }
        const success = await this.model.start(Boolean(jsCoveragePerBlock));
        if (!success) {
            return;
        }
        this.selectCoverageType(Boolean(jsCoveragePerBlock));
        this.model.addEventListener(Events.CoverageUpdated, this.onCoverageDataReceived, this);
        this.resourceTreeModel =
            mainTarget.model(SDK.ResourceTreeModel.ResourceTreeModel);
        if (this.resourceTreeModel) {
            this.resourceTreeModel.addEventListener(SDK.ResourceTreeModel.Events.MainFrameNavigated, this.onMainFrameNavigated, this);
        }
        this.decorationManager = new CoverageDecorationManager(this.model);
        this.toggleRecordAction.setToggled(true);
        this.clearButton.setEnabled(false);
        if (this.startWithReloadButton) {
            this.startWithReloadButton.setEnabled(false);
            this.startWithReloadButton.setVisible(false);
            this.toggleRecordButton.setEnabled(true);
            this.toggleRecordButton.setVisible(true);
            if (reloadButtonFocused) {
                this.toggleRecordButton.focus();
            }
        }
        this.coverageTypeComboBox.setEnabled(false);
        this.filterInput.setEnabled(true);
        this.filterByTypeComboBox.setEnabled(true);
        this.contentScriptsCheckbox.setEnabled(true);
        if (this.landingPage.isShowing()) {
            this.landingPage.detach();
        }
        this.listView.show(this.coverageResultsElement);
        if (hadFocus && !reloadButtonFocused) {
            this.listView.focus();
        }
        if (reload && this.resourceTreeModel) {
            this.resourceTreeModel.reloadPage();
        }
        else {
            this.model.startPolling();
        }
    }
    onCoverageDataReceived(event) {
        const data = event.data;
        this.updateViews(data);
    }
    async stopRecording() {
        if (this.resourceTreeModel) {
            this.resourceTreeModel.removeEventListener(SDK.ResourceTreeModel.Events.MainFrameNavigated, this.onMainFrameNavigated, this);
            this.resourceTreeModel = null;
        }
        if (this.hasFocus()) {
            this.listView.focus();
        }
        // Stopping the model triggers one last poll to get the final data.
        if (this.model) {
            await this.model.stop();
            this.model.removeEventListener(Events.CoverageUpdated, this.onCoverageDataReceived, this);
        }
        this.toggleRecordAction.setToggled(false);
        this.coverageTypeComboBox.setEnabled(true);
        if (this.startWithReloadButton) {
            this.startWithReloadButton.setEnabled(true);
            this.startWithReloadButton.setVisible(true);
            this.toggleRecordButton.setEnabled(false);
            this.toggleRecordButton.setVisible(false);
        }
        this.clearButton.setEnabled(true);
    }
    processBacklog() {
        this.model && this.model.processJSBacklog();
    }
    onMainFrameNavigated() {
        this.model && this.model.reset();
        this.decorationManager && this.decorationManager.reset();
        this.listView.reset();
        this.model && this.model.startPolling();
    }
    updateViews(updatedEntries) {
        this.updateStats();
        this.listView.update(this.model && this.model.entries() || []);
        this.saveButton.setEnabled(this.model !== null && this.model.entries().length > 0);
        this.decorationManager && this.decorationManager.update(updatedEntries);
    }
    updateStats() {
        const all = { total: 0, unused: 0 };
        const filtered = { total: 0, unused: 0 };
        let filterApplied = false;
        if (this.model) {
            for (const info of this.model.entries()) {
                all.total += info.size();
                all.unused += info.unusedSize();
                if (this.isVisible(false, info)) {
                    filtered.total += info.size();
                    filtered.unused += info.unusedSize();
                }
                else {
                    filterApplied = true;
                }
            }
        }
        this.statusMessageElement.textContent = filterApplied ?
            i18nString(UIStrings.filteredSTotalS, { PH1: formatStat(filtered), PH2: formatStat(all) }) :
            formatStat(all);
        function formatStat({ total, unused }) {
            const used = total - unused;
            const percentUsed = total ? Math.round(100 * used / total) : 0;
            return i18nString(UIStrings.sOfSSUsedSoFarSUnused, {
                PH1: Platform.NumberUtilities.bytesToString(used),
                PH2: Platform.NumberUtilities.bytesToString(total),
                PH3: percentUsed,
                PH4: Platform.NumberUtilities.bytesToString(unused),
            });
        }
    }
    onFilterChanged() {
        if (!this.listView) {
            return;
        }
        const text = this.filterInput.value();
        this.textFilterRegExp = text ? createPlainTextSearchRegex(text, 'i') : null;
        this.listView.updateFilterAndHighlight(this.textFilterRegExp);
        this.updateStats();
    }
    onFilterByTypeChanged() {
        if (!this.listView) {
            return;
        }
        Host.userMetrics.actionTaken(Host.UserMetrics.Action.CoverageReportFiltered);
        const option = this.filterByTypeComboBox.selectedOption();
        const type = option && option.value;
        this.typeFilterValue = parseInt(type || '', 10) || null;
        this.listView.updateFilterAndHighlight(this.textFilterRegExp);
        this.updateStats();
    }
    isVisible(ignoreTextFilter, coverageInfo) {
        const url = coverageInfo.url();
        if (url.startsWith(CoverageView.EXTENSION_BINDINGS_URL_PREFIX)) {
            return false;
        }
        if (coverageInfo.isContentScript() && !this.showContentScriptsSetting.get()) {
            return false;
        }
        if (this.typeFilterValue && !(coverageInfo.type() & this.typeFilterValue)) {
            return false;
        }
        return ignoreTextFilter || !this.textFilterRegExp || this.textFilterRegExp.test(url);
    }
    async exportReport() {
        const fos = new Bindings.FileUtils.FileOutputStream();
        const fileName = `Coverage-${Platform.DateUtilities.toISO8601Compact(new Date())}.json`;
        const accepted = await fos.open(fileName);
        if (!accepted) {
            return;
        }
        this.model && this.model.exportReport(fos);
    }
    selectCoverageItemByUrl(url) {
        this.listView.selectByUrl(url);
    }
    static EXTENSION_BINDINGS_URL_PREFIX = 'extensions::';
    wasShown() {
        super.wasShown();
        this.registerCSSFiles([coverageViewStyles]);
    }
}
let actionDelegateInstance;
export class ActionDelegate {
    handleAction(context, actionId) {
        const coverageViewId = 'coverage';
        UI.ViewManager.ViewManager.instance()
            .showView(coverageViewId, /** userGesture= */ false, /** omitFocus= */ true)
            .then(() => {
            const view = UI.ViewManager.ViewManager.instance().view(coverageViewId);
            return view && view.widget();
        })
            .then(widget => this.innerHandleAction(widget, actionId));
        return true;
    }
    static instance(opts = { forceNew: null }) {
        const { forceNew } = opts;
        if (!actionDelegateInstance || forceNew) {
            actionDelegateInstance = new ActionDelegate();
        }
        return actionDelegateInstance;
    }
    innerHandleAction(coverageView, actionId) {
        switch (actionId) {
            case 'coverage.toggle-recording':
                coverageView.toggleRecording();
                break;
            case 'coverage.start-with-reload':
                coverageView.startRecording({ reload: true, jsCoveragePerBlock: coverageView.isBlockCoverageSelected() });
                break;
            default:
                console.assert(false, `Unknown action: ${actionId}`);
        }
    }
}
let lineDecoratorInstance;
export class LineDecorator {
    static instance({ forceNew } = { forceNew: false }) {
        if (!lineDecoratorInstance || forceNew) {
            lineDecoratorInstance = new LineDecorator();
        }
        return lineDecoratorInstance;
    }
    listeners;
    constructor() {
        this.listeners = new WeakMap();
    }
    decorate(uiSourceCode, textEditor) {
        const decorations = uiSourceCode.decorationsForType(decoratorType);
        if (!decorations || !decorations.size) {
            this.uninstallGutter(textEditor);
            return;
        }
        const decorationManager = decorations.values().next().value.data();
        decorationManager.usageByLine(uiSourceCode).then(lineUsage => {
            textEditor.operation(() => this.innerDecorate(uiSourceCode, textEditor, lineUsage));
        });
    }
    innerDecorate(uiSourceCode, textEditor, lineUsage) {
        const gutterType = LineDecorator.GUTTER_TYPE;
        this.uninstallGutter(textEditor);
        if (lineUsage.length) {
            this.installGutter(textEditor, uiSourceCode.url());
        }
        for (let line = 0; line < lineUsage.length; ++line) {
            // Do not decorate the line if we don't have data.
            if (typeof lineUsage[line] !== 'boolean') {
                continue;
            }
            const className = lineUsage[line] ? 'text-editor-coverage-used-marker' : 'text-editor-coverage-unused-marker';
            const gutterElement = document.createElement('div');
            gutterElement.classList.add(className);
            textEditor.setGutterDecoration(line, gutterType, gutterElement);
        }
    }
    makeGutterClickHandler(url) {
        function handleGutterClick(event) {
            if (event.data.gutterType !== LineDecorator.GUTTER_TYPE) {
                return;
            }
            const coverageViewId = 'coverage';
            UI.ViewManager.ViewManager.instance()
                .showView(coverageViewId)
                .then(() => {
                const view = UI.ViewManager.ViewManager.instance().view(coverageViewId);
                return view && view.widget();
            })
                .then(widget => {
                const matchFormattedSuffix = url.match(/(.*):formatted$/);
                const urlWithoutFormattedSuffix = (matchFormattedSuffix && matchFormattedSuffix[1]) || url;
                widget.selectCoverageItemByUrl(urlWithoutFormattedSuffix);
            });
        }
        return handleGutterClick;
    }
    installGutter(textEditor, url) {
        let listener = this.listeners.get(textEditor);
        if (!listener) {
            listener = this.makeGutterClickHandler(url);
            this.listeners.set(textEditor, listener);
        }
        textEditor.installGutter(LineDecorator.GUTTER_TYPE, false);
        textEditor.addEventListener(SourceFrame.SourcesTextEditor.Events.GutterClick, listener, this);
    }
    uninstallGutter(textEditor) {
        textEditor.uninstallGutter(LineDecorator.GUTTER_TYPE);
        const listener = this.listeners.get(textEditor);
        if (listener) {
            textEditor.removeEventListener(SourceFrame.SourcesTextEditor.Events.GutterClick, listener, this);
            this.listeners.delete(textEditor);
        }
    }
    static GUTTER_TYPE = 'CodeMirror-gutter-coverage';
}
SourceFrame.SourceFrame.registerLineDecorator({
    lineDecorator: LineDecorator.instance,
    decoratorType: SourceFrame.SourceFrame.DecoratorType.COVERAGE,
});
//# sourceMappingURL=CoverageView.js.map