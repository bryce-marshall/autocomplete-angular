import { Component, HostListener, ViewEncapsulation } from '@angular/core';
import { AutocompleteController } from '../autocomplete-controller';
import { MouseEventHandler } from '../mouse-event-handler';

@Component({
    selector: 'cancel-icon',
    template: '<button (click)="cancel()">{{text}}</button>',
    encapsulation: ViewEncapsulation.None,
    host: {
        class: "cancel-icon",
        style: "position:fixed;"
    }
})
export class CancelIcon {
    /** @internal */
    private _controller: AutocompleteController;
    /** @internal */
    private _mouseHandler: MouseEventHandler;        
    /** @internal */
    private _text: string

    constructor(controller: AutocompleteController) {
        this._controller = controller;
    }

    initCancelIcon(mouseHandler: MouseEventHandler) {
        this._mouseHandler = mouseHandler;
    }
    
    get text(): string {
        return this._text != null ? this._text : "X";
    }

    set text(value: string) {
        this._text = value;
    }

    cancel() {
        this._controller.cancelEdit();
    }

        /** @internal */
    @HostListener('mousedown', ['$event'])
    onMouseDown(e: UIEvent) {
        this._mouseHandler.onMouseDown(e);
    }

    /** @internal */
    @HostListener('click', ['$event'])
    onClick(e: UIEvent) {
        this._mouseHandler.onClick(e);
    }        
}
