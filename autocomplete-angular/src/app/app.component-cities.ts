import { Component, ViewEncapsulation } from '@angular/core';
import { AutocompleteQueryMediator, BindQueryProcessorFunction } from './autocomplete/index';
import { CityQueryProvider } from './lib/city-query-provider';

@Component({
    selector: 'app-root',
    templateUrl: './app.component-cities.html',
    styleUrls: ['./app.component.css'],
    encapsulation: ViewEncapsulation.None
})
export class AppComponentCities {
    private city: string = "";

    get bindCitiesQueryProc(): BindQueryProcessorFunction {
        // Returns a function that the Autocomplete runtime will invoke to bind an active control to a query processor after it has
        // received focus and before its first suggestion query. The same fuction reference will be used until the control loses focus
        // and the AutocompleteQueryMediator is destroyed.
        return (mediator: AutocompleteQueryMediator) => {
            mediator.subscribeFn((sender: AutocompleteQueryMediator, token: any, filter: string) => {
                //  Retrieve the filtered result. Note that result could equally be resolved asynchronously.
                let result = CityQueryProvider.queryCities(filter);
                // Alert the mediator to the result.
                sender.onResult(token, result);
            });
        }
    }
}
