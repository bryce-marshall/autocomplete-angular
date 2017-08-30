import { ApplicationRef, Directive, Input, Output, Type } from '@angular/core';
import { ChangeDetectorRef, ComponentRef, ComponentFactoryResolver, ElementRef, EventEmitter, HostListener, ViewContainerRef } from '@angular/core';
import { Injectable, Optional, ReflectiveInjector, ValueProvider } from '@angular/core';
import { AutocompletePopup } from './popup/popup';
import { CancelIcon } from './cancel-icon/cancel-icon';
import { AutocompleteController } from './autocomplete-controller';
import { MouseEventHandler } from './mouse-event-handler';
import { AutocompleteTypeProvider, AutocompleteTypeset } from './autocomplete-type-provider';
import { ExceptionFactory } from '@brycemarshall/exception';
import { EventThrottle } from '@brycemarshall/event-throttle';
import { ScrollListener, ScrollListenerEventArgs, ScrollEventTargetCollection, DOMType } from '@brycemarshall/scroll-listener';
import { DefaultScrollSourceFilterProvider, ScrollSourceFilterProvider } from './scroll-source-filter';
import { AutocompleteQueryMediator, AutocompleteQueryProcessor, BindQueryProcessorFunction, InputChangedFunction } from './autocomplete-query-mediator';

/**
 * Defines a set of values representing the possible auto-assign modes of an Autocomplete component.
 * When auto-assign is active, changes to the input control do not require explicit acceptance by the user but can instead be
 * automatically applied to the underlying model when the input control loses focus.
 * @enum AutoAssignMode
 */
export enum AutoAssignMode {
  /**
   * Only an empty value is automatically applied to the model. This is the default mode.
   */
  Null = 0,
  /**
   * Auto-assign is disabled.
   */
  Off = 1,
  /**
   * Auto-assign is enabled.
   */
  On = 2
}

/**
 * The structure passed to AutocompleteResolveFunction implementations.
 * @class AutocompleteResolveData
 */
export class AutocompleteResolveData {
  /**
   * The value that was entered by the user.
   * @property inputValue
   */
  readonly inputValue: string;
  /**
   * The value of this property will be true if the originating Autocomplete control has its allowCreate property set to true, otherwise it will be false.
   * The property serves as a hint for the implementing resolver function, which should always try to resolve an existing item that can be exactly mapped 
   * to the input value. If an existing item cannot be resolved, then the implementing function should not create a new one unless this property has a value of true.
   * @property shouldCreate
   */
  readonly shouldCreate: boolean;
  /**
   * Additional data optionally passed by a custom create component and which may be used by the implementing resolver function to create a new data item.
   * @property data
   */
  readonly data: any;
  /**
   * The resolved data to be assigned to the underlying model by the originating Autocomplete instance.
   * This property should be assigned by the implenting resolver function.
   * @property resolvedValue
   */
  resolvedValue: any;
}

/**
 * A reference to the function invoked by Autocomplete instances to resolve a data item when raw input text (as opposed to an item from the popup suggestion list) is selected by the user.
 * @function AutocompleteResolveFunction
 * @param {AutocompleteResolveData} data
 * @returns Returns true if the implementing function was able to resolve a value, otherwise returns false.
 */
export type AutocompleteResolveFunction = (data: AutocompleteResolveData) => boolean;
/**
 * Gets the display text for the specified item.
 * @function getDisplayText
 * @param {any} item The data item from which to derive the display text.
 * @param {boolean} descriptive If true, indicates that (where applicable) descriptive text is required. If false, simple text is returned.
 * Descriptive text is displayed in the list of suggested items, whereas simple text should be displayed in the input control.
 */
export type AutocompleteTextFunction = (item: any, descriptive: boolean) => string;

/**
 * An internal class used to coordinate Autocomplete components.
 * @class AutocompleteCoordinator
 */
export abstract class AutocompleteCoordinator { }

/** @internal */
@Injectable()
class CoordinatorImp extends AutocompleteCoordinator {
  // Note that the ViewportManager instance is shared by all AutocompleteInput instances on the page.
  /** @internal */
  private _viewportManager: ViewportManager;
  /** @internal */
  private _controller: AutocompleteController;
  /** @internal */
  private _mouseHandler: MouseEventHandler;
  /** @internal */
  private _src: InputRef = null;
  /** @internal */
  private _query: QueryProxy = null;
  /** @internal */
  private _inputElement: HTMLInputElement = null;
  /** @internal */
  private _initialInputValue: string = "";
  /** @internal */
  private _inputValue: string = "";
  /** @internal */
  private _precursorInput: string = "";
  /** @internal */
  private _cursorOp: CursorOp = null;
  /** @internal */
  private _blurState: BlurHandlerState = BlurHandlerState.Inactive;

  constructor( @Optional() scrollSourceFilter: ScrollSourceFilterProvider, resolver: ComponentFactoryResolver, private _appRef: ApplicationRef) {
    super();
    // Use closures to implement IPopupController without exposing internal members to client code.
    let that: CoordinatorImp = this;
    this._controller = {
      get cursor(): number {
        return that._viewportManager.cursor;
      },
      hidePopup() {
        that._viewportManager.isActive = false;
      },
      resolveAndAssignItem(inputValue?: string, data?: any) {
        that.resolveAndAssign(that._src, inputValue != null ? inputValue : that.inputValue, data);
        this.hidePopup();
      },
      assignItem(item: any) {
        if (that._src != null)
          that._src.dataItem = item;

        this.hidePopup();
      },
      cancelEdit() {
        that.cancelEdit();
      },
      getDisplayText(item: any, descriptive: boolean): string {
        if (!that._src) return "";
        return that._src.getDisplayText(item, descriptive);
      }
    };

    this._mouseHandler = {
      onMouseDown(e: UIEvent) {
        that._blurState = BlurHandlerState.Refocus;
      },

      onClick(e: UIEvent) {
        that._viewportManager.isActive = false;
      }
    };

    this._viewportManager = new ViewportManager(this, scrollSourceFilter, resolver);
  }

  get controller(): AutocompleteController {
    return this._controller;
  }

  get queryProxy(): QueryProxy {
    if (!this._query)
      this._query = CoordinatorImp.createQueryProxy(this);
    return this._query;
  }

