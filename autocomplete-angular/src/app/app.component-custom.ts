import { Component, ViewEncapsulation } from '@angular/core';
import { AutocompleteQueryMediator, BindQueryProcessorFunction, AutocompleteTypeProvider, AutocompleteTypeset } from './autocomplete/index';
import { CustomCreate, CustomList } from './custom-autocomplete/custom-autocomplete.module';
import { Colour } from './lib/colour-query-provider';
import { ColourManager } from './lib/colour-manager';

@Component({
    selector: 'app-root',
    templateUrl: './app.component-custom.html',
    styleUrls: ['./app.component.css'],
    encapsulation: ViewEncapsulation.None,
    providers: [AutocompleteTypeProvider]
})
export class AppComponentCustom {
    private _cman: ColourManager = new ColourManager();

    constructor(typeProvider: AutocompleteTypeProvider) {
        typeProvider.add("CustomColour", new AutocompleteTypeset(CustomCreate, CustomList));
    }

    get bindColoursQueryProc(): BindQueryProcessorFunction {
        // Returns a function that the Autocomplete runtime will invoke to bind an active control to a query processor after it has
        // received focus and before its first suggestion query. The same fuction reference will be used until the control loses focus
        // and the AutocompleteQueryMediator is destroyed.
        return (mediator: AutocompleteQueryMediator) => {
            mediator.subscribeFn((sender: AutocompleteQueryMediator, token: any, filter: string) => {
                //  Retrieve the filtered result. Note that result could equally be resolved asynchronously.
                let result = this._cman.queryColoursFn(filter);
                // Alert the mediator to the result.
                sender.onResult(token, result);
            });
        }
    }

    get resolveColourFn() {
        // Returns a reference to the function that returns the existing object instance (or creates a new instance) for a specific input control value.
        // See the ColourManager source for an example of how to handle the case where a new object must be created.
        return this._cman.resolveColourFn;
    }

    get colour(): Colour {
        return this._cman.colour;
    }

    set colour(value: Colour) {
        this._cman.colour = value;
    }
}