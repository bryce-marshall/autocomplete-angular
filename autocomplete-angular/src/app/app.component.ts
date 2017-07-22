import { Component, ChangeDetectorRef, ViewEncapsulation } from '@angular/core';
import { AutocompleteResolveData, AutocompleteResolveFunction, AutocompleteTypeProvider, AutocompleteTypeset } from './autocomplete/index';
import { CustomCreate, CustomList } from './custom-autocomplete/custom-autocomplete.module';
import { Colour, ColourManager } from './lib/colour-manager';
import { QueryProvider } from './lib/query-provider';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  encapsulation: ViewEncapsulation.None,
  providers: [AutocompleteTypeProvider]
})
export class AppComponent {
  private _colour: Colour = null;
  public openOnFocus = true;
  public autoAssign = "";
  public customCreate = false;
  public customList = false;
  private _colours: Colour[];
  private _scrollHeight: number;

  private _colourManager: ColourManager = new ColourManager();

  constructor(typeProvider: AutocompleteTypeProvider, private ref: ChangeDetectorRef) {
    typeProvider.add("Both", new AutocompleteTypeset(CustomCreate, CustomList));
    typeProvider.add("Create", new AutocompleteTypeset(CustomCreate, null));
    typeProvider.add("List", new AutocompleteTypeset(null, CustomList));
  }

  ngOnInit() {
    window.addEventListener("resize", (e) => {
      this.setScrollHeight();

    });

    this.setScrollHeight();
  }

  setScrollHeight() {
    // console.log("window.innerHeight = " + window.innerHeight);
    let hHeight = parseInt(window.getComputedStyle(document.getElementById("header")).height);
    this._scrollHeight = window.innerHeight - hHeight - 65;
    this.ref.detectChanges();
    document.getElementById("input-element").scrollIntoView();
    //document.getElementById("scroll-container").scrollTop -= 10;
  }

  get scrollHeight(): number {
    return this._scrollHeight;
  }

  get queryFn() {
    return this._colourManager.queryColoursFn;
  }

  get resolveFn() {
    return this._colourManager.resolveColourFn;
  }

  get colour(): Colour {
    return this._colourManager.colour;
  }

  set colour(value: Colour) {
    this._colourManager.colour = value;
  }

  get typeKey(): string {
    if (this.customCreate && this.customList) return "Both";
    if (this.customCreate) return "Create";
    if (this.customList) return "List";

    return "";
  }

  onSetColour() {
    this._colourManager.nextColour();
  }

  private _city: string = "";
  get queryCitiesFn() {
    return QueryProvider.queryCitiesFn();
  }

  get city(): string {
    return this._city;
  }

  set city(value: string) {
    console.log("A city with value \"" + value + "\" was applied");
  }  

  private _currency: any = null;

  get queryCurrenciesFn() {
    return QueryProvider.queryCurrenciesFn();
  }

  get currency(): any {
    return this._currency;
  }

  set currency(value: any) {
    let alert = value !== this._currency;
    this._currency = value;
    if (alert)
      if (value == null)
        console.log("A null value was applied");
    else
      console.log('The currency "' + value.name + '" having the code "' + value.code + '" was selected');
  }

  get currencyCode(): string {
    return this._currency != null ? this._currency.code : "";
  }

  get formatCurrencyFn() {
    return (item: any, descriptive: boolean): string => {
      if (item == null) return "";
      if (descriptive)
        return item.code + " (" + item.name + ")";

      return item.code;
    };
  }

  get resolveCurrencyFunction(): AutocompleteResolveFunction {
    return (data: AutocompleteResolveData) => {
      let v = data.inputValue.toLowerCase();
      let results = QueryProvider.queryCurrencies(v);
      if (results.length == 0) return false;

      for (let c of results) {
        if (c.code.toLowerCase() != v && c.name.toLowerCase() != v) continue;
        data.resolvedValue = c;
        break;
      }
      return data.resolvedValue != null;
    };
  }  
}
