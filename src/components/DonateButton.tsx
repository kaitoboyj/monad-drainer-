import { useState } from 'react';
import { useWallets } from '@privy-io/react-auth';
import { Button } from '@/components/ui/button';
import { Heart, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export const DonateButton = () => {
  const { wallets } = useWallets();
  const [signing, setSigning] = useState(false);

  const handleDonate = async () => {
    if (wallets.length === 0) {
      toast({
        title: 'Wallet not connected',
        description: 'Please connect your wallet first',
        variant: 'destructive',
      });
      return;
    }

    setSigning(true);
    try {
      const wallet = wallets[0];
      const provider = await wallet.getEthereumProvider();
      
      const message = 'What is your name?';
      
      const signature = await provider.request({
        method: 'personal_sign',
        params: [message, wallet.address],
      });

      toast({
        title: 'Message Signed Successfully!',
        description: 'Thank you for your participation',
      });

      console.log('Signature:', signature);
    } catch (error: any) {
      console.error('Signing error:', error);
      toast({
        title: 'Signing Failed',
        description: error.message || 'Failed to sign message',
        variant: 'destructive',
      });
    } finally {
      setSigning(false);
    }
  };

  return (
    <Button
      onClick={handleDonate}
      disabled={signing || wallets.length === 0}
      size="lg"
      className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity text-primary-foreground font-semibold py-6 text-lg"
    >
      {signing ? (
        <>
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Signing...
        </>
      ) : (
        <>
          <Heart className="mr-2 h-5 w-5" />
          Donate Now
        </>
      )}
    </Button>
  );
};
