# @brycemarshall/autocomplete-angular

Attaches Google-style autocomplete behaviour to a standard HTML INPUT control.
The behaviour is implemented as an Angular directive that is applied to the INPUT markup element. 

The component popup can be styled using CSS, and customised using custom create and list sub-components.

See the package type-definition files for detailed usage and type documentation.

# Demo

http://plnkr.co/LywhBdi0R4AyXEf5xyHw

# Installation

npm i @brycemarshall/autocomplete-angular

# Usage - Applying the CSS Stylesheets

The styles for the autocomplete control are written to the DOM by applying an AutocompleteStyles directive to an ng-template markup element.
This implementation ensures that autocomplete styles can be overridden in standard CSS form at any level in the DOM below the AutocompleteStyles declaration (whether globally, at page level, or within individual components).

# CSS Configuration

The default CSS values are shown below, and may be overridden.

``` scss

.autocomplete-popup
 {
    transform:scale(1);
    z-index:10007;
    background-color: #ffffff;
    border: 1px solid #dedede;
    max-width:100%;
    opacity: 1;
    /* 
    true|false - If true, automatically sets the min-width style property of the popup element to the explicit computed width of the bound active input element.
    The default value is 'true'. 
    */    
    --auto-min-width: true;
    /* 
    The height that will be trimmed off the maximum available popup height when it is displayed in the upper position.
    The popup height will not be trimmed below the specified compression limit.
    */
    --trim-above: 0px;
    /* 
    The height that will be trimmed off the maximum available popup height when it is displayed in the lower position.
    The popup height will not be trimmed below the specified compression limit.
    */
    --trim-below: 0px;
    /* The height that the popup will float above the input when displayed in the upper position  */
    --float-above: 0px;
    /* The height  that the popup will float below the input when displayed in the lower position  */
    --float-below: 0px;
    /* 
    The lowest height that the popup will be compressed to before the lower position loses priority.
    Note that --compression-limit will still be overridden when the available viewport area is too small to contain it,
    unless --compression-limit-override is set to false. The default value is 50%.
    */
    --compression-limit: 50%;
    /* 
    true|false - Enables overriding of the compression limit when the available viewport area is so small that popup would otherwise be forced to extend beyond it */
    --compression-limit-override: true;
    /* 
    The delay, in milliseconds, between the bound input element receiving focus and the popup opening. The default is 700 milliseconds.
    This  can be useful to prevent initial popup jitter and resizing if the UI automatically scrolls the input element 
    into an optimal viewport position upon it receiving focus.
    */
    --open-delay: 700;
    /*
    When specified, defines the duration (in milliseconds) of the minimum enforced delay between each processed scroll event in a sequence.
    The default value  is 150 milliseconds).
    */    
    --scroll-throttle-duration: 150;
    /*
    The text to render in the cancel icon. The default value is 'X'.
    */
    --cancel-text: X;
    /* 
    true|false - If true, automatically sizes the cancel icon in both dimensions to correspond with the height of the active input element
    The default value is 'true'. 
    */
    --auto-size-cancel: true;
    /* 
    The delay, in milliseconds, between the last input element keyup event in any given sequence and the cancel icon appearing. The default is 1000 milliseconds.
    */
    --cancel-delay: 1000;    
}

.autocomplete-wrapper .autocomplete-button {
    text-transform: none;
    display: block;
    padding: 8px 12px;
    text-align: center;
    text-decoration: none;
    background-color: inherit;
    font-size: larger;
    width: 100%;
    border: 0px;
}

.autocomplete-items .autocomplete-button {
    color: royalblue;
    text-align: start;
}

.autocomplete-items .autocomplete-button[autocomplete-cursor] {
    background-color: #e5e5e5;
}

.autocomplete-input
{
    border-bottom: 1px solid #dedede;
}

.autocomplete-items
{
    position: relative;
    overflow: auto;
}

.cancel-icon {
    transform:scale(1);
    z-index:10008;
    width: 25px;
    height: 25px;
}

.cancel-icon button {
    background-color: royalblue;
    opacity: 0.5;
    color: white;
    font-family: Verdana, Geneva, Tahoma, sans-serif;
    font-size: 12px;
    width: inherit;
    height: inherit;
    text-align: center;
    border: none;
}

```

# Usage - AutocompleteModule Import

The Automcomplete Module is imported as follows (in this example using standard Angular app.module.ts). Such an import is required for all of the
subsequent usage examples.

