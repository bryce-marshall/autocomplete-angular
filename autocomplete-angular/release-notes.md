# 1.0.5
## Do not process the CoordinatorImp.handleInputChanged handler if the "new" value is the same as the currently referenced input value.
This prevents a new query from being initiated (and the popup being displayed) if the inputChanged event is raised when the control input has not in fact changed.
This condition has been observed under some circumstances when using the Ionic framework version of the Autocomplete control whilst also using custom reactive form validation.

## Position the input control caret at end of input text when data item is set
Ensures that the input control caret is positioned at the end of the input control text when the data item is set.
Previously, it had been observed that under some circumstances (when using the Ionic framework verson of the Autocomplete control) the caret would reposition to the start of the input text following the date item having been set/selected.

# 1.0.4
## Added persistent parameter to AutocompleteBase.setControlValue abstract method
Allows subclasses to prevent non-persistent values (in this case those set as a consequence of cursor navigation) from being passed-up to encapsulating types.
Necessary for the cursor function to work correctly on the Ionic implementation.
# 1.0.3
## Suppress Escape Keyboard Events
Suppress bubbling of the keyup and keydown events when the escape key is a pressed to:
1. Cancel a cursor selection;
2. Close the popup; or
3. Cancel an edit (reset the input control to its pre-focused value)

## onAfterSetDataItem abstract method added to AutocompleteBase
Invoked after the dataItem property has been set.
This method exists to support the Autocomplete Ionic implementation