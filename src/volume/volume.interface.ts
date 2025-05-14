export interface CreateStoragePool {
  name: string;
  path: string;
}

export interface CreateVolume {
  name: string;
  storagePool: string;
  diskPackId: number;
}

export interface CreateVolumeActivity {
  name: string;
  storagePool: string;
  capacity: number;
}

export interface AttachVolume {
  volumeName: string;
  instanceName: string;
  storagePool: string;
}