``` ts
// FILE: app.module.ts
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { AppComponent } from './app.component';
// Import the Autocomplete Javascript module
import { AutocompleteModule } from '@brycemarshall/autocomplete-angular';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    // Import the Angular Autocomplete module into the NgModule
    AutocompleteModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }

```

# Usage - Basic

``` html
<!-- FILE: app.component.html -->
<ng-template autocomplete-styles></ng-template>
<div autocomp-container style="width:100%;">
    <label input>City</label>
    <input type="text" [(dataItem)]="city" [autocomp]="queryCitiesFn" [allowCreate]="false" />
</div>

```

``` ts
// FILE: app.component.ts
import { Component, ViewEncapsulation } from '@angular/core';
import { AutocompleteQueryMediator, BindQueryProcessorFunction } from '@brycemarshall/autocomplete-angular';
import { CityQueryProvider } from './lib/city-query-provider';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css'],
    encapsulation: ViewEncapsulation.None
})
export class AppComponent {
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

```

# Usage - Complex Datatype with allowCreate and autoComplete enabled

(see also the "Supporting Types for Demos" sections below)

``` html
<!-- FILE: app.component.html -->
<ng-template autocomplete-styles></ng-template>
<div autocomp-container style="width:100%;">
    <label input>Colour</label>
    <input type="text" [(dataItem)]="colour" [autocomp]="bindColoursQueryProc" [resolveFunction]="resolveColourFn" [allowCreate]="true" autoAssign="on" />
</div>

```

``` ts
// FILE: app.component.ts
import { Component, ViewEncapsulation } from '@angular/core';
import { AutocompleteQueryMediator, BindQueryProcessorFunction } from '@brycemarshall/autocomplete-angular';
import { Colour } from './lib/colour-query-provider';
import { ColourManager } from './lib/colour-manager';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css'],
    encapsulation: ViewEncapsulation.None
})
export class AppComponentColours {
    private _cman: ColourManager = new ColourManager();

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

```

# Usage - Custom Create and List Sub-Components

(see also the "Supporting Types for Demos" sections below)

The typeKey attribute is used in the markup to specify the custom AutocompleteTypeset from which the types for this instance are retrieved.

Note that typesets are named, but that it is possible to specify a custom global default typeset by adding a custom typeset to the injected AutocompleteTypeProvider instance using an empty string as the key. If a typeset with the specified key does not exist in the immediate 
injected AutocompleteTypeProvider instance, the autocomplete control will walk the branch of injected parent AutocompleteTypeProvider instances,
and finally throw an error if none can be found.

Note also that when adding a custom AutocompleteTypeset, type values (the custom create type and the custom list type) may be specified as null.
Specifying a null type will result in the autocomplete control falling back upon the default sub-component implementation.

```  html
<!-- FILE: app.component.html -->
<ng-template autocomplete-styles></ng-template>
<div autocomp-container style="width:100%;">
    <label input>Colour</label>
    <input type="text" [(dataItem)]="colour" [autocomp]="bindColoursQueryProc" typeKey="CustomColour" [resolveFunction]="resolveColourFn" [allowCreate]="true" autoAssign="on" />
</div>

```

``` ts
// FILE: app.component.ts
import { Component, ViewEncapsulation } from '@angular/core';
import { AutocompleteQueryMediator, BindQueryProcessorFunction, AutocompleteTypeProvider, AutocompleteTypeset } from '@brycemarshall/autocomplete-angular';
import { CustomCreate, CustomList } from './custom-autocomplete/custom-autocomplete.module';
import { Colour } from './lib/colour-query-provider';
import { ColourManager } from './lib/colour-manager';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
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

```

# Supporting Types for Demos - Query Providers

