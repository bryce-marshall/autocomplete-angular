import { DOMType, ScrollEventTargetCollection, ScrollEventScopeLimiter } from '@brycemarshall/scroll-listener';
export { DOMType, ScrollEventScopeLimiter } from '@brycemarshall/scroll-listener';

/**
 * The base class for ScrollEventFilter providers. The factory method pattern is intended to make it easy for implementors
 * to return either a singleton ScrollEventFilter instance or create a new instance for each request.
 */
export abstract class ScrollSourceFilterProvider {
    abstract getFilter(): ScrollSourceFilter;
}

export class DefaultScrollSourceFilterProvider extends ScrollSourceFilterProvider {
    getFilter(): ScrollSourceFilter {
        return new DefaultScrollSourceFilter();
    }
}

export abstract class ScrollSourceFilter {
    public get filterFunction(): ScrollEventScopeLimiter {
        return (domType: DOMType, eventSource: Element | Document | Window): boolean => { return this.include(domType, eventSource); };
    }

    protected defaultFilter(domType: DOMType, eventSource: Element | Document | Window) {
        if (domType == DOMType.Element && (<Element>eventSource).tagName == "APP-ROOT")
            return false;

        return ScrollEventTargetCollection.defaultScopeLimiter(domType, eventSource);
    }

    protected abstract include(domType: DOMType, eventSource: Element | Document | Window): boolean;
}

export class DefaultScrollSourceFilter extends ScrollSourceFilter {
    protected include(domType: DOMType, eventSource: Element | Document | Window): boolean {
        return this.defaultFilter(domType, eventSource);
    }
}
