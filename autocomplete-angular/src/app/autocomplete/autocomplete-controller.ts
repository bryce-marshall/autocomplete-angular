/**
 * A class that exposes AutocompleteInput functionality to custom AutocompleteInput sub-components.
 * @class AutocompleteController
 */
export abstract class AutocompleteController {
    /**
     * Returns the current cursor index, or -1 if no cursor is active.
     * @property cursor
     */
    abstract get cursor(): number;
    /**
     * @method hidePopup - Hides the active popup instance
     */
    abstract hidePopup();
    /**
     * Passes input data to the client context to enable a value to be resolved or created and then assigned to the model.
     * @method resolveAndAssignItem
     * @param {string} inputValue Optional. The input value to be used when creating the data item. If not specified, then the value of the associated
     * input DOM element will be used.
     * @param {any} data Optional. Additional data describing the data item to be created.
     */
    abstract resolveAndAssignItem(inputValue?: string, data?: any);
    /**
     * Passes a data item selected from the UI to the client context to be assigned to the model.
     * @method applyItem
     * @param {any} item The data item to be assigned to the model.
     */
    abstract assignItem(item: any);
    /**
     * Cancels any current edits and returns the associated input element to its pre-edit state.
     * @method cancelEdit
     */
    abstract cancelEdit();
    /**
     * Gets the display text for the specified item.
     * @function getDisplayText
     * @param {any} item The data item from which to derive the display text.
     * @param {boolean} descriptive If true, indicates that (where applicable) descriptive text is required. If false, simple text is returned.
     * Descriptive text is displayed in the list of suggested items, whereas simple text should be displayed in the input control.
     * @returns The display text to be rendered in the UI.
     */
    abstract getDisplayText(item: any, descriptive: boolean): string;
}