  get mouseHandler(): MouseEventHandler {
    return this._mouseHandler;
  }

  get inputElement(): HTMLInputElement {
    return this._inputElement;
  }

  get inputValue(): string {
    return this._inputValue;
  }

  get initialInputValue(): string {
    return this._initialInputValue;
  }

  get hasChanges(): boolean {
    return this.inputValue != this._initialInputValue;
  }

  onDataItemSet(dataItem: any) {
    if (this._src) {
      this._initialInputValue = this._src.getDisplayText(dataItem, false);
      this._inputValue = this._initialInputValue;
    }
  }

  registerViewContainer(ref: ViewContainerRef) {
    if (!this._viewportManager.tryAssignViewContainer(ref))
      throw ExceptionFactory.InvalidOperation("AutocompleteContainer: An element adorned with the autocomplete-container attribute already exists within the current scope.");
  }

  handleGainedFocus(src: InputRef, inputElement: HTMLInputElement) {
    if (this._src == src) {
      return; // Handle re-entry when input control is programmtically given focus.
    }

    // Check to see if another src exists (will be the case if focus was lost clicking on a different AutocompleteInput element);
    // If so, check apply any changes to the previous item IF autoAssign is enabled.
    if (this._src != null) {
      this.processAutoAssign();
      this.destroy();
    }

    this._src = src;
    this._inputElement = inputElement;
    this._initialInputValue = this._src.getDisplayText(this._src.dataItem, false);
    this._inputValue = this._initialInputValue;
    this._viewportManager.createPopup(src);
    this._blurState = BlurHandlerState.Active;
    if (src.openOnFocus)
      this.queryProxy.onInputChanged();
  }

  handleLostFocus(src: InputRef) {
    if (src != this._src || !src.closeOnBlur)
      return;

    this.enterLostFocusHandler();
  }

  handleInputChanged(src: InputRef, value: string) {
    if (src !== this._src) return;

    this._inputValue = value != null ? value : "";
    this.queryProxy.onInputChanged();
  }

  handleKeyDown(src: InputRef, event: KeyboardEvent) {
    if (src !== this._src || event.key != "Escape") return;
    if (this._viewportManager.cursorActive || this._viewportManager.isActive || this.hasChanges) event.cancelBubble = true;
  }

  handleKeyUp(src: InputRef, event: KeyboardEvent) {
    if (src !== this._src) return;
    switch (event.key) {
      case "ArrowDown":
        if (this._src.allowCursor) {
          this.ensureCursor(true);
        }
        else
          this.queryProxy.onInputChanged();
        break;

      case "ArrowUp":
        if (this._src.allowCursor) {
          this.ensureCursor(false);
        }
        else
          this.queryProxy.onInputChanged();
        break;

      case "Enter":
        this.assignFromInput();
        break;

      case "Escape":
        if (this._viewportManager.cursorActive) {
          event.cancelBubble = true;
          this._viewportManager.resetCursor();
          this._inputValue = this._precursorInput;
          this._precursorInput = "";
          this._src.setControlValue(this._inputValue, true);
        }
        else if (this._viewportManager.isActive){
          event.cancelBubble = true;
          this._viewportManager.isActive = false;
        }
        else if (this.hasChanges) {
          event.cancelBubble = true;
          this.cancelEdit();
        }
        break;
    }
  }

  public setCursorValue(value: string) {
    this._src.setControlValue(value, false);
    this._inputValue = value;
  }

  private ensureCursor(inc: boolean) {
    if (this._viewportManager.cursorActive) {
      this._viewportManager.moveCursor(inc);
    }
    else if (this.queryProxy.isActiveFilter(this._inputValue)) {
      this._precursorInput = this._inputValue;
      this._viewportManager.isActive = true;
      this._viewportManager.moveCursor(inc);
    }
    else if (this._cursorOp == null) {
      this._precursorInput = this._inputValue;
      this._cursorOp = {
        sequence: this.queryProxy.peekNext(), inc: inc
      };

      this.queryProxy.onInputChanged();
    }
    // TODO: TIMEOUT!
    // TODO: Only ONE cursor query at a time (as they may be handled asynchronously). 
    // Consider a timeout to allow retries after a period. When timeout occurs, the cursor is reset and the user must press an arrow key again to reinitiate it.
    // For the lock to be reset, a query result must be returned for a query submitted at or after the lock request, or a timeout must occur.
    // Have initQuery() return a token, and add a "atOrBeforeCurrent(token)" method to the QueryProxy instance which will return true if the sequence of
    // the last returned result is >= the sequence of the stored token.
  }

  /** @internal */
  private cancelEdit() {
    if (!this._src) return;
    this._precursorInput = "";
    this._inputValue = this._initialInputValue;
    this._viewportManager.isActive = false;
    this._src.setControlValue(this._inputValue, true);
  }

  /** @internal */
  private enterLostFocusHandler() {
    // Apply a timer so that if it was the popup that received focus, it has long enough to repond to the event itself.
    // If upon timeout the popup still exists, we assume that some other element received focus and so we close the popup.
    setTimeout((src) => {
      if (this._src !== src) return;
      switch (this._blurState) {
        case BlurHandlerState.Active:
          this.processAutoAssign();
          this.destroy();
          break;
        case BlurHandlerState.Refocus:
          this._blurState = BlurHandlerState.Active;
          this.inputElement.focus();
          break;
      }
    }, 250, this._src);
  }

  /** @internal */
  private destroy() {
    this._src = null;
    this._inputElement = null;
    this._initialInputValue = "";
    this._inputValue = "";
    this._precursorInput = "";
    this._viewportManager.destroyPopup(); // Safe to invoke even if there is no existing popup instance
    if (this._query != null) {
      this._query.destroy();
      this._query = null;
    }
    this._cursorOp = null;
  }

  private handleQueryResponse(src: InputRef, data: any[]) {
    if (src !== this._src) return;
    this._viewportManager.updatePopup(data);
    if (this._cursorOp != null && this.queryProxy.isCurrent(this._cursorOp.sequence)) {
      this._viewportManager.moveCursor(this._cursorOp.inc);
      this._cursorOp = null;
    }
  }

