import { Directive, ElementRef } from '@angular/core';

/**
 * The AutocompleteStyles directive should be applied to an ng-template element (using the autocomplete-styles selector) immediately below the root application component to declare the default styles for the autocomplete component.
 * 
 * 
 * Example usage: <ng-template autocomplete-styles></ng-template>
 * 
 *  
 * The styles are applied in this manner so as to allow them to be easily overriden at application, page, or sub-component level
 * (which is not possible using encapsulated angular styles without having to use the CSS !important directive).
 * @class AutocompleteStyles
 */
@Directive({
  selector: '[autocomplete-styles]'
})
export class AutocompleteStyles {
  constructor(ref: ElementRef) {
    let e = ref.nativeElement;
    if (e != null) {
      e.data = "Base styles for the @brycemarshall/autocomplete-angular component";
      let n = document.createElement("style");
      n.innerHTML = AutocompleteStyles.getStyleInnerHTML();
      e.parentNode.insertBefore(n, e.nextSibling);
    }
  }

  public static getStyleInnerHTML() {
    return ".cancel-icon { transform:scale(1); z-index:10008; width: 25px; height: 25px; } .cancel-icon button { background-color: royalblue; opacity: 0.5; color: white; font-family: Verdana, Geneva, Tahoma, sans-serif; font-size: 12px; width: inherit; height: inherit; text-align: center; border: none; }\r\n"
      + ".autocomplete-popup { transform:scale(1); z-index:10007; background-color: #ffffff; border: 1px solid #dedede; max-width:100%; opacity: 1; }\r\n"
      + ".autocomplete-wrapper .autocomplete-button { text-transform: none; display: block; padding: 8px 12px; text-align: center; text-decoration: none; background-color: inherit; font-size: larger; width: 100%; border: 0px; }\r\n"
      + ".autocomplete-items .autocomplete-button { color: royalblue; text-align: start; }\r\n"
      + ".autocomplete-items .autocomplete-button[autocomplete-cursor] { background-color: #e5e5e5;}\r\n"
      + ".autocomplete-input { border-bottom: 1px solid #dedede; }\r\n"
      + ".autocomplete-items { position: relative; overflow: auto;\r\n}";
  }
}