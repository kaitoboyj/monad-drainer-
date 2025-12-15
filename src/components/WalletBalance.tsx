import { useEffect, useState } from 'react';
import { useWallets } from '@privy-io/react-auth';
import { formatEther } from 'viem';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export const WalletBalance = () => {
  const { wallets } = useWallets();
  const [balance, setBalance] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBalance = async () => {
      if (wallets.length === 0) {
        setLoading(false);
        return;
      }

      try {
        const wallet = wallets[0];
        const provider = await wallet.getEthereumProvider();
        
        const balanceHex = await provider.request({
          method: 'eth_getBalance',
          params: [wallet.address, 'latest'],
        });
        
        const balanceWei = BigInt(balanceHex as string);
        setBalance(formatEther(balanceWei));
      } catch (error) {
        console.error('Error fetching balance:', error);
        setBalance('0');
      } finally {
        setLoading(false);
      }
    };

    fetchBalance();
  }, [wallets]);

  const wallet = wallets[0];

  if (!wallet) return null;

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg text-foreground">Wallet Balance</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-sm">Address</span>
          <span className="text-foreground font-mono text-sm">
            {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-sm">MON Balance</span>
          {loading ? (
            <Skeleton className="h-5 w-24" />
          ) : (
            <span className="text-foreground font-semibold">
              {parseFloat(balance || '0').toFixed(4)} MON
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
