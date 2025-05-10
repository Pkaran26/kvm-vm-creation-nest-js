export interface CreateInstanceRequest {
  instanceName: string;
  isoImageName: string;
  network: string;
  ssh: string;
  cpuPackId: number;
  diskPackId: number;
}

export interface CreateInstanceRequestActivity extends CreateInstanceRequest {
  cpuPack: {
    name: string;
    cpu: number;
    ram: number;
    monthlyPrice: number;
    hourlyPrice: number;
  };
  diskPack: {
    name: string;
    diskSize: number;
    monthlyPrice: number;
    hourlyPrice: number;
  };
  SELECTED_OS: {
    url: string;
    username: string;
    filename: string;
    variant: string;
  };
}
