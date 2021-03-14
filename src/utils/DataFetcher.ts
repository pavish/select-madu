import type { DataSource, Keys, Option } from '../interfaces';
import { CancellablePromise } from './CancellablePromise';
import { filterTree } from './FilterUtil';

export const fetchOptions = (datasource: DataSource, searchVal: string, keys: Keys) => {
  if (datasource) {
    if (typeof datasource === 'function') {
      const fetchResult = datasource(searchVal);
      if (Array.isArray(fetchResult)) {
        return new CancellablePromise<Option[]>((resolve) => {
          resolve(fetchResult);
        });
      } else {
        return new CancellablePromise<Option[]>(
          (resolve, reject) => {
            fetchResult.then(
              (res: Option[]) => {
                resolve(res);
              },
              (err) => {
                reject(err);
              },
            ).catch((err) => {
              reject(err);
            })
          },
          () => {
            if ('cancel' in fetchResult && typeof fetchResult.cancel === 'function') {
              fetchResult.cancel();
            }
          },
        );
      }
    } else {
      const result = filterTree(datasource, keys, searchVal);
      return new CancellablePromise<Option[]>((resolve) => {
        resolve(result);
      });
    }
  }

  return new CancellablePromise<Option[]>((_resolve, reject) => {
    reject(new Error('select-madu datasource is empty'));
  });
};
