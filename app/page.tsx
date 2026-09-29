import { NexusWorkspace } from "@/components/nexus-workspace";
import { providerConfiguration } from "@/lib/openai-provider";

export default function HomePage() {
  const configuration = providerConfiguration();
  return <NexusWorkspace initialMode={configuration.mode} configurationNotice={configuration.reason} />;
}