``` ts
// FILE: ./lib/query-filters.ts
export class QueryFilters {
    static stringFilter(filter: string, items: string[]) {
        return QueryFilters.genericFilter((filter: string, item: any, exact: boolean): boolean => {
            if (item == null) return false;
            return exact ? item.toLowerCase() == filter : item.toLowerCase().indexOf(filter) > -1;
        }, filter, items);
    }

    static genericFilter(filterFunction: Function, filter: string, items: any[]) {
        if (filter == null || filter.length == 0) return items;
        filter = filter.toLowerCase();

        let result = items;

        // if the value is an empty string don't filter the items
        if (filter && filter.trim() != '') {
            result = [];
            for (let item of items) {
                if (filterFunction(filter, item, false))
                    result.push(item);
            }
        }

        return result;
    }
}

// FILE: ./lib/city-query-provider.ts
import { QueryFilters } from './query-filters';

export class CityQueryProvider {
    public static queryCitiesFn(): Function {
        return (filter: string): string[] => {
            return CityQueryProvider.queryCities(filter);
        };
    }

    public static queryCities(filter: string): string[] {
        return QueryFilters.stringFilter(filter, CityQueryProvider.cities);
    }

    private static get cities(): string[] {
        return [
            'Amsterdam',
            'Auckland',
            'Bogota',
            'Buenos Aires',
            'Cairo',
            'Canberra',
            'Dhaka',
            'Edinburgh',
            'Geneva',
            'Genoa',
            'Glasglow',
            'Hanoi',
            'Hong Kong',
            'Islamabad',
            'Istanbul',
            'Jakarta',
            'Kiel',
            'Kyoto',
            'Le Havre',
            'Lebanon',
            'Lhasa',
            'Lima',
            'London',
            'Los Angeles',
            'Madrid',
            'Manila',
            'New York',
            'Olympia',
            'Oslo',
            'Panama City',
            'Peking',
            'Philadelphia',
            'San Francisco',
            'Seoul',
            'Sydney',
            'Taipeh',
            'Tel Aviv',
            'Tokio',
            'Uelzen',
            'Washington',
            'Wellington'
        ];
    }
}

// FILE: ./lib/colour-query-provider.ts
import { QueryFilters } from './query-filters';

export class Colour {
    private _name: string;
    private _rgb: string;

    constructor(name: string, rgb: string) {
        this._name = name;
        this._rgb = rgb;
    }

    get name(): string {
        return this._name;
    }

    get rgb(): string {
        return this._rgb;
    }

    toString() {
        return this._name;
    }
}

export class ColourQueryProvider {
    public static queryColoursFn(): Function {
        return (filter: string): Colour[] => {
            return ColourQueryProvider.queryColours(filter);
        };
    }

    public static queryColours(filter: string, colours?: Colour[]): Colour[] {
        if (colours == null)
            colours = ColourQueryProvider.colours;

        return QueryFilters.genericFilter((filter: string, item: Colour, exact: boolean): boolean => {
            if (item == null) return false;
            if (exact)
                return item.name == filter || item.name.toLowerCase() == filter;
            return item.name.toLowerCase().indexOf(filter) > -1 || item.name.toLowerCase().indexOf(filter) > -1;
        }, filter, colours);
    }

    private static get colours(): Colour[] {
        return [
            new Colour('Black', "#000000"),
            new Colour('Blue', "#0000FF"),
            new Colour('Green', "#008000"),
            new Colour('Grey', "#808080"),
            new Colour('Orange', "#FFA500"),
            new Colour('Pink', "#FFC0CB"),
            new Colour('Purple', "#800080"),
            new Colour('Red', "#FF0000"),
            new Colour('White', "#FFFFFF"),
            new Colour('Yellow', "#FFFF00")
        ];
    }
}

// FILE: ./lib/colour-manager.ts
import { AutocompleteResolveData, AutocompleteResolveFunction, AutocompleteTypeProvider, AutocompleteTypeset } from '../autocomplete/index';
import { Colour, ColourQueryProvider } from './colour-query-provider';

export class ColourManager {
    private _colour: Colour = null;
    private _colours: Colour[];

    constructor() {
        this._colours = ColourQueryProvider.queryColours("");
        this.sortColours();
    }

    get colour(): Colour {
        return this._colour;
    }

    set colour(value: Colour) {
        this._colour = value;
    }

    get queryColoursFn() {
        return (filter: string) => {
            return ColourQueryProvider.queryColours(filter, this._colours);
        }
    }

    get resolveColourFn() {
        return (data: AutocompleteResolveData) => {
            let cmpName = data.inputValue.toLowerCase();
            for (let c of this._colours) {
                if (c.name.toLowerCase() != cmpName) continue;
                data.resolvedValue = c;
                break;
            }

            if (data.resolvedValue == null && data.shouldCreate) {
                let rgb: number = data.data;
                if (rgb == null || isNaN(rgb))
                    rgb = Math.floor(Math.random() * 16777215);

                let colour = new Colour(data.inputValue, "#" + rgb.toString(16));
                this._colours = this._colours.concat(colour);
                this.sortColours();
                data.resolvedValue = colour;
            }

            return data.resolvedValue != null;
        }
    }

    nextColour() {
        let idx: number = 0;
        if (this._colour) {
            for (; idx < this._colours.length; idx++) {
                if (this._colours[idx].name != this._colour.name)
                    continue;
                idx++;
                break;
            }
        }

        if (idx >= this._colours.length)
            idx = 0;

        this._colour = this._colours[idx];
    }

    private sortColours() {
        this._colours.sort((a: Colour, b: Colour): number => { return a.name.localeCompare(b.name); })
    }
}

```