  private static createQueryProxy(c: CoordinatorImp): QueryProxy {
    const destroyedMsg = "AutocompleteQueryMediator destroyed.";
    const subscribedMsg = "The AutocompleteQueryMediator already has a subscriber.";
    const notSubscribedMsg = "No query processor for the target input control has subscribed to the AutocompleteQueryMediator.";

    let src: InputRef = c._src;
    let p: AutocompleteQueryProcessor = null;
    let context: any = {};
    let activeSequence: number = 0;
    let sequence: number = 0;
    let activeFilter: string = null;

    let m: AutocompleteQueryMediator = {
      get isDestroyed() { return c == null; },

      subscribeFn(inputChangedFn: InputChangedFunction, destroyFn?: Function) {
        if (c == null) throw ExceptionFactory.InvalidOperation(destroyedMsg);
        if (p != null) throw ExceptionFactory.InvalidOperation(subscribedMsg);
        p = new QueryProcProxy(inputChangedFn, destroyFn);
      },

      subscribeProc(processor: AutocompleteQueryProcessor) {
        if (c == null) throw ExceptionFactory.InvalidOperation(destroyedMsg);
        if (p != null) throw ExceptionFactory.InvalidOperation(subscribedMsg);
        p = processor;
      },

      onResult(token: any, data: any[]) {
        if (c == null) return; // Out of scope/destroyed
        if ((<QueryToken>token).context !== context || typeof ((<QueryToken>token).sequence) != "number") return;
        if ((<QueryToken>token).sequence <= activeSequence) return;
        activeSequence = token.sequence;
        activeFilter = token.filter;
        if (activeFilter == null) activeFilter = "";
        c.handleQueryResponse(src, data);
      }
    };

    src.bindQueryFunction(m);

    return {
      get mediator(): AutocompleteQueryMediator {
        return m;
      },
      get processor(): AutocompleteQueryProcessor {
        if (p == null) throw ExceptionFactory.InvalidOperation(notSubscribedMsg);
        return p;
      },
      isCurrent(sequence: number): boolean {
        return sequence === activeSequence;
      },
      peekNext(): number {
        return sequence + 1;
      },
      isActiveFilter(value: string): boolean {
        return value === activeFilter;
      },
      onInputChanged(): void {
        if (p == null) throw ExceptionFactory.InvalidOperation(notSubscribedMsg);
        if (c._inputValue != activeFilter) {
          p.onInputChanged(m,
            ClosureFactory.createQueryToken(context, ++sequence, c.inputValue),
            c._inputValue);
        }
        else if (activeSequence != sequence) {
          activeSequence = ++sequence;
        }
      },
      destroy() {
        src = null;
        m = null;
        c = null;
        context = null;
        try {
          p.onDestroy();
        }
        finally {
          p == null;
        }
      }
    };
  }

  /** @internal */
  private processAutoAssign() {
    if (this.requiresAutoAssign()) {
      this.assignFromInput();
    } else if (this.hasChanges)
      this.controller.cancelEdit();
  }

  /** @internal */
  private requiresAutoAssign(): boolean {
    if (this._src.autoAssign == AutoAssignMode.Off || !this.hasChanges)
      return false;

    return this._src.autoAssign == AutoAssignMode.On || this.inputValue == "" || this.inputValue == null;
  }

  private assignFromInput() {
    let v = this._inputValue;
    if (v == null) v = "";
    if (v != "")
      this.controller.resolveAndAssignItem(v, this._src.allowCreate ? this._viewportManager.getCreateData() : null);
    else {
      this._src.dataItem = null;
      this.resetInputData("");
    }
  }

  /** @internal */
  private resolveAndAssign(src: InputRef, inputValue: string, data: any) {
    if (src == null) return;
    if (inputValue == null) inputValue = "";

    if (this._src.resolveFunction) {
      let rData = CoordinatorImp.createResolveData(src.allowCreate, inputValue, data);
      if (src.resolveFunction(rData)) {
        src.dataItem = rData.resolvedValue;
        this.resetInputData(this._inputValue);
      }
      else
        this.cancelEdit();
    }
    else {
      src.dataItem = this.inputValue;
      this.resetInputData(this._inputValue);
    }
  }

  private resetInputData(value: string) {
    if (value == null) value = "";
    this._inputValue = value;
    this._initialInputValue = value;
    this._precursorInput = value;

    if (this._query && !this._query.isActiveFilter(value))
      this._viewportManager.updatePopup(null);
  }

  /** @internal */
  private static createResolveData(shouldCreate: boolean, inputValue: string, data: any): AutocompleteResolveData {
    let v: any = null;
    return {
      get data(): any {
        return data;
      },
      get inputValue(): string {
        return inputValue;
      },
      get shouldCreate(): boolean {
        return shouldCreate;
      },
      get resolvedValue(): any {
        return v;
      },
      set resolvedValue(value: any) {
        v = value;
      }
    };
  }
}

/**
 * All input elements having an Autocomplete directive applied to them must be the child of a parent element having an AutocompleteContainer directive.
 * The AutocompleteContainer element becomes the parent element for the Autocomplete popup component. Multiple Autocomplete input element instances 
 * can share a single AutocompleteContainer.
 * @class AutocompleteContainer
 */
@Directive({
  selector: '[autocomp-container]',
  providers: [{ provide: AutocompleteCoordinator, useClass: CoordinatorImp }]
})
export class AutocompleteContainer {
  constructor(coordinator: AutocompleteCoordinator, ref: ViewContainerRef) {
    (<CoordinatorImp>coordinator).registerViewContainer(ref);
  }
}

/**
 * The base class that should be extended to implement a functional Autocomplete directive which can then be applied to an input element to enable auto-complete functionality.
 * 
 * Remarks:
 * 
 * The AutocompleteBase type is necessary to enable custom implementations for frameworks that encapsulate the underlying HTMLInput element in a manner that obscures
 * its native interface, including methods necessary for binding to events.
 * @class AutocompleteBase
 */
export abstract class AutocompleteBase {
  /**
   * When true, displays the "create" popup subcomponent and allows values that do not appear in the auto-complete suggestion list to be assigned to the model.
   * The default value is true.
   * @property {boolean} allowCreate
   */
  @Input()
  allowCreate: boolean = true;
  /**
   * Specifies how the control will handle automatic assignent of input values (as opposed to assignment of an item explictly selected from the popup suggestion list).
   * Valid values are "null", "on", and "off" (see also the AutoAssignMode enum).
   * The default value is "null".
   * @property autoAssign
   */
  @Input()
  get autoAssign(): string {
    switch (this.autoAssignType) {
      case AutoAssignMode.Null:
        return "null";
      case AutoAssignMode.Off:
        return "off";
      case AutoAssignMode.On:
        return "on";
    }
    return "";
  }

