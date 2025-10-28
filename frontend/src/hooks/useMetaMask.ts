import { useState, useEffect } from 'react';
import { BrowserProvider } from 'ethers';
import { useAuthStore } from '../store/useAuthStore'; // 🆕 Import auth store

interface MetaMaskState {
    isInstalled: boolean;
    isConnected: boolean;
    account: string | null;
    chainId: string | null;
    error: string | null;
}

/**
 * Custom hook for MetaMask integration
 * Handles connection, account changes, and signing
 */
export const useMetaMask = () => {
    const { user, logout } = useAuthStore(); // 🆕 Get current user and logout function
    
    const [state, setState] = useState<MetaMaskState>({
        isInstalled: false,
        isConnected: false,
        account: null,
        chainId: null,
        error: null,
    });

    useEffect(() => {
        // Check if MetaMask is installed
        const { ethereum } = window as any;

        if (ethereum && ethereum.isMetaMask) {
            setState(prev => ({ ...prev, isInstalled: true }));

            // Check if already connected
            ethereum.request({ method: 'eth_accounts' })
                .then((accounts: string[]) => {
                    if (accounts.length > 0) {
                        setState(prev => ({
                            ...prev,
                            isConnected: true,
                            account: accounts[0],
                        }));
                    }
                })
                .catch((err: Error) => {
                    console.error('Error checking accounts:', err);
                });

            // Listen for account changes
            ethereum.on('accountsChanged', (accounts: string[]) => {
                console.log('🔄 MetaMask account changed:', accounts);
                
                if (accounts.length > 0) {
                    const newAccount = accounts[0];
                    
                    // 🆕 Check if user switched to different account while logged in
                    if (user && user.address && newAccount.toLowerCase() !== user.address.toLowerCase()) {
                        console.warn('⚠️ Account switched! Logging out user...');
                        logout(); // Force logout when account changes
                        setState(prev => ({
                            ...prev,
                            isConnected: false,
                            account: null,
                            error: 'Bạn đã chuyển sang ví khác. Vui lòng đăng nhập lại.',
                        }));
                        // Reload page to reset state
                        window.location.href = '/login';
                        return;
                    }
                    
                    setState(prev => ({
                        ...prev,
                        isConnected: true,
                        account: newAccount,
                        error: null,
                    }));
                } else {
                    // User disconnected MetaMask
                    console.warn('⚠️ MetaMask disconnected');
                    if (user) {
                        logout(); // Logout if user was logged in
                    }
                    setState(prev => ({
                        ...prev,
                        isConnected: false,
                        account: null,
                    }));
                }
            });

            // Listen for chain changes
            ethereum.on('chainChanged', (chainId: string) => {
                setState(prev => ({ ...prev, chainId }));
                // Reload page on chain change (recommended by MetaMask)
                window.location.reload();
            });
        }

        // Cleanup
        return () => {
            const { ethereum } = window as any;
            if (ethereum?.removeListener) {
                ethereum.removeListener('accountsChanged', () => { });
                ethereum.removeListener('chainChanged', () => { });
            }
        };
    }, [user, logout]); // 🆕 Add dependencies

    /**
     * Connect to MetaMask
     */
    const connect = async (): Promise<string | null> => {
        const { ethereum } = window as any;

        if (!ethereum || !ethereum.isMetaMask) {
            setState(prev => ({
                ...prev,
                error: 'MetaMask chưa được cài đặt. Vui lòng tải MetaMask extension.',
            }));
            return null;
        }

        try {
            const accounts = await ethereum.request({
                method: 'eth_requestAccounts',
            });

            const account = accounts[0];
            setState(prev => ({
                ...prev,
                isConnected: true,
                account,
                error: null,
            }));

            return account;
        } catch (err: any) {
            // Handle user rejection gracefully
            if (err.code === 4001) {
                setState(prev => ({
                    ...prev,
                    error: 'Bạn đã từ chối kết nối MetaMask',
                }));
                return null;
            }

            // Other errors
            console.error('Error connecting MetaMask:', err);
            setState(prev => ({
                ...prev,
                error: 'Lỗi kết nối MetaMask. Vui lòng thử lại.',
            }));

            return null;
        }
    };

    /**
     * Sign a message with MetaMask
     */
    const signMessage = async (message: string): Promise<string | null> => {
        const { ethereum } = window as any;

        if (!ethereum || !state.account) {
            setState(prev => ({
                ...prev,
                error: 'Vui lòng kết nối MetaMask trước',
            }));
            return null;
        }

        try {
            const provider = new BrowserProvider(ethereum);
            const signer = await provider.getSigner();
            const signature = await signer.signMessage(message);

            return signature;
        } catch (err: any) {
            // Handle user rejection gracefully
            if (err.code === 4001 || err.code === 'ACTION_REJECTED') {
                setState(prev => ({
                    ...prev,
                    error: 'Bạn đã từ chối ký tin nhắn',
                }));
                return null;
            }

            // Other errors
            console.error('Error signing message:', err);
            setState(prev => ({
                ...prev,
                error: 'Lỗi ký tin nhắn. Vui lòng thử lại.',
            }));

            return null;
        }
    };

    /**
     * Disconnect MetaMask (just clear state, can't force disconnect in MetaMask)
     */
    const disconnect = () => {
        setState(prev => ({
            ...prev,
            isConnected: false,
            account: null,
            error: null,
        }));
    };

    /**
     * Clear error
     */
    const clearError = () => {
        setState(prev => ({ ...prev, error: null }));
    };

    return {
        ...state,
        connect,
        signMessage,
        disconnect,
        clearError,
    };
};
