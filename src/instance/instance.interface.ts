export interface CreateInstanceRequest {
  instanceName: string;
  memory: number;
  vcpu: number;
  diskSizeGB: number;
  isoImageName: string;
  network: string;
  ssh: string;
}
