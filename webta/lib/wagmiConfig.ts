import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { polygon, polygonAmoy, hardhat, mainnet, sepolia } from 'wagmi/chains';

// Ganti nama aplikasi dan ID project sesuai kebutuhan
export const wagmiConfig = getDefaultConfig({
  appName: 'KoiChain',
  projectId: 'YOUR_PROJECT_ID', // Dapatkan dari WalletConnect Cloud, atau biarkan dummy jika tidak perlu fitur tambahan
  chains: [
    mainnet,
    sepolia,
    polygon,
    polygonAmoy, 
    ...(process.env.NODE_ENV === 'development' ? [hardhat] : []),
  ],
  ssr: true, // Server-Side Rendering (Next.js App Router)
});
