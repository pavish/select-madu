import type { Option } from "../interfaces";

export const subTree = (tree: Option[], childKey: string, conditionFn: ((element: Option) => boolean)) => {
  const stree: Option[] = [];
  tree.forEach((elem) => {
    if (elem[childKey]) {
      const childSubTree = subTree(elem[childKey] as Option[], childKey, conditionFn);
      if (childSubTree.length > 0) {
        stree.push(
          { ...elem, [childKey]: childSubTree },
        );
      }
    } else if (conditionFn(elem)) {
      stree.push(elem);
    }
  });
  return stree;
}

export const stringContains = (actualString: string, searchVal: string) => {
  return actualString.toLowerCase().trim().indexOf(searchVal.toLowerCase().trim()) !== -1;
}

export const filterTree = (tree: Option[], keys: { child: string, text: string }, searchVal: string) => {
  return subTree(tree, keys.child, (el) => {
    const text = el[keys.text];
    if (typeof text === 'string') {
      return stringContains(text, searchVal);
    } else {
      return false;
    }
  });
}
