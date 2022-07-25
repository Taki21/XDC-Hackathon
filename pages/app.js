import Sidebar from "../components/Sidebar";
import Wallet from "../components/Wallet";
import { VaultContract, VaultABI } from "../components/contracts/Vault";
import { Borrower, BorrowerABI } from "../components/contracts/Borrower";
import { ERC20 } from "../components/contracts/ERC20";
import { useWeb3React } from "@web3-react/core";
import { useEffect, useState } from "react";

function App() {

    const { active, account, library, connector, activate, deactivate } = useWeb3React();

    // addr state
    const [addr, setAddr] = useState('');

    // amount state
    const [amount, setAmount] = useState(0);

    // tvl state
    const [tvl, setTvl] = useState(0);

    // r1tokenamt state
    const [r1tokenamt, setR1tokenamt] = useState(0);

    // r2wxdcamt state
    const [r2wxdcamt, setR2wxdcamt] = useState(0);       

    // token symbol
    const [tokenSymbol, setTokenSymbol] = useState('');

    // profitabilityPercentage
    const [profitabilityPercentage, setProfitabilityPercentage] = useState(0);

    // firstRouteisXSwap
    const [firstRouteisXSwap, setFirstRouteisXSwap] = useState(false);
    
    const XSWAP_ROUTER = '0xf9c5E4f6E627201aB2d6FB6391239738Cf4bDcf9'
    const XDCSWAPS_ROUTER = '0x948fE8BB54383745c87E9607dA245D91207E3bF0'
    const WXDC_CONTRACT = '0x951857744785E80e2De051c32EE7b25f9c458C42'
    
    async function execFlashLoan() {
        const amountBorrowing = library.utils.toWei((amount === '' ? 0 : amount).toString(), 'ether');
        const Lender = new library.eth.Contract(VaultABI, VaultContract);

        if(amount > 0) {
            if(firstRouteisXSwap) {
                await Lender.methods.flashLoan(Borrower, WXDC_CONTRACT, amountBorrowing, XSWAP_ROUTER, XDCSWAPS_ROUTER, addr, amountBorrowing, '0x').send({from: account})
            } else {
                await Lender.methods.flashLoan(Borrower, WXDC_CONTRACT, amountBorrowing, XDCSWAPS_ROUTER, XSWAP_ROUTER, addr, amountBorrowing, '0x').send({from: account})
            }
        }
    }

    useEffect(() => {
        if (active) {
            const amountBorrowing = library.utils.toWei((amount === '' ? 0 : amount).toString(), 'ether');
            const balances = async () => {
                const WXDC = new library.eth.Contract(ERC20, '0x951857744785E80e2De051c32EE7b25f9c458C42');
                setTvl(library.utils.fromWei(await WXDC.methods.balanceOf(VaultContract).call({ from: account }), 'ether'));
                
                const BorrowerContract = new library.eth.Contract(BorrowerABI, Borrower);
                
                if(library.utils.isAddress(addr) && amount > 0) {
                    let swapToken = new library.eth.Contract(ERC20, addr);
                    let tDecimals = await swapToken.methods.decimals().call({ from: account });
                    let tSymbol = await swapToken.methods.symbol().call({ from: account });
                    setTokenSymbol(tSymbol);
                    console.log(tSymbol) 

                    let option1A = await BorrowerContract.methods.getAmountOutMin(XSWAP_ROUTER, WXDC_CONTRACT, addr, amountBorrowing).call({ from: account });
                    let option1B = library.utils.fromWei(await BorrowerContract.methods.getAmountOutMin(XDCSWAPS_ROUTER, addr, WXDC_CONTRACT, option1A).call({ from: account }), 'ether');

                    let option2A = await BorrowerContract.methods.getAmountOutMin(XDCSWAPS_ROUTER, WXDC_CONTRACT, addr, amountBorrowing).call({ from: account });
                    let option2B = library.utils.fromWei(await BorrowerContract.methods.getAmountOutMin(XSWAP_ROUTER, addr, WXDC_CONTRACT, option2A).call({ from: account }), 'ether'); 
                    
                    if(option1B > option2B) {
                        setR1tokenamt(option1A/(10 ** tDecimals));
                        setR2wxdcamt(option1B);
                        setFirstRouteisXSwap(true);
                    } else {
                        setR1tokenamt(option2A/(10 ** tDecimals));
                        setR2wxdcamt(option2B);
                        setFirstRouteisXSwap(false);
                    }

                    if(r2wxdcamt > amount) setProfitabilityPercentage(((r2wxdcamt / amount)-1)*100);
                    else setProfitabilityPercentage(1 - (amount / r2wxdcamt));

                    console.log(r1tokenamt)
                }

               
            }
            balances();
        }
    }, [active, addr, r1tokenamt, r2wxdcamt, amount, firstRouteisXSwap]);

    return (
        <main className="flex bg-[#191a1b] font-Main">
            <Sidebar />
            <div className="flex flex-col w-full mx-8 mt-8">

                <div className="flex justify-between w-full">
                    <h1 className="flex self-center text-4xl font-light text-white justify-self-center"><svg className="mr-2" stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 16 16" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M11.251.068a.5.5 0 01.227.58L9.677 6.5H13a.5.5 0 01.364.843l-8 8.5a.5.5 0 01-.842-.49L6.323 9.5H3a.5.5 0 01-.364-.843l8-8.5a.5.5 0 01.615-.09zM4.157 8.5H7a.5.5 0 01.478.647L6.11 13.59l5.732-6.09H9a.5.5 0 01-.478-.647L9.89 2.41 4.157 8.5z" clip-rule="evenodd"></path></svg>Flashloans</h1>
                    <div className="flex">
                        <h1 className="self-center font-semibold py-[0.6rem] px-4 mr-3 text-white bg-[#2b2b2f] rounded-lg">Xinfin</h1>
                        <Wallet />
                    </div>
                </div>

                <h1 className="mt-16 text-lg text-white">Arbitrage a token between XSwap and XDCSwaps using Flashloans.</h1>

                <div className="flex items-center mt-4">
                    <div className="flex flex-col items-center bg-gradient-to-r from-[#2f2f2f] to-[#182446] px-4 py-8 rounded-lg mt-4 w-1/2 font-Main text-white">
                        <h1 className="my-8 text-2xl font-bold">DEX 1</h1>
                        <div className="flex mb-2">
                            <div className="bg-[#171717] mt-2 py-2 pl-2 pr-4 rounded-l-xl"><img src='/xdc.png' className="w-8 h-8"/></div>
                            <input type='text' value={amount} placeholder="0.0" className="bg-[#171717] mt-2 py-2 pr-2 outline-none focus:outline-none text-white w-2/3 text-right text-2xl"/>
                            <h1 className="pr-4 py-2 mt-2 text-2xl text-white bg-[#171717] rounded-r-xl">WXDC</h1>
                        </div>

                        <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 1024 1024" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M862 465.3h-81c-4.6 0-9 2-12.1 5.5L550 723.1V160c0-4.4-3.6-8-8-8h-60c-4.4 0-8 3.6-8 8v563.1L255.1 470.8c-3-3.5-7.4-5.5-12.1-5.5h-81c-6.8 0-10.5 8.1-6 13.2L487.9 861a31.96 31.96 0 0 0 48.3 0L868 478.5c4.5-5.2.8-13.2-6-13.2z"></path></svg>

                        <div className="flex">
                            <div className="bg-[#171717] mt-2 py-2 pl-2 pr-4 rounded-l-xl"><svg className="w-8 h-8" stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><g><path fill="none" d="M0 0h24v24H0z"></path><path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm0-12.95L16.95 12 12 16.95 7.05 12 12 7.05zm0 2.829L9.879 12 12 14.121 14.121 12 12 9.879z"></path></g></svg></div>
                            <input type='text' value={r1tokenamt} placeholder="0.0" className="bg-[#171717] mt-2 py-2 pr-2 outline-none focus:outline-none text-white w-2/3 text-right text-2xl"/>
                            <h1 className="pr-4 py-2 mt-2 text-2xl text-white bg-[#171717] rounded-r-xl">{tokenSymbol === '' ? 'WXDC' : tokenSymbol}</h1>
                        </div>

                        <h1 className="mt-4 mb-16">Route: {firstRouteisXSwap ? 'XSwap > XDCSwaps' : 'XDCSwaps > XSwap'}</h1>
                    </div>

                    <svg className="m-8" stroke="white" fill="white" stroke-width="0" viewBox="0 0 1024 1024" height="2em" width="2em" xmlns="http://www.w3.org/2000/svg"><path d="M869 487.8L491.2 159.9c-2.9-2.5-6.6-3.9-10.5-3.9h-88.5c-7.4 0-10.8 9.2-5.2 14l350.2 304H152c-4.4 0-8 3.6-8 8v60c0 4.4 3.6 8 8 8h585.1L386.9 854c-5.6 4.9-2.2 14 5.2 14h91.5c1.9 0 3.8-.7 5.2-2L869 536.2a32.07 32.07 0 0 0 0-48.4z"></path></svg>

                    <div className="flex flex-col items-center bg-gradient-to-r from-[#2f2f2f] to-[#182446] px-4 py-8 rounded-lg mt-4 w-1/2 font-Main text-white">
                        <h1 className="my-8 text-2xl font-bold">DEX 2</h1>
                        <div className="flex mb-2">
                            <div className="bg-[#171717] mt-2 py-2 pl-2 pr-4 rounded-l-xl"><svg className="w-8 h-8" stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><g><path fill="none" d="M0 0h24v24H0z"></path><path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm0-12.95L16.95 12 12 16.95 7.05 12 12 7.05zm0 2.829L9.879 12 12 14.121 14.121 12 12 9.879z"></path></g></svg></div>
                            <input type='text' value={r1tokenamt} placeholder="0.0" className="bg-[#171717] mt-2 py-2 pr-2 outline-none focus:outline-none text-white w-2/3 text-right text-2xl"/>
                            <h1 className="pr-4 py-2 mt-2 text-2xl text-white bg-[#171717] rounded-r-xl">{tokenSymbol === '' ? 'WXDC' : tokenSymbol}</h1>
                        </div>

                        <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 1024 1024" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M862 465.3h-81c-4.6 0-9 2-12.1 5.5L550 723.1V160c0-4.4-3.6-8-8-8h-60c-4.4 0-8 3.6-8 8v563.1L255.1 470.8c-3-3.5-7.4-5.5-12.1-5.5h-81c-6.8 0-10.5 8.1-6 13.2L487.9 861a31.96 31.96 0 0 0 48.3 0L868 478.5c4.5-5.2.8-13.2-6-13.2z"></path></svg>

                        <div className="flex">
                            <div className="bg-[#171717] mt-2 py-2 pl-2 pr-4 rounded-l-xl"><img src='/xdc.png' className="w-8 h-8"/></div>
                            <input type='text' value={r2wxdcamt} placeholder="0.0" className="bg-[#171717] mt-2 py-2 pr-2 outline-none focus:outline-none text-white w-2/3 text-right text-2xl"/>
                            <h1 className="pr-4 py-2 mt-2 text-2xl text-white bg-[#171717] rounded-r-xl">WXDC</h1>
                        </div>

                        <h1 className="mt-4 mb-16">{profitabilityPercentage}{profitabilityPercentage > 0 ? '% Profit' : '% Loss'}</h1>
                    </div>
                </div>

                <div className="flex justify-between mt-6">
                    <div className="bg-[#111111] p-4 w-1/3 rounded-lg mt-4 mr-8">
                        <h1 className="text-white">Input the amount of WXDC you would like to flash borrow.</h1>
                        <div className="flex">
                            <div className="bg-[#171717] mt-2 py-2 pl-2 pr-4 rounded-l-xl"><img src='/xdc.png' className="w-8 h-8"/></div>
                            <div className="bg-[#171717] py-2 mt-2 text-white font-Main">
                                <button onClick={() => setAmount(tvl)} className="bg-[#335693] pt-1 px-2 rounded-md">Max</button>
                            </div>
                            <input onChange={(e) => setAmount(e.target.value)} value={amount} placeholder="0.0" className="bg-[#171717] mt-2 py-2 pr-2 outline-none focus:outline-none text-[#9CA3AF] w-44 text-right text-2xl"/>
                            <h1 className="pr-4 py-2 mt-2 text-2xl text-white bg-[#171717] rounded-r-xl">WXDC</h1>
                        </div>
                    </div>

                    <div className="flex flex-col bg-[#111111] p-4 rounded-lg mt-4 mr-8 text-white font-Main">
                        <h1>Input the address of the token for arbitrage.</h1>
                        <input onChange={(e) => setAddr(e.target.value)} placeholder="Replace 'xdc' with '0x'" className="bg-[#171717] mt-2 py-2 pr-2 outline-none focus:outline-none text-white w-full text-center text-xs rounded-xl font-light"/>
                    </div>

                    <div className="flex flex-col bg-[#111111] py-4 pl-4 pr-6 rounded-lg mt-4 text-white font-Main">
                        <div className="flex">
                            <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 16 16" height="1.5em" width="1.5em" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M11.5 8h-7a1 1 0 00-1 1v5a1 1 0 001 1h7a1 1 0 001-1V9a1 1 0 00-1-1zm-7-1a2 2 0 00-2 2v5a2 2 0 002 2h7a2 2 0 002-2V9a2 2 0 00-2-2h-7zm0-3a3.5 3.5 0 117 0v3h-1V4a2.5 2.5 0 00-5 0v3h-1V4z" clip-rule="evenodd"></path></svg>
                            <h1 className="ml-2 text-2xl">Total Value Locked</h1>
                        </div>
                        <h1 className="mt-2 ml-1 text-3xl font-bold">{tvl} WXDC</h1>
                    </div>

                    <div className="flex flex-col justify-center bg-[#111111] py-4 px-8 rounded-lg mt-4 ml-8 text-white font-Main">
                        <button onClick={execFlashLoan} className="bg-[#335693] py-4 px-8 rounded-lg">Submit Transaction</button>
                    </div>
                    
                </div>
            </div>
        </main>
    )
}

export default App;