  set autoAssign(value: string) {
    value = value != null ? value.toLowerCase().trim() : "";
    switch (value) {
      case "off":
        this.autoAssignType = AutoAssignMode.Off;
        break;
      case "on":
        this.autoAssignType = AutoAssignMode.On;
        break;
      default:
        this.autoAssignType = AutoAssignMode.Null;
        break;
    }
  }

  /**
   * When true, allows the scrolling through and preselection of list items using the arrow keys.
   * The default value is true.
   * @property allowCursor
   */
  @Input()
  allowCursor = true;
  /**
   * When true, the auto-complete popup will automatically open when the input control receives focus.
   * When false, the popup will open only after the input control value has changed.
   * The default value is true.
   * @property {boolean} openOnFocus - 
   */
  @Input()
  openOnFocus: boolean = true;
  /**
   * An optional key used to resolve custom sub-component types from an AutocompleteTypeProvider.
   * @property {string} typeKey
   */
  @Input()
  typeKey: string = "";
  /**
   * The query function used to resolve the set of auto-complete suggestions. This value is assigned directly to the [autocomp] selector in the template markup.
   * @property {AutocompleteQueryFunction} queryFunction
   */
  @Input('autocomp')
  queryFunction: BindQueryProcessorFunction;
  /**
   * A reference to a AutocompleteTextFunction that can be used by Autocomplete instances to resolve the display text for data item instances. If not assigned, then the Autocomplete instance will use each data item instance's toString() function.
   * @property {AutocompleteTextFunction} textFunction
   */
  @Input()
  textFunction: AutocompleteTextFunction;
  /**
   * A reference to the function to be invoked to resolve a data item when raw input text (as opposed to an item from the popup suggestion list) is selected by the user.
   * @property {AutocompleteResolveFunction} resolveFunction
   */
  @Input()
  resolveFunction: AutocompleteResolveFunction;
  /**
   * The EventEmitter used to enable two-way data-binding.
   * @property {EventEmitter} dataItemChange
   */
  @Output() dataItemChange = new EventEmitter();

  /**
   * Specifies how the control will handle automatic assignent of input values (as opposed to assignment of an item explictly selected from the popup suggestion list).
   * Valid values are AutoAssignMode.Null, AutoAssignMode.On, and AutoAssignMode.Off (see also the AutoAssignMode enum).
   * The default value is AutoAssignMode.Null.
   * @property autoAssignType
   */
  @Input()
  autoAssignType: AutoAssignMode;

  /**
   * Specifies whether or not the popup should automatically close when the bound input control loses focus.
   * The default value is true.
   * 
   * 
   * Remarks:
   * 
   * This feature exists primarily as a development and design aid, as it enables inspection of the popup and its associated CSS styles in the live DOM (which is not otherwise possible as it is disposed of when the input control loses focus).
   * @property closeOnBlur
   */
  @Input()
  closeOnBlur: boolean = true;

  /** @internal */
  private _dataItem: any;
  /** @internal */
  private _coordinator: CoordinatorImp;
  /** @internal */
  private _inputRef: InputRef;

  constructor(coordinator: AutocompleteCoordinator, typeProvider: AutocompleteTypeProvider, inputEl: ElementRef, changeDetectorRef: ChangeDetectorRef) {
    if (coordinator == null) throw ExceptionFactory.InvalidOperation("The Autocomplete directive has no AutocompleteContainer defined within a parent scope.");
    this._coordinator = <CoordinatorImp>coordinator;

    // Use closures to implement InputRef without exposing internal members to client code.
    let that: AutocompleteBase = this;
    this._inputRef = {
      get allowCreate(): boolean { return that.allowCreate; },
      get autoAssign(): AutoAssignMode { return that.autoAssignType; },
      get allowCursor(): boolean { return that.allowCursor; },
      get openOnFocus(): boolean { return that.openOnFocus },
      get closeOnBlur(): boolean { return that.closeOnBlur },
      get typeKey(): string { return that.typeKey; },
      get bindQueryFunction(): BindQueryProcessorFunction { return that.queryFunction; },
      get textFunction(): AutocompleteTextFunction { return that.textFunction; },
      get resolveFunction(): AutocompleteResolveFunction { return that.resolveFunction; },
      get hostElement(): HTMLElement { return inputEl.nativeElement; },
      get dataItem(): any { return that.dataItem; },
      set dataItem(value: any) { that.dataItem = value; },
      getTypeset() {
        if (typeProvider == null)
          return null;

        if (that.typeKey == null || that.typeKey == "")
          return typeProvider.tryGet("");

        return typeProvider.get(that.typeKey);
      },
      // detectChanges() { changeDetectorRef.detectChanges(); },
      getDisplayText(dataItem: any, descriptive: boolean): string { return that.getDisplayText(dataItem, descriptive); },
      setControlValue(value: string, persistent: boolean) {
        that.setControlValue(value, persistent);
      },
      addEventListener(type: string, listener?: EventListenerOrEventListenerObject, useCapture?: boolean): void { that.addEventListener(type, listener, useCapture); },
      removeEventListener(type: string, listener?: EventListenerOrEventListenerObject, useCapture?: boolean): void { that.removeEventListener(type, listener, useCapture); },
      onAfterDestroyPopup() {
        if (typeof (<any>that).onAfterDestroyPopup == "function")
          (<any>that).onAfterDestroyPopup();
      }
    }
  }

  /**
   * @property {any} dataItem - Gets or sets the bound data item.
   */
  @Input()
  get dataItem(): any {
    return this._dataItem;
  }

  set dataItem(value: any) {
    if (value === this.dataItem) {
      // It may be necessary to reassign the text value to the control, however angular doesn't allow a forced refresh therefore it must be done through the DOM.
      this.setControlValue(this.getDisplayText(value, false), true)
      return;
    }
    this._dataItem = value;
    this._coordinator.onDataItemSet(value);
    this.dataItemChange.emit(value);
    this.onAfterSetDataItem();
  }

