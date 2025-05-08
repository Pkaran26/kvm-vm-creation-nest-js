import { Injectable } from '@nestjs/common';
import { existsSync, writeFileSync } from 'fs';
import { HelperService } from 'src/helper/helper.service';

@Injectable()
export class NetworkService {
  constructor(private helperService: HelperService) {}

  async getNetworkList() {
    try {
      const output: any = await this.helperService.executeCommand(
        'virsh net-list --all',
      );
      return {
        status: true,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        networkList: this.helperService.parseCMDResponse(output),
      };
    } catch (error) {
      return {
        status: false,
        networkList: [],
        error: 'Failed to list networks',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        details: error,
      };
    }
  }

  async createNetwork(networkName: string) {
    const networkXmlPath = `/etc/libvirt/networks/${networkName}.xml`;

    try {
      if (!existsSync(networkXmlPath)) {
        console.log(
          `Network XML file not found at ${networkXmlPath}. Creating...`,
        );
        const defaultNetworkXml = `
                <network>
                  <name>${networkName}</name>
                  <uuid>your-uuid</uuid>
                  <forward mode='nat'>
                    <nat>
                      <address start='192.168.122.2' end='192.168.122.254'/>
                    </nat>
                  </forward>
                  <ip address='192.168.122.1' netmask='255.255.255.0'>
                    <dhcp>
                      <range start='192.168.122.2' end='192.168.122.254'/>
                    </dhcp>
                  </ip>
                </network>
            `;

        // Replace 'your-uuid' with a real UUID.
        const uuid = await this.helperService.executeCommand('uuidgen');
        const finalNetworkXml = defaultNetworkXml.replace(
          'your-uuid',
          uuid as string,
        );

        // Write the XML to the file
        writeFileSync(networkXmlPath, finalNetworkXml);
        console.log(`Network XML file created at ${networkXmlPath}`);
      } else {
        console.log(`Network XML file already exists at ${networkXmlPath}`);
      }

      // Define the network in libvirt
      try {
        await this.helperService.executeCommand(
          `sudo virsh net-define ${networkXmlPath}`,
        );
        console.log(`Network "${networkName}" defined successfully.`);
      } catch (defineError) {
        if (
          defineError &&
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          defineError.message &&
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
          defineError.message.includes('already exists')
        ) {
          console.warn(
            `Network "${networkName}" already exists.  Attempting to start it.`,
          );
        } else {
          console.error(`Error defining network: ${defineError}`);
          return;
        }
      }

      // Start the network
      try {
        await this.helperService.executeCommand(
          `sudo virsh net-start ${networkName}`,
        );
        console.log(`Network "${networkName}" started successfully.`);
      } catch (startError) {
        if (
          startError &&
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          startError.message &&
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
          startError.message.includes('error: Failed to start network')
        ) {
          console.error(
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            `Error starting network "${networkName}": ${startError.message}`,
          );
          return;
        } else {
          console.error(`Error starting network: ${startError}`);
          return;
        }
      }

      // Set the network to autostart on boot
      await this.helperService.executeCommand(
        `sudo virsh net-autostart ${networkName}`,
      );
      console.log(`Network "${networkName}" set to autostart on boot.`);

      // List networks to confirm
      const listNetworksOutput = await this.helperService.executeCommand(
        `sudo virsh net-list --all`,
      );

      return {
        status: true,
        message: `Successfully configured network "${networkName}"`,
        networkList: listNetworksOutput,
      };
    } catch (error) {
      return {
        status: false,
        message: `Failed to create "${networkName}" network`,
        networkList: [],
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        detail: error,
      };
    }
  }
}

// Example usage:  Call the function
// createDefaultNetwork()
//   .then(() => {
//     console.log("Default network creation process completed.");
//   })
//   .catch((err) => {
//     console.error("Default network creation process failed:", err);
//   });
