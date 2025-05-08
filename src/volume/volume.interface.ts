export interface CreateVolume {
  name: string;
  storagePool: string;
  capacity: number;
}

export interface AttachVolume {
  volumeName: string;
  instanceName: string;
  storagePool: string;
}