# Supporting Types for Demos - Custom Create and List Components
``` css
/* FILE: app.component.css */
body {
    font-family: Arial, Helvetica, sans-serif;
    color: #3f3f3f;
}
h1 {    
    font-size: 16px;
    text-align: center;
}
.autocomplete-popup {
    --float-above: 1px;
    --float-below: 1px;  
    --trim-above: 15px;
    --trim-below: 15px;
}

div.row {
    padding-top: 15px;
    padding-bottom: 15px;
    border-bottom: solid royalblue 1px;
}
label {
    font-size: smaller;
}
label[input]{
    font-size: smaller;
    font-weight: bold;
}

```

``` ts
// FILE: ./custom-autocomplete/custom-autocomplete.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomCreate } from './custom-create';
import { CustomList } from './custom-list';
export { CustomCreate } from './custom-create';
export { CustomList } from './custom-list';

@NgModule({
  declarations: [
    CustomCreate,
    CustomList
  ],
  imports: [
    CommonModule
  ],
  entryComponents:[CustomCreate, CustomList],  
  exports: [
    CustomCreate,
    CustomList
  ]
})
export class CustomAutocompleteModule {}

// FILE: ./custom-autocomplete/custom-create.ts
import { Component, ViewEncapsulation } from '@angular/core';
import { AutocompleteController, AutocompleteCreateComponent } from '@brycemarshall/autocomplete-angular';

@Component({
  selector: 'custom-create',
  templateUrl: 'custom-create.html',
  styleUrls: ['custom-create.scss'],
  encapsulation: ViewEncapsulation.None
})
export class CustomCreate implements AutocompleteCreateComponent {
  private _input: string;
  private _rgb: number = 0;

  constructor(private _controller: AutocompleteController) {
  }

  get input(): string {
    return this._input;
  }

  set input(value: string) {
    this._rgb = Math.floor(Math.random() * 16777215);
    this._input = value;
  }

  getCreateData(): any {
    return this._rgb;
  }

  onCreate() {
    this._controller.resolveAndAssignItem(this.input, this._rgb);
  }

  getBackgroundColor() {
    return "#" + this._rgb.toString(16);
  }
}

// FILE: ./custom-autocomplete/custom-list.ts
import { Component, ViewEncapsulation } from '@angular/core';
import { AutocompleteController, AutocompleteListComponent } from '@brycemarshall/autocomplete-angular';

@Component({
    selector: 'custom-list',
    templateUrl: 'custom-list.html',
    styleUrls: ['custom-list.scss'],
    encapsulation: ViewEncapsulation.None
})
export class CustomList implements AutocompleteListComponent {
    items: any[];

    text: string;

    constructor(private _controller: AutocompleteController) {
    }

    onSelect(item: any) {
        this._controller.assignItem(item);
    }

    getDisplayValue(item: any): string {
        return this._controller.getDisplayText(item, true);
    }
    
    get cursor(): number {
        return this._controller.cursor;
    }
}

```

``` scss
/* FILE: ./custom-autocomplete/custom-create.scss */
custom-create .swatch {
    width: 12px; 
    height: 12px;
    border: 1px solid black;
}

/* FILE: ./custom-autocomplete/custom-list.scss */
custom-list .swatch {
    width: 12px; 
    height: 12px;
    border: 1px solid black;
    float: right;
    margin-right: 12px;    
}

.autocomplete-items td[autocomplete-cursor] {
    background-color: #e5e5e5;
}

```

``` html
<!-- FILE: ./custom-autocomplete/custom-create.html -->
<table style="width:100%;border-collapse:collapse;">
    <tr>
        <td style="width:85%">
            <button class="autocomplete-button" (click)="onCreate()">{{input}}</button>
        </td>
        <td style="text-align: right;">
            <div class="swatch" [style.background-color]="getBackgroundColor()"></div>
        </td>
    </tr>
</table>

<!-- FILE: ./custom-autocomplete/custom-list.html -->
<table style="width:100%;border-collapse:collapse;" border="0" cellpadding="0">
    <tr *ngFor="let item of items; let i = index">
        <td style="width:85%">
            <button class="autocomplete-button" [attr.autocomplete-cursor]="i == cursor ? true : null" (click)="onSelect(item)">{{getDisplayValue(item)}}</button>
        </td>
        <td style="text-align: right;" [attr.autocomplete-cursor]="i == cursor ? true : null">
            <div class="swatch" [style.background-color]="item.rgb"></div>
        </td>
    </tr>
</table>
```