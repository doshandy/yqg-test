import Storage from '.';

const StorageKey = 'Project';

const projectStorage = new Storage<number | string>(StorageKey);

if (projectStorage.get() == null) {
  projectStorage.set(1);
}

export default projectStorage;
