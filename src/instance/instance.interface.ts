export interface CreateInstanceRequest {
  instanceName: string;
  isoImageName: string;
  network: string;
  ssh: string;
  cpuPackId: number;
  diskPackId: number;
}
