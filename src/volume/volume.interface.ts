export interface CreateVolume {
  name: string;
  storagePool: string;
  capacity: number;
  diskPackId: number;
}

export interface CreateVolumeActivity {
  name: string;
  storagePool: string;
  capacity: number;
  diskPackId: number;
}

export interface AttachVolume {
  volumeName: string;
  instanceName: string;
  storagePool: string;
}