  /**
   * @property {string} controlValue - Returns the value that should be applied to the associated input control.
   * This property is a useful way of applying assigning the value to the DOM input element in the template markup (necessary because it is the dataItem property that
   * is actually bound to the model). Internally, the controlValue getter simply invokes "this.getDisplayText(this.dataItem, false)".
   */
  get controlValue(): string {
    return this.getDisplayText(this.dataItem, false);
  }

  /**
   * @function getDisplayText - Gets the display text for the specified item using the specified AutocompleteTextFunction if one exists, otherwise dataItem.toString().
   * @param item - The data item to derive the display text from.
   * @param descriptive - If true, indicates that (where applicable) descriptive text is required. If false, simple text is returned.
   * Where applicable, descriptive text is displayed in list of suggested items, whereas simple text is displayed in the input control.
   */
  getDisplayText(dataItem: any, descriptive: boolean): string {
    let result: string = null;
    if (this.textFunction != null)
      result = this.textFunction(dataItem, descriptive);
    else if (dataItem != null && typeof (dataItem.toString) === "function")
      result = dataItem.toString();

    return result != null ? result : "";
  }

  protected handleKeyDownEvent(src: HTMLInputElement, event: KeyboardEvent) {
    this._coordinator.handleKeyDown(this._inputRef, event);
  }

  protected handleKeyUpEvent(src: HTMLInputElement, event: KeyboardEvent) {
    this._coordinator.handleKeyUp(this._inputRef, event);
  }

  protected handleInputEvent(src: HTMLInputElement, event: Event) {
    this._coordinator.handleInputChanged(this._inputRef, src.value);
  }

  protected handleFocusEvent(src: HTMLInputElement, event: FocusEvent) {
    this._coordinator.handleGainedFocus(this._inputRef, src);
  }

  protected handleBlurEvent(src: HTMLInputElement, event: FocusEvent) {
    this._coordinator.handleLostFocus(this._inputRef);
  }

  /**
   * When implemented in a derived class, sets the textual value of the underlying input control to the value provided.
   * 
   * Remarks:
   * 
   * This hack is necessary because Angular does not currently provide a way to force the re-rendering of the view (whether a portion of it or in its entirety).
   * Autocomplete requires such functionality because, upon the cancel icon being clicked, although the model won't have changed the text "value" of the bound HTMLInput control will have.
   * This happens because the model is bound to the dataItem property and not the HTMLInput control itself.
   * @method setControlValue
   * @param value The textual value to assign to the native input control.
   * @param persistent An optional parameter which indiciates whether or not the value should be treated as input (and potentially bubbled-up to an encapsulating control).
   * The persistent parameter will have a value of false if the setControlValue invocation was made from within a cursor navigation context, otherwise it will have a value of true.
   */
  protected abstract setControlValue(value: string, persistent?: boolean);
  /**
   * Invoked after the dataItem property has been set.
   */
  protected abstract onAfterSetDataItem();
  protected abstract addEventListener(type: string, listener: EventListenerOrEventListenerObject, useCapture?: boolean): void;
  protected abstract removeEventListener(type: string, listener?: EventListenerOrEventListenerObject, useCapture?: boolean): void;
}

/**
 * The Autocomplete directive can be applied to an input element to enable auto-complete functionality.
 * @class Autocomplete
 */
@Directive({
  selector: '[autocomp]',
  exportAs: 'autocomp'
})
export class Autocomplete extends AutocompleteBase {
  constructor( @Optional() coordinator: AutocompleteCoordinator, @Optional() typeProvider: AutocompleteTypeProvider, private inputEl: ElementRef, changeDetectorRef: ChangeDetectorRef) {
    super(coordinator, typeProvider, inputEl, changeDetectorRef);
  }

  protected setControlValue(value: string) {
    if (this.inputEl.nativeElement)
      this.inputEl.nativeElement.value = value;
  }

  protected onAfterSetDataItem(){}

  protected addEventListener(type: string, listener: EventListenerOrEventListenerObject, useCapture?: boolean): void {
    if (this.inputEl.nativeElement)
      this.inputEl.nativeElement.addEventListener(type, listener, useCapture);
  }

  protected removeEventListener(type: string, listener?: EventListenerOrEventListenerObject, useCapture?: boolean): void {
    if (this.inputEl.nativeElement)
      this.inputEl.nativeElement.removeEventListener(type, listener, useCapture);
  }

  /** @internal */
  @HostListener('keydown', ['$event'])
  private onKeyDown(event: KeyboardEvent) {
    this.handleKeyDownEvent(<HTMLInputElement>event.target, event);
  }

  /** @internal */
  @HostListener('keyup', ['$event'])
  private onKeyUp(event: KeyboardEvent) {
    this.handleKeyUpEvent(<HTMLInputElement>event.target, event);
  }

  /** @internal */
  @HostListener('input', ['$event'])
  private onInput(event: Event) {
    this.handleInputEvent(<HTMLInputElement>event.target, event);
  }

  /** @internal */
  @HostListener('focus', ['$event'])
  private onFocus(event: FocusEvent) {
    this.handleFocusEvent(<HTMLInputElement>event.target, event);
  }

  /** @internal */
  @HostListener('blur', ['$event'])
  private onBlur(event: FocusEvent) {
    this.handleBlurEvent(<HTMLInputElement>event.target, event);
  }
}

/** @internal */
interface CursorOp {
  readonly sequence: number;
  readonly inc: boolean;
}

/** @internal */
interface QueryProxy {
  readonly mediator: AutocompleteQueryMediator;
  readonly processor: AutocompleteQueryProcessor;
  isCurrent(sequence: number): boolean;
  peekNext(): number;
  isActiveFilter(value: string): boolean;
  onInputChanged();
  destroy();
}

/** @internal */

class QueryProcProxy implements AutocompleteQueryProcessor {
  constructor(private inputChangedFn: InputChangedFunction, private destroyFn: Function) {
  }

  onInputChanged(sender: AutocompleteQueryMediator, token: any, filter: string) {
    this.inputChangedFn(sender, token, filter);
  }
  onDestroy() {
    if (this.destroyFn)
      this.destroyFn();
  }
}

