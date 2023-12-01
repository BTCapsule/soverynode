# Installation
> `npm install --save @types/deep-equal`

# Summary
This package contains type definitions for deep-equal (https://github.com/substack/node-deep-equal).

# Details
Files were exported from https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/deep-equal.
## [index.d.ts](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/deep-equal/index.d.ts)
````ts
interface DeepEqualOptions {
    strict: boolean;
}

declare function deepEqual(
    actual: any,
    expected: any,
    opts?: DeepEqualOptions,
): boolean;

export = deepEqual;

````

### Additional Details
 * Last updated: Mon, 06 Nov 2023 22:41:05 GMT
 * Dependencies: none

# Credits
These definitions were written by [remojansen](https://github.com/remojansen), and [Jay Anslow](https://github.com/janslow).
