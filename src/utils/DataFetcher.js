import CancellablePromise from './CancellablePromise.js';
import FilterUtil from './FilterUtil.js';

export default function(datasource, searchVal, textKey, childKey, datasourceArgs) {
  if(datasource) {
    let isFunc = (typeof datasource === "function");
    let resDS = isFunc ? datasource(searchVal, datasourceArgs) : FilterUtil.filterDataTree(datasource, childKey, textKey, searchVal);

    return new CancellablePromise(
      function(resolve, reject) {
        if(isFunc) {
          resDS.then(
            function(res) {
              resolve({ content: res.content, count: res.count });
            },
            function() {
              reject();
            }
          );
        }
        else {
          resolve({ content: resDS });
        }
      },
      function() {
        if(isFunc) {
          resDS.cancel();
        }
      }
    );
  }
  else {
    return new CancellablePromise(function(resolve, reject) {
      reject();
    });
  }
}