/** @internal */
interface InputRef {
  readonly allowCreate: boolean;
  readonly autoAssign: AutoAssignMode;
  readonly allowCursor: boolean;
  readonly openOnFocus: boolean;
  readonly closeOnBlur: boolean;
  readonly typeKey: string;
  readonly bindQueryFunction: BindQueryProcessorFunction;
  readonly textFunction: AutocompleteTextFunction;
  readonly resolveFunction: AutocompleteResolveFunction;
  readonly hostElement: HTMLElement;
  dataItem: any;
  getTypeset(): AutocompleteTypeset;
  getDisplayText(dataItem: any, descriptive: boolean): string;
  setControlValue(value: string, persistent: boolean): void;
  addEventListener(type: string, listener?: EventListenerOrEventListenerObject, useCapture?: boolean): void;
  removeEventListener(type: string, listener?: EventListenerOrEventListenerObject, useCapture?: boolean): void;
  onAfterDestroyPopup();
}

/** @internal */
interface QueryToken {
  readonly context: any;
  readonly sequence: number;
  readonly filter: string;
}

/** @internal */
class ViewportManager {
  private _scrollSourceFilter: ScrollSourceFilterProvider;
  private _scrollListener: ScrollListener;
  private _keyUpThrottle: EventThrottle;
  private _injector: ReflectiveInjector;
  private _inputKeyEventHandler: any;
  private _isLtrText: boolean;
  private _src: InputRef;
  private _ref: ViewContainerRef;
  private _popupComp: ComponentRef<AutocompletePopup>;
  private _popup: any;
  private _cancelIconComp: ComponentRef<CancelIcon>;
  private _cancelIcon: any;
  private _itemsEl: any;
  private _items: any[] = null;
  private _compressionLimit: number;
  private _limitOverride: boolean;
  private _trimAbove: number;
  private _trimBelow: number;
  private _floatAbove: number;
  private _floatBelow: number;
  private _autoMinWidth: boolean;
  private _autoSizeCancel: boolean;
  private _cancelText: string;
  private _delaying: boolean = false;
  private _active: boolean = false;
  private _concealed: boolean = false;
  private _cancelVisible: boolean = false;
  private _cursor: number = -1;

  constructor(private _coordinator: CoordinatorImp, scrollSourceFilter: ScrollSourceFilterProvider, private _resolver: ComponentFactoryResolver) {
    this._scrollSourceFilter = scrollSourceFilter != null ? scrollSourceFilter : new DefaultScrollSourceFilterProvider();
    this._isLtrText = TextDirectionHelper.GetDocumentTextDirection() == "ltr";
    this._injector = ReflectiveInjector.resolveAndCreate([<ValueProvider>{ provide: AutocompleteController, useValue: this._coordinator.controller }]);
    this._inputKeyEventHandler = (e: Event) => { this.setCancelVisibility(false); this._keyUpThrottle.registerEvent(e); };
  }

  public tryAssignViewContainer(ref: ViewContainerRef): boolean {
    if (this._ref != null) return false;
    this._ref = ref;
    return true;
  }

  public get popupComp(): ComponentRef<AutocompletePopup> {
    return this._popupComp;
  }

  public get viewContainer(): ViewContainerRef {
    return this._ref;
  }

  public get isConcealed(): boolean {
    return this._concealed;
  }

  public get isActive(): boolean {
    return this._active;
  }

  public set isActive(value: boolean) {
    if (this._active === value) return;
    this._active = value;
    if (this._popup)
      this.setVisibility(value && !this.isConcealed);
  }

  public get cursor(): number {
    return this._cursor;
  }

  public get cursorActive(): boolean {
    return this._cursor >= 0;
  }

  public getCreateData(): any {
    if (!this._popupComp)
      return null;
    return this._popupComp.instance.getCreateData();
  }

  public createPopup(src: InputRef) {
    if (this._popupComp != null) throw ExceptionFactory.InvalidOperation("An existing popup instance is already created.");
    this._src = src;

    this._popupComp = this.createSubcomponent(AutocompletePopup);
    this._popup = this._popupComp.location.nativeElement;

    this._popupComp.instance.initPopup(this._coordinator.mouseHandler, this._src.getTypeset());
    this._src.addEventListener("keyup", this._inputKeyEventHandler);

    let style = new ComputedStyleHelper(this._popup);
    this._compressionLimit = style.getPixels("--compression-limit", "50%");
    this._limitOverride = style.getBoolean("--compression-limit-override", true);
    this._trimAbove = style.getPixels("--trim-above");
    this._trimBelow = style.getPixels("--trim-below");
    this._floatAbove = style.getPixels("--float-above");
    this._floatBelow = style.getPixels("--float-below");
    this._autoMinWidth = style.getBoolean("--auto-min-width", true);
    this._autoSizeCancel = style.getBoolean("--auto-size-cancel", true);
    this._cancelText = style.getText("--cancel-text", "X");

    this._scrollListener = new ScrollListener(
      src.hostElement,
      ScrollEventTargetCollection.auto(src.hostElement, this._scrollSourceFilter.getFilter().filterFunction),
      (sender, args) => { this.onScroll(args) },
      {
        traceFunction: (s, e) => { this.onScrollTrace(s, e); },
        throttleDuration: style.getNumber("--scroll-throttle-duration", 150, 0)
      });
    this._keyUpThrottle = new EventThrottle((sender, e) => { this.setCancelVisibility(true); },
      { suppressActive: true, throttleDuration: style.getNumber("--cancel-delay", 1000, 0) });

    this.setCancelVisibility(false);

    if (!src.openOnFocus)
      return;

    let openDelay = style.getNumber("--open-delay", 700, 0);
    if (openDelay == 0) {
      this.setCancelVisibility(true);
    }
    else {
      this._delaying = true;
      setTimeout((src) => {
        if (this._src == src) {
          this._delaying = false;
          this.updatePopup(this._items);
          this.setCancelVisibility(true);
        }
      }, openDelay, src);
    }
  }

