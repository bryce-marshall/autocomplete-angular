/**
* Implemented by custom Autocomplete create components.
* @interface AutocompleteCreateComponent
* @property {string} input - The current input value as entered into the associated DOM input element.
*/
export interface AutocompleteCreateComponent {
    /**
     * The current input data (set by the auto-complete framework).
     */
    input: string;
    /**
     * This function is invoked by the Autocomplete framework when an auto-assign event occurs.
     * When implemented in a derived class, the function should return create data that represents its state at the time of the function invocation.
     * 
     * Remarks:
     * 
     * As auto-assignment occurs implictly when the auto-complete input control loses focus, and the task of resolving the actual object to be assigned 
     * is delegated to an external autocomplete resolve function, the framework cannot determine whether the event will result in
     * the assignment of an existing object, the creation of a new one, or even if an assignment will occur at all.
     * For these reasons, the framework must assume that the auto-assignment MAY result in the creation of a new data entity and therefore 
     * it queries this function for any additional data to pass to the resolve function.
     * @function getCreateData
     */
    getCreateData(): any;
}
