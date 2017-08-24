import { Component, ViewEncapsulation } from '@angular/core';
import { AutocompleteQueryMediator, BindQueryProcessorFunction } from './autocomplete/index';
import { CityQueryProvider } from './lib/city-query-provider';

@Component({
    selector: 'app-root',
    templateUrl: './app.component-async.html',
    styleUrls: ['./app.component.css'],
    encapsulation: ViewEncapsulation.None
})
export class AppComponentAsync {
    private _city: string = "";

    get bindCitiesQueryProc(): BindQueryProcessorFunction {
        // Returns a function that the Autocomplete runtime will invoke to bind an active control to a query processor after it has
        // received focus and before its first suggestion query. The same fuction reference will be used until the control loses focus
        // and the AutocompleteQueryMediator is destroyed.
        return (mediator: AutocompleteQueryMediator) => {
            mediator.subscribeFn((sender: AutocompleteQueryMediator, token: any, filter: string) => {
                //  Retrieve the filtered result. Note that result could equally be resolved asynchronously.
                let result = CityQueryProvider.queryCities(filter);
                // Alert the mediator to the result.
                setTimeout(() => {
                    sender.onResult(token, result);
                }, 300);
            });
        }
    }

    get city(): string {
        return this._city;
    }

    set city(value: string) {
        console.log("*** assigned value " + value);
        this._city = value;
    }    
}