  public destroyPopup() {
    if (this._popupComp == null) return;
    this._scrollListener.destroy();
    this._scrollListener = null;

    this._keyUpThrottle.enabled = false;
    this._keyUpThrottle = null;

    this._itemsEl = null;
    this._items = null;
    this._cursor = -1;
    this._popup = null;
    this._cancelIcon = null;
    this._delaying = false;
    this._active = false;
    this._concealed = false;
    this._cancelVisible = false;

    this._src.removeEventListener("keyup", this._inputKeyEventHandler);

    this._popupComp.destroy();
    this._popupComp = null;

    if (this._cancelIconComp) {
      this._cancelIconComp.destroy();
      this._cancelIconComp = null;
    }

    try {
      this._src.onAfterDestroyPopup();
    }
    finally {
      this._src = null;
    }
  }

  updatePopup(items: any[]) {
    this._items = items;
    if (this._delaying) return; // Await the open-delay timer
    this._cursor = -1;
    let val = this._coordinator.inputValue;
    this.isActive = (items && items.length > 0) || val.length > 0 && this._coordinator.hasChanges;
    if (!this.isActive) return;

    let comp = this.popupComp.instance;
    comp.showInput = this.computeShowInput();
    comp.input = val;
    comp.items = items;
    this.setCancelVisibility(true);
    this.popupComp.changeDetectorRef.detectChanges();
    this._cancelIconComp.changeDetectorRef.detectChanges();
    this.refresh();
  }

  public concealPopup() {
    if (this._popup != null) {
      if (this._active) {
        this.setVisibility(false);
      }
      this._concealed = true;
    }
  }

  public revealPopup() {
    if (this._popup != null) {
      if (this._active) {
        this.setVisibility(true);
      }
      this._concealed = false;
    }
  }

  public moveCursor(inc: boolean) {
    if (inc) this.incCursor(); else this.decCursor();
  }

  private incCursor() {
    if (this._items == null || this._items.length == 0)
      return;

    this._cursor++;
    if (this._cursor >= this._items.length)
      this._cursor = 0;

    this.applyCursor();
  }

  private decCursor() {
    if (this._items == null || this._items.length == 0)
      return;

    this._cursor--;
    if (this._cursor < 0)
      this._cursor = this._items.length - 1;

    this.applyCursor();
  }

  public resetCursor() {
    this._cursor = -1;
    this.applyCursor();
  }

  /** @internal */
  private applyCursor() {
    let v = this._src.getDisplayText(this._items[this._cursor], false);
    if (v == null) v = "";
    this._coordinator.setCursorValue(v);
    if (!this.isActive)
      this.isActive = true;
  }

  private computeShowInput(): boolean {
    if (!this._src.allowCreate)
      return false;

    let items = this._items;
    if (!items || items.length == 0)
      return true;

    let val = this._coordinator.inputValue.toLocaleLowerCase();
    if (val.length == 0)
      return false;
    let f = this._coordinator.controller.getDisplayText;
    for (let item of items)
      if (f(item, false).toLocaleLowerCase() == val)
        return false;

    return true;
  }

  private onScrollTrace(sender: ScrollListener, event: Event) {
    // Conceal the cancel icon immediately upon the first scroll event in the active sequence.
    if (sender.backlog == 0)
      this.setCancelVisibility(false);
  }

  private refresh() {
    if (this._popup == null || window == null) return;
    let r = this._coordinator.inputElement.getBoundingClientRect();

    if (this._autoMinWidth)
      this._popup.style.minWidth = r.width + "px";
    // We favour displaying the popup below the bound input, however IF the available space below the input is less than the compression limit
    // AND the available space above the input is greater than the available space below it, THEN the popup is positioned above the input.
    // let above = pos.targetTop - this._trimAbove - this._floatAbove;
    // let below = window.innerHeight - pos.targetBottom - this._trimBelow - this._floatBelow;
    let above = r.top - this._trimAbove - this._floatAbove;
    let below = window.innerHeight - r.bottom - this._trimBelow - this._floatBelow;

    let popupRect: ClientRect;
    if (below >= this._compressionLimit || above <= below) {
      this._popup.style.top = (r.bottom + this._floatBelow) + "px";
      let height = Math.max(below, this._compressionLimit);
      if (height > below && this._limitOverride)
        height = below;

      this.itemsElement.style.maxHeight = (height - this.resolveInputAreaHeight()) + "px";
      popupRect = this._popup.getBoundingClientRect();
    }
    else {
      let height = Math.max(above, this._compressionLimit);
      if (height > above && this._limitOverride)
        height = above;

      this.itemsElement.style.maxHeight = (height - this.resolveInputAreaHeight()) + "px";
      // The popup must first be displayed so that its size can be calculated before applying the top coordinate.
      this._popup.style.top = "0px";
      popupRect = this._popup.getBoundingClientRect();
      // ... it is then repositioned to float above the input element
      this._popup.style.top = (r.top - popupRect.height - this._floatAbove) + "px";
      // this._popup.style.top = (r.top - popupRect.height + window.scrollY - this._floatAbove) + "px";
    }

    // Horizontal Alignment (includes support for ltr/rtl languages)
    if (r.width > 0) {
      if (this._isLtrText) {
        if (popupRect.width / window.innerWidth > 0.8) {
          this.alignCentreWindow(popupRect);
        }
        else if (r.left < 0) {
          this.alignLeftViewport();
        }
        else if (r.right > window.innerWidth) {
          this.alignRightViewport(popupRect);
        }
        else if (popupRect.width + r.left < window.innerWidth) {
          this.alignLeftInput(r);
        }
        else if (r.right - popupRect.width > 0) {
          this.alignRightInput(r, popupRect);
        }
        else {
          this.alignCentreWindow(popupRect);
        }
      }
      else {
        if (popupRect.width / window.innerWidth > 0.8) {
          this.alignCentreWindow(popupRect);
        }
        else if (r.left < 0) {
          this.alignLeftViewport();
        }
        else if (r.right > window.innerWidth) {
          this.alignRightViewport(popupRect);
        }
        else if (r.right > window.innerWidth) {
          this.alignRightViewport(popupRect);
        }
        else if (r.right - popupRect.width > 0) {
          this.alignRightInput(r, popupRect);
        }
        else if (popupRect.width + r.left < window.innerWidth) {
          this.alignLeftInput(r);
        }
        else {
          this.alignCentreWindow(popupRect);
        }
      }
    }
  }

  private alignCentreWindow(popupRect: ClientRect) {
    this._popup.style.left = Math.abs((window.innerWidth - popupRect.width) / 2) + "px";
  }

  private alignLeftInput(inputRect: ClientRect) {
    this._popup.style.left = (inputRect.left) + "px";
  }

