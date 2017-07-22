import { Component, ComponentFactoryResolver, ComponentRef, Directive, HostListener, ViewChild, ViewContainerRef, ViewEncapsulation } from '@angular/core';
import { AutocompleteController } from '../autocomplete-controller';
import { MouseEventHandler } from '../mouse-event-handler';
import { AutocompleteTypeset } from '../autocomplete-type-provider';
import { AutocompleteCreateComponent } from '../autocomplete-create-component';
import { AutocompleteListComponent } from '../autocomplete-list-component';

@Directive({
    selector: '[create-host]',
})
export class CreateDirective {
    constructor(public viewContainerRef: ViewContainerRef) { }
}

@Directive({
    selector: '[list-host]',
})
export class ListDirective {
    constructor(public viewContainerRef: ViewContainerRef) { }
}

@Component({
    selector: 'autocompletepopup',
    template: '<div class="autocomplete-wrapper"><div #inputHost class="autocomplete-input"><button *ngIf="!hasCustomCreate" class="autocomplete-button" (click)="onCreate()">{{input}}</button><ng-template *ngIf="hasCustomCreate" create-host></ng-template></div><div *ngIf="!hasCustomList" class="autocomplete-items"><button *ngFor="let item of items; let i = index" class="autocomplete-button" [attr.autocomplete-cursor]="i == cursor ? true : null" (click)="onSelect(item)">{{getDisplayValue(item)}}</button></div><div *ngIf="hasCustomList" class="autocomplete-items"><ng-template list-host></ng-template></div></div>',
    encapsulation: ViewEncapsulation.None,
    host: {
        class: "autocomplete-popup",
        style: "position:fixed;display:none;"
    }
})
export class AutocompletePopup {
    /** @internal */
    private _controller: AutocompleteController;
    /** @internal */
    private _mouseHandler: MouseEventHandler;
    /** @internal */
    private _typeset: AutocompleteTypeset;
    /** @internal */
    @ViewChild("inputHost") private inputHost: any;
    /** @internal */
    @ViewChild(CreateDirective) private createHost: CreateDirective;
    /** @internal */
    @ViewChild(ListDirective) private listHost: ListDirective;
    /** @internal */
    private _createProxy: AutocompleteCreateComponent;
    /** @internal */
    private _listProxy: AutocompleteListComponent;
    /** @internal */
    private _showInput: boolean = false;

    constructor(controller: AutocompleteController, private _componentFactoryResolver: ComponentFactoryResolver) {
        this._controller = controller;
        this._createProxy = new LocalCreateProxy();
        this._listProxy = new LocalListProxy();
    }

    initPopup(mouseHandler: MouseEventHandler, typeset: AutocompleteTypeset) {
        this._mouseHandler = mouseHandler;
        this._typeset = typeset;
    }

    ngAfterViewInit() {
        // Note that initPopup must be invoked before this method.
        this.applyInputVisibility();

        if (!this._typeset)
            return;

        if (this._typeset.createType)
            this._createProxy = new ExternalCreateProxy(this._createProxy.input, this._typeset.createType, this.createHost.viewContainerRef, this._componentFactoryResolver);

        if (this._typeset.listType)
            this._listProxy = new ExternalListProxy(this._listProxy.items, this._typeset.listType, this.listHost.viewContainerRef, this._componentFactoryResolver);
    }

    get input(): string {
        return this._createProxy.input;
    }

    set input(value: string) {
        this._createProxy.input = value;
    }

    get showInput(): boolean {
        return this._showInput;
    }

    get cursor(): number {
        return this._controller.cursor;
    }

    set showInput(value: boolean) {
        if (this._showInput == value)
            return;

        this._showInput = value;
        this.applyInputVisibility();
    }

    get items(): any[] {
        return this._listProxy.items;
    }

    set items(value: any[]) {
        this._listProxy.items = value;
    }

    get hasCustomCreate(): boolean {
        return this._typeset && this._typeset.createType != null;
    }

    get hasCustomList(): boolean {
        return this._typeset && this._typeset.listType != null;
    }

    getCreateData(){
        return this._createProxy.getCreateData();
    }

    onCreate() {
        this._controller.resolveAndAssignItem(this.input);
    }

    onSelect(item: any) {
        this._controller.assignItem(item);
    }

    getDisplayValue(item: any): string {
        return this._controller.getDisplayText(item, true);
    }

    /** @internal */
    @HostListener('mousedown', ['$event'])
    onMouseDown(e: UIEvent) {
        this._mouseHandler.onMouseDown(e);
    }

    private applyInputVisibility() {
        if (this.inputHost)
            this.inputHost.nativeElement.style.display = this._showInput ? "block" : "none";
    }
}

/** @internal */
class LocalCreateProxy implements AutocompleteCreateComponent {
    input: string;

    getCreateData(): any {
        return null;
    }
}

/** @internal */
class LocalListProxy implements AutocompleteListComponent {
    items: any[];
}

/** @internal */
class ExternalCreateProxy implements AutocompleteCreateComponent {
    private _comp: ComponentRef<AutocompleteCreateComponent>;

    constructor(initialValue: string, type: any, ref: ViewContainerRef, componentFactoryResolver: ComponentFactoryResolver) {
        let f = componentFactoryResolver.resolveComponentFactory<AutocompleteCreateComponent>(type);
        ref.clear();
        this._comp = ref.createComponent(f);
        this._comp.instance.input = initialValue;
        this._comp.changeDetectorRef.detectChanges();
    }

    get input(): string {
        return this._comp.instance.input;
    }

    set input(value: string) {
        this._comp.instance.input = value;
    }

    getCreateData(): any {
        return this._comp.instance.getCreateData();
    }    
}

/** @internal */
class ExternalListProxy implements AutocompleteListComponent {
    private _comp: ComponentRef<AutocompleteListComponent>;

    constructor(initialValue: any[], type: any, ref: ViewContainerRef, componentFactoryResolver: ComponentFactoryResolver) {
        let f = componentFactoryResolver.resolveComponentFactory<AutocompleteListComponent>(type);
        ref.clear();
        this._comp = ref.createComponent(f);
        this._comp.instance.items = initialValue;
        this._comp.changeDetectorRef.detectChanges();
    }

    get items(): any[] {
        return this._comp.instance.items;
    }

    set items(value: any[]) {
        this._comp.instance.items = value;
    }
}
