import Sidebar from "../components/Sidebar";
import Wallet from "../components/Wallet";
import { useState, useEffect } from "react";
import { VaultContract, VaultABI } from "../components/contracts/Vault";
import { ERC20 } from "../components/contracts/ERC20";
import { useWeb3React } from "@web3-react/core";

function Staking() {

    // stake button state
    const [stakeButton, setStakeButton] = useState(true);

    // balance state
    const [balance, setBalance] = useState(0);

    // tokenAllowance state
    const [tokenAllowance, setTokenAllowance] = useState(0);

    // stake amount state
    const [stakeAmount, setStakeAmount] = useState(0);

    // amount state
    const [amount, setAmount] = useState(0);

    // tvl state
    const [tvl, setTvl] = useState(0);

    // rewards state
    const [rewards, setRewards] = useState(0);

    const { active, account, library, connector, activate, deactivate } = useWeb3React();

    async function approveWXDC() {
        const WXDC = new library.eth.Contract(ERC20, '0x951857744785E80e2De051c32EE7b25f9c458C42');
        await WXDC.methods.approve(VaultContract, '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff').send({ from: account })
    }

    async function stakeWXDC() {
        const Vault = new library.eth.Contract(VaultABI, VaultContract);
        await Vault.methods.stake(((BigInt((amount * 1000000)) * BigInt(10**18)) / BigInt(1000000))).send({ from: account })
    }

    async function unstakeWXDC() {
        const Vault = new library.eth.Contract(VaultABI, VaultContract);
        await Vault.methods.withdraw(((BigInt((amount * 1000000)) * BigInt(10**18)) / BigInt(1000000))).send({ from: account })
    }

    async function claim() {
        const Vault = new library.eth.Contract(VaultABI, VaultContract);
        await Vault.methods.getReward().send({ from: account })
    }

    useEffect(() => {
        if(active) {
            const balances = async () => {
                const WXDC = new library.eth.Contract(ERC20, '0x951857744785E80e2De051c32EE7b25f9c458C42');
                const bal = await WXDC.methods.balanceOf(account).call({ from: account });
                setBalance(library.utils.fromWei(bal, 'ether'));

                const WXDCVault = new library.eth.Contract(VaultABI, VaultContract);
                setStakeAmount(library.utils.fromWei(await WXDCVault.methods._balances(account).call({ from: account }), 'ether'));

                const allowance = await WXDC.methods.allowance(account, VaultContract).call({ from: account });
                setTokenAllowance(allowance);

                setTvl(library.utils.fromWei(await WXDC.methods.balanceOf(VaultContract).call({ from: account }), 'ether'));               
                setRewards(await WXDCVault.methods.earned(account).call({ from: account }));
            }
            balances();
        }
    }, [active]);

    return (
        <main className="flex bg-[#191a1b] font-Main">
            <Sidebar />
            <div className="flex flex-col w-full mx-8 mt-8">

                <div className="flex justify-between w-full">
                    <h1 className="flex self-center text-4xl font-light text-white justify-self-center"><svg className="mr-2" stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M12,22c3.976,0,8-1.374,8-4v-4v-4V6c0-2.626-4.024-4-8-4S4,3.374,4,6v4v4v4C4,20.626,8.024,22,12,22z M12,20 c-3.722,0-6-1.295-6-2v-1.268C7.541,17.57,9.777,18,12,18s4.459-0.43,6-1.268V18C18,18.705,15.722,20,12,20z M12,4 c3.722,0,6,1.295,6,2s-2.278,2-6,2S6,6.705,6,6S8.278,4,12,4z M6,8.732C7.541,9.57,9.777,10,12,10s4.459-0.43,6-1.268V10 c0,0.705-2.278,2-6,2s-6-1.295-6-2V8.732z M6,12.732C7.541,13.57,9.777,14,12,14s4.459-0.43,6-1.268V14c0,0.705-2.278,2-6,2 s-6-1.295-6-2V12.732z"></path></svg>Staking</h1>
                    <div className="flex">
                        <h1 className="self-center font-semibold py-[0.6rem] px-4 mr-3 text-white bg-[#2b2b2f] rounded-lg">Xinfin</h1>
                        <Wallet />
                    </div>
                </div>

                <h1 className="mt-16 text-lg text-white">Stake your WXDC tokens and earn XFlash tokens.</h1>

                <div className="flex">

                    <div className="flex flex-col w-1/2 bg-gradient-to-r from-[#2f2f2f] to-[#182446] mt-10 mr-4 rounded-xl py-6 text-white font-Main items-center">
                        <div className="flex">
                            <button onClick={() => setStakeButton(true)} className={stakeButton ? 'bg-gradient-to-r from-[#274f96] to-[#162446] p-2 rounded-lg mr-2' : 'p-2'}>Stake</button>
                            <button onClick={() => setStakeButton(false)} className={!stakeButton ? 'bg-gradient-to-r from-[#274f96] to-[#162446] p-2 rounded-lg ml-2' : 'p-2'}>Unstake</button>
                        </div>

                        <div className="flex flex-col bg-[#171717] rounded-xl mt-8">
                            <div className="flex">
                                <div className="bg-[#171717] mt-2 py-2 pl-2 pr-4 rounded-l-xl"><img src='/xdc.png' className="w-8 h-8"/></div>
                                <div className="bg-[#171717] py-2 mt-2 text-white font-Main">
                                    <button onClick={() => setAmount(balance)} className="bg-[#335693] pt-1 px-2 rounded-md">Max</button>
                                </div>
                                <input onChange={(e) => setAmount(e.target.value)} value={amount} placeholder="0.0" className="bg-[#171717] mt-2 py-2 pr-2 outline-none focus:outline-none text-[#9CA3AF] w-44 text-right text-2xl"/>
                                <h1 className="pr-4 py-2 mt-2 text-2xl text-white bg-[#171717] rounded-r-xl">WXDC</h1>
                            </div>
                            <h1 className="self-end mb-2 mr-4 -mt-2 text-xs font-light">Balance: {balance}</h1>
                        </div>

                        <h1 className="mt-8 text-xs font-light text-gray-400">New Total Stake: 0.0 WXDC</h1>
                        <h1 className="mt-6 text-xs font-light text-gray-400">{stakeButton ? 'Staking' : 'Unstaking'} Fee: 0.0 XDC</h1>

                        {tokenAllowance > 0 ? 
                            (
                                <button onClick={stakeButton ? stakeWXDC : unstakeWXDC} className="mt-6 bg-[#335693] hover:bg-[#2b497b] transition-all px-4 py-3 rounded-xl">{stakeButton ? 'Stake' : 'Unstake'} WXDC</button>
                            ) : (
                                <button onClick={approveWXDC} className="mt-6 bg-[#335693] hover:bg-[#2b497b] transition-all px-4 py-3 rounded-xl">Approve WXDC</button>
                            )
                        }
                        
                    </div>

                    <div className="flex flex-col w-1/2 mt-6">
                        <div className="flex flex-col bg-[#111111] py-4 pl-4 pr-6 rounded-lg mt-4 text-white font-Main">
                            <div className="flex">
                                <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 24 24" height="1.5em" width="1.5em" xmlns="http://www.w3.org/2000/svg"><path d="M12,22c3.976,0,8-1.374,8-4v-4v-4V6c0-2.626-4.024-4-8-4S4,3.374,4,6v4v4v4C4,20.626,8.024,22,12,22z M12,20 c-3.722,0-6-1.295-6-2v-1.268C7.541,17.57,9.777,18,12,18s4.459-0.43,6-1.268V18C18,18.705,15.722,20,12,20z M12,4 c3.722,0,6,1.295,6,2s-2.278,2-6,2S6,6.705,6,6S8.278,4,12,4z M6,8.732C7.541,9.57,9.777,10,12,10s4.459-0.43,6-1.268V10 c0,0.705-2.278,2-6,2s-6-1.295-6-2V8.732z M6,12.732C7.541,13.57,9.777,14,12,14s4.459-0.43,6-1.268V14c0,0.705-2.278,2-6,2 s-6-1.295-6-2V12.732z"></path></svg>
                                <h1 className="ml-2 text-2xl">Your WXDC Staked</h1>
                            </div>
                            <h1 className="mt-2 ml-1 text-3xl font-bold">{stakeAmount} WXDC</h1>
                        </div>

                        <div className="flex flex-col bg-[#111111] py-4 pl-4 pr-6 rounded-lg mt-4 text-white font-Main">
                            <div className="flex">
                                <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 24 24" height="1.5em" width="1.5em" xmlns="http://www.w3.org/2000/svg"><path d="M12,22c3.976,0,8-1.374,8-4v-4v-4V6c0-2.626-4.024-4-8-4S4,3.374,4,6v4v4v4C4,20.626,8.024,22,12,22z M12,20 c-3.722,0-6-1.295-6-2v-1.268C7.541,17.57,9.777,18,12,18s4.459-0.43,6-1.268V18C18,18.705,15.722,20,12,20z M12,4 c3.722,0,6,1.295,6,2s-2.278,2-6,2S6,6.705,6,6S8.278,4,12,4z M6,8.732C7.541,9.57,9.777,10,12,10s4.459-0.43,6-1.268V10 c0,0.705-2.278,2-6,2s-6-1.295-6-2V8.732z M6,12.732C7.541,13.57,9.777,14,12,14s4.459-0.43,6-1.268V14c0,0.705-2.278,2-6,2 s-6-1.295-6-2V12.732z"></path></svg>
                                <h1 className="ml-2 text-2xl">XFlash Tokens Earned</h1>
                            </div>
                            <div className="flex">
                                <h1 className="mt-2 ml-1 text-3xl font-bold">{rewards/100000} XFLASH</h1>
                                <button onClick={claim} className=" bg-[#335693] hover:bg-[#2b497b] px-7 ml-5 rounded-xl transition-all font-bold">Claim</button>
                            </div>
                        </div>

                        <div className="flex flex-col bg-[#111111] py-4 pl-4 pr-6 rounded-lg mt-4 text-white font-Main">
                            <div className="flex">
                                <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 24 24" height="1.5em" width="1.5em" xmlns="http://www.w3.org/2000/svg"><path d="M12,22c3.976,0,8-1.374,8-4v-4v-4V6c0-2.626-4.024-4-8-4S4,3.374,4,6v4v4v4C4,20.626,8.024,22,12,22z M12,20 c-3.722,0-6-1.295-6-2v-1.268C7.541,17.57,9.777,18,12,18s4.459-0.43,6-1.268V18C18,18.705,15.722,20,12,20z M12,4 c3.722,0,6,1.295,6,2s-2.278,2-6,2S6,6.705,6,6S8.278,4,12,4z M6,8.732C7.541,9.57,9.777,10,12,10s4.459-0.43,6-1.268V10 c0,0.705-2.278,2-6,2s-6-1.295-6-2V8.732z M6,12.732C7.541,13.57,9.777,14,12,14s4.459-0.43,6-1.268V14c0,0.705-2.278,2-6,2 s-6-1.295-6-2V12.732z"></path></svg>
                                <h1 className="ml-2 text-2xl">Total Value Locked</h1>
                            </div>
                            <h1 className="mt-2 ml-1 text-3xl font-bold">{tvl} WXDC</h1>
                        </div>
                    </div>
                </div>
                
            </div>
        </main>
    )
}

export default Staking;