  private alignRightInput(inputRect: ClientRect, popupRect: ClientRect) {
    this._popup.style.left = (inputRect.right - popupRect.width) + "px";
  }

  private alignLeftViewport() {
    this._popup.style.left = "0px";
  }

  private alignRightViewport(popupRect: ClientRect) {
    this._popup.style.left = (window.innerWidth - popupRect.width) + "px";
  }

  private onScroll(args: ScrollListenerEventArgs) {
    if (args.intersectsScope) {
      if (this.isConcealed)
        this.revealPopup();
      this.refresh();
      if (!args.scrolling)
        this.setCancelVisibility(true);
    }
    else if (!this.isConcealed)
      this.concealPopup();
  }

  private setCancelVisibility(visible: boolean) {
    if (this._cancelVisible == visible)
      return;

    if (visible && !this._cancelIconComp) {
      this._cancelIconComp = this.createSubcomponent(CancelIcon);
      this._cancelIcon = this._cancelIconComp.location.nativeElement;
      this._cancelIconComp.instance.initCancelIcon(this._coordinator.mouseHandler);
      // Invocation of detectChanges is necessary for an accurate calculation of the size and position.
      this._cancelIconComp.instance.text = this._cancelText;
      this._cancelIconComp.changeDetectorRef.detectChanges();
      if (this._autoSizeCancel) {
        this._cancelIcon.style.width = "auto";
        this._cancelIcon.style.minWidth = this._cancelIcon.style.height = this._coordinator.inputElement.getBoundingClientRect().height + "px";
      }
    }

    this._cancelVisible = visible;

    if (!this._cancelIcon)
      return;

    if (visible) {
      this._cancelIcon.style.display = "block";
      this.refreshCancelIcon();
    }
    else {
      this._cancelIcon.style.display = "none";
    }
  }

  private refreshCancelIcon() {
    let r = this._coordinator.inputElement.getBoundingClientRect();
    let rect = this._cancelIcon.getBoundingClientRect();
    if (this._autoSizeCancel)
      this._cancelIcon.style.top = (r.top + window.scrollY) + "px";
    else
      this._cancelIcon.style.top = (r.top - ((rect.height - r.height) / 2) + window.scrollY) + "px";
    this._cancelIcon.style.left = (this._isLtrText ? r.right - rect.width : r.left) + "px";
  }

  private setVisibility(visible: boolean) {
    if (visible) {
      this._popup.style.display = "block";
      this._keyUpThrottle.registerEvent();
    }
    else {
      this._popup.style.display = "none";
    }
  }

  private createSubcomponent<T>(c: Type<T>): ComponentRef<T> {
    let factory = this._resolver.resolveComponentFactory(c);
    let comp = this.viewContainer.createComponent(factory, null, this._injector);
    return comp;
  }

  private get itemsElement(): any {
    if (this._itemsEl == null)
      this._itemsEl = this.findNodeByClass(this._popup, "autocomplete-items");

    return this._itemsEl;
  }

  private resolveInputAreaHeight(): number {
    let node = this.findNodeByClass(this._popup, "autocomplete-input");
    return node != null ? node.getBoundingClientRect().height : 0;
  }

  private findNodeByClass(node: any, className: string) {
    while (node != null) {
      if (node.className == className)
        return node;

      let result = this.findNodeByClass(node.firstChild, className);
      if (result != null)
        return result;

      node = node.nextSibling;
    }

    return null;
  }
}

/** @internal */
enum BlurHandlerState {
  Inactive = 0,
  Active = 1,
  Refocus = 2
}

/** @internal */
class ComputedStyleHelper {
  private _style: CSSStyleDeclaration;

  constructor(component: any) {
    this._style = window.getComputedStyle(component);
  }

  get style(): CSSStyleDeclaration {
    return this._style;
  }

  getText(propName: string, defaultVal?: string): string {
    if (!this._style) return defaultVal;
    const value = this._style.getPropertyValue(propName);
    if (value == null || value.length == 0)
      return defaultVal;

    return value;
  }

  getBoolean(propName: string, defaultVal?: boolean): boolean {
    if (!this._style) return defaultVal;
    const value = this._style.getPropertyValue(propName);
    if (value == null || value.length == 0)
      return defaultVal;

    return value.trim().toLowerCase() == "true";
  }

  getPixels(propName: string, defaultVal?: string): number {
    //// TODO: Need to bind to window.onresize to ensure correct sizes in the event % values are used
    if (!this._style) return 0;

    let value = this._style.getPropertyValue(propName)
    if (value == null || value.length == 0)
      value = defaultVal != null ? defaultVal : "0px";

    value = value.trim();
    if (value.length == 0)
      return 0;

    let result = parseInt(value.trim());
    if (isNaN(result))
      return 0;

    if (value.endsWith("px"))
      return result;

    if (value.endsWith("%"))
      return Math.abs(result / 100 * window.innerHeight);

    return 0;
  }

  getNumber(propName: string, defaultVal?: number, min?: number): number {
    if (!this._style) return defaultVal;

    let value = this._style.getPropertyValue(propName)
    if (defaultVal == null) defaultVal = 0;
    if (value == null || value.length == 0)
      return defaultVal;

    value = value.trim();
    if (value.length == 0)
      return defaultVal;

    let result = parseInt(value.trim());
    result = isNaN(result) ? defaultVal : result;

    return min != null ? Math.max(min, result) : result;
  }
}

/** @internal */
class TextDirectionHelper {
  public static GetDocumentTextDirection() {
    if (document == null) return "ltr";
    let els: any = document.getElementsByTagName("html");
    if (els.length < 1)
      return "ltr";

    return TextDirectionHelper.GetTextDirection(els[0]);
  }

  public static GetTextDirection(element: HTMLElement): string {
    if (element == null) throw ExceptionFactory.ArgumentNull("element");
    if (window == null) return "ltr";
    let style = window.getComputedStyle(element);

    return style != null && style.direction == "rtl" ? "rtl" : "ltr";
  }
}

class ClosureFactory {
  static createQueryToken(context: any, sequence: number, filter: string): QueryToken {
    return {
      get context(): any { return context; },
      get sequence(): number { return sequence; },
      get filter(): string {
        return filter;
      }
    }
  }
}