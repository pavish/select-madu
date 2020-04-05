function subTree(tree, childKey, conditionFn, cpac) {
  let stree = [];
  tree.forEach(elem => {
    if(elem[childKey]) {
      let isIn = cpac ? conditionFn(elem) : true;
      if(isIn) {
        let childSubTree = subTree(elem[childKey], childKey, conditionFn, cpac);
        if(childSubTree.length > 0) {
          let toUpdateChildren = {};
          toUpdateChildren[childKey] = childSubTree;
          stree.push(
            Object.assign({}, elem, toUpdateChildren)
          );
        }
      }
    }
    else if(conditionFn(elem)) {
      stree.push(elem);
    }
  });
  return stree;
};

function stringContains(actualString, searchVal) {
  return actualString.toLowerCase().trim().indexOf(searchVal.toLowerCase().trim()) !== -1;
};

function filterDataTree(datasource, childKey, textKey, searchVal) {
  return subTree(datasource, childKey, function(el) {
    return stringContains(el[textKey], searchVal);
  });
};

export default {
  subTree,
  stringContains,
  filterDataTree
}