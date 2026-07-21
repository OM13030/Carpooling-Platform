import React, { useEffect, useState } from 'react';
import { useWalletStore } from '../features/wallet/walletStore';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Wallet as WalletIcon, ArrowUpRight, ArrowDownLeft, Landmark, RefreshCw } from 'lucide-react';

export const Wallet = () => {
  const { wallet, transactions, total, fetchWallet, rechargeWallet, loading, error } = useWalletStore();
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [successMsg, setSuccessMsg] = useState('');
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    fetchWallet(currentPage, 10);
  }, [currentPage, fetchWallet]);

  const handleRecharge = async (e) => {
    e.preventDefault();
    setLocalError('');
    setSuccessMsg('');

    const amt = parseFloat(rechargeAmount);
    if (isNaN(amt) || amt <= 0) {
      setLocalError('Please enter a valid positive amount');
      return;
    }

    const res = await rechargeWallet(amt);
    if (res.success) {
      setSuccessMsg(res.message || 'Wallet recharged successfully!');
      setRechargeAmount('');
      setCurrentPage(1); // Reset to page 1 to see the new transaction
      fetchWallet(1, 10);
    } else {
      setLocalError(res.error);
    }
  };

  const formatTxType = (type) => {
    switch (type) {
      case 'credit': return <span className="text-emerald-400 font-semibold flex items-center gap-1"><ArrowUpRight size={14} /> Credit</span>;
      case 'debit': return <span className="text-red-400 font-semibold flex items-center gap-1"><ArrowDownLeft size={14} /> Debit</span>;
      case 'refund': return <span className="text-blue-400 font-semibold flex items-center gap-1"><RefreshCw size={14} /> Refund</span>;
      case 'reward': return <span className="text-amber-400 font-semibold flex items-center gap-1"><ArrowUpRight size={14} /> Reward</span>;
      default: return type;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">My Wallet Ledger</h1>
        <p className="text-sm text-muted-foreground mt-1">Review balance credits, manage payments, and top up funds</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Balance & Recharge */}
        <div className="space-y-6">
          {/* Balance card */}
          <Card className="bg-[#121212] border-border relative overflow-hidden">
            <div className="absolute top-0 right-0 w-36 h-36 bg-primary/5 rounded-full blur-2xl pointer-events-none"></div>
            <div className="flex items-center gap-3 text-muted-foreground mb-4">
              <WalletIcon size={18} />
              <span className="text-xs uppercase font-medium tracking-wider">Available Funds</span>
            </div>
            <span className="text-4xl font-extrabold text-white font-mono block">
              ₹{wallet?.balance !== undefined ? wallet.balance : 0}
            </span>
            <div className="mt-4 pt-4 border-t border-border/40 text-[10px] text-muted-foreground flex justify-between">
              <span>Linked UPI ID:</span>
              <span className="font-mono text-white">{wallet?.upiId || 'Not linked'}</span>
            </div>
          </Card>

          {/* Recharge form */}
          <Card className="bg-[#121212] border-border">
            <h3 className="font-bold text-sm text-white mb-4">Recharge Balance</h3>
            
            {successMsg && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-xl text-xs font-semibold mb-4">
                {successMsg}
              </div>
            )}

            {localError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs font-semibold mb-4">
                {localError}
              </div>
            )}

            <form onSubmit={handleRecharge} className="space-y-4">
              <div>
                <label className="block text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-2">Recharge Amount (₹)</label>
                <input
                  type="number"
                  placeholder="e.g. 500"
                  value={rechargeAmount}
                  onChange={(e) => setRechargeAmount(e.target.value)}
                  className="w-full bg-[#222222] border border-border focus:border-primary rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none font-mono"
                />
              </div>

              {/* Quick Select Buttons */}
              <div className="flex gap-2">
                {[100, 500, 1000].map(amt => (
                  <button
                    type="button"
                    key={amt}
                    onClick={() => setRechargeAmount(amt.toString())}
                    className="flex-1 bg-[#222222] border border-border hover:border-primary/40 text-foreground text-xs py-2 rounded-lg cursor-pointer transition-all font-mono"
                  >
                    +₹{amt}
                  </button>
                ))}
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full py-2.5 font-bold"
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Proceed with Recharge'}
              </Button>
            </form>
          </Card>
        </div>

        {/* Right: Transactions Log */}
        <div className="lg:col-span-2">
          <Card className="bg-[#121212] border-border h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-border/40 pb-4 mb-4">
                <h3 className="font-bold text-sm text-white uppercase tracking-wider">Transaction History ({total})</h3>
              </div>

              {transactions.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground text-xs">
                  No transaction records found.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-border/60 text-muted-foreground uppercase font-medium tracking-wider">
                        <th className="pb-3 font-semibold">Date</th>
                        <th className="pb-3 font-semibold">Description</th>
                        <th className="pb-3 font-semibold">Type</th>
                        <th className="pb-3 font-semibold">Method</th>
                        <th className="pb-3 font-semibold text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {transactions.map(tx => (
                        <tr key={tx._id} className="text-foreground hover:bg-[#222222]/10 transition-colors">
                          <td className="py-3.5 font-mono text-muted-foreground">{new Date(tx.createdAt).toLocaleDateString()}</td>
                          <td className="py-3.5 max-w-[220px] truncate pr-4">
                            <div>{tx.description}</div>
                            {tx.razorpayPaymentId && (
                              <div className="text-[9px] text-muted-foreground font-mono mt-0.5">Ref: {tx.razorpayPaymentId}</div>
                            )}
                          </td>
                          <td className="py-3.5">{formatTxType(tx.type)}</td>
                          <td className="py-3.5 uppercase font-mono text-[10px]">{tx.method}</td>
                          <td className="py-3.5 text-right font-bold font-mono text-white">
                            {tx.type === 'debit' ? '-' : '+'}₹{tx.amount}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Pagination Controls */}
            {total > 10 && (
              <div className="flex items-center justify-between border-t border-border/40 pt-4 mt-4">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-[10px]"
                >
                  Previous
                </Button>
                <span className="text-[10px] text-muted-foreground font-semibold">Page {currentPage} of {Math.ceil(total / 10)}</span>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(p => p + 1)}
                  disabled={currentPage >= Math.ceil(total / 10)}
                  className="px-3 py-1.5 text-[10px]"
                >
                  Next
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Wallet;
